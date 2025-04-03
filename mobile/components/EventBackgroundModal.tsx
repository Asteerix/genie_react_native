import React, { useState, useContext, useEffect } from 'react'; // Ajout de useEffect
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert } from 'react-native'; // Ajout de Alert
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // Ajout de useRoute, RouteProp
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Event } from '../api/events'; // Importer explicitement le type Event
import { useEvents } from '../context/EventContext'; // Utiliser useEvents
import * as ImagePicker from 'expo-image-picker'; // Utiliser expo-image-picker
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Ou une autre bibliothèque d'icônes

// Définir le type de la route pour accéder aux paramètres
type EventBackgroundRouteProp = RouteProp<RootStackParamList, 'EventBackground'>;

const EventBackgroundModal = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>(); // Type de navigation générique
  const route = useRoute<EventBackgroundRouteProp>();
  const { saveDraft } = useEvents(); // Utiliser saveDraft du contexte
  const [currentEventData, setCurrentEventData] = useState<Partial<Event>>(() => (route.params?.eventData || {}) as Partial<Event>); // Forcer le type à l'initialisation
  const draftId = route.params?.draftId; // Récupérer l'ID du brouillon
  // Utiliser une assertion de type pour contourner le problème d'inférence/cache
  const initialBackgroundImage = route.params?.eventData ? (route.params.eventData as Partial<Event>).backgroundImage : undefined;
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | undefined>(initialBackgroundImage); // Accès plus direct

  useEffect(() => {
    // Demander les permissions au montage
    (async () => {
      if (Platform.OS !== 'web') {
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryStatus.status !== 'granted') {
          Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions de la galerie pour que cela fonctionne !');
        }
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
           Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions de la caméra pour que cela fonctionne !');
        }
      }
    })();
  }, []);

  const pickImage = async (useCamera: boolean) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Aspect ratio pour une image de fond
      quality: 0.8, // Qualité réduite pour économiser de l'espace
    };

    try {
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const source = result.assets[0].uri;
        setBackgroundImageUri(source);
        const updatedData: Partial<Event> = { ...currentEventData, backgroundImage: source }; // Utilise le type Event importé
        setCurrentEventData(updatedData);
        // Sauvegarder le brouillon immédiatement après la sélection
        if (draftId) {
          await saveDraft(updatedData, 'EventBackground', draftId); // updatedData est maintenant Partial<Event>
          console.log('Draft updated with new background image');
        }
      }
    } catch (error) {
      console.error("Erreur ImagePicker: ", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    }
  };

  const handleChooseFromGallery = () => pickImage(false);
  const handleTakePhoto = () => pickImage(true);

  const handleNext = async () => {
    // Sauvegarder le brouillon final avant de naviguer
    const finalData: Partial<Event> = { ...currentEventData, backgroundImage: backgroundImageUri }; // backgroundImageUri est string | undefined
    let finalDraftId = draftId;
    if (!finalDraftId) { // Si aucun draftId n'existe (improbable dans ce flux mais par sécurité)
       const savedId = await saveDraft(finalData, 'EventBackground');
       if (!savedId) {
         Alert.alert("Erreur", "Impossible de sauvegarder le brouillon.");
         return; // Arrêter si la sauvegarde échoue
       }
       finalDraftId = savedId;
    } else {
       const savedId = await saveDraft(finalData, 'EventBackground', finalDraftId);
        if (!savedId) {
          Alert.alert("Erreur", "Impossible de mettre à jour le brouillon.");
          return; // Arrêter si la sauvegarde échoue
        }
        // finalDraftId ne change pas ici, il est déjà défini
    }

    if (finalDraftId) {
      console.log('Navigating to EventInviteFriends with data:', finalData);
      // Naviguer vers l'écran suivant (probablement EventInviteFriends)
      // Assurez-vous que 'EventInviteFriends' est le nom correct et qu'il accepte les params
      // La définition de la route est mise à jour, on peut passer les paramètres
      navigation.navigate('EventInviteFriends', { eventId: '', draftId: finalDraftId, eventData: finalData });
    } else {
      Alert.alert("Erreur", "Impossible de sauvegarder les informations de l'événement.");
    }
  };

  const handleSkip = async () => {
    // Optionnel: Permettre à l'utilisateur de passer cette étape
    const finalData: Partial<Event> = { ...currentEventData, backgroundImage: undefined }; // Utiliser undefined
    setCurrentEventData(finalData);
    setBackgroundImageUri(undefined); // Utiliser undefined
    let finalDraftId = draftId;

    if (!finalDraftId) {
       const savedId = await saveDraft(finalData, 'EventBackground');
        if (!savedId) {
          Alert.alert("Erreur", "Impossible de sauvegarder le brouillon.");
          return; // Arrêter si la sauvegarde échoue
        }
        finalDraftId = savedId;
    } else {
       const savedId = await saveDraft(finalData, 'EventBackground', finalDraftId);
        if (!savedId) {
          Alert.alert("Erreur", "Impossible de mettre à jour le brouillon.");
          return; // Arrêter si la sauvegarde échoue
        }
        // finalDraftId ne change pas ici
    }

    if (finalDraftId) {
      console.log('Skipping and navigating to EventInviteFriends');
      navigation.navigate('EventInviteFriends', { eventId: '', draftId: finalDraftId, eventData: finalData });
    } else {
      Alert.alert("Erreur", "Impossible de sauvegarder les informations de l'événement.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title}>Ajouter une touche personnelle</Text>
        <Text style={styles.subtitle}>Choisissez une image de fond pour votre événement.</Text>

        <View style={styles.imagePreviewContainer}>
          {backgroundImageUri ? (
            <Image source={{ uri: backgroundImageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={50} color="#adb5bd" />
              <Text style={styles.placeholderText}>Aperçu de l'image</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.galleryButton]} onPress={handleChooseFromGallery}>
            <Ionicons name="images-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Choisir depuis la galerie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Prendre une photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={!backgroundImageUri}>
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Passer cette étape</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Un fond clair et neutre
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 30, // Ajuster le padding top
    paddingBottom: 20,
    alignItems: 'center',
    // justifyContent: 'space-between', // Retiré pour un flux plus naturel
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40, // Ajusté pour SafeAreaView
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 60, // Espace pour le bouton retour
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 16 / 9, // Maintenir le ratio
    borderRadius: 15,
    marginBottom: 30,
    backgroundColor: '#e9ecef', // Placeholder background
    borderWidth: 1,
    borderColor: '#dee2e6',
    overflow: 'hidden', // Pour que le borderRadius s'applique à l'image
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#adb5bd',
    fontSize: 14,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30, // Boutons arrondis
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryButton: {
    backgroundColor: '#007bff', // Bleu primaire
  },
  cameraButton: {
    backgroundColor: '#28a745', // Vert succès
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  icon: {
    marginRight: 5,
  },
  footerButtons: {
    width: '100%',
    alignItems: 'center', // Centrer les boutons du footer
    marginTop: 'auto', // Pousser vers le bas
  },
  nextButton: {
    backgroundColor: '#6c757d', // Gris secondaire
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '90%', // Largeur ajustée
    alignItems: 'center', // Centrer le texte
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10, // Espace avant le bouton "Passer"
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    color: '#6c757d',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default EventBackgroundModal;