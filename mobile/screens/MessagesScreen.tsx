import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import BottomTabBar from '../components/BottomTabBar';
import { useMessaging } from '../context/MessagingContext';

// Types for messages
interface DirectMessage {
  id: string;
  name: string;
  participants: {
    name: string;
    avatar: string;
  }[];
  lastMessage: string;
  timestamp: string;
  formattedTime: string;
  hasUnread: boolean;
  isGroupChat: boolean;
}

interface EventMessage {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBackgroundColor: string;
  timestamp: string;
  formattedTime: string;
  isPast?: boolean;
}

const MessagesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'friends' | 'events'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  // Will be populated from API
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  // Will be populated from API
  const [eventMessages, setEventMessages] = useState<EventMessage[]>([]);

  const { loadChats, chats, connectWebSocket, isWebSocketConnected } = useMessaging();
  
  // Load chats from API and connect to WebSocket on mount
  useEffect(() => {
    const initializeMessaging = async () => {
      console.log('Initializing messaging system...');
      
      // Load chats from API
      await loadChats();
      
      // Connect to WebSocket if not already connected
      if (!isWebSocketConnected()) {
        console.log('Connecting to WebSocket from MessagesScreen');
        const connected = await connectWebSocket();
        console.log('WebSocket connection result:', connected ? 'connected' : 'failed');
      } else {
        console.log('WebSocket already connected');
      }
    };
    
    initializeMessaging();
    
    // Cleanup when component unmounts
    return () => {
      // Don't disconnect WebSocket when leaving the messages screen
      // as it should stay connected in the background
      console.log('MessagesScreen unmounted, WebSocket connection maintained');
    };
  }, []);
  
  // Format chats for display
  useEffect(() => {
    if (chats.length > 0) {
      // Format direct and group chats
      const formattedDirectChats = chats
        .filter(chat => chat.type === 'direct' || chat.type === 'group')
        .map(chat => {
          // Format the chat for display
          const isGroup = chat.type === 'group';
          const chatName = chat.name || 'Chat';
          
          // Extract participants' avatars
          const participantAvatars = chat.participants.map(p => {
            // This should be enhanced with a user service to get actual avatars
            return `https://api.a0.dev/assets/image?text=user%20avatar&aspect=1:1&seed=${p}`;
          });
          
          return {
            id: chat.id,
            name: chatName,
            participants: participantAvatars.map((avatar, index) => ({
              name: `Participant ${index + 1}`,
              avatar
            })),
            lastMessage: chat.lastMessage?.content || 'No messages yet',
            timestamp: chat.lastMessage?.createdAt || chat.createdAt,
            formattedTime: formatTimestamp(chat.lastMessage?.createdAt || chat.createdAt),
            hasUnread: false, // This should be calculated based on read status
            isGroupChat: isGroup
          };
        });
      
      setDirectMessages(formattedDirectChats);
      
      // Format event chats
      const formattedEventChats = chats
        .filter(chat => chat.type === 'event')
        .map(chat => {
          return {
            id: chat.id,
            title: chat.name || 'Event',
            subtitle: `Event ID: ${chat.eventId}`,
            icon: '🎉', // This should come from event data
            iconBackgroundColor: getRandomColor(),
            timestamp: chat.lastMessage?.createdAt || chat.createdAt,
            formattedTime: formatTimestamp(chat.lastMessage?.createdAt || chat.createdAt)
          };
        });
      
      setEventMessages(formattedEventChats);
    }
  }, [chats]);
  
  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return 'à l\'instant';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 30) return `${diffDay}j`;
    if (diffDay < 365) return `${Math.round(diffDay/30)}mo`;
    return `${Math.round(diffDay/365)}an`;
  };
  
  // Helper function to generate a random color
  const getRandomColor = () => {
    const colors = ['#FFCDD2', '#E1BEE7', '#B3E5FC', '#E6EE9C', '#C8E6C9', '#FFE0B2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const navigateToChat = (messageId: string, name: string, avatars: string[], isGroupChat: boolean) => {
    navigation.navigate('ChatDetail', {
      messageId,
      name,
      avatars,
      isGroupChat
    });
  };
  
  const navigateToEventChat = (event: EventMessage) => {
    navigation.navigate('EventChat', {
      eventId: event.id,
      eventTitle: event.title,
      eventIcon: event.icon,
      eventColor: event.iconBackgroundColor
    });
  };

  const navigateToNewMessage = () => {
    navigation.navigate('NewMessage', {});
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Filter messages based on search query
  const filteredDirectMessages = searchQuery
    ? directMessages.filter(message =>
        message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : directMessages;

  const filteredEventMessages = searchQuery
    ? eventMessages.filter(message =>
        message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : eventMessages;

  // Split event messages into current and past
  const currentEventMessages = filteredEventMessages.filter(message => !message.isPast);
  const pastEventMessages = filteredEventMessages.filter(message => message.isPast);

  const renderDirectMessageItem = ({ item }: { item: DirectMessage }) => {
    const avatars = item.participants.map(participant => participant.avatar);
    
    return (
      <TouchableOpacity 
        style={styles.messageItem}
        onPress={() => navigateToChat(item.id, item.name, avatars, item.isGroupChat)}
        activeOpacity={0.6}
      >
        {item.isGroupChat ? (
          <View style={styles.groupAvatarContainer}>
            {item.participants.slice(0, 2).map((participant, index) => (
              <Image 
                key={index}
                source={{ uri: participant.avatar }} 
                style={[
                  styles.groupAvatar,
                  { 
                    left: index === 0 ? 0 : 15, 
                    top: index === 0 ? 0 : 15,
                    zIndex: 2 - index,
                  }
                ]} 
              />
            ))}
          </View>
        ) : (
          <Image 
            source={{ uri: item.participants[0].avatar }} 
            style={styles.avatar} 
          />
        )}
        
        <View style={styles.messageContent}>
          <Text style={styles.messageName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        
        <View style={styles.messageTimeContainer}>
          {item.hasUnread && (
            <View style={styles.unreadIndicator} />
          )}
          <Text style={styles.messageTime}>{item.formattedTime}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventMessageItem = ({ item }: { item: EventMessage }) => {
    return (
      <TouchableOpacity
        style={styles.eventItem}
        onPress={() => navigateToEventChat(item)}
        activeOpacity={0.6}
      >
        <View style={[styles.eventIconContainer, { backgroundColor: item.iconBackgroundColor }]}>
          <Text style={styles.eventIcon}>{item.icon}</Text>
        </View>
        
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventSubtitle}>{item.subtitle}</Text>
        </View>
        
        <View style={styles.eventTimeContainer}>
          <Text style={styles.eventTime}>{item.formattedTime}</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton} onPress={navigateToNewMessage}>
          <Ionicons name="create-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un message..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'friends' ? styles.activeTabButton : styles.inactiveTabButton
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'friends' ? styles.activeTabButtonText : styles.inactiveTabButtonText
          ]}>
            Mes amis
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'events' ? styles.activeTabButton : styles.inactiveTabButton
          ]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'events' ? styles.activeTabButtonText : styles.inactiveTabButtonText
          ]}>
            Événements
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? (
        <FlatList
          data={filteredDirectMessages}
          renderItem={renderDirectMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#DEDEDE" />
              <Text style={styles.emptyText}>Aucun message</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={currentEventMessages}
          renderItem={renderEventMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => (
            <>
              {pastEventMessages.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Mes événements passés :</Text>
                  {pastEventMessages.map(event => (
                    <TouchableOpacity 
                      key={event.id}
                      style={styles.eventItem}
                      onPress={() => navigateToEventChat(event)}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.eventIconContainer, { backgroundColor: event.iconBackgroundColor }]}>
                        <Text style={styles.eventIcon}>{event.icon}</Text>
                      </View>
                      
                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                      </View>
                      
                      <View style={styles.eventTimeContainer}>
                        <Text style={styles.eventTime}>{event.formattedTime}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <FontAwesome name="birthday-cake" size={60} color="#DEDEDE" />
              <Text style={styles.emptyText}>Aucun événement</Text>
            </View>
          )}
        />
      )}

      <BottomTabBar activeTab="messages" />
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  newMessageButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#444',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 15,
  },
  activeTabButton: {
    backgroundColor: '#111111',
  },
  inactiveTabButton: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: 'white',
  },
  inactiveTabButtonText: {
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  messageItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  groupAvatarContainer: {
    width: 75,
    height: 75,
    position: 'relative',
    marginRight: 15,
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
  },
  messageContent: {
    flex: 1,
    marginRight: 10,
  },
  messageName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#222',
  },
  messageText: {
    fontSize: 16,
    color: '#888',
  },
  messageTimeContainer: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  unreadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6F00',
    marginBottom: 5,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
  },
  eventIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  eventIcon: {
    fontSize: 32,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#222',
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    color: '#999',
    marginRight: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 15,
    color: '#666',
  },
});

export default MessagesScreen;