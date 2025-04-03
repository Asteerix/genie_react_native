package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Transaction définit la structure d'une transaction dans l'application
type Transaction struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID           primitive.ObjectID `bson:"userId" json:"-"`
	Amount           float64            `bson:"amount" json:"amount"`
	Type             string             `bson:"type" json:"type"` // "CREDIT" ou "DEBIT"
	Description      string             `bson:"description" json:"description"`
	RecipientID      primitive.ObjectID `bson:"recipientId,omitempty" json:"-"`
	RecipientName    string             `bson:"recipientName,omitempty" json:"recipientName,omitempty"`
	RecipientAvatar  string             `bson:"recipientAvatar,omitempty" json:"recipientAvatar,omitempty"`
	IsManagedAccount bool               `bson:"isManagedAccount,omitempty" json:"isManagedAccount,omitempty"`
	CreatedAt        time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt        time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// TransactionResponse représente les données de transaction retournées aux clients
type TransactionResponse struct {
	ID               string    `json:"id"`
	Amount           float64   `json:"amount"`
	Type             string    `json:"type"` // "CREDIT" ou "DEBIT"
	Description      string    `json:"description"`
	RecipientID      string    `json:"recipientId,omitempty"`
	RecipientName    string    `json:"recipientName,omitempty"`
	RecipientAvatar  string    `json:"recipientAvatar,omitempty"`
	IsManagedAccount bool      `json:"isManagedAccount,omitempty"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// ToResponse convertit une Transaction en TransactionResponse
func (t *Transaction) ToResponse() TransactionResponse {
	response := TransactionResponse{
		ID:               t.ID.Hex(),
		Amount:           t.Amount,
		Type:             t.Type,
		Description:      t.Description,
		RecipientName:    t.RecipientName,
		RecipientAvatar:  t.RecipientAvatar,
		IsManagedAccount: t.IsManagedAccount,
		CreatedAt:        t.CreatedAt,
		UpdatedAt:        t.UpdatedAt,
	}

	if !t.RecipientID.IsZero() {
		response.RecipientID = t.RecipientID.Hex()
	}

	return response
}

// TransactionListResponse représente une liste paginée de transactions
type TransactionListResponse struct {
	Transactions []TransactionResponse `json:"transactions"`
	Total        int64                 `json:"total"`
}

// AddFundsRequest représente une demande d'ajout de fonds
type AddFundsRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// BalanceResponse représente une réponse avec le solde du compte
type BalanceResponse struct {
	Balance float64 `json:"balance"`
}

// TransferFundsRequest représente une demande de transfert de fonds
type TransferFundsRequest struct {
	Amount           float64 `json:"amount" binding:"required,gt=0"`
	RecipientID      string  `json:"recipientId" binding:"required"`
	IsManagedAccount bool    `json:"isManagedAccount"`
}