package api

import (
	"net/http"
	"regexp"
	"time"

	"genie/internal/db"
	"genie/internal/middleware"
	"genie/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// FriendsHandler gère les routes API pour les amis
type FriendsHandler struct {
	db *db.Database
}

// NewFriendsHandler crée un nouveau gestionnaire pour les amis
func NewFriendsHandler(database *db.Database) *FriendsHandler {
	return &FriendsHandler{
		db: database,
	}
}

// RegisterRoutes enregistre les routes pour les amis
func (h *FriendsHandler) RegisterRoutes(apiRoutes *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	// Créer des sous-groupes à partir du groupe /api
	friends := apiRoutes.Group("/friends")
	friends.Use(authMiddleware)
	{
		friends.GET("", h.getFriends)
		friends.GET("/requests", h.getFriendRequests)
		friends.GET("/sent-requests", h.getSentFriendRequests) // Nouvelle route pour les demandes envoyées
		friends.POST("/request", h.sendFriendRequest)
		friends.POST("/cancel-request", h.cancelFriendRequest) // Route pour annuler une demande
		friends.POST("/accept", h.acceptFriendRequest)
		friends.POST("/reject", h.rejectFriendRequest)
	}

	// Routes pour les stories
	stories := apiRoutes.Group("/stories")
	stories.Use(authMiddleware)
	{
		stories.GET("/friends", h.getFriendStories)
		stories.POST("", h.createStory)
		stories.POST("/view", h.markStoryAsViewed)
	}

	// Routes pour la recherche d'utilisateurs
	users := apiRoutes.Group("/users")
	users.Use(authMiddleware)
	{
		users.GET("/search", h.searchUsers)
		users.POST("/find-contacts", h.findContactsOnApp)
		users.POST("/add-friends", h.addFriendsFromContacts)
	}
}

// Structure pour les réponses d'amis
type FriendResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
	HasStory bool   `json:"hasStory"`
	Birthday *struct {
		Day   int `json:"day"`
		Month int `json:"month"`
		Age   int `json:"age"`
	} `json:"birthday,omitempty"`
}

// Structure pour les réponses de demandes d'amis
type FriendRequestResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Username    string    `json:"username"`
	Avatar      string    `json:"avatar"`
	RequestDate time.Time `json:"requestDate"`
}

// Structure pour les médias de stories
type StoryMedia struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	URL       string    `json:"url"`
	Timestamp time.Time `json:"timestamp"`
}

// Structure pour les stories
type Story struct {
	ID        string       `json:"id"`
	Media     []StoryMedia `json:"media"`
	Timestamp time.Time    `json:"timestamp"`
	Viewed    bool         `json:"viewed"`
}

// Structure pour les amis avec stories
type FriendWithStories struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Username string   `json:"username"`
	Avatar   string   `json:"avatar"`
	HasStory bool     `json:"hasStory"`
	Stories  []Story  `json:"stories"`
	Birthday *struct {
		Day   int `json:"day"`
		Month int `json:"month"`
		Age   int `json:"age"`
	} `json:"birthday,omitempty"`
}

// Calculer l'âge à partir de la date de naissance
func calculateAge(birthDate time.Time) *struct {
	Day   int `json:"day"`
	Month int `json:"month"`
	Age   int `json:"age"`
} {
	if birthDate.IsZero() {
		return nil
	}

	age := time.Now().Year() - birthDate.Year()
	if time.Now().YearDay() < birthDate.YearDay() {
		age--
	}

	return &struct {
		Day   int `json:"day"`
		Month int `json:"month"`
		Age   int `json:"age"`
	}{
		Day:   birthDate.Day(),
		Month: int(birthDate.Month()),
		Age:   age,
	}
}

// Vérifier si l'utilisateur a des stories actives
func (h *FriendsHandler) hasActiveStories(ctx gin.Context, userId primitive.ObjectID) bool {
	storiesCollection := h.db.Client.Database("genie").Collection("stories")
	storyCount, err := storiesCollection.CountDocuments(ctx.Request.Context(), bson.M{
		"userId":    userId,
		"expiresAt": bson.M{"$gt": time.Now()},
	})
	return err == nil && storyCount > 0
}

// Convertir un utilisateur en réponse d'ami
func userToFriendResponse(user models.User, hasStory bool) FriendResponse {
	return FriendResponse{
		ID:       user.ID.Hex(),
		Name:     user.FirstName + " " + user.LastName,
		Username: user.Email,
		Avatar:   user.AvatarURL,
		HasStory: hasStory,
		Birthday: calculateAge(user.BirthDate),
	}
}

