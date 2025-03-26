import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

// Historique de recherche
const SEARCH_HISTORY = [
  'Air force one',
  'Cravate rouge',
  'Lego de londres',
  'Legos'
];

// Résultats de recherche
const SEARCH_RESULTS = [
  {
    id: '1',
    name: 'Air Force One',
    brand: 'nike',
    price: '159.99 €',
    image: 'https://api.a0.dev/assets/image?text=nike%20air%20force%20one%20black%20white%20sneakers&aspect=1:1&seed=123'
  },
  {
    id: '2',
    name: 'BASKETS GUCCI RE-WEB',
    brand: 'gucci',
    price: '439.99 €',
    image: 'https://api.a0.dev/assets/image?text=gucci%20shoes%20white%20leather%20sneakers&aspect=1:1&seed=456'
  }
];

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleRemoveHistoryItem = (item: string) => {
    // Dans une vraie app, supprimer de l'historique
    console.log('Remove from history:', item);
  };

  const handleAddToWishlist = (productId: string) => {
    // Dans une vraie app, ajouter à la wishlist
    console.log('Add to wishlist:', productId);
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
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowResults(text.length > 0);
              }}
              placeholderTextColor="#999"
              autoFocus
            />
          </View>

          <TouchableOpacity style={styles.scanButton}>
            <Ionicons name="qr-code-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {!showResults ? (
            <>
              {SEARCH_HISTORY.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyText}>{item}</Text>
                  <TouchableOpacity 
                    onPress={() => handleRemoveHistoryItem(item)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.navigatorButton}>
                <Image 
                  source={{ uri: 'https://api.a0.dev/assets/image?text=google%20G%20logo&aspect=1:1' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.navigatorText}>Changer de navigateur par défaut</Text>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>

              <View style={styles.resultsGrid}>
                {SEARCH_RESULTS.map((product) => (
                  <View key={product.id} style={styles.productCard}>
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <View style={styles.brandContainer}>
                        <Image 
                          source={{ uri: `https://api.a0.dev/assets/image?text=${product.brand}%20logo&aspect=1:1` }}
                          style={styles.brandLogo}
                        />
                        <Text style={styles.productPrice}>{product.price}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={() => handleAddToWishlist(product.id)}
                    >
                      <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.resultsGrid}>
              {SEARCH_RESULTS.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.brandContainer}>
                      <Image 
                        source={{ uri: `https://api.a0.dev/assets/image?text=${product.brand}%20logo&aspect=1:1` }}
                        style={styles.brandLogo}
                      />
                      <Text style={styles.productPrice}>{product.price}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => handleAddToWishlist(product.id)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  historyText: {
    fontSize: 16,
    color: '#000',
  },
  removeButton: {
    padding: 5,
  },
  navigatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  navigatorText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchModal;