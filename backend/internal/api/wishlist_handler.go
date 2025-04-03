package api

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"genie/internal/models"
	"genie/internal/wishlist"
)

// WishlistHandler gère les routes API liées aux wishlists
type WishlistHandler struct {
	wishlistSvc *wishlist.Service
}

// NewWishlistHandler crée un nouveau gestionnaire pour les wishlists
func NewWishlistHandler(wishlistSvc *wishlist.Service) *WishlistHandler {
	return &WishlistHandler{
		wishlistSvc: wishlistSvc,
	}
}

// RegisterRoutes enregistre les routes API pour les wishlists
func (h *WishlistHandler) RegisterRoutes(router *gin.RouterGroup) {
	wishlistRoutes := router.Group("/wishlists")
	{
		wishlistRoutes.GET("", h.getUserWishlists)
		wishlistRoutes.POST("", h.createWishlist)
		wishlistRoutes.GET("/invitations", h.getWishlistInvitations)
		wishlistRoutes.GET("/search", h.searchWishlists)
		wishlistRoutes.GET("/:id", h.getWishlist)
		wishlistRoutes.PUT("/:id", h.updateWishlist)
		wishlistRoutes.DELETE("/:id", h.deleteWishlist)
		wishlistRoutes.POST("/:id/share", h.shareWishlist)
		wishlistRoutes.POST("/:id/respond", h.respondToInvitation)
		wishlistRoutes.DELETE("/:id/share/:userId", h.removeSharing)
		wishlistRoutes.POST("/:id/upload-cover", h.uploadWishlistCover)

		wishlistRoutes.GET("/:id/items", h.getWishlistItems)
		wishlistRoutes.POST("/items", h.createWishItem)
		wishlistRoutes.GET("/items/all", h.getUserWishItems)
		wishlistRoutes.GET("/items/search", h.searchWishItems)
		wishlistRoutes.GET("/items/:itemId", h.getWishItem)
		wishlistRoutes.PUT("/items/:itemId", h.updateWishItem)
		wishlistRoutes.DELETE("/items/:itemId", h.deleteWishItem)
		wishlistRoutes.POST("/items/:itemId/reserve", h.reserveWishItem)
		wishlistRoutes.POST("/items/:itemId/upload-image", h.uploadWishItemImage)
	}
}

// getUserWishlists récupère toutes les wishlists de l'utilisateur
func (h *WishlistHandler) getUserWishlists(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlists, err := h.wishlistSvc.GetUserWishlists(c, uid)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération des wishlists")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de récupérer les wishlists"})
		return
	}

	c.JSON(http.StatusOK, wishlists)
}

// createWishlist crée une nouvelle wishlist
func (h *WishlistHandler) createWishlist(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	var req models.CreateWishlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	wishlist, err := h.wishlistSvc.CreateWishlist(c, uid, req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la création de la wishlist")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de créer la wishlist"})
		return
	}

	c.JSON(http.StatusCreated, wishlist)
}

// getWishlist récupère une wishlist par son ID
func (h *WishlistHandler) getWishlist(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	wishlist, err := h.wishlistSvc.GetWishlist(c, wishlistID, uid)
	if err != nil {
		log.Error().Err(err).Str("wishlistID", wishlistID).Msg("Erreur lors de la récupération de la wishlist")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de récupérer la wishlist"})
		return
	}

	c.JSON(http.StatusOK, wishlist)
}

// updateWishlist met à jour une wishlist
func (h *WishlistHandler) updateWishlist(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	var req models.UpdateWishlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	wishlist, err := h.wishlistSvc.UpdateWishlist(c, wishlistID, uid, req)
	if err != nil {
		log.Error().Err(err).Str("wishlistID", wishlistID).Msg("Erreur lors de la mise à jour de la wishlist")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de mettre à jour la wishlist"})
		return
	}

	c.JSON(http.StatusOK, wishlist)
}

