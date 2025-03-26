import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import TransferWishModal from '../components/TransferWishModal';

// Types
type ProductDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

interface Product {
  id: string;
  name: string;
  price: string;
  quantity: number;
  description: string;
  image: string;
  isFavorite: boolean;
}

// Constants
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const BUTTON_HEIGHT = 60;
const BUTTON_RADIUS = 30;
const FAVORITE_ICON_SIZE = 24;
const ACTION_ICON_SIZE = 28;
const CART_ICON_SIZE = 24;

// Mock data - in a real app, this would come from an API
const PRODUCT_DATA: Product = {
  id: 'p1',
  name: 'Ceinture Diesel',
  price: '139.90 €',
  quantity: 1,
  description: 'En noir et argent mate',
  image: 'https://api.a0.dev/assets/image?text=black%20leather%20belt%20with%20silver%20buckle&aspect=1:1&seed=123',
  isFavorite: false
};

// Extracted components for better organization and reusability
const HeaderButton = React.memo(({ onPress, iconName }: { onPress: () => void; iconName: any }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.headerButton}
    accessibilityRole="button"
  >
    <Ionicons name={iconName} size={ACTION_ICON_SIZE} color="black" />
  </TouchableOpacity>
));

const ActionButton = React.memo(({ 
  onPress, 
  text, 
  icon = null 
}: { 
  onPress: () => void; 
  text: string; 
  icon?: React.ReactNode | null 
}) => (
  <TouchableOpacity 
    style={styles.actionButton} 
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={text}
  >
    <Text style={styles.buttonText}>{text}</Text>
    {icon}
  </TouchableOpacity>
));

const FavoriteButton = React.memo(({ isFavorite, onToggle }: { isFavorite: boolean; onToggle: () => void }) => (
  <TouchableOpacity 
    onPress={onToggle} 
    style={styles.favoriteButton}
    accessibilityRole="button"
    accessibilityLabel={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    accessibilityState={{ selected: isFavorite }}
  >
    <View style={styles.favoriteIconContainer}>
      <AntDesign name="star" size={FAVORITE_ICON_SIZE} color={isFavorite ? "black" : "#DDDDDD"} />
    </View>
  </TouchableOpacity>
));

const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const { productId } = route.params;
  
  // State management with a reducer for related state
  const [state, setState] = useState({
    product: PRODUCT_DATA,
    isLoading: true,
    showTransferModal: false,
    error: null
  });

  // Extract state variables for cleaner code
  const { product, isLoading, showTransferModal, error } = state;

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        // Simulate API call
        console.log(`Fetching details for product: ${productId}`);
        
        // In a real app, this would be an API call
        setTimeout(() => {
          setState(prevState => ({
            ...prevState,
            product: PRODUCT_DATA,
            isLoading: false
          }));
        }, 500);
      } catch (err) {
        setState(prevState => ({
          ...prevState,
          error: 'Failed to load product details',
          isLoading: false
        }));
        console.error('Error fetching product data:', err);
      }
    };

    fetchProductData();
  }, [productId]);

  // Memoized event handlers to prevent unnecessary recreations
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleTransfer = useCallback(() => {
    setState(prevState => ({ ...prevState, showTransferModal: true }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState(prevState => ({ ...prevState, showTransferModal: false }));
  }, []);

  const handleModify = useCallback(() => {
    navigation.navigate('EditWish', { productId });
  }, [navigation, productId]);

  const toggleFavorite = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      product: {
        ...prevState.product,
        isFavorite: !prevState.product.isFavorite
      }
    }));
  }, []);

  // Memoized sections to prevent unnecessary re-renders
  const renderHeader = useMemo(() => (
    <View style={styles.header}>
      <HeaderButton onPress={handleClose} iconName="close" />
      <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
        {product.name}
      </Text>
      <HeaderButton onPress={() => {}} iconName="share-outline" />
    </View>
  ), [handleClose, product.name]);

  const renderActionButtons = useMemo(() => (
    <View style={styles.actionButtons}>
      <ActionButton onPress={handleModify} text="Modifier" />
      <ActionButton 
        onPress={handleTransfer} 
        text="Transférer" 
        icon={<Ionicons name="arrow-forward" size={20} color="black" />} 
      />
    </View>
  ), [handleModify, handleTransfer]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>Chargement du produit...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={handleClose}>
          <Text style={styles.reloadButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader}
        
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMethod="resize"
              fadeDuration={300}
            />
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>{product.price}</Text>
            <Text style={styles.quantity}>
              Quantité : {product.quantity}
            </Text>
          </View>

          {renderActionButtons}

          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>Informations</Text>
              <FavoriteButton 
                isFavorite={product.isFavorite} 
                onToggle={toggleFavorite} 
              />
            </View>
            
            <Text style={styles.infoText}>{product.description}</Text>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.buyButton}
          accessibilityRole="button"
          accessibilityLabel="Acheter"
        >
          <Ionicons name="cart-outline" size={CART_ICON_SIZE} color="white" />
          <Text style={styles.buyButtonText}>Acheter</Text>
        </TouchableOpacity>

        <TransferWishModal
          visible={showTransferModal}
          onClose={handleCloseModal}
        />
      </SafeAreaView>
    </View>
  );
};

// Optimized StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  // Content styles
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
  },
  // Price section
  priceSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quantity: {
    fontSize: 18,
    color: '#666',
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    gap: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  // Info section
  infoSection: {
    paddingHorizontal: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  // Buy button
  buyButton: {
    flexDirection: 'row',
    backgroundColor: 'black',
    margin: 20,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default React.memo(ProductDetailScreen);