package db

import (
	"context"
	"fmt"
	"time"

	"github.com/asteerix/auth-backend/internal/config"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Database encapsule les collections MongoDB
type Database struct {
	client         *mongo.Client
	db             *mongo.Database
	Users          *mongo.Collection
	ManagedAccounts *mongo.Collection
}

// Connect se connecte à MongoDB et initialise les collections
func Connect(cfg config.MongoDBConfig) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Préparer les options de connexion
	clientOptions := options.Client().ApplyURI(cfg.URI)
	
	// Ajouter l'authentification si fournie
	if cfg.Username != "" && cfg.Password != "" {
		clientOptions.SetAuth(options.Credential{
			Username: cfg.Username,
			Password: cfg.Password,
		})
	}

	// Se connecter à MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("erreur lors de la connexion à MongoDB: %w", err)
	}

	// Vérifier la connexion
	if err = client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("erreur lors de la vérification de la connexion MongoDB: %w", err)
	}

	log.Info().Msg("Connexion à MongoDB établie avec succès")

	// Initialiser la base de données et les collections
	db := client.Database(cfg.Database)
	database := &Database{
		client:         client,
		db:             db,
		Users:          db.Collection("users"),
		ManagedAccounts: db.Collection("managed_accounts"),
	}

	return database, nil
}

// Disconnect ferme la connexion MongoDB
func (d *Database) Disconnect(ctx context.Context) error {
	if err := d.client.Disconnect(ctx); err != nil {
		return fmt.Errorf("erreur lors de la déconnexion de MongoDB: %w", err)
	}
	log.Info().Msg("Déconnexion de MongoDB réussie")
	return nil
}

// CreateIndexes crée les index nécessaires pour les performances et les contraintes d'unicité
func (d *Database) CreateIndexes(ctx context.Context) error {
	// Index pour les utilisateurs (email et téléphone doivent être uniques)
	userIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
		{
			Keys:    bson.D{{Key: "phone", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
		{
			Keys:    bson.D{{Key: "resetToken", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
		{
			Keys:    bson.D{{Key: "socialAuth.provider", Value: 1}, {Key: "socialAuth.userId", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
	}

	// Créer les index pour les utilisateurs
	_, err := d.Users.Indexes().CreateMany(ctx, userIndexes)
	if err != nil {
		return fmt.Errorf("erreur lors de la création des index utilisateurs: %w", err)
	}

	// Index pour les comptes gérés
	managedAccountsIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "ownerID", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
	}

	// Créer les index pour les comptes gérés
	_, err = d.ManagedAccounts.Indexes().CreateMany(ctx, managedAccountsIndexes)
	if err != nil {
		return fmt.Errorf("erreur lors de la création des index de comptes gérés: %w", err)
	}

	log.Info().Msg("Index MongoDB créés avec succès")
	return nil
}