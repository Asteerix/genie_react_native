package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ManagedAccount définit la structure d'un compte géré par un utilisateur
type ManagedAccount struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	OwnerID     primitive.ObjectID `bson:"ownerId" json:"ownerId"`
	FirstName   string             `bson:"firstName" json:"firstName"`
	LastName    string             `bson:"lastName" json:"lastName"`
	Gender      string             `bson:"gender,omitempty" json:"gender,omitempty"`
	BirthDate   time.Time          `bson:"birthDate,omitempty" json:"birthDate,omitempty"`
	AvatarURL   string             `bson:"avatarUrl,omitempty" json:"avatarUrl,omitempty"`
	ProfilePictureURL string       `bson:"profilePictureUrl,omitempty" json:"profilePictureUrl,omitempty"`
	Relationship string            `bson:"relationship,omitempty" json:"relationship,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// ManagedAccountResponse représente les données d'un compte géré retournées aux clients
type ManagedAccountResponse struct {
	ID          string    `json:"id"`
	OwnerID     string    `json:"ownerId"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	Gender      string    `json:"gender,omitempty"`
	BirthDate   time.Time `json:"birthDate,omitempty"`
	AvatarURL   string    `json:"avatarUrl,omitempty"`
	ProfilePictureURL string `json:"profilePictureUrl,omitempty"`
	Relationship string   `json:"relationship,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ToResponse convertit un ManagedAccount en ManagedAccountResponse
func (ma *ManagedAccount) ToResponse() ManagedAccountResponse {
	return ManagedAccountResponse{
		ID:          ma.ID.Hex(),
		OwnerID:     ma.OwnerID.Hex(),
		FirstName:   ma.FirstName,
		LastName:    ma.LastName,
		Gender:      ma.Gender,
		BirthDate:   ma.BirthDate,
		AvatarURL:   ma.AvatarURL,
		ProfilePictureURL: ma.ProfilePictureURL,
		Relationship: ma.Relationship,
		CreatedAt:   ma.CreatedAt,
		UpdatedAt:   ma.UpdatedAt,
	}
}

// ManagedAccountCreateRequest représente une demande de création de compte géré
type ManagedAccountCreateRequest struct {
	FirstName    string `json:"firstName" binding:"required"`
	LastName     string `json:"lastName" binding:"required"`
	Gender       string `json:"gender,omitempty"`
	BirthDate    string `json:"birthDate,omitempty"`
	Relationship string `json:"relationship,omitempty"`
}

// ManagedAccountUpdateRequest représente une demande de mise à jour de compte géré
type ManagedAccountUpdateRequest struct {
	FirstName    string `json:"firstName,omitempty"`
	LastName     string `json:"lastName,omitempty"`
	Gender       string `json:"gender,omitempty"`
	BirthDate    string `json:"birthDate,omitempty"`
	Relationship string `json:"relationship,omitempty"`
}