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

const ChangePasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // États pour les champs de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation des champs
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Force du mot de passe (0-100)
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Calcul de la force du mot de passe
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^A-Za-z0-9]/)) strength += 25;
    
    setPasswordStrength(strength);
  };
  
  // Gestion du changement de mot de passe
  const handleChangePassword = () => {
    // Réinitialiser les erreurs
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    // Validation du mot de passe actuel
    if (!currentPassword) {
      newErrors.currentPassword = 'Veuillez entrer votre mot de passe actuel';
    }
    
    // Validation du nouveau mot de passe
    if (!newPassword) {
      newErrors.newPassword = 'Veuillez entrer un nouveau mot de passe';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe doit être différent de l\'ancien';
    }
    
    // Validation de la confirmation du mot de passe
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre nouveau mot de passe';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    // Mettre à jour les erreurs
    setErrors(newErrors);
    
    // Si aucune erreur, procéder au changement de mot de passe
    if (!newErrors.currentPassword && !newErrors.newPassword && !newErrors.confirmPassword) {
      setIsLoading(true);
      
      // Simuler une requête API
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          "Mot de passe modifié",
          "Votre mot de passe a été modifié avec succès",
          [
            { text: "OK", onPress: () => navigation.goBack() }
          ]
        );
      }, 1500);
    }
  };
  
  // Obtenir la couleur de la barre de force du mot de passe
  const getStrengthColor = () => {
    if (passwordStrength < 25) return '#FF3B30';
    if (passwordStrength < 50) return '#FF9500';
    if (passwordStrength < 75) return '#FFCC00';
    return '#34C759';
  };
  
  // Obtenir le texte de la force du mot de passe
  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Très faible';
    if (passwordStrength < 50) return 'Faible';
    if (passwordStrength < 75) return 'Moyen';
    if (passwordStrength < 100) return 'Fort';
    return 'Très fort';
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
        <Text style={styles.headerTitle}>Changer le mot de passe</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          {/* Mot de passe actuel */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mot de passe actuel</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre mot de passe actuel"
                placeholderTextColor="#999"
                secureTextEntry={!isPasswordVisible}
                value={currentPassword}
                onChangeText={setCurrentPassword}
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
            {errors.currentPassword ? (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            ) : null}
          </View>
          
          {/* Nouveau mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Entrez un nouveau mot de passe"
                placeholderTextColor="#999"
                secureTextEntry={!isNewPasswordVisible}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  calculatePasswordStrength(text);
                }}
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
              >
                <Ionicons 
                  name={isNewPasswordVisible ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : (
              newPassword.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBarContainer}>
                    <View 
                      style={[
                        styles.passwordStrengthBar, 
                        { 
                          width: `${passwordStrength}%`,
                          backgroundColor: getStrengthColor()
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.passwordStrengthText}>
                    {getStrengthText()}
                  </Text>
                </View>
              )
            )}
            <Text style={styles.passwordRequirements}>
              Le mot de passe doit contenir au moins 8 caractères, dont une lettre majuscule, un chiffre et un caractère spécial.
            </Text>
          </View>
          
          {/* Confirmation du nouveau mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirmez votre nouveau mot de passe"
                placeholderTextColor="#999"
                secureTextEntry={!isConfirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              >
                <Ionicons 
                  name={isConfirmPasswordVisible ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!currentPassword || !newPassword || !confirmPassword) && styles.submitButtonDisabled
          ]}
          onPress={handleChangePassword}
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Changer le mot de passe</Text>
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
  },
  placeholderRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
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
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  visibilityButton: {
    padding: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  passwordStrengthBar: {
    height: '100%',
  },
  passwordStrengthText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordRequirements: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#000',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;