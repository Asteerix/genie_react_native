package accounts

import (
	"context"
	"errors"
	"fmt"
	"time"

	"genie/internal/db"
	"genie/internal/models"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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

// GetUserBalance récupère le solde actuel d'un utilisateur
func (s *Service) GetUserBalance(ctx context.Context, userID string) (float64, error) {
	// Convertir l'ID utilisateur en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return 0, errors.New("ID utilisateur invalide")
	}

	// Récupérer l'utilisateur pour obtenir son solde
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{"_id": ownerID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return 0, errors.New("utilisateur non trouvé")
		}
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération de l'utilisateur")
		return 0, err
	}

	return user.Balance, nil
}

// AddFunds ajoute des fonds au solde d'un utilisateur
func (s *Service) AddFunds(ctx context.Context, userID string, amount float64) (float64, error) {
	if amount <= 0 {
		return 0, errors.New("le montant doit être supérieur à 0")
	}

	// Convertir l'ID utilisateur en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return 0, errors.New("ID utilisateur invalide")
	}

	now := time.Now()

	// Mettre à jour le solde de l'utilisateur
	result := s.db.Users.FindOneAndUpdate(
		ctx,
		bson.M{"_id": ownerID},
		bson.M{
			"$inc": bson.M{"balance": amount},
			"$set": bson.M{"updatedAt": now},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	if result.Err() != nil {
		if result.Err() == mongo.ErrNoDocuments {
			return 0, errors.New("utilisateur non trouvé")
		}
		log.Error().Err(result.Err()).Str("userID", userID).Float64("amount", amount).Msg("Erreur lors de l'ajout de fonds")
		return 0, result.Err()
	}

	var updatedUser models.User
	if err := result.Decode(&updatedUser); err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors du décodage de l'utilisateur mis à jour")
		return 0, err
	}

	// Créer une transaction pour l'ajout de fonds
	transaction := models.Transaction{
		ID:          primitive.NewObjectID(),
		UserID:      ownerID,
		Amount:      amount,
		Type:        "CREDIT",
		Description: "Ajout de fonds",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err = s.db.Transactions.InsertOne(ctx, transaction)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Float64("amount", amount).Msg("Erreur lors de l'enregistrement de la transaction")
		// On retourne quand même le solde mis à jour même si la transaction n'a pas pu être enregistrée
	}

	return updatedUser.Balance, nil
}

