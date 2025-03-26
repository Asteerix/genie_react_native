package api

import (
	"net/http"

	"github.com/asteerix/auth-backend/internal/auth"
	"github.com/asteerix/auth-backend/internal/middleware"
	"github.com/asteerix/auth-backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// AuthHandler gère les routes d'authentification
type AuthHandler struct {
	authService *auth.Service
}

// NewAuthHandler crée une nouvelle instance du gestionnaire d'authentification
func NewAuthHandler(authService *auth.Service) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// RegisterRoutes enregistre les routes d'authentification
func (h *AuthHandler) RegisterRoutes(router *gin.RouterGroup) {
	authRoutes := router.Group("/auth")
	{
		// Routes publiques (sans authentification)
		authRoutes.POST("/check", h.CheckUser)               // Vérifier si un utilisateur existe
		authRoutes.POST("/signin", h.SignIn)                 // Connexion
		authRoutes.POST("/signup", h.SignUp)                 // Inscription
		authRoutes.POST("/social", h.SocialLogin)            // Connexion sociale
		authRoutes.POST("/reset", h.RequestPasswordReset)    // Demande de réinitialisation du mot de passe
		authRoutes.POST("/verify-code", h.VerifyResetCode)   // Vérification du code de réinitialisation
		authRoutes.POST("/reset-password", h.ResetPassword)  // Réinitialisation du mot de passe
		authRoutes.POST("/refresh", h.RefreshToken)          // Rafraîchissement du token

		// Routes sécurisées (nécessitent une authentification)
		secured := authRoutes.Group("/")
		secured.Use(middleware.AuthRequired())
		{
			secured.POST("/signout", h.SignOut)              // Déconnexion
			secured.PUT("/profile", h.UpdateProfile)         // Mise à jour du profil
			secured.POST("/avatar", h.SetAvatar)             // Mise à jour de l'avatar
			secured.POST("/profile-picture", h.SetProfilePicture) // Mise à jour de la photo de profil
		}
	}
}

// CheckUser vérifie si un utilisateur existe avec l'email ou le téléphone donné
func (h *AuthHandler) CheckUser(c *gin.Context) {
	var req models.CheckUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	exists, err := h.authService.CheckUserExists(c.Request.Context(), req.EmailOrPhone)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la vérification de l'existence de l'utilisateur")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification de l'utilisateur"})
		return
	}

	c.JSON(http.StatusOK, models.CheckUserResponse{Exists: exists})
}

// SignIn authentifie un utilisateur
func (h *AuthHandler) SignIn(c *gin.Context) {
	var req models.SignInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	response, err := h.authService.SignIn(c.Request.Context(), req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la connexion")
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// SignUp crée un nouvel utilisateur
func (h *AuthHandler) SignUp(c *gin.Context) {
	var req models.SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	response, err := h.authService.SignUp(c.Request.Context(), req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de l'inscription")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// SocialLogin gère l'authentification par réseau social
func (h *AuthHandler) SocialLogin(c *gin.Context) {
	var req models.SocialLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	response, err := h.authService.SocialLogin(c.Request.Context(), req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la connexion sociale")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// RefreshToken rafraîchit un token d'authentification
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	response, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors du rafraîchissement du token")
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// SignOut déconnecte un utilisateur
func (h *AuthHandler) SignOut(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	var req models.RefreshTokenRequest
	refreshToken := ""
	
	// Essaye de lire le refresh token du corps de la requête, mais continue même si absent
	if err := c.ShouldBindJSON(&req); err == nil && req.RefreshToken != "" {
		refreshToken = req.RefreshToken
		log.Info().Str("userID", userID).Msg("Déconnexion avec refresh token spécifique")
	} else {
		// Si aucun refresh token fourni, on déconnecte quand même
		log.Warn().Str("userID", userID).Msg("Déconnexion sans refresh token spécifique")
		// Répondre avec succès même sans refresh token
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Déconnexion locale réussie"})
		return
	}

	// Appel au service avec le refresh token (qui peut être vide)
	err := h.authService.SignOut(c.Request.Context(), userID, refreshToken)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la déconnexion")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Déconnexion réussie"})
}

// RequestPasswordReset initie une réinitialisation de mot de passe
func (h *AuthHandler) RequestPasswordReset(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email ou téléphone requis"})
		return
	}

	err := h.authService.RequestPasswordReset(c.Request.Context(), req.EmailOrPhone)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la demande de réinitialisation de mot de passe")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'envoi du code de réinitialisation"})
		return
	}

	// Toujours indiquer succès, même si l'email/téléphone n'existe pas (sécurité)
	c.JSON(http.StatusOK, gin.H{"message": "Si l'email ou le téléphone existe, un code de réinitialisation a été envoyé"})
}

// VerifyResetCode vérifie un code de réinitialisation
func (h *AuthHandler) VerifyResetCode(c *gin.Context) {
	var req models.VerifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	valid, err := h.authService.VerifyResetCode(c.Request.Context(), req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la vérification du code")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification du code"})
		return
	}

	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code invalide ou expiré"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"valid": true})
}

// ResetPassword réinitialise le mot de passe avec le code fourni
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req models.NewPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	err := h.authService.ResetPassword(c.Request.Context(), req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la réinitialisation du mot de passe")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mot de passe réinitialisé avec succès"})
}

// UpdateProfile met à jour le profil d'un utilisateur
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides: " + err.Error()})
		return
	}

	userResponse, err := h.authService.UpdateProfile(c.Request.Context(), userID, req)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour du profil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, userResponse)
}

// SetAvatar met à jour l'avatar d'un utilisateur
func (h *AuthHandler) SetAvatar(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	var req struct {
		AvatarURL string `json:"avatarUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL d'avatar requise"})
		return
	}

	err := h.authService.SetAvatar(c.Request.Context(), userID, req.AvatarURL)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour de l'avatar")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Avatar mis à jour avec succès"})
}

// SetProfilePicture met à jour la photo de profil d'un utilisateur
func (h *AuthHandler) SetProfilePicture(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	var req struct {
		ProfilePictureURL string `json:"profilePictureUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL de photo de profil requise"})
		return
	}

	err := h.authService.SetProfilePicture(c.Request.Context(), userID, req.ProfilePictureURL)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour de la photo de profil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Photo de profil mise à jour avec succès"})
}