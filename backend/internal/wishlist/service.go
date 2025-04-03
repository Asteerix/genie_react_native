package wishlist

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"genie/internal/config"
	"genie/internal/db"
	"genie/internal/models"
)

// Constants for permission types
const (
	ShareStatusAccepted = "accepted"
	ShareStatusPending  = "pending"
	PermissionRead      = "read"
	PermissionWrite     = "write"
	PermissionAdmin     = "admin"
)

// Service gère les opérations liées aux wishlists
type Service struct {
	db          *db.Database
	wishlistCol *mongo.Collection
	wishItemCol *mongo.Collection
	userCol     *mongo.Collection
	config      *config.Config
}

// NewService crée une nouvelle instance du service wishlist
func NewService(mongodb *db.Database, cfg *config.Config) *Service {
	return &Service{
		db:          mongodb,
		config:      cfg,
		wishlistCol: mongodb.DB.Collection("wishlists"),
		wishItemCol: mongodb.DB.Collection("wishItems"),
		userCol:     mongodb.Users,
	}
}

// getWishlistByID récupère une wishlist par son ID
func (s *Service) getWishlistByID(ctx context.Context, wishlistID primitive.ObjectID) (*models.Wishlist, error) {
	var wishlist models.Wishlist
	filter := bson.M{"_id": wishlistID}

	err := s.wishlistCol.FindOne(ctx, filter).Decode(&wishlist)
	if err != nil {
		return nil, err
	}

	return &wishlist, nil
}

// getWishItemByID récupère un item de wishlist par son ID
func (s *Service) getWishItemByID(ctx context.Context, itemID primitive.ObjectID) (*models.WishItem, error) {
	var item models.WishItem
	filter := bson.M{"_id": itemID}

	err := s.wishItemCol.FindOne(ctx, filter).Decode(&item)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

// hasEditPermission vérifie si un utilisateur a la permission d'éditer une wishlist
func (s *Service) hasEditPermission(wishlist *models.Wishlist, userID primitive.ObjectID) bool {
	// Si l'utilisateur est le propriétaire, il a les droits d'édition
	if wishlist.UserID == userID {
		return true
	}

	// Vérifier les permissions partagées
	for _, share := range wishlist.SharedWith {
		if share.UserID == userID && share.Status == ShareStatusAccepted && share.Permission == PermissionWrite {
			return true
		}
	}

	return false
}

// CreateWishlist crée une nouvelle wishlist
func (s *Service) CreateWishlist(ctx context.Context, userID primitive.ObjectID, req models.CreateWishlistRequest) (*models.WishlistResponse, error) {
	wishlist := models.Wishlist{
		ID:          primitive.NewObjectID(),
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		CoverImage:  req.CoverImage,
		IsPublic:    req.IsPublic,
		IsFavorite:  req.IsFavorite,
		Items:       []primitive.ObjectID{},
		SharedWith:  []models.SharedWith{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := s.wishlistCol.InsertOne(ctx, wishlist)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la création de la wishlist")
		return nil, err
	}

	response := &models.WishlistResponse{
		ID:          wishlist.ID.Hex(),
		UserID:      wishlist.UserID.Hex(),
		Title:       wishlist.Title,
		Description: wishlist.Description,
		CoverImage:  wishlist.CoverImage,
		IsPublic:    wishlist.IsPublic,
		IsFavorite:  wishlist.IsFavorite,
		IsOwner:     true,
		Items:       []models.WishItemResponse{},
		CreatedAt:   wishlist.CreatedAt,
		UpdatedAt:   wishlist.UpdatedAt,
	}

	return response, nil
}

// GetWishlist récupère une wishlist par son ID
func (s *Service) GetWishlist(ctx context.Context, wishlistID string, requestingUserID primitive.ObjectID) (*models.WishlistResponse, error) {
	id, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return nil, err
	}

	var wishlist models.Wishlist
	err = s.wishlistCol.FindOne(ctx, bson.M{"_id": id}).Decode(&wishlist)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("wishlist not found")
		}
		return nil, err
	}

	// Vérifier les autorisations d'accès
	isOwner := wishlist.UserID == requestingUserID
	hasAccess := isOwner

	if !hasAccess && wishlist.IsPublic {
		hasAccess = true
	}

	if !hasAccess {
		for _, sharedWith := range wishlist.SharedWith {
			if sharedWith.UserID == requestingUserID && sharedWith.Status == "accepted" {
				hasAccess = true
				break
			}
		}
	}

	if !hasAccess {
		return nil, errors.New("access denied")
	}

	// Build response...
	response := &models.WishlistResponse{
		ID:          wishlist.ID.Hex(),
		UserID:      wishlist.UserID.Hex(),
		Title:       wishlist.Title,
		Description: wishlist.Description,
		CoverImage:  wishlist.CoverImage,
		IsPublic:    wishlist.IsPublic,
		IsFavorite:  wishlist.IsFavorite,
		IsOwner:     isOwner,
		CreatedAt:   wishlist.CreatedAt,
		UpdatedAt:   wishlist.UpdatedAt,
	}

	return response, nil
}

