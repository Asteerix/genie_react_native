package db

import (
	"context"
	"fmt"
	"time"

	"genie/internal/config"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Database encapsule les collections MongoDB
type Database struct {
	Client          *mongo.Client
	DB              *mongo.Database
	Users           *mongo.Collection
	ManagedAccounts *mongo.Collection
	Chats           *mongo.Collection
	Messages        *mongo.Collection
	Transactions    *mongo.Collection
}

// NewDatabase creates a new database connection
func NewDatabase(uri, dbName string) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Préparer les options de connexion
	clientOptions := options.Client().ApplyURI(uri)
	
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
	db := client.Database(dbName)
	database := &Database{
		Client:          client,
		DB:              db,
		Users:           db.Collection("users"),
		ManagedAccounts: db.Collection("managed_accounts"),
		Chats:           db.Collection("chats"),
		Messages:        db.Collection("messages"),
		Transactions:    db.Collection("transactions"),
	}

	return database, nil
}

// Connect se connecte à MongoDB et initialise les collections
func Connect(cfg config.MongoDBConfig) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Déterminer l'URI à utiliser (CLI flag a priorité)
	uriToUse := cfg.URI // Default to env var URI
	if cfg.CLI_URI != "" {
		uriToUse = cfg.CLI_URI
		log.Info().Str("mongo_uri", uriToUse).Msg("Utilisation de l'URI MongoDB fournie par le flag CLI")
	} else {
		log.Info().Str("mongo_uri", uriToUse).Msg("Utilisation de l'URI MongoDB depuis l'environnement ou la valeur par défaut")
	}

	// Préparer les options de connexion
	clientOptions := options.Client().ApplyURI(uriToUse)

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
		Client:          client,
		DB:              db,
		Users:           db.Collection("users"),
		ManagedAccounts: db.Collection("managed_accounts"),
		Chats:           db.Collection("chats"),
		Messages:        db.Collection("messages"),
		Transactions:    db.Collection("transactions"),
	}

	return database, nil
}

// Disconnect ferme la connexion MongoDB
func (d *Database) Disconnect(ctx context.Context) error {
	if err := d.Client.Disconnect(ctx); err != nil {
		return fmt.Errorf("erreur lors de la déconnexion de MongoDB: %w", err)
	}
	log.Info().Msg("Déconnexion de MongoDB réussie")
	return nil
}

// Close closes the database connection
func (d *Database) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return d.Disconnect(ctx)
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

	// Index pour les chats
	chatsIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "participants", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
		{
			Keys:    bson.D{{Key: "type", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
		{
			Keys:    bson.D{{Key: "eventId", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
	}

	// Créer les index pour les chats
	_, err = d.Chats.Indexes().CreateMany(ctx, chatsIndexes)
	if err != nil {
		return fmt.Errorf("erreur lors de la création des index de chats: %w", err)
	}

	// Index pour les messages
	messagesIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "chatId", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "senderId", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
		{
			Keys:    bson.D{{Key: "createdAt", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "chatId", Value: 1}, {Key: "createdAt", Value: -1}},
			Options: options.Index(),
		},
	}

	// Créer les index pour les messages
	_, err = d.Messages.Indexes().CreateMany(ctx, messagesIndexes)
	if err != nil {
		return fmt.Errorf("erreur lors de la création des index de messages: %w", err)
	}

	// Index pour les transactions
	transactionsIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "userId", Value: 1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "createdAt", Value: -1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "userId", Value: 1}, {Key: "createdAt", Value: -1}},
			Options: options.Index(),
		},
		{
			Keys:    bson.D{{Key: "recipientId", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
		{
			Keys:    bson.D{{Key: "type", Value: 1}},
			Options: options.Index(),
		},
	}

	// Créer les index pour les transactions
	_, err = d.Transactions.Indexes().CreateMany(ctx, transactionsIndexes)
	if err != nil {
		return fmt.Errorf("erreur lors de la création des index de transactions: %w", err)
	}

	log.Info().Msg("Index MongoDB créés avec succès")
	return nil
}