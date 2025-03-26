import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Pressable
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';
import AuthInput from '../components/AuthInput';

type CreateNewPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateNewPassword'>;
type CreateNewPasswordScreenRouteProp = RouteProp<RootStackParamList, 'CreateNewPassword'>;

const CreateNewPasswordScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetPassword, isLoading } = useAuth();
  const navigation = useNavigation<CreateNewPasswordScreenNavigationProp>();
  const route = useRoute<CreateNewPasswordScreenRouteProp>();
  const { emailOrPhone, code } = route.params;

  // Vérifier les critères du mot de passe
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isValidPassword = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const handleSubmit = async () => {
    if (!isValidPassword || !passwordsMatch || isLoading) return;
    
    try {
      // Réinitialiser le mot de passe
      await resetPassword(emailOrPhone);
      
      // Naviguer vers l'écran de connexion
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un nouveau mot de passe</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Champ de mot de passe */}
          <View style={styles.inputContainer}>
            <AuthInput
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable 
              style={styles.visibilityToggle} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.visibilityText}>
                {showPassword ? 'Masquer' : 'Voir'}
              </Text>
            </Pressable>
          </View>

          {/* Champ de confirmation */}
          <View style={styles.inputContainer}>
            <AuthInput
              placeholder="Confirmer"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <Pressable 
              style={styles.visibilityToggle} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.visibilityText}>
                {showConfirmPassword ? 'Masquer' : 'Voir'}
              </Text>
            </Pressable>
          </View>

          {/* Critères de mot de passe */}
          <View style={styles.criteriaContainer}>
            <View style={styles.criteriaRow}>
              <MaterialCommunityIcons 
                name={hasMinLength ? "check-circle" : "circle-outline"} 
                size={24} 
                color={hasMinLength ? "#666" : "#ddd"} 
              />
              <Text style={[styles.criteriaText, hasMinLength && styles.criteriaTextMet]}>
                Au moins 8 caractères
              </Text>
            </View>
            
            <View style={styles.criteriaRow}>
              <MaterialCommunityIcons 
                name={hasUpperCase ? "check-circle" : "circle-outline"} 
                size={24} 
                color={hasUpperCase ? "#666" : "#ddd"} 
              />
              <Text style={[styles.criteriaText, hasUpperCase && styles.criteriaTextMet]}>
                Au moins une majuscule
              </Text>
            </View>
            
            <View style={styles.criteriaRow}>
              <MaterialCommunityIcons 
                name={hasLowerCase ? "check-circle" : "circle-outline"} 
                size={24} 
                color={hasLowerCase ? "#666" : "#ddd"} 
              />
              <Text style={[styles.criteriaText, hasLowerCase && styles.criteriaTextMet]}>
                Au moins une minuscule
              </Text>
            </View>
            
            <View style={styles.criteriaRow}>
              <MaterialCommunityIcons 
                name={hasNumber ? "check-circle" : "circle-outline"} 
                size={24} 
                color={hasNumber ? "#666" : "#ddd"} 
              />
              <Text style={[styles.criteriaText, hasNumber && styles.criteriaTextMet]}>
                Au moins un chiffre
              </Text>
            </View>
            
            <View style={styles.criteriaRow}>
              <MaterialCommunityIcons 
                name={hasSpecialChar ? "check-circle" : "circle-outline"} 
                size={24} 
                color={hasSpecialChar ? "#666" : "#ddd"} 
              />
              <Text style={[styles.criteriaText, hasSpecialChar && styles.criteriaTextMet]}>
                Au moins un caractère spécial
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!isValidPassword || !passwordsMatch || isLoading) && styles.disabledButton
            ]} 
            onPress={handleSubmit}
            disabled={!isValidPassword || !passwordsMatch || isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Chargement...' : 'Continuer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
    position: 'relative',
  },
  visibilityToggle: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  visibilityText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  criteriaContainer: {
    width: '100%',
    marginTop: 20,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  criteriaText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 10,
  },
  criteriaTextMet: {
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: 'black',
    borderRadius: 50,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CreateNewPasswordScreen;