// GetUserWishlists récupère toutes les wishlists d'un utilisateur
func (s *Service) GetUserWishlists(ctx context.Context, userID primitive.ObjectID) ([]*models.WishlistResponse, error) {
	// Récupérer les wishlists que l'utilisateur possède
	cursor, err := s.wishlistCol.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var wishlists []models.Wishlist
	if err = cursor.All(ctx, &wishlists); err != nil {
		return nil, err
	}

	// Convertir en réponses
	responses := []*models.WishlistResponse{}
	for _, wishlist := range wishlists {
		response := &models.WishlistResponse{
			ID:          wishlist.ID.Hex(),
			UserID:      wishlist.UserID.Hex(),
			Title:       wishlist.Title,
			Description: wishlist.Description,
			CoverImage:  wishlist.CoverImage,
			IsPublic:    wishlist.IsPublic,
			IsFavorite:  wishlist.IsFavorite,
			IsOwner:     true,
			CreatedAt:   wishlist.CreatedAt,
			UpdatedAt:   wishlist.UpdatedAt,
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// UpdateWishlist met à jour une wishlist
func (s *Service) UpdateWishlist(ctx context.Context, wishlistID string, userID primitive.ObjectID, req models.UpdateWishlistRequest) (*models.WishlistResponse, error) {
	id, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return nil, err
	}

	// Vérifier si l'utilisateur est le propriétaire ou a les droits d'édition
	wishlist, err := s.getWishlistByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if !s.hasEditPermission(wishlist, userID) {
		return nil, errors.New("access denied")
	}

	// Préparer les champs à mettre à jour
	update := bson.M{
		"updatedAt": time.Now(),
	}

	if req.Title != "" {
		update["title"] = req.Title
	}
	if req.Description != "" {
		update["description"] = req.Description
	}
	if req.CoverImage != "" {
		update["coverImage"] = req.CoverImage
	}
	if req.IsPublic != nil {
		update["isPublic"] = *req.IsPublic
	}
	if req.IsFavorite != nil {
		update["isFavorite"] = *req.IsFavorite
	}

	_, err = s.wishlistCol.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": update},
	)
	if err != nil {
		return nil, err
	}

	// Récupérer la wishlist mise à jour
	return s.GetWishlist(ctx, wishlistID, userID)
}

// DeleteWishlist supprime une wishlist
func (s *Service) DeleteWishlist(ctx context.Context, wishlistID string, userID primitive.ObjectID) error {
	id, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return err
	}

	// Vérifier si l'utilisateur est le propriétaire
	wishlist, err := s.getWishlistByID(ctx, id)
	if err != nil {
		return err
	}

	if wishlist.UserID != userID {
		return errors.New("access denied")
	}

	// Supprimer tous les items associés
	_, err = s.wishItemCol.DeleteMany(ctx, bson.M{"wishlistId": id})
	if err != nil {
		return err
	}

	// Supprimer la wishlist
	_, err = s.wishlistCol.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// ShareWishlist partage une wishlist avec un autre utilisateur
func (s *Service) ShareWishlist(ctx context.Context, wishlistID string, userID primitive.ObjectID, req models.ShareWishlistRequest) error {
	id, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return err
	}

	targetUserID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		return err
	}

	// Vérifier si l'utilisateur est le propriétaire
	wishlist, err := s.getWishlistByID(ctx, id)
	if err != nil {
		return err
	}

	if wishlist.UserID != userID {
		return errors.New("access denied")
	}

	sharedWith := models.SharedWith{
		UserID:     targetUserID,
		Permission: req.Permission,
		Status:     ShareStatusPending,
		SharedAt:   time.Now(),
	}

	// Mettre à jour la wishlist
	_, err = s.wishlistCol.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$push": bson.M{"sharedWith": sharedWith},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	return err
}

