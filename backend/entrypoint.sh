#!/bin/sh
# entrypoint.sh

# Définir l'URI MongoDB à utiliser
MONGO_URI_TO_USE="mongodb://mongodb:27017"

# Exécuter la commande principale de l'application en passant l'URI via un flag
# "$@" permet de passer les arguments CMD du Dockerfile ou de docker-compose s'il y en a
# Nous ajoutons le flag -mongo-uri avant les autres arguments potentiels "$@"
echo "Lancement de l'application avec -mongo-uri=${MONGO_URI_TO_USE}"
exec ./auth-server -mongo-uri="${MONGO_URI_TO_USE}" "$@"