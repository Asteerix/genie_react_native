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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';

type VerifyPhoneScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyPhone'>;
type VerifyPhoneScreenRouteProp = RouteProp<RootStackParamList, 'VerifyPhone'>;

const CODE_LENGTH = 5;

const VerifyPhoneScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showError, setShowError] = useState(false);
  const { signUp, isLoading } = useAuth();
  const navigation = useNavigation<VerifyPhoneScreenNavigationProp>();
  const route = useRoute<VerifyPhoneScreenRouteProp>();
  const { phoneNumber } = route.params;
  const inputRef = useRef<TextInput>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    
    // Focus sur l'input au chargement
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Animation pour l'erreur
  useEffect(() => {
    if (showError) {
      Vibration.vibrate(50);
      Animated.sequence([
        Animated.timing(errorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => setShowError(false));
    }
  }, [showError, errorAnim]);

  // Animation d'impulsion pour la boîte active
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    );
    
    if (code.length < CODE_LENGTH) {
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
      pulseAnimation.stop();
    }
    
    return () => {
      pulseAnimation.stop();
    };
  }, [code.length, pulseAnim]);

  // Compte à rebours pour le renvoi de code
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  const handleCodeChange = useCallback((text: string) => {
    // Ne garder que les chiffres
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= CODE_LENGTH) {
      setCode(cleaned);
      
      // Si l'erreur est affichée, on la masque quand l'utilisateur entre un nouveau chiffre
      if (showError) {
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowError(false));
      }
      
      // Si le code est complet, vérifier automatiquement
      if (cleaned.length === CODE_LENGTH) {
        setTimeout(() => handleSubmit(cleaned), 300);
      }
    }
  }, [showError]);

  const resendCode = useCallback(() => {
    if (countdown === 0 && !isResending) {
      setIsResending(true);
      Vibration.vibrate(30);
      
      // Simuler l'envoi d'un nouveau code
      setTimeout(() => {
        setIsResending(false);
        setCountdown(30);
      }, 1500);
    }
  }, [countdown, isResending]);

  const renderCodeBoxes = useCallback(() => {
    const boxes = [];
    for (let i = 0; i < CODE_LENGTH; i++) {
      const isActive = i === code.length && code.length < CODE_LENGTH;
      
      // Appliquer l'animation de pulsation uniquement à la boîte active
      const animatedStyle = isActive ? {
        transform: [{ scale: pulseAnim }]
      } : {};
      
      boxes.push(
        <Animated.View 
          key={i} 
          style={[
            styles.codeBox,
            code[i] ? styles.codeBoxFilled : null,
            isActive && styles.codeBoxActive,
            animatedStyle
          ]}
        >
          {code[i] && (
            <Text style={styles.codeText}>•</Text>
          )}
        </Animated.View>
      );
    }
    return boxes;
  }, [code, pulseAnim]);

  const handleSubmit = useCallback(async (submittedCode?: string) => {
    const codeToVerify = submittedCode || code;
    
    if (codeToVerify.length !== CODE_LENGTH || isLoading) return;
    
    // Simuler une vérification de code
    // Pour la démo, accepter 12345 comme code valide
    if (codeToVerify === '12345') {
      try {
        // Naviguer vers l'écran de saisie du prénom
        navigation.navigate('SignupName', { emailOrPhone: phoneNumber, password: '' });
      } catch (error) {
        console.error(error);
        setShowError(true);
      }
    } else {
      // Afficher l'erreur
      setShowError(true);
    }
  }, [code, isLoading, navigation, phoneNumber]);

  // Masquer une partie du numéro de téléphone pour la confidentialité
  const getDisplayPhone = useCallback(() => {
    if (phoneNumber.length > 4) {
      return `${phoneNumber.substring(0, 2)}${'*'.repeat(phoneNumber.length - 4)}${phoneNumber.substring(phoneNumber.length - 2)}`;
    }
    return phoneNumber;
  }, [phoneNumber]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerSpacer} />
            
            <TouchableOpacity 
              style={styles.helpButton}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="help-circle-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.title}>Entre le code</Text>
            
            <View style={styles.codeBoxesContainer}>
              {renderCodeBoxes()}
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                autoFocus={true}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.resendContainer} 
              onPress={resendCode}
              disabled={countdown > 0 || isResending}
              activeOpacity={countdown > 0 || isResending ? 1 : 0.7}
            >
              {isResending ? (
                <View style={styles.resendLoadingContainer}>
                  <Animated.View style={{
                    transform: [{
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }}>
                    <Ionicons name="sync" size={16} color="#999" style={{ marginRight: 8 }} />
                  </Animated.View>
                  <Text style={styles.resendText}>Envoi en cours...</Text>
                </View>
              ) : (
                <Text style={[styles.resendText, countdown === 0 && styles.resendTextActive]}>
                  Recevoir un nouveau code {countdown > 0 ? `(${countdown} sec)` : ''}
                </Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.messageText}>
              Tu as reçu <Text style={styles.boldText}>un code d'inscription</Text> par SMS au {getDisplayPhone()}.
            </Text>
            
            <Animated.View 
              style={[
                styles.errorContainer,
                { opacity: errorAnim }
              ]}
            >
              <FontAwesome name="info-circle" size={20} color="white" />
              <Text style={styles.errorText}>Le code est invalide</Text>
            </Animated.View>
          </View>
          
          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (code.length !== CODE_LENGTH || isLoading) && styles.disabledButton
              ]} 
              onPress={() => handleSubmit()}
              disabled={code.length !== CODE_LENGTH || isLoading}
              activeOpacity={0.9}
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
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    marginBottom: 30,
  },
  headerSpacer: {
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
  mainContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallDevice ? 28 : 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 50,
    textAlign: 'center',
  },
  codeBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 60,
    position: 'relative',
  },
  codeBox: {
    width: 50,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    backgroundColor: 'white',
  },
  codeBoxActive: {
    backgroundColor: '#666',
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 60,
    padding: 10,
  },
  resendLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#999',
  },
  resendTextActive: {
    color: '#ccc', 
    textDecorationLine: 'underline',
  },
  messageText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginHorizontal: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 10,
  },
  bottomContainer: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  submitButton: {
    backgroundColor: 'white',
    borderRadius: 50,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default VerifyPhoneScreen;