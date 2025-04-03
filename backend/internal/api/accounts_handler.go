package api

import (
	"net/http"

	"genie/internal/accounts"
	"genie/internal/middleware"
	"genie/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// AccountsHandler gère les routes pour les comptes gérés
type AccountsHandler struct {
	accountsService *accounts.Service
}

// NewAccountsHandler crée une nouvelle instance du gestionnaire de comptes
func NewAccountsHandler(accountsService *accounts.Service) *AccountsHandler {
	return &AccountsHandler{
		accountsService: accountsService,
	}
}

// RegisterRoutes enregistre les routes pour les comptes gérés
func (h *AccountsHandler) RegisterRoutes(router *gin.RouterGroup) {
	// Toutes les routes de comptes gérés nécessitent une authentification
	managedRoutes := router.Group("/managed-accounts")
	managedRoutes.Use(middleware.AuthRequired())
	{
		managedRoutes.GET("", h.GetManagedAccounts)
		managedRoutes.POST("", h.CreateManagedAccount)
		managedRoutes.GET("/:id", h.GetManagedAccount)
		managedRoutes.PUT("/:id", h.UpdateManagedAccount)
		managedRoutes.DELETE("/:id", h.DeleteManagedAccount)
		managedRoutes.POST("/:id/avatar", h.SetManagedAccountAvatar)
	}
}

// GetManagedAccounts récupère tous les comptes gérés pour l'utilisateur authentifié
func (h *AccountsHandler) GetManagedAccounts(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	accounts, err := h.accountsService.GetManagedAccounts(c.Request.Context(), userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération des comptes gérés")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des comptes gérés"})
		return
	}

	c.JSON(http.StatusOK, accounts)
}

// CreateManagedAccount crée un nouveau compte géré pour l'utilisateur authentifié
func (h *AccountsHandler) CreateManagedAccount(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	var req models.ManagedAccountCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	account, err := h.accountsService.CreateManagedAccount(c.Request.Context(), userID, req)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la création du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// GetManagedAccount récupère les détails d'un compte géré spécifique
func (h *AccountsHandler) GetManagedAccount(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de compte géré manquant"})
		return
	}

	account, err := h.accountsService.GetManagedAccount(c.Request.Context(), userID, accountID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la récupération du compte géré")
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// UpdateManagedAccount met à jour un compte géré existant
func (h *AccountsHandler) UpdateManagedAccount(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de compte géré manquant"})
		return
	}

	var req models.ManagedAccountUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	account, err := h.accountsService.UpdateManagedAccount(c.Request.Context(), userID, accountID, req)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la mise à jour du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// DeleteManagedAccount supprime un compte géré
func (h *AccountsHandler) DeleteManagedAccount(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de compte géré manquant"})
		return
	}

	err := h.accountsService.DeleteManagedAccount(c.Request.Context(), userID, accountID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la suppression du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Compte géré supprimé avec succès"})
}

// SetManagedAccountAvatar met à jour l'avatar d'un compte géré
func (h *AccountsHandler) SetManagedAccountAvatar(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de compte géré manquant"})
		return
	}

	var req struct {
		AvatarURL string `json:"avatarUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL d'avatar requise"})
		return
	}

	err := h.accountsService.SetManagedAccountAvatar(c.Request.Context(), userID, accountID, req.AvatarURL)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la mise à jour de l'avatar du compte géré")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Avatar mis à jour avec succès"})
}