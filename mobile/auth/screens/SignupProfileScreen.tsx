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
  Alert,
  Linking // Ajouter Linking pour les URLs
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as authApi from '../../api/auth'; // Ajouter l'importation statique

type SignupProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignupProfile'>;

const SignupProfileScreen = () => {
  // Animation pour les éléments
  const progressAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;
  const legalAnim = useRef(new Animated.Value(0)).current; // Ajouter pour la section légale
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // États
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Ajouter pour le statut de soumission

  // Hooks de navigation et d'authentification
  const { signUp, isLoading } = useAuth();
  const navigation = useNavigation<SignupProfileScreenNavigationProp>();
  const route = useRoute<any>();
  const { emailOrPhone, password, firstName, lastName, gender, birthDate, avatarUrl: routeAvatarUrl } = route.params; // Correction: birthdate -> birthDate, ajout avatarUrl
  
  // Récupérer la première lettre du prénom pour l'avatar par défaut
  const firstLetter = firstName ? firstName.charAt(0).toUpperCase() : '?'; // Gérer si firstName est vide

  // Utiliser l'avatar de la route si disponible (retour depuis AvatarCreation)
  useEffect(() => {
    if (routeAvatarUrl) {
      setAvatar(routeAvatarUrl);
    }
  }, [routeAvatarUrl]);

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
      Animated.timing(legalAnim, { // Animation section légale
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.parallel([ // Animation bouton
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

  // Fonctions de navigation
  const handleCreateAvatar = () => {
    // Naviguer vers l'écran de création d'avatar
    navigation.navigate('AvatarCreation', {
      emailOrPhone,
      password,
      firstName,
      lastName,
      gender,
      birthDate // Correction: birthdate -> birthDate
      // returnScreen: 'SignupProfile' // Supprimé car non défini dans le type de navigation
    });
  };
  
  // Remplacer par la logique d'inscription finale
  const handleComplete = async () => {
    if (isLoading || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Utiliser l'avatar par défaut si aucun n'est sélectionné
      const finalAvatarUrl = avatar || `https://api.a0.dev/assets/image?text=avatar%20letter%20${firstLetter}&aspect=1:1`;

      // Inscription finale avec toutes les données collectées
      const signupResult = await signUp(emailOrPhone, password, false, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender,
        birthdate: birthDate, // Utiliser birthDate corrigé
        // L'avatar sera téléchargé séparément après inscription si c'est un fichier local
      });

      // Après l'inscription réussie (si aucune erreur n'est levée), vérifier s'il y a un avatar local à télécharger
      // Supprimer la vérification de signupResult car la fonction retourne void
      if (avatar && avatar.startsWith('file://')) {
        try {
          console.log('Téléchargement de la photo de profil après inscription...');
          // Utiliser l'API de photo de profil pour les photos locales
          await authApi.uploadProfilePicture(avatar);
          console.log('Photo de profil téléchargée avec succès');
        } catch (uploadError) {
          console.error('Erreur lors du téléchargement de la photo de profil:', uploadError);
          // Continuer même en cas d'erreur - l'utilisateur pourra réessayer plus tard
          Alert.alert("Erreur d'upload", "Votre compte a été créé, mais une erreur est survenue lors du téléchargement de votre photo. Vous pourrez la modifier plus tard dans votre profil.");
        }
      } else if (avatar && avatar.includes('api.a0.dev/assets/image')) {
         // Si c'est un avatar généré par l'API, on ne fait rien de spécial ici pour l'instant.
         console.log("Utilisation d'un avatar généré par l'API.");
      }


      // Naviguer vers l'écran "Trouve tes amis" après l'inscription réussie
      navigation.reset({
        index: 0,
        routes: [{ name: 'FindFriends' }],
      });
    } catch (error: any) {
      console.error("Erreur lors de l'inscription finale:", error);
      setIsSubmitting(false);
      Alert.alert(
        "Erreur d'inscription",
        error.message || "Une erreur est survenue lors de la création de votre compte. Veuillez réessayer."
      );
    }
  };

  // Fonctions pour ouvrir les liens légaux
  const openPrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy-policy'); // Mettre la vraie URL
  };

  const openTermsOfService = () => {
    Linking.openURL('https://example.com/terms-of-service'); // Mettre la vraie URL
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
        // Pour l'inscription, on stocke juste l'URI de l'image localement
        // L'upload se fera après la création du compte
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
        // Pour l'inscription, on stocke juste l'URI de l'image localement
        // L'upload se fera après la création du compte
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Erreur lors de la sélection d'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner une image. Veuillez réessayer.");
    }
  };
  
  // Demander les permissions et afficher les options pour prendre/choisir une photo
  const handlePhotoUpload = async () => {
    // Demander les permissions ici
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        "Permissions requises",
        "L'accès à la caméra et à la galerie est nécessaire pour ajouter une photo. Veuillez activer les permissions dans les réglages de votre téléphone.",
        [{ text: "OK" }]
      );
      return; // Arrêter si les permissions ne sont pas accordées
    }

    // Si les permissions sont accordées, afficher l'alerte de choix
    Alert.alert(
      "Photo de profil",
      "Choisissez une source pour votre photo de profil",
      [
        {
          text: "Appareil photo",
          onPress: handleTakePhoto // handleTakePhoto n'a plus besoin de vérifier les permissions
        },
        {
          text: "Galerie",
          onPress: handleSelectFromGallery // handleSelectFromGallery n'a plus besoin de vérifier les permissions
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
    outputRange: ['0%', '100%'] // 6/6 pour la dernière étape
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
          
          {/* Section légale avec animation */}
          <Animated.View
            style={[
              styles.legalContainer,
              { opacity: legalAnim }
            ]}
          >
            <Text style={styles.legalText}>
              En continuant, vous acceptez notre{' '}
              <Text style={styles.linkText} onPress={openPrivacyPolicy}>
                Politique de confidentialité
              </Text>{' '}
              et{' '}
              <Text style={styles.linkText} onPress={openTermsOfService}>
                Conditions d'utilisation
              </Text>
            </Text>
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
              style={[styles.continueButton, (isLoading || isSubmitting) && styles.disabledButton]}
              onPress={handleComplete}
              disabled={isLoading || isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {(isLoading || isSubmitting) ? 'Création...' : 'Créer mon compte'}
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
  legalContainer: { // Styles pour la section légale
    paddingHorizontal: 20,
    marginTop: 20, // Ajuster l'espacement
    marginBottom: 20,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#ccc',
    textDecorationLine: 'underline',
  },
  continueButtonContainer: {
    width: '100%',
    // Pas position absolute, intégré dans le flux normal avant la fin du scroll
    paddingHorizontal: 20, // Ajouter padding horizontal
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // Espace en bas
    marginTop: 10, // Espace au dessus du bouton
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