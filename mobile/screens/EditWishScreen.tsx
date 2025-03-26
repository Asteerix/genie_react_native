import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons, AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

type EditWishScreenRouteProp = RouteProp<RootStackParamList, 'EditWish'>;
type EditWishScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditWish'>;

const EditWishScreen: React.FC = () => {
  const navigation = useNavigation<EditWishScreenNavigationProp>();
  const route = useRoute<EditWishScreenRouteProp>();
  const { productId } = route.params || {};

  // État initial du produit
  const [product, setProduct] = useState({
    id: productId || 'p1',
    name: 'Ceinture Diesel',
    price: '129',
    quantity: 1,
    description: 'En noir et argent mate',
    image: 'https://api.a0.dev/assets/image?text=black%20leather%20belt%20with%20silver%20buckle&aspect=1:1&seed=123',
    isPinned: true
  });

  // États pour les champs de formulaire
  const [title, setTitle] = useState(product.name);
  const [price, setPrice] = useState(product.price);
  const [quantity, setQuantity] = useState(product.quantity);
  const [description, setDescription] = useState(product.description);
  const [isPinned, setIsPinned] = useState(product.isPinned);
  const [selectedImage, setSelectedImage] = useState(product.image);

  // Images supplémentaires pour la sélection
  const imageSuggestions = [
    { id: 'add', isAddButton: true },
    { id: 'current', image: product.image },
    { id: 'alt', image: product.image }
  ];

  // Fonction pour récupérer les données du produit (dans une vraie app, ce serait une requête API)
  useEffect(() => {
    if (productId) {
      // Simuler la récupération des données
      console.log(`Récupération des données pour le produit ${productId}`);
      // Dans une vraie app, fetch product data from API or local storage
    }
  }, [productId]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDelete = () => {
    toast.success('Vœu supprimé avec succès');
    navigation.goBack();
  };

  const handleSave = () => {
    // Mettre à jour les données du produit
    const updatedProduct = {
      ...product,
      name: title,
      price,
      quantity,
      description,
      isPinned,
      image: selectedImage
    };

    // Dans une vraie app, envoyer les données mises à jour au backend
    console.log('Produit mis à jour:', updatedProduct);
    toast.success('Vœu mis à jour avec succès');
    navigation.goBack();
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const toggleIsPinned = () => {
    setIsPinned(prev => !prev);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier un vœu</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={28} color="red" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Titre */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Titre de l'article</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Nom du produit"
            />
          </View>
          
          {/* Prix et Quantité */}
          <View style={styles.rowSection}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionLabel}>Prix</Text>
              <View style={styles.priceInput}>
                <TextInput
                  style={styles.priceTextInput}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
                <View style={styles.currencyContainer}>
                  <Text style={styles.currencyText}>€</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.halfSection}>
              <Text style={styles.sectionLabel}>Quantité</Text>
              <View style={styles.quantityInput}>
                <TextInput
                  style={styles.quantityTextInput}
                  value={quantity.toString()}
                  onChangeText={(text) => setQuantity(parseInt(text) || 1)}
                  keyboardType="numeric"
                />
                <View style={styles.quantityButtons}>
                  <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
                    <Ionicons name="chevron-up" size={24} color="black" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
                    <Ionicons name="chevron-down" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description du produit"
              multiline
            />
          </View>
          
          {/* Illustration */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Illustration</Text>
            <View style={styles.imageOptions}>
              {imageSuggestions.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={[
                    styles.imageOption,
                    selectedImage === item.image && !item.isAddButton && styles.selectedImageOption
                  ]}
                >
                  {item.isAddButton ? (
                    <View style={styles.addImageButton}>
                      <Feather name="plus" size={40} color="#888" />
                    </View>
                  ) : (
                    <Image source={{ uri: item.image }} style={styles.optionImage} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Paramètres */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Paramètres</Text>
            <TouchableOpacity 
              style={styles.pinnedOption}
              onPress={toggleIsPinned}
            >
              <View style={[styles.pinnedSwitch, isPinned && styles.pinnedSwitchActive]}>
                <AntDesign 
                  name="star" 
                  size={24} 
                  color={isPinned ? "black" : "white"} 
                />
              </View>
              <Text style={styles.pinnedText}>Épinglé en haut de liste</Text>
            </TouchableOpacity>
          </View>
          
          {/* Espace pour le bouton d'enregistrement */}
          <View style={styles.saveButtonSpacer} />
        </ScrollView>
        
        {/* Bouton d'enregistrement */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  rowSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  halfSection: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  priceTextInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  currencyContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  quantityTextInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  quantityButtons: {
    width: 60,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  quantityButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageOption: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedImageOption: {
    borderWidth: 3,
    borderColor: '#000',
  },
  addImageButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pinnedOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedSwitch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pinnedSwitchActive: {
    backgroundColor: '#FFD700',
  },
  pinnedText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButtonSpacer: {
    height: 80,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditWishScreen;