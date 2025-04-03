#!/bin/sh
# entrypoint.sh

# Exporter la variable d'environnement (sera lue par l'application Go)
export MONGO_URI="mongodb://mongodb:27017"

# Exécuter la commande principale de l'application
# "$@" permet de passer les arguments CMD du Dockerfile ou de docker-compose s'il y en a
exec "$@"