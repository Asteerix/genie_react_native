import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Platform,
  FlatList,
  Animated,
  Easing,
  Dimensions,
  BackHandler,
  Keyboard,
  PanResponder,
  SectionList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import _ from 'lodash';

// Obtenir les dimensions de l'écran
const { width, height } = Dimensions.get('window');

// Définition des types d'événements
type EventType = 'collectif' | 'individuel' | 'special';

interface EventDefinition {
  id: string;
  name: string;
  type: EventType;
  icon: string;
  emojis: string[];
  defaultDate?: string;
  invitations: string;
  info?: string;
  dateFormat?: 'fixed' | 'personal';
  selected?: boolean;
}

// ID constant pour le toast de sélection (pour éviter les empilements)
const SELECTION_TOAST_ID = 'event-selection-toast';

// Liste complète des événements correspondant exactement au tableau
const PREDEFINED_EVENTS: EventDefinition[] = [
  {
    id: 'noel',
    name: 'Noël',
    type: 'collectif',
    icon: '🎄',
    emojis: ['🎄', '🎅', '☃️', '❄️'],
    defaultDate: '25 Décembre',
    invitations: 'Tous le monde',
    selected: true
  },
  {
    id: 'saint-valentin',
    name: 'Saint Valentin',
    type: 'collectif',
    icon: '❤️',
    emojis: ['🌹', '💝', '❤️', '🏹'],
    defaultDate: '14 Février',
    invitations: 'Qu\'1 personne de +15 ans'
  },
  {
    id: 'nouvel-an-lunaire',
    name: 'Nouvel an lunaire',
    type: 'collectif',
    icon: '🧧',
    emojis: ['🧧', '🌙', '🎊', '🌛'],
    defaultDate: '29 Janvier',
    invitations: 'Tous le monde'
  },
  {
    id: 'nouvel-an',
    name: 'Nouvel an',
    type: 'collectif',
    icon: '🎆',
    emojis: ['🎆', '🍾', '⚡', '🎇'],
    defaultDate: '1 Janvier',
    invitations: 'Tous le monde'
  },
  {
    id: 'kwanzaa',
    name: 'Kwanzaa',
    type: 'collectif',
    icon: '🕯️',
    emojis: ['🕯️', '🎁', '🥣', '🎵'],
    defaultDate: '26 Décembre',
    invitations: 'Tous le monde'
  },
  {
    id: 'raksha-bandhan',
    name: 'Raksha Bandhan',
    type: 'collectif',
    icon: '🪢',
    emojis: ['🪢', '🌸', '🥣', '🍲'],
    defaultDate: '19 Août',
    invitations: 'Tous le monde'
  },
  {
    id: 'vesak',
    name: 'Vesak',
    type: 'collectif',
    icon: '🪷',
    emojis: ['🪷', '⛩️', '🍵', '🏮'],
    defaultDate: '15 Mai',
    invitations: 'Tous le monde'
  },
  {
    id: 'pesach',
    name: 'Pesach',
    type: 'collectif',
    icon: '🍷',
    emojis: ['🍷', '🔥', '✡️', '🕯️'],
    defaultDate: '15 Avril',
    invitations: 'Tous le monde'
  },
  {
    id: 'hanoukka',
    name: 'Hanoukka',
    type: 'collectif',
    icon: '🕎',
    emojis: ['🕎', '🕯️', '🥣', '✡️'],
    defaultDate: '25 Décembre',
    invitations: 'Tous le monde'
  },
  {
    id: 'diwali',
    name: 'Diwali',
    type: 'collectif',
    icon: '🪔',
    emojis: ['🪔', '🧨', '🎆', '✨'],
    defaultDate: '31 Octobre',
    invitations: 'Tous le monde'
  },
  {
    id: 'eid-al-adha',
    name: 'Eid al-Adha',
    type: 'collectif',
    icon: '🐑',
    emojis: ['🐑', '☪️', '🥘', '🕌'],
    defaultDate: '5 Juin',
    invitations: 'Tous le monde'
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    type: 'collectif',
    icon: '🌙',
    emojis: ['🌙', '☪️', '🥘', '🕌'],
    defaultDate: '25 Mars',
    invitations: 'Tous le monde'
  },
  {
    id: 'carnaval',
    name: 'Carnaval',
    type: 'collectif',
    icon: '🎭',
    emojis: ['🎭', '🎺', '🎊', '🥁'],
    defaultDate: '27 Février',
    invitations: 'Tous le monde'
  },
  {
    id: 'mi-automne',
    name: 'Mi-automne',
    type: 'collectif',
    icon: '🥮',
    emojis: ['🥮', '🌙', '🎊', '🧧'],
    defaultDate: '17 Septembre',
    invitations: 'Tous le monde'
  },
  {
    id: 'saint-jean',
    name: 'Saint-Jean',
    type: 'collectif',
    icon: '🔥',
    emojis: ['🔥', '🎆', '🎇', '🪄'],
    defaultDate: '24 Juin',
    invitations: 'Tous le monde'
  },
  {
    id: 'anniversaire',
    name: 'Anniversaire',
    type: 'individuel',
    icon: '🎂',
    emojis: ['🎂', '🎉', '🍰', '🥳'],
    invitations: 'Tous le monde',
    info: 'C\'est l\'anniversaire de...',
    dateFormat: 'personal'
  },
  {
    id: 'fiancailles',
    name: 'Fiançailles',
    type: 'individuel',
    icon: '💍',
    emojis: ['💍', '🔨', '💝', '🥂'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'mariage',
    name: 'Mariage',
    type: 'individuel',
    icon: '💍',
    emojis: ['💍', '👰', '💒', '🤵'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'bapteme',
    name: 'Baptême',
    type: 'individuel',
    icon: '👶',
    emojis: ['👶', '🎁', '🕊️', '🙏'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'communion',
    name: 'Communion',
    type: 'individuel',
    icon: '🙏',
    emojis: ['🙏', '✝️', '🎀', '📖'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'confirmation',
    name: 'Confirmation',
    type: 'individuel',
    icon: '✝️',
    emojis: ['✝️', '🙏', '🎀', '📖'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'naissance',
    name: 'Naissance',
    type: 'individuel',
    icon: '👶',
    emojis: ['👶', '🍼', '🧸', '👼'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    type: 'individuel',
    icon: '🧸',
    emojis: ['🧸', '👶', '🎀', '🍼'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'gender-reveal',
    name: 'Gender Reveal',
    type: 'individuel',
    icon: '👶',
    emojis: ['👶', '🍼', '💙', '💕'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'fete-des-peres',
    name: 'Fête des pères',
    type: 'individuel',
    icon: '👨',
    emojis: ['👨', '👴', '🎁', '❤️'],
    defaultDate: '16 Juin',
    invitations: 'Tous le monde'
  },
  {
    id: 'fete-des-meres',
    name: 'Fête des mères',
    type: 'individuel',
    icon: '👩',
    emojis: ['👩', '🌸', '🎁', '❤️'],
    defaultDate: '25 Mai',
    invitations: 'Tous le monde'
  },
  {
    id: 'retraite',
    name: 'Retraite',
    type: 'individuel',
    icon: '🏖️',
    emojis: ['🏖️', '🧓', '🎉', '🚶'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'pot-de-depart',
    name: 'Pot de départ',
    type: 'individuel',
    icon: '🥂',
    emojis: ['🥂', '🍾', '⚡', '🚶'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'a-la-maison',
    name: 'À la maison',
    type: 'individuel',
    icon: '🏡',
    emojis: ['🏡', '🍕', '🎮', '🌱'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'remise-diplomes',
    name: 'Remise diplômes',
    type: 'individuel',
    icon: '🎓',
    emojis: ['🎓', '📜', '🎊', '🎉'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'cremaillere',
    name: 'Crémaillère',
    type: 'individuel',
    icon: '🏠',
    emojis: ['🏠', '🔨', '🎁', '🥂'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'quinceanera',
    name: 'Quinceañera',
    type: 'individuel',
    icon: '👑',
    emojis: ['👑', '💃', '🎀', '🎊'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'bar-bat-mitzvah',
    name: 'Bar/Bat Mitzvah',
    type: 'individuel',
    icon: '✡️',
    emojis: ['✡️', '🕯️', '📖', '🎁'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'secret-santa',
    name: 'Secret Santa',
    type: 'special',
    icon: '🎅',
    emojis: ['🎅', '🎁', '🎄', '🎀'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'custom-collectif',
    name: 'Custom',
    type: 'collectif',
    icon: '🎮',
    emojis: ['🎮', '🎨', '🎯', '🪄'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  },
  {
    id: 'custom-individuel',
    name: 'Custom',
    type: 'individuel',
    icon: '🎮',
    emojis: ['🎮', '🎨', '🎯', '🪄'],
    invitations: 'Tous le monde',
    dateFormat: 'personal'
  }
];

// Grouper les événements par type pour la section list
const groupedEvents = {
  collectif: PREDEFINED_EVENTS.filter(event => event.type === 'collectif'),
  individuel: PREDEFINED_EVENTS.filter(event => event.type === 'individuel'),
  special: PREDEFINED_EVENTS.filter(event => event.type === 'special')
};

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventSelect?: (event: EventDefinition) => void;
}

// Composant séparé pour les éléments d'événement (pour éviter l'erreur de hooks)
const EventItem = memo(({ 
  item, 
  onSelect, 
  isSelected 
}: { 
  item: EventDefinition; 
  onSelect: (id: string) => void; 
  isSelected: boolean;
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.97, 
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isSelected, scaleAnimation]);
  
  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnimation }]
      }}
    >
      <TouchableOpacity
        style={[
          styles.eventItem,
          isSelected && styles.selectedEventItem
        ]}
        onPress={() => onSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.eventIconContainer}>
          <Text style={styles.eventEmoji}>{item.icon}</Text>
        </View>
        <Text style={styles.eventName}>{item.name}</Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={22} color="black" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// Composant pour le tooltip
const SearchTooltip = memo(({ 
  visible, 
  opacity, 
  onClose 
}: { 
  visible: boolean; 
  opacity: Animated.Value; 
  onClose: () => void;
}) => {
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.tooltipContainer,
        { opacity }
      ]}
    >
      <View style={styles.tooltip}>
        <View style={styles.tooltipHeader}>
          <Text style={styles.tooltipTitle}>Événement introuvable ?</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color="black" />
          </TouchableOpacity>
        </View>
        <Text style={styles.tooltipText}>Pas de problème !</Text>
        <Text style={styles.tooltipText}>Crée ton événement customisable.</Text>
      </View>
      <View style={styles.tooltipArrow} />
    </Animated.View>
  );
});

// Composant pour l'en-tête de section
const SectionHeader = memo(({ 
  title 
}: { 
  title: string;
}) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
});

// Composant principal
const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onEventSelect
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<EventDefinition[]>(PREDEFINED_EVENTS);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [useSectionList, setUseSectionList] = useState(false);
  
  // Préparer les données pour la SectionList
  const sectionListData = [
    { title: 'Événements collectifs', data: groupedEvents.collectif },
    { title: 'Événements individuels', data: groupedEvents.individuel },
    { title: 'Événements spéciaux', data: groupedEvents.special }
  ];
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList | SectionList>(null);

  // Animation pour le swipe de fermeture
  const panY = useRef(new Animated.Value(0)).current;

  // PanResponder pour gérer le swipe down pour fermer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Limite le déplacement vers le haut
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          // Si le swipe est assez grand, fermer le modal
          closeWithAnimation();
        } else {
          // Sinon, revenir à la position initiale
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10
          }).start();
        }
      }
    })
  ).current;

  // Gestion du hardware back button sur Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        closeWithAnimation();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  // Animation d'entrée et de sortie du modal
  useEffect(() => {
    if (visible) {
      // Initialiser l'état
      setSearchQuery('');
      setFilteredEvents(PREDEFINED_EVENTS);
      setShowTooltip(false);
      panY.setValue(0);
      
      // Démarrer l'animation d'entrée
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)), // Courbe d'animation optimisée
        useNativeDriver: true,
      }).start(() => {
        // Mettre le focus sur le champ de recherche après l'animation
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
      });
    }
  }, [visible, slideAnimation, panY]);

  // Fermeture avec animation
  const closeWithAnimation = useCallback(() => {
    // Masquer le clavier immédiatement
    Keyboard.dismiss();
    
    // Animation de sortie
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 280,
      easing: Easing.in(Easing.bezier(0.33, 0, 0.67, 1)),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [slideAnimation, onClose]);

  // Filtrer les événements selon la recherche
  useEffect(() => {
    // Si le champ de recherche est vide, afficher tous les événements
    if (!searchQuery.trim()) {
      setFilteredEvents(PREDEFINED_EVENTS);
      setShowTooltip(false);
      setUseSectionList(false);
      
      // Animer la disparition du tooltip
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      return;
    }

    // Normaliser la recherche (ignorer les accents et la casse)
    const normalized = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Filtrer les événements qui correspondent à la recherche
    const filtered = PREDEFINED_EVENTS.filter(event => 
      event.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalized)
    );
    
    // S'assurer que chaque ID est unique
    const uniqueFiltered = _.uniqBy(filtered, 'id');
    setFilteredEvents(uniqueFiltered);
    
    // Désactiver la section list en mode recherche
    setUseSectionList(false);
    
    // Afficher le tooltip si aucun résultat
    if (uniqueFiltered.length === 0) {
      setTimeout(() => {
        setShowTooltip(true);
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 300);
    } else {
      setShowTooltip(false);
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [searchQuery, tooltipOpacity]);

  // Sélectionner un événement avec animation et toast unique
  const handleEventSelect = useCallback((selectedEventId: string) => {
    // Vérifier si c'est la même sélection que précédemment
    const isSameSelection = currentSelection === selectedEventId;
    
    // Mise à jour de la sélection actuelle
    setCurrentSelection(selectedEventId);
    
    // Mettre à jour l'état des événements
    const updatedEvents = PREDEFINED_EVENTS.map(event => ({
      ...event,
      selected: event.id === selectedEventId
    }));
    
    // Mettre à jour la liste filtrée
    if (searchQuery) {
      const normalized = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtered = updatedEvents.filter(event => 
        event.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalized)
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(updatedEvents);
    }
    
    const selectedEvent = updatedEvents.find(event => event.id === selectedEventId);
    if (selectedEvent) {
      // Fermer le clavier
      Keyboard.dismiss();
      
      // Feedback visuel de sélection avec ID unique pour éviter l'empilement des toasts
      if (!isSameSelection) {
        toast.dismiss(SELECTION_TOAST_ID); // Fermer un toast existant
        
        setTimeout(() => {
          toast.success(`${selectedEvent.name} sélectionné`, {
            id: SELECTION_TOAST_ID, // Utiliser le même ID pour remplacer plutôt qu'empiler
            duration: 2000,
          });
        }, 50); // Petit délai pour assurer la transition fluide
      }
    }
  }, [currentSelection, searchQuery]);

// Gérer le bouton Custom
const handleCustomEvent = useCallback(() => {
  console.log("Redirection vers le choix d'événement personnalisé");
  
  // Fermer le modal actuel
  closeWithAnimation();
  
  // Naviguer vers l'écran de sélection du type d'événement personnalisable
  // Utiliser un délai court pour s'assurer que le modal est fermé avant la navigation
  setTimeout(() => {
    navigation.navigate('CustomEventTypeSelection');
  }, 300);
  
}, [closeWithAnimation, navigation]);

  // Continuer avec l'événement sélectionné
  const handleNext = useCallback(() => {
    const selectedEvent = filteredEvents.find(event => event.selected) || 
                         PREDEFINED_EVENTS.find(event => event.selected);
    
    if (selectedEvent) {
      // Si un callback de sélection d'événement est fourni, l'appeler
      if (onEventSelect) {
        onEventSelect(selectedEvent);
      }
      
      closeWithAnimation();
    } else {
      toast.error("Veuillez sélectionner un événement", {
        duration: 2000,
      });
    }
  }, [filteredEvents, closeWithAnimation, onEventSelect]);

  // Fermer le tooltip
  const handleCloseTooltip = useCallback(() => {
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowTooltip(false);
    });
  }, [tooltipOpacity]);

  // Toggle entre la vue normale et la vue par sections
  const toggleViewMode = useCallback(() => {
    setUseSectionList(prev => !prev);
    setSearchQuery(''); // Réinitialiser la recherche
    setFilteredEvents(PREDEFINED_EVENTS);
  }, []);

  // Optimized renderItem function that doesn't include hooks
  const renderEventItem = useCallback(({ item }: { item: EventDefinition }) => {
    const isSelected = !!item.selected;
    return (
      <EventItem 
        item={item} 
        onSelect={handleEventSelect} 
        isSelected={isSelected} 
      />
    );
  }, [handleEventSelect]);

  // Fonction de rendu pour l'en-tête de section
  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => {
    return <SectionHeader title={section.title} />;
  }, []);

  // Make sure each item has a unique key
  const keyExtractor = useCallback((item: EventDefinition) => {
    return `${item.id}-${item.type}`;
  }, []);

  // Calculer les transformations pour l'animation
  const modalTranslateY = Animated.add(
    slideAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [height, 0]
    }),
    panY
  );

  const backdropOpacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5]
  });

  // Rendre le composant vide si le modal n'est pas visible
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeWithAnimation}
    >
      {/* Overlay semi-transparent */}
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={closeWithAnimation}
        />
      </Animated.View>
      
      {/* Container du modal avec animation */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: modalTranslateY }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Barre de swipe en haut */}
        <View style={styles.swipeBar}>
          <View style={styles.swipeIndicator} />
        </View>
        
        <SafeAreaView style={styles.modalContent}>
          {/* Header avec titre et boutons */}
          <View style={styles.header}>
            <TouchableOpacity onPress={closeWithAnimation} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            
            <Text style={styles.title}>Créer un événement</Text>
            
            <TouchableOpacity onPress={toggleViewMode} style={styles.helpButton}>
              <Ionicons 
                name={useSectionList ? "grid-outline" : "list-outline"} 
                size={24} 
                color="black" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <View style={[
              styles.searchInputContainer,
              isSearchFocused && styles.searchInputContainerFocused
            ]}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Rechercher : Anniversaire, Noël..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              <TouchableOpacity style={styles.searchAddButton}>
                <Ionicons name="add" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Tooltip component */}
          <SearchTooltip 
            visible={showTooltip} 
            opacity={tooltipOpacity} 
            onClose={handleCloseTooltip} 
          />
          
          {/* Liste des événements - conditionnelle selon le mode de vue */}
          {useSectionList ? (
            <SectionList
              ref={listRef as React.RefObject<SectionList>}
              sections={sectionListData}
              renderItem={renderEventItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={keyExtractor}
              style={styles.eventsList}
              contentContainerStyle={styles.eventsListContent}
              stickySectionHeadersEnabled={true}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              removeClippedSubviews={Platform.OS === 'android'}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>Aucun résultat trouvé</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              ref={listRef as React.RefObject<FlatList>}
              data={filteredEvents}
              renderItem={renderEventItem}
              keyExtractor={keyExtractor}
              style={styles.eventsList}
              contentContainerStyle={styles.eventsListContent}
              initialNumToRender={15}
              windowSize={12}
              maxToRenderPerBatch={12}
              removeClippedSubviews={Platform.OS === 'android'}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={true}
              ListEmptyComponent={
                !showTooltip ? (
                  <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>Aucun résultat trouvé</Text>
                  </View>
                ) : null
              }
            />
          )}
          
          {/* Bottom Buttons avec animation */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.customButton}
              onPress={handleCustomEvent}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="black" />
              <Text style={styles.customButtonText}>Custom</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.nextButton,
                (filteredEvents.some(e => e.selected) || PREDEFINED_EVENTS.some(e => e.selected)) 
                  ? styles.activeNextButton 
                  : {}
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!filteredEvents.some(e => e.selected) && !PREDEFINED_EVENTS.some(e => e.selected)}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
    height: height * 0.85, // 85% de hauteur d'écran
  },
  modalContent: {
    flex: 1,
  },
  swipeBar: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5, 
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  helpButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  searchInputContainer: {
    backgroundColor: '#F2F2F2',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  searchInputContainerFocused: {
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  searchAddButton: {
    padding: 5,
  },
  tooltipContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  tooltip: {
    backgroundColor: '#F2F2F2',
    borderRadius: 15,
    padding: 15,
    width: '100%',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  tooltipText: {
    fontSize: 14,
    color: '#000',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F2F2F2',
    transform: [{ rotate: '180deg' }]
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionHeader: {
    backgroundColor: '#F8F8F8',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  selectedEventItem: {
    backgroundColor: '#F2F2F2',
  },
  eventIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventEmoji: {
    fontSize: 24,
  },
  eventName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedIndicator: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#999',
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    backgroundColor: 'white',
    gap: 10,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#999999',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    gap: 8,
  },
  activeNextButton: {
    backgroundColor: '#333333',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  }
});

export default CreateEventModal;