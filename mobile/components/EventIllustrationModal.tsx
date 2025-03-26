import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  FlatList
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Interface des props
interface EventIllustrationModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: (data: { id: string; backgroundColor: string; emoji: string }) => void;
}

// Interface pour catégorie d'emojis
interface EmojiCategory {
  id: string;
  name: string;
  emojis: string[];
}

const EventIllustrationModal = ({
  visible,
  onClose,
  onBack,
  onContinue,
}: EventIllustrationModalProps) => {
  // États
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [currentEmoji, setCurrentEmoji] = useState('🪩');
  
  // Références
  const colorsScrollRef = useRef<ScrollView>(null);
  const categoryListRef = useRef<FlatList>(null);
  const previewRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
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

  // Effet pour initialiser l'emoji courant
  useEffect(() => {
    setCurrentEmoji(mainEmojis[selectedEmojiIndex].emoji);
  }, []);

  // Catégories d'emojis - Version moderne
  const emojiCategories: EmojiCategory[] = [
    {
      id: 'frequents',
      name: 'Fréquents',
      emojis: ['❤️', '👍', '😊', '✨', '🔥', '🙏', '😂', '🥰', '😘', '😍', '🤔', '🎉', '🎂', '🎁', '🥳', '👏', '🙌', '🍾', '🥂', '🤝', '🎊', '🎯', '💯', '💕', '🥹', '💋', '💪', '👌', '🤞', '🫶', '🙂', '😉']
    },
    {
      id: 'smileys',
      name: 'Smileys',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢']
    },
    {
      id: 'people',
      name: 'Personnes',
      emojis: ['👋', '🤚', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👣', '👀', '👁️', '👅', '👄', '🧠']
    },
    {
      id: 'celebration',
      name: 'Fête',
      emojis: ['🎊', '🎉', '🎈', '🪩', '🎂', '🍰', '🧁', '🎁', '🎆', '🎇', '🎏', '🎐', '🎀', '🎎', '🏮', '🪅', '🪩', '🪄', '👑', '🎢', '🎡', '🎠', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '🎯', '🎮', '🎰', '🏆']
    },
    {
      id: 'activities',
      name: 'Activités',
      emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '⛸️', '🛷', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊']
    },
    {
      id: 'travel',
      name: 'Voyages',
      emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🚄', '✈️', '🛫', '🛬', '🚀', '⛵', '🚢', '🚂', '🚆', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '🏞️', '🌅', '🌄', '🌇', '🌆', '🏙️']
    }
  ];
  
  // Gestion de l'emoji sélectionné
  const handleEmojiSelected = (emoji: string) => {
    // Mettre à jour l'emoji sélectionné
    setCurrentEmoji(emoji);
    
    // Mettre à jour l'emoji principal correspondant à l'index sélectionné
    const newEmojis = [...mainEmojis];
    newEmojis[selectedEmojiIndex] = { ...newEmojis[selectedEmojiIndex], emoji };
    mainEmojis[selectedEmojiIndex] = newEmojis[selectedEmojiIndex];
    
    // Faire défiler vers la prévisualisation si elle n'est pas visible
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // Changement de catégorie
  const handleCategoryChange = (index: number) => {
    setSelectedCategoryIndex(index);
    
    // Faire défiler à la position de la catégorie
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
      x: index * 70 - SCREEN_WIDTH / 3,
      animated: true,
    });
  };
  
  // Sélection de l'emoji principal
  const handleSelectEmoji = (index: number) => {
    setSelectedEmojiIndex(index);
    setCurrentEmoji(mainEmojis[index].emoji);
  };
  
  // Continuer avec la sélection
  const handleContinue = () => {
    onContinue({
      id: `illustration-${colors[selectedColorIndex].id}-${mainEmojis[selectedEmojiIndex].id}`,
      backgroundColor: colors[selectedColorIndex].color,
      emoji: currentEmoji,
    });
  };

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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
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
            </View>
          </ScrollView>
          
          {/* Navigation Buttons */}
          <View style={styles.navigationBar}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
              activeOpacity={0.7}
            >
              <Text style={styles.continueButtonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
          
          {/* Emoji Keyboard - Toujours visible */}
          <View style={styles.emojiKeyboardContainer}>
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
                showsVerticalScrollIndicator={false}
                style={styles.emojiGrid}
                initialNumToRender={32}
                removeClippedSubviews={true}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
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
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555555',
  },
  continueButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#5A67F2',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // Emoji Keyboard - Toujours visible
  emojiKeyboardContainer: {
    height: 280,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
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
  emojiGridContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emojiGrid: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  emojiGridItem: {
    width: SCREEN_WIDTH / 8,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  }
});

export default EventIllustrationModal;