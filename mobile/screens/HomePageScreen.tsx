import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation'; // Importer RootStackParamList (une seule fois)
import BottomTabBar from '../components/BottomTabBar';
import SearchAddWishModal from '../components/SearchAddWishModal';
import { ProductItem, Inspiration as InspirationItem, Brand, Category as CategoryProps } from '../types/products';
import { useWishlist } from '../context/WishlistContext'; // Importer le contexte Wishlist
import { toast } from 'sonner-native'; // Importer toast pour les messages

// Types
interface GiftItem {
  id: string;
  title: string;
  image: string;
  brand: string;
  price: string | null;
}

// La définition locale de RootStackParamList a été supprimée précédemment, c'est correct.

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Dimensions & Constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_IPHONE_X = Platform.OS === 'ios' && (SCREEN_HEIGHT >= 812 || SCREEN_WIDTH >= 812);
const TAB_BAR_HEIGHT = 60 + (IS_IPHONE_X ? 34 : 0);
const GIFT_IDEAS_PAGE_SIZE = 6;
const MAX_BRANDS_FOR_GIFT_IDEAS = 5;

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

// --- Helper Components ---
interface AnimatedTouchableProps { style?: any; onPress?: () => void; children: React.ReactNode; scale?: number; disabled?: boolean; }
const AnimatedTouchable = React.memo(({ style, onPress, children, scale = 0.95, disabled = false }: AnimatedTouchableProps) => {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const handlePressIn = useCallback(() => { Animated.spring(animatedValue, { toValue: scale, useNativeDriver: true, speed: 25, bounciness: 4 }).start(); }, [animatedValue, scale]);
  const handlePressOut = useCallback(() => { Animated.spring(animatedValue, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 4 }).start(); }, [animatedValue]);
  const animatedStyle = { transform: [{ scale: animatedValue }] };
  return ( <TouchableOpacity activeOpacity={0.9} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}><Animated.View style={[style, animatedStyle]}>{children}</Animated.View></TouchableOpacity> );
});

interface SectionHeaderProps { title: string; onViewMore: () => void; }
const SectionHeader = React.memo(({ title, onViewMore }: SectionHeaderProps) => {
  return ( <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><TouchableOpacity onPress={onViewMore}><Text style={styles.viewMore}>voir plus</Text></TouchableOpacity></View> );
});

interface CategoryItemProps { category: CategoryProps; onPress: (id: string) => void; isActive: boolean; }
const CategoryItem: React.FC<CategoryItemProps> = React.memo(({ category, onPress, isActive }) => {
  return ( <TouchableOpacity style={[ styles.categoryItem, isActive && styles.activeCategoryItem ]} onPress={() => onPress(category.id)}><Text style={[ styles.categoryText, isActive && styles.activeCategoryText ]}>{category.name}</Text></TouchableOpacity> );
});

interface BrandItemProps { brand: Brand; }
const BrandItem = React.memo(({ brand }: BrandItemProps) => {
  const navigation = useNavigation<NavigationProp>();
  const handlePress = useCallback(() => { navigation.navigate('BrandProducts', { brandId: brand.id, brandName: brand.name }); }, [brand, navigation]);
  return ( <TouchableOpacity style={styles.brandItem} onPress={handlePress}><View style={styles.brandLogoContainer}><Image source={{ uri: brand.logo }} style={styles.brandLogo} resizeMode="contain" /></View></TouchableOpacity> );
});