// GetWishlistInvitations récupère les invitations à des wishlists pour un utilisateur
func (s *Service) GetWishlistInvitations(ctx context.Context, userID primitive.ObjectID) ([]*models.WishlistResponse, error) {
	cursor, err := s.wishlistCol.Find(ctx, bson.M{
		"sharedWith": bson.M{
			"$elemMatch": bson.M{
				"userId": userID,
				"status": ShareStatusPending,
			},
		},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var wishlists []models.Wishlist
	if err = cursor.All(ctx, &wishlists); err != nil {
		return nil, err
	}

	responses := []*models.WishlistResponse{}
	for _, wishlist := range wishlists {
		response := &models.WishlistResponse{
			ID:          wishlist.ID.Hex(),
			UserID:      wishlist.UserID.Hex(),
			Title:       wishlist.Title,
			Description: wishlist.Description,
			CoverImage:  wishlist.CoverImage,
			IsPublic:    wishlist.IsPublic,
			IsOwner:     false,
			CreatedAt:   wishlist.CreatedAt,
			UpdatedAt:   wishlist.UpdatedAt,
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// RespondToInvitation répond à une invitation de wishlist
func (s *Service) RespondToInvitation(ctx context.Context, wishlistID string, userID primitive.ObjectID, accept bool) error {
	id, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return err
	}

	status := ShareStatusAccepted
	if !accept {
		// Si refusé, on supprime l'invitation
		_, err = s.wishlistCol.UpdateOne(
			ctx,
			bson.M{"_id": id},
			bson.M{
				"$pull": bson.M{
					"sharedWith": bson.M{
						"userId": userID,
						"status": ShareStatusPending,
					},
				},
				"$set": bson.M{"updatedAt": time.Now()},
			},
		)
		return err
	}

	// Si accepté, on met à jour le statut
	_, err = s.wishlistCol.UpdateOne(
		ctx,
		bson.M{
			"_id": id,
			"sharedWith": bson.M{
				"$elemMatch": bson.M{
					"userId": userID,
					"status": ShareStatusPending,
				},
			},
		},
		bson.M{
			"$set": bson.M{
				"sharedWith.$.status": status,
				"updatedAt":           time.Now(),
			},
		},
	)
	return err
}

// RemoveSharing supprime le partage d'une wishlist avec un utilisateur
func (s *Service) RemoveSharing(ctx context.Context, wishlistID string, ownerID primitive.ObjectID, targetUserID string) error {
	id, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return err
	}

	targetID, err := primitive.ObjectIDFromHex(targetUserID)
	if err != nil {
		return err
	}

	// Vérifier si l'utilisateur est le propriétaire
	wishlist, err := s.getWishlistByID(ctx, id)
	if err != nil {
		return err
	}

	if wishlist.UserID != ownerID {
		return errors.New("access denied")
	}

	// Supprimer le partage
	_, err = s.wishlistCol.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$pull": bson.M{
				"sharedWith": bson.M{
					"userId": targetID,
				},
			},
			"$set": bson.M{"updatedAt": time.Now()},
		},
	)
	return err
}

