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
	"github.com/asteerix/auth-backend/internal/config"
	"github.com/asteerix/auth-backend/internal/db"
	"github.com/asteerix/auth-backend/internal/middleware"
	"github.com/asteerix/auth-backend/internal/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Initialiser la configuration à partir des variables d'environnement
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Impossible de charger la configuration")
	}

	// Configuration du logging
	setupLogging(cfg.Server.Environment)
	
	// Initialiser la connexion à la base de données
	database, err := db.Connect(cfg.MongoDB)
	if err != nil {
		log.Fatal().Err(err).Msg("Impossible de se connecter à la base de données")
	}
	defer database.Disconnect(context.Background())

	// Configuration du mode Gin
	if cfg.Server.Environment != "development" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialiser le routeur
	router := gin.New()
	router.Use(gin.Recovery())
	
	// Middleware de logging détaillé
	router.Use(middleware.DetailedLoggingMiddleware())
	
	// Configuration CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.Server.CorsOrigins
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	corsConfig.AllowCredentials = true
	corsConfig.MaxAge = 12 * time.Hour
	router.Use(cors.New(corsConfig))
	
	// Initialiser le service JWT
	jwtService := middleware.NewJWTService(cfg.JWT)
	
	// Initialiser les services d'email et SMS
	emailService := utils.NewEmailService(cfg.Email)
	smsService := utils.NewSMSService(cfg.SMS)
	
	// Initialiser les services
	authService := auth.NewService(database, jwtService, emailService, smsService, cfg)
	accountsService := accounts.NewService(database)
	
	// Middleware d'authentification
	router.Use(middleware.SetJWTService(cfg.JWT))
	
	// Initialiser et enregistrer les handlers
	authHandler := api.NewAuthHandler(authService)
	accountsHandler := api.NewAccountsHandler(accountsService)
	
	// Créer un groupe de routes pour l'API
	apiRoutes := router.Group("/api")
	
	// Configurer les routes
	authHandler.RegisterRoutes(apiRoutes)
	accountsHandler.RegisterRoutes(apiRoutes)
	
	// Route de base pour vérifier que l'API fonctionne
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})
	
	// Démarrer le serveur HTTP
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}
	
	// Démarrer le serveur dans une goroutine
	go func() {
		log.Info().Str("port", cfg.Server.Port).Msg("Démarrage du serveur API")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Erreur lors du démarrage du serveur")
		}
	}()
	
	// Attendre un signal d'arrêt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info().Msg("Arrêt du serveur...")
	
	// Fermeture gracieuse du serveur
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Erreur lors de l'arrêt du serveur")
	}
	
	log.Info().Msg("Serveur arrêté")
}

// setupLogging configure le logging
func setupLogging(environment string) {
	// Configuration du format de log
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	
	// Par défaut, niveau info en production, debug en développement
	logLevel := zerolog.InfoLevel
	if environment == "development" {
		logLevel = zerolog.DebugLevel
	}
	zerolog.SetGlobalLevel(logLevel)
	
	// Logger en couleur en développement
	if environment == "development" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	}
}