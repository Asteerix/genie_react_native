import React, { useState, useCallback, memo, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Keyboard,
  Vibration,
  ViewStyle
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';

type RequestResetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

// Validateurs
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  // Supporte les formats internationaux et locaux
  // Ex: +33612345678, 0612345678, etc.
  const phoneRegex = /^(\+\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
  return phoneRegex.test(phone);
};

// Composant pour l'icône d'information
const InfoIcon = memo(() => {
  return (
    <View style={styles.infoIconContainer}>
      <Ionicons name="information-circle-outline" size={24} color="#000" />
    </View>
  );
});

// Composant bouton principal sans animation complexe
const PrimaryButton = memo(({ 
  onPress, 
  disabled, 
  loading, 
  children 
}: { 
  onPress: () => void; 
  disabled?: boolean; 
  loading?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.primaryButton,
        disabled && styles.disabledButton
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="sync" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Chargement...</Text>
        </View>
      ) : (
        <Text style={styles.primaryButtonText}>{children}</Text>
      )}
    </TouchableOpacity>
  );
});

// Composant d'erreur
const ErrorMessage = memo(({ message }: { message: string }) => {
  if (!message) return null;
  
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={18} color="#ef4444" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
});

const RequestResetScreen: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  
  const { resetPassword, isLoading, checkUserExists } = useAuth();
  const navigation = useNavigation<RequestResetScreenNavigationProp>();
  const inputRef = useRef<TextInput>(null);
  
  // Détecter si l'entrée ressemble plus à un email ou à un téléphone
  const isEmail = emailOrPhone.includes('@');
  
  // Changer le type de clavier en fonction de l'entrée
  const keyboardType = useMemo(() => {
    if (emailOrPhone.includes('@')) {
      return 'email-address';
    } else if (/^\+?\d+$/.test(emailOrPhone)) {
      return 'phone-pad';
    }
    return 'default';
  }, [emailOrPhone]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleHelpPress = useCallback(() => {
    // Implémenter la fonction d'aide ici
    console.log('Help pressed');
  }, []);
  
  // Fonction pour déclencher la vibration sans animation complexe
  const vibrate = useCallback(() => {
    Vibration.vibrate(50);
  }, []);
  
  // Validation d'entrée
  const validateInput = useCallback(async (): Promise<boolean> => {
    // Reset l'état d'erreur
    setError('');
    setValidationStatus('validating');
    
    // Vérifie si le champ est vide
    if (!emailOrPhone.trim()) {
      setError('Veuillez entrer un email ou un téléphone');
      setValidationStatus('error');
      vibrate();
      return false;
    }
    
    // Validation du format
    if (isEmail && !isValidEmail(emailOrPhone)) {
      setError("Format d'email invalide");
      setValidationStatus('error');
      vibrate();
      return false;
    } else if (!isEmail && !isValidPhone(emailOrPhone)) {
      setError("Format de téléphone ou email invalide");
      setValidationStatus('error');
      vibrate();
      return false;
    }
    
    try {
      // Vérifier si l'utilisateur existe
      const userExists = await checkUserExists(emailOrPhone.trim());
      
      if (!userExists) {
        setError("Aucun compte associé à cette adresse");
        setValidationStatus('error');
        vibrate();
        return false;
      }
      
      setValidationStatus('success');
      return true;
    } catch (error) {
      console.error('Error checking user:', error);
      setError("Une erreur est survenue, veuillez réessayer");
      setValidationStatus('error');
      vibrate();
      return false;
    }
  }, [emailOrPhone, isEmail, vibrate, checkUserExists]);

  const handleContinue = useCallback(async () => {
    if (isLoading || validationStatus === 'validating') return;
    
    Keyboard.dismiss();
    
    // Valider l'entrée
    const isValid = await validateInput();
    if (!isValid) return;
    
    try {
      await resetPassword(emailOrPhone.trim());
      setLinkSent(true);
      setValidationStatus('success');
      
      // Naviguer vers l'écran de vérification du code après un court délai
      setTimeout(() => {
        navigation.navigate('VerifyCode', { emailOrPhone: emailOrPhone.trim() });
      }, 2000);
      
    } catch (error) {
      console.error('Error sending reset link:', error);
      setError("Impossible d'envoyer le lien de réinitialisation");
      setValidationStatus('error');
      vibrate();
    }
  }, [emailOrPhone, isLoading, validationStatus, validateInput, resetPassword, navigation, vibrate]);
  
  // Message approprié en fonction du type d'entrée
  const getConfirmationMessage = useCallback(() => {
    if (isEmail) {
      return (
        <Text style={styles.message}>
          Nous avons envoyé <Text style={styles.boldText}>un email contenant un code de réinitialisation pour le mot de passe</Text> dans votre boîte e-mail.
        </Text>
      );
    } else {
      return (
        <Text style={styles.message}>
          Nous avons envoyé <Text style={styles.boldText}>un code de réinitialisation</Text> par SMS à votre téléphone.
        </Text>
      );
    }
  }, [isEmail]);

  // Calculer dynamiquement le style du conteneur d'input
  const inputContainerStyle = useMemo(() => {
    const dynamicStyles: ViewStyle = {
      ...styles.inputContainer
    };
    
    if (validationStatus === 'error') {
      dynamicStyles.borderColor = '#ef4444';
    } else if (validationStatus === 'success') {
      dynamicStyles.borderColor = '#22c55e';
    } else if (isInputFocused) {
      dynamicStyles.borderColor = '#3b82f6';
    }
    
    return dynamicStyles;
  }, [validationStatus, isInputFocused]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Mot de passe oublié ?</Text>
          
          <TouchableOpacity
            style={styles.helpButton}
            onPress={handleHelpPress}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="help-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Entre ton e-mail</Text>
          
          <View style={inputContainerStyle}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                validationStatus === 'error' && styles.inputError
              ]}
              placeholder="Téléphone ou e-mail"
              placeholderTextColor="#999"
              value={emailOrPhone}
              onChangeText={(text) => {
                setEmailOrPhone(text);
                if (validationStatus === 'error') {
                  setValidationStatus('idle');
                  setError('');
                }
              }}
              keyboardType={keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleContinue}
              editable={!isLoading && validationStatus !== 'validating'}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            
            {validationStatus === 'validating' && (
              <View style={styles.inputIconContainer}>
                <Ionicons name="sync" size={20} color="#3b82f6" />
              </View>
            )}
            
            {validationStatus === 'success' && (
              <View style={styles.inputIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              </View>
            )}
            
            {validationStatus === 'error' && (
              <View style={styles.inputIconContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
              </View>
            )}
          </View>
          
          <ErrorMessage message={error} />
          
          {linkSent && (
            <View style={styles.messageContainer}>
              {getConfirmationMessage()}
              
              <View style={styles.infoRow}>
                <InfoIcon />
                <Text style={styles.infoText}>
                  {isEmail ? "Vérifiez vos spams" : "Vérifiez vos messages"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Button */}
        <View style={styles.bottomButtonContainer}>
          <PrimaryButton
            onPress={handleContinue}
            disabled={!emailOrPhone.trim() || validationStatus === 'error'}
            loading={isLoading || validationStatus === 'validating'}
          >
            Continuer
          </PrimaryButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight || 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: isSmallDevice ? 20 : 40,
  },
  title: {
    fontSize: isSmallDevice ? 28 : 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    textAlign: 'left',
  },
  inputContainer: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
    paddingRight: 40,
  },
  inputError: {
    color: '#ef4444',
  },
  inputIconContainer: {
    position: 'absolute',
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 5,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 5,
  },
  messageContainer: {
    marginTop: 30,
    paddingHorizontal: 5,
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  infoIconContainer: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  bottomButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 50,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RequestResetScreen;