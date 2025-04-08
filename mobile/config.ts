// Configuration de l'API
import { Platform } from 'react-native';

// URLs de l'API pour les différents environnements
const API_URLS = {
  development: 'http://217.182.129.10:8081',
  local: 'http://217.182.129.10:8081', // Utilise toujours cette URL pour l'environnement local
  staging: 'http://217.182.129.10:8081',
  production: 'http://217.182.129.10:8081'
};

// Sélectionner l'environnement : 'development', 'local', 'staging', ou 'production'
const ENVIRONMENT = 'production';

// Exporter l'URL de l'API en fonction de l'environnement
export const API_BASE_URL = API_URLS[ENVIRONMENT];

// Pour compatibilité avec require() dans des scripts Node.js
// @ts-ignore
module.exports = {
  API_BASE_URL
};