// deleteWishlist supprime une wishlist
func (h *WishlistHandler) deleteWishlist(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	err = h.wishlistSvc.DeleteWishlist(c, wishlistID, uid)
	if err != nil {
		log.Error().Err(err).Str("wishlistID", wishlistID).Msg("Erreur lors de la suppression de la wishlist")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de supprimer la wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wishlist supprimée avec succès"})
}

// shareWishlist partage une wishlist avec un autre utilisateur
func (h *WishlistHandler) shareWishlist(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	var req models.ShareWishlistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	err = h.wishlistSvc.ShareWishlist(c, wishlistID, uid, req)
	if err != nil {
		log.Error().Err(err).Str("wishlistID", wishlistID).Msg("Erreur lors du partage de la wishlist")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "target user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Utilisateur cible non trouvé"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de partager la wishlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wishlist partagée avec succès"})
}

// getWishlistInvitations récupère les invitations à des wishlists
func (h *WishlistHandler) getWishlistInvitations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	invitations, err := h.wishlistSvc.GetWishlistInvitations(c, uid)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération des invitations de wishlist")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de récupérer les invitations"})
		return
	}

	c.JSON(http.StatusOK, invitations)
}

// respondToInvitation répond à une invitation à une wishlist
func (h *WishlistHandler) respondToInvitation(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	type ResponseRequest struct {
		Accept bool `json:"accept" binding:"required"`
	}

	var req ResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	err = h.wishlistSvc.RespondToInvitation(c, wishlistID, uid, req.Accept)
	if err != nil {
		log.Error().Err(err).Str("wishlistID", wishlistID).Msg("Erreur lors de la réponse à l'invitation")
		if err.Error() == "invitation not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invitation non trouvée"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de répondre à l'invitation"})
		return
	}

	message := "Invitation refusée avec succès"
	if req.Accept {
		message = "Invitation acceptée avec succès"
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}

// removeSharing supprime un partage de wishlist
func (h *WishlistHandler) removeSharing(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	targetUserID := c.Param("userId")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur cible manquant"})
		return
	}

	err = h.wishlistSvc.RemoveSharing(c, wishlistID, uid, targetUserID)
	if err != nil {
		log.Error().Err(err).Str("wishlistID", wishlistID).Str("targetUserID", targetUserID).Msg("Erreur lors de la suppression du partage")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de supprimer le partage"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Partage supprimé avec succès"})
}

// createWishItem crée un nouveau wish item
func (h *WishlistHandler) createWishItem(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	var req models.CreateWishItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	item, err := h.wishlistSvc.CreateWishItem(c, uid, req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la création du wish item")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de créer le wish item"})
		return
	}

	c.JSON(http.StatusCreated, item)
}

// getWishItem récupère un wish item par son ID
func (h *WishlistHandler) getWishItem(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wish item manquant"})
		return
	}

	item, err := h.wishlistSvc.GetWishItem(c, itemID, uid)
	if err != nil {
		log.Error().Err(err).Str("itemID", itemID).Msg("Erreur lors de la récupération du wish item")
		if err.Error() == "wish item not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wish item non trouvé"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cet item"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de récupérer le wish item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// updateWishItem met à jour un wish item
func (h *WishlistHandler) updateWishItem(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wish item manquant"})
		return
	}

	var req models.UpdateWishItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	item, err := h.wishlistSvc.UpdateWishItem(c, itemID, uid, req)
	if err != nil {
		log.Error().Err(err).Str("itemID", itemID).Msg("Erreur lors de la mise à jour du wish item")
		if err.Error() == "wish item not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wish item non trouvé"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cet item"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de mettre à jour le wish item"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// deleteWishItem supprime un wish item
func (h *WishlistHandler) deleteWishItem(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wish item manquant"})
		return
	}

	err = h.wishlistSvc.DeleteWishItem(c, itemID, uid)
	if err != nil {
		log.Error().Err(err).Str("itemID", itemID).Msg("Erreur lors de la suppression du wish item")
		if err.Error() == "wish item not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wish item non trouvé"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cet item"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de supprimer le wish item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Wish item supprimé avec succès"})
}

