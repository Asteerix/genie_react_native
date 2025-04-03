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
  SectionList, // Utiliser SectionList
  SectionListData,
  DefaultSectionT,
  Animated,
  Easing,
  Dimensions,
  BackHandler,
  Keyboard,
  PanResponder,
  ActivityIndicator // Ajouter ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import _ from 'lodash';
import { useEvents } from '../context/EventContext';
import { parse, isPast, addYears, differenceInDays, setYear, isValid as isDateValid } from 'date-fns'; // Importer les fonctions date-fns nécessaires et isValid
import { fr } from 'date-fns/locale'; // Importer la locale fr

// Obtenir les dimensions de l'écran
const { width, height } = Dimensions.get('window');

// Définition des types d'événements
type EventType = 'collectif' | 'individuel' | 'special';

export interface EventDefinition {
  id: string;
  name: string;
  type: EventType;
  icon: string;
  emojis: string[];
  defaultDate?: string; // Format attendu: "JJ Mois" (ex: "25 Décembre")
  invitations: string;
  info?: string;
  dateFormat?: 'fixed' | 'personal';
  selected?: boolean;
  // Ajout pour le tri
  nextOccurrence?: Date | null;
}

// ID constant pour le toast de sélection (pour éviter les empilements)
const SELECTION_TOAST_ID = 'event-selection-toast';

