import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';

type AvatarCreationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AvatarCreation'>;
type AvatarCreationScreenRouteProp = RouteProp<RootStackParamList, 'AvatarCreation'>;

// Couleurs de vêtements
const CLOTHING_COLORS = [
  { id: 'pink', color: '#FFB6C1' },    // Rose pâle
  { id: 'cream', color: '#FFECD1' },   // Crème
  { id: 'yellow', color: '#FFF9C4' },  // Jaune pâle
  { id: 'mint', color: '#98FB98', borderColor: '#FFFFFF', borderWidth: 5 }, // Vert menthe avec bordure
  { id: 'lightblue', color: '#ADD8E6' }, // Bleu clair
  { id: 'lavender', color: '#E6E6FA' }, // Lavande
  { id: 'rose', color: '#FFD1DC' },    // Rose bonbon
];

// Couleurs d'arrière-plan
const BACKGROUND_COLORS = [
  { id: 'lightpink', color: '#FFC0CB', borderColor: '#FFFFFF', borderWidth: 5 }, // Rose clair avec bordure
  { id: 'peach', color: '#FFDAB9' },   // Pêche
  { id: 'lightyellow', color: '#FFFFE0' }, // Jaune très pâle
  { id: 'lightgreen', color: '#CCFFCC' }, // Vert pastel
  { id: 'skyblue', color: '#A5E8E8' }, // Bleu ciel (comme l'avatar actuel)
  { id: 'lavender', color: '#CCE6FF' }, // Lavande clair
  { id: 'bubblegum', color: '#FFB6FF' }, // Rose bonbon
];

// Options de vêtements
const CLOTHING_VARIATIONS = [
  {
    id: 'tshirt_basic',
    url: 'https://api.a0.dev/assets/image?text=3d%20avatar%20wearing%20basic%20tshirt&aspect=1:1&seed=123',
  },
  {
    id: 'tshirt_collar',
    url: 'https://api.a0.dev/assets/image?text=3d%20avatar%20wearing%20collar%20tshirt&aspect=1:1&seed=124',
  },
  {
    id: 'hoodie',
    url: 'https://api.a0.dev/assets/image?text=3d%20avatar%20wearing%20hoodie&aspect=1:1&seed=125',
  },
  {
    id: 'sweater',
    url: 'https://api.a0.dev/assets/image?text=3d%20avatar%20wearing%20sweater&aspect=1:1&seed=126',
  },
  {
    id: 'shirt_formal',
    url: 'https://api.a0.dev/assets/image?text=3d%20avatar%20wearing%20formal%20shirt&aspect=1:1&seed=127',
  },
  {
    id: 'tank_top',
    url: 'https://api.a0.dev/assets/image?text=3d%20avatar%20wearing%20tank%20top&aspect=1:1&seed=128',
  }
];

// Options de personnalisation
const SKIN_TONES = [
  { id: 'light', color: '#FFE0BE' },
  { id: 'medium', color: '#C68E61' },
  { id: 'dark', color: '#62382F' },
];

// Options de couleur des yeux
const EYE_COLORS = [
  { id: 'blue', color: '#005789' },
  { id: 'green', color: '#486B00', borderColor: '#88AA00', borderWidth: 5 },
  { id: 'brown', color: '#654321' },
  { id: 'gray', color: '#777777' },
];

// Options de couleur des lèvres/peau
const MOUTH_COLORS = [
  { id: 'gold', color: '#D4A76A' },
  { id: 'copper', color: '#B06840' },
  { id: 'cream', color: '#B29179', borderColor: '#FFFFFF', borderWidth: 5 },
  { id: 'brown', color: '#695041' },
  { id: 'dark', color: '#221D1B' },
  { id: 'gray', color: '#BEBEBE' },
];

// Variations de bouche
const MOUTH_VARIATIONS = [
  {
    id: 'smile_closed',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20smile%20lips%20closed&aspect=1:1&seed=100',
    selected: true
  },
  {
    id: 'smile_slight',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20slight%20smile%20lips&aspect=1:1&seed=101'
  },
  {
    id: 'smile_open',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20open%20smile%20lips&aspect=1:1&seed=102'
  },
  {
    id: 'tongue_out',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20tongue%20out%20playful&aspect=1:1&seed=103'
  },
  {
    id: 'laughing',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20laughing%20open%20wide&aspect=1:1&seed=104'
  },
  {
    id: 'smirk',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20smirk%20slight%20smile&aspect=1:1&seed=105'
  },
  {
    id: 'beard_full',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20full%20brown%20beard&aspect=1:1&seed=106'
  },
  {
    id: 'beard_short',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20short%20beard%20goatee&aspect=1:1&seed=107'
  },
  {
    id: 'mustache',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20closeup%20mouth%20black%20mustache&aspect=1:1&seed=108'
  },
];

