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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type ManagedAccountNameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManagedAccountName'>;

// Regex pour la validation des noms
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s\-]+$/;

const ManagedAccountNameScreen: React.FC = () => {
  // États
  const [firstName, setFirstName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Hooks
  const navigation = useNavigation<ManagedAccountNameScreenNavigationProp>();
  
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
    if (!firstName.trim()) return;
    
    Keyboard.dismiss();
    
    if (validateFirstName(firstName)) {
      navigation.navigate('ManagedAccountLastName', {
        firstName: firstName.trim()
      });
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          {/* Header avec barre de progression */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <LinearGradient
                colors={['#FFB6C1', '#FFC0CB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.helpButton}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            >
              <View style={styles.helpCircle}>
                <Text style={styles.helpText}>?</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Contenu principal */}
          <View style={styles.content}>
            <Text style={styles.title}>
              Son prénom
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
                placeholder="Charlie"
                placeholderTextColor="#CCCCCC"
                maxLength={30}
                autoCapitalize="words"
                selectionColor="rgba(0,0,0,0.5)"
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
                !firstName.trim() && styles.buttonDisabled
              ]} 
              onPress={handleContinue}
              disabled={!firstName.trim()}
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  helpCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '16.7%', // Première étape (1/6)
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
    color: 'black',
    marginBottom: 50,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 10,
  },
  input: {
    color: 'black',
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
    backgroundColor: '#000',
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default ManagedAccountNameScreen;