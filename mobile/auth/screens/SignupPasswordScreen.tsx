import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  TextInput,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Vibration,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Animated
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';

type SignupPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignupPassword'>;
type SignupPasswordScreenRouteProp = RouteProp<RootStackParamList, 'SignupPassword'>;

// Critère de validation plus compact
const CompactCriterion = React.memo(({ isValid, text }: { isValid: boolean, text: string }) => {
  return (
    <View style={styles.compactCriterionRow}>
      {isValid ? (
        <View style={styles.validCheckContainer}>
          <MaterialCommunityIcons name="check" size={12} color="white" />
        </View>
      ) : (
        <MaterialCommunityIcons name="circle-outline" size={18} color="#888" />
      )}
      <Text style={[styles.compactCriterionText, isValid && styles.criterionTextValid]}>
        {text}
      </Text>
    </View>
  );
});

const SignupPasswordScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { signUp, isLoading } = useAuth();
  const navigation = useNavigation<SignupPasswordScreenNavigationProp>();
  const route = useRoute<SignupPasswordScreenRouteProp>();
  const { emailOrPhone } = route.params;
  const inputRef = useRef<TextInput>(null);
  const strengthAnimation = useRef(new Animated.Value(0)).current;
  
  // Déterminer si c'est un email ou téléphone
  const isPhone = useMemo(() => {
    return /^(\+|00)?[0-9\s\-\(\)]{8,}$/.test(emailOrPhone);
  }, [emailOrPhone]);

  // Gestion du clavier améliorée
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        // Plus besoin de défiler car tout est visible
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    // Focus sur l'input au chargement
    setTimeout(() => inputRef.current?.focus(), 300);

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Vérifier les critères du mot de passe
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Conditions minimales requises (basées sur les recommandations NIST actuelles)
  const isValidPassword = hasMinLength && 
    ((hasUpperCase && hasLowerCase) || (hasUpperCase && hasNumber) || (hasLowerCase && hasNumber));
  
  // Calculer la force du mot de passe selon des standards reconnus
  const { passwordStrength, strengthText, strengthColor, strengthLevel } = useMemo(() => {
    if (password.length === 0) return { 
      passwordStrength: 0, 
      strengthText: 'Très faible',
      strengthColor: '#ff4d4d',
      strengthLevel: 0
    };
    
    // Calcul de l'entropie de base (méthode reconnue pour évaluer la sécurité)
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 33; // Caractères spéciaux communs
    
    // Calcul de l'entropie de base (log2(charset^length))
    const entropy = Math.log2(Math.pow(charsetSize, password.length));
    
    // Pénalités pour les motifs communs
    let penaltyFactor = 1;
    
    // Pénalité pour les séquences (abc, 123, etc.)
    const hasSequence = /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789/i.test(password);
    if (hasSequence) penaltyFactor *= 0.8;
    
    // Pénalité pour les répétitions (aa, 11, etc.)
    const hasRepetition = /(.)\1{2,}/i.test(password); // Même caractère répété 3 fois ou plus
    if (hasRepetition) penaltyFactor *= 0.8;
    
    // Pénalité pour l'utilisation de mots communs (simplifiée ici)
    const commonWords = ['password', 'qwerty', 'admin', '123456', 'welcome', 'secret'];
    if (commonWords.some(word => password.toLowerCase().includes(word))) penaltyFactor *= 0.7;
    
    // Application des pénalités à l'entropie
    const adjustedEntropy = entropy * penaltyFactor;
    
    // Conversion de l'entropie en score de 0 à 100
    // Basé sur les recommandations du NIST: >80 bits pour des mots de passe forts
    const strengthScore = Math.min(100, (adjustedEntropy / 80) * 100);
    const normalizedStrength = strengthScore / 100;
    
    // Détermination du niveau de force (0-4)
    let level = 0;
    let text = 'Très faible';
    let color = '#ff4d4d'; // Rouge
    
    if (strengthScore >= 20 && strengthScore < 40) {
      level = 1;
      text = 'Faible';
      color = '#ff8c00'; // Orange
    } else if (strengthScore >= 40 && strengthScore < 60) {
      level = 2;
      text = 'Moyen';
      color = '#ffcc00'; // Jaune
    } else if (strengthScore >= 60 && strengthScore < 80) {
      level = 3;
      text = 'Fort';
      color = '#99cc33'; // Vert clair
    } else if (strengthScore >= 80) {
      level = 4;
      text = 'Très fort';
      color = '#00cc00'; // Vert
    }
    
    // Animation de la barre de force
    Animated.timing(strengthAnimation, {
      toValue: Math.max(0.05, normalizedStrength),
      duration: 300,
      useNativeDriver: false
    }).start();
    
    return { 
      passwordStrength: normalizedStrength,
      strengthText: text,
      strengthColor: color,
      strengthLevel: level
    };
  }, [password, strengthAnimation]);

  const handleSubmit = useCallback(async () => {
    if (!isValidPassword || isLoading) return;
    
    try {
      // Feedback haptique
      Vibration.vibrate(40);
      
      if (isPhone) {
        // Si c'est un téléphone, naviguer vers l'écran de vérification du téléphone
        navigation.navigate('VerifyPhone', { phoneNumber: emailOrPhone });
      } else {
        // Si c'est un email, naviguer vers l'écran de saisie du prénom
        navigation.navigate('SignupName', { emailOrPhone, password });
      }
    } catch (error) {
      console.error(error);
    }
  }, [isValidPassword, isLoading, isPhone, emailOrPhone, password, navigation]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderCriteria = () => {
    // Version compacte mais en une seule colonne des critères
    return (
      <View style={styles.criteriaContainer}>
        <View style={styles.criterionRow}>
          {hasMinLength ? (
            <View style={styles.validCheckContainer}>
              <MaterialCommunityIcons name="check" size={12} color="white" />
            </View>
          ) : (
            <MaterialCommunityIcons name="circle-outline" size={16} color="#888" />
          )}
          <Text style={[styles.criterionText, hasMinLength && styles.criterionTextValid]}>
            Au moins 8 caractères
          </Text>
        </View>
        
        <View style={styles.criterionRow}>
          {hasUpperCase ? (
            <View style={styles.validCheckContainer}>
              <MaterialCommunityIcons name="check" size={12} color="white" />
            </View>
          ) : (
            <MaterialCommunityIcons name="circle-outline" size={16} color="#888" />
          )}
          <Text style={[styles.criterionText, hasUpperCase && styles.criterionTextValid]}>
            Au moins une majuscule
          </Text>
        </View>
        
        <View style={styles.criterionRow}>
          {hasLowerCase ? (
            <View style={styles.validCheckContainer}>
              <MaterialCommunityIcons name="check" size={12} color="white" />
            </View>
          ) : (
            <MaterialCommunityIcons name="circle-outline" size={16} color="#888" />
          )}
          <Text style={[styles.criterionText, hasLowerCase && styles.criterionTextValid]}>
            Au moins une minuscule
          </Text>
        </View>
        
        <View style={styles.criterionRow}>
          {hasNumber ? (
            <View style={styles.validCheckContainer}>
              <MaterialCommunityIcons name="check" size={12} color="white" />
            </View>
          ) : (
            <MaterialCommunityIcons name="circle-outline" size={16} color="#888" />
          )}
          <Text style={[styles.criterionText, hasNumber && styles.criterionTextValid]}>
            Au moins un chiffre
          </Text>
        </View>
        
        <View style={styles.criterionRow}>
          {hasSpecialChar ? (
            <View style={styles.validCheckContainer}>
              <MaterialCommunityIcons name="check" size={12} color="white" />
            </View>
          ) : (
            <MaterialCommunityIcons name="circle-outline" size={16} color="#888" />
          )}
          <Text style={[styles.criterionText, hasSpecialChar && styles.criterionTextValid]}>
            Au moins un caractère spécial
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <KeyboardAvoidingView 
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.container}>
            {/* Header - Toujours visible */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.helpButton}
                hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              >
                <Ionicons name="help-circle-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Contenu principal - pas de scroll nécessaire */}
            <View style={styles.scrollViewContent}>
              {/* Titre - toujours visible mais réduit quand le clavier est ouvert */}
              <Text style={[
                styles.title,
                keyboardVisible && styles.titleCompact
              ]}>Créer un mot de passe</Text>
              
              {/* Champ de mot de passe amélioré */}
              <View style={[
                styles.inputContainerWrapper,
                isInputFocused && styles.inputContainerWrapperFocused
              ]}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#777"
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    selectionColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity 
                    style={styles.visibilityToggle} 
                    onPress={togglePasswordVisibility}
                    hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color={isInputFocused ? "#7f7fff" : "#777"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Indicateur de force du mot de passe redesigné */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarContainer}>
                    <View style={styles.strengthBarBackground} />
                    
                    {/* Séparateurs pour les segments */}
                    <View style={styles.strengthSegments}>
                      <View style={styles.strengthSegmentDivider} />
                      <View style={styles.strengthSegmentDivider} />
                      <View style={styles.strengthSegmentDivider} />
                      <View style={styles.strengthSegmentDivider} />
                    </View>
                    
                    {/* Barre de progression animée */}
                    <Animated.View 
                      style={[
                        styles.strengthBar, 
                        { 
                          width: strengthAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                          })
                        }
                      ]} 
                    >
                      <LinearGradient
                        style={styles.strengthGradient}
                        colors={strengthLevel <= 1 ? 
                          ['#ff4d4d', '#ff8c00'] : 
                          strengthLevel <= 2 ? 
                            ['#ff8c00', '#ffcc00'] : 
                            strengthLevel <= 3 ? 
                              ['#ffcc00', '#99cc33'] : 
                              ['#99cc33', '#00cc00']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </Animated.View>
                  </View>
                  
                  <Text style={[styles.strengthText, { color: strengthColor }]}>
                    {strengthText}
                  </Text>
                </View>
              )}
              
              {/* Critères de mot de passe */}
              {renderCriteria()}
              
            </View>
            
            {/* Bouton Continuer - toujours visible en bas */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!isValidPassword || isLoading) && styles.disabledButton
                ]} 
                onPress={handleSubmit}
                disabled={!isValidPassword || isLoading}
                activeOpacity={0.9}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Chargement...' : 'Continuer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 10,
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 25,
  },
  titleCompact: {
    fontSize: 22,
    marginBottom: 15,
  },
  inputContainerWrapper: {
    width: '100%',
    height: 60,
    marginBottom: 15,
    position: 'relative',
    borderRadius: 8,
    backgroundColor: 'rgba(50, 50, 50, 0.3)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  inputContainerWrapperFocused: {
    borderColor: '#7f7fff',
    shadowColor: '#7f7fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: '100%',
    color: 'white',
    fontSize: 18,
    paddingRight: 50,
  },
  visibilityToggle: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  strengthContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 5,
  },
  strengthBarContainer: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    marginRight: 15,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  strengthBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  strengthBar: {
    position: 'absolute',
    height: '100%',
    borderRadius: 5,
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  strengthGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  strengthSegments: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '20%',
    zIndex: 1,
  },
  strengthSegmentDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
  criteriaContainer: {
    width: '100%',
    marginTop: 5,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactCriterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  validCheckContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  criterionText: {
    fontSize: 14,
    color: '#AAA',
  },
  compactCriterionText: {
    fontSize: 12,
    color: '#AAA',
  },
  criterionTextValid: {
    color: '#ccffcc',
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(80, 80, 80, 0.3)',
  },
  submitButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonText: {
    color: 'black',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#e5e5e5',
  }
});

export default SignupPasswordScreen;