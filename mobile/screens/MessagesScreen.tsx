import React, { useState } from 'react';
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

  // Mock data for direct messages
  const directMessages: DirectMessage[] = [
    {
      id: '1',
      name: 'Audriana Toulet, Paul Ma...',
      participants: [
        {
          name: 'Audriana Toulet',
          avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=101'
        },
        {
          name: 'Paul Marceau',
          avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=103'
        }
      ],
      lastMessage: "D'accord ! Attends !",
      timestamp: '2025-03-23T10:00:00',
      formattedTime: '1h',
      hasUnread: true,
      isGroupChat: true
    },
    {
      id: '2',
      name: 'Audriana Toulet',
      participants: [
        {
          name: 'Audriana Toulet',
          avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=101'
        }
      ],
      lastMessage: "D'accord ! Attends !",
      timestamp: '2025-03-23T10:30:00',
      formattedTime: '1h',
      hasUnread: true,
      isGroupChat: false
    },
    {
      id: '3',
      name: 'Paul Marceau',
      participants: [
        {
          name: 'Paul Marceau',
          avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=103'
        }
      ],
      lastMessage: "Are you sure she is gonna like that gift ??",
      timestamp: '2025-03-21T14:00:00',
      formattedTime: '3j',
      hasUnread: false,
      isGroupChat: false
    },
    {
      id: '4',
      name: 'Johanna Toulet',
      participants: [
        {
          name: 'Johanna Toulet',
          avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=102'
        }
      ],
      lastMessage: "Tu me diras :)",
      timestamp: '2025-02-23T10:00:00',
      formattedTime: '1mo',
      hasUnread: false,
      isGroupChat: false
    }
  ];

  // Mock data for event messages
  const eventMessages: EventMessage[] = [
    {
      id: '1',
      title: 'Noël',
      subtitle: 'Noël 2024',
      icon: '🎄',
      iconBackgroundColor: '#FFCDD2',
      timestamp: '2025-03-23T09:00:00',
      formattedTime: '15h'
    },
    {
      id: '2',
      title: 'Anniversaire',
      subtitle: 'Paul Marceau',
      icon: '🎂',
      iconBackgroundColor: '#E1BEE7',
      timestamp: '2025-03-22T14:00:00',
      formattedTime: '2j'
    },
    {
      id: '3',
      title: 'Mariage',
      subtitle: 'Dan & Audriana',
      icon: '💍',
      iconBackgroundColor: '#B3E5FC',
      timestamp: '2025-03-19T10:00:00',
      formattedTime: '5m'
    },
    {
      id: '4',
      title: 'Anniversaire',
      subtitle: 'Dan Toulet',
      icon: '🎂',
      iconBackgroundColor: '#E6EE9C',
      timestamp: '2025-02-08T14:00:00',
      formattedTime: '44j',
      isPast: true
    },
    {
      id: '5',
      title: 'Noël',
      subtitle: 'Noël 2023',
      icon: '🎅',
      iconBackgroundColor: '#C8E6C9',
      timestamp: '2024-03-24T14:00:00',
      formattedTime: '+1an',
      isPast: true
    }
  ];

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
      eventTitle: event.title === 'Noël' ? `${event.title} ${event.subtitle.split(' ')[1]}` : event.title,
      eventIcon: event.icon,
      eventColor: event.iconBackgroundColor
    });
  };

  const navigateToNewMessage = () => {
    navigation.navigate('NewMessage');
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