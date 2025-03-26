/**
 * Script pour modifier ResetDataScreen.tsx afin d'ajouter l'option
 * de réinitialisation des données d'authentification
 * 
 * Ce script montre les modifications à apporter au fichier.
 * Vous devrez les appliquer manuellement ou utiliser un outil comme patch.
 */

console.log('Modifications à apporter à ResetDataScreen.tsx:');
console.log('\n1. Importer le module resetLocalData:');
console.log('```');
console.log('import React, { useState } from \'react\';');
console.log('import {');
console.log('  View,');
console.log('  Text,');
console.log('  StyleSheet,');
console.log('  TouchableOpacity,');
console.log('  ScrollView,');
console.log('  Switch,');
console.log('  Alert,');
console.log('  Platform,');
console.log('  ActivityIndicator');
console.log('} from \'react-native\';');
console.log('import { Ionicons } from \'@expo/vector-icons\';');
console.log('import { useNavigation } from \'@react-navigation/native\';');
console.log('import { NativeStackNavigationProp } from \'@react-navigation/native-stack\';');
console.log('import { RootStackParamList } from \'../types/navigation\';');
console.log('import { resetAuthData, resetAllStorage, resetAppSettings } from \'../utils/resetLocalData\';');
console.log('```');

console.log('\n2. Ajouter l\'option d\'authentification dans resetOptions:');
console.log('```');
console.log('// Options de réinitialisation des données');
console.log('const [resetOptions, setResetOptions] = useState({');
console.log('  events: false,');
console.log('  wishlists: false,');
console.log('  friends: false,');
console.log('  messages: false,');
console.log('  preferences: false,');
console.log('  authentication: false  // Nouvelle option');
console.log('});');
console.log('```');

console.log('\n3. Ajouter l\'élément d\'interface pour l\'option d\'authentification (après la ligne 186):');
console.log('```');
console.log('<TouchableOpacity ');
console.log('  style={styles.optionItem}');
console.log('  onPress={() => toggleOption(\'authentication\')}');
console.log('>');
console.log('  <Text style={styles.optionLabel}>Données d\'authentification</Text>');
console.log('  <Switch');
console.log('    value={resetOptions.authentication}');
console.log('    onValueChange={() => toggleOption(\'authentication\')}');
console.log('    trackColor={{ false: \'#D1D1D6\', true: \'#34C759\' }}');
console.log('    thumbColor="#FFFFFF"');
console.log('  />');
console.log('</TouchableOpacity>');
console.log('```');

console.log('\n4. Remplacer la fonction performReset:');
console.log('```');
console.log('const performReset = async () => {');
console.log('  try {');
console.log('    setIsLoading(true);');
console.log('    ');
console.log('    // Exécuter les réinitialisations en fonction des options sélectionnées');
console.log('    if (resetOptions.authentication) {');
console.log('      await resetAuthData();');
console.log('    }');
console.log('    ');
console.log('    if (resetOptions.preferences) {');
console.log('      await resetAppSettings();');
console.log('    }');
console.log('    ');
console.log('    // Réinitialiser d\'autres types de données si nécessaire');
console.log('    // Ces fonctions devront être implémentées dans resetLocalData.js');
console.log('    ');
console.log('    setIsLoading(false);');
console.log('    ');
console.log('    // Afficher un message de confirmation');
console.log('    Alert.alert(');
console.log('      "Données réinitialisées",');
console.log('      "Les données sélectionnées ont été réinitialisées avec succès.",');
console.log('      [');
console.log('        { ');
console.log('          text: "OK", ');
console.log('          onPress: () => {');
console.log('            // Si l\'authentification a été réinitialisée, naviguer vers l\'écran de connexion');
console.log('            if (resetOptions.authentication) {');
console.log('              navigation.navigate(\'Login\');');
console.log('            } else {');
console.log('              navigation.goBack();');
console.log('            }');
console.log('          }');
console.log('        }');
console.log('      ]');
console.log('    );');
console.log('  } catch (error) {');
console.log('    setIsLoading(false);');
console.log('    Alert.alert(');
console.log('      "Erreur",');
console.log('      `Une erreur est survenue lors de la réinitialisation des données: ${error.message}`,');
console.log('      [{ text: "OK" }]');
console.log('    );');
console.log('  }');
console.log('};');
console.log('```');

console.log('\nPour appliquer ces modifications:');
console.log('1. Ouvrez le fichier ResetDataScreen.tsx');
console.log('2. Ajoutez l\'import pour resetLocalData en haut du fichier');
console.log('3. Ajoutez l\'option authentication dans l\'état resetOptions');
console.log('4. Ajoutez l\'élément Switch pour l\'option authentication');
console.log('5. Remplacez la fonction performReset par l\'implémentation ci-dessus');