// CreateWishItem crée un nouvel item dans une wishlist
func (s *Service) CreateWishItem(ctx context.Context, userID primitive.ObjectID, req models.CreateWishItemRequest) (*models.WishItemResponse, error) {
	wishlistID, err := primitive.ObjectIDFromHex(req.WishlistID)
	if err != nil {
		return nil, err
	}

	// Vérifier l'accès à la wishlist
	wishlist, err := s.getWishlistByID(ctx, wishlistID)
	if err != nil {
		return nil, err
	}

	if !s.hasEditPermission(wishlist, userID) {
		return nil, errors.New("access denied")
	}

	// Créer le nouvel item
	item := models.WishItem{
		ID:          primitive.NewObjectID(),
		WishlistID:  wishlistID,
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Currency:    req.Currency,
		ImageURL:    req.ImageURL,
		Link:        req.Link,
		IsFavorite:  req.IsFavorite,
		IsReserved:  false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err = s.wishItemCol.InsertOne(ctx, item)
	if err != nil {
		return nil, err
	}

	// Ajouter l'item à la wishlist
	_, err = s.wishlistCol.UpdateOne(
		ctx,
		bson.M{"_id": wishlistID},
		bson.M{
			"$push": bson.M{"items": item.ID},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return nil, err
	}

	// Créer la réponse
	response := &models.WishItemResponse{
		ID:          item.ID.Hex(),
		WishlistID:  item.WishlistID.Hex(),
		UserID:      item.UserID.Hex(),
		Name:        item.Name,
		Description: item.Description,
		Price:       item.Price,
		Currency:    item.Currency,
		ImageURL:    item.ImageURL,
		Link:        item.Link,
		IsFavorite:  item.IsFavorite,
		IsReserved:  item.IsReserved,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}

	return response, nil
}

// GetWishItem récupère un item de wishlist par son ID
func (s *Service) GetWishItem(ctx context.Context, itemID string, userID primitive.ObjectID) (*models.WishItemResponse, error) {
	id, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return nil, err
	}

	// Récupérer l'item
	item, err := s.getWishItemByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Vérifier l'accès à la wishlist associée
	wishlist, err := s.getWishlistByID(ctx, item.WishlistID)
	if err != nil {
		return nil, err
	}

	isOwner := wishlist.UserID == userID
	hasAccess := isOwner || wishlist.IsPublic

	if !hasAccess {
		for _, share := range wishlist.SharedWith {
			if share.UserID == userID && share.Status == ShareStatusAccepted {
				hasAccess = true
				break
			}
		}
	}

	if !hasAccess {
		return nil, errors.New("access denied")
	}

	// Créer la réponse
	response := &models.WishItemResponse{
		ID:          item.ID.Hex(),
		WishlistID:  item.WishlistID.Hex(),
		UserID:      item.UserID.Hex(),
		Name:        item.Name,
		Description: item.Description,
		Price:       item.Price,
		Currency:    item.Currency,
		ImageURL:    item.ImageURL,
		Link:        item.Link,
		IsFavorite:  item.IsFavorite,
		IsReserved:  item.IsReserved,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}

	if item.IsReserved && !item.ReservedBy.IsZero() {
		response.ReservedBy = item.ReservedBy.Hex()
	}

	return response, nil
}

// UpdateWishItem met à jour un item de wishlist
func (s *Service) UpdateWishItem(ctx context.Context, itemID string, userID primitive.ObjectID, req models.UpdateWishItemRequest) (*models.WishItemResponse, error) {
	id, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return nil, err
	}

	// Récupérer l'item
	item, err := s.getWishItemByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Vérifier l'accès à la wishlist associée
	wishlist, err := s.getWishlistByID(ctx, item.WishlistID)
	if err != nil {
		return nil, err
	}

	if !s.hasEditPermission(wishlist, userID) {
		return nil, errors.New("access denied")
	}

	// Préparer les champs à mettre à jour
	update := bson.M{
		"updatedAt": time.Now(),
	}

	if req.Name != "" {
		update["name"] = req.Name
	}
	if req.Description != "" {
		update["description"] = req.Description
	}
	if req.Price != 0 {
		update["price"] = req.Price
	}
	if req.Currency != "" {
		update["currency"] = req.Currency
	}
	if req.ImageURL != "" {
		update["imageUrl"] = req.ImageURL
	}
	if req.Link != "" {
		update["link"] = req.Link
	}
	if req.IsFavorite != nil {
		update["isFavorite"] = *req.IsFavorite
	}

	_, err = s.wishItemCol.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": update},
	)
	if err != nil {
		return nil, err
	}

	// Récupérer l'item mis à jour
	return s.GetWishItem(ctx, itemID, userID)
}

