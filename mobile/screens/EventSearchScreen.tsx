import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  Keyboard,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

// Type pour les événements
interface Event {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  emoji: string;
  color: string;
  isPast: boolean;
}

// Données des événements avec emojis
const EVENTS: Event[] = [
  {
    id: '1',
    title: 'Noël',
    subtitle: 'Noël 2024',
    date: '25/12/2024',
    emoji: '🎄',
    color: '#FFE4E4', // Rose pâle
    isPast: false
  },
  {
    id: '2',
    title: 'Anniversaire',
    subtitle: 'Paul Marceau',
    date: '09/12/2024',
    emoji: '🎂',
    color: '#E8E1FF', // Violet pâle
    isPast: false
  },
  {
    id: '3',
    title: 'Mariage',
    subtitle: 'Dan & Audriana',
    date: '03/07/2024',
    emoji: '💍',
    color: '#E0F7FF', // Bleu pâle
    isPast: false
  },
  {
    id: '4',
    title: 'Anniversaire',
    subtitle: 'Dan Toulet',
    date: '05/09/2023',
    emoji: '🎂',
    color: '#FFFADD', // Jaune pâle
    isPast: true
  },
  {
    id: '5',
    title: 'Noël',
    subtitle: 'Noël 2023',
    date: '25/12/2023',
    emoji: '🎅',
    color: '#EBFFEB', // Vert pâle
    isPast: true
  },
];

const EventSearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(EVENTS);
  const searchInputRef = useRef<TextInput>(null);

  // Filtrer les événements quand la recherche change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(EVENTS);
      return;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    
    const filtered = EVENTS.filter(event => 
      event.title.toLowerCase().includes(lowercasedQuery) || 
      event.subtitle.toLowerCase().includes(lowercasedQuery)
    );
    
    setFilteredEvents(filtered);
  }, [searchQuery]);

  // Gérer la fermeture et retour
  const handleClose = () => {
    navigation.goBack();
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Naviguer vers le détail d'un événement
  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  };

  // Rendu d'un événement dans la liste
  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity 
      style={styles.eventItem}
      onPress={() => handleEventPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.eventIconContainer, { backgroundColor: item.color }]}>
        <Text style={styles.emojiIcon}>{item.emoji}</Text>
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventSubtitle}>{item.subtitle}</Text>
      </View>

      <View style={styles.eventDateContainer}>
        <View style={[
          styles.dateChip,
          item.isPast ? styles.pastDateChip : styles.upcomingDateChip
        ]}>
          <Text style={[
            styles.dateText,
            item.isPast ? styles.pastDateText : styles.upcomingDateText
          ]}>
            {item.date}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* En-tête de recherche */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleClose}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={22} color="#999" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un événement..."
            placeholderTextColor="#999"
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
            clearButtonMode="never" // Pour iOS
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Liste des événements */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={item => item.id}
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyResultsContainer}>
            <Ionicons name="calendar-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyResultsText}>Aucun événement trouvé</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 6,
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  eventIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emojiIcon: {
    fontSize: 32,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000',
  },
  eventSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 110,
  },
  dateChip: {
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 5,
  },
  upcomingDateChip: {
    backgroundColor: '#E8F8E8',
  },
  pastDateChip: {
    backgroundColor: '#FFF5E6',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingDateText: {
    color: '#4CD964',
  },
  pastDateText: {
    color: '#FF9500',
  },
  emptyResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyResultsText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
});

export default EventSearchScreen;