package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User définit la structure d'un utilisateur dans l'application
type User struct {
	ID                primitive.ObjectID   `bson:"_id,omitempty" json:"id,omitempty"`
	Email             string               `bson:"email,omitempty" json:"email,omitempty"`
	Phone             string               `bson:"phone,omitempty" json:"phone,omitempty"`
	PasswordHash      string               `bson:"passwordHash,omitempty" json:"-"`
	FirstName         string               `bson:"firstName" json:"firstName"`
	LastName          string               `bson:"lastName" json:"lastName"`
	Gender            string               `bson:"gender,omitempty" json:"gender,omitempty"`
	BirthDate         time.Time            `bson:"birthDate,omitempty" json:"birthDate,omitempty"`
	AvatarURL         string               `bson:"avatarUrl,omitempty" json:"avatarUrl,omitempty"`
	ProfilePictureURL string               `bson:"profilePictureUrl,omitempty" json:"profilePictureUrl,omitempty"`
	ManagedAccounts   []primitive.ObjectID `bson:"managedAccounts,omitempty" json:"-"`
	SocialAuth        []SocialAuth         `bson:"socialAuth,omitempty" json:"-"`
	ResetToken        string               `bson:"resetToken,omitempty" json:"-"`
	ResetTokenExpires time.Time            `bson:"resetTokenExpires,omitempty" json:"-"`
	RefreshTokens     []RefreshToken       `bson:"refreshTokens,omitempty" json:"-"`
	IsVerified        bool                 `bson:"isVerified" json:"isVerified"`
	IsTwoFactorEnabled bool                `bson:"isTwoFactorEnabled" json:"isTwoFactorEnabled"`
	TwoFactorSecret   string               `bson:"twoFactorSecret,omitempty" json:"-"`
	CreatedAt         time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time            `bson:"updatedAt" json:"updatedAt"`
	LastLoginAt       time.Time            `bson:"lastLoginAt,omitempty" json:"lastLoginAt,omitempty"`
}

// SocialAuth définit les informations d'authentification sociale
type SocialAuth struct {
	Provider    string `bson:"provider" json:"provider"`
	UserID      string `bson:"userId" json:"userId"`
	AccessToken string `bson:"accessToken,omitempty" json:"-"`
	Email       string `bson:"email,omitempty" json:"email,omitempty"`
}

// RefreshToken définit la structure d'un token de rafraîchissement
type RefreshToken struct {
	Token     string    `bson:"token" json:"-"`
	ExpiresAt time.Time `bson:"expiresAt" json:"-"`
	IP        string    `bson:"ip,omitempty" json:"-"`
	UserAgent string    `bson:"userAgent,omitempty" json:"-"`
	IssuedAt  time.Time `bson:"issuedAt" json:"-"`
}

// UserResponse représente les données utilisateur retournées aux clients
type UserResponse struct {
	ID                string    `json:"id"`
	Email             string    `json:"email,omitempty"`
	Phone             string    `json:"phone,omitempty"`
	FirstName         string    `json:"firstName"`
	LastName          string    `json:"lastName"`
	Gender            string    `json:"gender,omitempty"`
	BirthDate         time.Time `json:"birthDate,omitempty"`
	AvatarURL         string    `json:"avatarUrl,omitempty"`
	ProfilePictureURL string    `json:"profilePictureUrl,omitempty"`
	IsVerified        bool      `json:"isVerified"`
	IsTwoFactorEnabled bool     `json:"isTwoFactorEnabled"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
	LastLoginAt       time.Time `json:"lastLoginAt,omitempty"`
}

// ToResponse convertit un User en UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:                u.ID.Hex(),
		Email:             u.Email,
		Phone:             u.Phone,
		FirstName:         u.FirstName,
		LastName:          u.LastName,
		Gender:            u.Gender,
		BirthDate:         u.BirthDate,
		AvatarURL:         u.AvatarURL,
		ProfilePictureURL: u.ProfilePictureURL,
		IsVerified:        u.IsVerified,
		IsTwoFactorEnabled: u.IsTwoFactorEnabled,
		CreatedAt:         u.CreatedAt,
		UpdatedAt:         u.UpdatedAt,
		LastLoginAt:       u.LastLoginAt,
	}
}

// CheckUserRequest représente une demande de vérification d'existence d'un utilisateur
type CheckUserRequest struct {
	EmailOrPhone string `json:"emailOrPhone" binding:"required"`
}

// CheckUserResponse représente une réponse de vérification d'existence d'un utilisateur
type CheckUserResponse struct {
	Exists bool `json:"exists"`
}

// SignInRequest représente une demande de connexion
type SignInRequest struct {
	EmailOrPhone string `json:"emailOrPhone" binding:"required"`
	Password     string `json:"password" binding:"required"`
}

// SignUpRequest représente une demande d'inscription
type SignUpRequest struct {
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Gender    string `json:"gender,omitempty"`
	BirthDate string `json:"birthDate,omitempty"`
}

// SocialLoginRequest représente une demande d'authentification sociale
type SocialLoginRequest struct {
	Provider    string `json:"provider" binding:"required"`
	Token       string `json:"token" binding:"required"`
	Email       string `json:"email,omitempty"`
	FirstName   string `json:"firstName,omitempty"`
	LastName    string `json:"lastName,omitempty"`
	AvatarURL   string `json:"avatarUrl,omitempty"`
	SocialID    string `json:"socialId,omitempty"`
}

// AuthResponse représente une réponse d'authentification
type AuthResponse struct {
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
	ExpiresIn    int64        `json:"expiresIn"` // En millisecondes
	User         UserResponse `json:"user"`
}

// RefreshTokenRequest représente une demande de rafraîchissement de token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// ResetPasswordRequest représente une demande de réinitialisation de mot de passe
type ResetPasswordRequest struct {
	EmailOrPhone string `json:"emailOrPhone" binding:"required"`
}

// VerifyCodeRequest représente une demande de vérification de code
type VerifyCodeRequest struct {
	EmailOrPhone string `json:"emailOrPhone" binding:"required"`
	Code         string `json:"code" binding:"required"`
}

// NewPasswordRequest représente une demande de changement de mot de passe
type NewPasswordRequest struct {
	EmailOrPhone string `json:"emailOrPhone" binding:"required"`
	Code         string `json:"code" binding:"required"`
	NewPassword  string `json:"newPassword" binding:"required,min=8"`
}

// UpdateProfileRequest représente une demande de mise à jour de profil
type UpdateProfileRequest struct {
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	Gender    string `json:"gender,omitempty"`
	BirthDate string `json:"birthDate,omitempty"`
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
}