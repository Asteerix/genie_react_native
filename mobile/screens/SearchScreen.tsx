import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Image,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mocked data (in a real app, this would come from a database or API)
const WISHLISTS = [
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

const PRODUCTS = [
  {
    id: 'p1',
    name: 'Ceinture Diesel',
    price: '129 €',
    image: 'https://api.a0.dev/assets/image?text=black%20leather%20belt%20with%20silver%20buckle&aspect=1:1&seed=123',
    isFavorite: false
  },
  {
    id: 'p2',
    name: 'Lego Star Wars',
    price: '129.95 €',
    image: 'https://api.a0.dev/assets/image?text=lego%20star%20wars%20millennium%20falcon%20set&aspect=1:1&seed=456',
    isFavorite: false
  }
];

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([...WISHLISTS, ...PRODUCTS]);
  const [inputFocused, setInputFocused] = useState(true);
  
  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([...WISHLISTS, ...PRODUCTS]);
      return;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase();
    
    const filteredWishlists = WISHLISTS.filter(list => 
      list.title.toLowerCase().includes(lowercasedQuery) || 
      (list.description && list.description.toLowerCase().includes(lowercasedQuery))
    );
    
    const filteredProducts = PRODUCTS.filter(product => 
      product.name.toLowerCase().includes(lowercasedQuery)
    );
    
    setSearchResults([...filteredWishlists, ...filteredProducts]);
  }, [searchQuery]);
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  // Render list item
  const renderListItem = (item) => {
    // If the item is a product
    if (item.id.startsWith('p')) {
      return (
        <TouchableOpacity key={item.id} style={styles.resultItem}>
          <View style={styles.itemImageContainer}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemPrice}>{item.price}</Text>
          </View>
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </View>
        </TouchableOpacity>
      );
    }
    
    // If the item is a wishlist
    return (
      <TouchableOpacity key={item.id} style={styles.resultItem}>
        <View style={styles.itemImageContainer}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          {item.isFavorite && (
            <View style={styles.favoriteTag}>
              <AntDesign name="star" size={16} color="black" />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.searchHeader}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Trouver un vœu, une liste..."
              placeholderTextColor="#888"
              autoFocus={true}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close" size={22} color="#000" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map(item => renderListItem(item))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  searchInputContainer: {
    flex: 1,
    height: 50,
    backgroundColor: '#EEEEEE',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  clearButton: {
    padding: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  itemImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  favoriteTag: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chevronContainer: {
    padding: 5,
  },
});

export default SearchScreen;