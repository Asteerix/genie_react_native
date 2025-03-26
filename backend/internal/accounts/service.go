package accounts

import (
	"context"
	"errors"
	"time"

	"github.com/asteerix/auth-backend/internal/db"
	"github.com/asteerix/auth-backend/internal/models"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Service fournit les fonctionnalités de gestion des comptes gérés
type Service struct {
	db *db.Database
}

// NewService crée une nouvelle instance du service de gestion des comptes
func NewService(database *db.Database) *Service {
	return &Service{
		db: database,
	}
}

// GetManagedAccounts récupère tous les comptes gérés pour un utilisateur donné
func (s *Service) GetManagedAccounts(ctx context.Context, userID string) ([]models.ManagedAccountResponse, error) {
	// Convertir l'ID utilisateur en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide")
	}

	// Récupérer l'utilisateur pour vérifier ses comptes gérés
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{"_id": ownerID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("utilisateur non trouvé")
		}
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération de l'utilisateur")
		return nil, err
	}

	// Si l'utilisateur n'a pas de comptes gérés
	if len(user.ManagedAccounts) == 0 {
		return []models.ManagedAccountResponse{}, nil
	}

	// Récupérer tous les comptes gérés de l'utilisateur
	cursor, err := s.db.ManagedAccounts.Find(ctx, bson.M{
		"_id": bson.M{"$in": user.ManagedAccounts},
	})
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération des comptes gérés")
		return nil, err
	}
	defer cursor.Close(ctx)

	// Décoder les résultats
	var managedAccounts []models.ManagedAccount
	if err := cursor.All(ctx, &managedAccounts); err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors du décodage des comptes gérés")
		return nil, err
	}

	// Convertir en réponses
	var responses []models.ManagedAccountResponse
	for _, account := range managedAccounts {
		responses = append(responses, account.ToResponse())
	}

	return responses, nil
}

// CreateManagedAccount crée un nouveau compte géré pour un utilisateur
func (s *Service) CreateManagedAccount(ctx context.Context, userID string, req models.ManagedAccountCreateRequest) (*models.ManagedAccountResponse, error) {
	// Convertir l'ID utilisateur en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide")
	}

	// Vérifier si l'utilisateur existe
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{"_id": ownerID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("utilisateur non trouvé")
		}
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération de l'utilisateur")
		return nil, err
	}

	// Préparer la date de naissance si fournie
	birthDate := time.Time{}
	if req.BirthDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.BirthDate)
		if err == nil {
			birthDate = parsedDate
		}
	}

	// Créer le nouveau compte géré
	now := time.Now()
	newAccount := models.ManagedAccount{
		ID:           primitive.NewObjectID(),
		OwnerID:      ownerID,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Gender:       req.Gender,
		BirthDate:    birthDate,
		Relationship: req.Relationship,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Insérer le compte géré dans la base de données
	_, err = s.db.ManagedAccounts.InsertOne(ctx, newAccount)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de l'insertion du nouveau compte géré")
		return nil, err
	}

	// Mettre à jour la liste des comptes gérés de l'utilisateur
	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": ownerID},
		bson.M{
			"$push": bson.M{
				"managedAccounts": newAccount.ID,
			},
			"$set": bson.M{
				"updatedAt": now,
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la mise à jour des comptes gérés de l'utilisateur")
		// Nettoyer: supprimer le compte géré créé puisque nous n'avons pas pu mettre à jour l'utilisateur
		_, _ = s.db.ManagedAccounts.DeleteOne(ctx, bson.M{"_id": newAccount.ID})
		return nil, err
	}
// Logging détaillé de la création du compte géré
log.Error().Msg("=== NOUVEAU COMPTE GÉRÉ CRÉÉ ===")
log.Error().Str("ID", newAccount.ID.Hex()).
	Str("ID Propriétaire", newAccount.OwnerID.Hex()).
	Str("Prénom", newAccount.FirstName).
	Str("Nom", newAccount.LastName).
	Str("Genre", newAccount.Gender).
	Time("Date de naissance", newAccount.BirthDate).
	Str("Relation", newAccount.Relationship).Msg("Informations compte géré")

// Check if account has avatar
if newAccount.AvatarURL != "" {
	log.Error().Str("ID", newAccount.ID.Hex()).
		Str("Avatar URL", newAccount.AvatarURL).Msg("AVATAR COMPTE GÉRÉ (pas de photo de profil)")
} else if newAccount.ProfilePictureURL != "" {
	log.Error().Str("ID", newAccount.ID.Hex()).
		Str("Photo URL", newAccount.ProfilePictureURL).Msg("PHOTO DE PROFIL COMPTE GÉRÉ (pas d'avatar)")
} else {
	log.Error().Str("ID", newAccount.ID.Hex()).Msg("Pas d'avatar ni de photo de profil pour ce compte géré")
}

log.Error().Msg("=== FIN CRÉATION COMPTE GÉRÉ ===")

// Convertir en réponse
response := newAccount.ToResponse()
return &response, nil
}

