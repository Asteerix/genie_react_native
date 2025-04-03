import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WishItemType, WishlistType } from '../api/wishlists'; // Ajuster le chemin si nécessaire

interface SelectWishForEventModalProps {
  visible: boolean;
  onClose: () => void;
  wishlists: WishlistType[];
  wishItems: WishItemType[];
  onWishSelected: (wishItemId: string) => void;
}

const SelectWishForEventModal: React.FC<SelectWishForEventModalProps> = ({
  visible,
  onClose,
  wishlists,
  wishItems,
  onWishSelected,
}) => {

  // Helper pour trouver le nom de la wishlist d'un item
  const getWishlistName = (wishlistId: string): string => {
    const wishlist = wishlists.find(w => w.id === wishlistId);
    return wishlist?.name || 'Wishlist inconnue';
  };

  const renderWishItem = ({ item }: { item: WishItemType }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        onWishSelected(item.id);
        // onClose(); // Fermer le modal après sélection
      }}
    >
      <Image source={{ uri: item.imageUrl || `https://api.a0.dev/assets/image?text=${item.name.substring(0,2)}&aspect=1:1&seed=${item.id}` }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemWishlistName}>De: {getWishlistName(item.wishlistId)}</Text>
        {item.price && <Text style={styles.itemPrice}>{item.price.toFixed(2)} €</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.bottomSheet}>
          {/* Poignée */}
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Ajouter un vœu à l'événement</Text>
          <FlatList
            data={wishItems}
            renderItem={renderWishItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Vous n'avez aucun vœu dans vos wishlists.</Text>}
          />
           <TouchableOpacity style={styles.closeButton} onPress={onClose}>
             <Text style={styles.closeButtonText}>Annuler</Text>
           </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%', // Limiter la hauteur
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  list: {
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemWishlistName: {
      fontSize: 13,
      color: '#888',
      marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#999',
  },
  closeButton: {
      backgroundColor: '#F0F0F0',
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
  },
  closeButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
  }
});

export default SelectWishForEventModal;