// getFriends récupère les amis de l'utilisateur
func (h *FriendsHandler) getFriends(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	// Récupérer les amis de l'utilisateur depuis la base de données
	collection := h.db.Client.Database("genie").Collection("friendships")
	ctx := c.Request.Context()

	// Requête pour trouver tous les amis de l'utilisateur
	filter := bson.M{
		"$or": []bson.M{
			{"userId": userObjID, "status": "accepted"},
			{"friendId": userObjID, "status": "accepted"},
		},
	}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors de la récupération des amis")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des amis"})
		return
	}
	defer cursor.Close(ctx)

	// Structure pour les amitiés en base de données
	type Friendship struct {
		ID        primitive.ObjectID `bson:"_id"`
		UserID    primitive.ObjectID `bson:"userId"`
		FriendID  primitive.ObjectID `bson:"friendId"`
		Status    string             `bson:"status"`
		CreatedAt time.Time          `bson:"createdAt"`
	}

	// Récupérer tous les IDs d'amis
	var friendships []Friendship
	if err := cursor.All(ctx, &friendships); err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors du décodage des amitiés")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des amitiés"})
		return
	}

	// Si aucun ami trouvé, retourner un tableau vide
	if len(friendships) == 0 {
		c.JSON(http.StatusOK, gin.H{"friends": []FriendResponse{}})
		return
	}

	// Extraire les IDs d'amis
	var friendIDs []primitive.ObjectID
	for _, friendship := range friendships {
		if friendship.UserID.Hex() == userID.(string) {
			friendIDs = append(friendIDs, friendship.FriendID)
		} else {
			friendIDs = append(friendIDs, friendship.UserID)
		}
	}

	// Récupérer les détails des amis
	usersCollection := h.db.Client.Database("genie").Collection("users")
	userFilter := bson.M{"_id": bson.M{"$in": friendIDs}}
	userCursor, err := usersCollection.Find(ctx, userFilter)
	if err != nil {
		log.Error().Err(err).Interface("friendIDs", friendIDs).Msg("Erreur lors de la récupération des détails des amis")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des détails des amis"})
		return
	}
	defer userCursor.Close(ctx)

	// Structure pour les utilisateurs en base de données
	var users []models.User
	if err := userCursor.All(ctx, &users); err != nil {
		log.Error().Err(err).Msg("Erreur lors du décodage des utilisateurs")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des utilisateurs"})
		return
	}

	// Convertir les utilisateurs en réponses d'amis
	var friends []FriendResponse
	for _, user := range users {
		hasStory := h.hasActiveStories(*c, user.ID)
		friends = append(friends, userToFriendResponse(user, hasStory))
	}

	// Retourner les amis
	c.JSON(http.StatusOK, gin.H{"friends": friends})
}

// getFriendRequests récupère les demandes d'amis reçues par l'utilisateur
func (h *FriendsHandler) getFriendRequests(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	// Récupérer les demandes d'amis depuis la base de données
	collection := h.db.Client.Database("genie").Collection("friendships")
	ctx := c.Request.Context()

	// Requête pour trouver les demandes d'amis en attente
	filter := bson.M{"friendId": userObjID, "status": "pending"}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors de la récupération des demandes d'amis")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des demandes d'amis"})
		return
	}
	defer cursor.Close(ctx)

	// Structure pour les demandes d'amis en base de données
	type FriendRequest struct {
		ID        primitive.ObjectID `bson:"_id"`
		UserID    primitive.ObjectID `bson:"userId"`  // Celui qui a envoyé la demande
		FriendID  primitive.ObjectID `bson:"friendId"` // Celui qui reçoit la demande
		Status    string             `bson:"status"`
		CreatedAt time.Time          `bson:"createdAt"`
	}

	// Récupérer toutes les demandes d'amis
	var friendRequests []FriendRequest
	if err := cursor.All(ctx, &friendRequests); err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors du décodage des demandes d'amis")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des demandes d'amis"})
		return
	}

	// Si aucune demande trouvée, retourner un tableau vide
	if len(friendRequests) == 0 {
		c.JSON(http.StatusOK, gin.H{"requests": []FriendRequestResponse{}})
		return
	}

	// Extraire les IDs des utilisateurs qui ont envoyé des demandes
	var requesterIDs []primitive.ObjectID
	for _, request := range friendRequests {
		requesterIDs = append(requesterIDs, request.UserID)
	}

	// Récupérer les détails des utilisateurs
	usersCollection := h.db.Client.Database("genie").Collection("users")
	userFilter := bson.M{"_id": bson.M{"$in": requesterIDs}}
	userCursor, err := usersCollection.Find(ctx, userFilter)
	if err != nil {
		log.Error().Err(err).Interface("requesterIDs", requesterIDs).Msg("Erreur lors de la récupération des détails des demandeurs")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des détails des demandeurs"})
		return
	}
	defer userCursor.Close(ctx)

	// Structure pour les utilisateurs en base de données
	var users []models.User
	if err := userCursor.All(ctx, &users); err != nil {
		log.Error().Err(err).Msg("Erreur lors du décodage des utilisateurs")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des utilisateurs"})
		return
	}

	// Créer une map pour accéder rapidement aux utilisateurs par ID
	userMap := make(map[string]models.User)
	for _, user := range users {
		userMap[user.ID.Hex()] = user
	}

	// Convertir les demandes en réponses
	var requests []FriendRequestResponse
	for _, request := range friendRequests {
		user, exists := userMap[request.UserID.Hex()]
		if !exists {
			continue
		}

		requests = append(requests, FriendRequestResponse{
			ID:          request.ID.Hex(),
			Name:        user.FirstName + " " + user.LastName,
			Username:    user.Email,
			Avatar:      user.AvatarURL,
			RequestDate: request.CreatedAt,
		})
	}

	// Retourner les demandes d'amis
	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

