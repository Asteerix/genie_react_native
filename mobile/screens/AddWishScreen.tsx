import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface GiftItem {
  id: string;
  title: string;
  image: string;
  brand: string;
  price: string | null;
}

interface InspirationItem {
  id: string;
  name: string;
  image: string;
}

interface GiftItemProps {
  item: GiftItem;
  onPress?: () => void;
}

interface InspirationItemProps {
  item: InspirationItem;
}

type RootStackParamList = {
  ProductDetail: { productId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CategoryProps {
  id: string;
  name: string;
}

interface CategoryItemProps {
  category: CategoryProps;
  onPress: (id: string) => void;
  isActive: boolean;
}
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../components/BottomTabBar';
import SearchAddWishModal from '../components/SearchAddWishModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced AnimatedTouchable component with improved animations
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

// Improved Section Header with enhanced animations
interface SectionHeaderProps {
  title: string;
  onViewMore: () => void;
}

const SectionHeader = React.memo(({ title, onViewMore }: SectionHeaderProps) => {
  const translateX = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <View style={styles.sectionHeader}>
      <Animated.Text style={[
        styles.sectionTitle,
        { opacity, transform: [{ translateX }] }
      ]}>
        {title}
      </Animated.Text>
      <AnimatedTouchable onPress={onViewMore} scale={0.97}>
        <Text style={styles.viewMore}>voir plus</Text>
      </AnimatedTouchable>
    </View>
  );
});

// Category Item Component
const CategoryItem: React.FC<CategoryItemProps> = React.memo(({ category, onPress, isActive }) => {
  return (
    <AnimatedTouchable 
      style={[
        styles.categoryItem,
        isActive && styles.activeCategoryItem
      ]}
      onPress={() => onPress(category.id)}
    >
      <Text style={[
        styles.categoryText,
        isActive && styles.activeCategoryText
      ]}>
        {category.name}
      </Text>
    </AnimatedTouchable>
  );
});

// Brand Item Component - ENHANCED to fill the entire container
interface Brand {
  id: string;
  name: string;
  logo: string;
}

interface BrandItemProps {
  brand: Brand;
}

const BrandItem = React.memo(({ brand }: BrandItemProps) => {
  // Animation for entrance
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: 150 * Math.random(), // Staggered animation
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: 150 * Math.random(),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <AnimatedTouchable style={styles.brandItem}>
      <Animated.View 
        style={[
          styles.brandLogoContainer,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Image 
          source={{ uri: brand.logo }} 
          style={styles.brandLogo} 
          resizeMode="cover" // Changed from "contain" to "cover" to fill the container
        />
      </Animated.View>
      <Text style={styles.brandName}>{brand.name}</Text>
    </AnimatedTouchable>
  );
});

// Gift Item Component - Fixed to prevent button cutoff
const GiftItem = React.memo(({ item, onPress }: GiftItemProps) => {
  const navigation = useNavigation<NavigationProp>();
  // Animation for entrance
  const translateY = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handlePress = useCallback(() => {
    if (item.price) {
      navigation.navigate('ProductDetail', { productId: item.id });
    }
  }, [item, navigation]);
  
  return (
    <AnimatedTouchable 
      style={[
        styles.giftItem,
        { 
          opacity: opacityAnim, 
          transform: [
            { translateY },
            { scale: scaleAnim }
          ] 
        }
      ]}
      onPress={handlePress}
      scale={0.97}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.giftImage} 
        resizeMode={item.id === 'nike' ? 'contain' : 'cover'}
      />
      <View style={styles.giftInfo}>
        <Text style={styles.giftTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.giftRow}>
          <View style={styles.giftBrandContainer}>
            <Image
              source={{ uri: 'https://api.a0.dev/assets/image?text=nike%20logo%20small&aspect=1:1&seed=9' }}
              style={styles.giftBrandLogo}
              resizeMode="contain"
            />
          </View>
          {item.price ? (
            <View style={styles.actionButtonContainer}>
              <Text style={styles.priceText}>{item.price}</Text>
              <AnimatedTouchable style={styles.actionButton} scale={0.92}>
                <Ionicons name="add" size={16} color="white" />
              </AnimatedTouchable>
            </View>
          ) : (
            <AnimatedTouchable style={styles.viewButtonContainer} scale={0.92}>
              <Text style={styles.viewButtonText}>voir</Text>
            </AnimatedTouchable>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
});

// Inspiration Item Component
const InspirationItem = React.memo(({ item }: InspirationItemProps) => {
  // Animation for entrance
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 150 * Math.random(),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: 150 * Math.random(),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <AnimatedTouchable key={item.id} style={styles.inspirationItem}>
      <Animated.View 
        style={{ 
          opacity: opacityAnim, 
          transform: [{ scale: scaleAnim }],
          width: '100%', 
          height: '100%' 
        }}
      >
        <Image 
          source={{ uri: item.image }} 
          style={styles.inspirationImage} 
          resizeMode="cover"
        />
        <Text style={styles.inspirationName}>{item.name}</Text>
      </Animated.View>
    </AnimatedTouchable>
  );
});

// Main Screen Component
const AddWishScreen = () => {
  const navigation = useNavigation();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation for section headers
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Categories
  const categories = useMemo(() => [
    { id: 'all', name: 'Tous' },
    { id: 'fashion', name: 'Mode' },
    { id: 'home', name: 'Maison' },
    { id: 'beauty', name: 'Maquillage' }
  ], []);

  // Brands - Added higher quality image URLs for better display
  const brands = useMemo(() => [
    { id: 'amazon', name: 'Amazon', logo: 'https://api.a0.dev/assets/image?text=amazon%20logo%20orange%20smile%20high%20quality%20fill%20square&aspect=1:1&seed=1' },
    { id: 'etsy', name: 'Etsy', logo: 'https://api.a0.dev/assets/image?text=etsy%20logo%20orange%20text%20high%20quality%20fill%20square&aspect=1:1&seed=2' },
    { id: 'cdiscount', name: 'Cdiscount', logo: 'https://api.a0.dev/assets/image?text=cdiscount%20logo%20blue%20megaphone%20high%20quality%20fill%20square&aspect=1:1&seed=3' },
    { id: 'apple', name: 'Apple', logo: 'https://api.a0.dev/assets/image?text=apple%20logo%20black%20high%20quality%20fill%20square&aspect=1:1&seed=4' }
  ], []);

  // Gift ideas
  const giftIdeas = useMemo(() => [
    { 
      id: 'nike', 
      title: 'Nouveautés Nike', 
      image: 'https://api.a0.dev/assets/image?text=nike%20logo%20white%20on%20black%20background%20professional&aspect=1:1&seed=5',
      brand: 'Nike',
      price: null
    },
    { 
      id: 'airforce', 
      title: 'Air Force One', 
      image: 'https://api.a0.dev/assets/image?text=nike%20air%20force%20one%20dunk%20low%20black%20white%20sneakers%20professional%20product%20photography&aspect=1:1&seed=6',
      brand: 'Nike',
      price: '159.99 €'
    }
  ], []);

  // Inspirations
  const inspirations = useMemo(() => [
    { 
      id: 'christmas', 
      name: 'Noël', 
      image: 'https://api.a0.dev/assets/image?text=christmas%20tree%20cute%20illustration%20blue%20background&aspect=1:1&seed=7'
    },
    { 
      id: 'valentine', 
      name: 'Saint Valentin', 
      image: 'https://api.a0.dev/assets/image?text=valentines%20day%20hearts%20cute%20illustration%20pink%20background&aspect=1:1&seed=8'
    }
  ], []);

  // Animations for scroll events with useCallback
  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false }
    ),
    [scrollY]
  );

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  // Open search modal
  const openSearchModal = useCallback(() => {
    setShowSearchModal(true);
  }, []);

  // Close search modal
  const closeSearchModal = useCallback(() => {
    setShowSearchModal(false);
  }, []);

  // View more button handler
  const handleViewMore = useCallback((section: 'brands' | 'giftIdeas' | 'inspirations') => {
    console.log(`View more clicked for ${section}`);
    // Add navigation or action based on section
  }, []);

  // Render category item with memoization
  const renderCategoryItem = useCallback(({ item }: { item: CategoryProps }) => (
    <CategoryItem 
      category={item} 
      onPress={handleCategorySelect} 
      isActive={activeCategory === item.id}
    />
  ), [activeCategory, handleCategorySelect]);

  // Render brand item with memoization
  const renderBrandItem = useCallback(({ item }: { item: Brand }) => (
    <BrandItem brand={item} />
  ), []);

  // Render gift item with memoization
  const renderGiftItem = useCallback(({ item }: { item: GiftItem }) => (
    <GiftItem item={item} />
  ), []);

  // Render inspiration item with memoization
  const renderInspirationItem = useCallback(({ item }: { item: InspirationItem }) => (
    <InspirationItem item={item} />
  ), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Barre de recherche - Enhanced with better animations */}
        <View style={styles.searchContainer}>
          <AnimatedTouchable 
            style={styles.searchInputWrapper}
            onPress={openSearchModal}
          >
            <Ionicons name="search" size={24} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor="#999"
              editable={false}
            />
            <Ionicons name="qr-code" size={24} color="#999" style={styles.qrIcon} />
          </AnimatedTouchable>
          <AnimatedTouchable style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={28} color="#666" />
          </AnimatedTouchable>
        </View>

        {/* Catégories - Using FlatList for better performance */}
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
          snapToInterval={SCREEN_WIDTH / 3}
          decelerationRate="fast"
          initialNumToRender={4}
        />

        <Animated.ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Section Marques - Enhanced with more animations */}
          <Animated.View 
            style={[
              styles.section, 
              { 
                opacity: fadeAnim,
                transform: [{ 
                  translateY: scrollY.interpolate({
                    inputRange: [-100, 0],
                    outputRange: [-10, 0],
                    extrapolate: 'clamp'
                  }) 
                }] 
              }
            ]}
          >
            <SectionHeader 
              title="Marques" 
              onViewMore={() => handleViewMore('brands')} 
            />

            <FlatList
              data={brands}
              renderItem={renderBrandItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.brandsContainer}
              decelerationRate="fast"
              initialNumToRender={4}
            />
          </Animated.View>

          {/* Section Idées de cadeaux - Enhanced parallax effect */}
          <Animated.View 
            style={[
              styles.section, 
              { 
                opacity: fadeAnim, 
                transform: [{ 
                  translateY: scrollY.interpolate({
                    inputRange: [0, 200],
                    outputRange: [0, -20],
                    extrapolate: 'clamp'
                  }) 
                }] 
              }
            ]}
          >
            <SectionHeader 
              title="Idées de cadeaux" 
              onViewMore={() => handleViewMore('giftIdeas')} 
            />

            <FlatList
              data={giftIdeas}
              renderItem={renderGiftItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.giftIdeasContainer}
              contentContainerStyle={styles.giftIdeasContentContainer}
              decelerationRate="fast"
              snapToInterval={195}
              initialNumToRender={2}
              snapToAlignment="start"
              scrollEventThrottle={16}
            />
          </Animated.View>

          {/* Section Inspirations - Enhanced parallax and slide effects */}
          <Animated.View 
            style={[
              styles.section, 
              { 
                opacity: fadeAnim, 
                transform: [{ 
                  translateY: scrollY.interpolate({
                    inputRange: [0, 400],
                    outputRange: [0, -30],
                    extrapolate: 'clamp'
                  }) 
                }] 
              }
            ]}
          >
            <SectionHeader 
              title="Inspirations" 
              onViewMore={() => handleViewMore('inspirations')} 
            />

            <FlatList
              data={inspirations}
              renderItem={renderInspirationItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.inspirationsContainer}
              decelerationRate="fast"
              snapToInterval={165}
              initialNumToRender={2}
            />
          </Animated.View>

          {/* Extra space for bottom tabs */}
          <View style={{ height: 80 }} />
        </Animated.ScrollView>
        
        <BottomTabBar activeTab="add" />

        {/* Search Modal */}
        <SearchAddWishModal
          visible={showSearchModal}
          onClose={closeSearchModal}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 15,
    backgroundColor: '#fff',
    borderBottomColor: '#f5f5f5',
    borderBottomWidth: 1,
    zIndex: 10, // Ensure search bar stays on top
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#000',
  },
  qrIcon: {
    marginLeft: 8,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    maxHeight: 52,
    marginBottom: 10,
    paddingLeft: 12,
    backgroundColor: '#fff',
    zIndex: 5, // Lower than search bar but higher than content
  },
  categoriesContent: {
    paddingRight: 12,
    paddingVertical: 6,
  },
  categoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    // Add shadow for better depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCategoryItem: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeCategoryText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  section: {
    marginBottom: 20,
    marginTop: 10, 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
  },
  viewMore: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  brandsContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
    height: 120,
  },
  brandItem: {
    alignItems: 'center',
    marginRight: 20,
    height: 120,
  },
  // Updated brandLogoContainer to better display logos
  brandLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden', // Added to keep images within border radius
    padding: 0, // Remove any internal padding
  },
  // Updated brandLogo to fill the entire container
  brandLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff', // Add background in case logo has transparency
  },
  brandName: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  giftIdeasContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
    height: 220, // Increased height to prevent cutting off buttons
  },
  giftIdeasContentContainer: {
    paddingBottom: 15,
    paddingTop: 5,
    paddingLeft: 3,
  },
  // Gift item styles updated to fix button cutoff issues
  giftItem: {
    width: 220,
    height: 190,
    marginRight: 18,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  giftImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#000', // Black background for Nike logo
  },
  giftInfo: {
    padding: 10, // Increased padding
    paddingBottom: 12, // More bottom padding to ensure buttons are not cut off
    backgroundColor: '#fff',
    height: 70, // Fixed height for the info section to prevent layout shifts
  },
  giftTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6, // Slightly increased margin
    paddingHorizontal: 2,
  },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 2, // Added margin for better spacing
  },
  giftBrandLogo: {
    width: '100%',
    height: '100%',
  },
  giftBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 45,
    height: 24,
    overflow: 'hidden', // Ensure logo stays within container
  },
  priceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 8,
    minWidth: 60,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 0,
  },
  actionButton: {
    width: 70, // More rectangular
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  viewButtonContainer: {
    paddingHorizontal: 14,
    paddingVertical: 7, // Increased vertical padding
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 28, // Minimum height ensures button is not cut off
  },
  viewButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  inspirationsContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
    height: 200,
  },
  inspirationItem: {
    width: 150,
    height: 190,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  inspirationImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f9f9f9',
  },
  inspirationName: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
  }
});

export default React.memo(AddWishScreen);