// Catégories de personnalisation
const CUSTOMIZATION_CATEGORIES = [
  { id: 'yeux', label: 'Yeux' },
  { id: 'bouche', label: 'Bouche' },
  { id: 'cheveux', label: 'Cheveux' },
  { id: 'vetement', label: 'Vêtement' },
  { id: 'accessoire', label: 'Accessoire' },
  { id: 'arriere-plan', label: 'Arrière-plan' },
];

const HAT_VARIATIONS = [
  {
    id: 'none',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20no%20hat%20prohibited%20sign&aspect=1:1'
  },
  {
    id: 'cap',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20head%20white%20baseball%20cap&aspect=1:1'
  },
  {
    id: 'sun_hat',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20head%20beige%20sun%20hat&aspect=1:1'
  },
  {
    id: 'baseball',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20head%20blue%20baseball%20cap%20sideways&aspect=1:1'
  },
  {
    id: 'santa',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20head%20santa%20claus%20hat&aspect=1:1'
  },
  {
    id: 'beanie',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20head%20light%20blue%20beanie&aspect=1:1'
  },
  {
    id: 'sport_cap',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20head%20blue%20sports%20cap&aspect=1:1'
  }
];

// Variations d'yeux
const EYE_VARIATIONS = [
  {
    id: 'eye1',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20face%20closeup%20green%20eyes&aspect=1:1&seed=123',
  },
  {
    id: 'eye2',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20face%20closeup%20green%20eyes%20different%20style&aspect=1:1&seed=234',
    selected: true
  },
  {
    id: 'eye3',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20face%20closeup%20green%20eyes%20wide&aspect=1:1&seed=345',
  },
  {
    id: 'eye4',
    url: 'https://api.a0.dev/assets/image?text=3d%20cartoon%20face%20closeup%20green%20eyes%20small&aspect=1:1&seed=456',
  },
];

