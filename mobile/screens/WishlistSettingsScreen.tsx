import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

type WishlistSettingsScreenRouteProp = RouteProp<RootStackParamList, 'WishlistSettings'>;

const WishlistSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WishlistSettingsScreenRouteProp>();
  
  // Get wishlist data from route params or use default
  const wishlistData = route.params?.wishlistData || {
    id: '2',
    title: 'Mes favoris',
    description: 'Ma liste de favoris du moment',
    image: 'https://api.a0.dev/assets/image?text=coffee%20beans%20different%20varieties&aspect=1:1&seed=789',
    isPublic: true,
    isFavorite: true
  };

  // State for form fields
  const [isPublic, setIsPublic] = useState(wishlistData.isPublic);
  const [isFavorite, setIsFavorite] = useState(wishlistData.isFavorite);
  const [selectedImage, setSelectedImage] = useState(wishlistData.image);

  // Images disponibles pour la sélection
  const imageOptions = [
    { id: 'search', icon: <Ionicons name="search" size={40} color="#888" /> },
    { 
      id: 'coffee', 
      image: 'https://api.a0.dev/assets/image?text=coffee%20beans%20different%20varieties&aspect=1:1&seed=789' 
    },
    { id: 'empty1', isTransparent: true },
    { id: 'empty2', isTransparent: true }
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    // In a real app, save changes to backend
    toast.success('Modifications enregistrées');
    navigation.goBack();
  };

  const togglePublic = () => {
    setIsPublic(!isPublic);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleSelectImage = (image: string | null) => {
    if (image) {
      setSelectedImage(image);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={32} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres de liste</Text>
        <TouchableOpacity>
          <View style={styles.helpCircle}>
            <Text style={styles.helpText}>?</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Illustration Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Illustration</Text>
            <Text style={styles.importText}>importer une photo</Text>
          </View>
          
          <View style={styles.imageOptions}>
            {imageOptions.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.imageOption,
                  selectedImage === (item.image || '') && styles.selectedImageOption,
                  item.isTransparent && styles.transparentImageOption
                ]}
                onPress={() => item.image && handleSelectImage(item.image)}
              >
                {item.icon || 
                  (item.image ? (
                    <Image source={{ uri: item.image }} style={styles.optionImage} />
                  ) : item.isTransparent ? (
                    <View style={styles.checkerboardBackground} />
                  ) : null)
                }
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Parameters Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          
          {/* Public Toggle */}
          <TouchableOpacity 
            style={styles.toggleOption}
            onPress={togglePublic}
          >
            <View style={[styles.toggleButton, isPublic && styles.toggleActive]}>
              <Ionicons name="eye" size={28} color="black" />
            </View>
            <Text style={styles.toggleLabel}>
              Liste publique
            </Text>
          </TouchableOpacity>

          {/* Favorite Toggle */}
          <TouchableOpacity 
            style={styles.toggleOption}
            onPress={toggleFavorite}
          >
            <View style={[styles.toggleButton, isFavorite && styles.toggleActive]}>
              <Ionicons name="star" size={28} color="black" />
            </View>
            <Text style={styles.toggleLabel}>
              Liste {isFavorite ? 'favorite' : 'non favorite'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#888" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  helpCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  importText: {
    fontSize: 16,
    color: '#888',
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  imageOption: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedImageOption: {
    borderWidth: 3,
    borderColor: '#000',
  },
  transparentImageOption: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  optionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  checkerboardBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'white',
  },
  toggleActive: {
    backgroundColor: 'white',
  },
  toggleLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 30,
  },
  backButtonText: {
    fontSize: 18,
    marginLeft: 10,
    color: '#888',
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WishlistSettingsScreen;