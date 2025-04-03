package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Wishlist définit la structure d'une liste de souhaits
type Wishlist struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id,omitempty"`
	UserID      primitive.ObjectID   `bson:"userId" json:"userId"`
	Title       string               `bson:"title" json:"title"`
	Description string               `bson:"description,omitempty" json:"description,omitempty"`
	CoverImage  string               `bson:"coverImage,omitempty" json:"coverImage,omitempty"`
	IsPublic    bool                 `bson:"isPublic" json:"isPublic"`
	IsFavorite  bool                 `bson:"isFavorite" json:"isFavorite"`
	Items       []primitive.ObjectID `bson:"items,omitempty" json:"items,omitempty"`
	SharedWith  []SharedWith         `bson:"sharedWith,omitempty" json:"sharedWith,omitempty"`
	CreatedAt   time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time            `bson:"updatedAt" json:"updatedAt"`
}

// SharedWith définit avec qui la wishlist est partagée et leurs permissions
type SharedWith struct {
	UserID     primitive.ObjectID `bson:"userId" json:"userId"`
	Permission string             `bson:"permission" json:"permission"` // view, edit, admin
	Status     string             `bson:"status" json:"status"`         // pending, accepted, declined
	SharedAt   time.Time          `bson:"sharedAt" json:"sharedAt"`
}

// WishItem définit un item dans une wishlist
type WishItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	WishlistID  primitive.ObjectID `bson:"wishlistId" json:"wishlistId"`
	UserID      primitive.ObjectID `bson:"userId" json:"userId"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	Price       float64            `bson:"price,omitempty" json:"price,omitempty"`
	Currency    string             `bson:"currency,omitempty" json:"currency,omitempty"`
	ImageURL    string             `bson:"imageUrl,omitempty" json:"imageUrl,omitempty"`
	Link        string             `bson:"link,omitempty" json:"link,omitempty"`
	IsFavorite  bool               `bson:"isFavorite" json:"isFavorite"`
	IsReserved  bool               `bson:"isReserved" json:"isReserved"`
	ReservedBy  primitive.ObjectID `bson:"reservedBy,omitempty" json:"reservedBy,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// WishlistResponse est la réponse pour une wishlist avec ses items
type WishlistResponse struct {
	ID          string              `json:"id"`
	UserID      string              `json:"userId"`
	Title       string              `json:"title"`
	Description string              `json:"description,omitempty"`
	CoverImage  string              `json:"coverImage,omitempty"`
	IsPublic    bool                `json:"isPublic"`
	IsFavorite  bool                `json:"isFavorite"`
	IsOwner     bool                `json:"isOwner"`
	SharedWith  []SharedWithResponse `json:"sharedWith,omitempty"`
	Items       []WishItemResponse  `json:"items,omitempty"`
	CreatedAt   time.Time           `json:"createdAt"`
	UpdatedAt   time.Time           `json:"updatedAt"`
}

// SharedWithResponse est la réponse pour les partages de wishlist
type SharedWithResponse struct {
	UserID     string    `json:"userId"`
	Permission string    `json:"permission"`
	Status     string    `json:"status"`
	SharedAt   time.Time `json:"sharedAt"`
	User       struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		AvatarURL string `json:"avatarUrl,omitempty"`
	} `json:"user,omitempty"`
}

// WishItemResponse est la réponse pour un item
type WishItemResponse struct {
	ID          string    `json:"id"`
	WishlistID  string    `json:"wishlistId"`
	UserID      string    `json:"userId"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Price       float64   `json:"price,omitempty"`
	Currency    string    `json:"currency,omitempty"`
	ImageURL    string    `json:"imageUrl,omitempty"`
	Link        string    `json:"link,omitempty"`
	IsFavorite  bool      `json:"isFavorite"`
	IsReserved  bool      `json:"isReserved"`
	ReservedBy  string    `json:"reservedBy,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CreateWishlistRequest est une demande de création de wishlist
type CreateWishlistRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description,omitempty"`
	CoverImage  string `json:"coverImage,omitempty"`
	IsPublic    bool   `json:"isPublic"`
	IsFavorite  bool   `json:"isFavorite"`
}

// UpdateWishlistRequest est une demande de mise à jour de wishlist
type UpdateWishlistRequest struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	CoverImage  string `json:"coverImage,omitempty"`
	IsPublic    *bool  `json:"isPublic,omitempty"`
	IsFavorite  *bool  `json:"isFavorite,omitempty"`
}

// CreateWishItemRequest est une demande de création d'item
type CreateWishItemRequest struct {
	WishlistID  string  `json:"wishlistId" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description,omitempty"`
	Price       float64 `json:"price,omitempty"`
	Currency    string  `json:"currency,omitempty"`
	ImageURL    string  `json:"imageUrl,omitempty"`
	Link        string  `json:"link,omitempty"`
	IsFavorite  bool    `json:"isFavorite"`
}

// UpdateWishItemRequest est une demande de mise à jour d'item
type UpdateWishItemRequest struct {
	Name        string  `json:"name,omitempty"`
	Description string  `json:"description,omitempty"`
	Price       float64 `json:"price,omitempty"`
	Currency    string  `json:"currency,omitempty"`
	ImageURL    string  `json:"imageUrl,omitempty"`
	Link        string  `json:"link,omitempty"`
	IsFavorite  *bool   `json:"isFavorite,omitempty"`
}

// ShareWishlistRequest est une demande de partage de wishlist
type ShareWishlistRequest struct {
	UserID     string `json:"userId" binding:"required"`
	Permission string `json:"permission" binding:"required"`
}

// ReserveWishItemRequest est une demande de réservation d'item
type ReserveWishItemRequest struct {
	Reserve bool `json:"reserve" binding:"required"`
}