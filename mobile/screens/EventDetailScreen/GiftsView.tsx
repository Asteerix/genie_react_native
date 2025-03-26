import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { GiftsViewProps, Gift } from './types';
import { isGiftSelected, toggleGiftSelection } from './utils';

const { width } = Dimensions.get('window');

const GiftsView: React.FC<GiftsViewProps> = ({
  eventDetails,
  handleSelectCollaborativeGift,
  handleGiftPress,
  isSelectionMode,
  setIsSelectionMode,
  selectedGifts,
  setSelectedGifts,
  selectedCount,
  setShowParticipantsView,
}) => {
  // Fonction pour rendre chaque cadeau
  const renderGiftItem = ({ item }: { item: Gift }) => {
    const isSelected = isGiftSelected(item.id, selectedGifts);
    
    return (
      <TouchableOpacity
        style={[
          styles.giftItem,
          isSelected && styles.selectedGiftItem
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleGiftSelection(item.id, selectedGifts, setSelectedGifts);
          } else {
            handleGiftPress(item);
          }
        }}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleGiftSelection(item.id, selectedGifts, setSelectedGifts);
          }
        }}
      >
        <View style={styles.giftImageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.giftImage}
            resizeMode="cover"
          />
          {isSelectionMode && (
            <View style={[
              styles.selectionIndicator,
              isSelected && styles.selectedIndicator
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              )}
            </View>
          )}
          {item.isFavorite && (
            <View style={styles.favoriteIndicator}>
              <MaterialIcons name="favorite" size={16} color="#FF5757" />
            </View>
          )}
        </View>
        
        <View style={styles.giftInfo}>
          <Text style={styles.giftName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.giftPrice}>{item.price}</Text>
          
          {item.addedBy && (
            <View style={styles.addedByContainer}>
              <Image
                source={{ uri: item.addedBy.avatar }}
                style={styles.addedByAvatar}
              />
              <Text style={styles.addedByName} numberOfLines={1}>
                {item.addedBy.name}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Vérifie si l'événement a des cadeaux (uniquement les événements de type 'owned')
  const hasGifts = 'type' in eventDetails && eventDetails.type === 'owned' && eventDetails.gifts && eventDetails.gifts.length > 0;
  
  // Les cadeaux à afficher
  const giftsToDisplay = hasGifts && 'gifts' in eventDetails ? eventDetails.gifts : [];
  
  // Rendu des cadeaux - utilisation de FlatList pour un défilement efficace
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowParticipantsView(true)}
        >
          <Text style={styles.filterButtonText}>Par personne</Text>
          <Ionicons name="chevron-forward" size={16} color="#333" />
        </TouchableOpacity>
        
        {isSelectionMode ? (
          <View style={styles.selectionToolbar}>
            <Text style={styles.selectedCount}>
              {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => setIsSelectionMode(false)}
            >
              <Text style={styles.selectionButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleSelectCollaborativeGift}
          >
            <Ionicons name="add" size={24} color="#5E60CE" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {hasGifts ? (
        <FlatList
          data={giftsToDisplay}
          renderItem={renderGiftItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.giftList}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            Aucun cadeau n'a été ajouté pour cet événement
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={handleSelectCollaborativeGift}
          >
            <Text style={styles.emptyStateButtonText}>
              Ajouter un cadeau
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5E60CE',
    marginLeft: 4,
  },
  giftList: {
    padding: 8,
  },
  giftItem: {
    width: (width - 40) / 2,
    marginHorizontal: 6,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  selectedGiftItem: {
    borderColor: '#5E60CE',
    backgroundColor: '#F5F5FF',
  },
  giftImageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#F8F8F8',
  },
  giftImage: {
    width: '100%',
    height: '100%',
  },
  giftInfo: {
    padding: 10,
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  giftPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  addedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addedByAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  addedByName: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedIndicator: {
    backgroundColor: '#5E60CE',
  },
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 12,
  },
  selectionButton: {
    padding: 6,
  },
  selectionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5E60CE',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#5E60CE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default GiftsView;