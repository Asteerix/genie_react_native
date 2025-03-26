import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  ScrollView, 
  Platform,
  Animated,
  Dimensions,
  PanResponder
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5, AntDesign, Feather } from '@expo/vector-icons';
import EventGiftDetailModal from '../components/EventGiftDetailModal';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

type EventDetailRouteProp = RouteProp<{ EventDetail: { eventId: string } }, 'EventDetail'>;
// Define types for event data
interface Participant {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface Gift {
  id: string;
  name: string;
  price: string;
  image: string;
  isFavorite: boolean;
  addedBy?: {
    name: string;
    avatar: string;
  };
  quantity?: number;
}

interface EventTime {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  period?: string;
}

interface EventLocation {
  address: string;
  city: string;
  postalCode: string;
}

interface BaseEventDetails {
  id: string;
  title: string;
  date: string;
  color: string;
  image: string;
  location: EventLocation;
  time: EventTime;
  isCollective: boolean;
}

interface OwnedEventDetails extends BaseEventDetails {
  type: 'owned';
  subtitle?: string;
  description: string;
  participants?: Participant[];
  gifts?: Gift[];
  hosts?: Array<{ id: string; name: string; avatar: string; }>;
}

interface JoinedEventDetails extends BaseEventDetails {
  subtitle: string;
  description: string;
}

interface InvitationEventDetails extends BaseEventDetails {
  invitedBy: {
    name: string;
    username: string;
    avatar: string;
  };
}

type EventDetails = OwnedEventDetails | JoinedEventDetails | InvitationEventDetails;
type EventType = 'owned' | 'joined' | 'invitation';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Define bottom sheet dimensions with three states
const COLLAPSED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.12);  // 12% de l'écran quand réduit
const INITIAL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.60);   // 60% de l'écran - état initial
const FULL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.90);     // 90% de l'écran - complètement déployé

// Mock data for event hosts
const EVENT_HOSTS = [
  {
    id: '1',
    name: 'Dan Toulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait%20simple%203d&aspect=1:1&seed=123'
  },
  {
    id: '2',
    name: 'Audriana Toulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20simple%203d&aspect=1:1&seed=456'
  }
];

const WEDDING_GIFT_ITEMS = [
  {
    id: 'g1',
    name: 'Tefal Casseroles',
    price: '129 €',
    image: 'https://api.a0.dev/assets/image?text=tefal%20casseroles%20black&aspect=1:1&seed=201',
    isFavorite: true,
    quantity: 1
  },
  {
    id: 'g2',
    name: 'Montre Casio',
    price: '59.90 €',
    image: 'https://api.a0.dev/assets/image?text=casio%20gold%20watch&aspect=1:1&seed=202',
    isFavorite: true,
    quantity: 1
  },
  {
    id: 'g3',
    name: 'Rouge à lèvres YSL',
    price: '36.99 €',
    image: 'https://api.a0.dev/assets/image?text=ysl%20lipstick%20red&aspect=1:1&seed=203',
    isFavorite: false,
    quantity: 1
  },
  {
    id: 'g4',
    name: 'Aspirateur Dyson',
    price: '299.99 €',
    image: 'https://api.a0.dev/assets/image?text=dyson%20vacuum%20cleaner&aspect=1:1&seed=204',
    isFavorite: false,
    quantity: 1
  }
];

// Mock data for join requests
const JOIN_REQUESTS = [
  {
    id: '1',
    name: 'Matilda Fritz',
    username: 'matildafritz',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20curly%20hair%20cartoon%20portrait%20simple%203d&aspect=1:1&seed=789'
  }
];

// Mock data for events
const EVENT_DETAILS = {
  '1': { // Wedding event
    id: '1',
    type: 'owned',
    title: 'Mariage',
    subtitle: '',
    date: '25/12/2024',
    color: '#D2F4F9', // Exactement comme dans la capture d'écran
    image: 'https://api.a0.dev/assets/image?text=wedding%20ring%20icon&aspect=1:1',
    location: { address: '15 rue des Lampes', city: 'Paris', postalCode: '75012' },
    time: { day: '16', month: 'Juillet', year: '2025', hour: '15', minute: '00' },
    description: 'Thème année 70 !!',
    hosts: EVENT_HOSTS,
    gifts: WEDDING_GIFT_ITEMS,
    participants: [],
    isCollective: false
  },
  '3': { // Christmas event
    id: '3',
    type: 'owned',
    title: 'Noël',
    subtitle: 'Noël 2024',
    date: '25/12/2024',
    color: '#FFE4E4', // Light pink for Christmas
    image: 'https://api.a0.dev/assets/image?text=christmas%20tree%20emoji%203d&aspect=1:1',
    location: { address: '15 rue des Roses', city: 'Paris', postalCode: '75008' },
    time: { day: '25', month: 'Décembre', year: '2024', hour: '19', minute: '00' },
    description: 'Fêtons Noël ensemble !',
    participants: [
      {
        id: '1',
        name: 'Dan Toulet',
        username: 'dantoulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=111'
      },
      {
        id: '2',
        name: 'Noémie Sanchez',
        username: 'noemiesanchez',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=222'
      },
      {
        id: '3',
        name: 'Audriana Toulet',
        username: 'audrianatoulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=333'
      },
      {
        id: '4',
        name: 'Paul Marceau',
        username: 'paulmarceau',
        avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444'
      }
    ],
    gifts: [
      {
        id: 'g1',
        name: 'Nintendo Switch OLED',
        price: '349.99 €',
        image: 'https://api.a0.dev/assets/image?text=nintendo%20switch%20oled%20console&aspect=1:1&seed=201',
        isFavorite: true,
        addedBy: {
          name: 'Dan Toulet',
          avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=111'
        }
      },
      {
        id: 'g2',
        name: 'AirPods Pro',
        price: '279.90 €',
        image: 'https://api.a0.dev/assets/image?text=airpods%20pro%20white%20earbuds&aspect=1:1&seed=202',
        isFavorite: true,
        addedBy: {
          name: 'Noémie Sanchez',
          avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=222'
        }
      },
      {
        id: 'g3',
        name: 'LEGO Star Wars',
        price: '159.99 €',
        image: 'https://api.a0.dev/assets/image?text=lego%20star%20wars%20millennium%20falcon&aspect=1:1&seed=203',
        isFavorite: false,
        addedBy: {
          name: 'Paul Marceau',
          avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444'
        }
      }
    ],
    isCollective: true
  }
};

