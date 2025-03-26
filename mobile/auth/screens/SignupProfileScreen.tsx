import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

type SignupProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignupProfile'>;

const SignupProfileScreen = () => {
  // Animation pour les éléments
  const progressAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  // États
  const [avatar, setAvatar] = useState<string | null>(null);
  
  // Hooks de navigation et d'authentification
  const { signUp, isLoading } = useAuth();
  const navigation = useNavigation<SignupProfileScreenNavigationProp>();
  const route = useRoute<any>();
  const { emailOrPhone, password, firstName, lastName, gender, birthdate } = route.params;
  
  // Récupérer la première lettre du prénom pour l'avatar par défaut
  const firstLetter = firstName.charAt(0).toUpperCase();

  // Animation des éléments à l'entrée
  useEffect(() => {
    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease)
    }).start();
    
    // Animations séquentielles des éléments
    Animated.stagger(200, [
      Animated.timing(avatarAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2))
      }),
      Animated.timing(optionsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.parallel([
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, []);

  // Demande des permissions d'accès à la caméra et à la galerie
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          "Permissions requises",
          "Nous avons besoin d'accéder à votre caméra et à votre galerie pour cette fonctionnalité.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  // Fonctions de navigation
  const handleCreateAvatar = () => {
    // Naviguer vers l'écran de création d'avatar
    navigation.navigate('AvatarCreation', {
      emailOrPhone,
      password,
      firstName,
      lastName,
      gender,
      birthdate,
      returnScreen: 'SignupProfile'
    });
  };
  
  const handleComplete = () => {
    // Naviguer vers l'écran de confirmation du profil
    navigation.navigate('SignupProfileConfirm', {
      emailOrPhone,
      password,
      firstName,
      lastName,
      gender,
      birthdate,
      avatar: avatar || `https://api.a0.dev/assets/image?text=avatar%20letter%20${firstName.charAt(0)}&aspect=1:1`
    });
  };
  
  // Fonction pour prendre une photo avec l'appareil photo
  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Erreur lors de la prise de photo:", error);
      Alert.alert("Erreur", "Impossible de prendre une photo. Veuillez réessayer.");
    }
  };
  
  // Fonction pour sélectionner une image depuis la galerie
  const handleSelectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Erreur lors de la sélection d'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner une image. Veuillez réessayer.");
    }
  };
  
  // Afficher les options pour prendre une photo ou choisir depuis la galerie
  const handlePhotoUpload = () => {
    Alert.alert(
      "Photo de profil",
      "Choisissez une source pour votre photo de profil",
      [
        {
          text: "Appareil photo",
          onPress: handleTakePhoto
        },
        {
          text: "Galerie",
          onPress: handleSelectFromGallery
        },
        {
          text: "Annuler",
          style: "cancel"
        }
      ]
    );
  };
  
  // Calculer l'interpolation pour l'animation du dégradé
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '83.4%'] // 5/6 pour la cinquième étape
  });
  
  // Animation de l'avatar
  const avatarScale = avatarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });
  
  const avatarOpacity = avatarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  // Animation du bouton
  const buttonTranslateY = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressBarBackground, { width: progressWidth }]}>
                <LinearGradient
                  colors={['#FFC0CB', '#FFD700', '#87CEEB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
          </View>
          <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Mon profil</Text>
          
          {/* Avatar animé */}
          <Animated.View 
            style={[
              styles.avatarContainer,
              {
                opacity: avatarOpacity,
                transform: [{ scale: avatarScale }]
              }
            ]}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#A5E8E8', '#87CEEB']}
                style={styles.defaultAvatar}
              >
                <Text style={styles.avatarText}>{firstLetter}</Text>
              </LinearGradient>
            )}
          </Animated.View>
          
          {/* Options de profil avec animation */}
          <Animated.View 
            style={[
              styles.optionsContainer,
              { opacity: optionsAnim }
            ]}
          >
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleCreateAvatar}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://api.a0.dev/assets/image?text=cartoon%20avatar&aspect=1:1&seed=123' }}
                style={styles.optionIcon}
              />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Créer mon avatar</Text>
                <Text style={styles.optionSubtext}>Personnalisez votre apparence</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" style={styles.optionArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoOption}
              onPress={handlePhotoUpload}
              activeOpacity={0.7}
            >
              <MaterialIcons name="photo-camera" size={24} color="#999" />
              <Text style={styles.photoText}>Photo depuis mon téléphone</Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Bouton continuer animé */}
          <Animated.View
            style={[
              styles.continueButtonContainer,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }]
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.disabledButton]}
              onPress={handleComplete}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Chargement...' : 'Terminer'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 50,
    textAlign: 'center',
  },
  avatarContainer: {
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  defaultAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'black',
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    height: 80,
    paddingHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  optionSubtext: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  optionArrow: {
    marginLeft: 10,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
  },
  photoText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 10,
  },
  continueButtonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 20,
    right: 20,
  },
  continueButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  continueButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default SignupProfileScreen;