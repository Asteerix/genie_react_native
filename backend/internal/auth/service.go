package auth

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/asteerix/auth-backend/internal/config"
	"github.com/asteerix/auth-backend/internal/db"
	"github.com/asteerix/auth-backend/internal/middleware"
	"github.com/asteerix/auth-backend/internal/models"
	"github.com/asteerix/auth-backend/internal/utils"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// Service fournit les fonctionnalités d'authentification
type Service struct {
	db          *db.Database
	jwtService  *middleware.JWTService
	emailService *utils.EmailService
	smsService  *utils.SMSService
	config     *config.Config
}

// NewService crée une nouvelle instance du service d'authentification
func NewService(database *db.Database, jwtService *middleware.JWTService, emailService *utils.EmailService, smsService *utils.SMSService, cfg *config.Config) *Service {
	return &Service{
		db:          database,
		jwtService:  jwtService,
		emailService: emailService,
		smsService:  smsService,
		config:     cfg,
	}
}

// CheckUserExists vérifie si un utilisateur existe avec l'email ou le téléphone fourni
func (s *Service) CheckUserExists(ctx context.Context, emailOrPhone string) (bool, error) {
	// Déterminer si c'est un email ou un numéro de téléphone
	var filter bson.M

	if isEmail(emailOrPhone) {
		filter = bson.M{"email": emailOrPhone}
	} else {
		filter = bson.M{"phone": normalizePhone(emailOrPhone)}
	}

	// Chercher l'utilisateur
	count, err := s.db.Users.CountDocuments(ctx, filter)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la vérification de l'existence de l'utilisateur")
		return false, err
	}

	return count > 0, nil
}

// SignIn authentifie un utilisateur et retourne les tokens d'accès et de rafraîchissement
func (s *Service) SignIn(ctx context.Context, req models.SignInRequest) (*models.AuthResponse, error) {
	// Chercher l'utilisateur par email ou téléphone
	var filter bson.M
	if isEmail(req.EmailOrPhone) {
		filter = bson.M{"email": req.EmailOrPhone}
	} else {
		filter = bson.M{"phone": normalizePhone(req.EmailOrPhone)}
	}

	var user models.User
	err := s.db.Users.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("identifiants invalides")
		}
		log.Error().Err(err).Msg("Erreur lors de la recherche de l'utilisateur")
		return nil, err
	}

	// Vérifier le mot de passe
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.New("identifiants invalides")
	}

	// Générer les tokens
	accessToken, err := s.jwtService.GenerateAccessToken(user.ID.Hex())
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token d'accès")
		return nil, err
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(user.ID.Hex())
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token de rafraîchissement")
		return nil, err
	}

	// Mettre à jour la dernière connexion et enregistrer le token de rafraîchissement
	now := time.Now()
	expiresAt := now.Add(s.config.JWT.RefreshExpiryTime)

	newRefreshToken := models.RefreshToken{
		Token:     refreshToken,
		ExpiresAt: expiresAt,
		IssuedAt:  now,
	}

	// Mise à jour de l'utilisateur
	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{
			"$set": bson.M{
				"lastLoginAt": now,
				"updatedAt":   now,
			},
			"$push": bson.M{
				"refreshTokens": newRefreshToken,
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour de l'utilisateur après connexion")
		return nil, err
	}

	// Préparer la réponse
	return &models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    utils.DurationToMilliseconds(s.config.JWT.AccessExpiryTime),
		User:         user.ToResponse(),
	}, nil
}

