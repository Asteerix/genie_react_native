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

type SignupNameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignupName'>;

// Regex pour la validation des noms
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s\-]+$/;

const SignupNameScreen = () => {
  // États
  const [firstName, setFirstName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Hooks
  const { isLoading } = useAuth();
  const navigation = useNavigation<SignupNameScreenNavigationProp>();
  const route = useRoute<any>();
  const { emailOrPhone, password } = route.params;
  
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

  // Validation du prénom
  const validateFirstName = (name) => {
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      setErrorMessage('Le prénom ne peut pas être vide');
      return false;
    }
    
    if (trimmedName.length < 2) {
      setErrorMessage('Le prénom doit contenir au moins 2 caractères');
      return false;
    }
    
    if (!NAME_REGEX.test(trimmedName)) {
      setErrorMessage('Le prénom ne peut contenir que des lettres');
      return false;
    }
    
    if (trimmedName.length > 30) {
      setErrorMessage('Le prénom ne peut pas dépasser 30 caractères');
      return false;
    }
    
    setErrorMessage('');
    return true;
  };

  // Continuer vers l'écran suivant
  const handleContinue = () => {
    if (isLoading || !firstName.trim()) return;
    
    Keyboard.dismiss();
    
    if (validateFirstName(firstName)) {
      navigation.navigate('SignupLastName', {
        emailOrPhone,
        password,
        firstName: firstName.trim()
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
              <LinearGradient
                colors={['#FFC0CB', '#FFD700']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.helpButton}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="help-circle-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Contenu principal */}
          <View style={styles.content}>
            <Text style={styles.title}>
              Mon prénom
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errorMessage) validateFirstName(text);
                }}
                placeholder="Jean"
                placeholderTextColor="#666"
                maxLength={30}
                autoCapitalize="words"
                selectionColor="rgba(255,255,255,0.5)"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error" size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>
          
          {/* Bouton Continuer - visible en bas quand clavier fermé OU au-dessus du clavier quand ouvert */}
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
                (!firstName.trim() || isLoading) && styles.buttonDisabled
              ]} 
              onPress={handleContinue}
              disabled={!firstName.trim() || isLoading}
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
    height: 8,
    backgroundColor: '#333',
    marginHorizontal: 15,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '16.7%', // 1/6 des étapes
    height: '100%',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 50,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 10,
  },
  input: {
    color: 'white',
    fontSize: 36,
    fontWeight: '300',
    textAlign: 'center',
    paddingVertical: 10,
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

export default SignupNameScreen;