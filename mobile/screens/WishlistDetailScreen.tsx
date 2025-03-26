import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  BackHandler
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import TransferWishModal from '../components/TransferWishModal';

type WishlistDetailScreenRouteProp = RouteProp<RootStackParamList, 'WishlistDetail'>;

// Mock data pour les wishlists
const MY_WISHLISTS = [
  {
    id: '2',
    type: 'list',
    title: 'Mes favoris',
    description: 'Ma liste de favoris du moment',
    coverImage: 'https://api.a0.dev/assets/image?text=coffee%20beans%20different%20varieties&aspect=16:9&seed=789',
    isFavorite: true,
    isOwner: true,
    products: [
      {
        id: 'p1',
        name: 'Ceinture Diesel',
        price: '129 €',
        image: 'https://api.a0.dev/assets/image?text=black%20leather%20belt%20with%20silver%20buckle&aspect=1:1&seed=123',
        isFavorite: true
      },
      {
        id: 'p3',
        name: 'Nike Chaussettes de sport',
        price: '189.99 €',
        image: 'https://api.a0.dev/assets/image?text=green%20sports%20car%20lego%20technic&aspect=1:1&seed=789',
        isFavorite: false
      },
      {
        id: 'p5',
        name: 'Nike Chaussettes de sport',
        price: '129.95 €',
        image: 'https://api.a0.dev/assets/image?text=nike%20dunk%20low%20black%20white%20sneakers&aspect=1:1&seed=131415',
        isFavorite: false
      },
      {
        id: 'p6',
        name: 'Ajouter',
        price: '',
        image: '',
        isAddButton: true
      }
    ]
  }
];

// Mock data pour la wishlist d'un ami
const WISHLIST_DETAIL = {
  id: '1',
  title: "70's inspirations",
  description: "Ici mes inspirations des années 70's...",
  coverImage: 'https://api.a0.dev/assets/image?text=70s%20retro%20fashion%20woman%20vintage%20car&aspect=16:9',
  isOwner: false,
  products: [
    {
      id: 'p1',
      name: 'Amazon Rings',
      price: '17.90 €',
      image: 'https://api.a0.dev/assets/image?text=colorful%20resin%20plastic%20rings%20set&aspect=1:1&seed=321',
      isFavorite: true
    },
    {
      id: 'p2',
      name: 'SAC SUPER MINI GUCCI',
      price: '1750 €',
      image: 'https://api.a0.dev/assets/image?text=small%20white%20designer%20handbag%20with%20gold%20chain&aspect=1:1&seed=654',
      isFavorite: true
    },
    {
      id: 'p3',
      name: 'Zara Jean',
      price: '59.99 €',
      image: 'https://api.a0.dev/assets/image?text=light%20blue%20flared%20jeans%20denim%20seventies&aspect=1:1&seed=987',
      isFavorite: true
    },
    {
      id: 'p4',
      name: 'Asos Boots',
      price: '87.95 €',
      image: 'https://api.a0.dev/assets/image?text=suede%20beige%20ankle%20boots&aspect=1:1&seed=135',
      isFavorite: false
    }
  ]
};

