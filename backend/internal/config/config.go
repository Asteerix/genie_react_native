package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

// Config est la structure principale de configuration de l'application
type Config struct {
	Server   ServerConfig
	MongoDB  MongoDBConfig
	JWT      JWTConfig
	Email    EmailConfig
	SMS      SMSConfig
	Security SecurityConfig
	Storage  StorageConfig
}

// ServerConfig contient la configuration du serveur HTTP
type ServerConfig struct {
	Port            string
	Host            string
	Environment     string
	ShutdownTimeout time.Duration
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	CorsOrigins     []string
}

// MongoDBConfig contient la configuration de MongoDB
type MongoDBConfig struct {
	URI             string
	Database        string
	Username        string
	Password        string
	ConnectTimeout  time.Duration
	MaxPoolSize     uint64
	MinPoolSize     uint64
	MaxConnIdleTime time.Duration
}

// JWTConfig contient la configuration des JSON Web Tokens
type JWTConfig struct {
	AccessSecret        string
	RefreshSecret       string
	AccessExpiryTime    time.Duration
	RefreshExpiryTime   time.Duration
	Issuer              string
	AccessCookieName    string
	RefreshCookieName   string
	RefreshCookieSecure bool
	RefreshCookieHTTPOnly bool
}

// EmailConfig contient la configuration pour l'envoi d'emails
type EmailConfig struct {
	SendgridAPIKey string
	EmailFrom      string
	EmailFromName  string
}

// SMSConfig contient la configuration pour l'envoi de SMS
type SMSConfig struct {
	TwilioAccountSID  string
	TwilioAuthToken   string
	TwilioPhoneNumber string
}

// SecurityConfig contient les paramètres de sécurité
type SecurityConfig struct {
	PasswordMinLength  int
	PasswordHashCost   int
	ResetTokenLifetime time.Duration
	VerifyCodeLifetime time.Duration
}

// StorageConfig contient la configuration pour le stockage de fichiers
type StorageConfig struct {
	S3Bucket          string
	S3Region          string
	S3AccessKey       string
	S3SecretKey       string
	S3Endpoint        string
	StorageProvider   string
	MaxUploadSize     int64
	AvatarBucketPath  string
	MediaBucketPath   string
}

