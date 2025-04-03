import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Platform,
  Pressable,
  StatusBar,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

type SignupBirthdayScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignupBirthday'>;

const SignupBirthdayScreen = () => {
  const navigation = useNavigation<SignupBirthdayScreenNavigationProp>();
  const route = useRoute<any>();
  const { emailOrPhone, password, firstName, lastName, gender } = route.params;
  const { isLoading } = useAuth();
  
  // Pour la responsive
  const { width, height } = Dimensions.get('window');
  const isSmallDevice = height < 700;
  
  // Animation pour la progression
  const progressAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;
  
  // Date par défaut (18 ans)
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 18);

  // États
  const [birthDate, setBirthDate] = useState<Date>(defaultDate);
  const [age, setAge] = useState<number>(18);
  const [error, setError] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState<boolean>(false);
  
  // Calculer l'âge quand la date change
  useEffect(() => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge);
  }, [birthDate]);
  
  // Animation de la barre de progression
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 600, // Plus rapide
      useNativeDriver: false
    }).start();
  }, []);
  
  // Animation du message d'erreur
  useEffect(() => {
    if (showError) {
      Animated.sequence([
        Animated.timing(errorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 300,
          delay: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => setShowError(false));
    }
  }, [showError, errorAnim]);
  
  // Fonction pour le DateTimePicker d'Android
  const onChange = (event: any, selectedDate?: Date) => {
    setShowAndroidPicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      setBirthDate(selectedDate);
    }
  };

  const handleAndroidDatePress = () => {
    setShowAndroidPicker(true);
  };

  const handleContinue = async () => {
    if (age < 14) {
      setError('Vous devez avoir au moins 14 ans pour créer un compte.');
      setShowError(true);
      return;
    }
    if (age > 120) {
      setError("Cette date de naissance n'est pas valide");
      setShowError(true);
      return;
    }
    
    const birthdateStr = birthDate.toISOString().split('T')[0];
    
    // Naviguer vers l'écran de profil
    navigation.navigate('SignupProfile', {
      emailOrPhone,
      password,
      firstName,
      lastName,
      gender,
      birthdate: birthdateStr
    });
  };
  
  // Calculer l'interpolation pour l'animation du dégradé
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '66.7%'] // 4/6 pour la quatrième étape
  });

  // Formater la date pour l'affichage Android
  const formattedDate = birthDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressBarBackground, { width: progressWidth }]}>
                <LinearGradient
                  colors={['#FFC0CB', '#FFD700']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.helpButton} 
            activeOpacity={0.7}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="help-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={[styles.title, isSmallDevice && styles.titleSmall]}>
            Ma date de naissance
          </Text>
          
          <Text style={[
            styles.ageText,
            age < 0 && styles.invalidAgeText,
            isSmallDevice && styles.ageTextSmall
          ]}>
            {age < 0 ? "Date invalide" : `J'ai ${age} ans`}
          </Text>

          {showError && (
            <Animated.View 
              style={[
                styles.errorContainer, 
                { opacity: errorAnim }
              ]}
            >
              <FontAwesome name="info-circle" size={22} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {Platform.OS === 'ios' ? (
            // iOS style picker (Cupertino) avec hauteur adaptative
            <View style={[
              styles.iosPickerContainer,
              isSmallDevice && styles.iosPickerContainerSmall
            ]}>
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => date && setBirthDate(date)}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                locale="fr-FR"
                textColor="white"
                themeVariant="dark"
                style={[
                  styles.iosPicker,
                  isSmallDevice && styles.iosPickerSmall
                ]}
              />
            </View>
          ) : (
            // Android picker avec style amélioré
            <>
              <Pressable 
                style={[
                  styles.androidPickerTrigger,
                  isSmallDevice && styles.androidPickerTriggerSmall
                ]} 
                onPress={handleAndroidDatePress}
                android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: false }}
              >
                <Text style={[
                  styles.selectedDateText,
                  isSmallDevice && styles.selectedDateTextSmall
                ]}>
                  {formattedDate}
                </Text>
              </Pressable>
              {showAndroidPicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display="default"
                  onChange={onChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </>
          )}
          
          {/* Espace supplémentaire pour s'assurer que le contenu défile correctement */}
          <View style={styles.spacer} />
        </ScrollView>
        
        {/* Bouton Continuer toujours visible en bas */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton, 
              (age < 13 || age > 120 || isLoading) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={age < 13 || age > 120 || isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Chargement...' : 'Continuer'}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    zIndex: 10,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  progressBarContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarBackground: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: 10,
  },
  progressGradient: {
    height: '100%',
    width: '100%',
  },
  helpButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Espace pour le bouton
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 25,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 32,
    marginBottom: 20,
  },
  ageText: {
    fontSize: 38,
    color: '#999',
    textAlign: 'center',
    marginBottom: 25,
  },
  ageTextSmall: {
    fontSize: 32,
    marginBottom: 20,
  },
  invalidAgeText: {
    color: '#FF6B6B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    marginHorizontal: 10,
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  iosPickerContainer: {
    backgroundColor: 'rgba(50, 50, 50, 0.5)',
    borderRadius: 15,
    marginVertical: 15,
    overflow: 'hidden',
    height: 180,
  },
  iosPickerContainerSmall: {
    height: 160,
  },
  iosPicker: {
    height: 180,
    width: '100%',
  },
  iosPickerSmall: {
    height: 160,
  },
  androidPickerTrigger: {
    backgroundColor: 'rgba(50, 50, 50, 0.5)',
    padding: 20,
    borderRadius: 15,
    marginVertical: 15,
    alignItems: 'center',
  },
  androidPickerTriggerSmall: {
    padding: 15,
  },
  selectedDateText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  selectedDateTextSmall: {
    fontSize: 22,
  },
  spacer: {
    height: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(80, 80, 80, 0.3)',
  },
  continueButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  continueButtonText: {
    color: 'black',
    fontSize: 17,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: '#cccccc',
  },
});

export default SignupBirthdayScreen;