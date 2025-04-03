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
  TextInput // Import TextInput
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ProductItem } from '../types/products'; // Import ProductItem
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Types
// Removed local ProductItem definition

type BrandProductsScreenRouteProp = RouteProp<RootStackParamList, 'BrandProducts'>;
type BrandProductsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BrandProducts'>;

// Dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH / 2 - 25;
const ITEM_HEIGHT = 240;

// AnimatedTouchable Component
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
    Animated.spring(animatedValue, {
      toValue: scale,
      useNativeDriver: true,
      speed: 25,
      bounciness: 4,
    }).start();
  }, [animatedValue, scale]);
  
  const handlePressOut = useCallback(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 4,
    }).start();
  }, [animatedValue]);
  
  const animatedStyle = {
    transform: [{ scale: animatedValue }],
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

// Product Item Component
const ProductItemComponent = React.memo(({ item, onPress }: { item: ProductItem, onPress: () => void }) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay: 100 * Math.random(),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 550,
        delay: 100 * Math.random(),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const formattedPrice = item.price ? `${item.price.toFixed(2)} ${item.currency || '€'}` : '';
  
  return (
    <AnimatedTouchable 
      style={[
        styles.productItem,
        { 
          opacity: opacityAnim, 
          transform: [{ translateY }] 
        }
      ]}
      onPress={onPress}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150?text=No+Image' }}
        style={styles.productImage}
        resizeMode="contain" // Changed from 'cover' to 'contain'
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

const BrandProductsScreen: React.FC = () => {
  const navigation = useNavigation<BrandProductsScreenNavigationProp>();
  const route = useRoute<BrandProductsScreenRouteProp>();
  const { brandId, brandName } = route.params;
  
  const [products, setProducts] = useState<ProductItem[]>([]); // Original list
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]); // Filtered list
  const [searchQuery, setSearchQuery] = useState(''); // Search input state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch products for brand
  useEffect(() => {
    const fetchBrandProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get<ProductItem[]>(
          // Revenir au chemin original
          `${API_BASE_URL}/api/scraper/brands/${brandId}/products`
        );
        
        if (response.data && Array.isArray(response.data)) {
          setProducts(response.data);
          setFilteredProducts(response.data); // Initialize filtered list
        } else {
          throw new Error('Format de données incorrect');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des produits:', err);
        setError('Impossible de charger les produits de cette marque');
        setIsLoading(false);
      }
    };
    
    fetchBrandProducts();
  }, [brandId]);
  
  // Handle product press
  const handleProductPress = useCallback((product: ProductItem) => {
    navigation.navigate('ProductDetail', {
      productId: product.id,
      isBrand: true, 
      brandName: brandName,
      // Revenir au chemin original
      apiPath: `/api/scraper/brands/${brandId}/products`
    });
  }, [navigation, brandId, brandName]);
  
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
        <Text style={styles.headerTitle}>{brandName}</Text>
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
          <Text style={styles.emptyText}>{searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts} // Use filteredProducts for the list
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
  },
  rightPlaceholder: {
    width: 24,
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
    backgroundColor: '#f8f8f8',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    height: 40,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default React.memo(BrandProductsScreen);