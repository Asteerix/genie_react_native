import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons, FontAwesome, AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import BottomTabBar from '../components/BottomTabBar';
import CreateWishlistModal from '../components/CreateWishlistModal';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const WishlistScreen = () => {
  const [activeTab, setActiveTab] = useState('listes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigation = useNavigation();
  
  // Animation values
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const wishesOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Mock data for products (vœux)
  const products = [
    {
      id: 'p1',
      name: 'Ceinture Diesel',
      price: '129 €',
      image: 'https://api.a0.dev/assets/image?text=black%20leather%20belt%20with%20silver%20buckle&aspect=1:1&seed=123',
      isFavorite: true
    },
    {
      id: 'p2',
      name: 'Lego Star Wars',
      price: '129.95 €',
      image: 'https://api.a0.dev/assets/image?text=lego%20star%20wars%20millennium%20falcon%20set&aspect=1:1&seed=456',
      isFavorite: false
    },
    {
      id: 'p3',
      name: 'Nike Chaussettes de sport',
      price: '189.99 €',
      image: 'https://api.a0.dev/assets/image?text=green%20sports%20car%20lego%20technic&aspect=1:1&seed=789',
      isFavorite: false
    },
    {
      id: 'p4',
      name: 'Nike Chaussettes de sport',
      price: '24.90 €',
      image: 'https://api.a0.dev/assets/image?text=white%20sport%20socks%20pair&aspect=1:1&seed=101112',
      isFavorite: false
    },
    {
      id: 'p5',
      name: 'Nike Chaussettes de sport',
      price: '129.95 €',
      image: 'https://api.a0.dev/assets/image?text=nike%20dunk%20low%20black%20white%20sneakers&aspect=1:1&seed=131415',
      isFavorite: false
    }
  ];

  // Mock data for wishlists
  const wishlists = [
    {
      id: '1',
      type: 'invitation',
      title: 'Vacances Wishlist',
      invitedBy: 'audrianatoulet',
      message: 'vous invite sur une liste',
      image: 'https://api.a0.dev/assets/image?text=tropical%20beach%20vacation%20paradise&aspect=1:1&seed=123',
      avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20profile%20portrait&aspect=1:1&seed=456'
    },
    {
      id: '2',
      type: 'list',
      title: 'Mes favoris',
      description: 'Ma liste de favoris du moment',
      image: 'https://api.a0.dev/assets/image?text=coffee%20beans%20different%20varieties&aspect=1:1&seed=789',
      isFavorite: true
    },
    {
      id: '3',
      type: 'list',
      title: 'Hivers 2024',
      description: 'Ma liste pour cet hivers 2024',
      image: 'https://api.a0.dev/assets/image?text=winter%20collage%20with%20snowflakes&aspect=1:1&seed=101112',
      isFavorite: true
    },
    {
      id: '4',
      type: 'list',
      title: 'Pour mon annif\'',
      description: 'Pour le 5 septembre',
      image: 'https://api.a0.dev/assets/image?text=birthday%20cake%20with%20unicorn&aspect=1:1&seed=131415',
      isFavorite: false
    },
    {
      id: '5',
      type: 'list',
      title: 'Vacances Wishlist',
      description: 'Les choses à acheter pour les vacances',
      image: 'https://api.a0.dev/assets/image?text=tropical%20beach%20vacation%20paradise&aspect=1:1&seed=123',
      avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20profile%20portrait&aspect=1:1&seed=456',
      isFavorite: false
    },
  ];

  // Tab switching animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(tabIndicator, {
        toValue: activeTab === 'listes' ? 0 : 1,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(listOpacity, {
        toValue: activeTab === 'listes' ? 1 : 0,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(wishesOpacity, {
        toValue: activeTab === 'listes' ? 0 : 1,
        duration: 250,
        useNativeDriver: true
      })
    ]).start();
  }, [activeTab]);

  const translateX = tabIndicator.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - 40]
  });

  // Pressable animation handler
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  const renderInvitationCard = (wishlist) => (
    <Animated.View 
      style={[styles.invitationCard, { transform: [{ scale: scaleAnim }] }]} 
      key={wishlist.id}
    >
      <View style={styles.cardContent}>
        <Image source={{ uri: wishlist.image }} style={styles.wishlistImage} />
        <View style={styles.avatarContainer}>
          <Image source={{ uri: wishlist.avatar }} style={styles.avatarImage} />
        </View>
        <View style={styles.invitationInfo}>
          <Text style={styles.wishlistTitle}>{wishlist.title} <Ionicons name="chevron-forward" size={16} color="#888" /></Text>
          <Text style={styles.invitationText}>
            <Text style={styles.invitedBy}>{wishlist.invitedBy}</Text> {wishlist.message}
          </Text>
        </View>
      </View>
      <View style={styles.invitationActions}>
        <TouchableOpacity 
          style={styles.rejectButton}
          activeOpacity={0.7}
        >
          <AntDesign name="close" size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptButton}
          activeOpacity={0.7}
        >
          <AntDesign name="check" size={24} color="green" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderWishlistCard = (wishlist) => (
    <Pressable 
      style={styles.wishlistCard} 
      key={wishlist.id}
      onPress={() => navigation.navigate('WishlistDetail', { wishlistId: wishlist.id })}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: '#f0f0f0', borderless: false }}
    >
      <View style={styles.wishlistImageContainer}>
        <Image source={{ uri: wishlist.image }} style={styles.wishlistImage} />
        {wishlist.isFavorite && (
          <View style={styles.favoriteTag}>
            <AntDesign name="star" size={16} color="black" />
          </View>
        )}
        {wishlist.avatar && (
          <View style={styles.avatarContainer}>
            <Image source={{ uri: wishlist.avatar }} style={styles.avatarImage} />
          </View>
        )}
      </View>
      <View style={styles.wishlistInfo}>
        <Text style={styles.wishlistTitle}>{wishlist.title}</Text>
        <Text style={styles.wishlistDescription} numberOfLines={1}>{wishlist.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#888" style={styles.chevronIcon} />
    </Pressable>
  );

  const renderProductCard = (product, index) => (
    <Pressable
      key={product.id}
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: '#f0f0f0', borderless: false }}
    >
      <View style={styles.productImageContainer}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
        {product.isFavorite && (
          <View style={styles.favoriteTag}>
            <AntDesign name="star" size={16} color="black" />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
        <View style={styles.priceAndButtonContainer}>
          <Text style={styles.productPrice}>{product.price}</Text>
          <TouchableOpacity 
            style={styles.productButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
          >
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes vœux</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={28} color="black" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            activeOpacity={0.7}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab Container with Animated Indicator */}
      <View style={styles.tabContainer}>
        <Animated.View 
          style={[
            styles.tabIndicator, 
            { 
              transform: [{ translateX }],
              width: width / 2 - 40
            }
          ]} 
        />
        <TouchableOpacity 
          style={styles.tab} 
          activeOpacity={0.7}
          onPress={() => setActiveTab('listes')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'listes' && styles.activeTabText
          ]}>
            Listes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab} 
          activeOpacity={0.7}
          onPress={() => setActiveTab('voeux')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'voeux' && styles.activeTabText
          ]}>
            Vœux
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Lists Tab */}
        <Animated.View 
          style={[
            styles.tabContent,
            { opacity: listOpacity, display: activeTab === 'listes' ? 'flex' : 'none' }
          ]}
        >
          {wishlists.map(wishlist => 
            wishlist.type === 'invitation' 
              ? renderInvitationCard(wishlist) 
              : renderWishlistCard(wishlist)
          )}
        </Animated.View>
        
        {/* Wishes Tab */}
        <Animated.View 
          style={[
            styles.tabContent,
            { opacity: wishesOpacity, display: activeTab === 'voeux' ? 'flex' : 'none' }
          ]}
        >
          <View style={styles.productsGrid}>
            {products.map((product, index) => renderProductCard(product, index))}
            <TouchableOpacity 
              style={styles.addProductCard}
              activeOpacity={0.7}
            >
              <View style={styles.addProductIconContainer}>
                <Feather name="plus" size={40} color="#999" />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Create Wishlist Modal */}
      <CreateWishlistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWishlist={(title) => {
          console.log('Nouvelle liste créée:', title);
          toast.success(`Liste "${title}" créée avec succès`);
          setShowCreateModal(false);
        }}
      />
      
      {/* Bottom navigation bar */}
      <BottomTabBar activeTab="wishes" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 20,
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    padding: 4,
    position: 'relative',
    height: 50,
  },
  tabIndicator: {
    position: 'absolute',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#000',
    top: 0,
    left: 0,
    margin: 4,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 90, // Extra space for bottom tab bar
  },
  tabContent: {
    width: '100%',
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -5,
    left: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  invitationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  invitationText: {
    fontSize: 14,
    color: '#333',
  },
  invitedBy: {
    fontWeight: '400',
    color: '#777',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  rejectButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  acceptButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEFFEE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  wishlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 5,
  },
  wishlistImageContainer: {
    position: 'relative',
  },
  favoriteTag: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FFD700',
    borderRadius: 5,
    padding: 3,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  wishlistInfo: {
    flex: 1,
    paddingLeft: 15,
  },
  wishlistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wishlistDescription: {
    fontSize: 14,
    color: '#666',
  },
  chevronIcon: {
    paddingLeft: 10,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    height: 150
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  favoriteTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
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
  productButton: {
    backgroundColor: '#000',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductCard: {
    width: '48%',
    height: 230,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  addProductIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default WishlistScreen;