import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  SafeAreaView,
  FlatList,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import BottomTabBar from '../components/BottomTabBar';
import { toast } from 'sonner-native';
import { LinearGradient } from 'expo-linear-gradient';

// Type pour un média de story
interface StoryMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  timestamp: number;
}

// Type pour une story
interface Story {
  id: string;
  media: StoryMedia[];
  timestamp: number;
  viewed: boolean;
}

// Type for un ami
interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  hasStory?: boolean;
  stories?: Story[];
  birthday?: {
    day: number;
    month: number;
    age: number;
  };
}

// Type for une demande d'ami
interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

const FriendsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBirthdayCard, setShowBirthdayCard] = useState(true);

  // Mock data for amis
  const friends: Friend[] = [
    {
      id: '1',
      name: 'Paul Marceau',
      username: 'paulmarceau',
      avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=103',
      hasStory: true,
      stories: [
        {
          id: 's1',
          media: [
            {
              id: 'm1',
              type: 'image',
              url: 'https://api.a0.dev/assets/image?text=lighthouse%20sea%20sunset&aspect=9:16&seed=100',
              timestamp: Date.now() - 3600000 // 1 hour ago
            },
            {
              id: 'm2',
              type: 'image',
              url: 'https://api.a0.dev/assets/image?text=mountains%20lake%20landscape&aspect=9:16&seed=101',
              timestamp: Date.now() - 1800000 // 30 minutes ago
            }
          ],
          timestamp: Date.now() - 3600000,
          viewed: false
        }
      ],
      birthday: {
        day: 5,
        month: 9,
        age: 37
      }
    },
    {
      id: '2',
      name: 'Audriana Toulet',
      username: 'audrianatoulet',
      avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=101',
      hasStory: true,
      stories: [
        {
          id: 's2',
          media: [
            {
              id: 'm3',
              type: 'image',
              url: 'https://api.a0.dev/assets/image?text=city%20street%20evening&aspect=9:16&seed=102',
              timestamp: Date.now() - 7200000 // 2 hours ago
            }
          ],
          timestamp: Date.now() - 7200000,
          viewed: false
        }
      ]
    },
    {
      id: '3',
      name: 'Johanna Toulet',
      username: 'johannatoulet',
      avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=102',
      hasStory: false
    },
    {
      id: '4',
      name: 'Dan Toulet',
      username: 'dantoulet',
      avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=104',
      hasStory: true,
      stories: [
        {
          id: 's3',
          media: [
            {
              id: 'm4',
              type: 'image',
              url: 'https://api.a0.dev/assets/image?text=beach%20summer%20vacation&aspect=9:16&seed=103',
              timestamp: Date.now() - 1200000 // 20 minutes ago
            },
            {
              id: 'm5',
              type: 'image',
              url: 'https://api.a0.dev/assets/image?text=hiking%20mountain%20adventure&aspect=9:16&seed=104',
              timestamp: Date.now() - 600000 // 10 minutes ago
            },
            {
              id: 'm6',
              type: 'image',
              url: 'https://api.a0.dev/assets/image?text=forest%20trail%20nature&aspect=9:16&seed=105',
              timestamp: Date.now() - 300000 // 5 minutes ago
            }
          ],
          timestamp: Date.now() - 1200000,
          viewed: false
        }
      ]
    }
  ];

  // Mock data for demandes d'amis
  const friendRequests: FriendRequest[] = [
    {
      id: '1',
      name: 'Matilda Fritz',
      username: 'matildafritz',
      avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20curly%20hair%20cartoon%20portrait&aspect=1:1&seed=444'
    }
  ];

  const handleAcceptRequest = (requestId: string) => {
    toast.success('Demande d\'ami acceptée');
    // Dans une vraie app, mettre à jour la base de données
  };

  const handleRejectRequest = (requestId: string) => {
    toast.success('Demande d\'ami refusée');
    // Dans une vraie app, mettre à jour la base de données
  };

  const handleAddFriend = () => {
    // Dans une vraie app, naviguer vers l'écran d'ajout d'ami
    console.log('Add friend');
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Dans une vraie app, filtrer les amis
  };

  const handleOpenChat = () => {
    // Dans une vraie app, ouvrir le chat
    navigation.navigate('Messages');
  };
  
  const handleFriendPress = (friend: Friend) => {
    // Dans une vraie app, naviguer vers le profil de l'ami
    console.log('Friend profile:', friend.name);
  };
  
  const handleCloseBirthdayCard = () => {
    setShowBirthdayCard(false);
  };
  
  const handleSendBirthdayMessage = (friendId: string) => {
    // Dans une vraie app, ouvrir la conversation avec cet ami
    navigation.navigate('ChatDetail', {
      messageId: friendId,
      name: friends.find(f => f.id === friendId)?.name || '',
      avatars: [friends.find(f => f.id === friendId)?.avatar || ''],
      isGroupChat: false
    });
  };

  const handleSendMoney = (friend: Friend) => {
    // Naviguer vers l'écran de paiement avec les infos de l'ami
    navigation.navigate('ChooseAmount', {
      user: {
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar
      }
    });
  };

  const handleStoryPress = (friend: Friend) => {
    // Naviguer vers l'écran des stories avec les infos de l'ami
    if (friend.hasStory && friend.stories && friend.stories.length > 0) {
      navigation.navigate('StoryViewer', {
        friendId: friend.id,
        friendName: friend.username,
        friendAvatar: friend.avatar,
        stories: friend.stories
      });
    } else {
      toast.error('Cet ami n\'a pas de stories actives');
    }
  };

  const handleCreateStory = () => {
    // Naviguer vers l'écran de création de story
    navigation.navigate('StoryCamera', {
      returnToScreen: 'Friends'
    });
  };
  
  // Vérifier si une nouvelle story a été publiée (depuis StoryEditor)
  useEffect(() => {
    const checkForNewStory = navigation.addListener('focus', () => {
      // Dans une vraie application, on récupérerait les stories depuis l'API
      // et on mettrait à jour l'état de l'application
      
      // Pour l'instant, on peut simplement utiliser des console.log pour comprendre le flux
      console.log('FriendsScreen focused, checking for new stories');
    });
    
    return checkForNewStory;
  }, [navigation]);

  // Filtered friends based on search query
  const filteredFriends = searchQuery
    ? friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;

  const birthdayFriend = friends.find(friend => friend.birthday);

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => handleFriendPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSendBirthdayMessage(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSendMoney(item)}
        >
          <Ionicons name="cash-outline" size={22} color="#555" />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={22} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );

  // Composant pour afficher le bouton de création de story
  const CreateStoryButton = () => {
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={handleCreateStory}
        activeOpacity={0.7}
      >
        <View style={styles.createStoryCircle}>
          <View style={styles.storyAvatarContainer}>
            <Image
              source={{ uri: 'https://api.a0.dev/assets/image?text=user%20avatar%20cartoon&aspect=1:1&seed=1' }}
              style={styles.storyAvatar}
            />
          </View>
          <View style={styles.createStoryPlusButton}>
            <Ionicons name="add" size={16} color="#FFF" />
          </View>
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          Votre story
        </Text>
      </TouchableOpacity>
    );
  };

  // Composant pour afficher un cercle de story
  const StoryCircle = ({ friend }: { friend: Friend }) => {
    // Déterminer si on affiche un cercle coloré autour de l'avatar (si l'ami a une story non vue)
    const hasUnviewedStory = friend.hasStory && friend.stories?.some(story => !story.viewed);
    
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => friend.hasStory ? handleStoryPress(friend) : handleFriendPress(friend)}
        activeOpacity={0.7}
      >
        {hasUnviewedStory ? (
          // Anneau de gradient pour les stories non vues (style Instagram)
          <LinearGradient
            colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
            start={{ x: 0.0, y: 1.0 }}
            end={{ x: 1.0, y: 1.0 }}
            style={styles.storyGradient}
          >
            <View style={styles.storyAvatarContainer}>
              <Image source={{ uri: friend.avatar }} style={styles.storyAvatar} />
            </View>
          </LinearGradient>
        ) : friend.hasStory ? (
          // Anneau gris pour les stories déjà vues
          <View style={styles.viewedStoryCircle}>
            <View style={styles.storyAvatarContainer}>
              <Image source={{ uri: friend.avatar }} style={styles.storyAvatar} />
            </View>
          </View>
        ) : (
          // Pas d'anneau pour les amis sans story
          <View style={styles.noStoryCircle}>
            <Image source={{ uri: friend.avatar }} style={styles.storyAvatar} />
          </View>
        )}
        <Text style={styles.storyUsername} numberOfLines={1}>
          {friend.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRequestItem = ({ item }: { item: FriendRequest }) => (
    <View key={item.id} style={styles.requestCard}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.username}>
          @{item.username} souhaite devenir votre ami(e)
        </Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={[styles.requestButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.id)}
        >
          <Ionicons name="close" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={24} color="#34C759" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes amis</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleAddFriend}>
            <Ionicons name="person-add" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
            <Ionicons name="chatbubbles-outline" size={24} color="black" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>1</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content with Search and List */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {/* Birthday Notification */}
            {showBirthdayCard && birthdayFriend?.birthday && (
              <TouchableOpacity style={styles.birthdayCard}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseBirthdayCard}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
                <Image
                  source={{ uri: birthdayFriend.avatar }}
                  style={styles.birthdayAvatar}
                />
                <View style={styles.birthdayInfo}>
                  <Text style={styles.birthdayTitle}>C'est son anniversaire !</Text>
                  <Text style={styles.birthdayText}>
                    <Text style={styles.usernameText}>@{birthdayFriend.username}</Text> a {birthdayFriend.birthday?.age} ans aujourd'hui, souhaite-lui !
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => handleSendBirthdayMessage(birthdayFriend.id)}
                >
                  <Ionicons name="chatbubbles-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Stories Section */}
            <View style={styles.storiesSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesContainer}
              >
                {/* Bouton pour créer sa propre story */}
                <CreateStoryButton />
                
                {/* Afficher les stories des amis */}
                {friends.map(friend => (
                  <StoryCircle key={friend.id} friend={friend} />
                ))}
              </ScrollView>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Trouver un(e) ami(e)..."
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor="#999"
              />
            </View>

            {/* Friend Requests Section */}
            {friendRequests.length > 0 && (
              <View style={styles.requestsSection}>
                <Text style={styles.sectionTitle}>Demandes d'amis</Text>
                {friendRequests.map(request => renderRequestItem({ item: request }))}
              </View>
            )}
            
            {/* Friends Section Title */}
            <Text style={styles.sectionTitle}>Amis</Text>
          </>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="friends" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 15,
    padding: 5,
  },
  chatButton: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  birthdayCard: {
    backgroundColor: '#FFF0F5',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
  },
  birthdayAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFCDD2',
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FF3B30',
  },
  birthdayText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  usernameText: {
    color: '#999',
    fontWeight: '500',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  requestsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 15,
    color: '#333',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  requestInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#222',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  requestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FFEEEE',
  },
  acceptButton: {
    backgroundColor: '#EEFFEE',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  friendInfo: {
    flex: 1,
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    padding: 5,
  },
  // Styles pour les stories
  storiesSection: {
    marginVertical: 15,
  },
  storiesContainer: {
    paddingHorizontal: 15,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 75,
  },
  storyGradient: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 2.5,
  },
  storyAvatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
  },
  storyCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 3,
  },
  viewedStoryCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 3,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  noStoryCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#eee',
  },
  createStoryCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    position: 'relative',
  },
  createStoryPlusButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095f6',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  storyUsername: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
});

export default FriendsScreen;