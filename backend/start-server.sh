#!/bin/bash

# Définir les couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Compilation du serveur...${NC}"

# Compiler le serveur
go build -o backend-server cmd/api/main.go

# Vérifier si la compilation a réussi
if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors de la compilation du serveur.${NC}"
    exit 1
fi

echo -e "${GREEN}Compilation réussie.${NC}"
echo -e "${YELLOW}Démarrage du serveur...${NC}"

# Exécuter le serveur
./backend-server

# Ce code ne sera exécuté que si le serveur s'arrête
echo -e "${RED}Le serveur s'est arrêté.${NC}"