// SignUp crée un nouvel utilisateur
func (s *Service) SignUp(ctx context.Context, req models.SignUpRequest) (*models.AuthResponse, error) {
	// Valider les entrées
	if req.Email == "" && req.Phone == "" {
		return nil, errors.New("l'email ou le téléphone est requis")
	}

	if req.Password == "" {
		return nil, errors.New("le mot de passe est requis")
	}

	if len(req.Password) < s.config.Security.PasswordMinLength {
		return nil, fmt.Errorf("le mot de passe doit contenir au moins %d caractères", s.config.Security.PasswordMinLength)
	}

	// Vérifier si l'utilisateur existe déjà
	var existingCount int64
	var filter bson.M

	if req.Email != "" {
		if !isEmail(req.Email) {
			return nil, errors.New("format d'email invalide")
		}
		filter = bson.M{"email": req.Email}
	} else {
		normalizedPhone := normalizePhone(req.Phone)
		if normalizedPhone == "" {
			return nil, errors.New("format de téléphone invalide")
		}
		filter = bson.M{"phone": normalizedPhone}
		req.Phone = normalizedPhone
	}

	existingCount, err := s.db.Users.CountDocuments(ctx, filter)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la vérification de l'existence de l'utilisateur")
		return nil, err
	}

	if existingCount > 0 {
		if req.Email != "" {
			return nil, errors.New("un compte avec cet email existe déjà")
		}
		return nil, errors.New("un compte avec ce numéro de téléphone existe déjà")
	}

	// Hacher le mot de passe
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), s.config.Security.PasswordHashCost)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors du hachage du mot de passe")
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

	// Créer le nouvel utilisateur
	now := time.Now()
	newUser := models.User{
		ID:            primitive.NewObjectID(),
		Email:         req.Email,
		Phone:         req.Phone,
		PasswordHash:  string(hashedPassword),
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		Gender:        req.Gender,
		BirthDate:     birthDate,
		IsVerified:    false,
		ManagedAccounts: []primitive.ObjectID{},
		RefreshTokens: []models.RefreshToken{},
		CreatedAt:     now,
		UpdatedAt:     now,
		LastLoginAt:   now,
	}

	// Insérer l'utilisateur dans la base de données
	_, err = s.db.Users.InsertOne(ctx, newUser)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de l'insertion du nouvel utilisateur")
		return nil, err
	}

	// Envoyer un email ou SMS de bienvenue si configuré
	if req.Email != "" && s.emailService != nil {
		go s.emailService.SendWelcomeEmail(req.Email, req.FirstName)
	} else if req.Phone != "" && s.smsService != nil {
		go s.smsService.SendWelcomeSMS(req.Phone, req.FirstName)
	}

	// Générer les tokens
	accessToken, err := s.jwtService.GenerateAccessToken(newUser.ID.Hex())
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token d'accès")
		return nil, err
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(newUser.ID.Hex())
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token de rafraîchissement")
		return nil, err
	}

	// Enregistrer le token de rafraîchissement
	expiresAt := now.Add(s.config.JWT.RefreshExpiryTime)
	newRefreshToken := models.RefreshToken{
		Token:     refreshToken,
		ExpiresAt: expiresAt,
		IssuedAt:  now,
	}

	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": newUser.ID},
		bson.M{
			"$push": bson.M{
				"refreshTokens": newRefreshToken,
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de l'enregistrement du token de rafraîchissement")
		// On continue quand même car l'utilisateur est créé
	}

	// Log détaillé de l'inscription utilisateur dans le terminal avec fmt.Println pour plus de visibilité
	fmt.Println("\n\n")
	fmt.Println("====================================================")
	fmt.Println("============ NOUVELLE INSCRIPTION UTILISATEUR ======")
	fmt.Println("====================================================")
	fmt.Printf("ID: %s\n", newUser.ID.Hex())
	fmt.Printf("Prénom: %s\n", newUser.FirstName)
	fmt.Printf("Nom: %s\n", newUser.LastName)
	fmt.Printf("Genre: %s\n", newUser.Gender)
	
	if !birthDate.IsZero() {
		fmt.Printf("Date de naissance: %s\n", birthDate.Format("2006-01-02"))
	} else {
		fmt.Println("Date de naissance: Non spécifiée")
	}
	
	fmt.Printf("Email: %s\n", newUser.Email)
	fmt.Printf("Téléphone: %s\n", newUser.Phone)
	fmt.Printf("Vérifié: %t\n", newUser.IsVerified)
	
	// Information sur l'avatar ou la photo de profil
	if newUser.AvatarURL != "" {
		fmt.Printf("Avatar URL: %s\n", newUser.AvatarURL)
	} else if newUser.ProfilePictureURL != "" {
		fmt.Printf("Photo de profil URL: %s\n", newUser.ProfilePictureURL)
	} else {
		fmt.Println("Pas d'avatar ni de photo de profil")
	}
	
	// Récupération et affichage des comptes gérés
	fmt.Println("\n====================================================")
	fmt.Println("================= COMPTES GÉRÉS ====================")
	fmt.Println("====================================================")
	
	if len(newUser.ManagedAccounts) > 0 {
		fmt.Printf("Nombre total de comptes gérés: %d\n", len(newUser.ManagedAccounts))
		
		// Récupérer les détails complets des comptes gérés
		var managedAccounts []models.ManagedAccount
		cursor, err := s.db.Database.Collection("managedAccounts").Find(
			ctx,
			bson.M{"_id": bson.M{"$in": newUser.ManagedAccounts}},
		)
		
		if err == nil {
			if err = cursor.All(ctx, &managedAccounts); err == nil && len(managedAccounts) > 0 {
				for i, account := range managedAccounts {
					fmt.Printf("\n=== COMPTE GÉRÉ #%d ===\n", i+1)
					fmt.Printf("ID: %s\n", account.ID.Hex())
					fmt.Printf("Prénom: %s\n", account.FirstName)
					fmt.Printf("Nom: %s\n", account.LastName)
					fmt.Printf("Genre: %s\n", account.Gender)
					
					if !account.BirthDate.IsZero() {
						fmt.Printf("Date de naissance: %s\n", account.BirthDate.Format("2006-01-02"))
					} else {
						fmt.Println("Date de naissance: Non spécifiée")
					}
					
					fmt.Printf("Parent/Gardien: %s\n", account.UserID.Hex())
					
					// Information sur l'avatar ou la photo de profil du compte géré
					if account.AvatarURL != "" {
						fmt.Printf("Avatar URL: %s\n", account.AvatarURL)
					} else if account.ProfilePictureURL != "" {
						fmt.Printf("Photo de profil URL: %s\n", account.ProfilePictureURL)
					} else {
						fmt.Println("Pas d'avatar ni de photo de profil pour ce compte géré")
					}
					fmt.Println("-------------------------")
				}
			}
		}
		if len(managedAccounts) == 0 {
			fmt.Println("Aucun compte géré trouvé bien que ManagedAccounts ne soit pas vide")
		}
	} else {
		fmt.Println("Aucun compte géré")
	}

	// Récupération et affichage des demandes d'amis
	fmt.Println("\n====================================================")
	fmt.Println("================= DEMANDES D'AMIS ==================")
	fmt.Println("====================================================")
	
	var friendRequests []bson.M
	cursor, err := s.db.Database.Collection("friendRequests").Find(
		ctx,
		bson.M{"requesterId": newUser.ID},
	)
	
	if err == nil {
		if err = cursor.All(ctx, &friendRequests); err == nil && len(friendRequests) > 0 {
			fmt.Printf("Nombre total de demandes d'amis envoyées: %d\n", len(friendRequests))
			
			for i, request := range friendRequests {
				if recipientID, ok := request["recipientId"].(primitive.ObjectID); ok {
					fmt.Printf("\n=== DEMANDE D'AMI #%d ===\n", i+1)
					
					// Récupérer les informations de l'ami
					var friend models.User
					err := s.db.Users.FindOne(ctx, bson.M{"_id": recipientID}).Decode(&friend)
					if err == nil {
						fmt.Printf("ID: %s\n", recipientID.Hex())
						fmt.Printf("Prénom: %s\n", friend.FirstName)
						fmt.Printf("Nom: %s\n", friend.LastName)
						fmt.Printf("Email: %s\n", friend.Email)
						fmt.Printf("Téléphone: %s\n", friend.Phone)
						fmt.Printf("Statut: En attente\n")
						
						// Informations sur l'avatar ou photo de profil de l'ami
						if friend.AvatarURL != "" {
							fmt.Printf("Avatar URL: %s\n", friend.AvatarURL)
						} else if friend.ProfilePictureURL != "" {
							fmt.Printf("Photo de profil URL: %s\n", friend.ProfilePictureURL)
						}
					} else {
						fmt.Printf("De: %s\n", newUser.ID.Hex())
						fmt.Printf("À: %s\n", recipientID.Hex())
						fmt.Printf("Statut: En attente\n")
						fmt.Println("Détails du destinataire non disponibles")
					}
					
					// Afficher les détails supplémentaires de la demande si disponibles
					if createdAt, ok := request["createdAt"].(primitive.DateTime); ok {
						fmt.Printf("Date d'envoi: %s\n", createdAt.Time().Format("2006-01-02 15:04:05"))
					}
					
					fmt.Println("-------------------------")
				}
			}
		} else {
			fmt.Println("Aucune demande d'ami envoyée durant l'inscription")
		}
	} else {
		fmt.Println("Impossible de récupérer les demandes d'amis")
	}
	
	// Format console pour être bien visible
	fmt.Println("\n")
	fmt.Println("====================================================")
	fmt.Println("========== FIN INSCRIPTION UTILISATEUR =============")
	fmt.Println("====================================================")
	fmt.Println("\n")
	
	// Conserver également les logs structurés pour les logs de l'application
	log.Info().Str("ID", newUser.ID.Hex()).
		Str("Prénom", newUser.FirstName).
		Str("Nom", newUser.LastName).
		Str("Genre", newUser.Gender).
		Time("Date de naissance", newUser.BirthDate).
		Str("Email", newUser.Email).
		Str("Téléphone", newUser.Phone).
		Bool("Vérifié", newUser.IsVerified).Msg("NOUVELLE INSCRIPTION UTILISATEUR")
	fmt.Printf("Date de naissance: %s\n", newUser.BirthDate.Format("2006-01-02"))
	fmt.Printf("Email: %s\n", newUser.Email)
	fmt.Printf("Téléphone: %s\n", newUser.Phone)
	fmt.Printf("Compte vérifié: %t\n", newUser.IsVerified)
	
	// Informations sur l'avatar ou photo de profil
	if newUser.AvatarURL != "" {
		fmt.Printf("Avatar URL: %s (pas de photo de profil)\n", newUser.AvatarURL)
	} else if newUser.ProfilePictureURL != "" {
		fmt.Printf("Photo de profil URL: %s (pas d'avatar)\n", newUser.ProfilePictureURL)
	} else {
		fmt.Println("Pas d'avatar ni de photo de profil configuré")
	}

	// Récupération et affichage des comptes gérés
	fmt.Println("\n====================================================")
	fmt.Println("================= COMPTES GÉRÉS ====================")
	fmt.Println("====================================================")
	
	var managedAccounts []models.ManagedAccount
	if len(newUser.ManagedAccounts) > 0 {
		cursor, err := s.db.ManagedAccounts.Find(ctx, bson.M{"ownerId": newUser.ID})
		if err == nil {
			if err = cursor.All(ctx, &managedAccounts); err == nil && len(managedAccounts) > 0 {
				fmt.Printf("Nombre total de comptes gérés: %d\n", len(managedAccounts))
				for i, account := range managedAccounts {
					fmt.Printf("\n=== COMPTE GÉRÉ #%d ===\n", i+1)
					fmt.Printf("ID: %s\n", account.ID.Hex())
					fmt.Printf("Prénom: %s\n", account.FirstName)
					fmt.Printf("Nom: %s\n", account.LastName)
					fmt.Printf("Genre: %s\n", account.Gender)
					fmt.Printf("Date de naissance: %s\n", account.BirthDate.Format("2006-01-02"))
					fmt.Printf("Relation: %s\n", account.Relationship)
					
					// Informations sur l'avatar ou photo de profil du compte géré
					if account.AvatarURL != "" {
						fmt.Printf("Avatar URL: %s (pas de photo de profil)\n", account.AvatarURL)
					} else if account.ProfilePictureURL != "" {
						fmt.Printf("Photo de profil URL: %s (pas d'avatar)\n", account.ProfilePictureURL)
					} else {
						fmt.Println("Pas d'avatar ni de photo de profil pour ce compte géré")
					}
					fmt.Println("-------------------------")
				}
			}
		}
		if len(managedAccounts) == 0 {
			fmt.Println("Aucun compte géré trouvé bien que ManagedAccounts ne soit pas vide")
		}
	} else {
		fmt.Println("Aucun compte géré")
	}

	// Récupération et affichage des demandes d'amis
	fmt.Println("\n====================================================")
	fmt.Println("================= DEMANDES D'AMIS ==================")
	fmt.Println("====================================================")
	
	var friendRequests []bson.M
	cursor, err := s.db.Database.Collection("friendRequests").Find(
		ctx,
		bson.M{"requesterId": newUser.ID},
	)
	
	if err == nil {
		if err = cursor.All(ctx, &friendRequests); err == nil && len(friendRequests) > 0 {
			fmt.Printf("Nombre total de demandes d'amis envoyées: %d\n", len(friendRequests))
			
			for i, request := range friendRequests {
				if recipientID, ok := request["recipientId"].(primitive.ObjectID); ok {
					fmt.Printf("\n=== DEMANDE D'AMI #%d ===\n", i+1)
					
					// Récupérer les informations de l'ami
					var friend models.User
					err := s.db.Users.FindOne(ctx, bson.M{"_id": recipientID}).Decode(&friend)
					if err == nil {
						fmt.Printf("ID: %s\n", recipientID.Hex())
						fmt.Printf("Prénom: %s\n", friend.FirstName)
						fmt.Printf("Nom: %s\n", friend.LastName)
						fmt.Printf("Email: %s\n", friend.Email)
						fmt.Printf("Téléphone: %s\n", friend.Phone)
						fmt.Printf("Statut: En attente\n")
						
						// Informations sur l'avatar ou photo de profil de l'ami
						if friend.AvatarURL != "" {
							fmt.Printf("Avatar URL: %s\n", friend.AvatarURL)
						} else if friend.ProfilePictureURL != "" {
							fmt.Printf("Photo de profil URL: %s\n", friend.ProfilePictureURL)
						}
					} else {
						fmt.Printf("De: %s\n", newUser.ID.Hex())
						fmt.Printf("À: %s\n", recipientID.Hex())
						fmt.Printf("Statut: En attente\n")
						fmt.Println("Détails du destinataire non disponibles")
					}
					
					// Afficher les détails supplémentaires de la demande si disponibles
					if createdAt, ok := request["createdAt"].(primitive.DateTime); ok {
						fmt.Printf("Date d'envoi: %s\n", createdAt.Time().Format("2006-01-02 15:04:05"))
					}
					
					fmt.Println("-------------------------")
				}
			}
		} else {
			fmt.Println("Aucune demande d'ami envoyée durant l'inscription")
		}
	} else {
		fmt.Println("Impossible de récupérer les demandes d'amis")
	}
	
	// Format console pour être bien visible
	fmt.Println("\n")
	fmt.Println("====================================================")
	fmt.Println("========== FIN INSCRIPTION UTILISATEUR =============")
	fmt.Println("====================================================")
	fmt.Println("\n")
	
	// Conserver également les logs structurés pour les logs de l'application
	log.Info().Str("ID", newUser.ID.Hex()).
		Str("Prénom", newUser.FirstName).
		Str("Nom", newUser.LastName).
		Str("Genre", newUser.Gender).
		Time("Date de naissance", newUser.BirthDate).
		Str("Email", newUser.Email).
		Str("Téléphone", newUser.Phone).
		Bool("Vérifié", newUser.IsVerified).Msg("NOUVELLE INSCRIPTION UTILISATEUR")

	// Préparer la réponse
	return &models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    utils.DurationToMilliseconds(s.config.JWT.AccessExpiryTime),
		User:         newUser.ToResponse(),
	}, nil
}