// Liste complète des événements correspondant exactement au tableau
const PREDEFINED_EVENTS: EventDefinition[] = [
  { id: 'noel', name: 'Noël', type: 'collectif', icon: '🎄', emojis: ['🎄', '🎅', '☃️', '❄️'], defaultDate: '25 Décembre', invitations: 'Tous le monde', selected: true },
  { id: 'saint-valentin', name: 'Saint Valentin', type: 'collectif', icon: '❤️', emojis: ['🌹', '💝', '❤️', '🏹'], defaultDate: '14 Février', invitations: 'Qu\'1 personne de +15 ans' },
  { id: 'nouvel-an-lunaire', name: 'Nouvel an lunaire', type: 'collectif', icon: '🧧', emojis: ['🧧', '🌙', '🎊', '🌛'], defaultDate: '29 Janvier', invitations: 'Tous le monde' }, // Note: Date variable, exemple fixe ici
  { id: 'nouvel-an', name: 'Nouvel an', type: 'collectif', icon: '🎆', emojis: ['🎆', '🍾', '⚡', '🎇'], defaultDate: '1 Janvier', invitations: 'Tous le monde' },
  { id: 'kwanzaa', name: 'Kwanzaa', type: 'collectif', icon: '🕯️', emojis: ['🕯️', '🎁', '🥣', '🎵'], defaultDate: '26 Décembre', invitations: 'Tous le monde' },
  { id: 'raksha-bandhan', name: 'Raksha Bandhan', type: 'collectif', icon: '🪢', emojis: ['🪢', '🌸', '🥣', '🍲'], defaultDate: '19 Août', invitations: 'Tous le monde' },
  { id: 'vesak', name: 'Vesak', type: 'collectif', icon: '🪷', emojis: ['🪷', '⛩️', '🍵', '🏮'], defaultDate: '15 Mai', invitations: 'Tous le monde' },
  { id: 'pesach', name: 'Pesach', type: 'collectif', icon: '🍷', emojis: ['🍷', '🔥', '✡️', '🕯️'], defaultDate: '15 Avril', invitations: 'Tous le monde' }, // Note: Date variable
  { id: 'hanoukka', name: 'Hanoukka', type: 'collectif', icon: '🕎', emojis: ['🕎', '🕯️', '🥣', '✡️'], defaultDate: '25 Décembre', invitations: 'Tous le monde' }, // Note: Date variable
  { id: 'diwali', name: 'Diwali', type: 'collectif', icon: '🪔', emojis: ['🪔', '🧨', '🎆', '✨'], defaultDate: '31 Octobre', invitations: 'Tous le monde' }, // Note: Date variable
  { id: 'eid-al-adha', name: 'Eid al-Adha', type: 'collectif', icon: '🐑', emojis: ['🐑', '☪️', '🥘', '🕌'], defaultDate: '5 Juin', invitations: 'Tous le monde' }, // Note: Date variable
  { id: 'eid-al-fitr', name: 'Eid al-Fitr', type: 'collectif', icon: '🌙', emojis: ['🌙', '☪️', '🥘', '🕌'], defaultDate: '25 Mars', invitations: 'Tous le monde' }, // Note: Date variable
  { id: 'carnaval', name: 'Carnaval', type: 'collectif', icon: '🎭', emojis: ['🎭', '🎺', '🎊', '🥁'], defaultDate: '27 Février', invitations: 'Tous le monde' }, // Note: Date variable
  { id: 'mi-automne', name: 'Mi-automne', type: 'collectif', icon: '🥮', emojis: ['🥮', '🌙', '🎊', '🧧'], defaultDate: '17 Septembre', invitations: 'Tous le monde' }, // Note: Date variable
  { id: 'saint-jean', name: 'Saint-Jean', type: 'collectif', icon: '🔥', emojis: ['🔥', '🎆', '🎇', '🪄'], defaultDate: '24 Juin', invitations: 'Tous le monde' },
  { id: 'anniversaire', name: 'Anniversaire', type: 'individuel', icon: '🎂', emojis: ['🎂', '🎉', '🍰', '🥳'], invitations: 'Tous le monde', info: 'C\'est l\'anniversaire de...', dateFormat: 'personal' },
  { id: 'anniversaire-surprise', name: 'Anniversaire surprise', type: 'individuel', icon: '🤫', emojis: ['🤫', '🎂', '🎉', '🎁'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'fiancailles', name: 'Fiançailles', type: 'individuel', icon: '💍', emojis: ['💍', '🔨', '💝', '🥂'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'mariage', name: 'Mariage', type: 'individuel', icon: '💍', emojis: ['💍', '👰', '💒', '🤵'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'pacs', name: 'PACS', type: 'individuel', icon: '🤝', emojis: ['🤝', '❤️', '🥂', '📜'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'bapteme', name: 'Baptême', type: 'individuel', icon: '👶', emojis: ['👶', '🎁', '🕊️', '🙏'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'communion', name: 'Communion', type: 'individuel', icon: '🙏', emojis: ['🙏', '✝️', '🎀', '📖'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'confirmation', name: 'Confirmation', type: 'individuel', icon: '✝️', emojis: ['✝️', '🙏', '🎀', '📖'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'naissance', name: 'Naissance', type: 'individuel', icon: '👶', emojis: ['👶', '🍼', '🧸', '👼'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'baby-shower', name: 'Baby Shower', type: 'individuel', icon: '🧸', emojis: ['🧸', '👶', '🎀', '🍼'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'gender-reveal', name: 'Gender Reveal', type: 'individuel', icon: '👶', emojis: ['👶', '🍼', '💙', '💕'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'fete-des-peres', name: 'Fête des pères', type: 'individuel', icon: '👨', emojis: ['👨', '👴', '🎁', '❤️'], defaultDate: '16 Juin', invitations: 'Tous le monde' },
  { id: 'fete-des-meres', name: 'Fête des mères', type: 'individuel', icon: '👩', emojis: ['👩', '🌸', '🎁', '❤️'], defaultDate: '25 Mai', invitations: 'Tous le monde' }, // Note: Date variable en France
  { id: 'retraite', name: 'Retraite', type: 'individuel', icon: '🏖️', emojis: ['🏖️', '🧓', '🎉', '🚶'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'pot-de-depart', name: 'Pot de départ', type: 'individuel', icon: '🥂', emojis: ['🥂', '🍾', '⚡', '🚶'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'a-la-maison', name: 'À la maison', type: 'individuel', icon: '🏡', emojis: ['🏡', '🍕', '🎮', '🌱'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'remise-diplomes', name: 'Remise diplômes', type: 'individuel', icon: '🎓', emojis: ['🎓', '📜', '🎊', '🎉'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'cremaillere', name: 'Crémaillère', type: 'individuel', icon: '🏠', emojis: ['🏠', '🔨', '🎁', '🥂'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'quinceanera', name: 'Quinceañera', type: 'individuel', icon: '👑', emojis: ['👑', '💃', '🎀', '🎊'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'bar-bat-mitzvah', name: 'Bar/Bat Mitzvah', type: 'individuel', icon: '✡️', emojis: ['✡️', '🕯️', '📖', '🎁'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'secret-santa', name: 'Secret Santa', type: 'special', icon: '🎅', emojis: ['🎅', '🎁', '🎄', '🎀'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'custom-collectif', name: 'Custom', type: 'collectif', icon: '🎮', emojis: ['🎮', '🎨', '🎯', '🪄'], invitations: 'Tous le monde', dateFormat: 'personal' },
  { id: 'custom-individuel', name: 'Custom', type: 'individuel', icon: '🎮', emojis: ['🎮', '🎨', '🎯', '🪄'], invitations: 'Tous le monde', dateFormat: 'personal' }
];

// Liste d'IDs pour les suggestions par défaut
const defaultSuggestionIds = ['anniversaire', 'noel', 'mariage', 'naissance', 'cremaillere', 'fete-des-meres', 'fete-des-peres', 'saint-valentin', 'nouvel-an'];

// --- Fonctions utilitaires pour les dates ---
/**
 * Parse une chaîne de date comme "JJ Mois" (ex: "25 Décembre") en objet Date pour l'année donnée.
 * Gère les formats "d MMMM" et "d MMM".
 */
const parseDateString = (dateStr: string, year: number): Date | null => {
  try {
    // Essayer "d MMMM" (ex: "25 Décembre")
    let parsedDate = parse(`${dateStr} ${year}`, 'd MMMM yyyy', new Date(), { locale: fr });
    if (isDateValid(parsedDate)) return parsedDate;

    // Essayer "d MMM" (ex: "1 Jan")
    parsedDate = parse(`${dateStr} ${year}`, 'd MMM yyyy', new Date(), { locale: fr });
    if (isDateValid(parsedDate)) return parsedDate;

    console.warn(`Impossible de parser la date: ${dateStr} pour l'année ${year}`);
    return null;
  } catch (error) {
    console.error(`Erreur lors du parsing de la date "${dateStr}":`, error);
    return null;
  }
};

/**
 * Calcule la prochaine occurrence d'une date fixe (JJ Mois).
 * Retourne null si la date ne peut être parsée ou n'a pas de defaultDate.
 */
const getNextOccurrence = (event: EventDefinition): Date | null => {
  if (!event.defaultDate) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  const dateThisYear = parseDateString(event.defaultDate, currentYear);

  if (dateThisYear) {
    // Si la date de cette année est déjà passée (strictement avant aujourd'hui),
    // prendre celle de l'année prochaine.
    if (isPast(dateThisYear) && !isDateValid(parse(`${event.defaultDate} ${currentYear}`, 'd MMMM yyyy', now, { locale: fr }))) {
       // Correction: Vérifier si la date est passée ET si ce n'est pas aujourd'hui
       // Si la date parsée est invalide ou si elle est strictement passée
       const dateNextYear = addYears(dateThisYear, 1);
       // Re-parser pour s'assurer que l'année suivante est valide (ex: année bissextile)
       const validatedDateNextYear = parseDateString(event.defaultDate, currentYear + 1);
       return validatedDateNextYear;
    }
     // Si la date est aujourd'hui ou future, c'est la bonne date pour cette année
    return dateThisYear;
  }

  return null; // Retourne null si la date ne peut pas être parsée
};
// --- Fin des fonctions utilitaires ---


interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventSelect?: (event: EventDefinition) => void;
}

// Composant séparé pour les éléments d'événement
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
    } else {
      // Assurer que l'échelle revient à 1 si désélectionné
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      }).start();
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
  const [sections, setSections] = useState<SectionListData<EventDefinition, DefaultSectionT>[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // État de chargement initial

  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const listRef = useRef<SectionList>(null);

  // Animation pour le swipe de fermeture
  const panY = useRef(new Animated.Value(0)).current;

  // PanResponder pour gérer le swipe down pour fermer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          closeWithAnimation();
        } else {
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

  // Préparer les données des sections initiales avec tri par date
  const prepareInitialSections = useCallback(() => {
    setIsLoading(true);
    const now = new Date();
    // Créer une map pour un accès rapide aux événements
    const eventMap = new Map(PREDEFINED_EVENTS.map(event => [event.id, event]));

    // Obtenir les événements suggérés par défaut et calculer leur prochaine occurrence
    const suggestedEventsWithDate = defaultSuggestionIds
      .map(id => eventMap.get(id))
      .filter((event): event is EventDefinition => !!event)
      .map(event => ({
        ...event,
        nextOccurrence: getNextOccurrence(event) // Utiliser la fonction corrigée
      }));

    // Trier les événements suggérés
    suggestedEventsWithDate.sort((a, b) => {
      // Ceux sans date ou date invalide vont à la fin
      if (!a.nextOccurrence) return 1;
      if (!b.nextOccurrence) return -1;
      // Trier par date la plus proche (différence absolue en jours)
      const diffA = Math.abs(differenceInDays(a.nextOccurrence, now));
      const diffB = Math.abs(differenceInDays(b.nextOccurrence, now));
      return diffA - diffB;
    });

    // Obtenir les autres événements (non suggérés)
    const otherEventIds = new Set(defaultSuggestionIds);
    const otherEvents = PREDEFINED_EVENTS.filter(event => !otherEventIds.has(event.id));

    // Grouper les autres événements par type
    const otherGrouped = {
      collectif: otherEvents.filter(event => event.type === 'collectif'),
      individuel: otherEvents.filter(event => event.type === 'individuel'),
      special: otherEvents.filter(event => event.type === 'special')
    };

    // Construire les sections
    const initialSections: SectionListData<EventDefinition, DefaultSectionT>[] = [];

    if (suggestedEventsWithDate.length > 0) {
      initialSections.push({ title: 'Suggestions', data: suggestedEventsWithDate });
    }

    if (otherGrouped.collectif.length > 0) {
      initialSections.push({ title: 'Événements collectifs', data: otherGrouped.collectif });
    }
    if (otherGrouped.individuel.length > 0) {
      initialSections.push({ title: 'Événements individuels', data: otherGrouped.individuel });
    }
    if (otherGrouped.special.length > 0) {
      initialSections.push({ title: 'Événements spéciaux', data: otherGrouped.special });
    }

    // Appliquer la sélection actuelle (si elle existe)
     const sectionsWithSelection = initialSections.map(section => ({
        ...section,
        data: section.data.map(event => ({
          ...event,
          selected: event.id === currentSelection
        }))
      }));

    setSections(sectionsWithSelection);
    setIsLoading(false);
  }, [currentSelection]); // Dépend de currentSelection pour réappliquer la sélection

  // Charger les sections initiales quand le modal devient visible
  useEffect(() => {
    if (visible) {
      prepareInitialSections();
    }
  }, [visible, prepareInitialSections]);


  // Animation d'entrée et de sortie du modal
  useEffect(() => {
    if (visible) {
      // Initialiser l'état
      setSearchQuery('');
      setShowTooltip(false);
      panY.setValue(0);
      // Ne pas réinitialiser currentSelection ici pour le garder entre ouvertures/fermetures

      // Démarrer l'animation d'entrée
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)),
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
    Keyboard.dismiss();
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 280,
      easing: Easing.in(Easing.bezier(0.33, 0, 0.67, 1)),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [slideAnimation, onClose]);

  // Filtrer les événements selon la recherche (adapte pour SectionList)
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Si recherche vide, réafficher toutes les sections initiales
      prepareInitialSections(); // Utiliser la fonction pour préparer les sections
      setShowTooltip(false);
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }

    // Normaliser la recherche
    const normalized = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Filtrer tous les événements
    const filtered = PREDEFINED_EVENTS.filter(event =>
      event.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalized)
    ).map(event => ({ // Appliquer la sélection actuelle aux résultats filtrés
        ...event,
        selected: event.id === currentSelection
    }));

    // Afficher les résultats filtrés dans une seule section
    setSections([{ title: 'Résultats de recherche', data: filtered }]);

    // Gérer le tooltip
    if (filtered.length === 0) {
      setTimeout(() => {
        setShowTooltip(true);
        Animated.timing(tooltipOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }, 300);
    } else {
      setShowTooltip(false);
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [searchQuery, tooltipOpacity, currentSelection, prepareInitialSections]); // Ajouter prepareInitialSections


  // Sélectionner un événement avec animation et toast unique
  const handleEventSelect = useCallback((selectedEventId: string) => {
    const isSameSelection = currentSelection === selectedEventId;
    const newSelection = isSameSelection ? null : selectedEventId; // Permettre la désélection
    setCurrentSelection(newSelection); // Mettre à jour la sélection

    // Mettre à jour l'état des sections pour refléter la sélection visuellement
    setSections(prevSections => prevSections.map(section => ({
        ...section,
        data: section.data.map(event => ({
            ...event,
            selected: event.id === newSelection // Utiliser newSelection
        }))
    })));

    const selectedEvent = PREDEFINED_EVENTS.find(event => event.id === newSelection);
    if (selectedEvent) {
      Keyboard.dismiss();
      // Afficher le toast seulement si un nouvel événement est sélectionné (pas à la désélection)
      toast.dismiss(SELECTION_TOAST_ID);
      setTimeout(() => {
        toast.success(`${selectedEvent.name} sélectionné`, {
          id: SELECTION_TOAST_ID,
          duration: 2000,
        });
      }, 50);
    } else if (isSameSelection) {
        // Si on désélectionne, fermer le toast
        toast.dismiss(SELECTION_TOAST_ID);
    }
  }, [currentSelection]); // Retirer searchQuery et sections des dépendances


  // Gérer le bouton Custom
  const handleCustomEvent = useCallback(() => {
    console.log("Redirection vers le choix d'événement personnalisé");
    closeWithAnimation();
    setTimeout(() => {
      navigation.navigate('CustomEventTypeSelection');
    }, 300);
  }, [closeWithAnimation, navigation]);

  // Continuer avec l'événement sélectionné
  const { createNewEvent } = useEvents();

  const handleNext = useCallback(() => {
    // Trouver l'événement sélectionné dans la liste originale
    const selectedEvent = PREDEFINED_EVENTS.find(event => event.id === currentSelection);

    if (selectedEvent) {
      if (onEventSelect) {
        // Retirer la propriété temporaire 'nextOccurrence' avant de passer l'événement
        const { nextOccurrence, ...eventToSend } = selectedEvent;
        onEventSelect(eventToSend);
      }
      closeWithAnimation();
    } else {
      toast.error("Veuillez sélectionner un événement", {
        duration: 2000,
      });
    }
  }, [currentSelection, closeWithAnimation, onEventSelect]);

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

  // Optimized renderItem function
  const renderEventItem = useCallback(({ item }: { item: EventDefinition }) => {
    return (
      <EventItem
        item={item}
        onSelect={handleEventSelect}
        isSelected={item.id === currentSelection} // Utiliser currentSelection pour déterminer l'état
      />
    );
  }, [handleEventSelect, currentSelection]);

  // Fonction de rendu pour l'en-tête de section
  const renderSectionHeader = useCallback(({ section }: { section: SectionListData<EventDefinition, DefaultSectionT> }) => {
    // Ne pas afficher le header pour la section de recherche si elle est vide (sauf si tooltip visible)
    if (searchQuery.trim() && section.title === 'Résultats de recherche' && section.data.length === 0 && !showTooltip) {
        return null;
    }
     // Ne pas afficher le header pour la section de recherche si elle n'est pas vide
    if (searchQuery.trim() && section.title === 'Résultats de recherche' && section.data.length > 0) {
        return null; // On n'affiche pas "Résultats de recherche"
    }
    return <SectionHeader title={section.title} />;
  }, [searchQuery, showTooltip]); // Dépend de searchQuery et showTooltip

  // Make sure each item has a unique key
  const keyExtractor = useCallback((item: EventDefinition, index: number) => {
    // Utiliser l'index en plus de l'id pour garantir l'unicité, surtout si 'Custom' est présent plusieurs fois
    return `${item.id}-${item.type}-${index}`;
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
            <View style={styles.placeholderButton} />
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
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.searchClearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tooltip component */}
          <SearchTooltip
            visible={showTooltip}
            opacity={tooltipOpacity}
            onClose={handleCloseTooltip}
          />

          {/* Liste des événements - SectionList */}
          {isLoading ? (
             <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
             </View>
          ) : (
            <SectionList
              ref={listRef}
              sections={sections}
              renderItem={renderEventItem}
              renderSectionHeader={renderSectionHeader} // Utiliser la fonction mémoïsée
              keyExtractor={keyExtractor} // Utiliser la fonction mémoïsée
              style={styles.eventsList}
              contentContainerStyle={styles.eventsListContent}
              stickySectionHeadersEnabled={false} // Désactiver pour éviter superposition potentielle
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              removeClippedSubviews={Platform.OS === 'android'}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={() => {
                // Condition pour afficher le bouton "Créer Custom" ou le texte "Aucun trouvé"
                if (!isLoading && searchQuery.trim() && sections[0]?.data?.length === 0) {
                  // Afficher le bouton si recherche active et aucun résultat
                  return (
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>Aucun événement trouvé pour "{searchQuery}"</Text>
                      <TouchableOpacity
                        style={styles.createCustomButtonEmpty}
                        onPress={handleCustomEvent}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add-circle-outline" size={22} color="black" />
                        <Text style={styles.createCustomButtonEmptyText}>Créer un événement custom</Text>
                      </TouchableOpacity>
                    </View>
                  );
                } else if (!isLoading && !showTooltip && sections.every(s => s.data.length === 0)) {
                   // Afficher le texte si la liste est vide sans recherche active (et sans tooltip)
                  return (
                    <View style={styles.emptyListContainer}>
                      <Text style={styles.emptyListText}>Aucun événement</Text>
                    </View>
                  );
                }
                // Ne rien afficher si en chargement ou si le tooltip est visible
                return null;
              }}
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
                currentSelection ? styles.activeNextButton : {} // Activer si une sélection existe
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!currentSelection} // Désactiver si aucune sélection
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
  placeholderButton: { // Style pour maintenir l'espacement après suppression
    width: 34, // Largeur approximative du bouton supprimé (padding inclus)
    height: 34, // Hauteur approximative
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
  searchClearButton: { // Style pour le nouveau bouton "effacer"
    padding: 5,
    marginLeft: 5, // Ajouter un peu d'espace
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
    paddingBottom: 80, // Espace pour les boutons en bas
  },
  sectionHeader: {
    backgroundColor: 'white', // Fond blanc pour éviter superposition
    paddingTop: 10, // Espace au-dessus du titre
    paddingBottom: 5, // Espace sous le titre
    // Retirer marginVertical pour coller à la liste
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: 'bold', // Mettre en gras
    color: '#555', // Couleur un peu plus foncée
    textTransform: 'uppercase', // Majuscules pour distinguer
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
    backgroundColor: '#E8E8E8', // Fond plus visible pour la sélection
    borderColor: '#D0D0D0',
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
   loadingContainer: { // Style pour le conteneur du loader
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80, // Pour ne pas être caché par les boutons
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 30,
  },
  emptyListText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20, // Ajouter de l'espace avant le bouton
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
    backgroundColor: '#CCCCCC', // Gris par défaut (désactivé)
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    gap: 8,
  },
  activeNextButton: {
    backgroundColor: '#333333', // Noir quand activé
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Style pour le bouton "Créer Custom" dans la liste vide
  createCustomButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8E8', // Fond légèrement différent
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginTop: 15, // Espace au-dessus du bouton
    gap: 10,
  },
  createCustomButtonEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  }
});

export default CreateEventModal;