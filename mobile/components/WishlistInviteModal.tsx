import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface WishlistInviteModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  wishlistData: {
    title: string;
    inviter: string;
  };
}

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

const WishlistInviteModal: React.FC<WishlistInviteModalProps> = ({
  visible,
  onClose,
  onAccept,
  onDecline,
  wishlistData
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Animation values
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  
  // Reset when modal is closed
  useEffect(() => {
    if (!visible) {
      // Reset any state if needed
    } else {
      // Animate modal in when visible
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14
      }).start();
    }
  }, [visible]);
  
  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > MODAL_HEIGHT / 3) {
          // If dragged far enough, close the modal
          closeModal();
        } else {
          // Otherwise snap back to open position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0
          }).start();
        }
      }
    })
  ).current;
  
  const closeModal = () => {
    // Animate modal out
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onClose();
    });
  };
  
  // Exemple de données pour les produits
  const wishItems = [
    {
      id: '1',
      name: 'Amazon Rings',
      price: '17.90 €',
      image: require('../assets/icon.png') // Remplacer par l'image appropriée
    },
    {
      id: '2',
      name: 'SAC SUPER MIGNON',
      price: '1750 €',
      image: require('../assets/icon.png'), // Remplacer par l'image appropriée
      isFavorite: true
    },
    {
      id: '3',
      name: 'Asos Boots',
      price: '87.95 €',
      image: require('../assets/icon.png') // Remplacer par l'image appropriée
    }
  ];
  
  // Exemple de données pour les listes de vœux
  const wishLists = [
    {
      id: 'add',
      name: 'Créer une liste',
      image: null,
      isAdd: true
    },
    {
      id: '1',
      name: 'Ma moto idéale',
      image: require('../assets/icon.png'), // Remplacer par l'image appropriée
      isFavorite: true
    },
    {
      id: '2',
      name: 'Hello winter',
      image: require('../assets/icon.png') // Remplacer par l'image appropriée
    }
  ];
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY }] }
          ]}
        >
          {/* Draggable handle */}
          <View 
            {...panResponder.panHandlers}
            style={styles.dragHandleContainer}
          >
            <View style={styles.dragHandle} />
          </View>
          
          {/* Invitation Card */}
          <View style={styles.invitationCard}>
            <View style={styles.invitationHeader}>
              <View style={styles.invitationTitleContainer}>
                <Text style={styles.invitationTitle}>{wishlistData.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#000" />
              </View>
              
              <View style={styles.inviterContainer}>
                <Image
                  source={{ uri: 'https://ui-avatars.com/api/?name=AT&background=ff9a9a&color=fff&size=200' }}
                  style={styles.inviterAvatar}
                />
                <View style={styles.invitationTextContainer}>
                  <Text style={styles.inviterName}>{wishlistData.inviter}</Text>
                  <Text style={styles.invitationText}>vous invite sur une liste</Text>
                </View>
              </View>
              
              <View style={styles.invitationActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton]}
                  onPress={onDecline}
                >
                  <Ionicons name="close" size={24} color="#FF3B30" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={onAccept}
                >
                  <Ionicons name="checkmark" size={24} color="#34C759" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Mes vœux section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mes vœux</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>voir tout</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.wishItemsContainer}
              >
                {wishItems.map(item => (
                  <TouchableOpacity key={item.id} style={styles.wishItem}>
                    <View style={styles.wishItemImageContainer}>
                      <Image source={item.image} style={styles.wishItemImage} />
                      {item.isFavorite && (
                        <View style={styles.favoriteIconContainer}>
                          <Ionicons name="star" size={16} color="black" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.wishItemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.wishItemPrice}>{item.price}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Mes listes de vœux section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Mes listes de vœux</Text>
              
              <View style={styles.wishListsContainer}>
                {wishLists.map(list => (
                  <TouchableOpacity key={list.id} style={styles.wishListItem}>
                    {list.isAdd ? (
                      <View style={styles.addListContainer}>
                        <Ionicons name="add" size={40} color="#999" />
                      </View>
                    ) : (
                      <View style={styles.wishListImageContainer}>
                        <Image source={list.image} style={styles.wishListImage} />
                        {list.isFavorite && (
                          <View style={styles.favoriteIconContainer}>
                            <Ionicons name="star" size={16} color="black" />
                          </View>
                        )}
                      </View>
                    )}
                    <Text style={styles.wishListName} numberOfLines={2}>{list.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: MODAL_HEIGHT,
    maxHeight: MODAL_HEIGHT,
  },
  dragHandleContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
  },
  invitationCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  invitationHeader: {
    width: '100%',
  },
  invitationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  invitationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 5,
  },
  inviterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inviterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  invitationTextContainer: {
    flexDirection: 'column',
  },
  invitationText: {
    fontSize: 16,
    color: '#000',
  },
  inviterName: {
    fontSize: 16,
    color: '#888',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
    gap: 10,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#FFEBEE',
  },
  acceptButton: {
    backgroundColor: '#E8F5E9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 16,
    color: '#666',
  },
  wishItemsContainer: {
    paddingRight: 20,
  },
  wishItem: {
    width: 150,
    marginRight: 15,
  },
  wishItemImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  wishItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  wishItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  wishListsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wishListItem: {
    width: '30%',
    marginBottom: 20,
  },
  addListContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  wishListImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  wishListImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishListName: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WishlistInviteModal;