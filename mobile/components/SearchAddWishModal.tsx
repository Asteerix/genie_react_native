import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios'; // Import axios
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import * as Clipboard from 'expo-clipboard'; // Import Clipboard
import { toast } from 'sonner-native'; // Import toast
import { useWishlist } from '../context/WishlistContext'; // Import Wishlist context
import { API_BASE_URL } from '../config'; // Import API base URL
import { ProductItem, Brand } from '../types/products'; // Import types
import { RootStackParamList } from '../types/navigation'; // Import the main RootStackParamList

// Remove local limited definition of RootStackParamList

// Use the imported RootStackParamList for NavigationProp
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchAddWishModalProps {
  visible: boolean;
  onClose: () => void;
}

// Removed hardcoded RECENT_SEARCHES
const MAX_RECENT_SEARCHES = 4;
const ASYNC_STORAGE_KEY = 'recentSearches';

// Helper function (can be moved to utils)
const shuffleArray = <T extends any>(array: T[]): T[] => {
  if (!array) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};


// --- Helper Function for Price Parsing ---
const parsePrice = (price: any): number | undefined => {
  if (typeof price === 'number' && !isNaN(price)) {
    return price;
  }
  if (typeof price === 'string') {
    const cleanedPrice = price.replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanedPrice);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  // Return undefined if parsing fails or type is invalid
  return undefined;
};

