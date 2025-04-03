import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useWishlist } from '../context/WishlistContext';
import { WishlistType, WishItemType } from '../api/wishlists';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

// Historique de recherche - serait idéalement persistant via AsyncStorage
const SEARCH_HISTORY = [
  'Air force one',
  'Cadeau papa',
  'Livre',
  'Anniversaire'
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistResults, setWishlistResults] = useState<WishlistType[]>([]);
  const [itemResults, setItemResults] = useState<WishItemType[]>([]);
  
  const { wishlists, wishItems } = useWishlist();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Effectuer la recherche quand la requête change
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery);
    } else {
      setWishlistResults([]);
      setItemResults([]);
    }
  }, [searchQuery, wishlists, wishItems]);

  // Fonction de recherche
  const performSearch = (query: string) => {
    setIsLoading(true);
    
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Rechercher dans les listes
      const filteredWishlists = wishlists.filter(wishlist =>
        wishlist.title.toLowerCase().includes(normalizedQuery) ||
        (wishlist.description && wishlist.description.toLowerCase().includes(normalizedQuery))
      );
      
      // Rechercher dans les vœux
      const filteredItems = wishItems.filter(item =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        (item.description && item.description.toLowerCase().includes(normalizedQuery))
      );
      
      setWishlistResults(filteredWishlists);
      setItemResults(filteredItems);
      setShowResults(true);
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveHistoryItem = (item: string) => {
    // Dans une vraie app, supprimer de l'historique via AsyncStorage
    console.log('Remove from history:', item);
  };

  const handleSelectItem = (item: WishItemType) => {
    // Naviguer vers la page de détail du produit
    onClose();
    navigation.navigate('ProductDetail', { productId: item.id });
  };
  
  const handleSelectWishlist = (wishlist: WishlistType) => {
    // Naviguer vers la page de détail de la wishlist
    onClose();
    navigation.navigate('WishlistDetail', { wishlistId: wishlist.id });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={24} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
              autoFocus
            />
          </View>

          <TouchableOpacity style={styles.scanButton}>
            <Ionicons name="qr-code-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Recherche en cours...</Text>
            </View>
          )}
          
          {searchQuery.length === 0 ? (
            // Afficher l'historique de recherche si aucune recherche n'est en cours
            <>
              <Text style={styles.sectionTitle}>Recherches récentes</Text>
              {SEARCH_HISTORY.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <TouchableOpacity
                    style={styles.historyItemContent}
                    onPress={() => setSearchQuery(item)}
                  >
                    <AntDesign name="clockcircleo" size={18} color="#999" />
                    <Text style={styles.historyText}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveHistoryItem(item)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : !isLoading && (
            // Afficher les résultats de recherche
            <>
              {wishlistResults.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Listes de souhaits</Text>
                  {wishlistResults.map((wishlist) => (
                    <TouchableOpacity
                      key={wishlist.id}
                      style={styles.resultItem}
                      onPress={() => handleSelectWishlist(wishlist)}
                    >
                      <View style={styles.wishlistIconContainer}>
                        <Ionicons name="list" size={24} color="#000" />
                      </View>
                      <View style={styles.resultItemContent}>
                        <Text style={styles.resultItemTitle} numberOfLines={1}>
                          {wishlist.title}
                        </Text>
                        {wishlist.description && (
                          <Text style={styles.resultItemDescription} numberOfLines={1}>
                            {wishlist.description}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {itemResults.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Vœux</Text>
                  <View style={styles.resultsGrid}>
                    {itemResults.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.productCard}
                        onPress={() => handleSelectItem(item)}
                      >
                        <Image
                          source={{ uri: item.image || 'https://api.a0.dev/assets/image?text=no%20image&aspect=1:1' }}
                          style={styles.productImage}
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                          <View style={styles.brandContainer}>
                            <Text style={styles.productPrice}>{item.price || ''}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {wishlistResults.length === 0 && itemResults.length === 0 && (
                <View style={styles.emptyResultsContainer}>
                  <Ionicons name="search-outline" size={64} color="#DDD" />
                  <Text style={styles.emptyResultsText}>
                    Aucun résultat trouvé pour "{searchQuery}"
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    padding: 5,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#000',
  },
  scanButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  removeButton: {
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  wishlistIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resultItemContent: {
    flex: 1,
    marginRight: 10,
  },
  resultItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  resultItemDescription: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  productImage: {
    width: '100%',
    height: CARD_WIDTH,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLogo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default SearchModal;