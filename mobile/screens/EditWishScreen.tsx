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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'sonner-native';

type EditWishScreenRouteProp = RouteProp<RootStackParamList, 'EditWish'>;

const EditWishScreen: React.FC = () => {
  const route = useRoute<EditWishScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getWishItem, editWishItem, removeWishItem } = useWishlist();
  const { wishId } = route.params;

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [imageURL, setImageURL] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Charger les données de l'item
  useEffect(() => {
    const loadItemData = async () => {
      try {
        setIsLoading(true);
        const item = await getWishItem(wishId);
        
        setName(item.name);
        setDescription(item.description || '');
        setPrice(item.price?.toString() || '');
        setImageURL(item.imageURL || '');
        setLink(item.link || '');
        setIsFavorite(item.isFavorite);
      } catch (error) {
        console.error('Erreur lors du chargement du vœu:', error);
        toast.error('Impossible de charger les données du vœu');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadItemData();
  }, [wishId]);

  const handleSave = async () => {
    if (!name) {
      toast.error('Veuillez entrer un nom pour votre vœu');
      return;
    }

    setIsSaving(true);

    try {
      await editWishItem(wishId, {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        imageURL,
        link,
        isFavorite
      });

      toast.success('Vœu mis à jour avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du vœu:', error);
      toast.error('Erreur lors de la mise à jour du vœu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await removeWishItem(wishId);
      toast.success('Vœu supprimé avec succès');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la suppression du vœu:', error);
      toast.error('Erreur lors de la suppression du vœu');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Chargement du vœu...</Text>
      </SafeAreaView>
    );
  }

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
            disabled={isSaving || isDeleting}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le vœu</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
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
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImageURL('')}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#999" />
                <Text style={styles.imagePlaceholderText}>Ajouter une image</Text>
              </View>
            )}

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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>URL de l'image</Text>
              <TextInput
                style={styles.input}
                value={imageURL}
                onChangeText={setImageURL}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Lien du produit</Text>
              <TextInput
                style={styles.input}
                value={link}
                onChangeText={setLink}
                placeholder="https://example.com/product"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.favoriteContainer}>
              <Text style={styles.label}>Ajouter aux favoris</Text>
              <TouchableOpacity
                style={styles.favoriteToggle}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Ionicons 
                  name={isFavorite ? "star" : "star-outline"} 
                  size={28} 
                  color={isFavorite ? "#FFD700" : "#999"} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, !name && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={!name || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  deleteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  imagePreviewContainer: {
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#999',
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
  favoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  favoriteToggle: {
    padding: 5,
  },
  saveButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditWishScreen;