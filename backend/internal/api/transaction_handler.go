package api

import (
	"net/http"
	"strconv"

	"genie/internal/accounts"
	"genie/internal/middleware"
	"genie/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// getUserIDFromContext récupère l'ID utilisateur du contexte Gin
func getUserIDFromContext(c *gin.Context) string {
	return middleware.GetUserIDFromContext(c)
}

// TransactionHandler gère les requêtes liées aux transactions
type TransactionHandler struct {
	accountsService *accounts.Service
}

// NewTransactionHandler crée une nouvelle instance du gestionnaire de transactions
func NewTransactionHandler(accountsService *accounts.Service) *TransactionHandler {
	return &TransactionHandler{
		accountsService: accountsService,
	}
}

// GetUserBalance récupère le solde du compte de l'utilisateur
func (h *TransactionHandler) GetUserBalance(c *gin.Context) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	// Récupérer le solde
	balance, err := h.accountsService.GetUserBalance(c.Request.Context(), userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération du solde")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du solde"})
		return
	}

	// Retourner le solde
	c.JSON(http.StatusOK, models.BalanceResponse{
		Balance: balance,
	})
}

// AddFunds ajoute des fonds au compte de l'utilisateur
func (h *TransactionHandler) AddFunds(c *gin.Context) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	// Valider la requête
	var req models.AddFundsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Requête invalide"})
		return
	}

	// Vérifier que le montant est positif
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Le montant doit être supérieur à 0"})
		return
	}

	// Ajouter les fonds
	balance, err := h.accountsService.AddFunds(c.Request.Context(), userID, req.Amount)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Float64("amount", req.Amount).Msg("Erreur lors de l'ajout de fonds")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'ajout de fonds"})
		return
	}

	// Retourner le nouveau solde
	c.JSON(http.StatusOK, models.BalanceResponse{
		Balance: balance,
	})
}

// TransferFunds transfère des fonds à un autre utilisateur
func (h *TransactionHandler) TransferFunds(c *gin.Context) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	// Valider la requête
	var req models.TransferFundsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Requête invalide"})
		return
	}

	// Vérifier que le montant est positif
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Le montant doit être supérieur à 0"})
		return
	}

	// Transférer les fonds
	balance, err := h.accountsService.TransferFunds(c.Request.Context(), userID, req.RecipientID, req.Amount, req.IsManagedAccount)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("recipientID", req.RecipientID).Float64("amount", req.Amount).Msg("Erreur lors du transfert de fonds")
		
		// Vérifier les erreurs spécifiques
		switch err.Error() {
		case "solde insuffisant":
			c.JSON(http.StatusBadRequest, gin.H{"error": "Solde insuffisant pour effectuer ce transfert"})
		case "destinataire non trouvé":
			c.JSON(http.StatusNotFound, gin.H{"error": "Destinataire non trouvé"})
		case "compte géré non trouvé":
			c.JSON(http.StatusNotFound, gin.H{"error": "Compte géré non trouvé"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du transfert de fonds"})
		}
		return
	}

	// Retourner le nouveau solde
	c.JSON(http.StatusOK, models.BalanceResponse{
		Balance: balance,
	})
}

// GetTransactions récupère l'historique des transactions de l'utilisateur
func (h *TransactionHandler) GetTransactions(c *gin.Context) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	// Récupérer les paramètres de pagination
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, err := strconv.ParseInt(limitStr, 10, 64)
	if err != nil || limit <= 0 {
		limit = 10
	}
	
	offset, err := strconv.ParseInt(offsetStr, 10, 64)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Récupérer les transactions
	result, err := h.accountsService.GetUserTransactions(c.Request.Context(), userID, limit, offset)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Int64("limit", limit).Int64("offset", offset).Msg("Erreur lors de la récupération des transactions")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des transactions"})
		return
	}

	// Retourner les transactions
	c.JSON(http.StatusOK, result)
}

// GetTransactionDetails récupère les détails d'une transaction spécifique
func (h *TransactionHandler) GetTransactionDetails(c *gin.Context) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := getUserIDFromContext(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Utilisateur non authentifié"})
		return
	}

	// Récupérer l'ID de la transaction depuis l'URL
	transactionID := c.Param("id")
	if transactionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de transaction manquant"})
		return
	}

	// Récupérer les détails de la transaction
	transaction, err := h.accountsService.GetTransactionDetails(c.Request.Context(), userID, transactionID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("transactionID", transactionID).Msg("Erreur lors de la récupération des détails de la transaction")
		
		if err.Error() == "transaction non trouvée ou non autorisée" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction non trouvée ou non autorisée"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des détails de la transaction"})
		}
		return
	}

	// Retourner les détails de la transaction
	c.JSON(http.StatusOK, transaction)
}

// RegisterTransactionRoutes enregistre les routes de transaction sur le routeur
func RegisterTransactionRoutes(router *gin.RouterGroup, accountsService *accounts.Service) {
	handler := NewTransactionHandler(accountsService)

	userRoutes := router.Group("/users/me")
	{
		// Endpoint pour récupérer le solde de l'utilisateur
		userRoutes.GET("/balance", handler.GetUserBalance)
		
		// Endpoint pour ajouter des fonds
		userRoutes.POST("/balance/add", handler.AddFunds)
		
		// Endpoint pour transférer des fonds
		userRoutes.POST("/balance/transfer", handler.TransferFunds)
		
		// Endpoint pour récupérer l'historique des transactions
		userRoutes.GET("/transactions", handler.GetTransactions)
		
		// Endpoint pour récupérer les détails d'une transaction
		userRoutes.GET("/transactions/:id", handler.GetTransactionDetails)
	}
}