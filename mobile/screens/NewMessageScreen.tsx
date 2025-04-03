import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useProfile, ProfileType } from '../context/ProfileContext';
import { useMessaging } from '../context/MessagingContext';
import { API_BASE_URL } from '../config';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status?: string;
  balance?: number;
  isManagedAccount?: boolean;
}

type NewMessageRouteProp = RouteProp<RootStackParamList, 'NewMessage'>;

const NewMessageScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NewMessageRouteProp>();
  const { mode } = route.params || {};
  const { currentUser, managedAccounts } = useProfile();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [groupChatName, setGroupChatName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isTransferMode = mode === 'transfer';
  // Will fetch friends from API
  const [regularFriends, setRegularFriends] = useState<Friend[]>([]);
  
  // Convert managed accounts to friend format for the list
  const managedAccountFriends: Friend[] = currentUser ? [
    // Include current user first if in transfer mode
    ...(isTransferMode && currentUser ? [{
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      balance: currentUser.balance,
      isManagedAccount: true
    }] : []),
    // Then add all managed accounts
    ...managedAccounts.map(account => ({
      id: account.id,
      name: account.name,
      username: account.username,
      avatar: account.avatar,
      balance: account.balance,
      isManagedAccount: true
    }))
  ] : [];
  
  // Load friends from API on component mount
  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        // Fetch actual friends from the API using the correct endpoints
        const response = await fetch(`${API_BASE_URL}/api/users/find-contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ phoneNumbers: [] }) // Empty list to get all contacts
        });
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
        
        const data = await response.json();
        
        // Transform API data to match Friend interface
        const friendsList = data.contacts ? data.contacts.map((contact: { id: string; name: string; username?: string; email?: string; avatar?: string; status?: string; balance?: number }) => ({
          id: contact.id,
          name: contact.name || '',
          username: contact.username || contact.email || '',
          avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || '')}&background=random&color=fff`,
          status: contact.status || 'En ligne',
          balance: contact.balance || 0,
        })) : [];
        
        setRegularFriends(friendsList);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // Fallback to alternative endpoint if main contacts endpoint fails
        try {
          const token = await AsyncStorage.getItem('accessToken');
          console.log('Using token for friends fallback:', token ? token.substring(0, 10) + '...' : 'No token');
          const response = await fetch(`${API_BASE_URL}/api/friends`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch friends');
          }
          
          const data = await response.json();
          const friendsList = data.friends ? data.friends.map((friend: { id: string; firstName: string; lastName: string; username?: string; email?: string; avatarUrl?: string; online?: boolean; balance?: number }) => ({
            id: friend.id,
            name: `${friend.firstName} ${friend.lastName}`,
            username: friend.username || friend.email || '',
            avatar: friend.avatarUrl || `https://api.a0.dev/assets/image?text=${encodeURIComponent(friend.firstName)}&aspect=1:1`,
            status: friend.online ? 'En ligne' : 'Hors ligne',
            balance: friend.balance || 0,
          })) : [];
          
          setRegularFriends(friendsList);
        } catch (fallbackError) {
          console.error('Error fetching friends fallback:', fallbackError);
          Alert.alert('Error', 'Failed to load contacts');
          setRegularFriends([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContacts();
  }, []);
  
  // Combine managed accounts and regular friends based on mode
  const allContacts = isTransferMode
    ? [...managedAccountFriends, ...regularFriends]
    : [...regularFriends];

  const filteredFriends = searchQuery
    ? allContacts.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allContacts;

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const toggleFriendSelection = (friend: Friend) => {
    if (isTransferMode) {
      // In transfer mode, only select one friend (replace any existing selection)
      if (selectedFriends.some(f => f.id === friend.id)) {
        // If clicking on the already selected friend, deselect it
        setSelectedFriends([]);
      } else {
        // Select only this friend
        setSelectedFriends([friend]);
      }
    } else {
      // In chat mode, allow multiple selections
      if (selectedFriends.some(f => f.id === friend.id)) {
        // Remove friend if already selected
        setSelectedFriends(prev => prev.filter(f => f.id !== friend.id));
      } else {
        // Add friend if not selected
        setSelectedFriends(prev => [...prev, friend]);
      }
    }
  };

  const { createChat } = useMessaging();

  const handleStartChat = async () => {
    if (selectedFriends.length === 0) return;
    
    setIsLoading(true);
    
    try {
      if (isTransferMode) {
        // Handle transfer mode - navigate to payment screen
        const recipient = selectedFriends[0];
        
        // Navigate to the amount selection screen
        navigation.navigate('ChooseAmount', {
          user: {
            id: recipient.id,
            name: recipient.name,
            avatar: recipient.avatar
          }
        });
      } else {
        // Regular chat creation flow
        const isGroupChat = selectedFriends.length > 1;
        const participantIds = selectedFriends.map(friend => friend.id);
        
        // For group chat, use group name or generate from friend names
        let chatName = '';
        if (isGroupChat) {
          chatName = groupChatName.trim() || selectedFriends.map(f => f.name.split(' ')[0]).join(', ');
        } else {
          chatName = selectedFriends[0].name;
        }
        
        // Create the chat using API
        const chatType = isGroupChat ? 'group' : 'direct';
        const chat = await createChat(chatType, participantIds, chatName);
        
        if (chat) {
          // Get avatars for navigation
          const avatars = selectedFriends.map(friend => friend.avatar);
          
          // Navigate to the chat screen
          navigation.navigate('ChatDetail', {
            messageId: chat.id,
            name: chatName,
            avatars,
            isGroupChat,
          });
        } else {
          // Handle error
          Alert.alert('Error', 'Failed to create chat. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSelectedFriend = ({ item }: { item: Friend }) => (
    <View style={styles.selectedFriendChip}>
      <Image source={{ uri: item.avatar }} style={styles.selectedFriendAvatar} />
      <Text style={styles.selectedFriendName}>{item.name.split(' ')[0]}</Text>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => toggleFriendSelection(item)}
      >
        <Ionicons name="close-circle" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderFriend = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.some(f => f.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.friendCard,
          isSelected && styles.selectedFriendCard
        ]} 
        onPress={() => toggleFriendSelection(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <View style={styles.selectedCircle}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          ) : (
            <View style={styles.unselectedCircle} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isTransferMode ? 'Choisir un(e) ami(e)' : 'Nouvelle conversation'}
        </Text>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (selectedFriends.length === 0) && styles.disabledButton
          ]}
          onPress={handleStartChat}
          disabled={selectedFriends.length === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.nextButtonText}>
              {isTransferMode
                ? 'Transférer'
                : (selectedFriends.length === 1 ? 'Discuter' : 'Créer')
              }
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={isTransferMode ? "Rechercher un utilisateur..." : "Rechercher un(e) ami(e)..."}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
          autoFocus
        />
      </View>

      {/* Selected Friends */}
      {selectedFriends.length > 0 && (
        <View style={styles.selectedFriendsContainer}>
          <FlatList
            data={selectedFriends}
            renderItem={renderSelectedFriend}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedFriendsList}
          />
        </View>
      )}
      
      {/* Group Chat Name Input (shown only when more than 1 friend is selected) */}
      {selectedFriends.length > 1 && (
        <View style={styles.groupNameContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Nom du groupe (optionnel)"
            value={groupChatName}
            onChangeText={setGroupChatName}
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Friends List */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriend}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.friendsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  selectedFriendsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedFriendsList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  selectedFriendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  selectedFriendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedFriendName: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 6,
  },
  groupNameContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  groupNameInput: {
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  friendsList: {
    paddingHorizontal: 15,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedFriendCard: {
    backgroundColor: '#F8F8FF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  statusLabel: {
    fontSize: 12,
    color: '#34C759',
    fontStyle: 'italic',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
  },
});

export default NewMessageScreen;