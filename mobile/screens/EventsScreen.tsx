import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import BottomTabBar from '../components/BottomTabBar';
import CreateEventModal from '../components/CreateEventModal';

// Types pour les événements
interface EventInvitation {
  id: string;
  type: 'invitation';
  title: string;
  invitedBy: string;
  date: string;
  emoji: string;
  avatar: string;
}

interface Event {
  id: string;
  type: 'event';
  title: string;
  subtitle: string;
  date: string;
  emoji: string;
  color: string;
}

const { width } = Dimensions.get('window');

const EventsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Animation values
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Refs for handling content switching
  const scrollViewRef = useRef(null);

  // Données des invitations
  const invitations = [
    {
      id: '1',
      type: 'invitation',
      title: 'Saint Valentin',
      invitedBy: 'audrianatoulet',
      date: '14/02/2024',
      emoji: '🌹',
      avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20pink%20background&aspect=1:1&seed=12'
    }
  ];  
  
  // Données des événements
  const myEvents = [
    {
      id: '1',
      type: 'event',
      title: 'Mariage',
      subtitle: 'Dan & Audriana',
      date: '03/07/2024',
      emoji: '💍',
      color: '#E0F7FF'
    }
  ];

  const myInvitations = [
    {
      id: '2',
      type: 'event',
      title: 'Anniversaire',
      subtitle: 'Paul Marceau',
      date: '09/12/2024',
      emoji: '🎂',
      color: '#E8E1FF'
    },
    {
      id: '3',
      type: 'event',
      title: 'Noël',
      subtitle: 'Noël 2024',
      date: '25/12/2024',
      emoji: '🎄',
      color: '#FFE6E6'
    }
  ];
  
  // Données des événements passés
  const pastEvents = [
    {
      id: '4',
      type: 'event',
      title: 'Anniversaire',
      subtitle: 'Dan Toulet',
      date: '05/09/2023',
      emoji: '🎂',
      color: '#FFEAFF'
    },
    {
      id: '5',
      type: 'event',
      title: 'Noël',
      subtitle: 'Noël 2023',
      date: '25/12/2023',
      emoji: '🎅',
      color: '#E8FFE8'
    }
  ];
  
  // Constante pour animer les onglets
  const translateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - 8]
  });

  // Animation effect - un seul useEffect pour les animations principales
  useEffect(() => {
    // Animate tab indicator
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'upcoming' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 70
    }).start();
    
    // Transition animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: activeTab === 'upcoming' ? -20 : 20,
          duration: 180,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 180,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true
        })
      ])
    ]).start();
    
    // Scroll to top when tab changes
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [activeTab]);

  const handleSearch = () => {
    navigation.navigate('EventSearch');
  };
  
  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };
  
  const handleAcceptInvitation = (invitationId) => {
    toast.success('Invitation acceptée !');
  };

  const handleRejectInvitation = (invitationId) => {
    toast.success('Invitation refusée');
  };
  
  const handleInvitationPress = (invitationId) => {
    navigation.navigate('EventDetail', { eventId: invitationId });
  };
  
  const handleEventPress = (eventId) => {
    navigation.navigate('EventDetail', { eventId });
  };

  const handleSeeAll = (category) => {
    // Navigation vers une vue plus détaillée de la catégorie
    console.log(`Voir tous les ${category}`);
  };

  // Rendu des invitations avec emoji
  const renderInvitation = (invitation, index) => {
    return (
      <Animated.View 
        key={invitation.id} 
        style={styles.invitationCard}
      >
        <View style={styles.invitationContent}>
          <View style={[styles.invitationImageContainer, { backgroundColor: '#EFE6FF' }]}>
            <Text style={styles.emojiIcon}>{invitation.emoji}</Text>
            <View style={styles.avatarCircle}>
              <Image source={{ uri: invitation.avatar }} style={styles.avatarImage} />
            </View>
          </View>
          
          <View style={styles.invitationInfo}>
            <View style={styles.invitationHeaderRow}>
              <Text style={styles.invitationTitle}>{invitation.title}</Text>
              <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
            </View>
            
            <View style={styles.invitationUserDetails}>
              <Text style={styles.usernameText}>{invitation.invitedBy}</Text>
              <Text style={styles.inviteText}> vous invite le</Text>
            </View>
            
            <View style={styles.dateBadgeGreen}>
              <Text style={styles.dateTextGreen}>{invitation.date}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => handleRejectInvitation(invitation.id)}
              >
                <MaterialIcons name="close" size={28} color="#FF3B30" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleAcceptInvitation(invitation.id)}
              >
                <MaterialIcons name="check" size={28} color="#4CD964" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Rendu d'un événement avec emoji
  const renderEvent = (event, index) => {
    return (
      <TouchableOpacity 
        key={event.id}
        style={styles.eventCard}
        onPress={() => handleEventPress(event.id)}
        activeOpacity={0.95}
      >
        <View style={[styles.eventImageContainer, { backgroundColor: event.color }]}>
          <Text style={styles.emojiIcon}>{event.emoji}</Text>
        </View>
        
        <View style={styles.eventInfo}>
          <View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
          </View>
          
          <View style={styles.eventRightSide}>
            <View style={[
              styles.dateBadge, 
              {
                backgroundColor: activeTab === 'past' ? '#FFF5E6' : '#E8F8E8'
              }
            ]}>
              <Text 
                style={[
                  styles.dateText,
                  {
                    color: activeTab === 'past' ? '#FF9500' : '#4CD964'
                  }
                ]}
              >
                {event.date}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color="#CCCCCC" 
              style={styles.chevronIcon} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Rendu d'un en-tête de section avec "afficher tout"
  const renderSectionHeader = (title, category) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={() => handleSeeAll(category)}>
        <Text style={styles.seeAllText}>afficher tout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Événements</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleSearch}
          >
            <Ionicons name="search" size={28} color="black" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleCreateEvent}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Animated.View 
          style={[
            styles.tabIndicator,
            {
              transform: [{ translateX }]
            }
          ]} 
        />
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.activeTabText
            ]}
          >
            À venir
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('past')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'past' && styles.activeTabText
            ]}
          >
            Passés
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content with animations */}
      <Animated.ScrollView 
        ref={scrollViewRef}
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Invitations */}
        {activeTab === 'upcoming' && invitations.length > 0 && (
          invitations.map((invitation, index) => renderInvitation(invitation, index))
        )}
        
        {/* My Events */}
        {activeTab === 'upcoming' && myEvents.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Mes événements', 'événements')}
            {myEvents.map((event, index) => renderEvent(event, index))}
          </View>
        )}
        
        {/* My Invitations */}
        {activeTab === 'upcoming' && myInvitations.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Mes invitations', 'invitations')}
            {myInvitations.map((event, index) => renderEvent(event, index))}
          </View>
        )}
        
        {/* Past events */}
        {activeTab === 'past' && pastEvents.length > 0 ? (
          <View>
            {pastEvents.map((event, index) => renderEvent(event, index))}
          </View>
        ) : activeTab === 'past' && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>Aucun événement passé</Text>
          </View>
        )}
        
        {/* Add extra padding at bottom for scroll */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      
      {/* Bottom Navigation */}
      <BottomTabBar activeTab="events" />
      
      {/* Create Event Modal */}
      {showCreateModal ? (
        <CreateEventModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    padding: 4,
    height: 50,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 50,
    top: 0,
    left: 4,
    right: 4,
    zIndex: 0,
  },
  tabButton: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // En-tête de section avec "afficher tout"
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#999',
  },
  
  // Style pour l'emoji
  emojiIcon: {
    fontSize: 38,
  },
  
  /* Styles pour les invitations */
  invitationCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  invitationContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  invitationImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarCircle: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  invitationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  invitationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  invitationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  invitationUserDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  usernameText: {
    fontSize: 16,
    color: '#999',
  },
  inviteText: {
    fontSize: 16,
    color: '#000',
  },
  dateBadgeGreen: {
    backgroundColor: '#E8F8E8',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  dateTextGreen: {
    fontSize: 14,
    color: '#4CD964',
    fontWeight: '500',
  },
  // Boutons d'action à droite de la carte
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  rejectButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  acceptButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FFF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* Styles pour les événements */
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  eventSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  eventRightSide: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateBadge: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevronIcon: {
    alignSelf: 'flex-end',
  },
  
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
});

export default EventsScreen;