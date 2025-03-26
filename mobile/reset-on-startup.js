// Ce fichier est automatiquement créé par reset-app.js
// Il sera exécuté une fois au démarrage de l'application pour réinitialiser l'authentification

import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAuthData } from './utils/resetLocalData';

// Fonction qui sera appelée au démarrage de l'application
export async function resetOnStartup() {
  console.log('Réinitialisation des données d'authentification...');
  try {
    // Réinitialiser les données d'authentification
    await resetAuthData();
    
    // Supprimer ce fichier après l'exécution
    // Note: Cela nécessite des permissions de système de fichiers qui ne sont pas disponibles dans l'environnement React Native
    // Ce fichier devra être supprimé manuellement si nécessaire
    
    console.log('Réinitialisation terminée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    return false;
  }
}

// Exporter par défaut pour faciliter l'importation
export default resetOnStartup;
