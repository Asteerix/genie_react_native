import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  FlatList,
  Animated,
  Easing,
  Keyboard,
  PanResponder,
  BackHandler,
  Image
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useEvents } from '../context/EventContext'; // Importer useEvents
import { Event } from '../api/events';
import { RootStackParamList } from '../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Type pour les paramètres de la route
type EventIllustrationRouteProp = RouteProp<RootStackParamList, 'EventIllustration'>;

// Type pour la navigation
type EventIllustrationNavigationProp = StackNavigationProp<RootStackParamList>;

// Interface pour catégorie d'emojis
interface EmojiCategory {
  id: string;
  name: string;
  emojis: string[];
}

const EventIllustrationModal = () => {
  const navigation = useNavigation<EventIllustrationNavigationProp>();
  const route = useRoute<EventIllustrationRouteProp>();
  const { createNewEvent, saveDraft, deleteDraft } = useEvents(); // Obtenir les fonctions du contexte

  // Récupérer les données de l'événement des paramètres de la route
  // Utiliser 'as any' pour contourner les problèmes de typage avec Partial<Event> des params
  const eventDataFromParams = route.params?.eventData || {};
  const isDraft = route.params?.isDraft; // Récupérer si c'est un brouillon
  const draftId = route.params?.draftId; // Récupérer l'ID du brouillon

  // États
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [currentEmoji, setCurrentEmoji] = useState('🪩');
  const [isEmojiKeyboardOpen, setIsEmojiKeyboardOpen] = useState(false); // État pour le clavier emoji

  // Références
  const colorsScrollRef = useRef<ScrollView>(null);
  const categoryListRef = useRef<FlatList>(null);
  const previewRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const emojiKeyboardHeight = useRef(new Animated.Value(0)).current; // Valeur animée pour la hauteur

  // Données
  const colors = [
    { id: 'green', color: '#E8FFE8' },
    { id: 'purple', color: '#F4E6FF' },
    { id: 'blue', color: '#E6F3FF' },
    { id: 'pink', color: '#FFE6E6' },
    { id: 'yellow', color: '#FFF8E6' },
  ];

  const mainEmojis = [
    { id: 'disco', emoji: '🪩' },
    { id: 'party', emoji: '🎉' },
    { id: 'champagne', emoji: '🍾' },
    { id: 'glasses', emoji: '🥂' },
  ];

  // Effet pour initialiser l'emoji et la couleur
  useEffect(() => {
    const initialEmoji = (eventDataFromParams as { emoji?: string })?.emoji ?? mainEmojis[0].emoji; // Assertion de type
    setCurrentEmoji(initialEmoji);
    const initialEmojiIndex = mainEmojis.findIndex(e => e.emoji === initialEmoji);
    if (initialEmojiIndex !== -1) {
        setSelectedEmojiIndex(initialEmojiIndex);
    }
    const initialColorIndex = colors.findIndex(c => c.color === (eventDataFromParams as { color?: string })?.color); // Assertion de type
     if (initialColorIndex !== -1) {
         setSelectedColorIndex(initialColorIndex);
     }
  }, [eventDataFromParams]);

  // Catégories d'emojis
  const emojiCategories: EmojiCategory[] = [
    { id: 'frequents', name: 'Fréquents', emojis: ['❤️', '👍', '😊', '✨', '🔥', '🙏', '😂', '🥰', '😘', '😍', '🤔', '🎉', '🎂', '🎁', '🥳', '👏', '🙌', '🍾', '🥂', '🤝', '🎊', '🎯', '💯', '💕', '🥹', '💋', '💪', '👌', '🤞', '🫶', '🙂', '😉'] },
    { id: 'smileys', name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢'] },
    { id: 'people', name: 'Personnes', emojis: ['👋', '🤚', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👣', '👀', '👁️', '👅', '👄', '🧠'] },
    { id: 'celebration', name: 'Fête', emojis: ['🎊', '🎉', '🎈', '🪩', '🎂', '🍰', '🧁', '🎁', '🎆', '🎇', '🎏', '🎐', '🎀', '🎎', '🏮', '🪅', '🪩', '🪄', '👑', '🎢', '🎡', '🎠', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '🎯', '🎮', '🎰', '🏆'] },
    { id: 'activities', name: 'Activités', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '⛸️', '🛷', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊'] },
    { id: 'travel', name: 'Voyages', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🚄', '✈️', '🛫', '🛬', '🚀', '⛵', '🚢', '🚂', '🚆', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '🏞️', '🌅', '🌄', '🌇', '🌆', '🏙️'] }
  ];

  // Animation pour le clavier emoji
  useEffect(() => {
    Animated.timing(emojiKeyboardHeight, {
      toValue: isEmojiKeyboardOpen ? 280 : 0, // Hauteur cible
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // Height animation cannot use native driver
    }).start();
  }, [isEmojiKeyboardOpen, emojiKeyboardHeight]);

  // Gestion de l'emoji sélectionné
  const handleEmojiSelected = (emoji: string) => {
    setCurrentEmoji(emoji);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // Changement de catégorie
  const handleCategoryChange = (index: number) => {
    setSelectedCategoryIndex(index);
    categoryListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5
    });
  };

  // Sélection de la couleur
  const handleSelectColor = (index: number) => {
    setSelectedColorIndex(index);
    colorsScrollRef.current?.scrollTo({
      x: index * 70 - SCREEN_WIDTH / 3, // Ajuster le scroll pour centrer
      animated: true,
    });
  };

  // Sélection de l'emoji principal
  const handleSelectEmoji = (index: number) => {
    setSelectedEmojiIndex(index);
    setCurrentEmoji(mainEmojis[index].emoji);
  };

  // Helper pour obtenir les données actuelles de l'événement
  const getCurrentEventData = useCallback((): Partial<Event> => {
      const params = eventDataFromParams as any; // Utiliser 'as any' pour l'accès
      const eventType = ['collectif', 'individuel', 'special'].includes(params['type'] ?? '')
            ? (params['type'] as 'collectif' | 'individuel' | 'special')
            : 'individuel';

      return {
        ...eventDataFromParams,
        type: eventType,
        emoji: currentEmoji, // Ajouter l'emoji actuel
        color: colors[selectedColorIndex].color, // Ajouter la couleur actuelle
        // Les autres champs sont déjà dans eventDataFromParams
      };
  }, [eventDataFromParams, currentEmoji, selectedColorIndex, colors]);


  // Continuer vers l'étape suivante (sélection de l'image de fond)
  const handleContinue = useCallback(async () => {
    // Obtenir les données actuelles (incluant couleur et emoji)
    const currentData = getCurrentEventData();

    console.log("EventIllustrationModal: Saving draft and navigating to EventBackground...", currentData);

    try {
      // Sauvegarder le brouillon avec l'étape actuelle
      const savedDraftId = await saveDraft(currentData, 'EventIllustration', draftId);

      if (savedDraftId) {
        // Naviguer vers l'écran suivant (EventBackground) en passant les données et l'ID du brouillon
        navigation.navigate('EventBackground', { eventData: currentData, draftId: savedDraftId, isDraft: true });
      } else {
        console.error("EventIllustrationModal: Failed to save draft before navigating.");
        toast.error("Erreur lors de la sauvegarde du brouillon.");
      }
    } catch (error) {
      console.error("EventIllustrationModal: Error saving draft or navigating", error);
      toast.error("Erreur lors de la sauvegarde ou de la navigation.");
    }

    // --- La logique de création finale est déplacée plus loin dans le flux ---
    /*
    // Obtenir les données finales en utilisant le helper
    const finalEventData = getCurrentEventData() as Omit<Event, 'id' | 'creatorId' | 'createdAt' | 'updatedAt'>;

    // S'assurer que les champs obligatoires non optionnels sont présents (même si vides)
    finalEventData.title = finalEventData.title || 'Nouvel événement';
    finalEventData.startDate = finalEventData.startDate || new Date().toISOString();
    // ... autres champs ...

    console.log("LOG: Attempting to create event with final data:", JSON.stringify(finalEventData, null, 2));
    try {
      const createdEvent = await createNewEvent(finalEventData);
      if (createdEvent && createdEvent.id) {
        navigation.navigate('EventInviteFriends', { eventId: createdEvent.id });
        if (isDraft && draftId) { await deleteDraft(draftId); }
      } else { // ... gestion erreur ... }
    } catch (error) { // ... gestion erreur ... }
    */
  }, [
      getCurrentEventData,
      saveDraft,
      draftId,
      navigation,
      // createNewEvent, // Retiré des dépendances pour l'instant
      // deleteDraft, // Retiré des dépendances pour l'instant
      // isDraft // Retiré des dépendances pour l'instant
  ]);

  // Utiliser la fonction goBack pour le bouton retour
  // Modifié pour sauvegarder le brouillon avant de revenir
  const handleBack = useCallback(async () => {
      const currentData = getCurrentEventData();
      console.log("EventIllustrationModal: Saving draft on back...", currentData);
      try {
        await saveDraft(currentData, 'EventIllustration', draftId);
      } catch (error) {
        console.error("EventIllustrationModal: Failed to save draft on back", error);
      }
      navigation.goBack();
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  // Utiliser popToTop pour le bouton fermer (X)
  // Modifié pour sauvegarder le brouillon avant de fermer
  const handleClose = useCallback(async () => {
      const currentData = getCurrentEventData();
      console.log("EventIllustrationModal: Saving draft on close...", currentData);
      try {
        await saveDraft(currentData, 'EventIllustration', draftId);
      } catch (error) {
        console.error("EventIllustrationModal: Failed to save draft on close", error);
      }
      navigation.popToTop();
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  // Rendu d'un onglet de catégorie
  const renderCategoryTab = ({ item, index }: { item: EmojiCategory; index: number }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategoryIndex === index && styles.selectedCategoryTab
      ]}
      onPress={() => handleCategoryChange(index)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryTabText,
        selectedCategoryIndex === index && styles.selectedCategoryTabText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
      <SafeAreaView style={styles.safeArea}>
        {/* StatusBar gérée par le navigateur */}
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose} // Utiliser handleClose (popToTop)
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.titleText}>Choisir une illustration</Text>

            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpButtonText}>?</Text>
            </TouchableOpacity>
          </View>

          {/* Content Container */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Preview Area */}
            <View
              ref={previewRef}
              style={styles.previewContainer}
            >
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: colors[selectedColorIndex].color },
                ]}
              >
                <Text style={styles.previewEmoji}>{currentEmoji}</Text>
              </View>
            </View>

            {/* Color Selection */}
            <ScrollView
              ref={colorsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorScrollContent}
              decelerationRate="fast"
            >
              {colors.map((color, index) => (
                <TouchableOpacity
                  key={`color-${index}`}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color.color },
                    selectedColorIndex === index && styles.selectedColorButton,
                  ]}
                  onPress={() => handleSelectColor(index)}
                  activeOpacity={0.7}
                />
              ))}
            </ScrollView>

            {/* Emoji Selection */}
            <View style={styles.emojiContainer}>
              {mainEmojis.map((emoji, index) => (
                <TouchableOpacity
                  key={`main-emoji-${index}`}
                  style={[
                    styles.emojiButton,
                    selectedEmojiIndex === index && styles.selectedEmojiButton,
                  ]}
                  onPress={() => handleSelectEmoji(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiButtonText}>{emoji.emoji}</Text>
                </TouchableOpacity>
              ))}
              {/* Bouton pour ouvrir/fermer le clavier emoji */}
              <TouchableOpacity
                style={styles.toggleEmojiKeyboardButton}
                onPress={() => setIsEmojiKeyboardOpen(!isEmojiKeyboardOpen)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isEmojiKeyboardOpen ? "close-circle-outline" : "add-circle-outline"}
                  size={30}
                  color="#A0A0A0"
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.navigationBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack} // Utiliser handleBack (goBack)
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#666" />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.7}
            >
              <Text style={styles.continueButtonText}>Continuer</Text>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Emoji Keyboard - Toujours visible */}
          {/* Clavier Emoji (conditionnel et animé) */}
          <Animated.View style={[styles.emojiKeyboardContainer, { height: emojiKeyboardHeight }]}>
             {/* Le contenu ne s'affiche que si la hauteur est > 0 pour éviter les rendus inutiles */}
             {isEmojiKeyboardOpen && (
                <>
                  {/* En-tête avec les onglets de catégories */}
                  <View style={styles.categoryTabs}>
                    <FlatList
                      ref={categoryListRef}
                      horizontal
                      data={emojiCategories}
                      renderItem={renderCategoryTab}
                      keyExtractor={(item) => item.id}
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryTabsList}
                    />
                  </View>

                  {/* Grille d'emojis */}
                  <View style={styles.emojiGridContainer}>
                    <FlatList
                      data={emojiCategories[selectedCategoryIndex].emojis}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.emojiGridItem}
                          onPress={() => handleEmojiSelected(item)}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.emojiText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item, index) => `emoji-${index}`}
                      numColumns={8}
                      showsVerticalScrollIndicator={true}
                      style={styles.emojiGrid}
                      initialNumToRender={32} // Augmenter pour remplir plus vite
                      removeClippedSubviews={true}
                    />
                  </View>
                </>
             )}
          </Animated.View>
        </View>
      </SafeAreaView>
  ); // Fin du return du composant fonctionnel
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'white',
    zIndex: 10,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#000',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  helpButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },
  // Preview
  previewContainer: {
    alignItems: 'center',
    marginVertical: 25,
  },
  previewBox: {
    width: 140,
    height: 140,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewEmoji: {
    fontSize: 70,
  },
  // Color Selection
  colorScrollContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 16,
  },
  colorButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
  },
  selectedColorButton: {
    borderWidth: 3,
    borderColor: '#000',
  },
  // Emoji Selection
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 16,
  },
  emojiButton: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedEmojiButton: {
    borderWidth: 3,
    borderColor: '#000',
  },
  emojiButtonText: {
    fontSize: 35,
  },
  toggleEmojiKeyboardButton: {
    width: 70, // Même largeur que les boutons emoji
    height: 70, // Même hauteur
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#FAFAFA', // Optionnel: fond léger
    // borderRadius: 20, // Optionnel: arrondi
  },

  // Navigation Bar
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  backButton: { // Style de EventOptionalInfoModal
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  backButtonText: { // Style de EventOptionalInfoModal
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 5, // Ajusté pour l'icône
  },
  continueButton: { // Style de EventOptionalInfoModal
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
    gap: 8, // Ajouté pour espacer texte et icône
  },
  continueButtonText: { // Style de EventOptionalInfoModal
    fontSize: 16,
    fontWeight: 'bold', // Changé en bold
    color: 'white',
    // marginRight: 5, // Supprimé car gap est utilisé
  },

  // Emoji Keyboard - Conditionnel et animé
  emojiKeyboardContainer: {
    // height: 280, // La hauteur est maintenant animée
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    overflow: 'hidden', // Important pour l'animation de hauteur
  },
  // Onglets de catégories
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryTabsList: {
    paddingVertical: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  selectedCategoryTab: {
    backgroundColor: '#5A67F2',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555555',
  },
  selectedCategoryTabText: {
    color: '#FFFFFF',
  },
  // Grille d'emojis
  emojiGridContainer: { // Ajuster pour scroll vertical
    flex: 1, // Prendre l'espace vertical restant dans emojiKeyboardContainer
    backgroundColor: '#FFFFFF',
  },
  emojiGrid: { // Ajuster pour scroll horizontal
    flex: 1, // Permettre à la FlatList de s'étendre
    paddingHorizontal: 8, // Garder le padding horizontal
    paddingVertical: 8,
  },
  emojiGridItem: {
    // width: SCREEN_WIDTH / 8, // La largeur sera déterminée par le contenu ou fixe
    width: SCREEN_WIDTH / 8 - 4, // Calculer la largeur en fonction du nombre de colonnes et padding
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  }
});

export default EventIllustrationModal;