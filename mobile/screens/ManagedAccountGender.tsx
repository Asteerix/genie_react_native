import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  Easing,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dimensions de l'écran
const { width } = Dimensions.get('window');

type ManagedAccountGenderScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManagedAccountGender'>;
type ManagedAccountGenderScreenRouteProp = RouteProp<RootStackParamList, 'ManagedAccountGender'>;

const ManagedAccountGenderScreen: React.FC = () => {
  // États
  const [selectedGender, setSelectedGender] = useState<'femme' | 'homme' | 'autre' | null>(null);
  
  // Animation des cartes
  const femmeCardAnim = useRef(new Animated.Value(width)).current;
  const hommeCardAnim = useRef(new Animated.Value(width)).current;
  const autreOptionAnim = useRef(new Animated.Value(0)).current;
  const autreScaleAnim = useRef(new Animated.Value(0.8)).current;
  const gradientProgress = useRef(new Animated.Value(0)).current;
  
  // Hooks de navigation
  const navigation = useNavigation<ManagedAccountGenderScreenNavigationProp>();
  const route = useRoute<ManagedAccountGenderScreenRouteProp>();
  const { firstName, lastName } = route.params;

  // Animation d'entrée des éléments
  useEffect(() => {
    // Animation de la barre de progression
    Animated.timing(gradientProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease)
    }).start();
    
    // Animation séquentielle des cartes
    Animated.stagger(150, [
      Animated.timing(femmeCardAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.timing(hommeCardAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.parallel([
        Animated.timing(autreOptionAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(autreScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2))
        })
      ])
    ]).start();
  }, []);

  // Calculer l'interpolation pour l'animation du dégradé
  const gradientWidth = gradientProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  // Animation des options quand une sélection est faite
  const animateSelection = (gender: 'femme' | 'homme' | 'autre') => {
    // Créer une animation de pulse pour l'option sélectionnée
    if (gender === 'femme') {
      Animated.sequence([
        Animated.timing(femmeCardAnim, {
          toValue: -5,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(femmeCardAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    } else if (gender === 'homme') {
      Animated.sequence([
        Animated.timing(hommeCardAnim, {
          toValue: -5,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(hommeCardAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    } else if (gender === 'autre') {
      Animated.sequence([
        Animated.timing(autreScaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(autreScaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const handleGenderSelect = (gender: 'femme' | 'homme' | 'autre') => {
    setSelectedGender(gender);
    animateSelection(gender);
    
    // Auto-continue après sélection pour "femme" ou "homme"
    if (gender === 'femme' || gender === 'homme') {
      setTimeout(() => {
        handleContinue(gender);
      }, 500);
    } else if (gender === 'autre') {
      // Montrer le bouton continuer si nécessaire
      setTimeout(() => {
        handleContinue('autre');
      }, 500);
    }
  };

  const handleContinue = (gender?: 'femme' | 'homme' | 'autre') => {
    const genderToUse = gender || selectedGender;
    if (!genderToUse) return;
    
    // Naviguer vers l'écran de date de naissance
    navigation.navigate('ManagedAccountBirthday', {
      firstName,
      lastName,
      gender: genderToUse
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressBarBackground, { width: gradientWidth }]}>
                <LinearGradient
                  colors={['#FFB6C1', '#FFC0CB']}
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
            <View style={styles.helpCircle}>
              <Text style={styles.helpText}>?</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Son genre</Text>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.optionsContainer}>
            {/* Option Féminin */}
            <Animated.View
              style={[
                styles.cardContainer,
                { transform: [{ translateX: femmeCardAnim }] }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.optionCard, 
                  selectedGender === 'femme' && styles.selectedOption
                ]} 
                onPress={() => handleGenderSelect('femme')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFB6C1', '#FFC0CB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <FontAwesome name="venus" size={24} color="white" />
                </LinearGradient>
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>Féminin</Text>
                  <Text style={styles.optionSubtext}>Identité féminine</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
              </TouchableOpacity>
            </Animated.View>

            {/* Option Masculin */}
            <Animated.View
              style={[
                styles.cardContainer,
                { transform: [{ translateX: hommeCardAnim }] }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.optionCard, 
                  selectedGender === 'homme' && styles.selectedOption
                ]} 
                onPress={() => handleGenderSelect('homme')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#87CEFA', '#1E90FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <FontAwesome name="mars" size={24} color="white" />
                </LinearGradient>
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>Masculin</Text>
                  <Text style={styles.optionSubtext}>Identité masculine</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" style={styles.chevron} />
              </TouchableOpacity>
            </Animated.View>

            {/* Option Autre */}
            <Animated.View
              style={[
                styles.thirdOptionContainer,
                {
                  opacity: autreOptionAnim,
                  transform: [{ scale: autreScaleAnim }]
                }
              ]}
            >
              <TouchableOpacity 
                style={[
                  styles.thirdOptionCard,
                  selectedGender === 'autre' && styles.selectedThirdOption
                ]} 
                onPress={() => handleGenderSelect('autre')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedGender === 'autre' ? 
                    ['#9A59B5', '#8E44AD'] : 
                    ['#F8F8F8', '#F0F0F0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.thirdOptionGradient}
                >
                  <FontAwesome 
                    name="transgender" 
                    size={20} 
                    color={selectedGender === 'autre' ? '#FFFFFF' : '#666666'} 
                  />
                  <Text style={[
                    styles.thirdOptionText,
                    selectedGender === 'autre' && styles.selectedThirdOptionText
                  ]}>
                    Aucun d'entre eux
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Texte d'aide en bas */}
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpText}>
            Vous pourrez modifier ces informations ultérieurement
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarBackground: {
    height: '100%',
    width: '50.1%', // Troisième étape (3/6)
    overflow: 'hidden',
    borderRadius: 10,
  },
  progressGradient: {
    height: '100%',
    width: '100%',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 40,
    marginBottom: 50,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  optionContent: {
    flex: 1,
    marginLeft: 15,
  },
  optionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  optionSubtext: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  chevron: {
    marginLeft: 10,
  },
  thirdOptionContainer: {
    width: '70%',
    marginTop: 30,
    alignSelf: 'center',
  },
  thirdOptionCard: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedThirdOption: {
    borderWidth: 1,
    borderColor: '#9A59B5',
  },
  thirdOptionGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
  },
  thirdOptionText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  selectedThirdOptionText: {
    color: 'white',
  },
  helpTextContainer: {
    padding: 20,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
    alignItems: 'center',
  },
  helpText: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
  }
});

export default ManagedAccountGenderScreen;