// SocialLogin gère l'authentification par réseau social
func (s *Service) SocialLogin(ctx context.Context, req models.SocialLoginRequest) (*models.AuthResponse, error) {
	// Valider le fournisseur
	if !isValidSocialProvider(req.Provider) {
		return nil, fmt.Errorf("fournisseur social non pris en charge: %s", req.Provider)
	}

	// Note: Dans une implémentation réelle, il faudrait vérifier le token avec l'API du fournisseur
	// Pour ce prototype, nous supposons que le token est valide et que les informations fournies sont correctes

	// Chercher un utilisateur existant avec ce compte social
	var user models.User
	err := s.db.Users.FindOne(ctx, bson.M{
		"socialAuth": bson.M{
			"$elemMatch": bson.M{
				"provider": req.Provider,
				"userId":   req.SocialID,
			},
		},
	}).Decode(&user)

	now := time.Now()
	
	// Si l'utilisateur n'existe pas, en créer un nouveau
	if err == mongo.ErrNoDocuments {
		// Si l'email est fourni, vérifier s'il existe déjà un compte avec cet email
		if req.Email != "" {
			var existingUser models.User
			err = s.db.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
			
			if err == nil {
				// L'utilisateur existe déjà avec cet email, ajouter le compte social
				socialAuth := models.SocialAuth{
					Provider:    req.Provider,
					UserID:      req.SocialID,
					Email:       req.Email,
					AccessToken: req.Token,
				}

				_, err = s.db.Users.UpdateOne(
					ctx,
					bson.M{"_id": existingUser.ID},
					bson.M{
						"$push": bson.M{
							"socialAuth": socialAuth,
						},
						"$set": bson.M{
							"updatedAt": now,
							"lastLoginAt": now,
						},
					},
				)
				if err != nil {
					log.Error().Err(err).Msg("Erreur lors de l'ajout du compte social à l'utilisateur existant")
					return nil, err
				}

				user = existingUser
			} else if err != mongo.ErrNoDocuments {
				log.Error().Err(err).Msg("Erreur lors de la recherche de l'utilisateur par email")
				return nil, err
			} else {
				// Créer un nouvel utilisateur avec les informations sociales
				user = models.User{
					ID:            primitive.NewObjectID(),
					Email:         req.Email,
					FirstName:     req.FirstName,
					LastName:      req.LastName,
					AvatarURL:     req.AvatarURL,
					IsVerified:    true, // Présumer que l'authentification sociale confirme l'identité
					ManagedAccounts: []primitive.ObjectID{},
					RefreshTokens: []models.RefreshToken{},
					SocialAuth: []models.SocialAuth{
						{
							Provider:    req.Provider,
							UserID:      req.SocialID,
							Email:       req.Email,
							AccessToken: req.Token,
						},
					},
					CreatedAt:   now,
					UpdatedAt:   now,
					LastLoginAt: now,
				}

				_, err = s.db.Users.InsertOne(ctx, user)
				if err != nil {
					log.Error().Err(err).Msg("Erreur lors de la création d'un nouvel utilisateur via authentification sociale")
					return nil, err
				}
				
				// Log détaillé de l'inscription utilisateur via social avec email
				log.Info().Msg("====================================================")
				log.Info().Msg("==== NOUVELLE INSCRIPTION UTILISATEUR (SOCIAL) =====")
				log.Info().Msg("====================================================")
				log.Info().Str("ID", user.ID.Hex()).
					Str("Provider", req.Provider).
					Str("Prénom", user.FirstName).
					Str("Nom", user.LastName).
					Str("Genre", user.Gender).
					Time("Date de naissance", user.BirthDate).
					Str("Email", user.Email).
					Str("Téléphone", user.Phone).
					Bool("Vérifié", user.IsVerified).Msg("Informations utilisateur")
				
				// Informations sur l'avatar ou photo de profil
				if user.AvatarURL != "" {
					log.Info().Msgf("AVATAR: %s", user.AvatarURL)
				} else if user.ProfilePictureURL != "" {
					log.Info().Msgf("PHOTO DE PROFIL: %s", user.ProfilePictureURL)
				} else {
					log.Info().Msg("Pas d'avatar ni de photo de profil configuré")
				}
				
				log.Info().Msg("====================================================")
				log.Info().Msg("================= COMPTES GÉRÉS ====================")
				log.Info().Msg("====================================================")
				log.Info().Msg("Aucun compte géré (nouvelle inscription sociale)")
				
				log.Info().Msg("====================================================")
				log.Info().Msg("================= DEMANDES D'AMIS ==================")
				log.Info().Msg("====================================================")
				
				// Récupération et affichage des demandes d'amis
				var friendRequests []bson.M
				cursor, err := s.db.Database.Collection("friendRequests").Find(
					ctx,
					bson.M{"requesterId": user.ID},
				)
				
				if err == nil {
					if err = cursor.All(ctx, &friendRequests); err == nil && len(friendRequests) > 0 {
						log.Info().Msgf("Nombre total de demandes d'amis: %d", len(friendRequests))
						
						for i, request := range friendRequests {
							if recipientID, ok := request["recipientId"].(primitive.ObjectID); ok {
								// Récupérer les informations de l'ami
								var friend models.User
								err := s.db.Users.FindOne(ctx, bson.M{"_id": recipientID}).Decode(&friend)
								if err == nil {
									log.Info().Msgf("AMI #%d:", i+1)
									log.Info().Str("ID", recipientID.Hex()).
										Str("Prénom", friend.FirstName).
										Str("Nom", friend.LastName).
										Str("Statut", "En attente").
										Msg("Demande d'ami")
								} else {
									log.Info().Str("De", user.ID.Hex()).
										Str("À", recipientID.Hex()).
										Str("Statut", "En attente").
										Msg("Demande d'ami (détails non disponibles)")
								}
							}
						}
					} else {
						log.Info().Msg("Aucune demande d'ami trouvée")
					}
				} else {
					log.Info().Msg("Aucune demande d'ami trouvée dans le processus d'inscription sociale")
				}
				
				log.Info().Msg("====================================================")
				log.Info().Msg("========== FIN INSCRIPTION UTILISATEUR =============")
				log.Info().Msg("====================================================")
			}
		} else {
			// Créer un nouvel utilisateur avec les informations sociales sans email
			user = models.User{
				ID:            primitive.NewObjectID(),
				FirstName:     req.FirstName,
				LastName:      req.LastName,
				AvatarURL:     req.AvatarURL,
				IsVerified:    true, // Présumer que l'authentification sociale confirme l'identité
				ManagedAccounts: []primitive.ObjectID{},
				RefreshTokens: []models.RefreshToken{},
				SocialAuth: []models.SocialAuth{
					{
						Provider:    req.Provider,
						UserID:      req.SocialID,
						AccessToken: req.Token,
					},
				},
				CreatedAt:   now,
				UpdatedAt:   now,
				LastLoginAt: now,
			}

			_, err = s.db.Users.InsertOne(ctx, user)
			if err != nil {
				log.Error().Err(err).Msg("Erreur lors de la création d'un nouvel utilisateur via authentification sociale")
				return nil, err
			}
			
			// Log détaillé de l'inscription utilisateur via social sans email
			log.Info().Msg("====================================================")
			log.Info().Msg("==== NOUVELLE INSCRIPTION UTILISATEUR (SOCIAL) =====")
			log.Info().Msg("====================================================")
			log.Info().Str("ID", user.ID.Hex()).
				Str("Provider", req.Provider).
				Str("Prénom", user.FirstName).
				Str("Nom", user.LastName).
				Str("Genre", user.Gender).
				Time("Date de naissance", user.BirthDate).
				Bool("Vérifié", user.IsVerified).Msg("Informations utilisateur (sans email)")
			
			// Informations sur l'avatar ou photo de profil
			if user.AvatarURL != "" {
				log.Info().Msgf("AVATAR: %s", user.AvatarURL)
			} else if user.ProfilePictureURL != "" {
				log.Info().Msgf("PHOTO DE PROFIL: %s", user.ProfilePictureURL)
			} else {
				log.Info().Msg("Pas d'avatar ni de photo de profil configuré")
			}
			
			log.Info().Msg("====================================================")
			log.Info().Msg("================= COMPTES GÉRÉS ====================")
			log.Info().Msg("====================================================")
			log.Info().Msg("Aucun compte géré (nouvelle inscription sociale)")
			
			log.Info().Msg("====================================================")
			log.Info().Msg("================= DEMANDES D'AMIS ==================")
			log.Info().Msg("====================================================")
			
			// Récupération et affichage des demandes d'amis
			var friendRequests []bson.M
			cursor, err := s.db.Database.Collection("friendRequests").Find(
				ctx,
				bson.M{"requesterId": user.ID},
			)
			
			if err == nil {
				if err = cursor.All(ctx, &friendRequests); err == nil && len(friendRequests) > 0 {
					log.Info().Msgf("Nombre total de demandes d'amis: %d", len(friendRequests))
					
					for i, request := range friendRequests {
						if recipientID, ok := request["recipientId"].(primitive.ObjectID); ok {
							// Récupérer les informations de l'ami
							var friend models.User
							err := s.db.Users.FindOne(ctx, bson.M{"_id": recipientID}).Decode(&friend)
							if err == nil {
								log.Info().Msgf("AMI #%d:", i+1)
								log.Info().Str("ID", recipientID.Hex()).
									Str("Prénom", friend.FirstName).
									Str("Nom", friend.LastName).
									Str("Statut", "En attente").
									Msg("Demande d'ami")
							} else {
								log.Info().Str("De", user.ID.Hex()).
									Str("À", recipientID.Hex()).
									Str("Statut", "En attente").
									Msg("Demande d'ami (détails non disponibles)")
							}
						}
					}
				} else {
					log.Info().Msg("Aucune demande d'ami trouvée")
				}
			} else {
				log.Info().Msg("Aucune demande d'ami trouvée dans le processus d'inscription sociale")
			}
			
			log.Info().Msg("====================================================")
			log.Info().Msg("========== FIN INSCRIPTION UTILISATEUR =============")
			log.Info().Msg("====================================================")
		}
	} else if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la recherche de l'utilisateur par compte social")
		return nil, err
	} else {
		// L'utilisateur existe, mettre à jour le token d'accès social et la dernière connexion
		_, err = s.db.Users.UpdateOne(
			ctx,
			bson.M{
				"_id": user.ID,
				"socialAuth.provider": req.Provider,
				"socialAuth.userId": req.SocialID,
			},
			bson.M{
				"$set": bson.M{
					"socialAuth.$.accessToken": req.Token,
					"lastLoginAt": now,
					"updatedAt": now,
				},
			},
		)
		if err != nil {
			log.Error().Err(err).Msg("Erreur lors de la mise à jour du token d'accès social")
			// Continuer quand même car l'utilisateur est trouvé
		}
	}

	// Générer les tokens
	accessToken, err := s.jwtService.GenerateAccessToken(user.ID.Hex())
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token d'accès")
		return nil, err
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(user.ID.Hex())
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du token de rafraîchissement")
		return nil, err
	}

	// Enregistrer le token de rafraîchissement
	expiresAt := now.Add(s.config.JWT.RefreshExpiryTime)
	newRefreshToken := models.RefreshToken{
		Token:     refreshToken,
		ExpiresAt: expiresAt,
		IssuedAt:  now,
	}

	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{
			"$push": bson.M{
				"refreshTokens": newRefreshToken,
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de l'enregistrement du token de rafraîchissement")
		// Continuer quand même car l'utilisateur est authentifié
	}

	// Préparer la réponse
	return &models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    utils.DurationToMilliseconds(s.config.JWT.AccessExpiryTime),
		User:         user.ToResponse(),
	}, nil
}

