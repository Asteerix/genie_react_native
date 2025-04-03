import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import EventParticipantsModal from './EventParticipantsModal';
import { toast } from 'sonner-native';
import { useWishlist } from '../context/WishlistContext';
import { WishlistType, WishItemType, CreateWishItemRequest } from '../api/wishlists';
// Importer ItemDataType depuis le fichier de types partagé
import { ItemDataType } from '../types/products';

interface TransferWishModalProps {
  visible: boolean;
  onClose: () => void;
  itemData: ItemDataType | null; // Passer l'objet complet au lieu de juste l'ID
  onTransferSuccess?: (item: WishItemType) => void; // Peut retourner l'item ajouté/transféré
  onAddSuccess?: (item: WishItemType) => void; // Callback spécifique pour l'ajout
}

interface Event {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  image: string;
  color: string;
}

interface Participant {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

// Helper function to check if a string is a valid MongoDB ObjectID
const isValidObjectId = (id: string): boolean => {
	return /^[0-9a-fA-F]{24}$/.test(id);
  };

// Mock data for events - will be replaced with real events later
const EVENTS: Event[] = [
  {
    id: '1',
    title: 'Mariage',
    subtitle: 'Dan & Audriana',
    date: '15/06/2025',
    image: 'https://api.a0.dev/assets/image?text=engagement%20ring%20icon%20simple&aspect=1:1&seed=111',
    color: '#E3F2FD'
  },
  {
    id: '2',
    title: 'Anniversaire',
    subtitle: 'Paul Marceau',
    date: '03/04/2025',
    image: 'https://api.a0.dev/assets/image?text=birthday%20cake%20icon%20simple&aspect=1:1&seed=222',
    color: '#F3E5F5'
  },
  {
    id: '3',
    title: 'Noël',
    subtitle: 'Noël 2024',
    date: '25/12/2024',
    image: 'https://api.a0.dev/assets/image?text=christmas%20tree%20icon%20simple&aspect=1:1&seed=333',
    color: '#FFE4E1'
  }
];

const TransferWishModal: React.FC<TransferWishModalProps> = ({
  visible,
  onClose,
  itemData, // Utiliser itemData
  onTransferSuccess,
  onAddSuccess // Nouveau callback
}) => {
  // Use local loading state instead of relying on context's isLoading state
  // Récupérer aussi addWishItem
  const { wishlists, transferWish, addWishItem } = useWishlist();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // We don't fetch wishlists directly in this component to prevent infinite loops
  // The parent component should handle refreshing data before opening this modal

  const handleWishlistSelect = async (targetWishlist: WishlistType) => {
    // Vérifier si itemData existe et si une opération est déjà en cours
    if (!itemData || isTransferring) return;

    setIsTransferring(true);
    const currentItemId = itemData.id; // Utiliser l'ID de itemData

    try {
      if (isValidObjectId(currentItemId)) {
        // --- Transfert d'un vœu existant ---
        console.log(`TransferWishModal: Transfert de l'ObjectID ${currentItemId} vers ${targetWishlist.title}`);
        const transferredItem = await transferWish(currentItemId, targetWishlist.id);
        // Note: transferWish retourne l'item mis à jour qui inclut le nouveau wishlistId
        if (transferredItem) {
          toast.success(`Vœu transféré vers ${targetWishlist.title}`);
          onTransferSuccess?.(transferredItem); // Passer l'item transféré au callback
          onClose();
        }
        // L'erreur est déjà gérée et toastée dans transferWish
      } else {
        // --- Ajout d'un nouveau vœu depuis un produit scrapé ---
        console.log(`TransferWishModal: Ajout du produit ${currentItemId} à ${targetWishlist.title}`);
        // Construire la requête à partir de itemData
        // Déterminer le nom et le lien corrects en fonction du type réel de itemData
        let determinedName: string = '';
        let determinedLink: string | undefined = undefined;
        let determinedImageUrl: string | undefined = undefined;

        // Vérifier si c'est un ProductItem (qui a 'title' et 'url')
        // ou un WishItemType (qui a 'name' et 'link')
        if ('title' in itemData && itemData.title) { // Probablement ProductItem
            determinedName = itemData.title;
            determinedLink = itemData.url;
            determinedImageUrl = itemData.imageUrl;
        } else if ('name' in itemData && itemData.name) { // Probablement WishItemType
            determinedName = itemData.name;
            determinedLink = itemData.link;
            // Utiliser imageUrl s'il existe, sinon vérifier explicitement imageURL sur WishItemType
            determinedImageUrl = itemData.imageUrl;
            if (!determinedImageUrl && 'imageURL' in itemData) {
                 // Type guard pour vérifier que c'est bien un WishItemType avant d'accéder à imageURL
                 const wishItem = itemData as WishItemType;
                 determinedImageUrl = wishItem.imageURL;
            }
        } else {
             // Fallback si ni title ni name n'est trouvé
             determinedName = 'Produit sans nom';
             determinedImageUrl = itemData.imageUrl; // Essayer de prendre imageUrl quand même
             determinedLink = itemData.link; // Essayer de prendre link quand même
        }

        const newItemData: CreateWishItemRequest = {
          wishlistId: targetWishlist.id,
          name: determinedName, // Utiliser le nom déterminé (garanti d'être une string)
          price: itemData.price,
          currency: itemData.currency,
          imageURL: determinedImageUrl, // Utiliser l'URL d'image déterminée
          link: determinedLink, // Utiliser le lien déterminé
          // isFavorite: false, // Ne pas définir isFavorite à la création
        };
        const newWishItem = await addWishItem(newItemData);
        if (newWishItem) {
           toast.success(`Produit ajouté à ${targetWishlist.title}`);
           onAddSuccess?.(newWishItem); // Appeler le callback spécifique avec le nouvel item
           onClose();
        }
         // L'erreur est déjà gérée et toastée dans addWishItem
      }
    } catch (error) {
      // Les erreurs spécifiques sont déjà loggées et toastées dans les fonctions appelées
      console.error(`Error in handleWishlistSelect for item ${currentItemId}:`, error);
      // Pas besoin de toast générique ici car les fonctions du contexte le font
    } finally {
      setIsTransferring(false);
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);
  };

  // La logique de transfert vers un participant doit aussi être revue si elle doit gérer des produits scrapés
  const handleSelectParticipant = async (participant: Participant) => {
     if (!itemData || isTransferring) return; // Utiliser itemData ici aussi
     const currentItemId = itemData.id;

    try {
      setIsTransferring(true);
      
      // TODO: Implémenter la logique API réelle pour transférer/ajouter à un participant
      // Si currentItemId n'est pas un ObjectID, il faudra créer un nouveau vœu pour le participant
      console.warn(`Logique de transfert/ajout à un participant (${participant.id}) pour l'item ${currentItemId} non implémentée.`);
      
      // Simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Obtenir le nom/titre de manière sûre
      const itemName = ('name' in itemData && itemData.name) ? itemData.name : (('title' in itemData && itemData.title) ? itemData.title : 'cet élément');
      toast.success(`Action simulée: Vœu ${itemName} transféré/ajouté pour ${participant.name}`);
      setShowParticipantsModal(false);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'action vers le participant');
      console.error(`Error handling participant selection for item ${currentItemId}:`, error);
    } finally {
      setIsTransferring(false);
    }
  };