// getSentFriendRequests récupère les demandes d'amis envoyées par l'utilisateur
func (h *FriendsHandler) getSentFriendRequests(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	// Récupérer les demandes d'amis envoyées depuis la base de données
	collection := h.db.Client.Database("genie").Collection("friendships")
	ctx := c.Request.Context()

	// Requête pour trouver les demandes d'amis en attente envoyées par l'utilisateur
	filter := bson.M{"userId": userObjID, "status": "pending"}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors de la récupération des demandes d'amis envoyées")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des demandes d'amis envoyées"})
		return
	}
	defer cursor.Close(ctx)

	// Structure pour les demandes d'amis en base de données
	type FriendRequest struct {
		ID        primitive.ObjectID `bson:"_id"`
		UserID    primitive.ObjectID `bson:"userId"`  // Celui qui a envoyé la demande
		FriendID  primitive.ObjectID `bson:"friendId"` // Celui qui reçoit la demande
		Status    string             `bson:"status"`
		CreatedAt time.Time          `bson:"createdAt"`
	}

	// Récupérer toutes les demandes d'amis envoyées
	var sentRequests []FriendRequest
	if err := cursor.All(ctx, &sentRequests); err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors du décodage des demandes d'amis envoyées")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des demandes d'amis envoyées"})
		return
	}

	// Si aucune demande trouvée, retourner un tableau vide
	if len(sentRequests) == 0 {
		c.JSON(http.StatusOK, gin.H{"sentRequests": []string{}})
		return
	}

	// Extraire les IDs des utilisateurs à qui des demandes ont été envoyées
	var sentRequestsIDs []string
	for _, request := range sentRequests {
		sentRequestsIDs = append(sentRequestsIDs, request.FriendID.Hex())
	}

	// Retourner les IDs des demandes envoyées
	c.JSON(http.StatusOK, gin.H{"sentRequests": sentRequestsIDs})
}

// sendFriendRequest envoie une demande d'ami
func (h *FriendsHandler) sendFriendRequest(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		RecipientID string `json:"recipientId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID du destinataire manquant"})
		return
	}

	// Convertir l'ID du destinataire en ObjectID
	recipientObjID, err := primitive.ObjectIDFromHex(req.RecipientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID destinataire invalide"})
		return
	}

	// Vérifier que le destinataire existe
	usersCollection := h.db.Client.Database("genie").Collection("users")
	ctx := c.Request.Context()
	var recipient models.User
	err = usersCollection.FindOne(ctx, bson.M{"_id": recipientObjID}).Decode(&recipient)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Utilisateur destinataire introuvable"})
		} else {
			log.Error().Err(err).Str("recipientId", req.RecipientID).Msg("Erreur lors de la vérification du destinataire")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification du destinataire"})
		}
		return
	}

	// Vérifier si une demande existe déjà
	friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

	// Chercher une amitié existante (dans les deux sens)
	existingFilter := bson.M{
		"$or": []bson.M{
			{
				"userId":   userObjID,
				"friendId": recipientObjID,
			},
			{
				"userId":   recipientObjID,
				"friendId": userObjID,
			},
		},
	}

	var existingFriendship struct {
		ID     primitive.ObjectID `bson:"_id"`
		Status string             `bson:"status"`
	}

	err = friendshipsCollection.FindOne(ctx, existingFilter).Decode(&existingFriendship)
	if err == nil {
		// Une relation existe déjà
		if existingFriendship.Status == "accepted" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Vous êtes déjà ami avec cet utilisateur"})
		} else if existingFriendship.Status == "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Une demande d'ami est déjà en cours avec cet utilisateur"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Une relation existe déjà avec cet utilisateur"})
		}
		return
	} else if err != mongo.ErrNoDocuments {
		log.Error().Err(err).Str("userId", userID.(string)).Str("recipientId", req.RecipientID).Msg("Erreur lors de la vérification d'amitié existante")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification d'amitié existante"})
		return
	}

	// Créer une nouvelle demande d'ami
	now := time.Now()
	friendship := bson.M{
		"userId":    userObjID,
		"friendId":  recipientObjID,
		"status":    "pending",
		"createdAt": now,
		"updatedAt": now,
	}

	_, err = friendshipsCollection.InsertOne(ctx, friendship)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Str("recipientId", req.RecipientID).Msg("Erreur lors de la création de la demande d'ami")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création de la demande d'ami"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Demande d'ami envoyée avec succès"})
}

// cancelFriendRequest annule une demande d'ami envoyée
func (h *FriendsHandler) cancelFriendRequest(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		RecipientID string `json:"recipientId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID du destinataire manquant"})
		return
	}

	// Convertir l'ID du destinataire en ObjectID
	recipientObjID, err := primitive.ObjectIDFromHex(req.RecipientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID destinataire invalide"})
		return
	}

	// Chercher la demande d'ami en attente
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))
	friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
	ctx := c.Request.Context()

	filter := bson.M{
		"userId":   userObjID,
		"friendId": recipientObjID,
		"status":   "pending",
	}

	result, err := friendshipsCollection.DeleteOne(ctx, filter)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Str("recipientId", req.RecipientID).Msg("Erreur lors de l'annulation de la demande d'ami")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'annulation de la demande d'ami"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aucune demande d'ami à annuler pour cet utilisateur"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Demande d'ami annulée avec succès"})
}

