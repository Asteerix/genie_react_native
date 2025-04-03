package utils

import (
	"fmt"

	"genie/internal/config"
	"github.com/rs/zerolog/log"
	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
)

// SMSService gère l'envoi de SMS
type SMSService struct {
	accountSID    string
	authToken     string
	phoneNumber   string
	environment   string
}

// NewSMSService crée une nouvelle instance du service SMS
func NewSMSService(cfg config.SMSConfig) *SMSService {
	return &SMSService{
		accountSID:    cfg.TwilioAccountSID,
		authToken:     cfg.TwilioAuthToken,
		phoneNumber:   cfg.TwilioPhoneNumber,
		environment:   "production", // À configurer selon l'environnement
	}
}

// SendSMS envoie un SMS à un numéro de téléphone
func (s *SMSService) SendSMS(to string, message string) error {
	// Si en développement et pas de clés API, on simule l'envoi
	if s.environment != "production" && (s.accountSID == "" || s.authToken == "") {
		log.Info().Str("to", to).Str("message", message).Msg("SIMULATION: SMS envoyé")
		return nil
	}

	// Vérifier la configuration
	if s.accountSID == "" || s.authToken == "" || s.phoneNumber == "" {
		log.Warn().Msg("Configuration Twilio incomplète, SMS non envoyé")
		return fmt.Errorf("configuration Twilio incomplète")
	}

	// Nettoyer le numéro de téléphone (s'assurer qu'il commence par +)
	if to[0] != '+' {
		to = "+" + to
	}

	// Initialiser le client Twilio
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: s.accountSID,
		Password: s.authToken,
	})

	// Créer le message
	params := &twilioApi.CreateMessageParams{}
	params.SetFrom(s.phoneNumber)
	params.SetTo(to)
	params.SetBody(message)

	// Envoyer le message
	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		log.Error().Err(err).Str("to", to).Msg("Erreur lors de l'envoi du SMS")
		return err
	}

	// Vérifier la réponse
	if resp.ErrorCode != nil {
		log.Error().Int("error_code", *resp.ErrorCode).Str("to", to).Msg("Erreur Twilio lors de l'envoi du SMS")
		return fmt.Errorf("erreur Twilio: %d", *resp.ErrorCode)
	}

	log.Info().Str("to", to).Str("sid", *resp.Sid).Msg("SMS envoyé avec succès")
	return nil
}

// SendWelcomeSMS envoie un SMS de bienvenue à un nouvel utilisateur
func (s *SMSService) SendWelcomeSMS(to string, name string) error {
	message := fmt.Sprintf("Bienvenue %s ! Nous sommes ravis de vous accueillir sur notre application. L'équipe de l'application", name)
	return s.SendSMS(to, message)
}

// SendPasswordReset envoie un SMS avec un code de réinitialisation de mot de passe
func (s *SMSService) SendPasswordReset(to string, code string) error {
	message := fmt.Sprintf("Votre code de réinitialisation de mot de passe est : %s. Valable pendant 15 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.", code)
	return s.SendSMS(to, message)
}

// SendVerificationCode envoie un code de vérification par SMS
func (s *SMSService) SendVerificationCode(to string, code string, purpose string) error {
	var message string
	switch purpose {
	case "phone_verification":
		message = fmt.Sprintf("Votre code de vérification de téléphone est : %s. Valable pendant 15 minutes.", code)
	case "two_factor":
		message = fmt.Sprintf("Votre code d'authentification à deux facteurs est : %s. Valable pendant 15 minutes.", code)
	default:
		message = fmt.Sprintf("Votre code de vérification est : %s. Valable pendant 15 minutes.", code)
	}
	return s.SendSMS(to, message)
}