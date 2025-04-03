FROM golang:1.23-alpine AS builder

# Installation des dépendances de build
RUN apk add --no-cache git gcc musl-dev

# Définir le répertoire de travail
WORKDIR /app

# Copier go.mod et go.sum
COPY go.mod go.sum ./

# Télécharger les dépendances
RUN go mod download

# Copier le code source
COPY . .

# Construire l'application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o auth-server ./cmd/api

# Deuxième étape - Image d'exécution
FROM alpine:3.18

# Installation des dépendances de production
RUN apk add --no-cache ca-certificates tzdata

# Définir le fuseau horaire par défaut
ENV TZ=Europe/Paris

# Créer un utilisateur non-root
RUN adduser -D -u 1000 appuser

# Définir le répertoire de travail
WORKDIR /app

# Copier le binaire depuis l'étape de construction
COPY --from=builder /app/auth-server .

# Définir la propriété des fichiers à l'utilisateur non-root
RUN chown -R appuser:appuser /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 8080

# Commande de démarrage
CMD ["./auth-server"]