interface GiftItemProps { item: ProductItem; }
const GiftItem = React.memo(({ item }: GiftItemProps) => {
  const navigation = useNavigation<NavigationProp>();
  // Revenir au chemin original
  const handlePress = useCallback(() => { navigation.navigate('ProductDetail', { productId: item.id }); }, [item, navigation]); // Supprimer productData pour corriger l'erreur TS
  const formattedPrice = typeof item.price === 'number' ? `${item.price.toFixed(2).replace('.', ',')} ${item.currency || '€'}` : '';
  return (
    <TouchableOpacity style={styles.giftItem} onPress={handlePress}>
      <Image source={{ uri: item.imageUrl }} style={styles.giftImage} resizeMode={'contain'} />
      <View style={styles.giftInfo}>
        <Text style={styles.giftTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.giftRow}>
           <Image source={{ uri: `https://logo.clearbit.com/${item.brand}.com?size=40` }} style={styles.giftBrandLogo} resizeMode="contain" onError={() => console.log(`Failed to load logo for ${item.brand}`)} />
           <Text style={styles.priceText}>{formattedPrice}</Text>
           <TouchableOpacity style={styles.actionButton}><Ionicons name="add" size={18} color="white" /></TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const InspirationCard = React.memo(({ item }: { item: InspirationItem }) => {
  const navigation = useNavigation<NavigationProp>();
  const handlePress = useCallback(() => { navigation.navigate('InspirationProducts', { inspirationId: item.id, inspirationName: item.name, }); }, [item, navigation]);
  return (
    <TouchableOpacity key={item.id} style={styles.inspirationItem} onPress={handlePress}>
        <Image source={{ uri: item.image }} style={styles.inspirationImage} resizeMode="cover" />
        <View style={styles.inspirationNameContainer}><Text style={styles.inspirationName}>{item.name}</Text></View>
    </TouchableOpacity>
  );
});


// --- Main Screen Component ---
const HomePageScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  // const navigation = useNavigation<NavigationProp>(); // Supprimer la redéclaration
  const insets = useSafeAreaInsets();
  const { wishlists } = useWishlist(); // Récupérer les wishlists du contexte
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // States
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);
  const [giftIdeasProducts, setGiftIdeasProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const [isGiftIdeasLoading, setIsGiftIdeasLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const giftIdeasPage = useRef(1);
  const allShuffledGiftIdeas = useRef<ProductItem[]>([]);
  const hasMoreGiftIdeasToLoad = useRef(true); // Ref to track if more gift ideas exist

  // Status bar height & Padding
  const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;
  const contentBottomPadding = TAB_BAR_HEIGHT + 20;

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [filtersResponse, brandsResponse, inspirationsResponse] = await Promise.all([
          axios.get<CategoryProps[]>(`${API_BASE_URL}/api/scraper/filters`),
          axios.get<Brand[]>(`${API_BASE_URL}/api/scraper/brands`),
          axios.get<InspirationItem[]>(`${API_BASE_URL}/api/scraper/inspirations`)
        ]);

        const filters = filtersResponse.data;
        if (!filters.some(filter => filter.id === 'all')) filters.unshift({ id: 'all', name: 'Tous' });
        setCategories(filters);

        if (brandsResponse.data && Array.isArray(brandsResponse.data)) {
          const sortedBrands = [...brandsResponse.data].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
          setAllBrands(sortedBrands);
          setFilteredBrands(sortedBrands); // Triggers the gift ideas fetch effect
        }

        if (inspirationsResponse.data && Array.isArray(inspirationsResponse.data) && inspirationsResponse.data.length > 0) {
          setInspirations(inspirationsResponse.data);
        } else {
          console.warn("No inspirations from API, using defaults.");
          setInspirations([ { id: 'christmas', name: 'Noël', image: 'https://api.a0.dev/assets/image?text=Noel&aspect=1:1&seed=1' }, { id: 'valentine', name: 'Saint-Valentin', image: 'https://api.a0.dev/assets/image?text=Saint-Valentin&aspect=1:1&seed=2' }, { id: 'girl_birthday', name: 'Anniversaire Fille', image: 'https://api.a0.dev/assets/image?text=Anniversaire%20Fille&aspect=1:1&seed=3' }, { id: 'boy_birthday', name: 'Anniversaire Garçon', image: 'https://api.a0.dev/assets/image?text=Anniversaire%20Garcon&aspect=1:1&seed=4' } ]);
        }

      } catch (err) {
        console.error('Erreur lors de la récupération des données initiales:', err);
        setError('Impossible de charger les données');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Effect to fetch, filter, and shuffle gift ideas when filteredBrands changes
  useEffect(() => {
    const fetchAndProcessGiftIdeas = async () => {
        if (filteredBrands.length === 0 && !isLoading) { // Don't run if brands are empty unless initial load is happening
            allShuffledGiftIdeas.current = [];
            setGiftIdeasProducts([]);
            hasMoreGiftIdeasToLoad.current = false;
            return;
        }

        setIsGiftIdeasLoading(true);
        console.log(`Fetching gift ideas for ${filteredBrands.length} filtered brands.`);
        const brandsToFetch = filteredBrands.slice(0, MAX_BRANDS_FOR_GIFT_IDEAS);
        console.log(`Fetching products from top ${brandsToFetch.length} brands:`, brandsToFetch.map(b => b.id));

        try {
            const productPromises = brandsToFetch.map(brand =>
                // Revenir au chemin original
                axios.get<ProductItem[]>(`${API_BASE_URL}/api/scraper/brands/${brand.id}/products`)
                     .then(res => res.data)
                     .catch(err => { console.warn(`Failed to fetch products for ${brand.id}:`, err.message); return []; })
            );
            const results = await Promise.all(productPromises);
            const combinedProducts = results.flat();
            console.log(`Fetched ${combinedProducts.length} total products for gift ideas source.`);

            const shuffled = shuffleArray(combinedProducts);
            allShuffledGiftIdeas.current = shuffled;
            giftIdeasPage.current = 1;
            const initialItems = shuffled.slice(0, GIFT_IDEAS_PAGE_SIZE);
            setGiftIdeasProducts(initialItems);
            hasMoreGiftIdeasToLoad.current = shuffled.length > initialItems.length; // Update hasMore flag
            console.log(`Loaded initial ${initialItems.length} gift ideas. Has More: ${hasMoreGiftIdeasToLoad.current}`);

        } catch (error) {
            console.error("Error fetching products for gift ideas:", error);
            setError("Impossible de charger les idées cadeaux");
            allShuffledGiftIdeas.current = [];
            setGiftIdeasProducts([]);
            hasMoreGiftIdeasToLoad.current = false;
        } finally {
            setIsGiftIdeasLoading(false);
        }
    };

    if (!isLoading) { // Only run if initial loading is complete
        fetchAndProcessGiftIdeas();
    }

  }, [filteredBrands, isLoading]); // Rerun when filtered brands change or initial load finishes

  // Scroll handler
  const handleScroll = useCallback(Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }), [scrollY]);

  // Category selection handler
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    if (categoryId === activeCategory || isBrandLoading) return;
    console.log("Category selected:", categoryId);
    setActiveCategory(categoryId);
    setIsBrandLoading(true);
    setError(null);
    setGiftIdeasProducts([]); // Clear gift ideas immediately
    allShuffledGiftIdeas.current = [];
    hasMoreGiftIdeasToLoad.current = false; // Reset hasMore flag
    giftIdeasPage.current = 1;

    try {
      if (categoryId === 'all') {
        setFilteredBrands(allBrands);
      } else {
        const url = `${API_BASE_URL}/api/scraper/filters/${categoryId}/brands`;
        console.log("Fetching brands for category:", url);
        const response = await axios.get<Brand[]>(url);
        if (response.data && Array.isArray(response.data)) {
          const sortedBrands = [...response.data].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
          setFilteredBrands(sortedBrands);
        } else {
          setFilteredBrands([]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des marques filtrées:', error);
      setError('Impossible de charger les marques');
      setFilteredBrands([]);
    } finally {
      setIsBrandLoading(false);
    }
  }, [activeCategory, allBrands, isBrandLoading]);

  // Lazy loading for Gift Ideas
  const loadMoreGiftIdeas = useCallback(() => {
      if (isGiftIdeasLoading || !hasMoreGiftIdeasToLoad.current) return;

      setIsGiftIdeasLoading(true);
      const nextPage = giftIdeasPage.current + 1;
      console.log(`Requesting page ${nextPage} for gift ideas (lazy load)...`);

      // Simulate delay
      setTimeout(() => {
          const currentCount = giftIdeasProducts.length; // Get current count *before* potential state update
          const nextItems = allShuffledGiftIdeas.current.slice(currentCount, nextPage * GIFT_IDEAS_PAGE_SIZE);

          if (nextItems.length > 0) {
              setGiftIdeasProducts(prevItems => [...prevItems, ...nextItems]);
              giftIdeasPage.current = nextPage;
              hasMoreGiftIdeasToLoad.current = (currentCount + nextItems.length) < allShuffledGiftIdeas.current.length;
              console.log(`Loaded ${nextItems.length} more gift ideas. Total: ${currentCount + nextItems.length}. Has More: ${hasMoreGiftIdeasToLoad.current}`);
          } else {
              hasMoreGiftIdeasToLoad.current = false; // Explicitly set to false if no items returned
              console.log("No more new items found on this page for gift ideas.");
          }
          setIsGiftIdeasLoading(false);
      }, 300);

  }, [isGiftIdeasLoading, giftIdeasProducts.length]); // Depend on length to recalculate slice


  // Modal handlers
  const openSearchModal = useCallback(() => { setShowSearchModal(true); }, []);
  const closeSearchModal = useCallback(() => { setShowSearchModal(false); }, []);

  // View more handler
  const handleViewMore = useCallback((itemType: 'brands' | 'inspirations' | 'giftIdeas', title: string) => {
      console.log(`View more clicked for ${itemType}`);
      navigation.navigate('AllItemsGrid', { itemType, title });
  }, [navigation]);

  // Render functions
  const renderCategoryItem = useCallback(({ item }: { item: CategoryProps }) => ( <CategoryItem category={item} onPress={handleCategorySelect} isActive={activeCategory === item.id} /> ), [activeCategory, handleCategorySelect]);
  const renderBrandItem = useCallback(({ item }: { item: Brand }) => ( <BrandItem brand={item} /> ), []);
  const renderGiftItem = useCallback(({ item }: { item: ProductItem }) => ( <GiftItem item={item} /> ), []);
  const renderInspirationItem = useCallback(({ item }: { item: InspirationItem }) => ( <InspirationCard item={item} /> ), []);

  // Render Footer for Gift Ideas List
  const renderGiftIdeasFooter = () => {
      if (isGiftIdeasLoading) {
          return <ActivityIndicator style={styles.loadingFooter} size="small" color="#666" />;
      }
      // Show end message only if not loading, no more items exist, and some items were actually loaded initially
      if (!hasMoreGiftIdeasToLoad.current && allShuffledGiftIdeas.current.length > GIFT_IDEAS_PAGE_SIZE) {
          return <Text style={styles.endListText}>Fin</Text>;
      }
      return null; // Otherwise, show nothing
  };


  // --- Main Return JSX ---
  return (
    <View style={[styles.mainContainer, { paddingTop: STATUSBAR_HEIGHT }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
          {/* Barre de recherche cliquable */}
          <TouchableOpacity
            style={styles.searchBarTouchable}
            onPress={() => navigation.navigate('Search')} // Navigue vers SearchScreen
            activeOpacity={0.7}
          >
            <View style={styles.searchBarContainer}>
              <Ionicons name="search-outline" size={20} color="#8E8E93" style={styles.searchBarIcon} />
              <Text style={styles.searchBarText}>Rechercher...</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitlePlaceholder} />
          <TouchableOpacity
            style={styles.headerIconTouchable}
            onPress={() => {
              if (wishlists && wishlists.length > 0) {
                // La navigation devrait maintenant être correctement typée
                navigation.navigate('AddWish', { wishlistId: wishlists[0].id });
              } else {
                toast.info("Veuillez d'abord créer une liste de souhaits.");
                // Optionnel: Ouvrir une modale de création de liste si disponible
                // setShowCreateWishlistModal(true);
              }
            }}
          >
              <Ionicons name="add-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
      </View>

      {/* Gold Banner */}
      <View style={styles.goldBanner}>
          <Image source={{ uri: 'https://api.a0.dev/assets/image?text=Gold%20Coin&aspect=1:1&seed=gold' }} style={styles.goldCoin} />
          <View style={styles.goldTextContainer}>
              <Text style={styles.goldAmount}>1050 gold</Text>
              <Text style={styles.goldDescription}>Récupère de l'argent en faisant tes achats sur l'application Genie !</Text>
          </View>
          <Ionicons name="information-circle-outline" size={20} color="#A67C00" />
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
          <FlatList data={categories} renderItem={renderCategoryItem} keyExtractor={item => item.id} horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={styles.categoriesContent} decelerationRate="fast" initialNumToRender={6} />
      </View>

      {/* Main Content */}
      <Animated.ScrollView style={styles.content} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: contentBottomPadding }}>
        {isLoading && ( <View style={styles.fullScreenLoader}><ActivityIndicator size="large" color="#000" /></View> )}
        {error && !isLoading && ( <View style={styles.errorDisplay}><Text style={styles.errorTextDisplay}>{error}</Text></View> )}

        {!isLoading && !error && (
            <>
                {/* Brands Section */}
                <Animated.View style={styles.section}>
                  <View style={styles.brandsSectionHeader}>
                    <Text style={styles.sectionTitle}>Marques</Text>
                    {isBrandLoading && ( <View style={styles.loadingIndicator}><Text style={styles.loadingText}>...</Text></View> )}
                    <TouchableOpacity onPress={() => handleViewMore('brands', 'Marques')}><Text style={styles.viewMore}>voir plus</Text></TouchableOpacity>
                  </View>
                  <FlatList data={filteredBrands} renderItem={renderBrandItem} keyExtractor={item => item.id} horizontal showsHorizontalScrollIndicator={false} style={styles.brandsContainer} contentContainerStyle={styles.brandsContent} decelerationRate="fast" initialNumToRender={6} />
                </Animated.View>

                {/* Inspirations Section */}
                <Animated.View style={styles.section}>
                  <SectionHeader title="Inspirations" onViewMore={() => handleViewMore('inspirations', 'Inspirations')} />
                  <FlatList data={inspirations} renderItem={renderInspirationItem} keyExtractor={item => item.id} horizontal showsHorizontalScrollIndicator={false} style={styles.inspirationsContainer} contentContainerStyle={styles.inspirationsContent} decelerationRate="fast" initialNumToRender={3} />
                </Animated.View>

                {/* Gift Ideas Section */}
                <Animated.View style={styles.section}>
                  <SectionHeader title="Idées de cadeaux" onViewMore={() => handleViewMore('giftIdeas', 'Idées de cadeaux')} />
                  <FlatList
                    data={giftIdeasProducts}
                    renderItem={renderGiftItem}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.giftIdeasContainer}
                    contentContainerStyle={styles.giftIdeasContentContainer}
                    decelerationRate="fast"
                    initialNumToRender={3}
                    onEndReached={loadMoreGiftIdeas}
                    onEndReachedThreshold={0.7}
                    ListFooterComponent={renderGiftIdeasFooter} // Updated footer logic
                    scrollEventThrottle={16}
                  />
                </Animated.View>
            </>
        )}
      </Animated.ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="shopping" />

      {/* Search Modal */}
      <SearchAddWishModal visible={showSearchModal} onClose={closeSearchModal} />
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8F8F8', },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  // headerIconTouchable: { padding: 8, }, // Remplacé par searchBarTouchable pour la recherche
  searchBarTouchable: { // Style pour le TouchableOpacity de la barre de recherche
    flex: 1, // Prend l'espace disponible
    marginRight: 10, // Espace avant le bouton "+"
  },
  searchBarContainer: { // Style pour la barre de recherche visuelle
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // Fond gris clair
    borderRadius: 10, // Coins arrondis
    paddingHorizontal: 10,
    height: 38, // Hauteur standard
  },
  searchBarIcon: {
    marginRight: 6,
  },
  searchBarText: {
    flex: 1,
    fontSize: 16,
    color: '#8E8E93', // Couleur du placeholder
  },
  headerTitlePlaceholder: { /* Supprimé car la barre prend flex: 1 */ },
  headerIconTouchable: { padding: 8 }, // Garder pour le bouton "+"
  goldBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 15, marginTop: 15, borderRadius: 10, },
  goldCoin: { width: 30, height: 30, marginRight: 10, },
  goldTextContainer: { flex: 1, marginRight: 10, },
  goldAmount: { fontWeight: 'bold', color: '#A67C00', fontSize: 14 },
  goldDescription: { color: '#A67C00', fontSize: 12, },
  categoriesWrapper: { backgroundColor: '#fff', paddingBottom: 5, paddingTop: 5 },
  categoriesContainer: { paddingLeft: 15, },
  categoriesContent: { paddingRight: 15, alignItems: 'center', height: 45 },
  categoryItem: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, marginRight: 10, backgroundColor: '#f5f5f5', borderWidth: 0, justifyContent: 'center', height: 38, },
  activeCategoryItem: { backgroundColor: '#000', },
  categoryText: { fontSize: 14, fontWeight: '500', color: '#333', },
  activeCategoryText: { color: '#fff', },
  content: { flex: 1, backgroundColor: '#F8F8F8' },
  section: { marginBottom: 15, marginTop: 10, backgroundColor: '#fff', paddingVertical: 15, borderRadius: 12, marginHorizontal: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 15, },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000', },
  viewMore: { fontSize: 14, color: '#007AFF', fontWeight: '500', },
  brandsContainer: { height: 70, },
  brandsContent: { paddingHorizontal: 15, alignItems: 'center' },
  brandItem: { alignItems: 'center', marginRight: 20, },
  brandLogoContainer: { width: 60, height: 60, borderRadius: 10, borderWidth: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, overflow: 'hidden', },
  brandLogo: { width: '100%', height: '100%', },
  inspirationsContainer: { height: 175, },
  inspirationsContent: { paddingHorizontal: 15, paddingVertical: 5 },
  inspirationItem: { width: 140, height: 160, marginRight: 15, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.10, shadowRadius: 3, elevation: 3, borderWidth: 0.5, borderColor: '#eee'},
  inspirationImage: { width: '100%', height: 115, backgroundColor: '#f0f0f0', },
  inspirationNameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  inspirationName: { fontSize: 13, fontWeight: '500', textAlign: 'center', },
  giftIdeasContainer: { height: 230, },
  giftIdeasContentContainer: { paddingHorizontal: 15, paddingVertical: 5, paddingRight: 30 },
  giftItem: { width: 155, height: 210, marginRight: 15, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, },
  giftImage: { width: '100%', height: 125, backgroundColor: '#f0f0f0', }, // Adjusted height
  giftInfo: { padding: 8, flex: 1, justifyContent: 'space-between' },
  giftTitle: { fontSize: 13, fontWeight: '500', color: '#222', marginBottom: 4, },
  giftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', },
  giftBrandLogo: { width: 16, height: 16, },
  giftBrandContainer: { width: 18, height: 18, borderRadius: 9, overflow: 'hidden', marginRight: 5, borderWidth: 0.5, borderColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  priceText: { fontSize: 13, fontWeight: '600', color: '#000', flexShrink: 1, marginRight: 5 }, // Adjusted style
  actionButtonContainer: { flexDirection: 'row', alignItems: 'center', },
  actionButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', },
  brandsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 15 },
  loadingIndicator: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#f0f0f0', borderRadius: 8, marginLeft: 8, },
  loadingText: { fontSize: 11, color: '#666', fontWeight: '500', },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50, paddingBottom: 50, },
  errorDisplay: { padding: 20, alignItems: 'center', },
  errorTextDisplay: { color: 'red', textAlign: 'center', },
  loadingFooter: { paddingVertical: 15, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', width: 50 },
  endListText: { // Style for the end of list message
      textAlign: 'center',
      paddingVertical: 15, // Match loader padding
      paddingHorizontal: 10,
      color: '#999',
      fontSize: 12,
      width: 50, // Match loader width
  },
});

export default React.memo(HomePageScreen);