// RefreshToken rafraîchit un token d'authentification
func (s *Service) RefreshToken(ctx context.Context, refreshToken string) (*models.AuthResponse, error) {
	// Vérifier le token
	claims, err := s.jwtService.VerifyRefreshToken(refreshToken)
	if err != nil {
		return nil, errors.New("token de rafraîchissement invalide")
	}

	userID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide dans le token")
	}

	// Vérifier si le token existe dans la base de données
	var user models.User
	err = s.db.Users.FindOne(ctx, bson.M{
		"_id": userID,
		"refreshTokens": bson.M{
			"$elemMatch": bson.M{
				"token": refreshToken,
				"expiresAt": bson.M{
					"$gt": time.Now(),
				},
			},
		},
	}).Decode(&user)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("token de rafraîchissement invalide ou expiré")
		}
		log.Error().Err(err).Msg("Erreur lors de la vérification du token de rafraîchissement")
		return nil, err
	}

	// Générer un nouveau token d'accès
	accessToken, err := s.jwtService.GenerateAccessToken(user.ID.Hex())
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la génération du nouveau token d'accès")
		return nil, err
	}

	// Préparer la réponse
	return &models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken, // Conserver le même token de rafraîchissement
		ExpiresIn:    utils.DurationToMilliseconds(s.config.JWT.AccessExpiryTime),
		User:         user.ToResponse(),
	}, nil
}

