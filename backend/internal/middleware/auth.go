package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/asteerix/auth-backend/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
)

// Clés de contexte
const (
	UserIDKey = "userID"
)

// JWTClaims représente les claims d'un token JWT
type JWTClaims struct {
	UserID string `json:"userId"`
	jwt.RegisteredClaims
}

// JWTService est le service d'authentification JWT
type JWTService struct {
	config config.JWTConfig
}

// NewJWTService crée une nouvelle instance du service JWT
func NewJWTService(cfg config.JWTConfig) *JWTService {
	return &JWTService{
		config: cfg,
	}
}

// GenerateAccessToken génère un nouveau token d'accès JWT
func (s *JWTService) GenerateAccessToken(userID string) (string, error) {
	now := time.Now()
	claims := JWTClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(s.config.AccessExpiryTime)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    s.config.Issuer,
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(s.config.AccessSecret))
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token d'accès")
		return "", err
	}

	return signedToken, nil
}

// GenerateRefreshToken génère un nouveau token de rafraîchissement JWT
func (s *JWTService) GenerateRefreshToken(userID string) (string, error) {
	now := time.Now()
	claims := JWTClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(s.config.RefreshExpiryTime)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    s.config.Issuer,
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(s.config.RefreshSecret))
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token de rafraîchissement")
		return "", err
	}

	return signedToken, nil
}

// VerifyAccessToken vérifie la validité d'un token d'accès
func (s *JWTService) VerifyAccessToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("méthode de signature inattendue")
		}
		return []byte(s.config.AccessSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token JWT invalide")
}

// VerifyRefreshToken vérifie la validité d'un token de rafraîchissement
func (s *JWTService) VerifyRefreshToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("méthode de signature inattendue")
		}
		return []byte(s.config.RefreshSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token de rafraîchissement invalide")
}

// AuthRequired est un middleware qui vérifie si l'utilisateur est authentifié
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer le service JWT et la configuration
		jwtService, exists := c.Get("jwtService")
		if !exists {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Service JWT non configuré"})
			return
		}

		service, ok := jwtService.(*JWTService)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Service JWT invalide"})
			return
		}

		// Extraire le token du header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Header d'autorisation manquant"})
			return
		}

		// Le format doit être "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Format d'autorisation invalide"})
			return
		}

		tokenString := parts[1]

		// Vérifier le token
		claims, err := service.VerifyAccessToken(tokenString)
		if err != nil {
			log.Debug().Err(err).Msg("Token d'accès invalide")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Non autorisé"})
			return
		}

		// Stocker l'ID de l'utilisateur dans le contexte
		c.Set(UserIDKey, claims.UserID)

		// Continuer l'exécution
		c.Next()
	}
}

// Optional est un middleware qui récupère l'identifiant de l'utilisateur s'il est authentifié,
// mais continue l'exécution même si l'utilisateur n'est pas authentifié
func Optional() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Récupérer le service JWT et la configuration
		jwtService, exists := c.Get("jwtService")
		if !exists {
			c.Next()
			return
		}

		service, ok := jwtService.(*JWTService)
		if !ok {
			c.Next()
			return
		}

		// Extraire le token du header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Le format doit être "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		tokenString := parts[1]

		// Vérifier le token
		claims, err := service.VerifyAccessToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		// Stocker l'ID de l'utilisateur dans le contexte
		c.Set(UserIDKey, claims.UserID)

		// Continuer l'exécution
		c.Next()
	}
}

// SetJWTService est un middleware qui initialise le service JWT
func SetJWTService(jwtConfig config.JWTConfig) gin.HandlerFunc {
	jwtService := NewJWTService(jwtConfig)
	return func(c *gin.Context) {
		c.Set("jwtService", jwtService)
		c.Next()
	}
}

// LoggingMiddleware est un middleware qui enregistre les requêtes HTTP
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		// Traitement de la requête
		c.Next()

		// Après le traitement, enregistrer la réponse
		end := time.Now()
		latency := end.Sub(start)

		status := c.Writer.Status()
		method := c.Request.Method
		ip := c.ClientIP()
		userAgent := c.Request.UserAgent()

		log.Info().
			Str("method", method).
			Str("path", path).
			Str("query", query).
			Int("status", status).
			Dur("latency", latency).
			Str("ip", ip).
			Str("user-agent", userAgent).
			Msg("API Request")
	}
}

// AuthMiddleware retourne un middleware d'authentification
func AuthMiddleware(authService interface{}) gin.HandlerFunc {
	return AuthRequired()
}