// Constantes pour les dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WishlistDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WishlistDetailScreenRouteProp>();
  const { wishlistId } = route.params || { wishlistId: '2' };
  
  // Déterminer si c'est la wishlist de l'utilisateur
  const isMyWishlist = wishlistId === '2';
  
  // États pour le composant
  const [wishlistData, setWishlistData] = useState(isMyWishlist ? MY_WISHLISTS[0] : WISHLIST_DETAIL);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>({});
  const [showTransferModal, setShowTransferModal] = useState(false);
  const selectedCount = Object.values(selectedItems).filter(v => v).length;
  
  // Initialisation
  useEffect(() => {
    // Gérer le bouton retour
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );
    
    return () => {
      backHandler.remove();
    };
  }, []);
  
  // Gestion du bouton retour
  const handleBackPress = () => {
    if (showTransferModal) {
      setShowTransferModal(false);
      return true;
    } else if (isSelectionMode) {
      handleCancelSelection();
      return true;
    }
    return false;
  };

  // Gestionnaires d'événements
  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleShare = () => {
    setShowTransferModal(true);
  };

  const toggleFavorite = (productId: string) => {
    setWishlistData(prev => ({
      ...prev,
      products: prev.products.map(product => 
        product.id === productId 
          ? { ...product, isFavorite: !product.isFavorite } 
          : product
      )
    }));
  };

  const handleAddToCart = (productId: string) => {
    console.log('Add to cart:', productId);
    // Dans une vraie app, implémentez l'ajout au panier ici
  };
  
  const handleAddProduct = () => {
    console.log('Add new product to wishlist');
    // Dans une vraie app, naviguer vers l'écran d'ajout de produit
  };
  
  const handleSelect = () => {
    setIsSelectionMode(true);
    setSelectedItems({});
  };
  
  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems({});
  };
  
  const handleToggleSelection = (productId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };
  
  const handleDeleteSelected = () => {
    const selectedIds = Object.entries(selectedItems)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);
      
    if (selectedIds.length === 0) return;
    
    setWishlistData(prev => ({
      ...prev,
      products: prev.products.filter(product => 
        !selectedIds.includes(product.id) || product.isAddButton
      )
    }));
    
    setIsSelectionMode(false);
    setSelectedItems({});
  };
  
  const handleSettings = () => {
    navigation.navigate('WishlistSettings', {
      wishlistData: {
        id: wishlistData.id,
        title: wishlistData.title,
        description: wishlistData.description,
        image: wishlistData.coverImage,
        isPublic: true,
        isFavorite: wishlistData.isFavorite || false
      }
    });
  };

  // Rendu unifié pour toutes les wishlists
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Image de couverture */}
      <Image 
        source={{ uri: wishlistData.coverImage }} 
        style={styles.coverImage} 
      />
      <View style={styles.imageTintOverlay} />
      
      {/* Boutons d'en-tête */}
      <SafeAreaView style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareHeaderButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={28} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bouton de partage */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Partager</Text>
      </TouchableOpacity>
      
      {/* Conteneur principal */}
      <View style={styles.contentContainer}>
        <View style={styles.dividerBar} />
        
        {/* ScrollView contenant les informations et les produits */}
        <ScrollView 
          style={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsContentContainer}
        >
          {/* Info de la wishlist */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{wishlistData.title}</Text>
            <Text style={styles.description}>{wishlistData.description}</Text>
          </View>
          
          {/* Grille de produits */}
          <View style={styles.productsGrid}>
            {wishlistData.products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                {product.isAddButton && isMyWishlist && !isSelectionMode ? (
                  <TouchableOpacity 
                    style={styles.addProductCard}
                    onPress={handleAddProduct}
                  >
                    <View style={styles.addProductIconContainer}>
                      <Feather name="plus" size={40} color="#999" />
                    </View>
                  </TouchableOpacity>
                ) : !product.isAddButton && (
                  <>
                    {isMyWishlist && isSelectionMode ? (
                      <TouchableOpacity 
                        style={[
                          styles.selectionCircle, 
                          selectedItems[product.id] && styles.selectionCircleSelected
                        ]}
                        onPress={() => handleToggleSelection(product.id)}
                      >
                        {selectedItems[product.id] && (
                          <View style={styles.selectionDot} />
                        )}
                      </TouchableOpacity>
                    ) : product.isFavorite && (
                      <View style={styles.favoriteIconContainer}>
                        <AntDesign name="star" size={16} color="black" />
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.productImageContainer}
                      onPress={() => isMyWishlist && isSelectionMode 
                        ? handleToggleSelection(product.id) 
                        : navigation.navigate('ProductDetail', { productId: product.id })
                      }
                    >
                      <Image source={{ uri: product.image }} style={styles.productImage} />
                    </TouchableOpacity>
                    
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      
                      {isMyWishlist ? (
                        <View style={styles.priceAndButtonContainer}>
                          <Text style={styles.productPrice}>{product.price}</Text>
                          {!isSelectionMode && (
                            <TouchableOpacity 
                              style={styles.arrowButton}
                              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                            >
                              <Ionicons name="arrow-forward" size={20} color="white" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        <View style={styles.priceAndCartContainer}>
                          <Text style={styles.productPrice}>{product.price}</Text>
                          <TouchableOpacity 
                            style={styles.cartButton}
                            onPress={() => handleAddToCart(product.id)}
                          >
                            <Feather name="shopping-bag" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
        
        {/* Barre d'actions en bas pour mes wishlists uniquement */}
        {isMyWishlist && (
          isSelectionMode ? (
            <View style={styles.selectionBottomBar}>
              <TouchableOpacity 
                style={styles.selectionBackButton} 
                onPress={handleCancelSelection}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              
              <View style={styles.selectionCountContainer}>
                <Text style={styles.selectionCountText}>
                  {selectedCount} {selectedCount === 1 ? 'Sélectionné' : 'Sélectionnés'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDeleteSelected}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.selectButton} onPress={handleSelect}>
                <Text style={styles.selectButtonText}>Sélectionner</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
                <Ionicons name="settings-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
      
      {/* Modal de partage */}
      {showTransferModal && (
        <TransferWishModal 
          visible={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          wishlistId={wishlistData.id}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  coverImage: {
    width: '100%',
    height: 350,
    position: 'absolute',
    top: 0,
  },
  imageTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 250,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 5,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 320,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  dividerBar: {
    width: 60,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  infoContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  productsContainer: {
    flex: 1,
  },
  productsContentContainer: {
    paddingBottom: 100, // Espace pour les actions en bas
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  productCard: {
    width: '48%',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f7f7f7',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  priceAndCartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceAndButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    minHeight: 250,
  },
  addProductIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 15,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  actionButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectionCircle: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    backgroundColor: 'white',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCircleSelected: {
    borderColor: 'black',
    backgroundColor: 'white',
  },
  selectionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'black',
  },
  selectionBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectionBackButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCountContainer: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  selectionCountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WishlistDetailScreen;