// DeleteWishItem supprime un item de wishlist
func (s *Service) DeleteWishItem(ctx context.Context, itemID string, userID primitive.ObjectID) error {
	id, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return err
	}

	// Récupérer l'item
	item, err := s.getWishItemByID(ctx, id)
	if err != nil {
		return err
	}

	// Vérifier l'accès à la wishlist associée
	wishlist, err := s.getWishlistByID(ctx, item.WishlistID)
	if err != nil {
		return err
	}

	if !s.hasEditPermission(wishlist, userID) {
		return errors.New("access denied")
	}

	// Supprimer l'item de la wishlist
	_, err = s.wishlistCol.UpdateOne(
		ctx,
		bson.M{"_id": item.WishlistID},
		bson.M{
			"$pull": bson.M{"items": id},
			"$set":  bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return err
	}

	// Supprimer l'item
	_, err = s.wishItemCol.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// ReserveWishItem réserve un item de wishlist
func (s *Service) ReserveWishItem(ctx context.Context, itemID string, userID primitive.ObjectID, req models.ReserveWishItemRequest) error {
	id, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return err
	}

	// Récupérer l'item
	item, err := s.getWishItemByID(ctx, id)
	if err != nil {
		return err
	}

	// Ne pas permettre au propriétaire de l'item de le réserver
	if item.UserID == userID {
		return errors.New("vous ne pouvez pas réserver votre propre item")
	}

	// Vérifier si l'item est déjà réservé
	if item.IsReserved && req.Reserve {
		return errors.New("cet item est déjà réservé")
	}

	// Vérifier l'accès à la wishlist associée
	wishlist, err := s.getWishlistByID(ctx, item.WishlistID)
	if err != nil {
		return err
	}

	hasAccess := wishlist.IsPublic || wishlist.UserID == userID
	if !hasAccess {
		for _, share := range wishlist.SharedWith {
			if share.UserID == userID && share.Status == ShareStatusAccepted {
				hasAccess = true
				break
			}
		}
	}

	if !hasAccess {
		return errors.New("access denied")
	}

	// Mettre à jour l'état de réservation
	update := bson.M{
		"updatedAt": time.Now(),
	}

	if !req.Reserve {
		if !item.IsReserved || item.ReservedBy != userID {
			return errors.New("vous ne pouvez pas annuler cette réservation")
		}
		update["isReserved"] = false
		update["reservedBy"] = primitive.NilObjectID
	} else {
		update["isReserved"] = true
		update["reservedBy"] = userID
	}

	_, err = s.wishItemCol.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": update},
	)
	return err
}

// GetUserWishItems récupère tous les items de wishlist créés par un utilisateur
func (s *Service) GetUserWishItems(ctx context.Context, userID primitive.ObjectID) ([]*models.WishItemResponse, error) {
	cursor, err := s.wishItemCol.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.WishItem
	if err = cursor.All(ctx, &items); err != nil {
		return nil, err
	}

	// Convertir en réponses
	responses := []*models.WishItemResponse{}
	for _, item := range items {
		response := &models.WishItemResponse{
			ID:          item.ID.Hex(),
			WishlistID:  item.WishlistID.Hex(),
			UserID:      item.UserID.Hex(),
			Name:        item.Name,
			Description: item.Description,
			Price:       item.Price,
			Currency:    item.Currency,
			ImageURL:    item.ImageURL,
			Link:        item.Link,
			IsFavorite:  item.IsFavorite,
			IsReserved:  item.IsReserved,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		}

		if item.IsReserved && !item.ReservedBy.IsZero() {
			response.ReservedBy = item.ReservedBy.Hex()
		}

		responses = append(responses, response)
	}

	return responses, nil
}

