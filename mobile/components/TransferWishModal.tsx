import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import EventParticipantsModal from './EventParticipantsModal';
import { toast } from 'sonner-native';

interface TransferWishModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Wishlist {
  id: string;
  title: string;
  image: string;
  isFavorite: boolean;
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

// Mock data for wishlists
const MY_WISHLISTS: Wishlist[] = [
  {
    id: '1',
    title: 'Mes favoris',
    image: 'https://api.a0.dev/assets/image?text=coffee%20beans%20different%20varieties&aspect=1:1&seed=789',
    isFavorite: true
  },
  {
    id: '2',
    title: 'Hivers 2024',
    image: 'https://api.a0.dev/assets/image?text=winter%20collage%20with%20snowflakes&aspect=1:1&seed=101112',
    isFavorite: true
  },
  {
    id: '3',
    title: "Pour mon annif'",
    image: 'https://api.a0.dev/assets/image?text=birthday%20cake%20with%20unicorn&aspect=1:1&seed=131415',
    isFavorite: false
  }
];

// Mock data for events
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
  onClose
}) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const handleWishlistSelect = (wishlist: Wishlist) => {
    // Dans une vraie app, ceci enverrait le vœu à la liste sélectionnée
    toast.success(`Vœu transféré à ${wishlist.title}`);
    onClose();
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);
  };

  const handleSelectParticipant = (participant: Participant) => {
    // Dans une vraie app, ceci transférerait le vœu au participant sélectionné
    toast.success(`Vœu transféré à ${participant.name} pour ${selectedEvent?.title}`);
    setShowParticipantsModal(false);
    onClose();
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
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Transférer un vœu</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content}>
            {/* Wishlists Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Une liste de vœux</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={24} color="black" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {MY_WISHLISTS.map((wishlist) => (
                  <TouchableOpacity 
                    key={wishlist.id} 
                    style={styles.wishlistCard}
                    onPress={() => handleWishlistSelect(wishlist)}
                  >
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: wishlist.image }} style={styles.wishlistImage} />
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
          onClose();
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
});

export default TransferWishModal;