// GetManagedAccount récupère les détails d'un compte géré spécifique
func (s *Service) GetManagedAccount(ctx context.Context, userID, accountID string) (*models.ManagedAccountResponse, error) {
	// Convertir les IDs en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide")
	}

	accID, err := primitive.ObjectIDFromHex(accountID)
	if err != nil {
		return nil, errors.New("ID de compte géré invalide")
	}

	// Vérifier que l'utilisateur possède ce compte géré
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{
		"_id": ownerID,
		"managedAccounts": accID,
	}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("compte géré non trouvé ou non autorisé")
		}
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la vérification des droits")
		return nil, err
	}

	// Récupérer le compte géré
	var account models.ManagedAccount
	err = s.db.ManagedAccounts.FindOne(ctx, bson.M{"_id": accID}).Decode(&account)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("compte géré non trouvé")
		}
		log.Error().Err(err).Str("accountID", accountID).Msg("Erreur lors de la récupération du compte géré")
		return nil, err
	}

	// Convertir en réponse
	response := account.ToResponse()
	return &response, nil
}

// UpdateManagedAccount met à jour un compte géré existant
func (s *Service) UpdateManagedAccount(ctx context.Context, userID, accountID string, req models.ManagedAccountUpdateRequest) (*models.ManagedAccountResponse, error) {
	// Convertir les IDs en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide")
	}

	accID, err := primitive.ObjectIDFromHex(accountID)
	if err != nil {
		return nil, errors.New("ID de compte géré invalide")
	}

	// Vérifier que l'utilisateur possède ce compte géré
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{
		"_id": ownerID,
		"managedAccounts": accID,
	}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("compte géré non trouvé ou non autorisé")
		}
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la vérification des droits")
		return nil, err
	}

	// Préparer les champs à mettre à jour
	updates := bson.M{
		"updatedAt": time.Now(),
	}

	// Ne mettre à jour que les champs fournis
	if req.FirstName != "" {
		updates["firstName"] = req.FirstName
	}
	if req.LastName != "" {
		updates["lastName"] = req.LastName
	}
	if req.Gender != "" {
		updates["gender"] = req.Gender
	}
	if req.Relationship != "" {
		updates["relationship"] = req.Relationship
	}
	if req.BirthDate != "" {
		birthDate, err := time.Parse("2006-01-02", req.BirthDate)
		if err == nil {
			updates["birthDate"] = birthDate
		}
	}

	// Mettre à jour le compte géré
	result := s.db.ManagedAccounts.FindOneAndUpdate(
		ctx,
		bson.M{"_id": accID},
		bson.M{"$set": updates},
		nil,
	)

	if result.Err() != nil {
		if result.Err() == mongo.ErrNoDocuments {
			return nil, errors.New("compte géré non trouvé")
		}
		log.Error().Err(result.Err()).Str("accountID", accountID).Msg("Erreur lors de la mise à jour du compte géré")
		return nil, result.Err()
	}

	// Récupérer le compte géré mis à jour
	var updatedAccount models.ManagedAccount
	err = s.db.ManagedAccounts.FindOne(ctx, bson.M{"_id": accID}).Decode(&updatedAccount)
	if err != nil {
		log.Error().Err(err).Str("accountID", accountID).Msg("Erreur lors de la récupération du compte géré mis à jour")
		return nil, err
	}

	// Convertir en réponse
	response := updatedAccount.ToResponse()
	return &response, nil
}