// SignOut déconnecte un utilisateur en révoquant son token de rafraîchissement
func (s *Service) SignOut(ctx context.Context, userID string, refreshToken string) error {
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("ID utilisateur invalide")
	}

	// Vérifier si un token de rafraîchissement spécifique a été fourni
	if refreshToken == "" {
		// Si aucun token spécifique n'est fourni, déconnecter toutes les sessions
		// en supprimant tous les tokens de rafraîchissement
		log.Info().Str("userID", userID).Msg("Déconnexion de toutes les sessions (refresh token non fourni)")
		
		_, err = s.db.Users.UpdateOne(
			ctx,
			bson.M{"_id": id},
			bson.M{
				"$set": bson.M{
					"refreshTokens": []models.RefreshToken{},
				},
			},
		)
	} else {
		// Supprimer uniquement le token de rafraîchissement spécifié
		log.Info().Str("userID", userID).Str("token", refreshToken[:10]+"...").Msg("Déconnexion d'une session spécifique")
		
		_, err = s.db.Users.UpdateOne(
			ctx,
			bson.M{"_id": id},
			bson.M{
				"$pull": bson.M{
					"refreshTokens": bson.M{
						"token": refreshToken,
					},
				},
			},
		)
	}
	
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la suppression du token de rafraîchissement")
		return err
	}

	return nil
}

