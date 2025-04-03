import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'sonner-native';
import EnhancedInAppBrowser from '../components/EnhancedInAppBrowser';

type AddWishScreenRouteProp = RouteProp<RootStackParamList, 'AddWish'>;

// URL validation function
const isValidURL = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Image URL validation (checks if it's likely an image)
const isLikelyImageURL = (url: string) => {
  if (!isValidURL(url)) return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)($|\?)/i;
  return imageExtensions.test(url);
};

const AddWishScreen: React.FC = () => {
  const route = useRoute<AddWishScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addWishItem } = useWishlist();
  const wishlistId = route.params?.wishlistId;

  // Form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [imageURL, setImageURL] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Browser state
  const [isBrowserVisible, setIsBrowserVisible] = useState<boolean>(false);
  const [browserUrl, setBrowserUrl] = useState<string>('https://www.google.com');
  const [browserMode, setBrowserMode] = useState<'image' | 'link'>('image');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Image URL validation state
  const [isCheckingImage, setIsCheckingImage] = useState<boolean>(false);
  const [manualImageInput, setManualImageInput] = useState<string>('');
  const [showManualImageInput, setShowManualImageInput] = useState<boolean>(false);
  
  // Check if wishlist ID is available on component mount
  useEffect(() => {
    if (!wishlistId) {
      setApiError('La liste de souhaits est manquante. Veuillez réessayer.');
    }
  }, [wishlistId]);

  // Handle saving the wish item to the API
  const handleSave = async () => {
    if (!wishlistId) {
      toast.error('Aucune liste de souhaits sélectionnée');
      setApiError('La liste de souhaits est manquante. Veuillez réessayer.');
      return;
    }

    if (!name) {
      toast.error('Veuillez entrer un nom pour votre vœu');
      return;
    }

    // Validate image URL if provided
    if (imageURL && !isLikelyImageURL(imageURL)) {
      toast.error("L'URL de l'image semble invalide");
      return;
    }

    // Validate product link if provided
    if (link && !isValidURL(link)) {
      toast.error("Le lien du produit semble invalide");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      console.log('Sending wish item to API:', {
        wishlistId,
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        imageURL,
        link
      });
      
      const newWish = await addWishItem({
        wishlistId,
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        imageURL: imageURL || 'https://api.a0.dev/assets/image?text=product&aspect=1:1',
        link,
        isFavorite: false
      });
      
      console.log('Wish item created successfully:', newWish);
      toast.success('Vœu ajouté avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du vœu:', error);
      setApiError('Erreur lors de l\'ajout du vœu. Veuillez réessayer.');
      toast.error('Erreur lors de l\'ajout du vœu');
    } finally {
      setIsLoading(false);
    }
  };

  // Open browser for searching images or products
  const openBrowser = (mode: 'image' | 'link') => {
    setBrowserMode(mode);
    
    // Set initial search URL based on mode
    if (mode === 'image') {
      setBrowserUrl('https://www.google.com/search?tbm=isch&q=product+image');
    } else {
      // Use current link if available and valid
      if (link && isValidURL(link)) {
        setBrowserUrl(link);
      } else {
        setBrowserUrl('https://www.google.com');
      }
    }
    
    setIsBrowserVisible(true);
  };

  // Check if an image URL is valid/accessible
  const validateImageURL = async (url: string) => {
    if (!url || !isValidURL(url)) {
      return false;
    }

    setIsCheckingImage(true);
    
    try {
      // Use timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
      
      // Alternative method: we could check headers only, but for simplicity we'll try loading the image
      await Promise.race([
        fetch(url),
        timeoutPromise
      ]);
      
      // If we get here, the image URL is likely valid
      return true;
    } catch (error) {
      console.error('Error validating image URL:', error);
      return false;
    } finally {
      setIsCheckingImage(false);
    }
  };

  // Handle browser close with optional URL capture
  const handleBrowserClose = () => {
    setIsBrowserVisible(false);
  };

  // Handle image selection from browser
  const handleSelectImage = async (selectedImageUrl: string) => {
    console.log('Selected image URL:', selectedImageUrl);
    
    // Validate the image URL
    const isValid = await validateImageURL(selectedImageUrl);
    
    if (isValid) {
      setImageURL(selectedImageUrl);
      toast.success('Image sélectionnée');
    } else {
      toast.error("L'URL de l'image semble invalide");
    }
  };

  // Handle confirming a link from browser
  const handleConfirmLink = (selectedUrl: string) => {
    console.log('Selected link URL:', selectedUrl);
    
    if (isValidURL(selectedUrl)) {
      setLink(selectedUrl);
      toast.success('Lien enregistré');
      
      // Extract product name from URL if empty
      if (!name) {
        try {
          const url = new URL(selectedUrl);
          const pathParts = url.pathname.split('/').filter(p => p);
          if (pathParts.length > 0) {
            const possibleName = pathParts[pathParts.length - 1]
              .replace(/-|_/g, ' ')
              .replace(/\.(html|php|aspx)$/, '')
              .split('?')[0];
            
            if (possibleName.length > 3) {
              // Capitalize first letter and rest of words
              setName(possibleName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
              );
            }
          }
        } catch (e) {
          // Ignore errors in URL parsing
        }
      }
    } else {
      toast.error('URL invalide');
    }
  };
  
  // Handle manual image URL input
  const handleAddManualImage = async () => {
    if (!manualImageInput) {
      toast.error("Veuillez entrer une URL d'image");
      return;
    }
    
    if (!isValidURL(manualImageInput)) {
      toast.error("L'URL semble invalide");
      return;
    }
    
    const isValid = await validateImageURL(manualImageInput);
    
    if (isValid) {
      setImageURL(manualImageInput);
      setManualImageInput('');
      setShowManualImageInput(false);
      toast.success('Image ajoutée');
    } else {
      toast.error("Impossible de charger l'image. Vérifiez l'URL");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un vœu</Text>
          <TouchableOpacity 
            style={[styles.saveButton, (!name || !wishlistId) && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!name || !wishlistId || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            {/* Error message for missing wishlist ID */}
            {!wishlistId && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>La liste de souhaits n'est pas sélectionnée. Veuillez retourner à la liste et réessayer.</Text>
              </View>
            )}
            {/* Image Preview or Placeholder */}
            <View style={styles.imageContainer}>
              {imageURL ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: imageURL }} 
                    style={styles.imagePreview} 
                    onError={() => {
                      toast.error('Impossible de charger l\'image');
                      setImageURL('');
                    }}
                  />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity 
                      style={styles.imageActionButton}
                      onPress={() => openBrowser('image')}
                    >
                      <Ionicons name="search" size={18} color="white" />
                      <Text style={styles.imageActionText}>Chercher</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.imageActionButton}
                      onPress={() => setShowManualImageInput(true)}
                    >
                      <Ionicons name="link" size={18} color="white" />
                      <Text style={styles.imageActionText}>Saisir URL</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.imageActionButton}
                      onPress={() => setImageURL('')}
                    >
                      <Ionicons name="trash" size={18} color="#ff6b6b" />
                      <Text style={[styles.imageActionText, {color: '#ff6b6b'}]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <TouchableOpacity 
                    style={styles.imagePickerOption}
                    onPress={() => openBrowser('image')}
                  >
                    <View style={styles.imagePickerIconContainer}>
                      <FontAwesome5 name="search" size={22} color="#666" />
                    </View>
                    <Text style={styles.imagePickerText}>Chercher une image</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.imagePickerOption}
                    onPress={() => setShowManualImageInput(true)}
                  >
                    <View style={styles.imagePickerIconContainer}>
                      <MaterialIcons name="link" size={24} color="#666" />
                    </View>
                    <Text style={styles.imagePickerText}>Saisir URL d'image</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Product Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom*</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nom du produit"
                placeholderTextColor="#999"
              />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description du produit"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Price */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prix</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={(text) => {
                  // Filtrer pour n'accepter que les chiffres et un point
                  const filtered = text.replace(/[^0-9.]/g, '');
                  setPrice(filtered);
                }}
                placeholder="Prix"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            {/* Product URL with browser button */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Lien du produit</Text>
              <View style={styles.urlInputContainer}>
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  value={link}
                  onChangeText={setLink}
                  placeholder="https://example.com/product"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => openBrowser('link')}
                >
                  <FontAwesome5 name="search" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error message */}
            {apiError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Enhanced In-App Browser */}
      {isBrowserVisible && (
        <EnhancedInAppBrowser
          visible={isBrowserVisible}
          url={browserUrl}
          onClose={handleBrowserClose}
          mode={browserMode}
          onSelectImage={handleSelectImage}
          onConfirmLink={handleConfirmLink}
        />
      )}
      
      {/* Manual Image URL Input Modal */}
      <Modal
        visible={showManualImageInput}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ajouter une URL d'image</Text>
            
            <TextInput
              style={styles.modalInput}
              value={manualImageInput}
              onChangeText={setManualImageInput}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoFocus
            />
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setManualImageInput('');
                  setShowManualImageInput(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton,
                  !manualImageInput && styles.modalButtonDisabled,
                  isCheckingImage && styles.modalButtonDisabled
                ]}
                onPress={handleAddManualImage}
                disabled={!manualImageInput || isCheckingImage}
              >
                {isCheckingImage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: 'black',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  imageActionText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    paddingHorizontal: 20,
  },
  imagePickerOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  imagePickerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePickerText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  browseButton: {
    backgroundColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  
  // Manual image entry modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginRight: 10,
    flex: 1,
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  modalConfirmButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  modalButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AddWishScreen;