import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
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
  ScrollView,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
  FlatList,
  ImageErrorEventData,
  NativeSyntheticEvent
} from 'react-native';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';

// Types
interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isAdmin?: boolean;
}

interface AddAdminModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onComplete: (selectedAdmins: User[]) => void;
  currentAdmins: User[];
}

// Constants
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = 550;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
  mass: 0.4,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
  useNativeDriver: true,
};

// Mock data - ideally would be fetched from an API
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Paul Marceau',
    username: 'paulmarceau',
    avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait%20cartoon%20orange%20background&aspect=1:1&seed=13',
    isAdmin: true
  },
  {
    id: '2',
    name: 'Johanna Toulet',
    username: 'johannatoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20green%20background&aspect=1:1&seed=11',
    isAdmin: false
  },
  {
    id: '3',
    name: 'Audriana Toulet',
    username: 'adrianatoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20pink%20background&aspect=1:1&seed=12',
    isAdmin: false
  }
];

  // Memoized User Item Component
const UserItem = memo(({ user, onToggle }: { user: User, onToggle: (id: string) => void }) => {
  // Handler mémorisé pour éviter les recréations de fonction à chaque rendu
  const toggleHandler = useCallback(() => {
    onToggle(user.id);
  }, [user.id, onToggle]);

  return (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Image 
          source={{ uri: user.avatar }} 
          style={styles.userAvatar} 
          onError={() => console.log(`Impossible de charger l'image pour ${user.name}`)}
        />
        <View style={styles.userTextContainer}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userUsername}>{user.username}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[
          styles.toggleAdminButton,
          user.isAdmin ? styles.removeButton : styles.addButton
        ]}
        onPress={toggleHandler}
        activeOpacity={0.7}
        accessibilityLabel={user.isAdmin ? `Retirer ${user.name}` : `Ajouter ${user.name}`}
        accessibilityRole="button"
      >
        {user.isAdmin ? (
          <AntDesign name="close" size={24} color="#FF3B30" />
        ) : (
          <Feather name="plus" size={24} color="#000" />
        )}
      </TouchableOpacity>
    </View>
  );
});

// Search Bar Component
const SearchBar = memo(({ value, onChangeText }: { value: string, onChangeText: (text: string) => void }) => {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="Trouver un(e) ami(e)..."
          placeholderTextColor="#999"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Feather name="x" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// Main Modal Component
const AddAdminModal: React.FC<AddAdminModalProps> = ({
  visible,
  onClose,
  onBack,
  onComplete,
  currentAdmins
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values - created only once
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Initialize users with mock data and existing admins status
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      
      // Simulate API fetch delay
      setTimeout(() => {
        const initialUsers = MOCK_USERS.map(user => {
          // Check if user is already an admin
          const isAdmin = currentAdmins.some(admin => admin.id === user.id);
          return { ...user, isAdmin };
        });
        setUsers(initialUsers);
        setIsLoading(false);
      }, 300);
      
      // Animate modal in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          ...SPRING_CONFIG
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Reset state when modal is closed
      setSearchQuery('');
    }
  }, [visible, currentAdmins]);
  
  // Filter users based on search query - memoized to avoid unnecessary recalculations
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => (
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    ));
  }, [users, searchQuery]);
  
  // Memoized callbacks to prevent recreating functions on each render
  const closeModal = useCallback(() => {
    // Animate modal out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: MODAL_HEIGHT,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  }, [onClose, translateY, backdropOpacity]);
  
  const toggleUserAdmin = useCallback((userId: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, isAdmin: !user.isAdmin } 
          : user
      )
    );
  }, []);
  
  const handleComplete = useCallback(() => {
    const selectedAdmins = users.filter(user => user.isAdmin);
    onComplete(selectedAdmins);
  }, [users, onComplete]);
  
  // Optimized Pan Responder
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
          
          // Calculate opacity based on drag distance
          const newOpacity = Math.max(0, 1 - (gesture.dy / (MODAL_HEIGHT / 2)));
          backdropOpacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > MODAL_HEIGHT / 3 || gesture.vy > 0.5) {
          // If dragged far enough or with enough velocity, close the modal
          closeModal();
        } else {
          // Otherwise snap back to open position
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              ...SPRING_CONFIG
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true
            })
          ]).start();
        }
      }
    }),
  [closeModal, translateY, backdropOpacity]);
  
  // Calculate selected admin count for display
  const selectedCount = useMemo(() => 
    users.filter(user => user.isAdmin).length, 
  [users]);
  
  // Render empty state when no results found
  const renderEmptyComponent = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Feather name="users" size={40} color="#DDD" />
        <Text style={styles.emptyStateText}>
          {searchQuery 
            ? "Aucun résultat trouvé pour cette recherche" 
            : "Aucun utilisateur disponible"}
        </Text>
      </View>
    );
  }, [searchQuery, isLoading]);
  
  // Render individual list item - using keyExtractor and renderItem for FlatList performance
  const keyExtractor = useCallback((item: User) => item.id, []);
  
  const renderItem = useCallback(({ item }: { item: User }) => (
    <UserItem user={item} onToggle={toggleUserAdmin} />
  ), [toggleUserAdmin]);

  // Don't render if not visible
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <StatusBar barStyle="dark-content" />
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          onPress={closeModal}
          activeOpacity={1}
        />
      </Animated.View>
      
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
          accessibilityRole="button"
          accessibilityLabel="Faire glisser pour fermer"
        >
          <View style={styles.dragHandle} />
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeModal}
            accessibilityLabel="Fermer"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Ajouter des administrateurs</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            accessibilityLabel="Aide"
            accessibilityRole="button"
          >
            <View style={styles.helpCircle}>
              <Text style={styles.helpText}>?</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Search input */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        {/* Users list */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.userListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
          />
        )}
        
        {/* Navigation buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          
          <View style={styles.countDisplay}>
            <Text style={styles.countText}>{selectedCount} sélectionné(s)</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              selectedCount === 0 && styles.nextButtonDisabled
            ]}
            onPress={handleComplete}
            disabled={selectedCount === 0}
            accessibilityLabel="Suivant"
            accessibilityRole="button"
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Modern, optimized styles
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: MODAL_HEIGHT,
    maxHeight: SCREEN_HEIGHT * 0.9,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandleContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
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
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    fontSize: 16,
    flex: 1,
    height: '100%',
    color: '#333',
  },
  userListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for buttons
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 15,
    backgroundColor: '#F0F0F0', // Placeholder color while loading
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 15,
    color: '#777',
  },
  toggleAdminButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addButton: {
    backgroundColor: '#F0F0F0',
  },
  removeButton: {
    backgroundColor: '#FFEEEE',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 16, // Account for safe area on iOS
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  nextButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 4,
  },
  countDisplay: {
    paddingHorizontal: 10,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});

export default AddAdminModal;