// DeleteManagedAccount supprime un compte géré
func (s *Service) DeleteManagedAccount(ctx context.Context, userID, accountID string) error {
	// Convertir les IDs en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("ID utilisateur invalide")
	}

	accID, err := primitive.ObjectIDFromHex(accountID)
	if err != nil {
		return errors.New("ID de compte géré invalide")
	}

	// Vérifier que l'utilisateur possède ce compte géré
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{
		"_id": ownerID,
		"managedAccounts": accID,
	}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("compte géré non trouvé ou non autorisé")
		}
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la vérification des droits")
		return err
	}

	// Supprimer le compte géré
	_, err = s.db.ManagedAccounts.DeleteOne(ctx, bson.M{"_id": accID})
	if err != nil {
		log.Error().Err(err).Str("accountID", accountID).Msg("Erreur lors de la suppression du compte géré")
		return err
	}

	// Retirer le compte géré de la liste de l'utilisateur
	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": ownerID},
		bson.M{
			"$pull": bson.M{
				"managedAccounts": accID,
			},
			"$set": bson.M{
				"updatedAt": time.Now(),
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la mise à jour des comptes gérés de l'utilisateur")
		// Note: Le compte est déjà supprimé, nous ne pouvons pas revenir en arrière
		return err
	}

	return nil
}

// SetManagedAccountAvatar met à jour l'avatar d'un compte géré et réinitialise la photo de profil
func (s *Service) SetManagedAccountAvatar(ctx context.Context, userID, accountID, avatarURL string) error {
	// Convertir les IDs en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("ID utilisateur invalide")
	}

	accID, err := primitive.ObjectIDFromHex(accountID)
	if err != nil {
		return errors.New("ID de compte géré invalide")
	}

	// Vérifier que l'utilisateur possède ce compte géré
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{
		"_id": ownerID,
		"managedAccounts": accID,
	}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("compte géré non trouvé ou non autorisé")
		}
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la vérification des droits")
		return err
	}

	// Mettre à jour l'avatar et réinitialiser la photo de profil (exclusivité)
	now := time.Now()
	_, err = s.db.ManagedAccounts.UpdateOne(
		ctx,
		bson.M{"_id": accID},
		bson.M{
			"$set": bson.M{
				"avatarUrl":         avatarURL,
				"profilePictureUrl": "", // Réinitialiser la photo de profil
				"updatedAt":         now,
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Str("accountID", accountID).Msg("Erreur lors de la mise à jour de l'avatar")
		return err
	}

	log.Info().Str("ID", accountID).
		Str("URL Avatar", avatarURL).
		Msg("Avatar du compte géré mis à jour (photo de profil réinitialisée)")

	return nil
}

// SetManagedAccountProfilePicture met à jour la photo de profil d'un compte géré et réinitialise l'avatar
func (s *Service) SetManagedAccountProfilePicture(ctx context.Context, userID, accountID, profilePictureURL string) error {
	// Convertir les IDs en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("ID utilisateur invalide")
	}

	accID, err := primitive.ObjectIDFromHex(accountID)
	if err != nil {
		return errors.New("ID de compte géré invalide")
	}

	// Vérifier que l'utilisateur possède ce compte géré
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{
		"_id": ownerID,
		"managedAccounts": accID,
	}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("compte géré non trouvé ou non autorisé")
		}
		log.Error().Err(err).Str("userID", userID).Str("accountID", accountID).Msg("Erreur lors de la vérification des droits")
		return err
	}

	// Mettre à jour la photo de profil et réinitialiser l'avatar (exclusivité)
	now := time.Now()
	_, err = s.db.ManagedAccounts.UpdateOne(
		ctx,
		bson.M{"_id": accID},
		bson.M{
			"$set": bson.M{
				"profilePictureUrl": profilePictureURL,
				"avatarUrl":         "", // Réinitialiser l'avatar
				"updatedAt":         now,
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Str("accountID", accountID).Msg("Erreur lors de la mise à jour de la photo de profil")
		return err
	}

	log.Info().Str("ID", accountID).
		Str("URL Photo de profil", profilePictureURL).
		Msg("Photo de profil du compte géré mise à jour (avatar réinitialisé)")

	return nil
}