// acceptFriendRequest accepte une demande d'ami
func (h *FriendsHandler) acceptFriendRequest(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		RequestID string `json:"requestId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de la demande manquant"})
		return
	}

	// Convertir l'ID de la demande en ObjectID
	requestObjID, err := primitive.ObjectIDFromHex(req.RequestID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de demande invalide"})
		return
	}

	// Vérifier que la demande existe et est adressée à l'utilisateur courant
	friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
	ctx := c.Request.Context()
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

	filter := bson.M{
		"_id":      requestObjID,
		"friendId": userObjID,
		"status":   "pending",
	}

	update := bson.M{
		"$set": bson.M{
			"status":    "accepted",
			"updatedAt": time.Now(),
		},
	}

	result, err := friendshipsCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Error().Err(err).Str("requestId", req.RequestID).Msg("Erreur lors de l'acceptation de la demande d'ami")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'acceptation de la demande d'ami"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Demande d'ami introuvable ou déjà traitée"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Demande d'ami acceptée avec succès"})
}

// rejectFriendRequest rejette une demande d'ami
func (h *FriendsHandler) rejectFriendRequest(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		RequestID string `json:"requestId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de la demande manquant"})
		return
	}

	// Convertir l'ID de la demande en ObjectID
	requestObjID, err := primitive.ObjectIDFromHex(req.RequestID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de demande invalide"})
		return
	}

	// Vérifier que la demande existe et est adressée à l'utilisateur courant
	friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
	ctx := c.Request.Context()
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

	filter := bson.M{
		"_id":      requestObjID,
		"friendId": userObjID,
		"status":   "pending",
	}

	// Supprimer la demande d'ami
	result, err := friendshipsCollection.DeleteOne(ctx, filter)
	if err != nil {
		log.Error().Err(err).Str("requestId", req.RequestID).Msg("Erreur lors du rejet de la demande d'ami")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du rejet de la demande d'ami"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Demande d'ami introuvable ou déjà traitée"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Demande d'ami refusée avec succès"})
}

// getFriendStories récupère les stories des amis
func (h *FriendsHandler) getFriendStories(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	ctx := c.Request.Context()

	// 1. Récupérer les amis de l'utilisateur
	friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
	friendFilter := bson.M{
		"$or": []bson.M{
			{"userId": userObjID, "status": "accepted"},
			{"friendId": userObjID, "status": "accepted"},
		},
	}

	friendshipCursor, err := friendshipsCollection.Find(ctx, friendFilter)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors de la récupération des amis pour les stories")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des amis"})
		return
	}
	defer friendshipCursor.Close(ctx)

	// Structure pour les amitiés
	type Friendship struct {
		UserID   primitive.ObjectID `bson:"userId"`
		FriendID primitive.ObjectID `bson:"friendId"`
	}

	var friendships []Friendship
	if err := friendshipCursor.All(ctx, &friendships); err != nil {
		log.Error().Err(err).Msg("Erreur lors du décodage des amitiés pour les stories")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des amitiés"})
		return
	}

	// Extraire les IDs d'amis
	var friendIDs []primitive.ObjectID
	for _, friendship := range friendships {
		if friendship.UserID.Hex() == userID.(string) {
			friendIDs = append(friendIDs, friendship.FriendID)
		} else {
			friendIDs = append(friendIDs, friendship.UserID)
		}
	}

	// Si aucun ami, retourner un tableau vide
	if len(friendIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"friends": []FriendWithStories{}})
		return
	}

	// 2. Récupérer les informations de base sur les amis
	usersCollection := h.db.Client.Database("genie").Collection("users")
	userFilter := bson.M{"_id": bson.M{"$in": friendIDs}}
	userCursor, err := usersCollection.Find(ctx, userFilter)
	if err != nil {
		log.Error().Err(err).Interface("friendIDs", friendIDs).Msg("Erreur lors de la récupération des détails des amis pour les stories")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des détails des amis"})
		return
	}
	defer userCursor.Close(ctx)

	var users []models.User
	if err := userCursor.All(ctx, &users); err != nil {
		log.Error().Err(err).Msg("Erreur lors du décodage des utilisateurs pour les stories")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des utilisateurs"})
		return
	}

	// 3. Récupérer les stories pour chaque ami
	storiesCollection := h.db.Client.Database("genie").Collection("stories")
	
	var friendsWithStories []FriendWithStories
	
	for _, user := range users {
		// Vérifier si l'utilisateur a des stories actives
		storiesFilter := bson.M{
			"userId": user.ID,
			"expiresAt": bson.M{"$gt": time.Now()},
		}
		
		storiesCursor, err := storiesCollection.Find(ctx, storiesFilter)
		
		// Si erreur ou pas de stories, passer à l'ami suivant
		if err != nil {
			log.Warn().Err(err).Str("friendId", user.ID.Hex()).Msg("Erreur lors de la récupération des stories de l'ami")
			continue
		}
		
		// Structure pour les stories en base de données
		type DBStory struct {
			ID        primitive.ObjectID `bson:"_id"`
			UserID    primitive.ObjectID `bson:"userId"`
			Media     []StoryMedia       `bson:"media"`
			Timestamp time.Time          `bson:"timestamp"`
			ExpiresAt time.Time          `bson:"expiresAt"`
		}
		
		var dbStories []DBStory
		if err := storiesCursor.All(ctx, &dbStories); err != nil {
			log.Warn().Err(err).Str("friendId", user.ID.Hex()).Msg("Erreur lors du décodage des stories de l'ami")
			storiesCursor.Close(ctx)
			continue
		}
		storiesCursor.Close(ctx)
		
		// Si aucune story, passer à l'ami suivant
		if len(dbStories) == 0 {
			continue
		}
		
		// Convertir les stories pour la réponse
		var stories []Story
		for _, dbStory := range dbStories {
			// Vérifier si la story a été vue par l'utilisateur courant
			viewsCollection := h.db.Client.Database("genie").Collection("storyViews")
			viewCount, err := viewsCollection.CountDocuments(ctx, bson.M{
				"storyId": dbStory.ID,
				"userId": userObjID,
			})
			
			viewed := false
			if err == nil && viewCount > 0 {
				viewed = true
			}
			
			stories = append(stories, Story{
				ID:        dbStory.ID.Hex(),
				Media:     dbStory.Media,
				Timestamp: dbStory.Timestamp,
				Viewed:    viewed,
			})
		}
		
		// Ajouter l'ami avec ses stories
		friendsWithStories = append(friendsWithStories, FriendWithStories{
			ID:       user.ID.Hex(),
			Name:     user.FirstName + " " + user.LastName,
			Username: user.Email,
			Avatar:   user.AvatarURL,
			HasStory: true,
			Stories:  stories,
			Birthday: calculateAge(user.BirthDate),
		})
	}

	// Retourner les stories
	c.JSON(http.StatusOK, gin.H{"friends": friendsWithStories})
}

