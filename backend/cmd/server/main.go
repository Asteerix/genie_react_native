package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/asteerix/auth-backend/internal/accounts"
	"github.com/asteerix/auth-backend/internal/api"
	"github.com/asteerix/auth-backend/internal/auth"
	"github.com/asteerix/auth-backend/internal/db"
	"github.com/asteerix/auth-backend/internal/middleware"
	"github.com/asteerix/auth-backend/internal/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Configuration des logs
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	if os.Getenv("DEBUG") == "true" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	// Chargement des variables d'environnement
	if err := godotenv.Load(); err != nil {
		log.Info().Msg("Fichier .env non trouvé, utilisation des variables d'environnement du système")
	}

	// Configuration du mode Gin
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Récupération des variables d'environnement
	mongoURI := getEnv("MONGO_URI", "mongodb://localhost:27017")
	dbName := getEnv("DB_NAME", "auth")
	port := getEnv("PORT", "8080")
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key")
	jwtExpStr := getEnv("JWT_EXPIRATION", "24h")
	refreshExpStr := getEnv("REFRESH_EXPIRATION", "720h") // 30 jours
	sendgridAPIKey := getEnv("SENDGRID_API_KEY", "")
	fromEmail := getEnv("FROM_EMAIL", "noreply@example.com")
	fromName := getEnv("FROM_NAME", "Auth Service")
	verifyCodeExpStr := getEnv("VERIFY_CODE_EXPIRATION", "15m")
	appURL := getEnv("APP_URL", "http://localhost:3000")

	// Analyse des durées
	jwtExpiration := utils.GetDurationOrDefault(jwtExpStr, 24*time.Hour)
	refreshExpiration := utils.GetDurationOrDefault(refreshExpStr, 720*time.Hour)
	verifyCodeExpiration := utils.GetDurationOrDefault(verifyCodeExpStr, 15*time.Minute)

	// Connexion à la base de données
	database, err := db.NewDatabase(mongoURI, dbName)
	if err != nil {
		log.Fatal().Err(err).Msg("Erreur lors de la connexion à MongoDB")
	}
	defer func() {
		if err := database.Close(); err != nil {
			log.Error().Err(err).Msg("Erreur lors de la fermeture de la connexion MongoDB")
		}
	}()

	// Création des services
	authConfig := auth.Config{
		JWTSecret:            jwtSecret,
		JWTExpiration:        jwtExpiration,
		RefreshExpiration:    refreshExpiration,
		SendgridAPIKey:       sendgridAPIKey,
		FromEmail:            fromEmail,
		FromName:             fromName,
		VerifyCodeExpiration: verifyCodeExpiration,
		AppURL:               appURL,
	}
	authService := auth.NewService(database, authConfig)
	accountsService := accounts.NewService(database)

	// Configuration des middlewares
	middlewareManager := middleware.NewMiddleware(authService)
	authMiddleware := middlewareManager.AuthRequired()

	// Configuration du routeur Gin
	router := gin.Default()

	// Configuration CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Création des gestionnaires API
	authHandler := api.NewAuthHandler(authService)
	accountsHandler := api.NewAccountsHandler(accountsService)
	managedAccountsHandler := api.NewManagedAccountsHandler(accountsService)

	// Enregistrement des routes
	authHandler.RegisterRoutes(router, authMiddleware)
	accountsHandler.RegisterRoutes(router, authMiddleware)
	managedAccountsHandler.RegisterRoutes(router, authMiddleware)

	// Route de santé
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "UP",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// Configuration du serveur HTTP
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Démarrage du serveur en arrière-plan
	go func() {
		log.Info().Msgf("Serveur démarré sur le port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Erreur lors du démarrage du serveur")
		}
	}()

	// Configuration de l'arrêt gracieux
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info().Msg("Arrêt du serveur...")

	// Temps limite pour l'arrêt gracieux
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Erreur lors de l'arrêt du serveur")
	}

	log.Info().Msg("Serveur arrêté correctement")
}

// getEnv récupère une variable d'environnement ou renvoie une valeur par défaut
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}