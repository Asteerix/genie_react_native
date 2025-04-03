import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  Platform,
  Linking,
  ScrollView
} from 'react-native';
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import InAppBrowser from './InAppBrowser';

interface EventGiftDetailModalProps {
  visible: boolean;
  onClose: () => void;
  gift?: {
    id: string;
    name: string;
    price: string;
    image: string;
    quantity?: number; // Rendre la quantité optionnelle
    size?: string;
    color?: string;
    addedBy?: { // Rendre addedBy optionnel
      name: string;
      avatar: string;
    };
    isFavorite?: boolean;
  };
}

const EventGiftDetailModal: React.FC<EventGiftDetailModalProps> = ({
  visible,
  onClose,
  gift
}) => {
  const [showBrowser, setShowBrowser] = useState(false);
  if (!gift) return null;

  const handleModify = () => {
    // Dans une vraie app, implémentez la logique de modification
    console.log('Modifier le vœu:', gift.id);
  };

  const handleTransfer = () => {
    // Dans une vraie app, implémentez la logique de transfert
    console.log('Transférer le vœu:', gift.id);
  };  const handleViewOnline = () => {
    setShowBrowser(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{gift.name}</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Image produit */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: gift.image }} style={styles.productImage} />
          </View>

          {/* Prix et quantité */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{gift.price}</Text>
            <Text style={styles.quantity}>Quantité : {gift.quantity}</Text>
          </View>          {/* Ajouté par */}
          {gift.addedBy && (
            <View style={styles.addedByContainer}>
              <Image source={{ uri: gift.addedBy.avatar || '' }} style={styles.addedByAvatar} />
              <View style={styles.addedByContent}>
                <Text style={styles.addedByLabel}>Article ajouté par</Text>
                <Text style={styles.addedByName}>{gift.addedBy.name || 'Inconnu'}</Text>
              </View>
            </View>
          )}

          {/* Boutons d'action */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.modifyButton} onPress={handleModify}>
              <Text style={styles.buttonText}>Modifier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.transferButton} onPress={handleTransfer}>
              <Text style={styles.buttonText}>Transférer</Text>
              <Ionicons name="arrow-forward" size={20} color="black" />
            </TouchableOpacity>
          </View>

          {/* Informations */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>Informations</Text>
              <View style={styles.favoriteTag}>
                <AntDesign name="star" size={20} color="black" />
              </View>
            </View>
            {(gift.size || gift.color) && (
              <Text style={styles.infoText}>
                {[
                  gift.size && `Taille ${gift.size}`,
                  gift.color && `Couleur ${gift.color}`
                ].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Bouton voir en ligne */}        <TouchableOpacity style={styles.viewOnlineButton} onPress={handleViewOnline}>
          <Text style={styles.viewOnlineText}>Voir l'article en ligne</Text>
        </TouchableOpacity>
        
        {/* In-App Browser Modal */}
        <InAppBrowser
          visible={showBrowser}
          onClose={() => setShowBrowser(false)}
          url="https://example.com/product"
        />
        </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomColor: '#EEEEEE',
    borderBottomWidth: 1
  },
  closeButton: {
    padding: 5
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  shareButton: {
    padding: 5
  },
  content: {
    flex: 1
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    padding: 15
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  priceContainer: {
    paddingHorizontal: 20,
    marginBottom: 20
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5
  },
  quantity: {
    fontSize: 16,
    color: '#000000'
  },
  addedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12
  },
  addedByAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  addedByContent: {
    flex: 1
  },
  addedByLabel: {
    fontSize: 14,
    color: '#666666'
  },
  addedByName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000'
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 20,
    gap: 10
  },
  modifyButton: {
    flex: 1,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  transferButton: {
    flex: 1,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    gap: 5
  },
  buttonText: {
    fontSize: 16,
    color: '#000000'
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 100
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  favoriteTag: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoText: {
    fontSize: 16,
    color: '#000000'
  },
  viewOnlineButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  viewOnlineText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default EventGiftDetailModal;