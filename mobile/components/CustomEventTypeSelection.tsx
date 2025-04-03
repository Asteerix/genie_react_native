import React from 'react'; // Retirer useState etc.
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
  // Retirer les imports inutilisés comme ScrollView, TextInput, Modal, etc.
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Event } from '../api/events'; // Garder Event pour Partial<Event>

// Type pour la navigation
type CustomEventTypeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CustomEventTypeSelection: React.FC = () => {
  const navigation = useNavigation<CustomEventTypeNavigationProp>();

  // Navigue vers le début du flux de création avec le type choisi
  const navigateToCreationFlow = (type: 'collectif' | 'individuel') => {
    const initialEventData: Partial<Event> = { type };
    // Naviguer vers la première étape (EventTitleModal)
    navigation.navigate('EventTitleModal', { eventData: initialEventData });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header avec bouton retour/fermer */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()} // Simple retour en arrière
        >
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Événement Customisable</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Option Collectif */}
      <View style={styles.optionCard}>
        <Text style={styles.optionTitle}>Collectif</Text>
        <View style={styles.diagram}>
          {/* Diagramme simplifié */}
          <Text style={styles.diagramText}>👥 🎁 👥</Text>
        </View>
        <Text style={styles.optionDescription}>
          Chacun offre ou reçoit des cadeaux de la
          part de <Text style={styles.boldText}>chaque participants</Text>.
        </Text>
        <TouchableOpacity
          style={styles.chooseButton}
          onPress={() => navigateToCreationFlow('collectif')}
        >
          <Text style={styles.buttonText}>Choisir</Text>
        </TouchableOpacity>
      </View>

      {/* Option Individuel */}
      <View style={styles.optionCard}>
        <Text style={styles.optionTitle}>Individuel</Text>
        <View style={styles.diagram}>
           {/* Diagramme simplifié */}
           <Text style={styles.diagramText}>👥🎁👤</Text>
        </View>
        <Text style={styles.optionDescription}>
          Les invités offrent des cadeaux à <Text style={styles.boldText}>l'hôte
          (une personne</Text> ou <Text style={styles.boldText}>un couple)</Text>.
        </Text>
        <TouchableOpacity
          style={styles.chooseButton}
          onPress={() => navigateToCreationFlow('individuel')}
        >
          <Text style={styles.buttonText}>Choisir</Text>
        </TouchableOpacity>
      </View>

      {/* Plus de modales rendues ici */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: 'white', // Fond blanc pour le header
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34, // Pour équilibrer le bouton retour
  },
  optionCard: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center', // Centrer le contenu de la carte
  },
  optionTitle: {
    fontSize: 22, // Légèrement réduit
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15, // Réduit
  },
  diagram: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15, // Réduit
    // Retirer les styles complexes du diagramme précédent
  },
  diagramText: { // Style simple pour le diagramme texte
      fontSize: 30,
      color: '#ccc',
      marginBottom: 10,
  },
  optionDescription: {
    textAlign: 'center',
    fontSize: 15, // Légèrement réduit
    marginBottom: 20,
    lineHeight: 21, // Ajusté
    color: '#555', // Couleur de texte adoucie
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333', // Couleur de texte plus foncée pour le gras
  },
  chooseButton: {
    backgroundColor: 'black',
    borderRadius: 25,
    paddingVertical: 12, // Réduit
    paddingHorizontal: 50, // Augmenté pour largeur
    alignItems: 'center',
    alignSelf: 'stretch', // Prend toute la largeur de la carte
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default CustomEventTypeSelection;