// Load charge la configuration à partir des variables d'environnement
func Load() (*Config, error) {
	// Charger les variables d'environnement depuis .env si le fichier existe
	if _, err := os.Stat(".env"); err == nil {
		if err := godotenv.Load(); err != nil {
			log.Warn().Err(err).Msg("Erreur lors du chargement du fichier .env")
		} else {
			log.Info().Msg("Fichier .env chargé avec succès")
		}
	}

	// Définir la configuration par défaut
	config := &Config{
		Server: ServerConfig{
			Port:            getEnv("SERVER_PORT", "8080"),
			Host:            getEnv("SERVER_HOST", "0.0.0.0"),
			Environment:     getEnv("APP_ENV", "development"),
			ShutdownTimeout: getDurationEnv("SERVER_SHUTDOWN_TIMEOUT", 5*time.Second),
			ReadTimeout:     getDurationEnv("SERVER_READ_TIMEOUT", 10*time.Second),
			WriteTimeout:    getDurationEnv("SERVER_WRITE_TIMEOUT", 10*time.Second),
			IdleTimeout:     getDurationEnv("SERVER_IDLE_TIMEOUT", 120*time.Second),
			CorsOrigins:     getSliceEnv("CORS_ORIGINS", []string{"*"}),
		},
		MongoDB: MongoDBConfig{
			URI:             getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database:        getEnv("MONGODB_DATABASE", "auth_app"),
			Username:        getEnv("MONGODB_USERNAME", ""),
			Password:        getEnv("MONGODB_PASSWORD", ""),
			ConnectTimeout:  getDurationEnv("MONGODB_CONNECT_TIMEOUT", 10*time.Second),
			MaxPoolSize:     getUint64Env("MONGODB_MAX_POOL_SIZE", 100),
			MinPoolSize:     getUint64Env("MONGODB_MIN_POOL_SIZE", 10),
			MaxConnIdleTime: getDurationEnv("MONGODB_MAX_CONN_IDLE_TIME", 60*time.Second),
		},
		JWT: JWTConfig{
			AccessSecret:        getEnv("JWT_ACCESS_SECRET", "access_secret_key"),
			RefreshSecret:       getEnv("JWT_REFRESH_SECRET", "refresh_secret_key"),
			AccessExpiryTime:    getDurationEnv("JWT_ACCESS_EXPIRY", 30*24*time.Hour), // 30 jours pour mobile
			RefreshExpiryTime:   getDurationEnv("JWT_REFRESH_EXPIRY", 90*24*time.Hour), // 90 jours
			Issuer:              getEnv("JWT_ISSUER", "auth-app"),
			AccessCookieName:    getEnv("JWT_ACCESS_COOKIE_NAME", "access_token"),
			RefreshCookieName:   getEnv("JWT_REFRESH_COOKIE_NAME", "refresh_token"),
			RefreshCookieSecure: getBoolEnv("JWT_REFRESH_COOKIE_SECURE", true),
			RefreshCookieHTTPOnly: getBoolEnv("JWT_REFRESH_COOKIE_HTTP_ONLY", true),
		},
		Email: EmailConfig{
			SendgridAPIKey: getEnv("SENDGRID_API_KEY", ""),
			EmailFrom:      getEnv("EMAIL_FROM", "noreply@example.com"),
			EmailFromName:  getEnv("EMAIL_FROM_NAME", "Auth App"),
		},
		SMS: SMSConfig{
			TwilioAccountSID:  getEnv("TWILIO_ACCOUNT_SID", ""),
			TwilioAuthToken:   getEnv("TWILIO_AUTH_TOKEN", ""),
			TwilioPhoneNumber: getEnv("TWILIO_PHONE_NUMBER", ""),
		},
		Security: SecurityConfig{
			PasswordMinLength:  getIntEnv("PASSWORD_MIN_LENGTH", 8),
			PasswordHashCost:   getIntEnv("PASSWORD_HASH_COST", 10),
			ResetTokenLifetime: getDurationEnv("RESET_TOKEN_LIFETIME", 15*time.Minute),
			VerifyCodeLifetime: getDurationEnv("VERIFY_CODE_LIFETIME", 15*time.Minute),
		},
		Storage: StorageConfig{
			S3Bucket:         getEnv("S3_BUCKET", ""),
			S3Region:         getEnv("S3_REGION", ""),
			S3AccessKey:      getEnv("S3_ACCESS_KEY", ""),
			S3SecretKey:      getEnv("S3_SECRET_KEY", ""),
			S3Endpoint:       getEnv("S3_ENDPOINT", ""),
			StorageProvider:  getEnv("STORAGE_PROVIDER", "s3"),
			MaxUploadSize:    getInt64Env("MAX_UPLOAD_SIZE", 10*1024*1024), // 10MB par défaut
			AvatarBucketPath: getEnv("AVATAR_BUCKET_PATH", "avatars"),
			MediaBucketPath:  getEnv("MEDIA_BUCKET_PATH", "media"),
		},
	}

	// Valider les paramètres critiques
	if config.Server.Environment == "production" {
		if config.JWT.AccessSecret == "access_secret_key" || config.JWT.RefreshSecret == "refresh_secret_key" {
			return nil, fmt.Errorf("les clés secrètes JWT doivent être définies en production")
		}
	}

	return config, nil
}

// Fonctions utilitaires pour récupérer les variables d'environnement
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getIntEnv(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	intValue, err := strconv.Atoi(value)
	if err != nil {
		log.Warn().Err(err).Str("key", key).Msg("Valeur non entière trouvée, utilisation de la valeur par défaut")
		return defaultValue
	}
	return intValue
}

func getInt64Env(key string, defaultValue int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	int64Value, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		log.Warn().Err(err).Str("key", key).Msg("Valeur non int64 trouvée, utilisation de la valeur par défaut")
		return defaultValue
	}
	return int64Value
}

func getUint64Env(key string, defaultValue uint64) uint64 {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	uint64Value, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		log.Warn().Err(err).Str("key", key).Msg("Valeur non uint64 trouvée, utilisation de la valeur par défaut")
		return defaultValue
	}
	return uint64Value
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	durationValue, err := time.ParseDuration(value)
	if err != nil {
		log.Warn().Err(err).Str("key", key).Msg("Valeur de durée invalide trouvée, utilisation de la valeur par défaut")
		return defaultValue
	}
	return durationValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		log.Warn().Err(err).Str("key", key).Msg("Valeur booléenne invalide trouvée, utilisation de la valeur par défaut")
		return defaultValue
	}
	return boolValue
}

func getSliceEnv(key string, defaultValue []string) []string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return []string{value}
}