// TransferFunds transfère des fonds d'un utilisateur à un autre
func (s *Service) TransferFunds(ctx context.Context, senderID, recipientID string, amount float64, isManagedAccount bool) (float64, error) {
	if amount <= 0 {
		return 0, errors.New("le montant doit être supérieur à 0")
	}

	// Convertir les IDs en ObjectID
	senderObjID, err := primitive.ObjectIDFromHex(senderID)
	if err != nil {
		return 0, errors.New("ID expéditeur invalide")
	}

	recipientObjID, err := primitive.ObjectIDFromHex(recipientID)
	if err != nil {
		return 0, errors.New("ID destinataire invalide")
	}

	// Vérifier que l'expéditeur a suffisamment de fonds
	var sender models.User
	err = s.db.Users.FindOne(ctx, bson.M{"_id": senderObjID}).Decode(&sender)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return 0, errors.New("expéditeur non trouvé")
		}
		log.Error().Err(err).Str("senderID", senderID).Msg("Erreur lors de la récupération de l'expéditeur")
		return 0, err
	}

	if sender.Balance < amount {
		return 0, errors.New("solde insuffisant")
	}

	now := time.Now()

	// Préparer les informations du destinataire pour la transaction
	var recipientName, recipientAvatar string

	if isManagedAccount {
		// Récupérer le compte géré
		var managedAccount models.ManagedAccount
		err = s.db.ManagedAccounts.FindOne(ctx, bson.M{"_id": recipientObjID}).Decode(&managedAccount)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return 0, errors.New("compte géré non trouvé")
			}
			log.Error().Err(err).Str("recipientID", recipientID).Msg("Erreur lors de la récupération du compte géré")
			return 0, err
		}
		recipientName = fmt.Sprintf("%s %s", managedAccount.FirstName, managedAccount.LastName)
		recipientAvatar = managedAccount.AvatarURL
		if recipientAvatar == "" {
			recipientAvatar = managedAccount.ProfilePictureURL
		}
	} else {
		// Récupérer l'utilisateur destinataire
		var recipient models.User
		err = s.db.Users.FindOne(ctx, bson.M{"_id": recipientObjID}).Decode(&recipient)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return 0, errors.New("destinataire non trouvé")
			}
			log.Error().Err(err).Str("recipientID", recipientID).Msg("Erreur lors de la récupération du destinataire")
			return 0, err
		}
		recipientName = fmt.Sprintf("%s %s", recipient.FirstName, recipient.LastName)
		recipientAvatar = recipient.AvatarURL
		if recipientAvatar == "" {
			recipientAvatar = recipient.ProfilePictureURL
		}

		// Mettre à jour le solde du destinataire si ce n'est pas un compte géré
		_, err = s.db.Users.UpdateOne(
			ctx,
			bson.M{"_id": recipientObjID},
			bson.M{
				"$inc": bson.M{"balance": amount},
				"$set": bson.M{"updatedAt": now},
			},
		)
		if err != nil {
			log.Error().Err(err).Str("recipientID", recipientID).Float64("amount", amount).Msg("Erreur lors de la mise à jour du solde du destinataire")
			return 0, err
		}

		// Créer une transaction de crédit pour le destinataire
		recipientTransaction := models.Transaction{
			ID:              primitive.NewObjectID(),
			UserID:          recipientObjID,
			Amount:          amount,
			Type:            "CREDIT",
			Description:     fmt.Sprintf("Transfert reçu de %s %s", sender.FirstName, sender.LastName),
			RecipientID:     senderObjID,
			RecipientName:   fmt.Sprintf("%s %s", sender.FirstName, sender.LastName),
			RecipientAvatar: sender.AvatarURL,
			CreatedAt:       now,
			UpdatedAt:       now,
		}

		_, err = s.db.Transactions.InsertOne(ctx, recipientTransaction)
		if err != nil {
			log.Error().Err(err).Str("recipientID", recipientID).Float64("amount", amount).Msg("Erreur lors de l'enregistrement de la transaction du destinataire")
			// Continuer malgré l'erreur
		}
	}

	// Mettre à jour le solde de l'expéditeur
	result := s.db.Users.FindOneAndUpdate(
		ctx,
		bson.M{"_id": senderObjID},
		bson.M{
			"$inc": bson.M{"balance": -amount},
			"$set": bson.M{"updatedAt": now},
		},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	if result.Err() != nil {
		log.Error().Err(result.Err()).Str("senderID", senderID).Float64("amount", amount).Msg("Erreur lors de la mise à jour du solde de l'expéditeur")
		return 0, result.Err()
	}

	var updatedSender models.User
	if err := result.Decode(&updatedSender); err != nil {
		log.Error().Err(err).Str("senderID", senderID).Msg("Erreur lors du décodage de l'expéditeur mis à jour")
		return 0, err
	}

	// Créer une transaction de débit pour l'expéditeur
	senderTransaction := models.Transaction{
		ID:               primitive.NewObjectID(),
		UserID:           senderObjID,
		Amount:           amount,
		Type:             "DEBIT",
		Description:      fmt.Sprintf("Transfert à %s", recipientName),
		RecipientID:      recipientObjID,
		RecipientName:    recipientName,
		RecipientAvatar:  recipientAvatar,
		IsManagedAccount: isManagedAccount,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	_, err = s.db.Transactions.InsertOne(ctx, senderTransaction)
	if err != nil {
		log.Error().Err(err).Str("senderID", senderID).Float64("amount", amount).Msg("Erreur lors de l'enregistrement de la transaction de l'expéditeur")
		// On retourne quand même le solde mis à jour même si la transaction n'a pas pu être enregistrée
	}

	return updatedSender.Balance, nil
}

// GetUserTransactions récupère l'historique des transactions d'un utilisateur
func (s *Service) GetUserTransactions(ctx context.Context, userID string, limit, offset int64) (*models.TransactionListResponse, error) {
	// Convertir l'ID utilisateur en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide")
	}

	// Vérifier que l'utilisateur existe
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{"_id": ownerID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("utilisateur non trouvé")
		}
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération de l'utilisateur")
		return nil, err
	}

	// Compter le nombre total de transactions pour cet utilisateur
	total, err := s.db.Transactions.CountDocuments(ctx, bson.M{"userId": ownerID})
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors du comptage des transactions")
		return nil, err
	}

	// Si aucune transaction, retourner une liste vide
	if total == 0 {
		return &models.TransactionListResponse{
			Transactions: []models.TransactionResponse{},
			Total:        0,
		}, nil
	}

	// Récupérer les transactions avec pagination et tri par date de création (descendant)
	findOptions := options.Find().
		SetSort(bson.M{"createdAt": -1}).
		SetSkip(offset).
		SetLimit(limit)

	cursor, err := s.db.Transactions.Find(ctx, bson.M{"userId": ownerID}, findOptions)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors de la récupération des transactions")
		return nil, err
	}
	defer cursor.Close(ctx)

	// Décoder les résultats
	var transactions []models.Transaction
	if err := cursor.All(ctx, &transactions); err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Erreur lors du décodage des transactions")
		return nil, err
	}

	// Convertir en réponses
	var responses []models.TransactionResponse
	for _, transaction := range transactions {
		responses = append(responses, transaction.ToResponse())
	}

	return &models.TransactionListResponse{
		Transactions: responses,
		Total:        total,
	}, nil
}

// GetTransactionDetails récupère les détails d'une transaction spécifique
func (s *Service) GetTransactionDetails(ctx context.Context, userID, transactionID string) (*models.TransactionResponse, error) {
	// Convertir les IDs en ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide")
	}

	transID, err := primitive.ObjectIDFromHex(transactionID)
	if err != nil {
		return nil, errors.New("ID de transaction invalide")
	}

	// Récupérer la transaction spécifique pour cet utilisateur
	var transaction models.Transaction
	err = s.db.Transactions.FindOne(ctx, bson.M{
		"_id":    transID,
		"userId": ownerID,
	}).Decode(&transaction)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("transaction non trouvée ou non autorisée")
		}
		log.Error().Err(err).Str("userID", userID).Str("transactionID", transactionID).Msg("Erreur lors de la récupération de la transaction")
		return nil, err
	}

	// Convertir en réponse
	response := transaction.ToResponse()
	return &response, nil
}