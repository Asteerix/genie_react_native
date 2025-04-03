import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // Added useRef
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
  Dimensions,
  TextInput
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation'; // Assuming RootStackParamList includes this screen
import { ProductItem, Inspiration as InspirationItem, Brand, Category as CategoryProps } from '../types/products';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Types for this screen's parameters
type ItemType = 'brands' | 'inspirations' | 'giftIdeas'; // Define possible item types

type AllItemsGridScreenRouteProp = RouteProp<RootStackParamList, 'AllItemsGrid'>;
type AllItemsGridScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AllItemsGrid'>;

// Dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 2; // Adjust number of columns for the grid
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
const ITEMS_PER_PAGE = 16; // Number of items to load per page in grid view

// --- Helper function outside component ---
const shuffleArray = <T extends any>(array: T[]): T[] => {
  if (!array) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- Reusable Item Components (Simplified versions or import if needed) ---

// Brand Grid Item
const BrandGridItem = React.memo(({ item, onPress }: { item: Brand, onPress: (item: Brand) => void }) => (
  <TouchableOpacity style={styles.gridItemBrand} onPress={() => onPress(item)}>
    <View style={styles.brandLogoContainerGrid}>
        <Image source={{ uri: item.logo }} style={styles.brandLogoGrid} resizeMode="contain" />
    </View>
    {/* <Text style={styles.gridItemText} numberOfLines={1}>{item.name}</Text> */}
  </TouchableOpacity>
));

// Inspiration Grid Item
const InspirationGridItem = React.memo(({ item, onPress }: { item: InspirationItem, onPress: (item: InspirationItem) => void }) => (
  <TouchableOpacity style={styles.gridItemInspiration} onPress={() => onPress(item)}>
    <Image source={{ uri: item.image }} style={styles.inspirationImageGrid} resizeMode="cover" />
    <View style={styles.inspirationNameContainerGrid}>
       <Text style={styles.gridItemTextInspiration} numberOfLines={2}>{item.name}</Text>
    </View>
  </TouchableOpacity>
));

// Gift Idea (Product) Grid Item
const GiftIdeaGridItem = React.memo(({ item, onPress }: { item: ProductItem, onPress: (item: ProductItem) => void }) => {
    // Safely format price, handle undefined/null or non-numeric types
    const formattedPrice = typeof item.price === 'number'
        ? `${item.price.toFixed(2).replace('.', ',')} ${item.currency || '€'}`
        : ''; // Display empty string if price is not a valid number
    return (
      <TouchableOpacity style={styles.gridItemGift} onPress={() => onPress(item)}>
        <Image source={{ uri: item.imageUrl }} style={styles.giftImageGrid} resizeMode="contain" />
        <View style={styles.giftInfoGrid}>
            <Text style={styles.giftTitleGrid} numberOfLines={2}>{item.title}</Text>
            <View style={styles.giftRowGrid}>
                 <Image source={{ uri: `https://logo.clearbit.com/${item.brand}.com?size=40` }} style={styles.giftBrandLogoGrid} resizeMode="contain" />
                 <Text style={styles.priceTextGrid}>{formattedPrice}</Text>
                 {/* Optional: Add button */}
            </View>
        </View>
      </TouchableOpacity>
    );
});


// --- Main Screen Component ---
const AllItemsGridScreen: React.FC = () => {
  const navigation = useNavigation<AllItemsGridScreenNavigationProp>();
  const route = useRoute<AllItemsGridScreenRouteProp>();
  const { itemType, title } = route.params; // Get item type and title from navigation params

  const [allItems, setAllItems] = useState<any[]>([]); // Store all items fetched
  const [filteredItems, setFilteredItems] = useState<any[]>([]); // Items displayed after filtering
  const [isLoading, setIsLoading] = useState(true); // Initial load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Loading more items
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const currentPage = useRef(1); // Track current page for pagination
  const hasMoreToLoad = useRef(true); // Flag to indicate if more items might exist


  // Fetch data based on itemType
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      currentPage.current = 1; // Reset page on new fetch
      hasMoreToLoad.current = true; // Assume more to load initially
      setAllItems([]); // Clear previous items
      setFilteredItems([]); // Clear displayed items

      let url = '';
      let dataType: ItemType = itemType;

      switch (dataType) {
        case 'brands':
          url = `${API_BASE_URL}/api/scraper/brands`;
          break;
        case 'inspirations':
          url = `${API_BASE_URL}/api/scraper/inspirations`;
          break;
        case 'giftIdeas':
          // Using /new-products as the source for gift ideas grid
          url = `${API_BASE_URL}/api/scraper/new-products`;
          break;
        default:
          setError(`Type d'élément inconnu: ${itemType}`);
          setIsLoading(false);
          return;
      }

      console.log(`Fetching all items for type "${itemType}" from ${url}`);
      try {
        const response = await axios.get<any[]>(url);
        if (response.data && Array.isArray(response.data)) {
          console.log(`Received ${response.data.length} items for type "${itemType}"`);
          let fetchedData = response.data;

          if (dataType === 'brands') {
              fetchedData.sort((a: Brand, b: Brand) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
          }
          // For gift ideas, shuffle the entire list before pagination
          if (dataType === 'giftIdeas') {
              fetchedData = shuffleArray(fetchedData);
          }

          setAllItems(fetchedData); // Store all fetched (and potentially sorted/shuffled) items

          // Apply pagination only for giftIdeas initially
          if (dataType === 'giftIdeas') {
              setFilteredItems(fetchedData.slice(0, ITEMS_PER_PAGE));
              hasMoreToLoad.current = fetchedData.length > ITEMS_PER_PAGE;
          } else {
              setFilteredItems(fetchedData); // Display all for other types
              hasMoreToLoad.current = false;
          }
        } else {
          setAllItems([]);
          setFilteredItems([]);
          hasMoreToLoad.current = false;
          console.warn(`No items or invalid format received for type "${itemType}"`);
        }
      } catch (err) {
        console.error(`Erreur lors de la récupération des éléments pour "${itemType}":`, err);
        setError(`Impossible de charger les éléments.`);
        setAllItems([]);
        setFilteredItems([]);
        hasMoreToLoad.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [itemType]); // Re-fetch only if itemType changes

  // Handle search query change and filter items
  useEffect(() => {
    // Reset pagination when search query changes
    currentPage.current = 1;
    hasMoreToLoad.current = true; // Reset hasMore flag

    if (!searchQuery) {
      // If search is cleared, show initial page for giftIdeas or all for others
      if (itemType === 'giftIdeas') {
          setFilteredItems(allItems.slice(0, ITEMS_PER_PAGE));
          hasMoreToLoad.current = allItems.length > ITEMS_PER_PAGE;
      } else {
          setFilteredItems(allItems);
          hasMoreToLoad.current = false;
      }
      return;
    }

    // Apply filtering based on search query
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = allItems.filter(item => {
      switch (itemType) {
        case 'brands': return item.name?.toLowerCase().includes(lowerCaseQuery);
        case 'inspirations': return item.name?.toLowerCase().includes(lowerCaseQuery);
        case 'giftIdeas': return item.title?.toLowerCase().includes(lowerCaseQuery) || item.brand?.toLowerCase().includes(lowerCaseQuery);
        default: return false;
      }
    });

    // Apply pagination to search results only for giftIdeas
    if (itemType === 'giftIdeas') {
        setFilteredItems(filtered.slice(0, ITEMS_PER_PAGE));
        hasMoreToLoad.current = filtered.length > ITEMS_PER_PAGE;
    } else {
        setFilteredItems(filtered); // Show all filtered results for non-paginated types
        hasMoreToLoad.current = false;
    }

  }, [searchQuery, allItems, itemType]); // Rerun filtering when search, allItems, or itemType changes

  // Navigation Handlers
  const handleBackPress = useCallback(() => { navigation.goBack(); }, [navigation]);
  const handleBrandPress = useCallback((item: Brand) => { navigation.navigate('BrandProducts', { brandId: item.id, brandName: item.name }); }, [navigation]);
  const handleInspirationPress = useCallback((item: InspirationItem) => { navigation.navigate('InspirationProducts', { inspirationId: item.id, inspirationName: item.name }); }, [navigation]);
  // Passer productData lors de la navigation
  const handleGiftIdeaPress = useCallback((item: ProductItem) => { navigation.navigate('ProductDetail', { productId: item.id, productData: item }); }, [navigation]);

  // Function to load more items for pagination (only for giftIdeas)
  const loadMoreItems = useCallback(() => {
      if (itemType !== 'giftIdeas' || isFetchingMore || !hasMoreToLoad.current) {
          return; // Exit if not applicable or already loading or no more items
      }

      setIsFetchingMore(true);
      const nextPage = currentPage.current + 1;
      console.log(`Loading page ${nextPage} for giftIdeas...`);

      // Determine the source list based on whether a search is active
      const sourceList = searchQuery ? allItems.filter(item => {
          const lowerCaseQuery = searchQuery.toLowerCase();
          return item.title?.toLowerCase().includes(lowerCaseQuery) || item.brand?.toLowerCase().includes(lowerCaseQuery);
      }) : allItems;

      // Simulate delay (remove in production)
      setTimeout(() => {
          const startIndex = currentPage.current * ITEMS_PER_PAGE;
          const endIndex = nextPage * ITEMS_PER_PAGE;
          const nextItems = sourceList.slice(startIndex, endIndex);

          if (nextItems.length > 0) {
              setFilteredItems(prevItems => [...prevItems, ...nextItems]);
              currentPage.current = nextPage;
              hasMoreToLoad.current = endIndex < sourceList.length;
              console.log(`Loaded ${nextItems.length} more items. HasMore: ${hasMoreToLoad.current}`);
          } else {
              hasMoreToLoad.current = false;
              console.log("No more items to load for current filter/search.");
          }
          setIsFetchingMore(false);
      }, 300); // Simulate network delay

  }, [itemType, isFetchingMore, allItems, searchQuery, filteredItems.length]); // Add filteredItems.length dependency


  // Render Item Function for FlatList
  const renderGridItem = ({ item }: { item: any }) => {
    switch (itemType) {
      case 'brands': return <BrandGridItem item={item as Brand} onPress={handleBrandPress} />;
      case 'inspirations': return <InspirationGridItem item={item as InspirationItem} onPress={handleInspirationPress} />;
      case 'giftIdeas': return <GiftIdeaGridItem item={item as ProductItem} onPress={handleGiftIdeaPress} />;
      default: return null;
    }
  };

  // Render Footer for Gift Ideas List (Loading Indicator or End Message)
  const renderListFooter = () => {
      if (itemType !== 'giftIdeas') return null; // Only show footer for giftIdeas

      if (isFetchingMore) {
          return <ActivityIndicator style={styles.footerLoader} size="small" color="#666" />;
      }
      if (!hasMoreToLoad.current && !searchQuery && allItems.length > ITEMS_PER_PAGE) {
          // Show end message only if pagination occurred and not searching
          return <Text style={styles.endListText}>Fin de la liste</Text>;
      }
      return null; // Otherwise, show nothing
  };

  // --- Render Logic ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Rechercher dans ${title}...`}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Search Results Count */}
      {searchQuery ? (
        <Text style={styles.resultsCountText}>
          {filteredItems.length} {filteredItems.length === 1 ? 'résultat' : 'résultats'} pour "{searchQuery}"
        </Text>
      ) : null}

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="black" /></View>
      ) : error ? (
        <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>
      ) : filteredItems.length === 0 && !searchQuery ? ( // Show specific message if list is empty initially
         <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={50} color="#999" />
            <Text style={styles.emptyText}>Aucun élément à afficher</Text>
         </View>
      ) : filteredItems.length === 0 && searchQuery ? ( // Show message if search yields no results
         <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={50} color="#999" />
            <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
         </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderGridItem}
          keyExtractor={(item, index) => `${item.id}-${index}`} // Ensure unique keys
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.6} // Load when 60% from end
          ListFooterComponent={renderListFooter} // Use the new footer function
        />
      )}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8', },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', height: 56, },
  backButton: { padding: 8, },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1, marginHorizontal: 10, },
  headerRightPlaceholder: { width: 24 + 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, marginHorizontal: 15, marginTop: 15, marginBottom: 5, paddingHorizontal: 10, height: 44, borderWidth: 1, borderColor: '#eee' }, // Adjusted margin
  searchIcon: { marginRight: 8, },
  searchInput: { flex: 1, fontSize: 16, color: '#333', },
  resultsCountText: { paddingHorizontal: 15, paddingBottom: 10, fontSize: 13, color: '#666', }, // Adjusted padding
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 30, }, // Reduced margin
  emptyText: { fontSize: 16, color: '#666', marginTop: 10, textAlign: 'center', },
  gridContainer: { padding: ITEM_MARGIN, paddingBottom: 30 }, // Added bottom padding
  gridItemBrand: { width: ITEM_WIDTH, marginBottom: ITEM_MARGIN, alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#eee' },
  brandLogoContainerGrid: { width: ITEM_WIDTH * 0.6, height: ITEM_WIDTH * 0.6, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden' },
  brandLogoGrid: { width: '100%', height: '100%' },
  gridItemInspiration: { width: ITEM_WIDTH, height: ITEM_WIDTH * 1.1, marginBottom: ITEM_MARGIN, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  inspirationImageGrid: { width: '100%', height: '75%', backgroundColor: '#f0f0f0' },
  inspirationNameContainerGrid: { flex: 1, justifyContent: 'center', padding: 5 },
  gridItemTextInspiration: { fontSize: 13, fontWeight: '500', textAlign: 'center', },
  gridItemGift: { width: ITEM_WIDTH, height: ITEM_WIDTH * 1.4, marginBottom: ITEM_MARGIN, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  giftImageGrid: { width: '100%', height: '65%', backgroundColor: '#f0f0f0' },
  giftInfoGrid: { padding: 8, flex: 1, justifyContent: 'space-between' },
  giftTitleGrid: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  giftRowGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  giftBrandLogoGrid: { width: 16, height: 16, marginRight: 4 },
  priceTextGrid: { fontSize: 12, fontWeight: '600' },
  footerLoader: { marginVertical: 20 },
  endListText: { // Style for the end of list message
      textAlign: 'center',
      paddingVertical: 20,
      color: '#999',
      fontSize: 13,
  },
});

export default AllItemsGridScreen;