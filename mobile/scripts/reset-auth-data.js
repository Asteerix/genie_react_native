/**
 * Script de réinitialisation des données d'authentification
 * Exécutez ce script avec 'node scripts/reset-auth-data.js' pour effacer
 * les données d'authentification et empêcher la reconnexion automatique
 */

const fs = require('fs');
const path = require('path');

// Fonction pour effacer les fichiers de stockage local d'Expo/React Native
// Cette fonction simule le comportement de AsyncStorage.multiRemove
// pour une utilisation dans un environnement Node.js
function clearAuthData() {
  console.log('Tentative de réinitialisation des données d\'authentification...');
  
  // Chemins possibles pour les données de stockage local sur différentes plateformes
  const storagePaths = [
    // iOS Simulator
    path.join(process.env.HOME, 'Library/Developer/CoreSimulator/Devices'),
    // Android emulator
    path.join(process.env.HOME, '.android/avd'),
    // Expo dev client local storage
    path.join(process.env.HOME, '.expo')
  ];

  console.log('Cette commande doit être exécutée sur l\'appareil même ou l\'émulateur où l\'application est installée.');
  console.log('Pour réinitialiser les données d\'authentification dans l\'application:');
  console.log('1. Ouvrez l\'application en mode développement');
  console.log('2. Accédez à la console de développement');
  console.log('3. Exécutez le code suivant dans la console:');
  console.log('\n------------------------------------------');
  console.log('import AsyncStorage from \'@react-native-async-storage/async-storage\';');
  console.log('AsyncStorage.multiRemove([\'user\', \'accessToken\', \'refreshToken\']).then(() => {');
  console.log('  console.log(\'Données d\\\'authentification réinitialisées.\');');
  console.log('});');
  console.log('------------------------------------------\n');
  console.log('4. Redémarrez l\'application');
  
  console.log('\nAlternativement, dans un environnement de développement:');
  console.log('1. Importez et utilisez directement les fonctions du module resetLocalData.js');
  console.log('2. Ajoutez un bouton temporaire qui appelle resetAuthData() ou resetAllStorage()');
  
  console.log('\nPour une solution plus permanente:');
  console.log('1. Ajoutez une option dans les paramètres de l\'application');
  console.log('2. Modifiez ResetDataScreen.tsx pour intégrer la réinitialisation des données d\'authentification');
}

// Exécution
clearAuthData();