// GetWishlistItems récupère tous les items d'une wishlist
func (s *Service) GetWishlistItems(ctx context.Context, wishlistID string, userID primitive.ObjectID) ([]*models.WishItemResponse, error) {
	id, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return nil, err
	}

	// Vérifier l'accès à la wishlist
	wishlist, err := s.getWishlistByID(ctx, id)
	if err != nil {
		return nil, err
	}

	isOwner := wishlist.UserID == userID
	hasAccess := isOwner || wishlist.IsPublic

	if !hasAccess {
		for _, share := range wishlist.SharedWith {
			if share.UserID == userID && share.Status == ShareStatusAccepted {
				hasAccess = true
				break
			}
		}
	}

	if !hasAccess {
		return nil, errors.New("access denied")
	}

	// Récupérer tous les items de la wishlist
	cursor, err := s.wishItemCol.Find(ctx, bson.M{"wishlistId": id})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.WishItem
	if err = cursor.All(ctx, &items); err != nil {
		return nil, err
	}

	// Convertir en réponses
	responses := []*models.WishItemResponse{}
	for _, item := range items {
		response := &models.WishItemResponse{
			ID:          item.ID.Hex(),
			WishlistID:  item.WishlistID.Hex(),
			UserID:      item.UserID.Hex(),
			Name:        item.Name,
			Description: item.Description,
			Price:       item.Price,
			Currency:    item.Currency,
			ImageURL:    item.ImageURL,
			Link:        item.Link,
			IsFavorite:  item.IsFavorite,
			IsReserved:  item.IsReserved,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		}

		if item.IsReserved && !item.ReservedBy.IsZero() {
			response.ReservedBy = item.ReservedBy.Hex()
		}

		responses = append(responses, response)
	}

	return responses, nil
}

// SearchWishlists recherche des wishlists par une requête
func (s *Service) SearchWishlists(ctx context.Context, userID primitive.ObjectID, query string) ([]*models.WishlistResponse, error) {
	regexQuery := bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}

	// Create filters for text matching and access control
	textFilter := bson.M{
		"$or": []bson.M{
			{"title": regexQuery},
			{"description": regexQuery},
		},
	}

	accessFilter := bson.M{
		"$or": []bson.M{
			{"userId": userID},
			{"isPublic": true},
			{
				"sharedWith": bson.M{
					"$elemMatch": bson.M{
						"userId": userID,
						"status": ShareStatusAccepted,
					},
				},
			},
		},
	}

	// Combine filters with $and
	filter := bson.M{
		"$and": []bson.M{textFilter, accessFilter},
	}

	cursor, err := s.wishlistCol.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var wishlists []models.Wishlist
	if err = cursor.All(ctx, &wishlists); err != nil {
		return nil, err
	}

	// Convertir en réponses
	responses := []*models.WishlistResponse{}
	for _, wishlist := range wishlists {
		isOwner := wishlist.UserID == userID

		response := &models.WishlistResponse{
			ID:          wishlist.ID.Hex(),
			UserID:      wishlist.UserID.Hex(),
			Title:       wishlist.Title,
			Description: wishlist.Description,
			CoverImage:  wishlist.CoverImage,
			IsPublic:    wishlist.IsPublic,
			IsFavorite:  wishlist.IsFavorite,
			IsOwner:     isOwner,
			CreatedAt:   wishlist.CreatedAt,
			UpdatedAt:   wishlist.UpdatedAt,
		}

		responses = append(responses, response)
	}

	return responses, nil
}