// RequestPasswordReset initie une demande de réinitialisation de mot de passe
func (s *Service) RequestPasswordReset(ctx context.Context, emailOrPhone string) error {
	// Trouver l'utilisateur
	var filter bson.M
	var user models.User

	if isEmail(emailOrPhone) {
		filter = bson.M{"email": emailOrPhone}
	} else {
		filter = bson.M{"phone": normalizePhone(emailOrPhone)}
	}

	err := s.db.Users.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Pour des raisons de sécurité, ne pas révéler si l'utilisateur existe
			return nil
		}
		log.Error().Err(err).Msg("Erreur lors de la recherche de l'utilisateur pour réinitialisation")
		return err
	}

	// Générer un code de réinitialisation (6 chiffres)
	resetCode := generateRandomCode(6)
	
	// Calculer l'expiration
	expiresAt := time.Now().Add(s.config.Security.ResetTokenLifetime)

	// Mettre à jour l'utilisateur avec le token de réinitialisation
	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{
			"$set": bson.M{
				"resetToken":        resetCode,
				"resetTokenExpires": expiresAt,
				"updatedAt":         time.Now(),
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour du token de réinitialisation")
		return err
	}

	// Envoyer le code par email ou SMS
	if isEmail(emailOrPhone) && s.emailService != nil {
		return s.emailService.SendPasswordReset(emailOrPhone, resetCode)
	} else if s.smsService != nil {
		return s.smsService.SendPasswordReset(normalizePhone(emailOrPhone), resetCode)
	}

	return nil
}

