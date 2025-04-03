import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { toast } from 'sonner-native';

// Define proper TypeScript interfaces
interface SocialButtonProps {
  icon: React.ReactNode;
  backgroundColor: string;
  onPress: () => void;
  isLoading?: boolean;
}

// Separating components for better performance
const SocialButton = memo(({ icon, backgroundColor, onPress, isLoading }: SocialButtonProps) => (
  <TouchableOpacity 
    style={[styles.socialButton, { backgroundColor }]} 
    onPress={onPress}
    activeOpacity={0.8}
    disabled={isLoading}
  >
    {isLoading ? (
      <ActivityIndicator size="small" color={backgroundColor === "#1877F2" ? "white" : "black"} />
    ) : (
      icon
    )}
  </TouchableOpacity>
));

const SocialLoginSection = memo(() => {
  const { socialSignIn, isLoading } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'apple' | 'google' | 'facebook' | null>(null);

  const handleAppleLogin = useCallback(async () => {
    try {
      setLoadingProvider('apple');
      // En production, utiliser l'authentification Apple
      // const credential = await AppleAuthentication.signInAsync({
      //   requestedScopes: [
      //     AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      //     AppleAuthentication.AppleAuthenticationScope.EMAIL,
      //   ],
      // });
      
      // Appeler l'API socialSignIn avec les credentials obtenus
      await socialSignIn('apple');
    } catch (error) {
      if (error instanceof Error && error.message !== 'canceled') {
        toast.error(`Échec de la connexion avec Apple: ${error.message}`);
      }
    } finally {
      setLoadingProvider(null);
    }
  }, [socialSignIn]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setLoadingProvider('google');
      // En production, utiliser l'authentification Google
      // const [request, response, promptAsync] = Google.useAuthRequest({
      //   expoClientId: 'YOUR_EXPO_CLIENT_ID',
      //   iosClientId: 'YOUR_IOS_CLIENT_ID',
      //   androidClientId: 'YOUR_ANDROID_CLIENT_ID',
      // });
      
      // Appeler l'API socialSignIn avec les credentials obtenus
      await socialSignIn('google');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Échec de la connexion avec Google: ${error.message}`);
      }
    } finally {
      setLoadingProvider(null);
    }
  }, [socialSignIn]);

  const handleFacebookLogin = useCallback(async () => {
    try {
      setLoadingProvider('facebook');
      // En production, utiliser l'authentification Facebook
      // const [request, response, promptAsync] = Facebook.useAuthRequest({
      //   clientId: 'YOUR_FACEBOOK_APP_ID',
      // });
      
      // Appeler l'API socialSignIn avec les credentials obtenus
      await socialSignIn('facebook');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Échec de la connexion avec Facebook: ${error.message}`);
      }
    } finally {
      setLoadingProvider(null);
    }
  }, [socialSignIn]);

  return (
    <View style={styles.socialContainer}>
      <Text style={styles.socialText}>Ou continuer avec</Text>
      <View style={styles.socialButtonsRow}>
        <SocialButton 
          icon={<Ionicons name="logo-apple" size={24} color="black" />}
          backgroundColor="white" 
          onPress={handleAppleLogin}
          isLoading={loadingProvider === 'apple'} 
        />
        <SocialButton 
          icon={<Ionicons name="logo-google" size={22} color="black" />}
          backgroundColor="white" 
          onPress={handleGoogleLogin}
          isLoading={loadingProvider === 'google'} 
        />
        <SocialButton 
          icon={<Ionicons name="logo-facebook" size={24} color="white" />}
          backgroundColor="#1877F2" 
          onPress={handleFacebookLogin}
          isLoading={loadingProvider === 'facebook'} 
        />
      </View>
    </View>
  );
});

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const { signIn, isLoading, checkUserExists } = useAuth();
  
  // Pas de pré-remplissage en production
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  // Fonction pour valider le format de l'email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Fonction pour valider le format du téléphone
  const isValidPhone = (phone: string): boolean => {
    // Format simple pour les numéros de téléphone
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(phone);
  };
  
  // Validation de l'entrée
  const validateInput = (input: string): boolean => {
    if (!input.trim()) {
      toast.error('Veuillez entrer un email ou un numéro de téléphone');
      return false;
    }
    
    if (!isValidEmail(input) && !isValidPhone(input)) {
      toast.error('Format d\'email ou de téléphone invalide');
      return false;
    }
    
    return true;
  };
  
  const handleContinue = useCallback(async () => {
    if (!validateInput(emailOrPhone)) return;
    
    try {
      setCheckingUser(true);
      
      // Appel à l'API pour vérifier si l'utilisateur existe
      const response = await checkUserExists(emailOrPhone);
      
      setCheckingUser(false);
      
      console.log(`Vérification de l'email ${emailOrPhone}: ${response.exists ? 'existe' : 'n\'existe pas'}`);
      
      if (response.exists) {
        // Si l'utilisateur existe, rediriger vers la page de connexion
        // Pas de toast pour ne pas perturber l'expérience utilisateur
        navigation.navigate('ExistingUserPassword', { emailOrPhone });
      } else {
        // Si l'utilisateur n'existe pas, rediriger vers la page d'inscription
        // Pas de toast pour ne pas perturber l'expérience utilisateur
        navigation.navigate('SignupPassword', { emailOrPhone });
      }
    } catch (error) {
      setCheckingUser(false);
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Une erreur est survenue lors de la vérification');
      }
      // Erreur silencieuse de vérification
    }
  }, [emailOrPhone, checkUserExists, navigation]);

  const handleHelp = useCallback(() => {
    // À implémenter: ouvrir une page d'aide ou une FAQ
    toast.info("Page d'aide en cours de développement");
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity 
            style={styles.helpButton} 
            onPress={handleHelp}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="help-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Force single line with numberOfLines and make font adjustable */}
          <Text 
            numberOfLines={1} 
            adjustsFontSizeToFit
            style={styles.title}
          >
            Mon téléphone ou e-mail
          </Text>
          
          <View style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Téléphone ou e-mail"
              placeholderTextColor="#999"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.spacer} />
          
          <SocialLoginSection />
          
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (!emailOrPhone.trim() || isLoading || checkingUser) && styles.disabledButton
            ]} 
            onPress={handleContinue}
            disabled={!emailOrPhone.trim() || isLoading || checkingUser}
            activeOpacity={0.9}
          >
            {isLoading || checkingUser ? (
              <View style={styles.buttonContentRow}>
                <ActivityIndicator size="small" color="black" />
                <Text style={[styles.continueButtonText, {marginLeft: 10}]}>
                  {checkingUser ? "Vérification..." : "Chargement..."}
                </Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>Continuer</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight ?? 0) + 10,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerSpacer: {
    width: 28,
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
    marginTop: -40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
  },
  inputContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 20,
    overflow: 'hidden',
    height: 60,
    justifyContent: 'center',
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
    width: '100%',
    height: '100%',
  },
  spacer: {
    height: 60,
  },
  socialContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  socialText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  socialButton: {
    width: 85,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
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

export default LoginScreen;