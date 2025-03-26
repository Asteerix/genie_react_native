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
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import WishlistOptionalInfoModal from './WishlistOptionalInfoModal';

interface CreateWishlistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateWishlist: (title: string, options?: { description?: string }) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = 300;

const CreateWishlistModal: React.FC<CreateWishlistModalProps> = ({
  visible,
  onClose,
  onCreateWishlist
}) => {
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showOptionalInfoModal, setShowOptionalInfoModal] = useState(false);
  
  // Animation values
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  
  // Reset input when modal is closed
  useEffect(() => {
    if (!visible) {
      setWishlistTitle('');
      setShowOptionalInfoModal(false);
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
  
  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
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
  
  const handleNameNext = () => {
    if (!wishlistTitle.trim()) {
      toast.error('Veuillez saisir un nom pour la liste');
      return;
    }
    
    // Show optional info modal
    setShowOptionalInfoModal(true);
  };
  
  const handleOptionalInfoComplete = (data: { description: string; addAdmins: boolean }) => {
    // Close optional info modal
    setShowOptionalInfoModal(false);
    
    // Create wishlist with all data
    onCreateWishlist(wishlistTitle, { description: data.description });
    
    // Close main modal
    closeModal();
  };
  
  if (!visible) return null;
  
  return (
    <>
      <Modal
        visible={visible && !showOptionalInfoModal}
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
            
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closeModal}
              >
                <Ionicons name="close" size={28} color="black" />
              </TouchableOpacity>
              <Text style={styles.title}>Créer une liste de vœux</Text>
              <TouchableOpacity style={styles.helpButton}>
                <View style={styles.helpCircle}>
                  <Text style={styles.helpText}>?</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <View style={styles.content}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={wishlistTitle}
                  onChangeText={setWishlistTitle}
                  placeholder="Nom de la liste"
                  placeholderTextColor="#999"
                  autoFocus
                />
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.nextButton}
                  onPress={handleNameNext}
                >
                  <Text style={styles.nextButtonText}>Suivant</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Optional Info Modal */}
      <WishlistOptionalInfoModal
        visible={visible && showOptionalInfoModal}
        onClose={closeModal}
        onBack={() => setShowOptionalInfoModal(false)}
        onComplete={handleOptionalInfoComplete}
        wishlistName={wishlistTitle}
      />
    </>
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
    marginBottom: 20,
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
  content: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginBottom: 20,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 40,
  },
  nextButton: {
    backgroundColor: 'black',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default CreateWishlistModal;