// createStory crée une nouvelle story
func (h *FriendsHandler) createStory(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		MediaURL  string `json:"mediaUrl" binding:"required"`
		MediaType string `json:"mediaType" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données de story invalides"})
		return
	}

	// Vérifier le type de média
	if req.MediaType != "image" && req.MediaType != "video" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type de média invalide. Seuls 'image' et 'video' sont autorisés."})
		return
	}

	// Convertir l'ID utilisateur en ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	// Créer la structure de la story
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour) // Les stories expirent après 24h

	mediaID := primitive.NewObjectID()
	storyID := primitive.NewObjectID()
	
	media := StoryMedia{
		ID:        mediaID.Hex(),
		Type:      req.MediaType,
		URL:       req.MediaURL,
		Timestamp: now,
	}

	// Insérer la story dans la base de données
	storiesCollection := h.db.Client.Database("genie").Collection("stories")
	ctx := c.Request.Context()

	// Structure de la story pour la base de données
	storyDoc := bson.M{
		"_id":       storyID,
		"userId":    userObjID,
		"media":     []StoryMedia{media},
		"timestamp": now,
		"expiresAt": expiresAt,
	}

	_, err = storiesCollection.InsertOne(ctx, storyDoc)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors de la création de la story")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création de la story"})
		return
	}

	// Retourner la story créée
	story := Story{
		ID:        storyID.Hex(),
		Timestamp: now,
		Viewed:    false,
		Media:     []StoryMedia{media},
	}

	log.Info().Str("userId", userID.(string)).Str("storyId", storyID.Hex()).Msg("Nouvelle story créée")
	c.JSON(http.StatusCreated, gin.H{"story": story})
}

// markStoryAsViewed marque une story comme vue
func (h *FriendsHandler) markStoryAsViewed(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		StoryID string `json:"storyId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de story manquant"})
		return
	}

	// Convertir les IDs en ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	storyObjID, err := primitive.ObjectIDFromHex(req.StoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de story invalide"})
		return
	}

	// Vérifier si la story existe
	ctx := c.Request.Context()
	storiesCollection := h.db.Client.Database("genie").Collection("stories")
	
	var story struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	
	err = storiesCollection.FindOne(ctx, bson.M{"_id": storyObjID}).Decode(&story)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Story introuvable"})
		} else {
			log.Error().Err(err).Str("storyId", req.StoryID).Msg("Erreur lors de la vérification de la story")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification de la story"})
		}
		return
	}

	// Vérifier si l'utilisateur a déjà vu cette story
	viewsCollection := h.db.Client.Database("genie").Collection("storyViews")
	
	count, err := viewsCollection.CountDocuments(ctx, bson.M{
		"storyId": storyObjID,
		"userId": userObjID,
	})
	
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Str("storyId", req.StoryID).Msg("Erreur lors de la vérification des vues")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification des vues"})
		return
	}
	
	// Si l'utilisateur a déjà vu cette story, ne rien faire
	if count > 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Story déjà vue"})
		return
	}
	
	// Ajouter une entrée dans la collection des vues
	now := time.Now()
	viewDoc := bson.M{
		"_id":       primitive.NewObjectID(),
		"storyId":   storyObjID,
		"userId":    userObjID,
		"timestamp": now,
	}
	
	_, err = viewsCollection.InsertOne(ctx, viewDoc)
	if err != nil {
		log.Error().Err(err).Str("userId", userID.(string)).Str("storyId", req.StoryID).Msg("Erreur lors du marquage de la story comme vue")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du marquage de la story comme vue"})
		return
	}

	log.Info().Str("userId", userID.(string)).Str("storyId", req.StoryID).Msg("Story marquée comme vue")
	c.JSON(http.StatusOK, gin.H{"message": "Story marquée comme vue"})
}

// searchUsers recherche des utilisateurs
func (h *FriendsHandler) searchUsers(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Requête de recherche manquante"})
		return
	}
	
	// Paramètres de contrôle
	includeAll := c.Query("includeAll") == "true"
	includeFriends := includeAll || c.Query("includeFriends") == "true"
	includePending := includeAll || c.Query("includePending") == "true"

	log.Debug().Str("query", query).Bool("includeAll", includeAll).Bool("includeFriends", includeFriends).Bool("includePending", includePending).Str("userId", userID.(string)).Msg("Recherche d'utilisateurs")

	// Récupérer des utilisateurs en fonction de la requête depuis la base de données
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))
	ctx := c.Request.Context()
	usersCollection := h.db.Client.Database("genie").Collection("users")

	// Créer une expression régulière pour la recherche insensible à la casse
	regexQuery := primitive.Regex{Pattern: query, Options: "i"}

	// Construire le filtre pour la recherche par prénom, nom ou email
	filter := bson.M{
		"$or": []bson.M{
			{"firstName": bson.M{"$regex": regexQuery}},
			{"lastName": bson.M{"$regex": regexQuery}},
			{"email": bson.M{"$regex": regexQuery}},
		},
		// Exclure l'utilisateur courant
		"_id": bson.M{"$ne": userObjID},
	}

	log.Debug().Interface("filter", filter).Msg("Filtre de recherche utilisateurs")

	// IMPORTANT: Si on ne veut pas exclure les amis ou les demandes en attente, 
	// on saute cette étape
	if (!includeAll && !includeFriends) || (!includeAll && !includePending) {
		// Récupérer les amitiés existantes pour les exclure des résultats si nécessaire
		friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
		
		// Trouver tous les IDs d'utilisateurs avec qui l'utilisateur courant a une relation
		friendshipFilter := bson.M{
			"$or": []bson.M{
				{"userId": userObjID},
				{"friendId": userObjID},
			},
		}

		friendshipCursor, err := friendshipsCollection.Find(ctx, friendshipFilter)
		if err != nil && err != mongo.ErrNoDocuments {
			log.Error().Err(err).Str("userId", userID.(string)).Msg("Erreur lors de la récupération des amitiés")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la recherche d'utilisateurs"})
			return
		}

		// IDs à exclure (amitiés existantes ou demandes)
		var friendIds []primitive.ObjectID
		var pendingIds []primitive.ObjectID
		
		if err != mongo.ErrNoDocuments && friendshipCursor != nil {
			defer friendshipCursor.Close(ctx)

			type Friendship struct {
				UserID   primitive.ObjectID `bson:"userId"`
				FriendID primitive.ObjectID `bson:"friendId"`
				Status   string             `bson:"status"`
			}

			var friendships []Friendship
			if err := friendshipCursor.All(ctx, &friendships); err != nil {
				log.Error().Err(err).Msg("Erreur lors du décodage des amitiés")
			} else {
				for _, f := range friendships {
					// Si c'est un ami accepté
					if f.Status == "accepted" {
						if f.UserID.Hex() == userID.(string) {
							friendIds = append(friendIds, f.FriendID)
						} else {
							friendIds = append(friendIds, f.UserID)
						}
					} else if f.Status == "pending" {
						// Si c'est une demande en attente envoyée par l'utilisateur
						if f.UserID.Hex() == userID.(string) {
							pendingIds = append(pendingIds, f.FriendID)
						}
						// On ne considère pas les demandes reçues comme "pending"
					}
				}
				log.Debug().Int("friendIds", len(friendIds)).Int("pendingIds", len(pendingIds)).Msg("Nombre d'utilisateurs exclus de la recherche")
			}
		}

		// Construire le filtre d'exclusion si nécessaire
		var excludeIds []primitive.ObjectID
		
		if !includeFriends {
			// Exclure les amis si demandé
			excludeIds = append(excludeIds, friendIds...)
		}
		
		if !includePending {
			// Exclure les demandes en attente si demandé
			excludeIds = append(excludeIds, pendingIds...)
		}
		
		// Appliquer le filtre d'exclusion s'il y a des IDs à exclure
		if len(excludeIds) > 0 {
			filter["_id"] = bson.M{"$ne": userObjID, "$nin": excludeIds}
		}
	} else {
		// Aucune exclusion - afficher tous les types d'utilisateurs
		log.Info().Msg("AUCUN UTILISATEUR EXCLU DANS LA RECHERCHE - TOUS LES TYPES D'UTILISATEURS INCLUS")
	}
	
	// Limiter les résultats
	options := options.Find().SetLimit(20)

	// Récupérer les utilisateurs correspondant à la recherche
	cursor, err := usersCollection.Find(ctx, filter, options)
	if err != nil {
		log.Error().Err(err).Str("query", query).Msg("Erreur lors de la recherche d'utilisateurs")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la recherche d'utilisateurs"})
		return
	}
	defer cursor.Close(ctx)

	// Récupérer tous les utilisateurs correspondants
	var dbUsers []models.User
	if err := cursor.All(ctx, &dbUsers); err != nil {
		log.Error().Err(err).Msg("Erreur lors du décodage des résultats de recherche")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des résultats de recherche"})
		return
	}

	log.Debug().Int("resultsCount", len(dbUsers)).Str("query", query).Msg("Nombre d'utilisateurs trouvés")

	// Si aucun utilisateur trouvé, retourner un tableau vide
	if len(dbUsers) == 0 {
		c.JSON(http.StatusOK, gin.H{"users": []FriendResponse{}})
		return
	}

	// Convertir les utilisateurs en réponses
	var users []FriendResponse
	for _, user := range dbUsers {
		hasStory := h.hasActiveStories(*c, user.ID)
		users = append(users, userToFriendResponse(user, hasStory))
	}

	// Retourner les utilisateurs trouvés
	c.JSON(http.StatusOK, gin.H{"users": users})
}

