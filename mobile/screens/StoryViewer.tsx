import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  TextInput,
  Platform,
  PanResponder,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';

type StoryViewerRouteProps = RouteProp<RootStackParamList, 'StoryViewer'>;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 secondes par story
const QUICK_REACTIONS = ['❤️', '👏', '🔥', '😮', '😢', '😂'];

const StoryViewer = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<StoryViewerRouteProps>();
  const { friendId, friendName, friendAvatar, stories } = route.params;
  
  // État principal
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReplyInputActive, setIsReplyInputActive] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  
  // Références
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef<Animated.CompositeAnimation | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const mediaRef = useRef<Video>(null);
  const replyInputRef = useRef<TextInput>(null);
  
  // Obtenir la story actuelle et le média actuel
  const currentStory = stories[currentStoryIndex];
  const currentMedia = currentStory?.media[currentMediaIndex];
  
  // Configuration du PanResponder pour les gestes
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
      },
      onPanResponderGrant: () => {
        pauseStory();
      },
      onPanResponderMove: (_, gestureState) => {
        // Swipe vertical vers le haut -> afficher les réactions
        if (gestureState.dy < -50) {
          setShowReactions(true);
        } 
        // Swipe vertical vers le bas -> fermer
        else if (gestureState.dy > 100) {
          navigation.goBack();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Swipe horizontal vers la droite (précédent)
        if (gestureState.dx > 50) {
          goToPrevMedia();
        } 
        // Swipe horizontal vers la gauche (suivant)
        else if (gestureState.dx < -50) {
          goToNextMedia();
        } 
        
        if (!isReplyInputActive) {
          resumeStory();
        }
        
        if (showReactions) {
          setTimeout(() => setShowReactions(false), 300);
        }
      },
    })
  ).current;
  
  // Marquer la story comme vue et démarrer l'animation
  useEffect(() => {
    if (currentStory && !currentStory.viewed) {
      currentStory.viewed = true;
    }
    
    startProgress();
    
    return () => {
      if (progressAnim.current) {
        progressAnim.current.stop();
      }
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
    };
  }, [currentStoryIndex, currentMediaIndex, isPaused]);
  
  // Démarrer l'animation de progression
  const startProgress = () => {
    progressAnimation.setValue(0);
    
    if (progressAnim.current) {
      progressAnim.current.stop();
    }
    
    if (!isPaused) {
      progressAnim.current = Animated.timing(progressAnimation, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false
      });
      
      progressAnim.current.start(({ finished }) => {
        if (finished) {
          goToNextMedia();
        }
      });
    }
  };
  
  // Mettre en pause la story
  const pauseStory = () => {
    if (!isPaused) {
      setIsPaused(true);
      if (progressAnim.current) {
        progressAnim.current.stop();
      }
      if (mediaRef.current && currentMedia?.type === 'video') {
        mediaRef.current.pauseAsync();
      }
    }
  };
  
  // Reprendre la story
  const resumeStory = () => {
    if (isPaused && !isReplyInputActive) {
      setIsPaused(false);
      startProgress();
      if (mediaRef.current && currentMedia?.type === 'video') {
        mediaRef.current.playAsync();
      }
    }
  };
  
  // Aller au média suivant
  const goToNextMedia = () => {
    if (currentMediaIndex < currentStory.media.length - 1) {
      // Prochain média dans la story actuelle
      setCurrentMediaIndex(currentMediaIndex + 1);
    } else if (currentStoryIndex < stories.length - 1) {
      // Story suivante
      setCurrentStoryIndex(currentStoryIndex + 1);
      setCurrentMediaIndex(0);
    } else {
      // Fin des stories
      navigation.goBack();
    }
  };
  
  // Aller au média précédent
  const goToPrevMedia = () => {
    if (currentMediaIndex > 0) {
      // Média précédent dans la story actuelle
      setCurrentMediaIndex(currentMediaIndex - 1);
    } else if (currentStoryIndex > 0) {
      // Story précédente
      setCurrentStoryIndex(currentStoryIndex - 1);
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentMediaIndex(prevStory.media.length - 1);
    }
  };
  
  // Gérer les taps sur l'écran
  const handleTap = (event: any) => {
    const x = event.nativeEvent.locationX;
    
    // Tap sur le tiers gauche de l'écran (précédent)
    if (x < SCREEN_WIDTH / 3) {
      goToPrevMedia();
    } 
    // Tap sur les deux tiers droite de l'écran (suivant)
    else if (x > SCREEN_WIDTH / 3) {
      goToNextMedia();
    }
  };
  
  // Gérer l'appui long
  const handleLongPressIn = () => {
    longPressTimeout.current = setTimeout(() => {
      pauseStory();
    }, 200);
  };
  
  const handleLongPressOut = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    
    if (isPaused && !isReplyInputActive) {
      resumeStory();
    }
  };
  
  // Gérer les réponses
  const handleReplyInputFocus = () => {
    setIsReplyInputActive(true);
    pauseStory();
  };
  
  const handleReplyInputBlur = () => {
    setIsReplyInputActive(false);
    if (!isPaused) {
      resumeStory();
    }
  };
  
  const sendReply = () => {
    if (replyText.trim().length > 0) {
      // Simuler l'envoi d'une réponse
      Alert.alert('Reply Sent', `Your reply "${replyText}" was sent to ${friendName}`);
      setReplyText('');
      setIsReplyInputActive(false);
      resumeStory();
    }
  };
  
  // Envoyer une réaction rapide
  const sendReaction = (reaction: string) => {
    Alert.alert('Reaction Sent', `You reacted with ${reaction} to ${friendName}'s story`);
    setShowReactions(false);
    resumeStory();
  };
  
  // Fermer le visualiseur
  const handleClose = () => {
    navigation.goBack();
  };
  
  // Formater l'horodatage
  const formatTimestamp = (timestamp: number) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now.getTime() - postTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h`;
    } else {
      return `${Math.floor(diffMins / 1440)}d`;
    }
  };
  
  // Si aucune story ou média n'est disponible
  if (!currentStory || !currentMedia) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Story not available</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <View
        style={styles.storyContainer}
        {...panResponder.panHandlers}
      >
        {/* Média de la story */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.mediaContainer}
          onPress={handleTap}
          onLongPress={handleLongPressIn}
          onPressOut={handleLongPressOut}
          delayLongPress={200}
        >
          {currentMedia.type === 'image' ? (
            <Image
              source={{ uri: currentMedia.url }}
              style={styles.mediaContent}
              resizeMode="cover"
            />
          ) : (
            <Video
              ref={mediaRef}
              source={{ uri: currentMedia.url }}
              style={styles.mediaContent}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={!isPaused}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (!status.isLoaded) return;
                if (status.didJustFinish) {
                  goToNextMedia();
                }
              }}
            />
          )}
          
          {/* Dégradé pour meilleure visibilité du texte */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.5)']}
            style={styles.gradientOverlay}
          />
        </TouchableOpacity>
        
        {/* Barres de progression */}
        <View style={styles.progressContainer}>
          {currentStory.media.map((_, index) => (
            <View key={index} style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressIndicator,
                  {
                    width: index === currentMediaIndex 
                      ? progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      : index < currentMediaIndex ? '100%' : '0%'
                  }
                ]}
              />
            </View>
          ))}
        </View>
        
        {/* En-tête avec info utilisateur */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: friendAvatar }} style={styles.userAvatar} />
            <View style={styles.userTextInfo}>
              <Text style={styles.username}>{friendName}</Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(currentMedia.timestamp)}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Panneau de réactions rapides */}
        {showReactions && (
          <BlurView intensity={30} style={styles.reactionsPanel}>
            <View style={styles.reactionsContainer}>
              {QUICK_REACTIONS.map((reaction) => (
                <TouchableOpacity 
                  key={reaction}
                  style={styles.reactionButton}
                  onPress={() => sendReaction(reaction)}
                >
                  <Text style={styles.reactionEmoji}>{reaction}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        )}
        
        {/* Saisie de réponse */}
        <View style={styles.replyContainer}>
          {!isReplyInputActive ? (
            <TouchableOpacity 
              style={styles.replyInputPlaceholder}
              onPress={() => {
                pauseStory();
                setIsReplyInputActive(true);
                setTimeout(() => replyInputRef.current?.focus(), 100);
              }}
            >
              <Image source={{ uri: friendAvatar }} style={styles.replyAvatar} />
              <Text style={styles.replyPlaceholderText}>
                Send message
              </Text>
              <FontAwesome name="paper-plane-o" size={20} color="#FFF" style={styles.replyIcon} />
            </TouchableOpacity>
          ) : (
            <View style={styles.activeReplyContainer}>
              <TextInput
                ref={replyInputRef}
                style={styles.replyInput}
                placeholder="Reply to story..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={replyText}
                onChangeText={setReplyText}
                onFocus={handleReplyInputFocus}
                onBlur={handleReplyInputBlur}
                autoFocus
              />
              <TouchableOpacity 
                style={[styles.sendButton, replyText.length === 0 && styles.disabledSendButton]}
                onPress={sendReply}
                disabled={replyText.length === 0}
              >
                <FontAwesome name="paper-plane-o" size={20} color={replyText.length > 0 ? "#0095f6" : "#555"} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  storyContainer: {
    flex: 1,
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#222',
  },
  mediaContent: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 30 : 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + 8 : 8,
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userTextInfo: {
    marginLeft: 12,
  },
  username: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  replyContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  replyInputPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  replyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  replyPlaceholderText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  replyIcon: {
    marginLeft: 8,
  },
  activeReplyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  replyInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    opacity: 0.6,
  },
  reactionsPanel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 84,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 20,
  },
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  reactionButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 25,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight as number + 10 : 40,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StoryViewer;