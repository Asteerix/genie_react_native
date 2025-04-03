import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

type ExistingUserPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ExistingUserPassword'>;
type ExistingUserPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExistingUserPassword'>;

const ExistingUserPasswordScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  
  const { signIn, isLoading } = useAuth();
  const navigation = useNavigation<ExistingUserPasswordScreenNavigationProp>();
  const route = useRoute<ExistingUserPasswordScreenRouteProp>();
  
  const { emailOrPhone } = route.params;
  
  useEffect(() => {
    // Focus automatiquement le champ de mot de passe
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 300);
  }, []);
  
  const handleContinue = useCallback(async () => {
    if (!password.trim()) {
      toast.error('Veuillez entrer votre mot de passe');
      return;
    }
    
    try {
      // Afficher un message de chargement
      toast.loading('Connexion en cours...');
      
      // Authentification directe via le backend
      await signIn(emailOrPhone, password);
      
      // La navigation vers l'écran principal se fait automatiquement
      // par App.tsx qui détecte l'utilisateur connecté
      toast.success('Connexion réussie');
    } catch (error) {
      // Afficher un message d'erreur spécifique
      if (error instanceof Error) {
        toast.error(error.message || 'Erreur de connexion');
      } else {
        toast.error('Erreur de connexion');
      }
      console.error('Login failed:', error);
    }
  }, [emailOrPhone, password, signIn]);
  
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  
  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword', { emailOrPhone });
  }, [navigation, emailOrPhone]);
  
  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.helpButton}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            onPress={() => toast.info("Aide en cours de développement")}
          >
            <Ionicons name="help-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Mon mot de passe</Text>
          
          <Text style={styles.identifier}>{emailOrPhone}</Text>
          
          <View style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused
          ]}>
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            <TouchableOpacity 
              onPress={toggleShowPassword}
              style={styles.eyeButton}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.forgotButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />
          
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (!password.trim() || isLoading) && styles.disabledButton
            ]} 
            onPress={handleContinue}
            disabled={!password.trim() || isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="black" />
            ) : (
              <Text style={styles.continueButtonText}>Connexion</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight ?? 0) + 10,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  identifier: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 20,
    overflow: 'hidden',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerFocused: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    height: '100%',
  },
  eyeButton: {
    padding: 5,
  },
  forgotButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  forgotText: {
    color: '#999',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
    minHeight: 60,
  },
  continueButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    height: 60,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  continueButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ExistingUserPasswordScreen;