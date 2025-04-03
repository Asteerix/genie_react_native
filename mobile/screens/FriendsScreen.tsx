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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import BottomTabBar from '../components/BottomTabBar';
import { toast } from 'sonner-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getUserFriends,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  searchUsers,
  Friend,
  FriendRequest,
  Story
} from '../api/contacts';
import { getFriendStories, markStoryAsViewed, getMyStories } from '../api/stories';
import { useAuth } from '../auth/context/AuthContext';
import { API_BASE_URL } from '../config';

const FriendsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBirthdayCard, setShowBirthdayCard] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);

  // Charger les amis et les demandes d'amis
  useEffect(() => {
    // Ne charger que si l'écran est actif
    if (!isFocused) return;

    const loadFriendsData = async () => {
      setLoading(true);
      try {
        // Pour déboguer, on affiche les URLs d'API où on va chercher les données
        console.log('API_BASE_URL:', API_BASE_URL);

        // Charger les amis et leurs stories en parallèle
        console.log('Chargement des amis et des stories...');

        // On utilisera Promise.allSettled pour exécuter toutes les requêtes en parallèle
        // même si certaines échouent
        const [friendsResult, requestsResult, storiesResult, myStoriesResult] = await Promise.allSettled([
          getUserFriends(),
          getFriendRequests(),
          getFriendStories(),
          getMyStories()
        ]);

        console.log('Status des requêtes:', {
          friends: friendsResult.status,
          requests: requestsResult.status,
          stories: storiesResult.status,
          myStories: myStoriesResult.status
        });

        // Traitement des résultats des amis
        let friendsList: Friend[] = [];
        if (friendsResult.status === 'fulfilled' && friendsResult.value.data) {
          // Récupération des amis réussie
          friendsList = friendsResult.value.data;
        } else {
          // Gestion silencieuse de l'erreur de chargement des amis
          toast.error('Impossible de charger vos amis');
          // En cas d'erreur, utiliser des données de substitution pour la démo
          friendsList = [
            {
              id: '1',
              name: 'Paul Marceau',
              username: 'paulmarceau',
              avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=103',
              hasStory: true,
              isInApp: true,
              birthday: {
                day: new Date().getDate(), // Mettre la date du jour pour tester
                month: new Date().getMonth() + 1, // Mettre le mois actuel pour tester
                age: 37
              }
            },
            {
              id: '2',
              name: 'Audriana Toulet',
              username: 'audrianatoulet',
              avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=101',
              hasStory: true,
              isInApp: true
            },
            {
              id: '3',
              name: 'Johanna Toulet',
              username: 'johannatoulet',
              avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20blonde%20cartoon%20portrait&aspect=1:1&seed=102',
              hasStory: false,
              isInApp: true
            }
          ];
        }

        // Traitement des résultats des stories
        if (storiesResult.status === 'fulfilled' && storiesResult.value.data) {
          // Récupération des stories réussie
          const friendsWithStories = storiesResult.value.data.reduce((acc, friend) => {
            acc[friend.id] = friend;
            return acc;
          }, {} as Record<string, Friend>);

          // Fusionner avec la liste des amis
          friendsList = friendsList.map(friend => {
            if (friendsWithStories[friend.id]) {
              return {
                ...friend,
                hasStory: true,
                stories: friendsWithStories[friend.id].stories
              };
            }
            return friend;
          });
        } else if (storiesResult.status === 'rejected') {
          // Gestion silencieuse de l'erreur de chargement des stories
        }

        // Ajouter mes propres stories à mon profil dans la liste d'amis
        if (myStoriesResult.status === 'fulfilled' && myStoriesResult.value.data && myStoriesResult.value.data.length > 0) {
          console.log('Mes stories récupérées avec succès:', myStoriesResult.value.data.length);
          if (user && user.id) {
            const myStoriesFormatted = myStoriesResult.value.data.map(story => ({
              id: story.id,
              media: story.media,
              timestamp: story.timestamp, // Correction: utiliser timestamp
              viewed: false
            }));

            const myProfileIndex = friendsList.findIndex(f => f.id === user.id);

            if (myProfileIndex >= 0) {
              friendsList[myProfileIndex] = {
                ...friendsList[myProfileIndex],
                hasStory: true,
                stories: myStoriesFormatted
              };
            } else {
              // Mon profil n'existe pas, l'ajouter à la liste
              const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || "Moi";
              const fallbackUsername = user.email || user.phone || "moi"; // Utiliser email ou phone comme username
              friendsList.unshift({
                id: user.id,
                name: fullName, // Correction: utiliser firstName et lastName
                username: fallbackUsername, // Correction: utiliser email/phone comme fallback
                avatar: user.avatarUrl || "https://api.a0.dev/assets/image?text=avatar%20profile&aspect=1:1&seed=1", // Correction: utiliser avatarUrl
                isInApp: true,
                hasStory: true,
                stories: myStoriesFormatted
              });
            }
          }
        }

        // Mettre à jour l'état des amis avec ou sans stories
        setFriends(friendsList);

        // Traitement des résultats des demandes d'amis
        if (requestsResult.status === 'fulfilled' && requestsResult.value.data) {
          // Récupération des demandes réussie
          setFriendRequests(requestsResult.value.data);
        } else {
          // Gestion silencieuse de l'erreur de chargement des demandes
          // En cas d'erreur, utiliser des données de substitution pour la démo
          setFriendRequests([
            {
              id: 'req1', // Utiliser un ID différent pour éviter les conflits
              name: 'Matilda Fritz',
              username: 'matildafritz',
              avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20curly%20hair%20cartoon%20portrait&aspect=1:1&seed=444',
              requestDate: new Date().toISOString()
            }
          ]);
        }
      } catch (error) {
        // Gestion silencieuse de l'erreur générale
        toast.error('Une erreur est survenue');
        // En cas d'erreur générale, utiliser des données de substitution pour la démo
        setFriends([
          {
            id: '1',
            name: 'Paul Marceau',
            username: 'paulmarceau',
            avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=103',
            hasStory: true,
            isInApp: true,
            birthday: {
              day: new Date().getDate(),
              month: new Date().getMonth() + 1,
              age: 37
            }
          }
        ]);
        setFriendRequests([
          {
            id: 'req1',
            name: 'Matilda Fritz',
            username: 'matildafritz',
            avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20curly%20hair%20cartoon%20portrait&aspect=1:1&seed=444',
            requestDate: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadFriendsData();
  }, [isFocused, user]); // Rechargement quand l'écran devient actif ou user change

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await acceptFriendRequest(requestId);
      if (response.error) {
        console.error('Erreur API lors de l\'acceptation de la demande d\'ami:', response.error);
        toast.error(response.error);
        simulateAcceptFriendRequest(requestId);
      } else {
        setFriendRequests(prevRequests =>
          prevRequests.filter(request => request.id !== requestId)
        );
        try {
          const friendsResponse = await getUserFriends();
          if (friendsResponse.data) {
            setFriends(friendsResponse.data);
          } else {
            addAcceptedFriendToList(requestId);
          }
        } catch (error) {
          console.error('Erreur lors du rechargement des amis:', error);
          addAcceptedFriendToList(requestId);
        }
        toast.success('Demande d\'ami acceptée');
      }
    } catch (error) {
      console.error('Exception lors de l\'acceptation de la demande d\'ami:', error);
      toast.error('Une erreur est survenue');
      simulateAcceptFriendRequest(requestId);
    }
  };

  const simulateAcceptFriendRequest = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;
    setFriendRequests(prevRequests =>
      prevRequests.filter(r => r.id !== requestId)
    );
    const newFriend: Friend = {
      id: request.id,
      name: request.name,
      username: request.username,
      avatar: request.avatar,
      isInApp: true,
      hasStory: Math.random() > 0.5
    };
    setFriends(prevFriends => [...prevFriends, newFriend]);
    setTimeout(() => {
      toast.success('Demande d\'ami acceptée (simulée)');
    }, 500);
  };

  const addAcceptedFriendToList = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;
    const newFriend: Friend = {
      id: request.id,
      name: request.name,
      username: request.username,
      avatar: request.avatar,
      isInApp: true,
      hasStory: false
    };
    setFriends(prevFriends => [...prevFriends, newFriend]);
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await rejectFriendRequest(requestId);
      if (response.error) {
        console.error('Erreur API lors du refus de la demande d\'ami:', response.error);
        toast.error(response.error);
        simulateRejectFriendRequest(requestId);
      } else {
        setFriendRequests(prevRequests =>
          prevRequests.filter(request => request.id !== requestId)
        );
        toast.success('Demande d\'ami refusée');
      }
    } catch (error) {
      console.error('Exception lors du refus de la demande d\'ami:', error);
      toast.error('Une erreur est survenue');
      simulateRejectFriendRequest(requestId);
    }
  };

  const simulateRejectFriendRequest = (requestId: string) => {
    setFriendRequests(prevRequests =>
      prevRequests.filter(request => request.id !== requestId)
    );
    setTimeout(() => {
      toast.success('Demande d\'ami refusée (simulée)');
    }, 500);
  };

  const handleAddFriend = () => {
    navigation.navigate('Search');
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      setSearching(true);
      try {
        const response = await searchUsers(text);
        if (response.data) {
          const existingFriendIds = new Set(friends.map(f => f.id));
          const filteredResults = response.data.filter(user => !existingFriendIds.has(user.id));
          setSearchResults(filteredResults as Friend[]);
        }
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleOpenChat = () => {
    navigation.navigate('Messages');
  };

  const handleFriendPress = (friend: Friend) => {
    // Correction: Utiliser 'Profile' et passer userId
    navigation.navigate('Profile', { userId: friend.id });
  };

  const handleCloseBirthdayCard = () => {
    setShowBirthdayCard(false);
  };

  const handleSendBirthdayMessage = (friendId: string) => {
    const selectedFriend = friends.find(f => f.id === friendId);
    if (selectedFriend) {
      // Correction: Remplacer chatId par messageId
      navigation.navigate('ChatDetail', {
        messageId: friendId, // Correction: Utiliser messageId
        name: selectedFriend.name,
        avatars: [selectedFriend.avatar],
        isGroupChat: false
      });
    }
  };

  const handleSendMoney = (friend: Friend) => {
    navigation.navigate('ChooseAmount', {
      recipientId: friend.id,
      user: {
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar
      }
    });
  };

  const handleStoryPress = (friend: Friend) => {
    if (friend.hasStory && friend.stories && friend.stories.length > 0) {
      try {
        navigation.navigate('StoryViewer', {
          storyId: friend.stories[0].id,
          friendId: friend.id,
          friendName: friend.username,
          friendAvatar: friend.avatar,
          stories: friend.stories
        });
      } catch (error) {
        console.error('Erreur lors de la navigation vers StoryViewer:', error);
        toast.error('Erreur lors de l\'affichage de la story');
        const mockStory = {
          id: 'mock-story-1',
          media: [
            {
              id: 'mock-media-1',
              type: 'image' as const,
              url: 'https://api.a0.dev/assets/image?text=city%20sunset%20view&aspect=9:16&seed=102',
              timestamp: Date.now()
            }
          ],
          timestamp: Date.now(),
          viewed: false
        };
        navigation.navigate('StoryViewer', {
          storyId: mockStory.id,
          friendId: friend.id,
          friendName: friend.username,
          friendAvatar: friend.avatar,
          stories: [mockStory]
        });
      }
    } else {
      toast.error('Cet ami n\'a pas de stories actives');
    }
  };

  const handleCreateStory = () => {
    navigation.navigate('StoryCamera', {
      returnToScreen: 'Friends'
    });
  };

  const filteredFriends = searchQuery.length > 0
    ? friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;

  const birthdayFriend = friends.find(friend => friend.birthday &&
    new Date().getDate() === friend.birthday.day &&
    new Date().getMonth() === friend.birthday.month - 1);

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
      {/* Remplacer les boutons par un chevron */}
      <Ionicons name="chevron-forward" size={22} color="#CCCCCC" />
    </TouchableOpacity>
  );

  const CreateStoryButton = () => {
    const avatarUrl = user?.avatarUrl || 'https://api.a0.dev/assets/image?text=user%20avatar%20cartoon&aspect=1:1&seed=1';
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={handleCreateStory}
        activeOpacity={0.7}
      >
        <View style={styles.createStoryCircle}>
          <View style={styles.storyAvatarContainer}>
            <Image
              source={{ uri: avatarUrl }}
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

  const StoryCircle = ({ friend }: { friend: Friend }) => {
    const hasUnviewedStory = friend.hasStory && friend.stories?.some(story => !story.viewed);
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => friend.hasStory ? handleStoryPress(friend) : handleFriendPress(friend)}
        activeOpacity={0.7}
      >
        {hasUnviewedStory ? (
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
          <View style={styles.viewedStoryCircle}>
            <View style={styles.storyAvatarContainer}>
              <Image source={{ uri: friend.avatar }} style={styles.storyAvatar} />
            </View>
          </View>
        ) : (
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
        {/* Bouton Refuser (X) */}
        <TouchableOpacity
          style={[styles.requestButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.id)}
        >
          <Ionicons name="close" size={24} color="#FF3B30" />
        </TouchableOpacity>
        {/* Bouton Accepter (✓) */}
        <TouchableOpacity
          style={[styles.requestButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Ionicons name="checkmark" size={24} color="#34C759" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Supprimer le return précoce pour l'état de chargement
  // La logique de chargement sera gérée dans le JSX principal

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes amis</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleAddFriend}>
            <Ionicons name="person-add-outline" size={26} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
            <Ionicons name="chatbubble-outline" size={26} color="black" />
            {friendRequests.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{friendRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content - Afficher le loader ou la liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement de vos amis...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <>
              {/* Birthday Notification - Style mis à jour */}
              {showBirthdayCard && birthdayFriend?.birthday && (
                <View style={styles.birthdayCard}>
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
                  {/* Bouton Chat mis à jour */}
                  <TouchableOpacity
                    style={styles.birthdayMessageButton}
                    onPress={() => handleSendBirthdayMessage(birthdayFriend.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Stories Section (conservée) */}
              <View style={styles.storiesSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storiesContainer}
                >
                  <CreateStoryButton />
                  {friends.map(friend => (
                    <StoryCircle key={friend.id} friend={friend} />
                  ))}
                </ScrollView>
              </View>

              {/* Search Bar - Style mis à jour */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Trouver un(e) ami(e)..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholderTextColor="#8E8E93"
                />
                {searching && <ActivityIndicator size="small" color="#007AFF" />}
              </View>

              {/* Friend Requests Section - Style mis à jour */}
              {friendRequests.length > 0 && (
                <View style={styles.requestsSection}>
                  {/* Pas de titre explicite dans l'image, mais on garde la section */}
                  {friendRequests.map(request => renderRequestItem({ item: request }))}
                </View>
              )}

              {/* Friends Section Title (optionnel, pas dans l'image) */}
              {/* <Text style={styles.sectionTitle}>
                {friends.length > 0
                  ? `Amis (${friends.length})`
                  : 'Vous n\'avez pas encore d\'amis'}
              </Text> */}
            </>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            // Ne pas afficher le message vide pendant le chargement initial
            !loading && searchQuery.length === 0 && friendRequests.length === 0 && friends.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#CCCCCC" />
                <Text style={styles.emptyText}>Vous n'avez pas encore d'amis</Text>
                <TouchableOpacity
                  style={styles.addFriendsButton}
                  onPress={handleAddFriend}
                >
                  <Text style={styles.addFriendsButtonText}>Ajouter des amis</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        />
      )}

      {/* Bottom Tab Bar (conservée) */}
      <BottomTabBar activeTab="friends" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fond blanc comme dans l'image
  },
  loadingContainer: { // Style pour le conteneur du loader (maintenant dans le flux principal)
    flex: 1, // Pour prendre l'espace disponible
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60, // Pour ne pas être caché par la TabBar
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15, // Moins de padding en haut
    paddingBottom: 10, // Moins de padding en bas
  },
  headerTitle: {
    fontSize: 34, // Plus grand
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 10, // Moins d'espace
    padding: 8, // Padding pour zone cliquable
  },
  chatButton: {
    position: 'relative',
    padding: 8, // Padding pour zone cliquable
  },
  notificationBadge: {
    position: 'absolute',
    top: 5, // Ajusté pour l'icône plus grande
    right: 5, // Ajusté pour l'icône plus grande
    backgroundColor: '#FF3B30', // Rouge vif
    borderRadius: 9, // Plus rond
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5, // Petite bordure blanche
    borderColor: '#FFFFFF',
  },
  notificationText: {
    color: 'white',
    fontSize: 11, // Plus petit
    fontWeight: 'bold',
  },
  // Birthday Card - Styles mis à jour
  birthdayCard: {
    backgroundColor: '#F0F8FF', // Bleu très clair (ou gradient si possible)
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 16, // Arrondi comme l'image
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, // Ombre très légère
    shadowRadius: 5,
    elevation: 2,
    position: 'relative', // Pour le bouton close
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    left: 8, // Bouton close à gauche dans l'image
    zIndex: 1,
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.05)', // Léger fond pour visibilité
    borderRadius: 15,
  },
  birthdayAvatar: {
    width: 50, // Légèrement plus petit
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    // Pas de bordure spécifique dans l'image
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayTitle: {
    fontSize: 16, // Légèrement plus petit
    fontWeight: 'bold',
    marginBottom: 2, // Moins d'espace
    color: '#000', // Noir
  },
  birthdayText: {
    fontSize: 14,
    color: '#666', // Gris
    lineHeight: 18,
  },
  usernameText: {
    color: '#666', // Gris
    fontWeight: 'normal', // Pas en gras
  },
  // Bouton chat rond comme dans l'image
  birthdayMessageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF', // Fond blanc
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10, // Espace par rapport au texte
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // Search Bar - Styles mis à jour
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // Gris plus clair
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10, // Moins arrondi
    paddingHorizontal: 12,
    height: 40, // Moins haut
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000', // Texte noir
  },
  listContainer: {
    paddingBottom: 20,
  },
  // Requests Section - Styles mis à jour
  requestsSection: {
    // marginHorizontal: 15, // Cohérent avec le reste -> Retiré car requestCard a déjà la marge
    marginBottom: 10, // Moins d'espace avant les amis
  },
  sectionTitle: { // Optionnel, si on veut un titre
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 15,
    marginBottom: 10,
    color: '#333',
  },
  // Request Card - Styles mis à jour
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fond blanc
    borderRadius: 16, // Arrondi comme l'image
    padding: 12,
    marginBottom: 10, // Espace entre les demandes
    marginHorizontal: 15, // Marge latérale
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold', // Nom en gras
    marginBottom: 2,
    color: '#000', // Noir
  },
  username: {
    fontSize: 14,
    color: '#666', // Gris
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 10, // Espace entre les boutons
  },
  // Request Buttons - Styles mis à jour
  requestButton: {
    width: 44, // Plus grand
    height: 44,
    borderRadius: 22, // Rond
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FFE5E5', // Fond rouge très clair
  },
  acceptButton: {
    backgroundColor: '#E5F9E7', // Fond vert très clair
  },
  // Friend Card - Styles mis à jour
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Moins de padding vertical
    paddingHorizontal: 15, // Marge latérale
    // Pas de bordure inférieure dans l'image, on la retire
    // borderBottomWidth: 1,
    // borderBottomColor: '#F0F0F0',
    marginBottom: 5, // Petit espace entre les amis
  },
  friendInfo: {
    flex: 1,
  },
  // Styles pour les stories (conservés)
  storiesSection: {
    marginVertical: 15,
    paddingLeft: 15, // Pour aligner avec le reste
  },
  storiesContainer: {
    gap: 12,
    paddingRight: 15, // Espace à droite
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50, // Pour centrer un peu plus
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  addFriendsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFriendsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FriendsScreen;