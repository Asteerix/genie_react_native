import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useWishlist } from '../context/WishlistContext';

type WishlistSettingsScreenRouteProp = RouteProp<RootStackParamList, 'WishlistSettings'>;

const WishlistSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WishlistSettingsScreenRouteProp>();
  const { getWishlist, editWishlist, addWishlist } = useWishlist();
  const { wishlistId, pendingWishlist } = route.params;
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(!pendingWishlist);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // State for form fields
  const [title, setTitle] = useState<string>(pendingWishlist?.title || '');
  const [description, setDescription] = useState<string>(pendingWishlist?.description || '');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [addAdmins] = useState<boolean>(pendingWishlist?.addAdmins || false);
  
  // Load wishlist data if editing existing wishlist
  useEffect(() => {
    const loadWishlistData = async () => {
      if (!wishlistId) return; // Skip if creating new wishlist
      
      try {
        setIsLoading(true);
        const wishlist = await getWishlist(wishlistId);
        
        setTitle(wishlist.title);
        setDescription(wishlist.description || '');
        setIsPublic(wishlist.isPublic);
        setIsFavorite(wishlist.isFavorite);
        setSelectedImage(wishlist.coverImage || '');
      } catch (error) {
        console.error('Error loading wishlist', error);
        toast.error('Erreur lors du chargement de la wishlist');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWishlistData();
  }, [wishlistId]);

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

  const handleSave = async () => {
    try {
      console.log('WishlistSettingsScreen - handleSave called');
      setIsSaving(true);
      
      if (wishlistId) {
        console.log('WishlistSettingsScreen - Editing existing wishlist with ID:', wishlistId);
        // Edit existing wishlist
        await editWishlist(wishlistId, {
          coverImage: selectedImage,
          isPublic,
          isFavorite
        });
        toast.success('Modifications enregistrées');
      } else if (pendingWishlist) {
        console.log('WishlistSettingsScreen - Creating new wishlist with title:', pendingWishlist.title);
        console.log('Server API configuration: Using endpoint /wishlists with data:',
          JSON.stringify({
            title: pendingWishlist.title,
            description: pendingWishlist.description,
            coverImage: selectedImage,
            isPublic,
            isFavorite
          }));
          
        // Create new wishlist
        try {
          const newWishlist = await addWishlist({
            title: pendingWishlist.title,
            description: pendingWishlist.description,
            coverImage: selectedImage,
            isPublic,
            isFavorite
          });
          
          console.log('WishlistSettingsScreen - Wishlist created successfully:', newWishlist?.id);
          
          // Handle admins separately if needed
          if (pendingWishlist.addAdmins) {
            // TODO: Add logic to handle admins through a separate API call
            console.log('Admin handling will be implemented');
          }
          toast.success('Liste de souhaits créée');
        } catch (error) {
          console.error('WishlistSettingsScreen - Specific error creating wishlist:', error);
          // Type assertion to access axios error properties more safely
          const axiosError = error as { response?: { data?: any, status?: number }, config?: { url?: string } };
          console.error('API Error details:', axiosError.response?.data || 'No response data');
          console.error('API Error status:', axiosError.response?.status || 'No status');
          console.error('API Error URL:', axiosError.config?.url || 'No URL info');
          toast.error('Erreur lors de la création de la liste. Vérifiez les logs pour plus de détails.');
          throw error; // Re-throw to trigger the error handling below
        }
      }
      
      console.log('WishlistSettingsScreen - Navigating back after save');
      navigation.goBack();
    } catch (error) {
      console.error('WishlistSettingsScreen - Error saving wishlist:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
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

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <SafeAreaView style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Chargement des paramètres...</Text>
        </SafeAreaView>
      </View>
    );
  }
  
  // Log pour le débogage - pour vérifier que le composant a reçu les props correctes
  console.log('WishlistSettingsScreen rendering with params:', { wishlistId, pendingWishlist });

  // Render with a more robust approach
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
    <SafeAreaView style={[styles.container, { backgroundColor: 'white' }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={32} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {wishlistId ? 'Paramètres de liste' : 'Finaliser la liste'}
        </Text>
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={isSaving}>
          <Ionicons name="arrow-back" size={24} color="#888" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              {wishlistId ? 'Enregistrer' : 'Créer la liste'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    // Assurez-vous que le conteneur prend tout l'écran
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
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
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 150,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WishlistSettingsScreen;