// Joined event details
const joinedEventDetails = {
id: '2',
title: 'Anniversaire',
subtitle: 'Paul Marceau',
date: '09/12/2024',
color: '#E6DBFF', // Exactement comme dans la capture d'écran
image: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444', // Image de Paul
location: { address: '8 avenue des Pins', city: 'Lyon', postalCode: '69002' },
time: { day: '09', month: 'Décembre', year: '2024', hour: '19', minute: '30' },
description: 'Venez célébrer l\'anniversaire de Paul!',
isCollective: false
};

// Invitation details
const invitationDetails = {
  id: 'invitation',
  title: 'Saint Valentin',
  date: '14/02/2025',
  color: '#EADDFF',
  image: 'https://api.a0.dev/assets/image?text=red%20rose&aspect=1:1',
  invitedBy: { 
    name: 'Audriana Toulet', 
    username: 'audrianatoulet', 
    avatar: 'https://api.a0.dev/assets/image?text=avatar&aspect=1:1'
  },
  location: { address: '72 rue de la Maison Verte', city: 'Perpignan', postalCode: '66000' },
  time: { day: '14', month: 'Février', year: '2025', hour: '21', minute: '30', period: 'PM' },
  isCollective: false
};

// Mock data for participant wishes
const PARTICIPANT_WISHES = {
  'dantoulet': [
    {
      id: 'g1',
      name: 'Nintendo Switch OLED',
      price: '349.99 €',
      image: 'https://api.a0.dev/assets/image?text=nintendo%20switch%20oled%20console&aspect=1:1&seed=201',
      isFavorite: true,
      addedBy: {
        name: 'Dan Toulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=111'
      }
    }
  ],
  'noemiesanchez': [
    {
      id: 'g2', 
      name: 'AirPods Pro',
      price: '279.90 €',
      image: 'https://api.a0.dev/assets/image?text=airpods%20pro%20white%20earbuds&aspect=1:1&seed=202',
      isFavorite: true,
      addedBy: {
        name: 'Noémie Sanchez',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=222'
      }
    }
  ],
  'paulmarceau': [
    {
      id: 'g3',
      name: 'LEGO Star Wars',
      price: '159.99 €',
      image: 'https://api.a0.dev/assets/image?text=lego%20star%20wars%20millennium%20falcon&aspect=1:1&seed=203',
      isFavorite: true,
      addedBy: {
        name: 'Paul Marceau',
        avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=444'
      }
    }
  ],
  'audrianatoulet': [
    {
      id: 'g4',
      name: 'Diesel Ceinture',
      price: '59.90 €',
      image: 'https://api.a0.dev/assets/image?text=diesel%20belt%20black&aspect=1:1&seed=205',
      isFavorite: true,
      addedBy: {
        name: 'Audriana Toulet',
        avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=333'
      }
    }
  ]
};

const getAnimatedValue = (animatedValue: Animated.Value): number => {
  const valueObject = animatedValue as any;
  if (typeof valueObject._value === 'number') {
    return valueObject._value;
  }
  return INITIAL_HEIGHT;
};

