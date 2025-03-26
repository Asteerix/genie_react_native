import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TextInput,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  Easing,
  Vibration
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';

type VerifyCodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyCode'>;
type VerifyCodeScreenRouteProp = RouteProp<RootStackParamList, 'VerifyCode'>;

const CODE_LENGTH = 6; // Longueur du code standard

const VerifyCodeScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Code invalide');
  
  const { isLoading } = useAuth();
  const navigation = useNavigation<VerifyCodeScreenNavigationProp>();
  const route = useRoute<VerifyCodeScreenRouteProp>();
  const { emailOrPhone } = route.params;
  
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;
  
  // Détermine si l'entrée est un email ou un téléphone
  const isEmail = emailOrPhone.includes('@');

  // Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Focus sur l'input au chargement
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);
  
  // Animation pour l'erreur
  useEffect(() => {
    if (showError) {
      Vibration.vibrate(50);
      Animated.timing(errorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Cache l'erreur après 3 secondes
      const timer = setTimeout(() => {
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowError(false));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showError]);
  
  // Compte à rebours pour le renvoi de code
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown - 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  const handleCodeChange = useCallback((text: string) => {
    // On ne garde que les chiffres
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= CODE_LENGTH) {
      setCode(cleaned);
      
      // Si l'erreur est affichée, on la cache lorsque l'utilisateur commence à taper
      if (showError) {
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowError(false));
      }
      
      // Si le code est complet, on valide automatiquement
      if (cleaned.length === CODE_LENGTH) {
        setTimeout(() => handleSubmit(cleaned), 300);
      }
    }
  }, [showError]);

  const handleSubmit = useCallback(async (submittedCode?: string) => {
    const codeToVerify = submittedCode || code;
    
    if (codeToVerify.length !== CODE_LENGTH || isLoading) return;
    
    try {
      // Simuler une vérification de code
      // Accepter tous les codes pour la démo, mais on pourrait ajouter une vérification
      
      // Naviguer vers l'écran de création de nouveau mot de passe
      navigation.navigate('CreateNewPassword', { 
        emailOrPhone, 
        code: codeToVerify 
      });
    } catch (error) {
      setErrorMessage('Code invalide. Veuillez réessayer.');
      setShowError(true);
    }
  }, [code, navigation, emailOrPhone, isLoading]);

  const resendCode = useCallback(async () => {
    if (countdown > 0 || isSendingCode) return;
    
    setIsSendingCode(true);
    
    try {
      // Simuler l'envoi d'un nouveau code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Réinitialiser le compte à rebours
      setCountdown(30);
      
      // Montrer un message de succès
      setErrorMessage('Code envoyé avec succès !');
      setShowError(true);
    } catch (error) {
      setErrorMessage("Échec de l'envoi du code");
      setShowError(true);
    } finally {
      setIsSendingCode(false);
    }
  }, [countdown, isSendingCode]);
  
  // Masquer une partie de l'email/téléphone pour la confidentialité
  const getDisplayIdentifier = () => {
    if (isEmail) {
      const [username, domain] = emailOrPhone.split('@');
      if (username.length > 2) {
        return `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`;
      }
      return emailOrPhone;
    } else {
      if (emailOrPhone.length > 4) {
        return `${emailOrPhone.substring(0, 2)}${'*'.repeat(emailOrPhone.length - 4)}${emailOrPhone.substring(emailOrPhone.length - 2)}`;
      }
      return emailOrPhone;
    }
  };
  
  // Générer les boîtes de code
  const renderCodeBoxes = () => {
    const boxes = [];
    
    for (let i = 0; i < CODE_LENGTH; i++) {
      boxes.push(
        <View 
          key={i} 
          style={[
            styles.codeBox,
            code[i] ? styles.codeBoxFilled : null,
            i === code.length && styles.codeBoxActive
          ]}
        >
          <Text style={styles.codeText}>{code[i] || ''}</Text>
        </View>
      );
    }
    
    return boxes;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="chevron-back" size={28} color="black" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Vérification</Text>
            
            <TouchableOpacity 
              style={styles.helpButton}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="help-circle-outline" size={28} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.title}>Entre le code</Text>
            
            <Text style={styles.subtitle}>
              Nous avons envoyé un code de vérification à <Text style={styles.boldText}>{getDisplayIdentifier()}</Text>
            </Text>
            
            <View style={styles.codeInputContainer}>
              <View style={styles.codeBoxesContainer}>
                {renderCodeBoxes()}
              </View>
              
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                caretHidden={true}
              />
            </View>
            
            <Animated.View 
              style={[
                styles.errorContainer,
                {
                  opacity: errorAnim,
                  transform: [{ 
                    translateY: errorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    })
                  }]
                }
              ]}
            >
              <Ionicons 
                name={errorMessage.includes('succès') ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={errorMessage.includes('succès') ? "#22c55e" : "#ef4444"} 
              />
              <Text 
                style={[
                  styles.errorText,
                  errorMessage.includes('succès') && styles.successText
                ]}
              >
                {errorMessage}
              </Text>
            </Animated.View>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Vous n'avez pas reçu de code ?</Text>
              <TouchableOpacity 
                onPress={resendCode}
                disabled={countdown > 0 || isSendingCode}
                style={styles.resendButton}
              >
                <Text 
                  style={[
                    styles.resendButtonText,
                    (countdown > 0 || isSendingCode) && styles.resendButtonTextDisabled
                  ]}
                >
                  {isSendingCode 
                    ? 'Envoi en cours...' 
                    : countdown > 0 
                      ? `Renvoyer (${countdown} s)` 
                      : 'Renvoyer'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (code.length !== CODE_LENGTH || isLoading) && styles.disabledButton
              ]} 
              onPress={() => handleSubmit()}
              disabled={code.length !== CODE_LENGTH || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Vérification...' : 'Continuer'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight || 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
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
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: isSmallDevice ? 28 : 32,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },
  codeInputContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  codeBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeBox: {
    width: 40,
    height: 45,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  codeBoxFilled: {
    borderColor: '#333',
    backgroundColor: '#fff',
  },
  codeBoxActive: {
    borderColor: '#1877F2',
    borderWidth: 2,
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: 50,
    opacity: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
  },
  successText: {
    color: '#22c55e',
  },
  resendContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#1877F2',
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#a0a0a0',
  },
  bottomContainer: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  submitButton: {
    backgroundColor: 'black',
    borderRadius: 30,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

export default VerifyCodeScreen;