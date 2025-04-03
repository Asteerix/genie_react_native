import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Switch,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import AddAdminModal from './AddAdminModal';
import { getUserFriends } from '../api/contacts';

interface Admin {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface WishlistOptionalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onComplete: (data: { description: string; addAdmins: boolean }) => void;
  wishlistName: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = 550;

const WishlistOptionalInfoModal: React.FC<WishlistOptionalInfoModalProps> = ({
  visible,
  onClose,
  onBack,
  onComplete,
  wishlistName
}) => {
  const [description, setDescription] = useState('');
  const [descriptionEnabled, setDescriptionEnabled] = useState(false);
  const [addAdmins, setAddAdmins] = useState(false);  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  
  // Animation values
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  
  // Reset state when modal is closed
  useEffect(() => {
    if (!visible) {
      // Don't reset the form values in case user wants to come back
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
  
  const handleComplete = async () => {
      try {
        console.log('WishlistOptionalInfoModal - handleComplete called');
        // Call parent's onComplete with optional info
        await onComplete({
          description: descriptionEnabled ? description : '',
          addAdmins: addAdmins
        });
        
        // Debug log to track modal closing
        console.log('WishlistOptionalInfoModal - Before closing modal');
        
        // Close modal after completion
        closeModal();
        
        console.log('WishlistOptionalInfoModal - After calling closeModal');
      } catch (error) {
        console.error('Error completing wishlist:', error);
        toast.error('Une erreur est survenue');
      }
    };

  const handleRemoveAdmin = (adminId: string) => {
    setAdmins(admins.filter(admin => admin.id !== adminId));
  };  
  
  const handleAddAdmin = () => {
    setShowAddAdminModal(true);
  };
  
  const handleAddAdminComplete = (selectedAdmins: Admin[]) => {
    // Mettre à jour la liste des administrateurs
    setAdmins(selectedAdmins);
    setShowAddAdminModal(false);
  };  
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.modalContainer,
          { transform: [{ translateY }] }
        ]}>
          {/* Draggable handle */}
          <View 
            {...panResponder.panHandlers}
            style={styles.dragHandleContainer}
          >
            <View style={styles.dragHandle} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeModal}
            >
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Informations facultatives</Text>
            <TouchableOpacity style={styles.helpButton}>
              <View style={styles.helpCircle}>
                <Text style={styles.helpText}>?</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.content}>
              {/* Description toggle */}
              <View style={styles.optionContainer}>
                <View style={styles.optionIconAndText}>
                  <Ionicons name="mail-outline" size={24} color="black" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Description de la liste</Text>
                </View>
                <Switch
                  value={descriptionEnabled}
                  onValueChange={setDescriptionEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
                  thumbColor={descriptionEnabled ? 'black' : 'white'}
                  ios_backgroundColor="#E0E0E0"
                  style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                />
              </View>
              
              {/* Description input field (only shown when enabled) */}
              {descriptionEnabled && (
                <View style={styles.descriptionInputContainer}>
                  <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Ajouter une description..."
                    multiline
                  />
                </View>
              )}
              
              {/* Admin toggle */}
              <View style={styles.optionContainer}>
                <View style={styles.optionIconAndText}>
                  <Ionicons name="people-outline" size={24} color="black" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Ajouter des administrateurs</Text>
                </View>
                <Switch
                  value={addAdmins}
                  onValueChange={setAddAdmins}
                  trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
                  thumbColor={addAdmins ? 'black' : 'white'}
                  ios_backgroundColor="#E0E0E0"
                  style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                />
              </View>
              
              {/* Admins list (only shown when enabled) */}
              {addAdmins && (
                <View style={styles.adminsContainer}>
                  {admins.map(admin => (
                    <View key={admin.id} style={styles.adminItem}>
                      <View style={styles.adminInfo}>
                        <Image source={{ uri: admin.avatar }} style={styles.adminAvatar} />
                        <View style={styles.adminTextContainer}>
                          <Text style={styles.adminName}>{admin.name}</Text>
                          <Text style={styles.adminUsername}>{admin.username}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeAdminButton}
                        onPress={() => handleRemoveAdmin(admin.id)}
                      >
                        <AntDesign name="close" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {/* Add admin button */}
                  <TouchableOpacity 
                    style={styles.addAdminButton}
                    onPress={handleAddAdmin}
                  >
                    <View style={styles.addAdminIconContainer}>
                      <Feather name="plus" size={24} color="#999" />
                    </View>
                    <Text style={styles.addAdminText}>Ajouter un admin</Text>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Add Admin Modal */}
          <AddAdminModal
            visible={showAddAdminModal}
            onClose={() => setShowAddAdminModal(false)}
            onBack={() => setShowAddAdminModal(false)}
            onComplete={handleAddAdminComplete}
            currentAdmins={admins}
          />

          {/* Navigation buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={24} color="#666" />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleComplete}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
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
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: 30,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionIconAndText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
  },
  descriptionInputContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  descriptionInput: {
    minHeight: 80,
    fontSize: 16,
  },
  adminsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  adminItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminUsername: {
    fontSize: 14,
    color: '#999',
  },
  removeAdminButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  addAdminIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addAdminText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 5,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 5,
  },
});

export default WishlistOptionalInfoModal;