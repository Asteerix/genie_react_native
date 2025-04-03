// Configuration de l'API
import { Platform } from 'react-native';

// URLs de l'API pour les différents environnements
const API_URLS = {
  development: 'https://6de4-92-184-145-214.ngrok-free.app',
  local: Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'https://6de4-92-184-145-214.ngrok-free.app',
  staging: 'https://staging-api.genie-app.com',
  production: 'https://api.genie-app.com'
};

// Sélectionner l'environnement : 'development', 'local', 'staging', ou 'production'
const ENVIRONMENT = 'local';

// Exporter l'URL de l'API en fonction de l'environnement
export const API_BASE_URL = API_URLS[ENVIRONMENT];

// Pour compatibilité avec require() dans des scripts Node.js
// @ts-ignore
module.exports = {
  API_BASE_URL
};