// SearchWishItems recherche des items de wishlist par une requête
func (s *Service) SearchWishItems(ctx context.Context, userID primitive.ObjectID, query string) ([]*models.WishItemResponse, error) {
	// D'abord, récupérer les wishlists auxquelles l'utilisateur a accès
	wishlistsFilter := bson.M{
		"$or": []bson.M{
			{"userId": userID},
			{"isPublic": true},
			{"sharedWith": bson.M{
				"$elemMatch": bson.M{
					"userId": userID,
					"status": ShareStatusAccepted,
				},
			}},
		},
	}

	cursor, err := s.wishlistCol.Find(ctx, wishlistsFilter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var wishlists []models.Wishlist
	if err = cursor.All(ctx, &wishlists); err != nil {
		return nil, err
	}

	if len(wishlists) == 0 {
		return []*models.WishItemResponse{}, nil
	}

	// Extraire les IDs des wishlists
	wishlistIDs := []primitive.ObjectID{}
	for _, wishlist := range wishlists {
		wishlistIDs = append(wishlistIDs, wishlist.ID)
	}

	// Rechercher les items correspondants
	regexQuery := bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}
	itemsFilter := bson.M{
		"wishlistId": bson.M{"$in": wishlistIDs},
		"$or": []bson.M{
			{"name": regexQuery},
			{"description": regexQuery},
			{"link": regexQuery},
		},
	}

	itemsCursor, err := s.wishItemCol.Find(ctx, itemsFilter)
	if err != nil {
		return nil, err
	}
	defer itemsCursor.Close(ctx)

	var items []models.WishItem
	if err = itemsCursor.All(ctx, &items); err != nil {
		return nil, err
	}

	// Convertir en réponses
	responses := []*models.WishItemResponse{}
	for _, item := range items {
		response := &models.WishItemResponse{
			ID:          item.ID.Hex(),
			WishlistID:  item.WishlistID.Hex(),
			UserID:      item.UserID.Hex(),
			Name:        item.Name,
			Description: item.Description,
			Price:       item.Price,
			Currency:    item.Currency,
			ImageURL:    item.ImageURL,
			Link:        item.Link,
			IsFavorite:  item.IsFavorite,
			IsReserved:  item.IsReserved,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		}

		if item.IsReserved && !item.ReservedBy.IsZero() {
			response.ReservedBy = item.ReservedBy.Hex()
		}

		responses = append(responses, response)
	}

	return responses, nil
}

// UploadWishlistCover télécharge une image de couverture pour une wishlist
func (s *Service) UploadWishlistCover(ctx context.Context, wishlistID string, userID primitive.ObjectID, file multipart.File, header *multipart.FileHeader) (string, error) {
	wID, err := primitive.ObjectIDFromHex(wishlistID)
	if err != nil {
		return "", err
	}

	// Vérifier l'accès à la wishlist
	wishlist, err := s.getWishlistByID(ctx, wID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return "", errors.New("wishlist not found")
		}
		return "", err
	}

	// Vérifier que l'utilisateur est le propriétaire ou a des droits d'édition
	if wishlist.UserID != userID && !s.hasEditPermission(wishlist, userID) {
		return "", errors.New("access denied")
	}

	// Lire le contenu du fichier
	buffer, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}

	// Vérifier si c'est bien une image
	contentType := http.DetectContentType(buffer)
	if !strings.HasPrefix(contentType, "image/") {
		return "", errors.New("le fichier n'est pas une image valide")
	}

	// Configurer le client S3
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(s.config.Storage.S3Region),
		Credentials: credentials.NewStaticCredentials(
			s.config.Storage.S3AccessKey,
			s.config.Storage.S3SecretKey,
			"",
		),
		Endpoint: aws.String(s.config.Storage.S3Endpoint),
	})
	if err != nil {
		return "", err
	}

	svc := s3.New(sess)

	// Générer un nom de fichier unique
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("wishlists/%s-%s%s", wishlistID, uuid.New().String(), ext)

	// Télécharger l'image vers S3
	_, err = svc.PutObject(&s3.PutObjectInput{
		Bucket:        aws.String(s.config.Storage.S3Bucket),
		Key:           aws.String(filename),
		Body:          bytes.NewReader(buffer),
		ContentLength: aws.Int64(int64(len(buffer))),
		ContentType:   aws.String(contentType),
	})
	if err != nil {
		return "", err
	}

	// Construire l'URL de l'image
	var imageURL string
	if s.config.Storage.S3Endpoint != "" {
		imageURL = fmt.Sprintf("%s/%s/%s", s.config.Storage.S3Endpoint, s.config.Storage.S3Bucket, filename)
	} else {
		imageURL = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.config.Storage.S3Bucket, filename)
	}

	// Mettre à jour la wishlist avec l'URL de l'image
	_, err = s.wishlistCol.UpdateOne(
		ctx,
		bson.M{"_id": wID},
		bson.M{
			"$set": bson.M{
				"coverImage": imageURL,
				"updatedAt":  time.Now(),
			},
		},
	)
	if err != nil {
		return "", err
	}

	return imageURL, nil
}