  const renderWishlists = () => {
    if (localLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="black" />
          <Text style={styles.loadingText}>Chargement des listes...</Text>
        </View>
      );
    }

    if (wishlists.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune liste disponible</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {wishlists.map((wishlist) => (
          <TouchableOpacity
            key={wishlist.id}
            style={styles.wishlistCard}
            onPress={() => handleWishlistSelect(wishlist)}
            disabled={isTransferring}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: wishlist.coverImage || 'https://via.placeholder.com/100?text=Wishlist' }}
                style={styles.wishlistImage}
              />
              {wishlist.isFavorite && (
                <View style={styles.favoriteTag}>
                  <AntDesign name="star" size={16} color="black" />
                </View>
              )}
            </View>
            <Text style={styles.wishlistTitle} numberOfLines={1}>
              {wishlist.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isTransferring || localLoading}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Transférer un vœu</Text>
            <View style={styles.headerSpacer} />
          </View>

          {isTransferring && (
            <View style={styles.transferringOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.transferringText}>Transfert en cours...</Text>
            </View>
          )}

          <ScrollView style={styles.content}>
            {/* Wishlists Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Une liste de vœux</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={24} color="black" />
                </TouchableOpacity>
              </View>

              {renderWishlists()}
            </View>

            {/* Events Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Un événement</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={24} color="black" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {EVENTS.map((event) => (
                  <TouchableOpacity 
                    key={event.id} 
                    style={styles.eventCard}
                    onPress={() => handleEventSelect(event)}
                    disabled={isTransferring}
                  >
                    <View 
                      style={[
                        styles.eventImageContainer,
                        { backgroundColor: event.color }
                      ]}
                    >
                      <Image source={{ uri: event.image }} style={styles.eventImage} />
                    </View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal pour sélectionner un participant */}
      <EventParticipantsModal
        visible={showParticipantsModal}
        onClose={() => {
          setShowParticipantsModal(false);
          // Do not call onClose() here as it would close both modals
        }}
        onBack={() => setShowParticipantsModal(false)}
        event={selectedEvent}
        onSelectParticipant={handleSelectParticipant}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    minHeight: '70%',
    maxHeight: '90%',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScroll: {
    paddingLeft: 20,
  },
  wishlistCard: {
    marginRight: 15,
    width: 100,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  wishlistImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  favoriteTag: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  eventCard: {
    marginRight: 15,
    width: 100,
    alignItems: 'center',
  },
  eventImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventImage: {
    width: 60,
    height: 60,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  transferringOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  transferringText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
});

export default TransferWishModal;