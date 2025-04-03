package middleware

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"genie/internal/config"

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
	// Ajouter une marge pour la validation 'nbf' (Not Before) et 'exp' (Expires At)
	leeway := time.Second * 2
	log.Debug().Str("token", tokenString[:10]+"...").Msg(">>> VerifyAccessToken: Début de la vérification") // Log début avec juste le début du token pour sécurité

	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Vérifier la méthode de signature
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Error().Str("alg", fmt.Sprintf("%v", token.Header["alg"])).Msg("!!! VerifyAccessToken: Méthode de signature inattendue")
			return nil, fmt.Errorf("méthode de signature inattendue: %v", token.Header["alg"])
		}
		// Retourner la clé secrète
		log.Debug().Msg(">>> VerifyAccessToken: Utilisation de AccessSecret pour la vérification")
		return []byte(s.config.AccessSecret), nil
	}, jwt.WithLeeway(leeway), jwt.WithIssuer(s.config.Issuer)) // Ajouter la validation de l'issuer

	// Log après ParseWithClaims, avant la vérification de l'erreur
	log.Debug().Msg(">>> VerifyAccessToken: Après jwt.ParseWithClaims")

	if err != nil {
		// Log détaillé de l'erreur de parsing/validation JWT
		// Utiliser .Err(err) pour inclure l'erreur spécifique
		log.Error().Err(err).Msg("!!! VerifyAccessToken: jwt.ParseWithClaims a échoué")
		// Essayer de déterminer la nature de l'erreur
		if errors.Is(err, jwt.ErrTokenMalformed) {
			log.Error().Msg("!!! VerifyAccessToken: Erreur - Token malformé")
		} else if errors.Is(err, jwt.ErrTokenSignatureInvalid) {
			log.Error().Msg("!!! VerifyAccessToken: Erreur - Signature invalide")
		} else if errors.Is(err, jwt.ErrTokenExpired) || errors.Is(err, jwt.ErrTokenNotValidYet) {
			log.Warn().Msg("!!! VerifyAccessToken: Erreur - Token expiré ou pas encore valide")
		} else {
			log.Error().Msg("!!! VerifyAccessToken: Erreur inconnue lors du parsing/validation")
		}
		return nil, err // Retourner l'erreur originale
	}

	// Vérifier si les claims sont corrects et si le token est valide
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		log.Debug().Str("userID", claims.UserID).Msg(">>> VerifyAccessToken: Token valide et claims OK")
		return claims, nil
	}

	// Si on arrive ici, le token a été parsé mais token.Valid est false ou les claims ne sont pas du bon type
	claims, _ := token.Claims.(*JWTClaims) // Essayer de récupérer les claims même si invalide pour le log
	log.Error().Bool("token.Valid", token.Valid).Interface("claims", claims).Msg("!!! VerifyAccessToken: Token parsé mais invalide (token.Valid=false ou claims incorrects)")
	return nil, errors.New("token JWT invalide (parsed but not valid)")
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
			log.Error().Msg("AuthRequired: Service JWT non trouvé dans le contexte")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Service JWT non configuré"})
			return
		}

		service, ok := jwtService.(*JWTService)
		if !ok {
			log.Error().Msg("AuthRequired: Service JWT invalide dans le contexte")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Service JWT invalide"})
			return
		}

		var tokenString string

		// Vérifier d'abord le header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
				log.Debug().Msg(">>> AuthRequired: Token extrait du header Authorization")
			} else {
				log.Warn().Str("header", authHeader).Msg("AuthRequired: Format d'autorisation invalide")
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Format d'autorisation invalide"})
				return
			}
		} else {
			// Si pas de header ET c'est une requête WebSocket (Upgrade), vérifier le query param "token"
			isWebSocket := c.GetHeader("Upgrade") == "websocket" && c.GetHeader("Connection") == "Upgrade"
			if isWebSocket {
				tokenString = c.Query("token")
				if tokenString != "" {
					log.Debug().Msg(">>> AuthRequired: Token extrait du query param 'token' pour WebSocket")
				} else {
					log.Warn().Msg("AuthRequired: Token manquant pour la connexion WebSocket (ni header, ni query param)")
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token d'authentification WebSocket manquant"})
					return
				}
			} else {
				// Si ce n'est pas une requête WebSocket et qu'il n'y a pas de header, refuser
				log.Warn().Msg("AuthRequired: Header d'autorisation manquant (non-WebSocket)")
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Header d'autorisation manquant"})
				return
			}
		}

		// Vérifier le token
		log.Debug().Msg(">>> AuthRequired: Appel de VerifyAccessToken") // Log juste avant l'appel
		claims, err := service.VerifyAccessToken(tokenString)
		// Log après la vérification pour voir si on arrive ici
		log.Debug().Msg(">>> AuthRequired: Retour de VerifyAccessToken")
		if err != nil {
			// Le log détaillé est maintenant DANS VerifyAccessToken, on garde un log WARN ici
			// Utiliser .Err(err) pour inclure l'erreur spécifique
			log.Warn().Err(err).Msg("AuthRequired: Échec de la vérification du token d'accès")
			// Ajouter le détail de l'erreur JWT spécifique
			errMsg := "Token invalide ou expiré"

			// Vérifier les types d'erreurs JWT connus
			if errors.Is(err, jwt.ErrTokenMalformed) {
				errMsg = "Token JWT malformé"
			} else if errors.Is(err, jwt.ErrTokenSignatureInvalid) {
				errMsg = "Signature du token JWT invalide"
			} else if errors.Is(err, jwt.ErrTokenExpired) {
				errMsg = "Token JWT expiré"
			} else if errors.Is(err, jwt.ErrTokenNotValidYet) {
				errMsg = "Token JWT pas encore valide"
			} else {
				// Utiliser le message d'erreur original pour les autres cas
				errMsg = fmt.Sprintf("Erreur de vérification du token: %v", err.Error())
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Non autorisé", "details": errMsg})
			return
		}

		// Stocker l'ID de l'utilisateur dans le contexte
		log.Debug().Str("userID", claims.UserID).Msg(">>> AuthRequired: Authentification réussie, userID ajouté au contexte")
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
// SetJWTService est un middleware qui injecte une instance existante du service JWT dans le contexte
func SetJWTService(jwtService *JWTService) gin.HandlerFunc {
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

// GetUserIDFromContext récupère l'ID de l'utilisateur depuis le contexte Gin
func GetUserIDFromContext(c *gin.Context) string {
	userID, exists := c.Get(UserIDKey)
	if !exists {
		return ""
	}

	userIDStr, ok := userID.(string)
	if !ok {
		return ""
	}

	return userIDStr
}
