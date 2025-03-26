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
  Linking,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useManagedAccounts } from '../context/ManagedAccountsContext';
import { useAuth } from '../auth/context/AuthContext';

type ManagedAccountProfileConfirmScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManagedAccountProfileConfirm'>;
type ManagedAccountProfileConfirmScreenRouteProp = RouteProp<RootStackParamList, 'ManagedAccountProfileConfirm'>;

const ManagedAccountProfileConfirmScreen: React.FC = () => {
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;
  const legalAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  
  // État pour afficher le loader pendant la soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatar, setAvatar] = useState<string>('https://via.placeholder.com/150');
  
  // Hooks
  const navigation = useNavigation<ManagedAccountProfileConfirmScreenNavigationProp>();
  const route = useRoute<ManagedAccountProfileConfirmScreenRouteProp>();
  
  // Paramètres
  const { firstName, lastName, gender, birthDate, avatarUrl } = route.params;
  
  // Utiliser l'avatar de la route comme initial
  useEffect(() => {
    if (avatarUrl) {
      setAvatar(avatarUrl);
    }
  }, [avatarUrl]);
  
  // Animation des éléments à l'entrée
  useEffect(() => {
    // Barre de progression complète
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease)
    }).start();
    
    // Animations séquentielles
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
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(legalAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      })
    ]).start();
  }, []);
  
  // Vérifier les permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          "Permissions requises",
          "Nous avons besoin d'accéder à la caméra et à la galerie pour cette fonctionnalité.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);
  
  // Fonctions
  const handleModifyAvatar = () => {
    navigation.navigate('AvatarCreation', {
      emailOrPhone: '',
      password: '',
      firstName,
      lastName,
      gender,
      birthDate
      // La propriété returnScreen n'est pas définie dans le type des paramètres AvatarCreation
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
      "Choisissez une source pour la photo de profil",
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
  
  // Récupérer les fonctions nécessaires
  const { createAccount } = useManagedAccounts();
  const { user } = useAuth();
  
  const handleComplete = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Assurez-vous que l'utilisateur est connecté
      if (!user || !user.id) {
        Alert.alert("Erreur", "Utilisateur non authentifié");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Création du compte géré en cours...");
      
      // Créer le compte géré
      const newAccountData = {
        managedBy: user.id,
        firstName,
        lastName,
        gender,
        birthDate,
        avatarUrl: avatar !== 'https://via.placeholder.com/150' ? avatar : undefined
      };
      
      console.log("Données du compte géré:", newAccountData);
      
      // Appel à l'API pour créer le compte
      const createdAccount = await createAccount(newAccountData);
      
      if (createdAccount) {
        console.log("Compte géré créé avec succès:", createdAccount);
        
        // Utiliser uniquement reset pour une navigation plus fiable
        // C'est plus direct que d'utiliser navigate/replace qui peuvent être affectés par l'état actuel
        console.log("Navigation vers ManagedAccountsList avec reset");
        navigation.reset({
          index: 0,
          routes: [{ name: 'ManagedAccountsList' }],
        });
      } else {
        console.error("Erreur lors de la création du compte géré");
        Alert.alert("Erreur", "Impossible de créer le compte géré. Veuillez réessayer.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Erreur lors de la création/navigation:", error);
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };
  
  const openPrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy-policy');
  };
  
  const openTermsOfService = () => {
    Linking.openURL('https://example.com/terms-of-service');
  };
  
  // Animations interpolées
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });
  
  const avatarScale = avatarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1]
  });
  
  const buttonTranslateY = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });
  
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
              <Animated.View style={[styles.progressBarBackground, { width: progressWidth }]}>
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
        
        <View style={styles.content}>
          <Text style={styles.title}>Son profil</Text>
          
          {/* Avatar avec animation */}
          <Animated.View 
            style={[
              styles.avatarContainer,
              { 
                opacity: avatarAnim,
                transform: [{ scale: avatarScale }]
              }
            ]}
          >
            <Image 
              source={{ uri: avatar }} 
              style={styles.avatar} 
              resizeMode="cover"
            />
            
            {/* Badge de complétion */}
            <View style={styles.completeBadge}>
              <Ionicons name="checkmark-circle" size={28} color="#4CD964" />
            </View>
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
              onPress={handleModifyAvatar}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: avatar }}
                style={styles.optionIcon}
              />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>Modifier son avatar</Text>
                <Text style={styles.optionSubtext}>Changez son apparence</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" style={styles.optionArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoOption}
              onPress={handlePhotoUpload}
              activeOpacity={0.7}
            >
              <MaterialIcons name="photo-camera" size={24} color="#999" />
              <Text style={styles.photoText}>Photo depuis votre téléphone</Text>
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
              En continuant, il accepte notre{' '}
              <Text style={styles.linkText} onPress={openPrivacyPolicy}>
                Politique de confidentialité
              </Text>{' '}
              et{' '}
              <Text style={styles.linkText} onPress={openTermsOfService}>
                Conditions d'utilisation
              </Text>
            </Text>
          </Animated.View>
          
          {/* Bouton continuer avec animation */}
          <Animated.View
            style={[
              styles.continueButtonContainer,
              { transform: [{ translateY: buttonTranslateY }] }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.continueButton, 
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleComplete}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {isSubmitting ? 'Chargement...' : 'Terminer'}
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
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarBackground: {
    height: '100%',
    width: '100%', // Dernière étape (6/6)
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 40,
    textAlign: 'center',
  },
  avatarContainer: {
    marginBottom: 50,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#A5E8E8',
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  completeBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
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
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 30,
  },
  photoText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 10,
  },
  legalContainer: {
    padding: 20,
    marginTop: 30,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: '#0000EE',
    textDecorationLine: 'underline',
  },
  continueButtonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 20,
    right: 20,
  },
  continueButton: {
    backgroundColor: 'black',
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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ManagedAccountProfileConfirmScreen;