const SearchAddWishModal: React.FC<SearchAddWishModalProps> = ({
  visible,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();
  // States for initial suggestions
  const [suggestions, setSuggestions] = useState<ProductItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState<string | null>(null);
  // States for active search results
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState<string | null>(null);
  const { wishlists } = useWishlist(); // Get wishlists from context
  // State for actual recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const isMounted = useRef(false); // To prevent state updates on unmounted component

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; }; // Cleanup on unmount
  }, []);

  // Fetch random suggestions when modal becomes visible
  useEffect(() => {
    const fetchRandomSuggestions = async () => {
      if (!visible) {
        return; // Don't fetch if modal is not visible
      }
      if (!isMounted.current) return; // Check mount status

      // Load recent searches when modal becomes visible
      const loadRecentSearches = async () => {
        try {
          const storedSearches = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
          if (storedSearches && isMounted.current) {
            setRecentSearches(JSON.parse(storedSearches));
            console.log("Loaded recent searches:", JSON.parse(storedSearches));
          } else {
             setRecentSearches([]); // Ensure it's an empty array if nothing is stored
          }
        } catch (e) {
          console.error("Failed to load recent searches:", e);
           if (isMounted.current) setRecentSearches([]); // Reset on error
        }
      };
      loadRecentSearches();

      // Fetch random suggestions logic remains
      if (!isMounted.current) return; // Re-check mount status before async operation

      console.log("Search modal visible, fetching random suggestions...");
      setIsLoadingSuggestions(true);
      setErrorSuggestions(null);
      setSuggestions([]); // Clear previous suggestions

      try {
        // 1. Get all brands
        const brandsResponse = await axios.get<Brand[]>(`${API_BASE_URL}/api/scraper/brands`);
        let availableBrands = brandsResponse.data;

        if (!availableBrands || availableBrands.length === 0) {
          throw new Error("No brands available to fetch products from.");
        }

        // 2. Shuffle and select a few brands (e.g., 5)
        availableBrands = shuffleArray(availableBrands);
        const brandsToFetch = availableBrands.slice(0, 5); // Fetch from 5 random brands
        console.log("Fetching suggestions from brands:", brandsToFetch.map(b => b.id));

        // 3. Fetch cached products for selected brands
        const productPromises = brandsToFetch.map(brand =>
          axios.get<ProductItem[]>(`${API_BASE_URL}/api/scraper/cached-brands/${brand.id}/products`)
            .then(res => res.data || []) // Ensure data is an array
            .catch(err => {
              console.warn(`Failed to fetch cached products for ${brand.id}:`, err.message);
              return []; // Return empty array on error for this brand
            })
        );

        const results = await Promise.all(productPromises);
        let combinedProducts = results.flat().filter(p => p && p.id && p.title && p.imageUrl); // Flatten and basic validation

        console.log(`Fetched ${combinedProducts.length} total products from cache.`);

        if (combinedProducts.length === 0) {
           console.warn("No products found in cache for selected brands.");
           // Optionally, could try fetching non-cached here, but sticking to cache for speed
           if (isMounted.current) {
               setSuggestions([]);
               setErrorSuggestions("Aucune suggestion trouvée pour le moment.");
           }
           return; // Exit if no products found
        }


        // 4. Shuffle and take top 4
        const shuffledProducts = shuffleArray(combinedProducts);
        const finalSuggestions = shuffledProducts.slice(0, 4);

        if (isMounted.current) {
            console.log("Setting suggestions:", finalSuggestions.map(p => p.id));
            setSuggestions(finalSuggestions);
        }

      } catch (error: any) {
        console.error("Error fetching random suggestions:", error);
         if (isMounted.current) {
            setErrorSuggestions("Impossible de charger les suggestions.");
         }
      } finally {
         if (isMounted.current) {
            setIsLoadingSuggestions(false);
         }
      }
    };

    fetchRandomSuggestions();

  }, [visible]); // Re-fetch initial suggestions when modal visibility changes

  // --- Debounced Search Effect ---
  useEffect(() => {
    const handler = setTimeout(async () => {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length > 1) {
        console.log(`Searching for: ${trimmedQuery}`);
        setIsLoadingSearch(true);
        setErrorSearch(null);
        setSearchResults([]);

        // --- Save Search Term to History ---
        const saveSearchTerm = async (term: string) => {
          try {
            // 1. Get current history
            const storedSearches = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
            let currentHistory: string[] = storedSearches ? JSON.parse(storedSearches) : [];

            // 2. Remove existing instance of the term (case-insensitive check might be better)
            currentHistory = currentHistory.filter(s => s.toLowerCase() !== term.toLowerCase());

            // 3. Add new term to the beginning
            currentHistory.unshift(term);

            // 4. Limit history size
            currentHistory = currentHistory.slice(0, MAX_RECENT_SEARCHES);

            // 5. Save back to AsyncStorage
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(currentHistory));

            // 6. Update local state
            if (isMounted.current) {
              setRecentSearches(currentHistory);
              console.log("Updated recent searches:", currentHistory);
            }
          } catch (e) {
            console.error("Failed to save recent search:", e);
          }
        };
        // Save the term *after* the search logic (or before, depending on preference)
        await saveSearchTerm(trimmedQuery);
        // --- End Save Search Term ---


        // --- Client-side filtering (Temporary Solution) ---
        const query = trimmedQuery.toLowerCase();
        const filteredResults = suggestions.filter(item =>
          item.title?.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query)
        );

        if (isMounted.current) {
          console.log(`Found ${filteredResults.length} results by filtering suggestions.`);
          setSearchResults(filteredResults);
          if (filteredResults.length === 0) {
            setErrorSearch("Aucun résultat trouvé dans les suggestions.");
          }
        }
        // --- End of Client-side filtering ---

        if (isMounted.current) {
          setIsLoadingSearch(false);
        }
      } else {
        setSearchResults([]);
        setErrorSearch(null);
        setIsLoadingSearch(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, suggestions]); // Add suggestions as dependency for filtering

  // --- Navigation Handlers ---
  const navigateToProductDetail = useCallback((productId: string, productData?: ProductItem) => {
    if (!productData) {
        console.warn(`Product data missing for ID: ${productId}. Cannot navigate.`);
        return;
    }
    // Use the utility function to parse the price safely
    const numericPrice = parsePrice(productData.price);
    const finalPrice = numericPrice !== undefined ? numericPrice : 0; // Default to 0 if undefined

    if (numericPrice === undefined && productData.price !== undefined && productData.price !== null) {
         // Log only if the original price was actually present but unparseable
         console.warn(`Invalid or unparseable price (${productData.price}) for product ${productId}. Defaulting to 0.`);
    }

    const navigationData: ProductItem = { // Ensure the object conforms to ProductItem
        ...productData,
        price: finalPrice, // Assign the guaranteed number
    };

     console.log("Navigating to ProductDetail with:", productId, navigationData);
    navigation.navigate('ProductDetail', { productId, productData: navigationData });
  }, [navigation]);

  // --- Paste Link Handler ---
  // Moved outside useEffect to be accessible
  const handlePasteLink = useCallback(async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      console.log("Clipboard content:", clipboardContent);

      // Basic URL validation (can be improved)
      if (!clipboardContent || (!clipboardContent.startsWith('http://') && !clipboardContent.startsWith('https://'))) {
        toast.error("Le presse-papiers ne contient pas un lien valide.");
        return;
      }

      // Check if user has wishlists
      if (!wishlists || wishlists.length === 0) {
        toast.info("Veuillez d'abord créer une liste de souhaits.");
        // Optionally, navigate to create wishlist screen or show modal
        return;
      }

      // Get the first wishlist ID
      const firstWishlistId = wishlists[0].id;

      // Navigate to AddWish screen with the URL and wishlist ID
      console.log(`Navigating to AddWish with URL: ${clipboardContent} for wishlist: ${firstWishlistId}`);
      navigation.navigate('AddWish', {
        wishlistId: firstWishlistId,
        initialUrl: clipboardContent,
      });

      // Close the modal after navigation
      onClose();

    } catch (error) {
      console.error("Failed to paste link or navigate:", error);
      toast.error("Impossible de coller le lien.");
    }
  }, [navigation, wishlists, onClose]);

  // --- Render Functions ---

  const renderRecentSearch = (search: string) => {
    const handlePress = () => {
      // Set the search query to the recent search term to trigger the search effect
      setSearchQuery(search);
      console.log("Triggering search for recent term:", search);
    };

    const handleRemove = async (termToRemove: string) => {
      console.log("Remove search:", termToRemove);
      try {
        const updatedSearches = recentSearches.filter(s => s !== termToRemove);
        setRecentSearches(updatedSearches); // Update state immediately
        await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(updatedSearches)); // Save updated list
      } catch (e) {
        console.error("Failed to remove recent search:", e);
        // Optionally revert state or show error
      }
    };

    return (
      <View key={search} style={styles.recentSearchItem}>
        <TouchableOpacity onPress={handlePress} style={styles.recentSearchTextContainer}>
          <Text style={styles.recentSearchText}>{search}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemove(search)}>
          <Ionicons name="close" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide" // Standard slide animation
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined} // Use pageSheet on iOS for better look
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* Use arrow-back on Android, close on iOS */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
             <Ionicons name={Platform.OS === 'ios' ? "close-outline" : "arrow-back-outline"} size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
           <TouchableOpacity style={styles.scanButton}>
             <Ionicons name="qr-code-outline" size={24} color="#000" />
           </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Render actual recent searches from state */}
          {recentSearches.map(search => renderRecentSearch(search))}

          {/* Bouton "Coller un lien" */}
          <TouchableOpacity style={styles.pasteLinkButton} onPress={handlePasteLink}>
            <Ionicons name="clipboard-outline" size={20} color="#666" style={styles.pasteIcon} />
            <Text style={styles.pasteLinkText}>ou coller un lien du web</Text>
          </TouchableOpacity>

          {/* Suggestions en grille */}
          <View style={styles.gridContainer}>
            {/* --- Display Search Results or Suggestions --- */}
            {searchQuery.trim().length > 1 ? (
              // Display Search Results
              <>
                {isLoadingSearch && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                  </View>
                )}
                {!isLoadingSearch && errorSearch && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorSearch}</Text>
                  </View>
                )}
                {!isLoadingSearch && !errorSearch && searchResults.length > 0 && searchResults.map((item) => {
                  // Re-use rendering logic, but with 'item' from searchResults
                  const formatPrice = (price: number | string | undefined | null, currency: string | undefined | null): string => {
                    let numPrice: number | null | undefined = null;
                    if (typeof price === 'number') {
                      numPrice = price;
                    } else if (typeof price === 'string') {
                      const cleaned = price.replace(',', '.').replace(/[^0-9.]/g, '');
                      const parsed = parseFloat(cleaned);
                      if (!isNaN(parsed)) { // Check if parsing was successful
                        numPrice = parsed;
                      }
                    }
                    // Now check if numPrice is a valid number before using methods
                    if (typeof numPrice === 'number' && !isNaN(numPrice)) {
                      return `${numPrice.toFixed(2).replace('.', ',')} ${currency || '€'}`;
                    }
                    return ''; // Return empty string if price is invalid or null/undefined
                  };
                  const displayPrice = formatPrice(item.price, item.currency);
                  const brandLogo = item.brand ? `https://logo.clearbit.com/${item.brand.toLowerCase().replace(/\s+/g, '')}.com?size=40` : undefined;

                  return (
                    <TouchableOpacity
                      key={`search-${item.id}`} // Ensure unique key for search results
                      style={styles.gridItem}
                      onPress={() => navigateToProductDetail(item.id, item)}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.gridImage} resizeMode="contain"/>
                      <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.gridFooter}>
                        {brandLogo && <Image source={{ uri: brandLogo }} style={styles.gridBrandLogo} resizeMode="contain"/>}
                        {displayPrice ? <Text style={styles.gridPrice}>{displayPrice}</Text> : <View style={{flex: 1}}/> /* Placeholder */}
                        <TouchableOpacity style={styles.gridAddButton} onPress={(e) => { e.stopPropagation(); console.log("Add search result:", item.id); }}>
                          <Ionicons name="add" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              // Display Initial Suggestions
              <>
                {isLoadingSuggestions && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                  </View>
                )}
                {!isLoadingSuggestions && errorSuggestions && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorSuggestions}</Text>
                  </View>
                )}
                {!isLoadingSuggestions && !errorSuggestions && suggestions.length === 0 && (
                   <View style={styles.errorContainer}>
                     <Text style={styles.errorText}>Aucune suggestion pour le moment.</Text>
                   </View>
                )}
                {!isLoadingSuggestions && !errorSuggestions && suggestions.map((suggestion) => {
                  // Re-use the robust formatPrice function
                  const formatPrice = (price: number | string | undefined | null, currency: string | undefined | null): string => {
                    let numPrice: number | null | undefined = null;
                    if (typeof price === 'number') {
                      numPrice = price;
                    } else if (typeof price === 'string') {
                      const cleaned = price.replace(',', '.').replace(/[^0-9.]/g, '');
                      const parsed = parseFloat(cleaned);
                      if (!isNaN(parsed)) {
                        numPrice = parsed;
                      }
                    }
                    // Now check if numPrice is a valid number before using methods
                    if (typeof numPrice === 'number' && !isNaN(numPrice)) {
                      return `${numPrice.toFixed(2).replace('.', ',')} ${currency || '€'}`;
                    }
                    return ''; // Return empty string if price is invalid or null/undefined
                  };
                  const displayPrice = formatPrice(suggestion.price, suggestion.currency);
                  const brandLogo = suggestion.brand ? `https://logo.clearbit.com/${suggestion.brand.toLowerCase().replace(/\s+/g, '')}.com?size=40` : undefined;

                  return (
                    <TouchableOpacity
                      key={`suggestion-${suggestion.id}`} // Ensure unique key for suggestions
                      style={styles.gridItem}
                      onPress={() => navigateToProductDetail(suggestion.id, suggestion)}
                    >
                      <Image source={{ uri: suggestion.imageUrl }} style={styles.gridImage} resizeMode="contain"/>
                      <Text style={styles.gridTitle} numberOfLines={1}>{suggestion.title}</Text>
                      <View style={styles.gridFooter}>
                        {brandLogo && <Image source={{ uri: brandLogo }} style={styles.gridBrandLogo} resizeMode="contain"/>}
                        {displayPrice ? <Text style={styles.gridPrice}>{displayPrice}</Text> : <View style={{flex: 1}}/> /* Placeholder */}
                        <TouchableOpacity style={styles.gridAddButton} onPress={(e) => { e.stopPropagation(); console.log("Add suggestion:", suggestion.id); }}>
                          <Ionicons name="add" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            {/* Removed the extra closing fragment </> that caused syntax error */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Use white background for modal sheet
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 10, // Keep some gap
  },
  closeButton: {
    padding: 5,
  },
  scanButton: {
     padding: 5,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  recentSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // Slightly reduced padding
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
   recentSearchTextContainer: {
    flex: 1, // Allow text container to take up space for touch
    marginRight: 10, // Add margin to avoid overlap with close icon
  },
  recentSearchText: {
    fontSize: 16,
    color: '#333',
  },
  pasteLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pasteIcon: {
    marginRight: 10,
  },
  pasteLinkText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10, // Reduced margin
  },
  gridItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  gridImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#f8f8f8', // Light background for image placeholder
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
    marginTop: 8,
    color: '#222', // Darker text
  },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: { // Style for loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50, // Add padding
    width: '100%', // Take full width
  },
  errorContainer: { // Style for error message
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     paddingVertical: 50,
     width: '100%',
   },
   errorText: {
     color: '#666',
     textAlign: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8, // Only bottom padding needed
    paddingTop: 4, // Less top padding
  },
  gridBrandLogo: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1, // Allow price to take available space
    marginHorizontal: 4,
  },
  gridAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchAddWishModal;