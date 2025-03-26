#!/usr/bin/env node
/**
 * Script pour réinitialiser l'authentification de l'application
 * 
 * Ce script crée un fichier temporaire qui sera exécuté au démarrage 
 * de l'application pour réinitialiser les données d'authentification.
 */

const fs = require('fs');
const path = require('path');

// Chemin vers le fichier temporaire de réinitialisation
const resetFilePath = path.join(__dirname, '..', 'reset-on-startup.js');

// Contenu du fichier de réinitialisation
const resetFileContent = `// Ce fichier est automatiquement créé par reset-app.js
// Il sera exécuté une fois au démarrage de l'application pour réinitialiser l'authentification

import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAuthData } from './utils/resetLocalData';

// Fonction qui sera appelée au démarrage de l'application
export async function resetOnStartup() {
  console.log('Réinitialisation des données d\'authentification...');
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
`;

// Contenu du correctif pour App.tsx
const appPatchContent = `
// Dans votre fichier App.tsx, ajoutez ces lignes au début du composant principal
// pour exécuter la réinitialisation au démarrage

import { useEffect } from 'react';
import resetOnStartup from './reset-on-startup';

// Dans votre composant App principal:
useEffect(() => {
  // Exécuter la réinitialisation au démarrage
  resetOnStartup().then(success => {
    if (success) {
      console.log('Application réinitialisée avec succès');
    }
  });
}, []);
`;

// Créer le fichier de réinitialisation
try {
  fs.writeFileSync(resetFilePath, resetFileContent);
  console.log(`\n✅ Fichier de réinitialisation créé: ${resetFilePath}`);
  
  console.log('\n🔍 Instructions d\'utilisation:');
  console.log('---------------------------------------');
  console.log('Pour que la réinitialisation fonctionne:');
  console.log('1. Importez la fonction de réinitialisation dans App.tsx');
  console.log('2. Ajoutez le code suivant dans votre composant App:');
  console.log('---------------------------------------');
  console.log(appPatchContent);
  console.log('---------------------------------------');
  console.log('3. Redémarrez l\'application');
  console.log('4. Après la première exécution, vous pouvez supprimer ce code et le fichier reset-on-startup.js');
  console.log('\n⚠️  Note: Cette solution fonctionne uniquement en mode développement.');
  console.log('Pour une solution permanente, intégrez la réinitialisation dans votre écran de paramètres.');
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier de réinitialisation:', error);
}