const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EventDetailRouteProp>();
  const { eventId } = route.params || { eventId: '1' };  
  const isChristmasEvent = eventId === '3';
  
  // Référence à la ScrollView principale pour pouvoir la contrôler
  const mainScrollViewRef = useRef<ScrollView>(null);

  const determineEventType = (): EventType => {
    if (eventId === '1' || eventId === '3') return 'owned';
    if (eventId === '2') return 'owned';
    if (eventId === 'invitation') return 'invitation';
    return 'joined';
  };
  
  // Type guards
  const isOwnedEvent = (event: EventDetails): event is OwnedEventDetails => {
    return 'type' in event && event.type === 'owned';
  };

  const isInvitationEvent = (event: EventDetails): event is InvitationEventDetails => {
    return 'invitedBy' in event;
  };

  const isJoinedEvent = (event: EventDetails): event is JoinedEventDetails => {
    return !isOwnedEvent(event) && !isInvitationEvent(event);
  };

  const [eventType, setEventType] = useState<EventType>(determineEventType());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState<{[key: string]: boolean}>({});
  const selectedCount = Object.values(selectedGifts).filter(Boolean).length;
  const [showGiftDetailModal, setShowGiftDetailModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [showParticipantsView, setShowParticipantsView] = useState(false);
  const [showExitMenu, setShowExitMenu] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: string;
    name: string;
    username: string;
    avatar: string;
  } | null>(null);

  // Fonction pour basculer le menu de déconnexion
  const toggleExitMenu = () => {
    setShowExitMenu(!showExitMenu);
  };

  // Function to get event details
  const getEventDetails = () => {
    if (eventId === '1' || eventId === '3') {
      return EVENT_DETAILS[eventId];
    } else if (eventId === '2') {
      return joinedEventDetails;
    } else if (eventType === 'invitation') {
      return invitationDetails;
    }
    return EVENT_DETAILS['1']; // Default to wedding
  };

  const eventDetails = getEventDetails();

  // Set initial view based on event type
  useEffect(() => {
    setEventType(determineEventType());
    
    // For collective events, show the participants view by default
    if (eventDetails.isCollective) {
      setShowParticipantsView(true);
    } else {
      setShowParticipantsView(false);
    }
    
    // Initialize the modal in the middle position (60% height) by default
    sheetHeight.setValue(INITIAL_HEIGHT);
    setSheetState(1);
  }, [eventId, eventType]);

  // Function to open the gift detail modal when a gift is pressed
  const handleGiftPress = (gift: any) => {
    setSelectedGift(gift);
    setShowGiftDetailModal(true);
  };

  // Animation du bottom sheet - utiliser la hauteur au lieu de la position
  const sheetHeight = useRef(new Animated.Value(INITIAL_HEIGHT)).current;
  
  // État pour suivre le niveau de la modale: 0 = réduit, 1 = milieu, 2 = complètement déployé
  const [sheetState, setSheetState] = useState(1); // Commencer à l'état du milieu
  
  // Pour détecter si on est en train de faire glisser
  const isDragging = useRef(false);

  // Fonction pour basculer la modale entre les trois états
  const toggleSheet = () => {
    let nextState;
    let toValue;

    // Cycle entre les trois états
    if (sheetState === 0) {
      // De réduit à milieu
      nextState = 1;
      toValue = INITIAL_HEIGHT;
    } else if (sheetState === 1) {
      // De milieu à complètement déployé
      nextState = 2;
      toValue = FULL_HEIGHT;
    } else {
      // De complètement déployé à réduit
      nextState = 0;
      toValue = COLLAPSED_HEIGHT;
    }
    
    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,  // UseNativeDriver doit être false car nous animons la hauteur
      tension: 50,
      friction: 12,
    }).start();
    
    setSheetState(nextState);
  };
  
  // Fonction pour définir l'état de la modale à une valeur spécifique
  const setSheetToState = (state: number) => {
    let toValue;
    
    switch(state) {
      case 0:
        toValue = COLLAPSED_HEIGHT;
        break;
      case 1:
        toValue = INITIAL_HEIGHT;
        break;
      case 2:
        toValue = FULL_HEIGHT;
        // Quand on déploie la modale au maximum, remonter le contenu principal en haut
        if (mainScrollViewRef.current) {
          mainScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
        break;
      default:
        toValue = INITIAL_HEIGHT;
    }
    
    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 12,
    }).start();
    
    setSheetState(state);
  };

  // Gestionnaire pour le glissement de la modale
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy } = gestureState;
        // Autoriser le mouvement uniquement pour les glissements significatifs
        return Math.abs(dy) > 10;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        // Récupérer la hauteur actuelle
        let currentHeight;
        switch(sheetState) {
          case 0:
            currentHeight = COLLAPSED_HEIGHT;
            break;
          case 1:
            currentHeight = INITIAL_HEIGHT;
            break;
          case 2:
            currentHeight = FULL_HEIGHT;
            break;
          default:
            currentHeight = INITIAL_HEIGHT;
        }
        
        // Calculer la nouvelle hauteur basée sur le geste
        const newHeight = currentHeight - gestureState.dy;
        
        // Borner la hauteur entre les valeurs min et max
        const boundedHeight = Math.max(COLLAPSED_HEIGHT, Math.min(FULL_HEIGHT, newHeight));
        
        // Mettre à jour la hauteur
        sheetHeight.setValue(boundedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        let currentHeight = INITIAL_HEIGHT;
        
        try {
          currentHeight = getAnimatedValue(sheetHeight);
        } catch {
          // Fallback to a safe value if getValue fails
          currentHeight = INITIAL_HEIGHT;
        }
        
        // Déterminer l'état de destination en fonction de la vitesse et de la distance
        let targetState;
        
        // Si la vitesse est significative, utiliser principalement la direction
        if (Math.abs(vy) > 0.5) {
          if (vy < 0) {
            // Mouvement rapide vers le haut
            targetState = sheetState < 2 ? sheetState + 1 : 2;
          } else {
            // Mouvement rapide vers le bas
            targetState = sheetState > 0 ? sheetState - 1 : 0;
          }
        } else {
          // Sinon, déterminer l'état le plus proche
          const thresholdLow = (COLLAPSED_HEIGHT + INITIAL_HEIGHT) / 2;
          const thresholdHigh = (INITIAL_HEIGHT + FULL_HEIGHT) / 2;
          
          if (currentHeight < thresholdLow) {
            targetState = 0;
          } else if (currentHeight < thresholdHigh) {
            targetState = 1;
          } else {
            targetState = 2;
          }
        }
        
        // Mettre à jour l'état et animer vers la position cible
        setSheetToState(targetState);
        
        isDragging.current = false;
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      }
    })
  ).current;

  const handleBack = () => {
    navigation.goBack();
  };

  const copyToClipboard = (text: string, type: string) => {
    Clipboard.setString(text);
    toast.success(`"${type}" copié dans le presse-papier`);
  };

  const handleAccept = () => {
    toast.success('Invitation acceptée !');
    setTimeout(() => {
      navigation.goBack();
    }, 1000);
  };

  const handleRefuse = () => {
    toast.success('Invitation refusée');
    setTimeout(() => {
      navigation.goBack();
    }, 1000);
  };

  const handleAcceptJoinRequest = (requestId: string) => {
    toast.success('Demande acceptée');
    // In a real app, update the request status in the database
  };

  const handleRejectJoinRequest = (requestId: string) => {
    toast.success('Demande refusée');
    // In a real app, update the request status in the database
  };

  const handleSelectCollaborativeGift = () => {
    toast.success('Sélection de voeu collaboratif');
    // In a real app, navigate to gift selection screen
  };
  
  const handleParticipantSelect = (username: string) => {
    if (!isOwnedEvent(eventDetails)) return;
    
    const participant = eventDetails.participants?.find(p => p.username === username);
    if (participant) {
      setSelectedParticipant(participant);
      setShowParticipantsView(false);
      // Reset when switching back to participants view
      return () => setSelectedParticipant(null);
    }
  };

  // Render participants view for collective events
  const renderParticipantsView = () => {
    if (!showParticipantsView) return null;
    
    return (
      <View style={{flex: 1}}>
        {/* Participants List - Styled similarly to gift grid */}
        <ScrollView style={[styles.modalScrollView]} showsVerticalScrollIndicator={false}>
          <View style={styles.participantsList}>
            {getEventParticipants(eventDetails).map((participant) => (
              <TouchableOpacity 
                key={participant.id}
                style={styles.participantCard}
                activeOpacity={0.7}
                onPress={() => handleParticipantSelect(participant.username)}
              >
                <Image source={{ uri: participant.avatar }} style={styles.participantCardAvatar} />
                <View style={styles.participantCardInfo}>
                  <Text style={styles.participantCardName}>{participant.name}</Text>
                  <Text style={styles.participantCardUsername}>@{participant.username}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#CCCCCC" style={styles.participantCardChevron} />
              </TouchableOpacity>
            ))}
            
            {/* Add Managed Account Button - Styled similarly to gift cards */}
            <TouchableOpacity 
              style={styles.participantCard}
              activeOpacity={0.7}
              onPress={() => toast.success("Ajout d'un compte géré")}
            >
              <View style={styles.addAccountAvatarContainer}>
                <Feather name="plus" size={28} color="#999" />
              </View>
              <View style={styles.participantCardInfo}>
                <Text style={styles.participantCardName}>Ajouter un compte géré</Text>
                <Text style={styles.participantCardUsername}>Gérez les voeux de quelqu'un d'autre</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Espace supplémentaire en bas pour le scroll */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Bottom buttons bar with Invite, Share, and options menu */}
        <View style={styles.actionButtonsBar}>
          {/* Menu de déconnexion qui glisse par-dessus les autres boutons */}
          {showExitMenu && (
            <Animated.View style={styles.exitMenuOverlay}>
              <TouchableOpacity 
                style={styles.exitMenuBackButton}
                onPress={toggleExitMenu}
              >
                <Ionicons name="chevron-back" size={22} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.exitMenuButton}
                onPress={() => {
                  toast.success('Quitter l\'événement');
                  toggleExitMenu();
                  setTimeout(() => navigation.goBack(), 1000);
                }}
              >
                <Feather name="log-out" size={20} color="#FF3B30" />
                <Text style={styles.exitMenuText}>Quitter l'événement</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('EventInviteFriends' as never)}
          >
            <Feather name="users" size={20} color="#333" />
            <Text style={styles.actionButtonText}>Inviter des amis</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toast.success('Partage de l\'événement')}
          >
            <Feather name="share-2" size={20} color="#333" />
            <Text style={styles.actionButtonText}>Partager</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={toggleExitMenu}
          >
            <Feather name="more-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render the gifts list view
  const renderGiftsView = () => {
    if (showParticipantsView) return null;
    
    return (
      <View style={{flex: 1}}>
        {/* Collaborative Gift Button */}
        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.collaborativeGiftButton} onPress={handleSelectCollaborativeGift} activeOpacity={0.7}>
            <View style={styles.collaborativeGiftIcon}>
              <Feather name="gift" size={24} color="#007AFF" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.collaborativeGiftText}>Choisir mon voeu collaboratif</Text>
              <Text style={{fontSize: 13, color: '#666'}}>Participez à plusieurs à un cadeau</Text>
            </View>
            <AntDesign name="arrowright" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          {/* Gift Items Grid */}
          <View style={styles.giftItemsGrid}>              
            {getEventGifts(eventDetails).map((item: Gift) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.giftItemCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (isSelectionMode) {
                    setSelectedGifts(prev => ({
                      ...prev,
                      [item.id]: !prev[item.id]
                    }));
                  } else {
                    handleGiftPress(item);
                  }
                }}
              >
                <View style={styles.giftImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.giftImage} />
                  {item.isFavorite && !isSelectionMode && (
                    <View style={styles.favoriteTag}>
                      <AntDesign name="star" size={16} color="black" />
                    </View>
                  )}
                  {isSelectionMode && (
                    <View style={[
                      styles.selectionCircle, 
                      selectedGifts[item.id] && styles.selectionCircleSelected
                    ]}>
                      {selectedGifts[item.id] && (
                        <View style={styles.selectionInnerCircle} />
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.giftInfo}>
                  <Text style={styles.giftName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                  </Text>
                  <Text style={styles.giftPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {/* Add Item Placeholder - Only show when not in selection mode */}
            {!isSelectionMode && (
              <TouchableOpacity 
                style={styles.giftItemCard}
                activeOpacity={0.7}
                onPress={() => {
                  toast.success("Ajout d'un nouvel item");
                }}
              >
                <View style={styles.addGiftContainer}>
                  <Feather name="plus" size={40} color="#bbb" />
                  <Text style={styles.addGiftText}>Ajouter</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Espace supplémentaire en bas pour le scroll */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Bottom buttons bar - conditional based on selection mode */}
        {isSelectionMode ? (
          <View style={styles.selectionBottomBar}>
            <TouchableOpacity 
              style={styles.selectionBackButton} 
              onPress={() => {
                setIsSelectionMode(false);
                setSelectedGifts({});
              }}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            
            <View style={styles.selectionCountContainer}>
              <Text style={styles.selectionCountText}>
                {selectedCount} {selectedCount === 1 ? 'Sélectionné' : 'Sélectionnés'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => {
                toast.success(`${selectedCount} produit(s) supprimé(s)`);
                setIsSelectionMode(false);
                setSelectedGifts({});
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setIsSelectionMode(true)}
            >
              <Text style={styles.selectButtonText}>Selectionner</Text>
            </TouchableOpacity>
            <View style={styles.iconButtonsContainer}>
              {/* For collective events, show participants button */}
              {eventDetails.isCollective && (
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={() => setShowParticipantsView(true)}
                >
                  <Feather name="users" size={24} color="#007AFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => navigation.navigate('EventInviteFriends' as never)}
              >
                <Feather name={eventDetails.isCollective ? "user-plus" : "users"} size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Feather name="share" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Helper functions for type-safe property access
  type EventPropertyType = {
    description: string;
    subtitle: string;
    period?: string;
    invitedBy?: { name: string; username: string; avatar: string };
  };

  const getEventProperty = <K extends keyof EventPropertyType>(
    details: EventDetails,
    property: K,
    defaultValue?: EventPropertyType[K]
  ): EventPropertyType[K] => {
    if (property === 'description') {
      if (isOwnedEvent(details) || isJoinedEvent(details)) {
        return details.description as EventPropertyType[K];
      }
    }
    if (property === 'subtitle') {
      if (isOwnedEvent(details) || isJoinedEvent(details)) {
        return (details.subtitle || '') as EventPropertyType[K];
      }
    }
    if (property === 'invitedBy' && isInvitationEvent(details)) {
      return details.invitedBy as EventPropertyType[K];
    }
    if (property === 'period' && 'period' in details.time) {
      return details.time.period as EventPropertyType[K];
    }
    return defaultValue as EventPropertyType[K];
  };

  const getEventParticipants = (details: EventDetails): Participant[] => {
    return isOwnedEvent(details) && details.participants ? details.participants : [];
  };

  const getEventGifts = (details: EventDetails): Gift[] => {
    return isOwnedEvent(details) && details.gifts ? details.gifts : [];
  };

  const getEventDescription = (details: EventDetails): string => {
    if (isOwnedEvent(details) || isJoinedEvent(details)) {
      return details.description || '';
    }
    return '';
  };

  const getEventInvitedBy = (details: EventDetails) => {
    return isInvitationEvent(details) ? details.invitedBy : null;
  };

  const getEventSubtitle = (details: EventDetails): string => {
    if (isOwnedEvent(details)) {
      return details.subtitle || '';
    }
    return isJoinedEvent(details) ? details.subtitle : '';
  };

  // Common bottom sheet content for all event types
  const renderBottomSheetContent = () => {
    return (
      <View style={styles.bottomSheetContent}>
        {/* Seulement le bouton avec la flèche - pas de trait du tout */}
        <TouchableOpacity 
          style={styles.dragHandleContainer} 
          onPress={toggleSheet}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragIndicator}>
            <AntDesign 
              name={sheetState === 0 ? "arrowup" : sheetState === 1 ? "arrowup" : "arrowdown"} 
              size={16} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>
        
        {/* Conditional content based on state */}
        {showParticipantsView ? (
          renderParticipantsView()
        ) : (
          renderGiftsView()
        )}
      </View>
    );
  };

  // Common event details for owned events (both Wedding and Christmas)
  const renderOwnedEventDetails = () => {
    // Vérification de sécurité pour s'assurer que eventDetails est défini
    if (!eventDetails) return null;
    
    return (
      <ScrollView 
        ref={mainScrollViewRef}
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoCardTitleContainer}>
              <MaterialIcons name="location-on" size={24} color="black" />
              <Text style={styles.infoCardTitle}>Lieu d'événement</Text>
            </View>
            <TouchableOpacity onPress={() => copyToClipboard(`${eventDetails.location?.address || ''}, ${eventDetails.location?.city || ''} ${eventDetails.location?.postalCode || ''}`, 'Lieu')}>
              <Text style={styles.copyText}>copier</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.locationField}>
              <Text style={styles.locationText}>{eventDetails.location?.address || ''}</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={[styles.locationField, styles.cityField]}>
                <Text style={styles.locationText}>{eventDetails.location?.city || ''}</Text>
              </View>
              <View style={[styles.locationField, styles.postalCodeField]}>
                <Text style={styles.locationText}>{eventDetails.location?.postalCode || ''}</Text>
              </View>
            </View>
            {isChristmasEvent && (
              <View style={styles.locationField}>
                <Text style={styles.locationText}>Code : 1234, Etage 3, Apt. 5</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoCardTitleContainer}>
              <MaterialIcons name="date-range" size={24} color="black" />
              <Text style={styles.infoCardTitle}>Date de l'événement</Text>
            </View>
            <TouchableOpacity onPress={() => copyToClipboard(`${eventDetails.time?.day || ''} ${eventDetails.time?.month || ''} ${eventDetails.time?.year || ''} à ${eventDetails.time?.hour || ''}:${eventDetails.time?.minute || ''}`, 'Date')}>
              <Text style={styles.copyText}>copier</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateTimeInfo}>
            <View style={styles.dateBoxesContainer}>
              <View style={styles.dateBox}>
                <Text style={styles.dateBoxText}>{eventDetails.time?.day || ''}</Text>
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateBoxText}>{eventDetails.time?.month || ''}</Text>
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateBoxText}>{eventDetails.time?.year || ''}</Text>
              </View>
            </View>
            <View style={styles.timeContainer}>
              <View style={[styles.dateBox, styles.hourLabel]}>
                <Text style={styles.dateBoxText}>Heure</Text>
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateBoxText}>{eventDetails.time?.hour || ''}</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.dateBox}>
                <Text style={styles.dateBoxText}>{eventDetails.time?.minute || ''}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoCardTitleContainer}>
              <MaterialIcons name="description" size={24} color="black" />
              <Text style={styles.infoCardTitle}>Description</Text>
            </View>
            <TouchableOpacity onPress={() => copyToClipboard(getEventDescription(eventDetails), 'Description')}>
              <Text style={styles.copyText}>copier</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {getEventProperty(eventDetails, 'description')}
            </Text>
          </View>
        </View>
        
        {/* Extra padding for the bottom sheet - ensure it's the exact height of the sheet */}
        <View style={{ height: INITIAL_HEIGHT }} />
      </ScrollView>
    );
  };

  // Render invitation view
  if (eventType === 'invitation') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vous êtes invité !</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <View style={styles.eventCardContainer}>
            <View style={[styles.eventIconContainer, { backgroundColor: eventDetails.color }]}>
              <Image source={{ uri: eventDetails.image }} style={styles.eventIcon} />
            </View>
            <View>
              <Text style={styles.hostsText}>{getEventInvitedBy(eventDetails)?.name || ''}</Text>
              <Text style={styles.eventTitleText}>{eventDetails.title || ''}</Text>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>{eventDetails.date || ''}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.inviterContainer}>
            <Image source={{ uri: getEventInvitedBy(eventDetails)?.avatar || '' }} style={styles.inviterAvatar} />
            <View style={styles.inviterInfo}>
              <Text style={styles.inviterName}>{getEventInvitedBy(eventDetails)?.name || ''}</Text>
              <Text style={styles.inviterUsername}>{getEventInvitedBy(eventDetails)?.username || ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>
          
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardTitleContainer}>
                <MaterialIcons name="location-on" size={24} color="black" />
                <Text style={styles.infoCardTitle}>Lieu d'événement</Text>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(`${eventDetails.location?.address || ''}, ${eventDetails.location?.city || ''} ${eventDetails.location?.postalCode || ''}`, 'Lieu')}>
                <Text style={styles.copyText}>copier</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationInfo}>
              <View style={styles.locationField}>
                <Text style={styles.locationText}>{eventDetails.location?.address || ''}</Text>
              </View>
              <View style={styles.locationRow}>
                <View style={[styles.locationField, styles.cityField]}>
                  <Text style={styles.locationText}>{eventDetails.location?.city || ''}</Text>
                </View>
                <View style={[styles.locationField, styles.postalCodeField]}>
                  <Text style={styles.locationText}>{eventDetails.location?.postalCode || ''}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardTitleContainer}>
                <MaterialIcons name="event" size={24} color="black" />
                <Text style={styles.infoCardTitle}>Date de l'événement</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const time = eventDetails.time;
                  const timeString = `${time.day} ${time.month} ${time.year} à ${time.hour}:${time.minute}`;
                  copyToClipboard(timeString, 'Date');
                }}
              >
                <Text style={styles.copyText}>copier</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateTimeInfo}>
              <View style={styles.dateBoxesContainer}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.day || ''}</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.month || ''}</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.year || ''}</Text>
                </View>
              </View>
              <View style={styles.timeContainer}>
                <View style={[styles.dateBox, styles.hourLabel]}>
                  <Text style={styles.dateBoxText}>Heure</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.hour || ''}</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.minute || ''}</Text>
                </View>
                {isInvitationEvent(eventDetails) && eventDetails.time.period && (
                  <View style={styles.dateBox}>
                    <Text style={styles.dateBoxText}>{eventDetails.time.period}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.refuseButton} onPress={handleRefuse}>
              <Ionicons name="close" size={22} color="#FF3B30" />
              <Text style={styles.refuseButtonText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Ionicons name="checkmark" size={22} color="#4CD964" />
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  // For joined events
  if (eventType === 'joined') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={28} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{eventDetails.title || ''}</Text>
            <TouchableOpacity style={styles.chatButton}>
              <MaterialCommunityIcons name="chat-processing-outline" size={28} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.dateBadgeContainer}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{eventDetails.date || ''}</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardTitleContainer}>
                <MaterialIcons name="location-on" size={24} color="black" />
                <Text style={styles.infoCardTitle}>Lieu d'événement</Text>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(`${eventDetails.location?.address || ''}, ${eventDetails.location?.city || ''} ${eventDetails.location?.postalCode || ''}`, 'Lieu')}>
                <Text style={styles.copyText}>copier</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationInfo}>
              <View style={styles.locationField}>
                <Text style={styles.locationText}>{eventDetails.location?.address || ''}</Text>
              </View>
              <View style={styles.locationRow}>
                <View style={[styles.locationField, styles.cityField]}>
                  <Text style={styles.locationText}>{eventDetails.location?.city || ''}</Text>
                </View>
                <View style={[styles.locationField, styles.postalCodeField]}>
                  <Text style={styles.locationText}>{eventDetails.location?.postalCode || ''}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardTitleContainer}>
                <MaterialIcons name="date-range" size={24} color="black" />
                <Text style={styles.infoCardTitle}>Date de l'événement</Text>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(`${eventDetails.time?.day || ''} ${eventDetails.time?.month || ''} ${eventDetails.time?.year || ''} à ${eventDetails.time?.hour || ''}:${eventDetails.time?.minute || ''}`, 'Date')}>
                <Text style={styles.copyText}>copier</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateTimeInfo}>
              <View style={styles.dateBoxesContainer}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.day || ''}</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.month || ''}</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.year || ''}</Text>
                </View>
              </View>
              <View style={styles.timeContainer}>
                <View style={[styles.dateBox, styles.hourLabel]}>
                  <Text style={styles.dateBoxText}>Heure</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.hour || ''}</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxText}>{eventDetails.time?.minute || ''}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardTitleContainer}>
                <MaterialIcons name="description" size={24} color="black" />
                <Text style={styles.infoCardTitle}>Description</Text>
              </View>
              <TouchableOpacity onPress={() => copyToClipboard(getEventDescription(eventDetails), 'Description')}>
                <Text style={styles.copyText}>copier</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{getEventDescription(eventDetails)}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }  
  
  // Pour les événements dont on est propriétaire (Mariage et Noël)
  return (
    <SafeAreaView style={[styles.ownedContainer, { backgroundColor: eventDetails.color || '#FFFFFF' }]}>
      <View style={styles.contentContainer}>
        {/* Tout le contenu principal dans une seule ScrollView */}
        <ScrollView 
          ref={mainScrollViewRef}
          style={styles.mainScrollView}
          contentContainerStyle={styles.mainScrollViewContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={28} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{eventDetails.title || ''}</Text>
            <TouchableOpacity style={styles.chatButton}>
              <MaterialCommunityIcons name="chat-processing-outline" size={28} color="black" />
            </TouchableOpacity>
          </View>
          
          {/* Event specific header content */}
          {isChristmasEvent ? (
            /* Christmas Event Box */
            <View style={styles.christmasEventBox}>
              <View style={styles.christmasImageContainer}>
                <Image 
                  source={{ uri: eventDetails.image }} 
                  style={styles.christmasTreeImage} 
                />
              </View>
              <View style={styles.christmasEventInfo}>
                <Text style={styles.christmasEventTitle}>{getEventSubtitle(eventDetails)}</Text>
                <View style={styles.christmasdateBadge}>
                  <Text style={styles.christmasdateBadgeText}>{eventDetails.date || ''}</Text>
                </View>
              </View>
            </View>
          ) : (
            /* Wedding content */
            <>
              <View style={styles.dateBadgeContainer}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{eventDetails.date || ''}</Text>
                </View>
              </View>
              
              {/* Host Profiles for Wedding */}
              <View style={styles.hostsContainer}>
                {(EVENT_HOSTS || []).map((host) => (
                  <View key={host.id} style={styles.hostContainer}>
                    <View style={styles.hostAvatarBubble}>
                      <Image source={{ uri: host.avatar }} style={styles.hostAvatar} />
                    </View>
                    <Text style={styles.hostName}>{host.name}</Text>
                  </View>
                ))}
                <Text style={styles.andSymbol}>&</Text>
              </View>
              
              {/* Join Requests - only for Wedding */}
              {(JOIN_REQUESTS || []).length > 0 && (
                <View style={styles.joinRequestsContainer}>
                  {(JOIN_REQUESTS || []).map(request => (
                    <View key={request.id} style={styles.joinRequestCard}>
                      <Image source={{ uri: request.avatar }} style={styles.requestAvatar} />
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestName}>{request.name}</Text>
                        <Text style={styles.requestUsername}>{request.username} souhaite participer à l'événement</Text>
                      </View>
                      <View style={styles.requestActions}>
                        <TouchableOpacity 
                          style={[styles.requestActionButton, styles.rejectButton]} 
                          onPress={() => handleRejectJoinRequest(request.id)}
                        >
                          <Text style={styles.requestActionText}>✕</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.requestActionButton, styles.approveButton]} 
                          onPress={() => handleAcceptJoinRequest(request.id)}
                        >
                          <Text style={styles.requestActionText}>✓</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          
          {/* Common Event Details */}
          {/* Vérification de sécurité pour s'assurer que eventDetails est défini */}
          {eventDetails ? (
            <>
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={styles.infoCardTitleContainer}>
                    <MaterialIcons name="location-on" size={24} color="black" />
                    <Text style={styles.infoCardTitle}>Lieu d'événement</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyToClipboard(`${eventDetails.location?.address || ''}, ${eventDetails.location?.city || ''} ${eventDetails.location?.postalCode || ''}`, 'Lieu')}>
                    <Text style={styles.copyText}>copier</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.locationInfo}>
                  <View style={styles.locationField}>
                    <Text style={styles.locationText}>{eventDetails.location?.address || ''}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <View style={[styles.locationField, styles.cityField]}>
                      <Text style={styles.locationText}>{eventDetails.location?.city || ''}</Text>
                    </View>
                    <View style={[styles.locationField, styles.postalCodeField]}>
                      <Text style={styles.locationText}>{eventDetails.location?.postalCode || ''}</Text>
                    </View>
                  </View>
                  {isChristmasEvent && (
                    <View style={styles.locationField}>
                      <Text style={styles.locationText}>Code : 1234, Etage 3, Apt. 5</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={styles.infoCardTitleContainer}>
                    <MaterialIcons name="date-range" size={24} color="black" />
                    <Text style={styles.infoCardTitle}>Date de l'événement</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyToClipboard(`${eventDetails.time?.day || ''} ${eventDetails.time?.month || ''} ${eventDetails.time?.year || ''} à ${eventDetails.time?.hour || ''}:${eventDetails.time?.minute || ''}`, 'Date')}>
                    <Text style={styles.copyText}>copier</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateTimeInfo}>
                  <View style={styles.dateBoxesContainer}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateBoxText}>{eventDetails.time?.day || ''}</Text>
                    </View>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateBoxText}>{eventDetails.time?.month || ''}</Text>
                    </View>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateBoxText}>{eventDetails.time?.year || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.timeContainer}>
                    <View style={[styles.dateBox, styles.hourLabel]}>
                      <Text style={styles.dateBoxText}>Heure</Text>
                    </View>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateBoxText}>{eventDetails.time?.hour || ''}</Text>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateBoxText}>{eventDetails.time?.minute || ''}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={styles.infoCardTitleContainer}>
                    <MaterialIcons name="description" size={24} color="black" />
                    <Text style={styles.infoCardTitle}>Description</Text>
                  </View>
                  <TouchableOpacity onPress={() => copyToClipboard(getEventDescription(eventDetails), 'Description')}>
                    <Text style={styles.copyText}>copier</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>{getEventDescription(eventDetails)}</Text>
                </View>
              </View>
            </>
          ) : null}
          
          {/* Extra padding for the bottom sheet */}
          <View style={{ height: FULL_HEIGHT }} />
        </ScrollView>
      </View>
      
      {/* Bottom Sheet - Animé par la hauteur */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          {
            height: sheetHeight
          }
        ]}
      >
        <View style={styles.bottomSheetContent}>
          {/* Seulement le bouton avec la flèche - pas de trait du tout */}
          <TouchableOpacity 
            style={styles.dragHandleContainer} 
            onPress={toggleSheet}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragIndicator}>
              <AntDesign 
                name={sheetState === 0 ? "arrowup" : sheetState === 1 ? "arrowup" : "arrowdown"} 
                size={16} 
                color="#666" 
              />
            </View>
          </TouchableOpacity>
          
          {/* Conditional content based on state */}
          {showParticipantsView ? (
            renderParticipantsView()
          ) : (
            renderGiftsView()
          )}
        </View>
      </Animated.View>

      {/* Gift Detail Modal */}
      <EventGiftDetailModal
        visible={showGiftDetailModal}
        onClose={() => setShowGiftDetailModal(false)}
        gift={selectedGift}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  ownedContainer: { 
    flex: 1, 
    backgroundColor: '#C8E6FF',
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1, // Lower than bottomSheet
    paddingBottom: COLLAPSED_HEIGHT, // Ajouté padding en bas pour la modale
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  backButton: { 
    padding: 5 
  },
  headerSpacer: { 
    width: 28 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  chatButton: { 
    padding: 5 
  },
  dateBadgeContainer: { 
    alignItems: 'center', 
    marginVertical: 10 
  },
  dateBadge: { 
    backgroundColor: '#DDFFDD', 
    borderRadius: 20, 
    paddingVertical: 8, 
    paddingHorizontal: 15 
  },
  dateBadgeText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#006600' 
  },
  eventCardContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 20, 
    marginBottom: 10, 
    alignItems: 'center' 
  },
  eventIconContainer: { 
    width: 110, 
    height: 110, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 20 
  },
  eventIcon: { 
    width: 70, 
    height: 70, 
    resizeMode: 'contain' 
  },
  hostsText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  eventTitleText: { 
    fontSize: 20, 
    marginBottom: 10 
  },
  inviterContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0', 
    marginBottom: 20 
  },
  inviterAvatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 15 
  },
  inviterInfo: { 
    flex: 1 
  },
  inviterName: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  inviterUsername: { 
    fontSize: 16, 
    color: '#999' 
  },
  infoCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginVertical: 10, 
    borderRadius: 20, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#F0F0F0' 
  },
  infoCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  infoCardTitleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  infoCardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  copyText: { 
    color: '#999', 
    fontSize: 16 
  },
  locationInfo: { 
    marginBottom: 5 
  },
  locationField: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 20, 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 8
  },
  locationRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10 
  },
  cityField: { 
    flex: 1, 
    marginRight: 8
  },
  postalCodeField: { 
    width: '45%',
    marginLeft: 8
  },
  locationText: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  dateTimeInfo: { 
    marginTop: 10 
  },
  dateBoxesContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  dateBox: { 
    flex: 1, 
    backgroundColor: '#F5F5F5', 
    borderRadius: 20, 
    paddingVertical: 16, 
    paddingHorizontal: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginHorizontal: 4
  },
  dateBoxText: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  timeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  hourLabel: { 
    width: '30%' 
  },
  timeSeparator: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginHorizontal: 2 
  },
  actionsCard: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginVertical: 10, 
    borderRadius: 20, 
    overflow: 'hidden' 
  },
  refuseButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FFEEEE', 
    paddingVertical: 18 
  },
  refuseButtonText: { 
    color: '#FF3B30', 
    fontWeight: 'bold', 
    fontSize: 18, 
    marginLeft: 10 
  },
  acceptButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#EFFFEE', 
    paddingVertical: 18 
  },
  acceptButtonText: { 
    color: '#4CD964', 
    fontWeight: 'bold', 
    fontSize: 18, 
    marginLeft: 10 
  },
  
  // Host/Participant styles
  hostsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    position: 'relative',
  },
  hostContainer: {
    alignItems: 'center',
    marginHorizontal: 40,
  },
  hostAvatarBubble: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A5E8FF',
    padding: 5,
    marginBottom: 10,
  },
  hostAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  hostName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  andSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    position: 'absolute',
    alignSelf: 'center',
  },
  joinRequestsContainer: {
    margin: 20,
  },
  joinRequestCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  requestUsername: {
    fontSize: 14,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  rejectButton: {
    backgroundColor: '#FFEEEE',
  },
  approveButton: {
    backgroundColor: '#EFFFEE',
  },
  requestActionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Bottom sheet styles
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10, // Higher than content
  },
  bottomSheetContent: {
    flex: 1,
  },
  dragHandleContainer: {
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Aucune ombre, aucune bordure, aucun trait
  },
  // Ajout de nouveaux styles pour le scroll
  mainScrollView: {
    flex: 1,
  },
  mainScrollViewContent: {
    paddingBottom: 100, // Espace supplémentaire en bas
  },
  modalScrollView: {
    flex: 1,
    paddingTop: 10,
  },
  dragIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f6f6f6',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  collaborativeGiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  collaborativeGiftIcon: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collaborativeGiftText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  giftItemsContainer: {
    flex: 1,
  },
  giftItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  giftItemCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  giftImageContainer: {
    aspectRatio: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  giftImage: {
    width: '100%',
    height: '100%',
  },
  favoriteTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  giftInfo: {
    padding: 12,
    backgroundColor: 'white',
  },
  giftName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  giftPrice: {
    fontSize: 16,
    color: '#666',
    marginTop: 3,
    fontWeight: '500',
  },
  addGiftContainer: {
    aspectRatio: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
    paddingBottom: 30, // For the text below
  },
  addGiftText: {
    position: 'absolute',
    bottom: 15,
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },  
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  christmasEventBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  christmasImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  christmasTreeImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  christmasEventInfo: {
    flex: 1,
  },
  christmasEventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  christmasdateBadge: {
    backgroundColor: '#DDFFDD',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  christmasdateBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006600',
  },
  dragHandleChevron: {
    alignItems: 'center',
  },
  // Updated participants styles to match gift grid style
  participantsList: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  participantCardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  participantCardInfo: {
    flex: 1,
  },
  participantCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  participantCardUsername: {
    fontSize: 14,
    color: '#888',
  },
  participantCardChevron: {
    marginLeft: 5,
  },
  addAccountAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  // Styles for action buttons in participants view
  actionButtonsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingVertical: 15,
    paddingHorizontal: 15,
    position: 'relative',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  optionsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  // Exit menu styles
  exitMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingVertical: 15,
    paddingHorizontal: 15,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitMenuBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exitMenuButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  exitMenuText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FF3B30',
  },
  selectButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 25,
    flex: 1,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  iconButtonsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsContainer: {
    flex: 1,
    paddingBottom: 20, // Ajouté un peu de padding en bas
    zIndex: 1, // Keep this lower than bottomSheet
  },
  descriptionContainer: {
    padding: 5,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  
  // Selection mode styles
  selectionCircle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCircleSelected: {
    borderColor: '#007AFF',
  },
  selectionInnerCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
  },
  selectionBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  selectionBackButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectionCountContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  selectionCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  deleteButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  }
});

export default EventDetailScreen;