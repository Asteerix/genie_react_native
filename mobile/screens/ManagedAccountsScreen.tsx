import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
  Alert // Ajouter Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ManagedAccountsStackParamList } from '../types/navigation'; // Importer ManagedAccountsStackParamList si ce n'est pas déjà fait implicitement
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../auth/context/AuthContext'; // Importer useAuth
// Get screen dimensions
const { width, height } = Dimensions.get('window');

type ManagedAccountsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManagedAccounts'>;

const ManagedAccountsScreen: React.FC = () => {
  const navigation = useNavigation<ManagedAccountsScreenNavigationProp>();
  const { user } = useAuth(); // Récupérer l'utilisateur connecté
  const [options, setOptions] = useState({
    children: true,
    elderly: true,
    others: true,
  });

  const handleClose = () => {
    // Revenir à l'écran précédent dans la pile de navigation
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback au cas où il n'y a pas d'écran précédent (peu probable ici mais sécuritaire)
      // Peut-être naviguer vers un écran par défaut comme le profil ou l'accueil
      console.warn("Impossible de revenir en arrière depuis ManagedAccountsScreen.");
      // navigation.navigate('Profile'); // Exemple de fallback si nécessaire
    }
  };

  const handleSkip = () => {
    // Naviguer vers l'écran 'ManagedAccountsList' DANS la pile 'ManagedAccounts'
    navigation.navigate('ManagedAccounts', { screen: 'ManagedAccountsList' });
  };

  const handleCreateManagedAccount = () => {
    if (!user?.id) {
      console.error("ID utilisateur non trouvé, impossible de créer un compte géré.");
      // Afficher une alerte ou gérer l'erreur autrement
      Alert.alert("Erreur", "Impossible de récupérer votre identifiant utilisateur.");
      return;
    }
    // Naviguer vers l'écran 'ManagedAccountName' DANS la pile 'ManagedAccounts' en passant l'ID du gestionnaire
    navigation.navigate('ManagedAccounts', {
      screen: 'ManagedAccountName',
      params: { managedBy: user.id } // Fournir le paramètre requis
    });
  };

  // Calculate sizes based on screen height
  const headerHeight = height * 0.08;
  const illustrationHeight = height * 0.26;
  const titleHeight = height * 0.05;
  const descriptionHeight = height * 0.08;
  const optionsHeight = height * 0.22;
  const actionsHeight = height * 0.18;
  
  // Calculate icon and text sizes
  const iconSize = Math.max(18, Math.min(24, height * 0.03));
  const titleSize = Math.max(18, Math.min(24, height * 0.028));
  const descriptionSize = Math.max(13, Math.min(16, height * 0.019));
  const optionSize = Math.max(13, Math.min(16, height * 0.019));
  const buttonTextSize = Math.max(14, Math.min(18, height * 0.022));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête */}
        <View style={[styles.header, { height: headerHeight }]}>
          <TouchableOpacity
            key="close-button"
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Feather name="x" size={iconSize} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            key="help-button"
            style={styles.helpButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <View style={[styles.helpCircle, { width: iconSize + 6, height: iconSize + 6 }]}>
              <Text style={styles.helpText}>?</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Illustration centrale simplifiée */}
        <View style={[styles.illustrationContainer, { height: illustrationHeight }]}>
          <Image
            source={{ uri: 'https://api.a0.dev/assets/image?text=line%20drawing%20of%20mother%20and%20child%20simple%20minimalist%20black%20and%20white&aspect=1:1' }}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Titre */}
        <View style={[styles.titleContainer, { height: titleHeight }]}>
          <Text style={[styles.title, { fontSize: titleSize }]}>Créer des comptes gérés ?</Text>
        </View>

        {/* Description */}
        <View style={[styles.descriptionContainer, { height: descriptionHeight }]}>
          <Text style={[styles.description, { fontSize: descriptionSize }]}>
            Les comptes gérés permettent à tes proches d'être présents à des événements même s'ils ne peuvent pas accéder à l'application.
          </Text>
        </View>

        {/* Options avec checkboxes */}
        <View style={[styles.optionsContainer, { height: optionsHeight }]}>
          <TouchableOpacity 
            key="children-option"
            style={styles.optionRow}
            onPress={() => setOptions({...options, children: !options.children})}
          >
            <View style={[styles.checkboxContainer, { width: iconSize, height: iconSize }]}>
              {options.children && (
                <Feather name="check" size={iconSize * 0.7} color="white" />
              )}
            </View>
            <Text style={[styles.optionText, { fontSize: optionSize }]}>Les enfants</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            key="elderly-option"
            style={styles.optionRow}
            onPress={() => setOptions({...options, elderly: !options.elderly})}
          >
            <View style={[styles.checkboxContainer, { width: iconSize, height: iconSize }]}>
              {options.elderly && (
                <Feather name="check" size={iconSize * 0.7} color="white" />
              )}
            </View>
            <Text style={[styles.optionText, { fontSize: optionSize }]}>Les personnes âgées</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            key="others-option"
            style={styles.optionRow}
            onPress={() => setOptions({...options, others: !options.others})}
          >
            <View style={[styles.checkboxContainer, { width: iconSize, height: iconSize }]}>
              {options.others && (
                <Feather name="check" size={iconSize * 0.7} color="white" />
              )}
            </View>
            <Text style={[styles.optionText, { fontSize: optionSize }]}>Autres proches sans accès</Text>
          </TouchableOpacity>
        </View>

        {/* Boutons d'action */}
        <View style={[styles.actionsContainer, { height: actionsHeight }]}>
          <TouchableOpacity 
            key="create-button"
            style={[styles.createButton, { paddingVertical: height * 0.015 }]}
            onPress={handleCreateManagedAccount}
          >
            <Text style={[styles.createButtonText, { fontSize: buttonTextSize }]}>Créer un compte géré</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            key="skip-button"
            style={[styles.skipButton, { paddingVertical: height * 0.015 }]}
            onPress={handleSkip}
          >
            <Text style={[styles.skipButtonText, { fontSize: buttonTextSize }]}>Peut-être plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  closeButton: {
    padding: 5,
  },
  helpButton: {
    padding: 5,
  },
  helpCircle: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  illustration: {
    width: '70%',
    height: '100%',
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: width * 0.05,
  },
  optionsContainer: {
    justifyContent: 'space-between',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    color: '#222',
  },
  actionsContainer: {
    justifyContent: 'flex-end',
    paddingBottom: height * 0.03,
  },
  createButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: '#F1F1F1',
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#000',
    fontWeight: '500',
  },
});

export default ManagedAccountsScreen;