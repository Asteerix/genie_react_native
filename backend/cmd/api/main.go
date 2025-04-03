package main

import (
	"context"
	"flag" // Import flag package
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"genie/internal/accounts"
	"genie/internal/api"
	"genie/internal/auth"
	"genie/internal/config"
	"genie/internal/db"
	"genie/internal/events"
	"genie/internal/messaging"
	"genie/internal/middleware"
	"genie/internal/stories"
	"genie/internal/utils"
	"genie/internal/wishlist"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Définir les flags de ligne de commande
	mongoURIFlag := flag.String("mongo-uri", "", "MongoDB connection URI (overrides environment variable)")
	flag.Parse()

	// Initialiser la configuration à partir des variables d'environnement et des flags
	cfg, err := config.Load(*mongoURIFlag) // Pass the flag value to Load
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
	messagingService := messaging.NewService(database)
	wishlistService := wishlist.NewService(database, cfg)
	storiesService := stories.NewService(database.DB) // Initialiser le service de stories
	eventsService := events.NewService(database.DB)   // Initialiser le service d'événements

	// Middleware d'authentification
	// Passer l'instance unique jwtService au middleware
	router.Use(middleware.SetJWTService(jwtService))

	// Initialiser et enregistrer les handlers
	authHandler := api.NewAuthHandler(authService)
	accountsHandler := api.NewAccountsHandler(accountsService)
	friendsHandler := api.NewFriendsHandler(database)
	messagingHandler := api.NewMessagingHandler(messagingService)
	wishlistHandler := api.NewWishlistHandler(wishlistService)
	storiesHandler := api.NewStoriesHandler(storiesService) // Initialiser le handler de stories
	eventsHandler := events.NewHandler(eventsService)       // Initialiser le handler d'événements

	// Initialiser le handler du scraper avec mise à jour quotidienne
	scraperHandler := api.NewScraperHandler()

	// Commenté pour éviter une double mise à jour du cache
	// La mise à jour est déjà déclenchée dans ScraperManager.NewScraperManager()
	/*
		// Démarrer la mise à jour initiale du cache des produits en arrière-plan
		go func() {
			log.Info().Msg("Démarrage de la mise à jour initiale du cache des produits")
			time.Sleep(5 * time.Second) // Attendre que le serveur soit démarré
			scraperHandler.UpdateCache()
			log.Info().Msg("Mise à jour initiale du cache des produits terminée")
		}()
	*/

	// Créer un groupe de routes pour l'API
	apiRoutes := router.Group("/api")

	// Configurer les routes
	authHandler.RegisterRoutes(apiRoutes)
	accountsHandler.RegisterRoutes(apiRoutes)
	// Enregistrer les routes
	authMiddleware := middleware.AuthRequired()

	// Routes nécessitant le middleware comme argument
	friendsHandler.RegisterRoutes(apiRoutes, authMiddleware)
	messagingHandler.RegisterRoutes(apiRoutes, authMiddleware)
	messaging.SetupWebsocketHandler(messagingService, apiRoutes, authMiddleware)

	// Enregistrer d'abord le groupe /events spécifique
	eventsHandler.RegisterRoutes(apiRoutes.Group("/events", authMiddleware))

	// Ensuite, enregistrer les autres handlers sur le groupe /api authentifié de base
	authenticatedAPIRoutes := apiRoutes.Group("", authMiddleware)
	{ // Utiliser un bloc pour la clarté, même si pas strictement nécessaire
		wishlistHandler.RegisterRoutes(authenticatedAPIRoutes)                 // Le handler ajoute /wishlists
		api.RegisterTransactionRoutes(authenticatedAPIRoutes, accountsService) // Le handler ajoute /transactions
	}
	// Supprimer les accolades superflues
	// Routes de stories (enregistrées sur le routeur principal)
	storiesHandler.RegisterRoutes(router)
	// Routes de stories (enregistrées sur le routeur principal)

	// Les routes du scraper sont enregistrées via scraperHandler.RegisterRoutes ci-dessous

	// Supprimer l'enregistrement manuel des routes scraper (géré par RegisterRoutes ci-dessous)
	// Enregistrer les routes du scraper (supposées publiques)
	scraperHandler.RegisterRoutes(apiRoutes)

	// Les routes de transaction et websocket sont enregistrées ci-dessus avec leur middleware respectif

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

// getEnv récupère une variable d'environnement ou renvoie une valeur par défaut
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
