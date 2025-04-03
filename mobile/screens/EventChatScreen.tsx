import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useMessaging } from '../context/MessagingContext';

// Types for the event chat
interface Participant {
  id: string;
  name: string;
  avatar: string;
}

interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  isGeneral: boolean;
  participants?: Participant[];
  icon?: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Photo {
  id: string;
  uri: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  formattedTime: string;
}

interface Video {
  id: string;
  thumbnailUri: string;
  title: string;
  duration: string;
}

type EventChatScreenRouteProp = RouteProp<RootStackParamList, 'EventChat'>;

const EventChatScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<EventChatScreenRouteProp>();
  
  // Get event details from route params
  const { eventId, eventTitle, eventIcon, eventColor } = route.params;
  
  const [activeTab, setActiveTab] = useState<'messages' | 'photos'>('messages');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentPhotoView, setCurrentPhotoView] = useState<Photo | null>(null);

  // State for conversations loaded from API
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { getEventChats } = useMessaging();
  
  // Load event chats from API
  useEffect(() => {
    const fetchEventChats = async () => {
      try {
        const chats = await getEventChats(eventId);
        
        // Convert API data to the format needed by the UI
        if (chats) {
          // Transform API data to match our UI format
          const formattedChats: Conversation[] = chats.map(chat => {
            // Set isGeneral based on if it's the main event chat
            const isMainChat = chat.name?.toLowerCase().includes('general') || false;
            
            return {
              id: chat.id,
              title: chat.name || 'Chat',
              subtitle: isMainChat ? 'Avec tous les invités' : '',
              isGeneral: isMainChat,
              // For non-general chats, we'd need to fetch excluded participants
              // This would require backend support to know who is excluded
              participants: []
            };
          });
          
          setConversations(formattedChats);
        }
      } catch (error) {
        console.error('Error fetching event chats:', error);
        // For now, add at least a general chat if API fails
        setConversations([{
          id: '1',
          title: 'Conversation Générale',
          subtitle: 'Avec tous les invités',
          isGeneral: true,
          icon: eventIcon,
        }]);
      }
    };
    
    fetchEventChats();
  }, [eventId]);

  // Photos would come from a media service API
  // Implemented as a placeholder until the API is available
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // Fetch event photos from API
  useEffect(() => {
    // Simulate loading photos from API
    // In a real implementation, this would fetch from a photo/media service
    const loadEventPhotos = async () => {
      // Placeholder implementation - in production, replace with API call
      setPhotos([
        {
          id: '1',
          uri: 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?q=80&w=500',
          author: {
            name: 'Event Member 1',
            avatar: 'https://api.a0.dev/assets/image?text=Event%20Member&aspect=1:1&seed=101'
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          formattedTime: 'Il y a 2j'
        },
        {
          id: '2',
          uri: 'https://images.unsplash.com/photo-1543499459-d1460b154396?q=80&w=500',
          author: {
            name: 'Event Member 2',
            avatar: 'https://api.a0.dev/assets/image?text=Event%20Member&aspect=1:1&seed=102'
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          formattedTime: 'Il y a 1j'
        }
      ]);
    };
    
    loadEventPhotos();
  }, [eventId]);

  // Videos would also come from a media service API
  // Implemented as a placeholder until the API is available
  const [videos, setVideos] = useState<Video[]>([]);
  
  // Fetch event videos from API
  useEffect(() => {
    // Simulate loading videos from API
    // In a real implementation, this would fetch from a video/media service
    const loadEventVideos = async () => {
      // Placeholder implementation - in production, replace with API call
      setVideos([
        {
          id: '1',
          thumbnailUri: 'https://images.unsplash.com/photo-1479722842840-c0a823bd0cd6?q=80&w=500',
          title: `Highlights: ${eventTitle}`,
          duration: '2:34'
        }
      ]);
    };
    
    loadEventVideos();
  }, [eventId, eventTitle]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleConversationPress = (conversationId: string, title: string) => {
    // Navigate to the specific chat detail
    navigation.navigate('ChatDetail', {
      messageId: conversationId,
      name: title,
      avatars: [],
      isGroupChat: true,
    });
  };

  const handleTabChange = (tab: 'messages' | 'photos') => {
    setActiveTab(tab);
    // Reset selection mode when switching tabs
    if (tab === 'messages' && isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedPhotos([]);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos(selectedPhotos.filter(id => id !== photoId));
    } else {
      setSelectedPhotos([...selectedPhotos, photoId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(photo => photo.id));
    }
  };

  const handleAddPhoto = () => {
    // In a real app, this would open the device's photo picker
    console.log('Add photo');
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedPhotos([]);
  };

  const handleViewPhoto = (photo: Photo) => {
    setCurrentPhotoView(photo);
  };

  const handleClosePhotoView = () => {
    setCurrentPhotoView(null);
  };

  const handleDownloadPhoto = () => {
    // In a real app, this would download the photo
    console.log('Download photo');
  };

  const handleDeleteSelected = () => {
    // In a real app, this would delete the selected photos
    console.log('Delete selected photos', selectedPhotos);
    setSelectedPhotos([]);
    setIsSelectionMode(false);
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item.id, item.title)}
        activeOpacity={0.7}
      >
        {item.isGeneral ? (
          <View style={[styles.eventIconContainer, { backgroundColor: eventColor || '#FFCDD2' }]}>
            <Text style={styles.eventIcon}>{eventIcon || '🎄'}</Text>
          </View>
        ) : (
          <View style={styles.avatarContainer}>
            {item.participants && item.participants.length > 0 && (
              <Image
                source={{ uri: item.participants[0].avatar }}
                style={styles.avatar}
              />
            )}
            <View style={styles.crossIconContainer}>
              <Feather name="x" size={14} color="#000" />
            </View>
          </View>
        )}

        <View style={styles.conversationContent}>
          <Text style={styles.conversationTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.conversationSubtitle}>{item.subtitle}</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </TouchableOpacity>
    );
  };

  const renderPhotoGrid = () => {
    // Calculate number of photos per row (3 for a nice grid)
    const numColumns = 2;
    
    return (
      <View style={styles.photosContainer}>
        <View style={styles.photoAlbumHeader}>
          <Text style={styles.photoAlbumTitle}>Album de Noël 2024</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>voir tout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={photo.id}
              style={[
                styles.photoItem,
                index % numColumns === 0 ? { marginRight: 5 } : { marginLeft: 5 },
              ]}
              onPress={() => isSelectionMode ? togglePhotoSelection(photo.id) : handleViewPhoto(photo)}
            >
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              {isSelectionMode && (
                <View style={[
                  styles.selectionCircle,
                  selectedPhotos.includes(photo.id) && styles.selectionCircleActive
                ]}>
                  {selectedPhotos.includes(photo.id) && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Vidéos Souvenirs</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.videosContainer}
        >
          {videos.map(video => (
            <View key={video.id} style={styles.videoItem}>
              <View style={styles.videoThumbnailContainer}>
                <Image source={{ uri: video.thumbnailUri }} style={styles.videoThumbnail} />
                <View style={styles.playButtonOverlay}>
                  <Ionicons name="play" size={24} color="white" />
                </View>
              </View>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {video.title}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.photoActionsContainer}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity
                style={styles.selectionActionButton}
                onPress={handleSelectAll}
              >
                <View style={[
                  styles.selectionCircleSmall,
                  selectedPhotos.length === photos.length && styles.selectionCircleActive
                ]}>
                  {selectedPhotos.length === photos.length && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <Text style={styles.selectionActionText}>Tout sélectionner</Text>
              </TouchableOpacity>
              
              <View style={styles.selectionCountContainer}>
                <Text style={styles.selectionCountText}>
                  {selectedPhotos.length} {selectedPhotos.length === 1 ? 'Sélectionnée' : 'Sélectionnées'}
                </Text>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.photoActionButton}
                onPress={handleToggleSelectionMode}
              >
                <Text style={styles.photoActionText}>Sélectionner</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.photoActionButton, styles.photoActionButtonFilled]}
                onPress={handleAddPhoto}
              >
                <Ionicons name="images-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.photoActionTextFilled}>Ajouter une photo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderSelectionBottomBar = () => {
    if (!isSelectionMode) return null;
    
    return (
      <View style={styles.selectionBottomBar}>
        <TouchableOpacity style={styles.selectionBottomButton} onPress={() => setIsSelectionMode(false)}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.selectionCountPill}>
          <Text style={styles.selectionCountPillText}>
            {selectedPhotos.length} {selectedPhotos.length === 1 ? 'Sélectionnée' : 'Sélectionnées'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.selectionBottomButton} onPress={handleDownloadPhoto}>
          <Ionicons name="download-outline" size={22} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.selectionBottomButton} onPress={handleDeleteSelected}>
          <Ionicons name="trash-outline" size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPhotoDetailView = () => {
    if (!currentPhotoView) return null;
    
    return (
      <View style={styles.photoDetailContainer}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.photoDetailHeader}>
          <View style={styles.photoAuthorContainer}>
            <Image 
              source={{ uri: currentPhotoView.author.avatar }} 
              style={styles.photoAuthorAvatar} 
            />
            <Text style={styles.photoAuthorText}>
              Photo par {currentPhotoView.author.name} {currentPhotoView.formattedTime}
            </Text>
          </View>
        </View>
        
        <Image 
          source={{ uri: currentPhotoView.uri }} 
          style={styles.photoDetailImage}
          resizeMode="contain"
        />
        
        <View style={styles.photoDetailBottomBar}>
          <TouchableOpacity 
            style={styles.photoDetailButton} 
            onPress={handleClosePhotoView}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.photoDetailButton, styles.photoDetailDownloadButton]} 
            onPress={handleDownloadPhoto}
          >
            <Ionicons name="download-outline" size={22} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.photoDetailButtonText}>Télécharger</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.photoDetailButton} 
            onPress={() => {
              // In a real app, this would delete the photo
              setCurrentPhotoView(null);
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // If we're viewing a photo in detail
  if (currentPhotoView) {
    return renderPhotoDetailView();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.eventInfoContainer}>
          <View style={[styles.eventAvatarContainer, { backgroundColor: eventColor || '#FFCDD2' }]}>
            <Text style={styles.eventAvatarText}>{eventIcon || '🎄'}</Text>
          </View>
          <Text style={styles.eventTitle}>{eventTitle || 'Noël 2024'}</Text>
        </View>
        
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'messages' ? styles.activeTabButton : styles.inactiveTabButton
          ]}
          onPress={() => handleTabChange('messages')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'messages' ? styles.activeTabButtonText : styles.inactiveTabButtonText
          ]}>
            Messages
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'photos' ? styles.activeTabButton : styles.inactiveTabButton
          ]}
          onPress={() => handleTabChange('photos')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'photos' ? styles.activeTabButtonText : styles.inactiveTabButtonText
          ]}>
            Photos
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'messages' ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          style={styles.conversationList}
          contentContainerStyle={styles.conversationContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView 
          style={styles.photosScrollView}
          contentContainerStyle={styles.photosContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderPhotoGrid()}
        </ScrollView>
      )}

      {isSelectionMode && renderSelectionBottomBar()}
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
  },
  backButton: {
    padding: 5,
  },
  eventInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eventAvatarText: {
    fontSize: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 15,
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
  conversationList: {
    flex: 1,
  },
  conversationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    alignItems: 'center',
  },
  eventIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventIcon: {
    fontSize: 30,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  crossIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  conversationSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  photosScrollView: {
    flex: 1,
  },
  photosContentContainer: {
    paddingBottom: 100,
  },
  photosContainer: {
    padding: 20,
  },
  photoAlbumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  photoAlbumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllButton: {
    fontSize: 16,
    color: '#666',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 20,
  },
  photoItem: {
    width: '50%',
    aspectRatio: 1,
    padding: 5,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  selectionCircle: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCircleActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectionCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  videosContainer: {
    marginBottom: 30,
  },
  videoItem: {
    width: 250,
    marginRight: 15,
  },
  videoThumbnailContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  photoActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  photoActionButtonFilled: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    flexDirection: 'row',
  },
  photoActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  photoActionTextFilled: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  selectionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionActionText: {
    fontSize: 16,
    color: '#333',
  },
  selectionCountContainer: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  selectionCountText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  selectionBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
  },
  selectionBottomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  selectionCountPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#111',
  },
  selectionCountPillText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  photoDetailContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoDetailHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 20,
  },
  photoAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoAuthorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  photoAuthorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  photoDetailImage: {
    flex: 1,
    width: '100%',
  },
  photoDetailBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  photoDetailButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailDownloadButton: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 20,
  },
  photoDetailButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EventChatScreen;