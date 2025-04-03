import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  PanResponder, // Garder si l'effet de swipe est souhaité
  Dimensions,
  StatusBar,
  ScrollView,
  FlatList
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Garder si l'effet est souhaité pour le fond
import { toast } from 'sonner-native';
import _ from 'lodash';
import { Event } from '../api/events'; // Importer le type Event
import { RootStackParamList } from '../types/navigation'; // Importer RootStackParamList

// Types d'événements importés de l'app
type EventType = 'collectif' | 'individuel' | 'special';

// Interface pour les suggestions créatives (titres d'événements personnalisés)
interface TitleSuggestion {
  id: string;
  name: string;
  icon: string;
  category: string;
  eventType: EventType | 'all'; // Pour filtrer si c'est pour collectif ou individuel
}

// Type pour les paramètres de la route
type EventTitleRouteProp = RouteProp<RootStackParamList, 'EventTitleModal'>;

// Type pour la navigation
type EventTitleNavigationProp = StackNavigationProp<RootStackParamList>;


// Dimensions de l'écran
const { width, height } = Dimensions.get('window');

// Suggestions créatives par catégorie (adaptées pour Amazon)
const CREATIVE_SUGGESTIONS: Record<string, TitleSuggestion[]> = {
  "Célébrations": [
    { id: 'coloc-appreciation', name: 'Appréciation Coloc', icon: '🏠', category: 'Célébrations', eventType: 'collectif' },
    { id: 'grad-celebration', name: 'Célébration Diplôme', icon: '🎓', category: 'Célébrations', eventType: 'individuel' },
    { id: 'new-job', name: 'Nouveau Job', icon: '💼', category: 'Célébrations', eventType: 'individuel' },
    { id: 'soutenance-reussie', name: 'Soutenance Réussie', icon: '📊', category: 'Célébrations', eventType: 'individuel' },
    { id: 'team-recognition', name: 'Reconnaissance Équipe', icon: '🏆', category: 'Célébrations', eventType: 'collectif' },
    { id: 'anniv-entreprise', name: 'Anniversaire Entreprise', icon: '🏢', category: 'Célébrations', eventType: 'collectif' }
  ],
  "Passions & Hobbies": [
    { id: 'passion-gaming', name: 'Passion Gaming', icon: '🎮', category: 'Passions & Hobbies', eventType: 'individuel' },
    { id: 'club-lecture', name: 'Club de Lecture', icon: '📚', category: 'Passions & Hobbies', eventType: 'collectif' },
    { id: 'atelier-cuisine', name: 'Atelier Cuisine', icon: '👨‍🍳', category: 'Passions & Hobbies', eventType: 'collectif' },
    { id: 'passion-photo', name: 'Passion Photographie', icon: '📷', category: 'Passions & Hobbies', eventType: 'individuel' },
    { id: 'tech-enthusiast', name: 'Tech Enthusiast', icon: '🖥️', category: 'Passions & Hobbies', eventType: 'individuel' },
    { id: 'equipement-sportif', name: 'Équipement Sportif', icon: '🏋️', category: 'Passions & Hobbies', eventType: 'all' }
  ],
  "Intérieur & Déco": [
    { id: 'home-makeover', name: 'Home Makeover', icon: '🏡', category: 'Intérieur & Déco', eventType: 'individuel' },
    { id: 'cuisine-equipee', name: 'Cuisine Équipée', icon: '🍳', category: 'Intérieur & Déco', eventType: 'individuel' },
    { id: 'bureau-parfait', name: 'Bureau Parfait', icon: '💻', category: 'Intérieur & Déco', eventType: 'individuel' },
    { id: 'deco-salon', name: 'Déco Salon', icon: '🛋️', category: 'Intérieur & Déco', eventType: 'individuel' },
    { id: 'jardin-terrasse', name: 'Jardin & Terrasse', icon: '🌿', category: 'Intérieur & Déco', eventType: 'individuel' },
    { id: 'espace-detente', name: 'Espace Détente', icon: '🧘', category: 'Intérieur & Déco', eventType: 'collectif' }
  ],
  "Événements Spéciaux": [
    { id: 'depart-voyage', name: 'Départ en Voyage', icon: '✈️', category: 'Événements Spéciaux', eventType: 'individuel' },
    { id: 'nouveau-projet', name: 'Nouveau Projet', icon: '🚀', category: 'Événements Spéciaux', eventType: 'collectif' },
    { id: 'nouvelle-maison', name: 'Nouvelle Maison', icon: '🏡', category: 'Événements Spéciaux', eventType: 'individuel' },
    { id: 'rentree-scolaire', name: 'Rentrée Scolaire', icon: '🎒', category: 'Événements Spéciaux', eventType: 'individuel' },
    { id: 'adoption-animal', name: 'Adoption Animal', icon: '🐾', category: 'Événements Spéciaux', eventType: 'individuel' },
    { id: 'equipement-bureau', name: 'Équipement Bureau', icon: '🖨️', category: 'Événements Spéciaux', eventType: 'collectif' }
  ],
  "Surprises Thématiques": [
    { id: 'tech-gadgets', name: 'Tech & Gadgets', icon: '📱', category: 'Surprises Thématiques', eventType: 'all' },
    { id: 'cuisine-gourmet', name: 'Cuisine Gourmet', icon: '🍽️', category: 'Surprises Thématiques', eventType: 'all' },
    { id: 'fitness-sport', name: 'Fitness & Sport', icon: '🏃', category: 'Surprises Thématiques', eventType: 'all' },
    { id: 'bien-etre-detente', name: 'Bien-être & Détente', icon: '💆', category: 'Surprises Thématiques', eventType: 'all' },
    { id: 'collection-passion', name: 'Collection Passion', icon: '🎨', category: 'Surprises Thématiques', eventType: 'individuel' },
    { id: 'espace-travail', name: 'Espace de Travail', icon: '🖥️', category: 'Surprises Thématiques', eventType: 'all' }
  ]
};