const AvatarCreationScreen: React.FC = () => {
  const navigation = useNavigation<AvatarCreationScreenNavigationProp>();
  const route = useRoute<AvatarCreationScreenRouteProp>();
  const { emailOrPhone, password, firstName, lastName, gender, birthdate, returnScreen } = route.params;  // États
  const [mainAvatar, setMainAvatar] = useState<string>('https://api.a0.dev/assets/image?text=3d%20cartoon%20person%20child%20friendly%20closeup%20portrait&aspect=1:1&seed=567');  
  const [selectedCategory, setSelectedCategory] = useState<string>('vetement');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState<string>(BACKGROUND_COLORS[4].id); // Bleu ciel par défaut
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('chapeau'); // On démarre sur l'onglet "Yeux" comme dans l'image
  const [selectedSkinTone, setSelectedSkinTone] = useState<string>(SKIN_TONES[0].id);  const [selectedEyeColor, setSelectedEyeColor] = useState<string>(EYE_COLORS[1].id); // Vert par défaut
  const [selectedEyeVariation, setSelectedEyeVariation] = useState<string>(EYE_VARIATIONS[1].id);
  const [eyeVariations, setEyeVariations] = useState(EYE_VARIATIONS);
  const [selectedMouthColor, setSelectedMouthColor] = useState<string>(MOUTH_COLORS[0].id);
  const [selectedMouthVariation, setSelectedMouthVariation] = useState<string>(MOUTH_VARIATIONS[0].id);
  const [mouthVariations, setMouthVariations] = useState(MOUTH_VARIATIONS);
  
  // Changer la couleur des yeux
  const handleEyeColorChange = (eyeColorId: string) => {
    setSelectedEyeColor(eyeColorId);
    // Dans une vraie application, on mettrait à jour l'apparence de l'avatar
  };  // Changer la variation des yeux
  const handleEyeVariationChange = (variationId: string) => {
    setSelectedEyeVariation(variationId);
    setEyeVariations(eyeVariations.map(variation => ({
      ...variation,
      selected: variation.id === variationId
    })));
    // Dans une vraie application, on mettrait à jour l'apparence de l'avatar
  };
  
  // Changer la couleur de bouche
  const handleMouthColorChange = (mouthColorId: string) => {
    setSelectedMouthColor(mouthColorId);
    // Dans une vraie application, on mettrait à jour l'apparence de l'avatar
  };
  
  // Changer la variation de bouche
  const handleMouthVariationChange = (variationId: string) => {
    setSelectedMouthVariation(variationId);
    setMouthVariations(mouthVariations.map(variation => ({
      ...variation,
      selected: variation.id === variationId
    })));
    // Dans une vraie application, on mettrait à jour l'apparence de l'avatar
  };
  
  // Changer le ton de peau
  const handleSkinToneChange = (skinToneId: string) => {
    setSelectedSkinTone(skinToneId);
    // Dans une vraie application, on mettrait à jour l'apparence de l'avatar
  };
  
  // Naviguer à l'écran suivant
  const handleNext = () => {
  if (returnScreen === 'SignupProfile') {
    navigation.navigate('SignupProfile', {
      emailOrPhone,
      password,
      firstName,
      lastName,
      gender,
      birthdate
    });
    
    // Après un court délai, naviguer vers l'écran de confirmation
    setTimeout(() => {
      navigation.navigate('SignupProfileConfirm', {
        emailOrPhone,
        password,
        firstName,
        lastName,
        gender,
        birthdate,
        avatar: mainAvatar
      });
    }, 100);
  } else if (returnScreen === 'ManagedAccountProfileConfirm') {
    navigation.navigate('ManagedAccountProfileConfirm', {
      firstName,
      lastName,
      gender,
      birthdate,
      avatar: mainAvatar
    });
  } else {
    navigation.navigate('SignupProfileConfirm', {
      emailOrPhone,
      password,
      firstName,
      lastName,
      gender,
      birthdate,
      avatar: mainAvatar
    });
  }
};
  
  // Naviguer vers l'écran précédent
  const handlePrevious = () => {
    // Dans une vraie application, cela naviguerait entre les catégories
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Création d'un avatar</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="apps" size={28} color="black" />
          </TouchableOpacity>
        </View>
        
        {/* Avatar principal */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: mainAvatar }} style={styles.avatar} />
          </View>
        </View>
        
        {/* Catégories de personnalisation */}
        <View style={styles.categoriesOuterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CUSTOMIZATION_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonSelected
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextSelected
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>        {selectedCategory === 'cheveux' && (
          <View style={styles.subCategoryContainer}>
            <TouchableOpacity
              style={[
                styles.subCategoryButton,
                selectedSubCategory === 'cheveux' && styles.subCategoryButtonSelected
              ]}
              onPress={() => setSelectedSubCategory('cheveux')}
            >
              <Text style={[
                styles.subCategoryText,
                selectedSubCategory === 'cheveux' && styles.subCategoryTextSelected
              ]}>
                Cheveux
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.subCategoryButton,
                selectedSubCategory === 'chapeau' && styles.subCategoryButtonSelected
              ]}
              onPress={() => setSelectedSubCategory('chapeau')}
            >
              <Text style={[
                styles.subCategoryText,
                selectedSubCategory === 'chapeau' && styles.subCategoryTextSelected
              ]}>
                Chapeau
              </Text>
            </TouchableOpacity>
          </View>
        )}        {/* Options de personnalisation selon la catégorie */}
        {selectedCategory === 'vetement' && (
          <View style={styles.optionsContainer}>
            <View style={styles.colorOptionsContainer}>
              {CLOTHING_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOption,
                    { 
                      backgroundColor: color.color,
                      borderWidth: color.borderWidth || 0,
                      borderColor: color.borderColor || 'transparent'
                    },
                    selectedMouthColor === color.id && styles.colorOptionSelected
                  ]}
                  onPress={() => handleMouthColorChange(color.id)}
                />
              ))}
            </View>
            
            {/* Variations de vêtements */}
            <View style={styles.variationsContainer}>
              {CLOTHING_VARIATIONS.map((variation) => (
                <TouchableOpacity
                  key={variation.id}
                  style={[
                    styles.variationItem,
                    variation.selected && styles.variationItemSelected
                  ]}
                  onPress={() => handleMouthVariationChange(variation.id)}
                >
                  <Image source={{ uri: variation.url }} style={styles.variationImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {selectedCategory === 'ethnicity' && (
          <View style={styles.optionsContainer}>
            <View style={styles.colorOptionsContainer}>
              {SKIN_TONES.map((tone) => (
                <TouchableOpacity
                  key={tone.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: tone.color },
                    selectedSkinTone === tone.id && styles.colorOptionSelected
                  ]}
                  onPress={() => handleSkinToneChange(tone.id)}
                />
              ))}
            </View>
            
            {/* Variations de visage pour l'ethnicité */}
            <View style={styles.variationsContainer}>
              {[...Array(4)].map((_, index) => (
                <TouchableOpacity
                  key={`skin_${index}`}
                  style={[
                    styles.variationItem,
                    index === 0 && styles.variationItemSelected
                  ]}
                >
                  <Image 
                    source={{ 
                      uri: `https://api.a0.dev/assets/image?text=3d%20cartoon%20face%20${
                        SKIN_TONES[index % SKIN_TONES.length].id
                      }%20skin&aspect=1:1&seed=${100 + index}` 
                    }} 
                    style={styles.variationImage} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}        {selectedCategory === 'eyes' && (
          <View style={styles.optionsContainer}>
            <View style={styles.colorOptionsContainer}>
              {EYE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOption,
                    { 
                      backgroundColor: color.color,
                      borderWidth: color.borderWidth || 0,
                      borderColor: color.borderColor || 'transparent'
                    },
                    selectedEyeColor === color.id && styles.colorOptionSelected
                  ]}
                  onPress={() => handleEyeColorChange(color.id)}
                />
              ))}
            </View>
            
            {/* Variations des yeux */}
            <View style={styles.variationsContainer}>
              {eyeVariations.map((variation) => (
                <TouchableOpacity
                  key={variation.id}
                  style={[
                    styles.variationItem,
                    variation.selected && styles.variationItemSelected
                  ]}
                  onPress={() => handleEyeVariationChange(variation.id)}
                >
                  <Image source={{ uri: variation.url }} style={styles.variationImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {selectedCategory === 'bouche' && (
          <View style={styles.optionsContainer}>
            <View style={styles.colorOptionsContainer}>
              {MOUTH_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOption,
                    { 
                      backgroundColor: color.color,
                      borderWidth: color.borderWidth || 0,
                      borderColor: color.borderColor || 'transparent'
                    },
                    selectedMouthColor === color.id && styles.colorOptionSelected
                  ]}
                  onPress={() => handleMouthColorChange(color.id)}
                />
              ))}
            </View>
            
            {/* Variations de bouche */}
            <View style={styles.variationsContainer}>
              {mouthVariations.map((variation) => (
                <TouchableOpacity
                  key={variation.id}
                  style={[
                    styles.variationItem,
                    variation.selected && styles.variationItemSelected
                  ]}
                  onPress={() => handleMouthVariationChange(variation.id)}
                >
                  <Image source={{ uri: variation.url }} style={styles.variationImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}        {/* Boutons de navigation */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={handlePrevious}
          >
            <Ionicons name="arrow-back" size={28} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.checkButton]} 
            onPress={handleNext}
          >
            {selectedCategory === 'arriere-plan' ? (
              <Ionicons name="checkmark" size={28} color="white" />
            ) : (
              <Ionicons name="arrow-forward" size={28} color="#666" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  emptySpaceContainer: {
    flex: 1,
    minHeight: 200,
  },
  checkButton: {
    backgroundColor: '#000',
  },
  subCategoryContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  subCategoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  subCategoryButtonSelected: {
    backgroundColor: '#000',
  },
  subCategoryText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  subCategoryTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#A8F5FF', // Bleu clair comme sur l'image
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  categoriesOuterContainer: {
    paddingVertical: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  categoryButtonSelected: {
    backgroundColor: '#f5f5f5',
    borderRadius: 30,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
  },
  categoryTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  optionsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  colorOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  colorOption: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
    borderWidth: 2,
  },
  variationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  variationItem: {
    width: Dimensions.get('window').width * 0.28,
    height: Dimensions.get('window').width * 0.28,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  variationItemSelected: {
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 20,
  },
  variationImage: {
    width: '100%',
    height: '100%',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 80,
    paddingVertical: 20,
    marginBottom: 20,
  },
  navButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AvatarCreationScreen;