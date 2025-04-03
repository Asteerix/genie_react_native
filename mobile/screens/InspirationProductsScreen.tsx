import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  TextInput
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation'; // Assuming RootStackParamList is correctly defined
import { ProductItem } from '../types/products'; // Use centralized ProductItem
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Types specific to this screen
type InspirationProductsScreenRouteProp = RouteProp<RootStackParamList, 'InspirationProducts'>;
type InspirationProductsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'InspirationProducts'>;

// Dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH / 2 - 25;
const ITEM_HEIGHT = 240;

// --- AnimatedTouchable Component (Copied from BrandProductsScreen) ---
interface AnimatedTouchableProps {
  style?: any;
  onPress?: () => void;
  children: React.ReactNode;
  scale?: number;
  disabled?: boolean;
}

const AnimatedTouchable = React.memo(({ style, onPress, children, scale = 0.95, disabled = false }: AnimatedTouchableProps) => {
  const animatedValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(animatedValue, { toValue: scale, useNativeDriver: true, speed: 25, bounciness: 4 }).start();
  }, [animatedValue, scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(animatedValue, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 4 }).start();
  }, [animatedValue]);

  const animatedStyle = { transform: [{ scale: animatedValue }] };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </TouchableOpacity>
  );
});
// --- End AnimatedTouchable Component ---


// --- ProductItemComponent (Copied and adapted slightly if needed) ---
const ProductItemComponent = React.memo(({ item, onPress }: { item: ProductItem, onPress: () => void }) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 600, delay: 100 * Math.random(), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 550, delay: 100 * Math.random(), useNativeDriver: true }),
    ]).start();
  }, []);

  const formattedPrice = item.price ? `${item.price.toFixed(2)} ${item.currency || '€'}` : '';

  return (
    <AnimatedTouchable
      style={[styles.productItem, { opacity: opacityAnim, transform: [{ translateY }] }]}
      onPress={onPress}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150?text=No+Image' }}
        style={styles.productImage}
        resizeMode="contain" // Keep contain as requested previously
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productPrice}>{formattedPrice}</Text>
        <View style={styles.viewButtonContainer}>
          <Text style={styles.viewButtonText}>voir</Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
});
// --- End ProductItemComponent ---


// --- Main Screen Component ---
const InspirationProductsScreen: React.FC = () => {
  const navigation = useNavigation<InspirationProductsScreenNavigationProp>();
  const route = useRoute<InspirationProductsScreenRouteProp>();
  const { inspirationId, inspirationName } = route.params;

  const [products, setProducts] = useState<ProductItem[]>([]); // Original list
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]); // Filtered list
  const [searchQuery, setSearchQuery] = useState(''); // Search input state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products for inspiration
  useEffect(() => {
    const fetchInspirationProducts = async () => {
      setIsLoading(true);
      setError(null);
      // Revenir au chemin original
      const url = `${API_BASE_URL}/api/scraper/inspirations/${inspirationId}/products`;
      console.log("Fetching products for inspiration:", url);

      try {
        const response = await axios.get<ProductItem[]>(url);

        if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} products for inspiration ${inspirationId}`);
          setProducts(response.data);
          setFilteredProducts(response.data); // Initialize filtered list
        } else {
           console.warn(`No products or invalid format received for inspiration ${inspirationId}`);
           setProducts([]);
           setFilteredProducts([]);
          // Optionally throw an error or set a specific message
          // throw new Error('Format de données incorrect');
        }

        setIsLoading(false);
      } catch (err) {
        console.error(`Erreur lors de la récupération des produits pour l'inspiration ${inspirationId}:`, err);
        setError(`Impossible de charger les produits pour "${inspirationName}"`);
        setIsLoading(false);
      }
    };

    fetchInspirationProducts();
  }, [inspirationId, inspirationName]); // Depend on inspirationId and name

  // Handle product press (navigates to ProductDetail)
   const handleProductPress = useCallback((product: ProductItem) => {
     navigation.navigate('ProductDetail', {
       productId: product.id,
       // Pass relevant info if needed, like inspiration context
       isInspiration: true,
       inspirationName: inspirationName,
       // Revenir au chemin original
       apiPath: `/api/scraper/inspirations/${inspirationId}/products` // Keep context
     });
   }, [navigation, inspirationId, inspirationName]);

  // Handle back press
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

   // Handle search query change
   const handleSearch = useCallback((query: string) => {
     setSearchQuery(query);
     if (query) {
       const lowerCaseQuery = query.toLowerCase();
       const filtered = products.filter(product =>
         product.title.toLowerCase().includes(lowerCaseQuery)
       );
       setFilteredProducts(filtered);
     } else {
       setFilteredProducts(products); // Reset to full list if query is empty
     }
   }, [products]);

  // Render product item
  const renderProductItem = useCallback(({ item }: { item: ProductItem }) => (
    <ProductItemComponent
      item={item}
      onPress={() => handleProductPress(item)}
    />
  ), [handleProductPress]);

  // --- Render Logic ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonSmall} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{inspirationName}</Text>
        <View style={styles.rightPlaceholder} />
      </View>

       {/* Search Input */}
       <View style={styles.searchContainer}>
         <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
         <TextInput
           style={styles.searchInput}
           placeholder="Rechercher un produit..."
           placeholderTextColor="#999"
           value={searchQuery}
           onChangeText={handleSearch}
           clearButtonMode="while-editing"
         />
       </View>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={50} color="#999" />
           <Text style={styles.emptyText}>{searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible pour cette inspiration'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.productsList}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
        />
      )}
    </SafeAreaView>
  );
};

// --- Styles (Copied from BrandProductsScreen, adjust if needed) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
   searchContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#f0f0f0',
     borderRadius: 10,
     marginHorizontal: 15,
     marginTop: 10,
     marginBottom: 5,
     paddingHorizontal: 10,
     height: 40,
   },
   searchIcon: {
     marginRight: 8,
   },
   searchInput: {
     flex: 1,
     fontSize: 16,
     color: '#333',
   },
  backButtonSmall: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, // Allow title to take space but be centered
    marginHorizontal: 10, // Add some margin
  },
  rightPlaceholder: {
    width: 24 + 5, // Match back button padding
  },
  productsList: {
    padding: 15,
  },
  productItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginHorizontal: 5,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#f8f8f8', // Added background for contain
  },
  productInfo: {
    padding: 10,
    flex: 1, // Allow info to take remaining space
    justifyContent: 'space-between', // Push price/button down
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4, // Reduced margin
    // height: 40, // Removed fixed height
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6, // Reduced margin
  },
 viewButtonContainer: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 28,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
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
  backButton: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50, // Add some margin top
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default React.memo(InspirationProductsScreen);