// Liste des catégories pour l'affichage
const CATEGORIES = Object.keys(CREATIVE_SUGGESTIONS);

// Liste complète des suggestions pour recherche (à filtrer par type d'événement)
const ALL_SUGGESTIONS = Object.values(CREATIVE_SUGGESTIONS).flat();

// Idées créatives pour les placeholders (adaptées pour Amazon)
const CREATIVE_PLACEHOLDERS = [
  "Renouvellement Setup Gaming", "Collection Livres Fantasy", "Équipement Cuisine Pro",
  "Essentiels Tech Étudiant", "Déco Bureau Ergonomique", "Collection Vinyles",
  "Équipement Randonnée", "Accessoires Photo Pro", "Essentiels Jardinage",
  "Setup Streaming", "Outils Bricolage", "Bibliothèque Enfant",
  "Équipement Fitness", "Pack Déménagement", "Gadgets Domotique"
];

const EventTitleModal = () => {
  const navigation = useNavigation<EventTitleNavigationProp>();
  const route = useRoute<EventTitleRouteProp>();

  // Récupérer les données de l'événement des paramètres de la route
  const eventDataFromParams = route.params?.eventData || {};
  const eventType = (eventDataFromParams as any)['type'] || 'collectif'; // Utiliser le type passé ou défaut
  const initialTitle = (eventDataFromParams as any)['title'] || '';

  // États
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TitleSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [activeSuggestionPanel, setActiveSuggestionPanel] = useState(true);
  const [randomPlaceholder, setRandomPlaceholder] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [isLoading, setIsLoading] = useState(false); // Garder si besoin pour une future validation API

  const maxLength = 50; // Définir maxLength ici

  // Refs
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);

  // Animations
  const noticeAnimation = useRef(new Animated.Value(0)).current;
  const suggestionScaleMap = useRef<Record<string, Animated.Value>>({}).current;

  // Filtrer les suggestions par type d'événement
  const getFilteredSuggestionsByEventType = useCallback(() => {
    return ALL_SUGGESTIONS.filter(suggestion =>
      suggestion.eventType === eventType || suggestion.eventType === 'all'
    );
  }, [eventType]);

  // Filtrer les catégories qui ont des suggestions pour ce type d'événement
  const getFilteredCategories = useCallback(() => {
    const filteredSuggestions = getFilteredSuggestionsByEventType();
    const categoriesWithSuggestions = new Set(filteredSuggestions.map(s => s.category));
    return CATEGORIES.filter(category => categoriesWithSuggestions.has(category));
  }, [getFilteredSuggestionsByEventType]);

  // Initialiser les valeurs d'animation pour chaque suggestion
  useEffect(() => {
    ALL_SUGGESTIONS.forEach(suggestion => {
      if (!suggestionScaleMap[suggestion.id]) {
        suggestionScaleMap[suggestion.id] = new Animated.Value(1);
      }
    });
  }, [suggestionScaleMap]);

   // Choisir un placeholder aléatoire et focus
   useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CREATIVE_PLACEHOLDERS.length);
    setRandomPlaceholder(CREATIVE_PLACEHOLDERS[randomIndex]);
    setTimeout(() => titleInputRef.current?.focus(), 100);

    const initialSuggestions = getFilteredSuggestionsByEventType();
    setFilteredSuggestions(initialSuggestions);
    const filteredCategories = getFilteredCategories();
    if (filteredCategories.length > 0) {
      setActiveCategory(filteredCategories[0]);
    }
  }, [getFilteredSuggestionsByEventType, getFilteredCategories]);

  // Gestion du clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Suivi des modifications
  useEffect(() => {
    setHasUnsavedChanges(title.trim() !== initialTitle.trim());
  }, [title, initialTitle]);

  // Filtrer les suggestions selon la saisie
  useEffect(() => {
    const eventTypeSuggestions = getFilteredSuggestionsByEventType();
    if (!title.trim()) {
      setFilteredSuggestions(eventTypeSuggestions);
      setSearchMode(false);
      return;
    }
    setSearchMode(true);
    const normalizedInput = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = eventTypeSuggestions.filter(suggestion =>
      suggestion.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedInput)
    );
    setFilteredSuggestions(filtered);
    const exactMatch = filtered.find(s => s.name.toLowerCase() === title.toLowerCase());
    if (exactMatch) {
      setSelectedSuggestion(exactMatch.id);
      if (suggestionScaleMap[exactMatch.id]) {
        Animated.sequence([
          Animated.timing(suggestionScaleMap[exactMatch.id], { toValue: 1.1, duration: 150, useNativeDriver: true }),
          Animated.spring(suggestionScaleMap[exactMatch.id], { toValue: 1, friction: 4, useNativeDriver: true })
        ]).start();
      }
    } else {
      setSelectedSuggestion(null);
    }
  }, [title, suggestionScaleMap, getFilteredSuggestionsByEventType]);

  // Animation de notice
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(noticeAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(noticeAnimation, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    }
  }, [error, noticeAnimation]);

  // Validation du titre
  const validateTitle = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setError('Veuillez saisir un titre pour votre événement');
      return false;
    }
    if (value.trim().length < 3) {
      setError('Le titre doit contenir au moins 3 caractères');
      return false;
    }
    setError(null);
    return true;
  }, []);

  // Gestion du changement de texte
  const handleTextChange = useCallback((value: string) => {
    setTitle(value);
    if (error) validateTitle(value);
  }, [error, validateTitle]);

  // Sélection d'une suggestion
  const handleSuggestionSelect = useCallback((suggestion: TitleSuggestion) => {
    if (suggestionScaleMap[suggestion.id]) {
      Animated.sequence([
        Animated.timing(suggestionScaleMap[suggestion.id], { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.spring(suggestionScaleMap[suggestion.id], { toValue: 1, friction: 4, useNativeDriver: true })
      ]).start();
    }
    setTitle(suggestion.name);
    setSelectedSuggestion(suggestion.id);
    validateTitle(suggestion.name);
    Keyboard.dismiss();
  }, [suggestionScaleMap, validateTitle]);

  // Continuer vers l'étape suivante
  const handleContinue = useCallback(() => {
    Keyboard.dismiss();
    if (validateTitle(title)) {
      const updatedEventData = {
        ...eventDataFromParams,
        title: title.trim(),
      };
      // Naviguer vers EventDateModal en passant les données mises à jour
      navigation.navigate('EventDateModal', { eventData: updatedEventData });
    }
  }, [title, validateTitle, eventDataFromParams, navigation]);

  // Fermeture de l'écran (retour à EventsScreen)
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    navigation.popToTop(); // Revenir au début de la pile (EventsScreen)
  }, [navigation]);

  // Retour à l'écran précédent
  const handleBack = useCallback(() => {
    Keyboard.dismiss();
    // Ici, on revient simplement à l'écran précédent dans la pile de création
    // (qui pourrait être CreateEventModal ou un autre écran si le flux change)
    navigation.goBack();
  }, [navigation]);

  // Afficher l'aide
  const showHelp = useCallback(() => {
    Keyboard.dismiss();
    setActiveSuggestionPanel(false);
    Animated.timing(noticeAnimation, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    const helpMessage = eventType === 'individuel'
      ? 'Choisissez un titre personnalisé pour cet événement où les invités offrent des cadeaux à l\'hôte'
      : 'Choisissez un titre personnalisé pour cet événement collectif';
    setError(helpMessage);
    setTimeout(() => {
      Animated.timing(noticeAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setError(null);
        setActiveSuggestionPanel(true);
      });
    }, 2500);
  }, [noticeAnimation, eventType]);

  // Obtenir les suggestions pour la catégorie active
  const getSuggestionsForActiveCategory = useCallback(() => {
    return CREATIVE_SUGGESTIONS[activeCategory]?.filter(suggestion =>
      suggestion.eventType === eventType || suggestion.eventType === 'all'
    ) || [];
  }, [activeCategory, eventType]);

  // Rendre chaque suggestion
  const renderSuggestion = useCallback(({ item }: { item: TitleSuggestion }) => {
    const isSelected = selectedSuggestion === item.id;
    const scale = suggestionScaleMap[item.id] || new Animated.Value(1);

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[ styles.suggestionItem, isSelected && styles.selectedSuggestion ]}
          onPress={() => handleSuggestionSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.suggestionIcon}>{item.icon}</Text>
          <Text style={[ styles.suggestionText, isSelected && styles.selectedSuggestionText ]}>
            {item.name}
          </Text>
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [selectedSuggestion, suggestionScaleMap, handleSuggestionSelect]);

  // Changer de catégorie
  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    const filteredCategories = getFilteredCategories();
    setTimeout(() => {
      categoryScrollRef.current?.scrollTo({
        x: filteredCategories.indexOf(category) * 100, // Ajuster la valeur si nécessaire
        animated: true
      });
    }, 100);
  }, [getFilteredCategories]);

  // Obtenir les catégories filtrées
  const filteredCategories = getFilteredCategories();
  const suggestionsForActiveCategory = getSuggestionsForActiveCategory();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose} // Utiliser handleClose (popToTop)
            style={styles.closeButton}
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Titre de l'événement</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={showHelp}
            accessibilityLabel="Aide"
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Animation d'alerte/notification */}
        <Animated.View
          style={[
            styles.noticeContainer,
            {
              opacity: noticeAnimation,
              transform: [{ translateY: noticeAnimation.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
            }
          ]}
        >
          <View style={styles.noticeContent}>
            <Ionicons
              name={error ? "alert-circle" : "information-circle"}
              size={20}
              color={error ? "#FF3B30" : "#007AFF"}
            />
            <Text style={[ styles.noticeText, error ? styles.errorText : styles.infoText ]}>
              {error || `Donnez un titre original à votre événement ${eventType === 'individuel' ? 'individuel' : 'collectif'}`}
            </Text>
          </View>
        </Animated.View>

        {/* Champ de saisie */}
        <View style={styles.inputSection}>
          <View style={[
            styles.inputContainer,
            error ? styles.inputError : (title.length > 0 ? styles.inputSuccess : null)
          ]}>
            <View style={styles.iconContainer}>
              <Ionicons name="create-outline" size={20} color="#999" />
            </View>
            <TextInput
              ref={titleInputRef}
              style={styles.input}
              placeholder={`Par exemple : ${randomPlaceholder}...`}
              placeholderTextColor="#999"
              value={title}
              onChangeText={handleTextChange}
              maxLength={maxLength}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              selectionColor="#007AFF"
              autoCapitalize="sentences"
              accessibilityLabel="Champ de saisie du titre"
            />
            {title.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setTitle('')}
                accessibilityLabel="Effacer"
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.counterContainer}>
            <Text style={[
              styles.counter,
              title.length >= maxLength * 0.9 ? (title.length >= maxLength ? styles.counterDanger : styles.counterWarning) : null
            ]}>
              {title.length}/{maxLength}
            </Text>
          </View>
        </View>

        {/* Section d'inspiration */}
        <View style={styles.inspirationContainer}>
          <Text style={styles.inspirationTitle}>Besoin d'inspiration ?</Text>
          <Text style={styles.inspirationText}>
            {eventType === 'individuel'
              ? 'Idées pour événements où les invités offrent des cadeaux à l\'hôte'
              : 'Idées pour événements collectifs avec cadeaux'}
          </Text>
        </View>

        {/* Section des suggestions */}
        {activeSuggestionPanel && (
          <View style={styles.suggestionsSection}>
            {!searchMode ? (
              <>
                {/* Navigation par catégories */}
                <View style={styles.categoriesContainer}>
                  <ScrollView
                    ref={categoryScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContent}
                  >
                    {filteredCategories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[ styles.categoryButton, activeCategory === category && styles.activeCategoryButton ]}
                        onPress={() => handleCategoryChange(category)}
                      >
                        <Text style={[ styles.categoryText, activeCategory === category && styles.activeCategoryText ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                {/* Affichage de la catégorie active */}
                <Text style={styles.sectionTitle}>{activeCategory}</Text>
                <FlatList
                  data={suggestionsForActiveCategory}
                  renderItem={renderSuggestion}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsContainer}
                  ListEmptyComponent={
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>Aucune suggestion disponible</Text>
                    </View>
                  }
                />
              </>
            ) : (
              <>
                {/* Mode recherche */}
                <Text style={styles.sectionTitle}>
                  {filteredSuggestions.length > 0 ? "Suggestions correspondantes" : "Aucune suggestion correspondante"}
                </Text>
                {filteredSuggestions.length > 0 ? (
                  <FlatList
                    data={filteredSuggestions}
                    renderItem={renderSuggestion}
                    keyExtractor={(item) => `search-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsContainer}
                  />
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>Continuez à saisir votre titre personnalisé</Text>
                    <Text style={styles.noResultsSubtext}>Soyez créatif ! Votre événement est unique.</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Boutons de navigation */}
        <View style={[ styles.buttonsContainer, keyboardVisible && styles.keyboardOpenButtons ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Retour"
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ styles.nextButton, (!title.trim() || isLoading || !!error) ? styles.disabledButton : styles.activeButton ]}
            onPress={handleContinue}
            disabled={!title.trim() || isLoading || !!error}
            accessibilityLabel="Suivant"
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingIndicator} />
              </View>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Suivant</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  noticeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  noticeText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#FF3B30',
  },
  infoText: {
    color: '#007AFF',
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 60,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  inputSuccess: {
    borderColor: '#34C759',
    backgroundColor: '#F9FFF9',
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    color: '#000',
    height: '100%',
  },
  clearButton: {
    padding: 8,
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
    paddingRight: 8,
  },
  counter: {
    fontSize: 12,
    color: '#999',
  },
  counterWarning: {
    color: '#FF9500',
  },
  counterDanger: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  inspirationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  inspirationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  inspirationText: {
    fontSize: 14,
    color: '#666',
  },
  suggestionsSection: {
    flex: 1,
    paddingTop: 5,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 5,
    marginTop: 5,
  },
  categoriesContent: {
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
  },
  suggestionsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  suggestionItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    width: 120,
    height: 110,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedSuggestion: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  suggestionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  selectedSuggestionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: 'white',
  },
  keyboardOpenButtons: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
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
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    minWidth: 140,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  loadingContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
});

export default EventTitleModal;