// reserveWishItem réserve ou annule la réservation d'un wish item
func (h *WishlistHandler) reserveWishItem(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wish item manquant"})
		return
	}

	var req models.ReserveWishItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	err = h.wishlistSvc.ReserveWishItem(c, itemID, uid, req)
	if err != nil {
		log.Error().Err(err).Str("itemID", itemID).Msg("Erreur lors de la réservation du wish item")
		if err.Error() == "wish item not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wish item non trouvé"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cet item"})
			return
		}
		if err.Error() == "cannot reserve your own item" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Vous ne pouvez pas réserver votre propre item"})
			return
		}
		if err.Error() == "only the owner can cancel someone else's reservation" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Seul le propriétaire peut annuler la réservation de quelqu'un d'autre"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de réserver le wish item"})
		return
	}

	message := "Réservation annulée avec succès"
	if req.Reserve {
		message = "Item réservé avec succès"
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}

// getUserWishItems récupère tous les wish items d'un utilisateur
func (h *WishlistHandler) getUserWishItems(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	items, err := h.wishlistSvc.GetUserWishItems(c, uid)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération des wish items")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de récupérer les wish items"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// getWishlistItems récupère tous les items d'une wishlist
func (h *WishlistHandler) getWishlistItems(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	items, err := h.wishlistSvc.GetWishlistItems(c, wishlistID, uid)
	if err != nil {
		log.Error().Err(err).Str("wishlistID", wishlistID).Msg("Erreur lors de la récupération des items de la wishlist")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de récupérer les items de la wishlist"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// searchWishlists recherche des wishlists par titre
func (h *WishlistHandler) searchWishlists(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Paramètre de recherche manquant"})
		return
	}

	wishlists, err := h.wishlistSvc.SearchWishlists(c, uid, query)
	if err != nil {
		log.Error().Err(err).Str("query", query).Msg("Erreur lors de la recherche de wishlists")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de rechercher des wishlists"})
		return
	}

	c.JSON(http.StatusOK, wishlists)
}

// searchWishItems recherche des items par nom ou description
func (h *WishlistHandler) searchWishItems(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Paramètre de recherche manquant"})
		return
	}

	items, err := h.wishlistSvc.SearchWishItems(c, uid, query)
	if err != nil {
		log.Error().Err(err).Str("query", query).Msg("Erreur lors de la recherche de wish items")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Impossible de rechercher des wish items"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// uploadWishlistCover télécharge et définit l'image de couverture d'une wishlist
func (h *WishlistHandler) uploadWishlistCover(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	wishlistID := c.Param("id")
	if wishlistID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wishlist manquant"})
		return
	}

	// Récupérer le fichier
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération du fichier")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Fichier d'image requis"})
		return
	}
	defer file.Close()

	// Vérifier le type de fichier
	if !validateImageType(header.Filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format d'image non supporté. Utilisez JPG, PNG ou JPEG"})
		return
	}

	// Traiter et stocker l'image
	imageURL, err := h.wishlistSvc.UploadWishlistCover(c, wishlistID, uid, file, header)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors du téléchargement de l'image de couverture")
		if err.Error() == "wishlist not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wishlist non trouvée"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cette wishlist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du téléchargement de l'image: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image de couverture téléchargée avec succès",
		"url":     imageURL,
	})
}

// uploadWishItemImage télécharge et définit l'image d'un wish item
func (h *WishlistHandler) uploadWishItemImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	uid, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID utilisateur invalide"})
		return
	}

	itemID := c.Param("itemId")
	if itemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de wish item manquant"})
		return
	}

	// Récupérer le fichier
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération du fichier")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Fichier d'image requis"})
		return
	}
	defer file.Close()

	// Vérifier le type de fichier
	if !validateImageType(header.Filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format d'image non supporté. Utilisez JPG, PNG ou JPEG"})
		return
	}

	// Traiter et stocker l'image
	imageURL, err := h.wishlistSvc.UploadWishItemImage(c, itemID, uid, file, header)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors du téléchargement de l'image du wish item")
		if err.Error() == "wish item not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wish item non trouvé"})
			return
		}
		if err.Error() == "access denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé à cet item"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du téléchargement de l'image: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image téléchargée avec succès",
		"url":     imageURL,
	})
}

// validateImageType vérifie si le type de fichier est une image valide
func validateImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExts := []string{".jpg", ".jpeg", ".png"}
	for _, validExt := range validExts {
		if ext == validExt {
			return true
		}
	}
	return false
}