// VerifyResetCode vérifie un code de réinitialisation
func (s *Service) VerifyResetCode(ctx context.Context, req models.VerifyCodeRequest) (bool, error) {
	// Trouver l'utilisateur
	var filter bson.M
	if isEmail(req.EmailOrPhone) {
		filter = bson.M{"email": req.EmailOrPhone}
	} else {
		filter = bson.M{"phone": normalizePhone(req.EmailOrPhone)}
	}

	var user models.User
	err := s.db.Users.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		log.Error().Err(err).Msg("Erreur lors de la recherche de l'utilisateur pour vérification du code")
		return false, err
	}

	// Vérifier le code et son expiration
	if user.ResetToken != req.Code || user.ResetTokenExpires.Before(time.Now()) {
		return false, nil
	}

	return true, nil
}

// ResetPassword réinitialise le mot de passe avec le code fourni
func (s *Service) ResetPassword(ctx context.Context, req models.NewPasswordRequest) error {
	// Trouver l'utilisateur
	var filter bson.M
	if isEmail(req.EmailOrPhone) {
		filter = bson.M{"email": req.EmailOrPhone}
	} else {
		filter = bson.M{"phone": normalizePhone(req.EmailOrPhone)}
	}

	var user models.User
	err := s.db.Users.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("utilisateur non trouvé")
		}
		log.Error().Err(err).Msg("Erreur lors de la recherche de l'utilisateur pour réinitialisation du mot de passe")
		return err
	}

	// Vérifier le code et son expiration
	if user.ResetToken != req.Code || user.ResetTokenExpires.Before(time.Now()) {
		return errors.New("code de réinitialisation invalide ou expiré")
	}

	// Valider le nouveau mot de passe
	if len(req.NewPassword) < s.config.Security.PasswordMinLength {
		return fmt.Errorf("le mot de passe doit contenir au moins %d caractères", s.config.Security.PasswordMinLength)
	}

	// Hacher le nouveau mot de passe
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), s.config.Security.PasswordHashCost)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors du hachage du nouveau mot de passe")
		return err
	}

	// Mettre à jour l'utilisateur
	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{
			"$set": bson.M{
				"passwordHash":      string(hashedPassword),
				"resetToken":        "",
				"resetTokenExpires": time.Time{},
				"updatedAt":         time.Now(),
				// Supprimer tous les tokens de rafraîchissement pour forcer la reconnexion
				"refreshTokens":     []models.RefreshToken{},
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour du mot de passe")
		return err
	}

	return nil
}

