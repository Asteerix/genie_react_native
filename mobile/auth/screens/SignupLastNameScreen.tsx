import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  TextInput,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

type SignupLastNameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignupLastName'>;

// Regex pour la validation des noms
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s\-]+$/;

const SignupLastNameScreen = () => {
  // États
  const [lastName, setLastName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Hooks
  const { isLoading } = useAuth();
  const navigation = useNavigation<SignupLastNameScreenNavigationProp>();
  const route = useRoute<any>();
  const { emailOrPhone, password, firstName } = route.params;
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  
  // Gérer le clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );
    
    // Focus sur l'input après un court délai
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Validation du nom
  const validateLastName = (name) => {
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      setErrorMessage('Le nom ne peut pas être vide');
      return false;
    }
    
    if (trimmedName.length < 2) {
      setErrorMessage('Le nom doit contenir au moins 2 caractères');
      return false;
    }
    
    if (!NAME_REGEX.test(trimmedName)) {
      setErrorMessage('Le nom ne peut contenir que des lettres');
      return false;
    }
    
    if (trimmedName.length > 30) {
      setErrorMessage('Le nom ne peut pas dépasser 30 caractères');
      return false;
    }
    
    setErrorMessage('');
    return true;
  };

  // Continuer vers l'écran suivant
  const handleContinue = () => {
    if (isLoading || !lastName.trim()) return;
    
    Keyboard.dismiss();
    
    if (validateLastName(lastName)) {
      navigation.navigate('SignupGender', {
        emailOrPhone,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          {/* Header avec barre de progression */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#FFC0CB', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.helpButton}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="help-circle-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Contenu principal */}
          <View style={[
            styles.content,
            keyboardVisible && styles.contentWithKeyboard
          ]}>
            <Text style={[
              styles.title,
              keyboardVisible && styles.titleWithKeyboard
            ]}>
              Mon nom de famille
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errorMessage) validateLastName(text);
                }}
                placeholder="Dupond"
                placeholderTextColor="#666"
                maxLength={30}
                autoCapitalize="words"
                selectionColor="rgba(255,255,255,0.5)"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              
              {lastName.length > 0 && (
                <View style={styles.characterCountContainer}>
                  <Text style={[
                    styles.characterCount,
                    lastName.length > 25 && styles.characterCountWarning
                  ]}>
                    {lastName.length}/30
                  </Text>
                </View>
              )}
            </View>
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error" size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            {/* Aperçu du nom complet - visible uniquement quand le clavier est fermé */}
            {!keyboardVisible && (
              <View style={styles.namePreviewContainer}>
                <Text style={styles.namePreviewLabel}>Aperçu de votre nom complet :</Text>
                <View style={styles.namePreviewBox}>
                  <Text style={styles.namePreviewText}>
                    {firstName} {lastName || '...'}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Bouton Continuer - positionné selon l'état du clavier */}
          <View 
            style={[
              styles.buttonContainer,
              keyboardVisible && {
                position: 'absolute', 
                bottom: keyboardHeight, 
                left: 0,
                right: 0,
                paddingBottom: 10
              }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.continueButton,
                (!lastName.trim() || isLoading) && styles.buttonDisabled
              ]} 
              onPress={handleContinue}
              disabled={!lastName.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                Continuer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  helpButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '33.4%', // 2/6 des étapes
    height: '100%',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  contentWithKeyboard: {
    paddingTop: 10,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 50,
    textAlign: 'center',
  },
  titleWithKeyboard: {
    fontSize: 30,
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 10,
    paddingBottom: 5,
  },
  input: {
    color: 'white',
    fontSize: 36,
    fontWeight: '300',
    textAlign: 'center',
    paddingVertical: 10,
  },
  characterCountContainer: {
    position: 'absolute',
    right: 0,
    bottom: -20,
  },
  characterCount: {
    color: '#777',
    fontSize: 12,
  },
  characterCountWarning: {
    color: '#FFA500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 5,
    fontSize: 14,
  },
  namePreviewContainer: {
    alignItems: 'center',
    marginTop: 60,
    width: '100%',
  },
  namePreviewLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 10,
  },
  namePreviewBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginTop: 5,
    minWidth: '80%',
    alignItems: 'center',
  },
  namePreviewText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  continueButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: 'black',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default SignupLastNameScreen;