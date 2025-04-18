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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

type ManagedAccountLastNameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManagedAccountLastName'>;
type ManagedAccountLastNameScreenRouteProp = RouteProp<RootStackParamList, 'ManagedAccountLastName'>;

// Regex pour la validation des noms
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s\-]+$/;

const ManagedAccountLastNameScreen: React.FC = () => {
  // États
  const [lastName, setLastName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Hooks
  const navigation = useNavigation<ManagedAccountLastNameScreenNavigationProp>();
  const route = useRoute<ManagedAccountLastNameScreenRouteProp>();
  const { firstName } = route.params;
  
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
    if (!lastName.trim()) return;
    
    Keyboard.dismiss();
    
    if (validateLastName(lastName)) {
      navigation.navigate('ManagedAccountGender', {
        firstName: route.params.firstName,
        lastName: lastName.trim()
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
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#FFB6C1', '#FFC0CB']}
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
              <View style={styles.helpCircle}>
                <Text style={styles.helpText}>?</Text>
              </View>
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
              Son nom de famille
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
                placeholderTextColor="#CCCCCC"
                maxLength={30}
                autoCapitalize="words"
                selectionColor="rgba(0,0,0,0.5)"
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
                <Text style={styles.namePreviewLabel}>Aperçu du nom complet :</Text>
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
                !lastName.trim() && styles.buttonDisabled
              ]} 
              onPress={handleContinue}
              disabled={!lastName.trim()}
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
    marginHorizontal: 15,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '33.4%', // Deuxième étape (2/6)
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
    color: 'black',
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
    borderBottomColor: '#000',
    marginBottom: 10,
    paddingBottom: 5,
  },
  input: {
    color: 'black',
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
    color: '#777',
    fontSize: 14,
    marginBottom: 10,
  },
  namePreviewBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginTop: 5,
    minWidth: '80%',
    alignItems: 'center',
  },
  namePreviewText: {
    color: 'black',
    fontSize: 20,
    fontWeight: '500',
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

export default ManagedAccountLastNameScreen;