// UpdateProfile met à jour le profil d'un utilisateur
func (s *Service) UpdateProfile(ctx context.Context, userID string, req models.UpdateProfileRequest) (*models.UserResponse, error) {
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("ID utilisateur invalide")
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
	if req.BirthDate != "" {
		birthDate, err := time.Parse("2006-01-02", req.BirthDate)
		if err == nil {
			updates["birthDate"] = birthDate
		}
	}

	// Vérifier si l'email ou le téléphone existent déjà s'ils sont fournis
	if req.Email != "" {
		if !isEmail(req.Email) {
			return nil, errors.New("format d'email invalide")
		}

		// Vérifier si un autre utilisateur utilise déjà cet email
		existingCount, err := s.db.Users.CountDocuments(ctx, bson.M{
			"email": req.Email,
			"_id": bson.M{"$ne": id},
		})
		if err != nil {
			log.Error().Err(err).Msg("Erreur lors de la vérification de l'unicité de l'email")
			return nil, err
		}
		if existingCount > 0 {
			return nil, errors.New("cet email est déjà utilisé")
		}

		updates["email"] = req.Email
		updates["isVerified"] = false // L'email doit être vérifié à nouveau
	}

	if req.Phone != "" {
		normalizedPhone := normalizePhone(req.Phone)
		if normalizedPhone == "" {
			return nil, errors.New("format de téléphone invalide")
		}

		// Vérifier si un autre utilisateur utilise déjà ce téléphone
		existingCount, err := s.db.Users.CountDocuments(ctx, bson.M{
			"phone": normalizedPhone,
			"_id": bson.M{"$ne": id},
		})
		if err != nil {
			log.Error().Err(err).Msg("Erreur lors de la vérification de l'unicité du téléphone")
			return nil, err
		}
		if existingCount > 0 {
			return nil, errors.New("ce numéro de téléphone est déjà utilisé")
		}

		updates["phone"] = normalizedPhone
	}

	// Mettre à jour l'utilisateur
	result := s.db.Users.FindOneAndUpdate(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": updates},
		nil,
	)

	if result.Err() != nil {
		if result.Err() == mongo.ErrNoDocuments {
			return nil, errors.New("utilisateur non trouvé")
		}
		log.Error().Err(result.Err()).Msg("Erreur lors de la mise à jour du profil")
		return nil, result.Err()
	}

	// Récupérer l'utilisateur mis à jour
	var updatedUser models.User
	err = s.db.Users.FindOne(ctx, bson.M{"_id": id}).Decode(&updatedUser)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la récupération de l'utilisateur mis à jour")
		return nil, err
	}

	// Convertir en réponse
	userResponse := updatedUser.ToResponse()
	return &userResponse, nil
}

// SetAvatar met à jour l'avatar d'un utilisateur et réinitialise la photo de profil
func (s *Service) SetAvatar(ctx context.Context, userID string, avatarURL string) error {
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("ID utilisateur invalide")
	}

	// Quand on définit un avatar, on réinitialise la photo de profil
	// puisque l'utilisateur ne peut avoir qu'un des deux
	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"avatarUrl":         avatarURL,
				"profilePictureUrl": "",
				"updatedAt":         time.Now(),
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour de l'avatar")
		return err
	}

	log.Info().Str("userID", userID).Str("avatarURL", avatarURL).Msg("Avatar d'utilisateur mis à jour, photo de profil réinitialisée")

	return nil
}

// SetProfilePicture met à jour la photo de profil d'un utilisateur et réinitialise l'avatar
func (s *Service) SetProfilePicture(ctx context.Context, userID string, profilePictureURL string) error {
	id, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("ID utilisateur invalide")
	}

	// Quand on définit une photo de profil, on réinitialise l'avatar
	// puisque l'utilisateur ne peut avoir qu'un des deux
	_, err = s.db.Users.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"profilePictureUrl": profilePictureURL,
				"avatarUrl":         "",
				"updatedAt":         time.Now(),
			},
		},
	)
	if err != nil {
		log.Error().Err(err).Msg("Erreur lors de la mise à jour de la photo de profil")
		return err
	}

	log.Info().Str("userID", userID).Str("profilePictureURL", profilePictureURL).Msg("Photo de profil d'utilisateur mise à jour, avatar réinitialisé")

	return nil
}

// Fonctions utilitaires

// isEmail vérifie si une chaîne est un email valide
func isEmail(s string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(s)
}

// normalizePhone normalise un numéro de téléphone
func normalizePhone(phone string) string {
	// Supprimer tous les caractères non numériques
	phoneRegex := regexp.MustCompile(`[^0-9+]`)
	normalized := phoneRegex.ReplaceAllString(phone, "")
	
	// Assurer que le numéro commence par "+"
	if !strings.HasPrefix(normalized, "+") {
		// Supposer que c'est un numéro français si pas d'indicatif
		if strings.HasPrefix(normalized, "0") {
			normalized = "+33" + normalized[1:]
		} else {
			normalized = "+" + normalized
		}
	}
	
	return normalized
}

// generateRandomCode génère un code numérique aléatoire de longueur spécifiée
func generateRandomCode(length int) string {
	rand.Seed(time.Now().UnixNano())
	digits := "0123456789"
	code := make([]byte, length)
	for i := 0; i < length; i++ {
		code[i] = digits[rand.Intn(len(digits))]
	}
	return string(code)
}

// isValidSocialProvider vérifie si le fournisseur d'authentification sociale est pris en charge
func isValidSocialProvider(provider string) bool {
	validProviders := []string{"google", "apple", "facebook", "twitter"}
	for _, p := range validProviders {
		if p == provider {
			return true
		}
	}
	return false
}