// findContactsOnApp trouve des contacts sur l'application
func (h *FriendsHandler) findContactsOnApp(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		PhoneNumbers []string `json:"phoneNumbers" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Liste de numéros de téléphone manquante"})
		return
	}

	// Si aucun numéro fourni, retourner un tableau vide
	if len(req.PhoneNumbers) == 0 {
		c.JSON(http.StatusOK, gin.H{"contacts": []FriendResponse{}})
		return
	}

	// Normaliser les numéros de téléphone
	var normalizedPhones []string
	for _, phone := range req.PhoneNumbers {
		// Supprimer tous les caractères non numériques sauf "+"
		phoneRegex := regexp.MustCompile(`[^0-9+]`)
		normalized := phoneRegex.ReplaceAllString(phone, "")
		
		// Si le numéro commence par "0", on ajoute l'indicatif du pays (France par défaut)
		if len(normalized) > 0 && normalized[0] == '0' {
			normalized = "+33" + normalized[1:]
		}
		
		// Si le numéro ne commence pas par "+", on ajoute "+"
		if len(normalized) > 0 && normalized[0] != '+' {
			normalized = "+" + normalized
		}
		
		if normalized != "" {
			normalizedPhones = append(normalizedPhones, normalized)
		}
	}

	// Convertir l'ID utilisateur en ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	// Récupérer les utilisateurs correspondant aux numéros de téléphone
	usersCollection := h.db.Client.Database("genie").Collection("users")
	ctx := c.Request.Context()

	filter := bson.M{
		"phone": bson.M{"$in": normalizedPhones},
		"_id":   bson.M{"$ne": userObjID}, // Exclure l'utilisateur actuel
	}

	cursor, err := usersCollection.Find(ctx, filter)
	if err != nil {
		log.Error().Err(err).Interface("phoneNumbers", normalizedPhones).Msg("Erreur lors de la recherche des contacts")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la recherche des contacts"})
		return
	}
	defer cursor.Close(ctx)

	// Récupérer tous les utilisateurs correspondants
	var dbUsers []models.User
	if err := cursor.All(ctx, &dbUsers); err != nil {
		log.Error().Err(err).Msg("Erreur lors du décodage des contacts")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des contacts"})
		return
	}

	// Si aucun contact trouvé, retourner un tableau vide
	if len(dbUsers) == 0 {
		c.JSON(http.StatusOK, gin.H{"contacts": []FriendResponse{}})
		return
	}

	// Récupérer les relations existantes avec les contacts trouvés
	var contactIDs []primitive.ObjectID
	for _, user := range dbUsers {
		contactIDs = append(contactIDs, user.ID)
	}

	// Vérifier les relations existantes (amitiés/demandes)
	friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
	relationFilter := bson.M{
		"$or": []bson.M{
			{
				"userId":  userObjID,
				"friendId": bson.M{"$in": contactIDs},
			},
			{
				"userId":  bson.M{"$in": contactIDs},
				"friendId": userObjID,
			},
		},
	}

	relationCursor, err := friendshipsCollection.Find(ctx, relationFilter)
	if err != nil && err != mongo.ErrNoDocuments {
		log.Error().Err(err).Msg("Erreur lors de la vérification des relations")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification des relations"})
		return
	}

	// Map pour stocker les IDs des contacts avec lesquels il existe déjà une relation
	relatedUserIDs := make(map[string]bool)
	
	if err != mongo.ErrNoDocuments && relationCursor != nil {
		defer relationCursor.Close(ctx)
		
		type Friendship struct {
			UserID   primitive.ObjectID `bson:"userId"`
			FriendID primitive.ObjectID `bson:"friendId"`
		}
		
		var relationships []Friendship
		if err := relationCursor.All(ctx, &relationships); err == nil {
			for _, rel := range relationships {
				if rel.UserID == userObjID {
					relatedUserIDs[rel.FriendID.Hex()] = true
				} else {
					relatedUserIDs[rel.UserID.Hex()] = true
				}
			}
		}
	}

	// Convertir les utilisateurs en réponses de contacts
	var contacts []FriendResponse
	for _, user := range dbUsers {
		// Ne pas inclure les contacts avec lesquels une relation existe déjà
		if _, exists := relatedUserIDs[user.ID.Hex()]; exists {
			continue
		}
		
		hasStory := h.hasActiveStories(*c, user.ID)
		contacts = append(contacts, userToFriendResponse(user, hasStory))
	}

	// Retourner les contacts trouvés
	c.JSON(http.StatusOK, gin.H{"contacts": contacts})
}

// addFriendsFromContacts ajoute des amis à partir des contacts
func (h *FriendsHandler) addFriendsFromContacts(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req struct {
		UserIDs []string `json:"userIds" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Liste d'identifiants d'utilisateurs manquante"})
		return
	}

	// Si aucun ID fourni, retourner OK sans rien faire
	if len(req.UserIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Aucun utilisateur à ajouter"})
		return
	}

	// Convertir l'ID utilisateur en ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	// Convertir les IDs des amis en ObjectID
	var friendObjIDs []primitive.ObjectID
	for _, id := range req.UserIDs {
		friendID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			log.Warn().Str("userId", id).Msg("ID utilisateur invalide, ignoré")
			continue
		}
		friendObjIDs = append(friendObjIDs, friendID)
	}

	// Si aucun ID valide, retourner OK sans rien faire
	if len(friendObjIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Aucun utilisateur valide à ajouter"})
		return
	}

	// Vérifier que les utilisateurs existent
	usersCollection := h.db.Client.Database("genie").Collection("users")
	ctx := c.Request.Context()

	filter := bson.M{
		"_id": bson.M{"$in": friendObjIDs},
	}

	cursor, err := usersCollection.Find(ctx, filter)
	if err != nil {
		log.Error().Err(err).Interface("userIDs", req.UserIDs).Msg("Erreur lors de la vérification des utilisateurs")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification des utilisateurs"})
		return
	}
	defer cursor.Close(ctx)

	// Récupérer tous les utilisateurs valides
	var dbUsers []struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	if err := cursor.All(ctx, &dbUsers); err != nil {
		log.Error().Err(err).Msg("Erreur lors du décodage des utilisateurs")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du décodage des utilisateurs"})
		return
	}

	// Si aucun utilisateur trouvé, retourner OK sans rien faire
	if len(dbUsers) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Aucun utilisateur valide trouvé"})
		return
	}

	// Créer une map des utilisateurs valides pour accès rapide
	validUserIDs := make(map[string]bool)
	for _, user := range dbUsers {
		validUserIDs[user.ID.Hex()] = true
	}

	// Vérifier les relations existantes pour éviter les doublons
	friendshipsCollection := h.db.Client.Database("genie").Collection("friendships")
	
	relationFilter := bson.M{
		"$or": []bson.M{
			{
				"userId":  userObjID,
				"friendId": bson.M{"$in": friendObjIDs},
			},
			{
				"userId":  bson.M{"$in": friendObjIDs},
				"friendId": userObjID,
			},
		},
	}

	relationCursor, err := friendshipsCollection.Find(ctx, relationFilter)
	if err != nil && err != mongo.ErrNoDocuments {
		log.Error().Err(err).Msg("Erreur lors de la vérification des relations existantes")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification des relations existantes"})
		return
	}

	// Map pour stocker les IDs des utilisateurs avec lesquels il existe déjà une relation
	existingRelations := make(map[string]bool)
	
	if err != mongo.ErrNoDocuments && relationCursor != nil {
		defer relationCursor.Close(ctx)
		
		type Friendship struct {
			UserID   primitive.ObjectID `bson:"userId"`
			FriendID primitive.ObjectID `bson:"friendId"`
		}
		
		var relationships []Friendship
		if err := relationCursor.All(ctx, &relationships); err == nil {
			for _, rel := range relationships {
				if rel.UserID == userObjID {
					existingRelations[rel.FriendID.Hex()] = true
				} else {
					existingRelations[rel.UserID.Hex()] = true
				}
			}
		}
	}

	// Ajouter les nouvelles demandes d'ami
	var addedCount int
	now := time.Now()
	
	for _, id := range req.UserIDs {
		// Vérifier si l'ID est valide et n'a pas déjà une relation
		if !validUserIDs[id] || existingRelations[id] {
			continue
		}
		
		friendID, _ := primitive.ObjectIDFromHex(id)
		
		// Créer la demande d'ami
		friendship := bson.M{
			"userId":    userObjID,
			"friendId":  friendID,
			"status":    "pending",
			"createdAt": now,
			"updatedAt": now,
		}
		
		_, err := friendshipsCollection.InsertOne(ctx, friendship)
		if err != nil {
			log.Error().Err(err).Str("userId", userID.(string)).Str("friendId", id).Msg("Erreur lors de l'ajout de la demande d'ami")
			continue
		}
		
		addedCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Demandes d'ami ajoutées avec succès",
		"added": addedCount,
		"total": len(req.UserIDs),
	})
}