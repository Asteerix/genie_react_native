import React, { useState, useCallback } from 'react'; // useEffect n'est plus utilisé
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Event, EventParticipant } from '../api/events';
import { useEvents } from '../context/EventContext'; // Importer useEvents

// Type pour les paramètres de la route
type EventHostRouteProp = RouteProp<RootStackParamList, 'EventHostModal'>;

// Type pour la navigation
type EventHostNavigationProp = StackNavigationProp<RootStackParamList>;

interface ManagedAccount {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

// Données Mock (à remplacer par des données réelles, ex: depuis le contexte Profile)
const MANAGED_ACCOUNTS: ManagedAccount[] = [
  {
    id: 'user-camille', // Utiliser des IDs distincts
    name: 'Camille Toulet',
    username: 'camilletoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20girl%20cartoon%20portrait&aspect=1:1&seed=123'
  },
  {
    id: 'user-noemie',
    name: 'Noémie Sanchez',
    username: 'noemiesanchez',
    avatar: 'https://api.a0.dev/assets/image?text=young%20girl%20cartoon%20portrait&aspect=1:1&seed=456'
  },
  {
    id: 'user-raphael',
    name: 'Raphaël Toulet',
    username: 'raphaeltoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20boy%20cartoon%20portrait&aspect=1:1&seed=789'
  }
];

const EventHostModal = () => {
  const navigation = useNavigation<EventHostNavigationProp>();
  const route = useRoute<EventHostRouteProp>();

  const eventDataFromParams = route.params?.eventData || {};
  const isDraft = route.params?.isDraft; // Récupérer si c'est un brouillon
  const draftId = route.params?.draftId; // Récupérer l'ID du brouillon

  // Initialiser les hôtes sélectionnés à partir des participants existants avec le rôle 'host'
  const initialHosts = (eventDataFromParams as any)['participants']?.filter((p: EventParticipant) => p.role === 'host').map((p: EventParticipant) => p.userId) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHosts, setSelectedHosts] = useState<string[]>(initialHosts);
  const { saveDraft } = useEvents(); // Obtenir saveDraft du contexte

  const filteredAccounts = searchQuery
    ? MANAGED_ACCOUNTS.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MANAGED_ACCOUNTS;

  const handleToggleHost = (hostId: string) => {
    setSelectedHosts(prev => {
      if (prev.includes(hostId)) {
        return prev.filter(id => id !== hostId);
      }
      // Remplacer l'hôte existant si on ne veut qu'un seul hôte
      // return [hostId];
      // Ou ajouter à la liste si plusieurs hôtes sont autorisés
      return [...prev, hostId];
    });
  };

  // Helper pour obtenir les données actuelles de l'événement
  const getCurrentEventData = useCallback((): Partial<Event> => {
      const params = eventDataFromParams as any;
      const eventType = ['collectif', 'individuel', 'special'].includes(params['type'] ?? '')
                        ? (params['type'] as 'collectif' | 'individuel' | 'special')
                        : 'individuel';

      let hostParticipants: EventParticipant[] = [];
      // Si l'événement est individuel, ne prendre que le PREMIER hôte sélectionné (ou aucun si vide)
      if (eventType === 'individuel' && selectedHosts.length > 0) {
          hostParticipants = [{
              userId: selectedHosts[0], // Prendre seulement le premier
              role: 'host',
              status: 'confirmed',
              invitedAt: new Date().toISOString(),
          }];
          // Optionnel: Afficher un avertissement si plusieurs hôtes étaient sélectionnés pour un event individuel
          if (selectedHosts.length > 1) {
              console.warn("Plusieurs hôtes sélectionnés pour un événement individuel. Seul le premier sera conservé.");
              // Ou utiliser toast.info(...)
          }
      }
      // Si l'événement n'est pas individuel, prendre tous les hôtes sélectionnés
      else if (eventType !== 'individuel') {
          hostParticipants = selectedHosts.map(userId => ({
              userId: userId,
              role: 'host',
              status: 'confirmed',
              invitedAt: new Date().toISOString(),
          }));
      }

      const existingNonHostParticipants = (eventDataFromParams as any)['participants']?.filter((p: EventParticipant) => p.role !== 'host') || [];

      return {
        ...eventDataFromParams,
        type: eventType,
        // Combiner les participants non-hôtes existants avec les nouveaux hôtes (max 1 si individuel)
        participants: [...existingNonHostParticipants, ...hostParticipants],
      };
  }, [selectedHosts, eventDataFromParams]);


  const handleContinue = useCallback(() => {
    // Naviguer vers EventDateModal pour les événements individuels (prédéfinis ou custom)
    // Passer aussi isDraft et draftId si on continue un brouillon
    // Utiliser getCurrentEventData() directement ici
    navigation.navigate('EventDateModal', { eventData: getCurrentEventData(), isDraft, draftId });

  }, [getCurrentEventData, navigation, isDraft, draftId]);

  // Modifié pour sauvegarder le brouillon avant de revenir
  const handleBack = useCallback(async () => {
    const currentData = getCurrentEventData();
    console.log("EventHostModal: Saving draft on back...", currentData);
    try {
      await saveDraft(currentData, 'EventHostModal', draftId); // Passer draftId si existant
    } catch (error) {
      console.error("EventHostModal: Failed to save draft on back", error);
    }
    navigation.goBack();
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  // Modifié pour sauvegarder le brouillon avant de fermer
  const handleClose = useCallback(async () => {
    const currentData = getCurrentEventData();
    console.log("EventHostModal: Saving draft on close...", currentData);
     try {
      await saveDraft(currentData, 'EventHostModal', draftId); // Passer draftId si existant
    } catch (error) {
      console.error("EventHostModal: Failed to save draft on close", error);
    }
    navigation.popToTop();
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  return (
    <SafeAreaView style={styles.container}>
       <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Le(s) hôte(s) de l'événement</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Trouver un compte géré..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes comptes gérés</Text>
          <ScrollView style={styles.accountsList}>
            {filteredAccounts.map(account => (
              <View key={account.id} style={styles.accountItem}>
                <Image source={{ uri: account.avatar }} style={styles.avatar} />
                <View style={styles.accountInfo}>
                  <Text style={styles.name}>{account.name}</Text>
                  <Text style={styles.username}>{account.username}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    selectedHosts.includes(account.id) && styles.selectedButton
                  ]}
                  onPress={() => handleToggleHost(account.id)}
                >
                  <Ionicons
                    name={selectedHosts.includes(account.id) ? "remove" : "add"}
                    size={24}
                    color={selectedHosts.includes(account.id) ? "white" : "black"} // Changer couleur icône
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              // selectedHosts.length === 0 && styles.disabledButton // Permettre de continuer même sans hôte pour l'instant
            ]}
            onPress={handleContinue}
            // disabled={selectedHosts.length === 0} // Activer si au moins un hôte est requis
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Ajout padding pour Android
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
    padding: 5,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  section: {
    flex: 1, // Permettre à la liste de prendre l'espace
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  accountsList: {
    flex: 1, // S'assurer que la ScrollView prend l'espace
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E0E0E0', // Placeholder color
  },
  accountInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    color: '#999',
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: 'black', // Fond noir quand sélectionné
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20, // Espace au-dessus des boutons
    borderTopWidth: 1, // Séparateur
    borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0 // Padding bas pour iOS
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default EventHostModal;