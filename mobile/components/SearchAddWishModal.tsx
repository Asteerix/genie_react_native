import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchAddWishModalProps {
  visible: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES = [
  'Air force one',
  'Cravate rouge',
  'Lego de londres',
  'Legos'
];

const SearchAddWishModal: React.FC<SearchAddWishModalProps> = ({
  visible,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const renderRecentSearch = (search: string) => (
    <View key={search} style={styles.recentSearchItem}>
      <Text style={styles.recentSearchText}>{search}</Text>
      <TouchableOpacity>
        <Ionicons name="close" size={24} color="#999" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          <Ionicons name="qr-code" size={24} color="#999" />
        </View>

        <ScrollView style={styles.content}>
          {RECENT_SEARCHES.map(search => renderRecentSearch(search))}

          <TouchableOpacity style={styles.defaultBrowserButton}>
            <Image 
              source={{ uri: 'https://api.a0.dev/assets/image?text=google%20G%20logo%20colored&aspect=1:1&seed=123' }}
              style={styles.googleIcon}
            />
            <Text style={styles.defaultBrowserText}>Changer de navigateur par défaut</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestion}>
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=nike%20dunk%20low%20black%20white&aspect=1:1&seed=456' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>Air Force One</Text>
                <Text style={styles.productPrice}>159.99 €</Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.suggestion}>
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=gucci%20basket%20luxury%20sneaker&aspect=1:1&seed=789' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>BASKETS GUCCI RE-WASHED</Text>
                <Text style={styles.productPrice}>439.99 €</Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
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
    padding: 15,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  recentSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentSearchText: {
    fontSize: 16,
    color: '#333',
  },
  defaultBrowserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 15,
    marginVertical: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  defaultBrowserText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  suggestionsContainer: {
    marginTop: 20,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchAddWishModal;