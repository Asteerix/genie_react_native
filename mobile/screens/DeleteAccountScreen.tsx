import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const DeleteAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // État pour le mot de passe de confirmation
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  
  // Vérifier si le bouton de suppression doit être activé
  const isDeleteButtonEnabled = password.length > 0 && confirmationText === 'SUPPRIMER';
  
  // Gestion de la suppression du compte
  const handleDeleteAccount = () => {
    if (!isDeleteButtonEnabled) {
      return;
    }
    
    // Demander une dernière confirmation
    Alert.alert(
      "Confirmer la suppression",
      "Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés. Êtes-vous sûr de vouloir continuer ?",
      [
        { 
          text: "Annuler", 
          style: "cancel" 
        },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: performAccountDeletion
        }
      ]
    );
  };
  
  // Simulation de suppression du compte
  const performAccountDeletion = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Pour démonstration, on simule parfois une erreur
      const shouldFail = Math.random() < 0.2;
      
      if (shouldFail) {
        throw new Error("Mot de passe incorrect");
      }
      
      setIsLoading(false);
      
      // Rediriger vers l'écran de connexion après suppression
      Alert.alert(
        "Compte supprimé",
        "Votre compte a été supprimé avec succès. Nous espérons vous revoir bientôt !",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate("Login")
          }
        ]
      );
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supprimer mon compte</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.contentContainer}>
          {/* Avertissement */}
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={32} color="#FF3B30" />
            <Text style={styles.warningText}>
              La suppression de votre compte est définitive et irréversible. 
              Toutes vos données, y compris votre profil, vos événements, vos listes de souhaits et vos messages seront supprimés.
            </Text>
          </View>
          
          {/* Informations sur la suppression */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Ce qui sera supprimé :</Text>
            <View style={styles.infoItemContainer}>
              <Ionicons name="person" size={20} color="#555" />
              <Text style={styles.infoItemText}>Votre profil et vos informations personnelles</Text>
            </View>
            <View style={styles.infoItemContainer}>
              <Ionicons name="calendar" size={20} color="#555" />
              <Text style={styles.infoItemText}>Tous vos événements</Text>
            </View>
            <View style={styles.infoItemContainer}>
              <Ionicons name="gift" size={20} color="#555" />
              <Text style={styles.infoItemText}>Vos listes de souhaits</Text>
            </View>
            <View style={styles.infoItemContainer}>
              <Ionicons name="chatbubbles" size={20} color="#555" />
              <Text style={styles.infoItemText}>Tous vos messages et conversations</Text>
            </View>
            <View style={styles.infoItemContainer}>
              <Ionicons name="image" size={20} color="#555" />
              <Text style={styles.infoItemText}>Vos photos et contenus multimédias</Text>
            </View>
          </View>
          
          {/* Confirmation par mot de passe */}
          <View style={styles.passwordContainer}>
            <Text style={styles.passwordLabel}>
              Veuillez entrer votre mot de passe pour confirmer
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mot de passe"
                placeholderTextColor="#999"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons 
                  name={isPasswordVisible ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Texte de confirmation */}
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationLabel}>
              Écrivez "SUPPRIMER" pour confirmer
            </Text>
            <TextInput
              style={styles.confirmationInput}
              placeholder="SUPPRIMER"
              placeholderTextColor="#999"
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="characters"
            />
          </View>
          
          {/* Affichage des erreurs */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.deleteButton,
            !isDeleteButtonEnabled && styles.deleteButtonDisabled
          ]}
          onPress={handleDeleteAccount}
          disabled={!isDeleteButtonEnabled || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="trash" size={22} color="white" />
              <Text style={styles.deleteButtonText}>Supprimer définitivement mon compte</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  placeholderRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  warningContainer: {
    backgroundColor: '#FFECEB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCECB',
  },
  warningText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 15,
    color: '#CC3A30',
    lineHeight: 22,
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1C1C1E',
  },
  infoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoItemText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#3A3A3C',
  },
  passwordContainer: {
    marginBottom: 20,
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  visibilityButton: {
    padding: 10,
  },
  confirmationContainer: {
    marginBottom: 20,
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  confirmationInput: {
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FFADAD',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DeleteAccountScreen;