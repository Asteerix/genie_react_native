package utils

import (
	"fmt"

	"github.com/asteerix/auth-backend/internal/config"
	"github.com/rs/zerolog/log"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// EmailService gère l'envoi d'emails
type EmailService struct {
	apiKey      string
	fromEmail   string
	fromName    string
	environment string
}

// NewEmailService crée une nouvelle instance du service d'email
func NewEmailService(cfg config.EmailConfig) *EmailService {
	return &EmailService{
		apiKey:      cfg.SendgridAPIKey,
		fromEmail:   cfg.EmailFrom,
		fromName:    cfg.EmailFromName,
		environment: "production", // À configurer selon l'environnement
	}
}

// SendEmail envoie un email avec les informations fournies
func (s *EmailService) SendEmail(to, subject, plainContent, htmlContent string) error {
	// Si en développement et pas de clé API, on simule l'envoi
	if s.environment != "production" && s.apiKey == "" {
		log.Info().Str("to", to).Str("subject", subject).Msg("SIMULATION: Email envoyé")
		return nil
	}

	// Vérifier la configuration
	if s.apiKey == "" || s.fromEmail == "" {
		log.Warn().Msg("Configuration SendGrid incomplète, email non envoyé")
		return fmt.Errorf("configuration SendGrid incomplète")
	}

	// Créer un nouveau message
	from := mail.NewEmail(s.fromName, s.fromEmail)
	toEmail := mail.NewEmail("", to)
	message := mail.NewSingleEmail(from, subject, toEmail, plainContent, htmlContent)

	// Envoyer l'email
	client := sendgrid.NewSendClient(s.apiKey)
	response, err := client.Send(message)
	if err != nil {
		log.Error().Err(err).Str("to", to).Str("subject", subject).Msg("Erreur lors de l'envoi de l'email")
		return err
	}

	// Vérifier la réponse
	if response.StatusCode >= 400 {
		log.Error().Int("status_code", response.StatusCode).Str("to", to).Str("subject", subject).Msg("Erreur SendGrid lors de l'envoi de l'email")
		return fmt.Errorf("erreur SendGrid: %d %s", response.StatusCode, response.Body)
	}

	log.Info().Str("to", to).Str("subject", subject).Int("status_code", response.StatusCode).Msg("Email envoyé avec succès")
	return nil
}

// SendWelcomeEmail envoie un email de bienvenue à un nouvel utilisateur
func (s *EmailService) SendWelcomeEmail(to, name string) error {
	subject := "Bienvenue sur notre application"
	plainContent := fmt.Sprintf("Bonjour %s,\n\nNous sommes ravis de vous accueillir sur notre application. N'hésitez pas à explorer toutes nos fonctionnalités.\n\nL'équipe de l'application", name)
	
	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<title>Bienvenue sur notre application</title>
	</head>
	<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
			<h1 style="color: #4a6ee0;">Bienvenue !</h1>
			<p>Bonjour %s,</p>
			<p>Nous sommes ravis de vous accueillir sur notre application.</p>
			<p>N'hésitez pas à explorer toutes nos fonctionnalités.</p>
			<p>Cordialement,<br>L'équipe de l'application</p>
		</div>
	</body>
	</html>
	`, name)

	return s.SendEmail(to, subject, plainContent, htmlContent)
}

// SendPasswordReset envoie un email avec un code de réinitialisation de mot de passe
func (s *EmailService) SendPasswordReset(to, code string) error {
	subject := "Réinitialisation de votre mot de passe"
	plainContent := fmt.Sprintf("Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe. Voici votre code de réinitialisation : %s\n\nCe code est valable pendant 15 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.\n\nL'équipe de l'application", code)
	
	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<title>Réinitialisation de votre mot de passe</title>
	</head>
	<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
			<h1 style="color: #4a6ee0;">Réinitialisation de mot de passe</h1>
			<p>Bonjour,</p>
			<p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de réinitialisation :</p>
			<div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
				%s
			</div>
			<p>Ce code est valable pendant <strong>15 minutes</strong>.</p>
			<p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
			<p>Cordialement,<br>L'équipe de l'application</p>
		</div>
	</body>
	</html>
	`, code)

	return s.SendEmail(to, subject, plainContent, htmlContent)
}

// SendVerificationCode envoie un code de vérification par email
func (s *EmailService) SendVerificationCode(to, code, purpose string) error {
	var subject, plainContent, htmlContent string

	switch purpose {
	case "email_verification":
		subject = "Vérification de votre adresse email"
		plainContent = fmt.Sprintf("Bonjour,\n\nMerci de confirmer votre adresse email. Voici votre code de vérification : %s\n\nCe code est valable pendant 15 minutes.\n\nL'équipe de l'application", code)
		
		htmlContent = fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Vérification de votre adresse email</title>
		</head>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #4a6ee0;">Vérification d'email</h1>
				<p>Bonjour,</p>
				<p>Merci de confirmer votre adresse email. Voici votre code de vérification :</p>
				<div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
					%s
				</div>
				<p>Ce code est valable pendant <strong>15 minutes</strong>.</p>
				<p>Cordialement,<br>L'équipe de l'application</p>
			</div>
		</body>
		</html>
		`, code)

	case "two_factor":
		subject = "Code d'authentification à deux facteurs"
		plainContent = fmt.Sprintf("Bonjour,\n\nVoici votre code d'authentification à deux facteurs : %s\n\nCe code est valable pendant 15 minutes. Si vous n'avez pas tenté de vous connecter, veuillez sécuriser votre compte immédiatement.\n\nL'équipe de l'application", code)
		
		htmlContent = fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Code d'authentification à deux facteurs</title>
		</head>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #4a6ee0;">Code d'authentification</h1>
				<p>Bonjour,</p>
				<p>Voici votre code d'authentification à deux facteurs :</p>
				<div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
					%s
				</div>
				<p>Ce code est valable pendant <strong>15 minutes</strong>.</p>
				<p>Si vous n'avez pas tenté de vous connecter, veuillez sécuriser votre compte immédiatement.</p>
				<p>Cordialement,<br>L'équipe de l'application</p>
			</div>
		</body>
		</html>
		`, code)

	default:
		subject = "Votre code de vérification"
		plainContent = fmt.Sprintf("Bonjour,\n\nVoici votre code de vérification : %s\n\nCe code est valable pendant 15 minutes.\n\nL'équipe de l'application", code)
		
		htmlContent = fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Votre code de vérification</title>
		</head>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #4a6ee0;">Code de vérification</h1>
				<p>Bonjour,</p>
				<p>Voici votre code de vérification :</p>
				<div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
					%s
				</div>
				<p>Ce code est valable pendant <strong>15 minutes</strong>.</p>
				<p>Cordialement,<br>L'équipe de l'application</p>
			</div>
		</body>
		</html>
		`, code)
	}

	return s.SendEmail(to, subject, plainContent, htmlContent)
}

// SendAccountNotification envoie une notification concernant le compte
func (s *EmailService) SendAccountNotification(to, title, message string) error {
	plainContent := fmt.Sprintf("Bonjour,\n\n%s\n\nL'équipe de l'application", message)
	
	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<title>%s</title>
	</head>
	<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
			<h1 style="color: #4a6ee0;">%s</h1>
			<p>Bonjour,</p>
			<p>%s</p>
			<p>Cordialement,<br>L'équipe de l'application</p>
		</div>
	</body>
	</html>
	`, title, title, message)

	return s.SendEmail(to, title, plainContent, htmlContent)
}