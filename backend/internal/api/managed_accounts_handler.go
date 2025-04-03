package api

import (
	"net/http"

	"genie/internal/accounts"
	"genie/internal/middleware"
	"genie/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// ManagedAccountsHandler gère les routes API pour les comptes gérés
type ManagedAccountsHandler struct {
	accountsService *accounts.Service
}

// NewManagedAccountsHandler crée un nouveau gestionnaire pour les comptes gérés
func NewManagedAccountsHandler(accountsService *accounts.Service) *ManagedAccountsHandler {
	return &ManagedAccountsHandler{
		accountsService: accountsService,
	}
}

// RegisterRoutes enregistre les routes pour les comptes gérés
func (h *ManagedAccountsHandler) RegisterRoutes(router *gin.RouterGroup) {
	{
		router.POST("", h.createManagedAccount)
		router.GET("", h.getManagedAccounts)
		router.GET("/:accountId", h.getManagedAccount)
		router.PUT("/:accountId", h.updateManagedAccount)
		router.DELETE("/:accountId", h.deleteManagedAccount)
		router.PUT("/:accountId/avatar", h.updateManagedAccountAvatar)
		router.PUT("/:accountId/profile-picture", h.updateManagedAccountProfilePicture)
	}
}

// createManagedAccount crée un nouveau compte géré
func (h *ManagedAccountsHandler) createManagedAccount(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	var req models.ManagedAccountCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error().Err(err).Msg("Erreur lors de la validation de la requête")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides"})
		return
	}

	account, err := h.accountsService.CreateManagedAccount(c.Request.Context(), userID.(string), req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la création du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// getManagedAccounts récupère tous les comptes gérés d'un utilisateur
func (h *ManagedAccountsHandler) getManagedAccounts(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	accounts, err := h.accountsService.GetManagedAccounts(c.Request.Context(), userID.(string))
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération des comptes gérés")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"accounts": accounts})
}

// getManagedAccount récupère un compte géré spécifique
func (h *ManagedAccountsHandler) getManagedAccount(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	accountID := c.Param("accountId")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID du compte géré manquant"})
		return
	}

	account, err := h.accountsService.GetManagedAccount(c.Request.Context(), userID.(string), accountID)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// updateManagedAccount met à jour un compte géré
func (h *ManagedAccountsHandler) updateManagedAccount(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	accountID := c.Param("accountId")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID du compte géré manquant"})
		return
	}

	var req models.ManagedAccountUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error().Err(err).Msg("Erreur lors de la validation de la requête")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides"})
		return
	}

	account, err := h.accountsService.UpdateManagedAccount(c.Request.Context(), userID.(string), accountID, req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// deleteManagedAccount supprime un compte géré
func (h *ManagedAccountsHandler) deleteManagedAccount(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	accountID := c.Param("accountId")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID du compte géré manquant"})
		return
	}

	err := h.accountsService.DeleteManagedAccount(c.Request.Context(), userID.(string), accountID)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la suppression du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// updateManagedAccountAvatar met à jour l'avatar d'un compte géré
func (h *ManagedAccountsHandler) updateManagedAccountAvatar(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	accountID := c.Param("accountId")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID du compte géré manquant"})
		return
	}

	var req struct {
		AvatarURL string `json:"avatarUrl" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error().Err(err).Msg("Erreur lors de la validation de la requête")
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL d'avatar invalide"})
		return
	}

	err := h.accountsService.SetManagedAccountAvatar(c.Request.Context(), userID.(string), accountID, req.AvatarURL)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour de l'avatar")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// updateManagedAccountProfilePicture met à jour la photo de profil d'un compte géré
func (h *ManagedAccountsHandler) updateManagedAccountProfilePicture(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	accountID := c.Param("accountId")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID du compte géré manquant"})
		return
	}

	var req struct {
		ProfilePictureURL string `json:"profilePictureUrl" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error().Err(err).Msg("Erreur lors de la validation de la requête")
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL de photo de profil invalide"})
		return
	}

	err := h.accountsService.SetManagedAccountProfilePicture(c.Request.Context(), userID.(string), accountID, req.ProfilePictureURL)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour de la photo de profil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}