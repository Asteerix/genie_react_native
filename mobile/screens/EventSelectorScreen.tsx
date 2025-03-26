import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Type pour les événements
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

const EventSelectorScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Exemple d'événements (en production, ces données viendraient d'une API)
  const [events] = useState<Event[]>([
    {
      id: 'e1',
      type: 'event',
      title: 'Anniversaire de Pierre',
      subtitle: 'Organisé par Marie',
      date: '28 mai 2025',
      emoji: '🎂',
      color: '#FFD1DC',
      isCollective: true
    },
    {
      id: 'e2',
      type: 'event',
      title: 'Noël en famille',
      subtitle: 'Organisé par Papa',
      date: '25 déc. 2025',
      emoji: '🎄',
      color: '#C8E6C9',
      isCollective: true
    },
    {
      id: 'e3',
      type: 'event',
      title: 'Pot de départ Julie',
      subtitle: 'Organisé par Thomas',
      date: '15 juin 2025',
      emoji: '🥂',
      color: '#BBDEFB',
      isCollective: true
    },
    {
      id: 'e4',
      type: 'event',
      title: 'Cadeau Mariage Sophie & Marc',
      subtitle: 'Organisé par Léa',
      date: '12 août 2025',
      emoji: '💍',
      color: '#D1C4E9',
      isCollective: true
    },
    {
      id: 'e5',
      type: 'event',
      title: 'Anniversaire de Lucas',
      subtitle: 'Organisé par vous',
      date: '3 juil. 2025',
      emoji: '🎮',
      color: '#B2DFDB',
      isCollective: false
    }
  ]);
  
  const handleEventPress = (event: Event) => {
    // Navigation vers l'écran de sélection du pot ou participant
    navigation.navigate('EventPotSelector', { event });
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
        <Text style={styles.headerTitle}>Choisir un événement</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Liste des événements */}
        <View style={styles.eventsContainer}>
          <Text style={styles.sectionTitle}>Mes événements</Text>
          
          {events.map(event => (
            <TouchableOpacity 
              key={event.id}
              style={styles.eventItem}
              onPress={() => handleEventPress(event)}
            >
              <View style={[styles.eventIconContainer, { backgroundColor: event.color }]}>
                <Text style={styles.eventEmoji}>{event.emoji}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventDetailsRow}>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <View style={styles.eventTypeBadge}>
                    <Text style={styles.eventTypeText}>
                      {event.isCollective ? 'Collectif' : 'Individuel'}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Information sur les transferts */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>À propos des transferts vers des événements</Text>
          <Text style={styles.infoText}>
            Vous pouvez envoyer de l'argent au pot commun d'un événement collectif ou directement à un participant. Les transferts sont instantanés et sans frais.
          </Text>
        </View>
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventItem: {
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
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventEmoji: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDate: {
    fontSize: 14,
    color: '#777',
    marginRight: 8,
  },
  eventTypeBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  eventTypeText: {
    fontSize: 12,
    color: '#555',
  },
  infoSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
});

export default EventSelectorScreen;