// UploadWishItemImage uploads an image for a wish item
func (s *Service) UploadWishItemImage(ctx context.Context, itemID string, userID primitive.ObjectID, file multipart.File, header *multipart.FileHeader) (string, error) {
	id, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return "", errors.New("invalid item ID")
	}

	// Récupérer l'item
	item, err := s.getWishItemByID(ctx, id)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return "", errors.New("item not found")
		}
		return "", err
	}

	// Vérifier l'accès à la wishlist associée
	wishlist, err := s.getWishlistByID(ctx, item.WishlistID)
	if err != nil {
		return "", err
	}

	if !s.hasEditPermission(wishlist, userID) {
		return "", errors.New("access denied")
	}

	// Lire le contenu du fichier
	buffer, err := io.ReadAll(file)
	if err != nil {
		return "", err
	}

	// Vérifier si c'est bien une image
	contentType := http.DetectContentType(buffer)
	if !strings.HasPrefix(contentType, "image/") {
		return "", errors.New("le fichier n'est pas une image valide")
	}

	// Configurer le client S3
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(s.config.Storage.S3Region),
		Credentials: credentials.NewStaticCredentials(
			s.config.Storage.S3AccessKey,
			s.config.Storage.S3SecretKey,
			"",
		),
		Endpoint: aws.String(s.config.Storage.S3Endpoint),
	})
	if err != nil {
		return "", err
	}

	svc := s3.New(sess)

	// Générer un nom de fichier unique
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("wishitems/%s-%s%s", itemID, uuid.New().String(), ext)

	// Télécharger l'image vers S3
	_, err = svc.PutObject(&s3.PutObjectInput{
		Bucket:        aws.String(s.config.Storage.S3Bucket),
		Key:           aws.String(filename),
		Body:          bytes.NewReader(buffer),
		ContentLength: aws.Int64(int64(len(buffer))),
		ContentType:   aws.String(contentType),
	})
	if err != nil {
		return "", err
	}

	// Construire l'URL de l'image
	var imageURL string
	if s.config.Storage.S3Endpoint != "" {
		imageURL = fmt.Sprintf("%s/%s/%s", s.config.Storage.S3Endpoint, s.config.Storage.S3Bucket, filename)
	} else {
		imageURL = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.config.Storage.S3Bucket, filename)
	}

	// Mettre à jour l'item avec l'URL de l'image
	_, err = s.wishItemCol.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"imageUrl":  imageURL,
				"updatedAt": time.Now(),
			},
		},
	)
	if err != nil {
		return "", err
	}

	return imageURL, nil
}

// getS3Client returns an initialized S3 client
// REMARQUE: Cette méthode n'est actuellement pas utilisée, elle est conservée pour référence future
// func (s *Service) getS3Client() (*s3.S3, error) {
// 	sess, err := session.NewSession(&aws.Config{
// 		Region: aws.String(s.config.Storage.S3Region),
// 		Credentials: credentials.NewStaticCredentials(
// 			s.config.Storage.S3AccessKey,
// 			s.config.Storage.S3SecretKey,
// 			"",
// 		),
// 		Endpoint: aws.String(s.config.Storage.S3Endpoint),
// 	})
// 	if err != nil {
// 		return nil, err
// 	}
// 	return s3.New(sess), nil
// }
