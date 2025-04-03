import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  BackHandler,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import TransferWishModal from '../components/TransferWishModal';
import { useWishlist } from '../context/WishlistContext';
import { WishlistType, WishItemType } from '../api/wishlists';
import { toast } from 'sonner-native';

type WishlistDetailScreenRouteProp = RouteProp<RootStackParamList, 'WishlistDetail'>;

// Constantes pour les dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2; // 40 = padding horizontal du container

const WishlistDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WishlistDetailScreenRouteProp>();
  const { wishlistId } = route.params;
  
  const { 
    getWishlist, 
    getItems, 
    removeWishItem, 
    editWishItem,
    reserveItem,
    shareWithUser
  } = useWishlist();
  
  // États pour le composant
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wishlistData, setWishlistData] = useState<WishlistType | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishItemType[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>({});
  const [showTransferModal, setShowTransferModal] = useState(false);
  const selectedCount = Object.values(selectedItems).filter(v => v).length;
  
  // Charger les données de la wishlist
  useEffect(() => {
    const loadWishlistData = async () => {
      setIsLoading(true);
      try {
        const wishlist = await getWishlist(wishlistId);
        setWishlistData(wishlist);
        
        if (wishlist.items && wishlist.items.length > 0) {
          setWishlistItems(wishlist.items);
        } else {
          const items = await getItems(wishlistId);
          setWishlistItems(items);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la wishlist:', error);
        toast.error('Impossible de charger la wishlist');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWishlistData();
  }, [wishlistId]);
  
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
  }, [showTransferModal, isSelectionMode]);
  
  // Gestion du bouton retour
  const handleBackPress = useCallback(() => {
    if (showTransferModal) {
      setShowTransferModal(false);
      return true;
    } else if (isSelectionMode) {
      handleCancelSelection();
      return true;
    }
    return false;
  }, [showTransferModal, isSelectionMode]);

  // Gestionnaires d'événements
  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleShare = () => {
    setShowTransferModal(true);
  };

  const toggleFavorite = async (itemId: string) => {
    try {
      const itemToUpdate = wishlistItems.find(item => item.id === itemId);
      if (!itemToUpdate) return;
      
      await editWishItem(itemId, { isFavorite: !itemToUpdate.isFavorite });
      
      setWishlistItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, isFavorite: !item.isFavorite } 
            : item
        )
      );
    } catch (error) {
      console.error('Erreur lors de la modification du vœu:', error);
      toast.error('Erreur lors de la modification du vœu');
    }
  };

  const handleAddToCart = async (itemId: string) => {
    try {
      await reserveItem(itemId, true);
      setWishlistItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, isReserved: true } 
            : item
        )
      );
      toast.success('Produit réservé avec succès');
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast.error('Erreur lors de la réservation');
    }
  };
  
  const handleAddProduct = () => {
    navigation.navigate('SearchScreen', { wishlistId });
  };
  
  const handleSelect = () => {
    setIsSelectionMode(true);
    setSelectedItems({});
  };
  
  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems({});
  };
  
  const handleToggleSelection = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  const handleDeleteSelected = async () => {
    const selectedIds = Object.entries(selectedItems)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);
      
    if (selectedIds.length === 0) return;
    
    try {
      // Supprimer chaque item sélectionné
      for (const itemId of selectedIds) {
        await removeWishItem(itemId);
      }
      
      // Mettre à jour l'état local
      setWishlistItems(prev => 
        prev.filter(item => !selectedIds.includes(item.id))
      );
      
      toast.success('Vœux supprimés avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression des vœux:', error);
      toast.error('Erreur lors de la suppression des vœux');
    } finally {
      setIsSelectionMode(false);
      setSelectedItems({});
    }
  };
  
  const handleSettings = () => {
    if (!wishlistData) return;
    
    navigation.navigate('WishlistSettings', {
      wishlistId: wishlistData.id
    });
  };

  // Afficher un indicateur de chargement
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Chargement de la wishlist...</Text>
      </View>
    );
  }

  // Si les données de la wishlist ne sont pas disponibles
  if (!wishlistData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Impossible de charger la wishlist</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Le reste du rendu une fois les données chargées
  const isMyWishlist = wishlistData.isOwner;

  // Rendu unifié pour toutes les wishlists
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Image de couverture */}
      <Image 
        source={{ 
          uri: wishlistData.coverImage || 'https://api.a0.dev/assets/image?text=wishlist&aspect=16:9' 
        }} 
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
            {/* Afficher le bouton d'ajout pour les propriétaires de la wishlist */}
            {isMyWishlist && !isSelectionMode && (
              <View style={styles.productCard}>
                <TouchableOpacity 
                  style={styles.addProductCard}
                  onPress={handleAddProduct}
                >
                  <Feather name="plus" size={40} color="#999" />
                  <Text style={styles.addProductText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Afficher les items de la wishlist */}
            {wishlistItems.map((item) => (
              <View key={item.id} style={styles.productCard}>
                {isMyWishlist && isSelectionMode ? (
                  <TouchableOpacity 
                    style={[
                      styles.selectionCircle, 
                      selectedItems[item.id] && styles.selectionCircleSelected
                    ]}
                    onPress={() => handleToggleSelection(item.id)}
                  >
                    {selectedItems[item.id] && (
                      <View style={styles.selectionDot} />
                    )}
                  </TouchableOpacity>
                ) : item.isFavorite && (
                  <View style={styles.favoriteIconContainer}>
                    <AntDesign name="star" size={16} color="black" />
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.productImageContainer}
                  onPress={() => isMyWishlist && isSelectionMode 
                    ? handleToggleSelection(item.id) 
                    : navigation.navigate('ProductDetail', { productId: item.id })
                  }
                >
                  <Image 
                    source={{ 
                      uri: item.imageURL || 'https://api.a0.dev/assets/image?text=product&aspect=1:1' 
                    }} 
                    style={styles.productImage} 
                  />
                </TouchableOpacity>
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  
                  {isMyWishlist ? (
                    <View style={styles.priceAndButtonContainer}>
                      <Text style={styles.productPrice}>
                        {item.price ? `${item.price} ${item.currency || '€'}` : ''}
                      </Text>
                      {!isSelectionMode && (
                        <TouchableOpacity 
                          style={styles.arrowButton}
                          onPress={() => navigation.navigate('EditWish', { wishId: item.id })}
                        >
                          <Ionicons name="arrow-forward" size={20} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={styles.priceAndCartContainer}>
                      <Text style={styles.productPrice}>
                        {item.price ? `${item.price} ${item.currency || '€'}` : ''}
                      </Text>
                      <TouchableOpacity 
                        style={[
                          styles.cartButton,
                          item.isReserved && styles.reservedButton
                        ]}
                        onPress={() => handleAddToCart(item.id)}
                        disabled={item.isReserved}
                      >
                        <Feather 
                          name={item.isReserved ? "check" : "shopping-bag"} 
                          size={16} 
                          color="white" 
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
            
            {/* Message si aucun produit n'est disponible */}
            {wishlistItems.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  Aucun vœu dans cette liste pour le moment
                </Text>
                {isMyWishlist && (
                  <TouchableOpacity 
                    style={styles.addFirstItemButton}
                    onPress={handleAddProduct}
                  >
                    <Text style={styles.addFirstItemButtonText}>
                      Ajouter votre premier vœu
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
                disabled={selectedCount === 0}
              >
                <Ionicons name="trash-outline" size={24} color={selectedCount === 0 ? "#ccc" : "#FF3B30"} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomActions}>
              <TouchableOpacity 
                style={styles.selectButton} 
                onPress={handleSelect}
                disabled={wishlistItems.length === 0}
              >
                <Text style={[
                  styles.selectButtonText,
                  wishlistItems.length === 0 && { color: '#aaa' }
                ]}>
                  Sélectionner
                </Text>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    marginBottom: CARD_GAP,
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
    height: '65%', // Réduit davantage pour donner plus d'espace à la zone d'info
    backgroundColor: '#f7f7f7',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 8,
    paddingBottom: 15, // Padding inférieur significativement augmenté
    height: '35%', // Zone d'info agrandie (35% de la hauteur de la carte)
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -5, // Déplace le bouton beaucoup plus vers le haut
  },
  reservedButton: {
    backgroundColor: '#4CAF50',
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2, // Déplace le bouton légèrement vers le haut
  },
  addProductCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  addProductText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
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
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 14,
    height: 14,
    borderRadius: 7,
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
  emptyStateContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addFirstItemButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  addFirstItemButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WishlistDetailScreen;