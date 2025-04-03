// Ce fichier est automatiquement créé par reset-app.js
// Il sera exécuté une fois au démarrage de l'application pour réinitialiser l'authentification

import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAuthData } from './utils/resetLocalData';

// Fonction qui sera appelée au démarrage de l'application
export async function resetOnStartup() {
  // RESET DÉSACTIVÉ - Nous ne voulons pas réinitialiser les données d'authentification à chaque démarrage
  console.log('Reset sur démarrage désactivé - préservation de la session utilisateur');
  
  try {
    // Vérifier si un reset est explicitement demandé via un flag
    const shouldReset = await AsyncStorage.getItem('force_reset_on_startup');
    
    if (shouldReset === 'true') {
      console.log('Réinitialisation explicite demandée...');
      // Réinitialiser les données d'authentification
      await resetAuthData();
      // Supprimer le flag de reset
      await AsyncStorage.removeItem('force_reset_on_startup');
      console.log('Réinitialisation terminée avec succès');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification du reset:', error);
    return false;
  }
}

// Exporter par défaut pour faciliter l'importation
export default resetOnStartup;
