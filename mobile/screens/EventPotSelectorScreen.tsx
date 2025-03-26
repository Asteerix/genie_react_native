import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Types pour les participants
interface Participant {
  id: string;
  name: string;
  avatar: string;
}

// Interface pour l'événement reçu en paramètre
interface Event {
  id: string;
  type: 'event';
  title: string;
  subtitle: string;
  date: string;
  emoji: string;
  color: string;
  isCollective: boolean;
}

type EventPotSelectorScreenRouteProp = RouteProp<RootStackParamList, 'EventPotSelector'>;

const EventPotSelectorScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<EventPotSelectorScreenRouteProp>();
  const { event } = route.params;
  
  // Exemple de participants (en production, ces données viendraient d'une API)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'p1',
      name: 'Marie Dupont',
      avatar: 'https://api.a0.dev/assets/image?text=MD'
    },
    {
      id: 'p2',
      name: 'Thomas Bernard',
      avatar: 'https://api.a0.dev/assets/image?text=TB'
    },
    {
      id: 'p3',
      name: 'Sophie Martin',
      avatar: 'https://api.a0.dev/assets/image?text=SM'
    },
    {
      id: 'p4',
      name: 'Lucas Petit',
      avatar: 'https://api.a0.dev/assets/image?text=LP'
    }
  ]);
  
  // Gérer le clic sur le pot commun (pour événements collectifs)
  const handlePotSelection = () => {
    navigation.navigate('ChooseAmount', { 
      user: {
        id: `event_${event.id}`,
        name: `Cagnotte: ${event.title}`,
        avatar: event.emoji // Utiliser l'emoji comme avatar pour la cagnotte
      }
    });
  };
  
  // Gérer le clic sur un participant (pour événements individuels)
  const handleParticipantSelection = (participant: Participant) => {
    navigation.navigate('ChooseAmount', { 
      user: {
        id: participant.id,
        name: participant.name,
        avatar: participant.avatar
      }
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton de retour et titre */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{event.title}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Affichage différent selon le type d'événement */}
        {event.isCollective ? (
          // Pour les événements collectifs, montrer l'option de pot commun
          <View style={styles.potSection}>
            <Text style={styles.sectionTitle}>Cagnotte de l'événement</Text>
            <TouchableOpacity 
              style={styles.potItem}
              onPress={handlePotSelection}
            >
              <View style={[styles.potIconContainer, { backgroundColor: event.color }]}>
                <Text style={styles.potEmoji}>{event.emoji}</Text>
              </View>
              <View style={styles.potInfo}>
                <Text style={styles.potTitle}>Pot commun</Text>
                <Text style={styles.potSubtitle}>Contribuer à la cagnotte collective</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
            
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#777" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                L'argent sera ajouté à la cagnotte commune et pourra être utilisé par les organisateurs pour les achats liés à l'événement.
              </Text>
            </View>
          </View>
        ) : (
          // Pour les événements individuels, montrer la liste des participants
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Participants</Text>
            {participants.map(participant => (
              <TouchableOpacity 
                key={participant.id}
                style={styles.participantItem}
                onPress={() => handleParticipantSelection(participant)}
              >
                <Image 
                  source={{ uri: participant.avatar }} 
                  style={styles.participantAvatar} 
                />
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  <Text style={styles.participantSubtitle}>Contribuer à sa cagnotte</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CCC" />
              </TouchableOpacity>
            ))}
            
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#777" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                L'argent sera directement ajouté à la cagnotte personnelle du participant sélectionné.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
    position: 'absolute',
    left: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    maxWidth: '70%',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  potSection: {
    marginBottom: 20,
  },
  potItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  potIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  potEmoji: {
    fontSize: 24,
  },
  potInfo: {
    flex: 1,
  },
  potTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  potSubtitle: {
    fontSize: 14,
    color: '#777',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  participantsSection: {
    marginBottom: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  participantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  participantSubtitle: {
    fontSize: 14,
    color: '#777',
  },
});

export default EventPotSelectorScreen;