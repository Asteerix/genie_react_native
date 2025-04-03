import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useMessaging } from '../context/MessagingContext';
import { MessageResponse } from '../api/messages';
import { useAuth } from '../auth/context/AuthContext';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isOwn: boolean;
  type?: string;
  mediaUrl?: string;
}

const ChatDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatDetailRouteProp>();
  const { messageId: chatId, name, avatars, isGroupChat } = route.params;
  const { user } = useAuth();
  const { 
    loadMessages, 
    sendMessage, 
    messages: allMessages, 
    markMessageRead,
    sendTypingNotification,
    subscribeToChat,
    unsubscribeFromChat,
    isUserTyping
  } = useMessaging();

  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState('');
  const [participants, setParticipants] = useState<{id: string; name: string; avatar: string}[]>([]);
  
  const flatListRef = useRef<FlatList>(null);
  const inputHeight = useRef(new Animated.Value(50)).current;
  const emojiPickerHeight = useRef(new Animated.Value(0)).current;
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Setup participants from route params
  useEffect(() => {
    // Default current user
    const currentUser = {
      id: user?.id || 'me',
      name: 'Moi',
      avatar: user?.avatarUrl || 'https://api.a0.dev/assets/image?text=avatar%20profile%20portrait&aspect=1:1',
    };
    
    // Setup other participants based on avatars from route params
    const otherParticipants = avatars.map((avatar, index) => ({
      id: `user${index+1}`,
      name: isGroupChat ? name.split(',')[index] || `User ${index+1}` : name,
      avatar
    }));
    
    setParticipants([currentUser, ...otherParticipants]);
  }, [name, avatars, isGroupChat, user]);

  // Subscribe to chat and load messages
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      
      try {
        // Subscribe to chat for real-time updates
        subscribeToChat(chatId);
        
        // Load messages
        await loadMessages(chatId);
        
        // Add a small delay for UI smoothness
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setIsLoading(false);
      }
    };
    
    initializeChat();
    
    // Cleanup: unsubscribe from chat
    return () => {
      unsubscribeFromChat(chatId);
    };
  }, [chatId]);
  
  // Convert API messages to local format and handle real-time updates
  useEffect(() => {
    const chatMessages = allMessages[chatId] || [];
    
    if (chatMessages.length > 0) {
      // Convert API messages to local format
      const formattedMessages = chatMessages.map(msg => {
        const sender = msg.senderId === user?.id 
          ? participants[0] // Current user
          : participants.find(p => p.id === msg.senderId) || {
              id: msg.senderId,
              name: 'Unknown',
              avatar: 'https://api.a0.dev/assets/image?text=user%20avatar&aspect=1:1'
            };
        
        // Mark message as read
        if (msg.senderId !== user?.id && !msg.readBy.includes(user?.id || '')) {
          markMessageRead(msg.id);
        }
        
        return {
          id: msg.id,
          text: msg.content,
          sender: sender,
          timestamp: msg.createdAt,
          status: msg.status,
          isOwn: msg.senderId === user?.id,
          type: msg.type,
          mediaUrl: msg.mediaUrl
        };
      });
      
      setLocalMessages(formattedMessages);
    }
  }, [allMessages, chatId, user?.id]);
  
  // Check for typing indicators
  useEffect(() => {
    // Find any participant who is typing
    const typingParticipant = participants.find(p => 
      p.id !== user?.id && isUserTyping(chatId, p.id)
    );
    
    if (typingParticipant) {
      setOtherUserTyping(typingParticipant.name);
    } else {
      setOtherUserTyping('');
    }
  }, [participants, chatId, user?.id, isUserTyping]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (localMessages.length > 0 && !isLoading) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 200);
    }
  }, [localMessages, isLoading]);

  const handleSend = async () => {
    if (text.trim() === '') return;
    
    const messageText = text.trim();
    setText('');
    
    // Send the message to the server
    const result = await sendMessage(chatId, messageText);
    
    // Note: We don't need to update local messages here as they will be updated
    // via the WebSocket or the context when the message is confirmed
  };
  
  // Send typing notification when user is typing
  const handleInputChange = (newText: string) => {
    setText(newText);
    
    // Send typing notification
    if (newText.length > 0 && (!typingTimeout.current || !isTyping)) {
      sendTypingNotification(chatId);
      setIsTyping(true);
      
      // Clear previous timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      
      // Set new timeout to clear typing status
      typingTimeout.current = setTimeout(() => {
        setIsTyping(false);
        typingTimeout.current = null;
      }, 3000);
    }
    
    // Auto-expand input for multiline text
    if (newText.length > 40 && newText.includes(' ')) {
      Animated.timing(inputHeight, {
        toValue: 80,
        duration: 100,
        useNativeDriver: false,
      }).start();
    } else if (newText.length < 30) {
      Animated.timing(inputHeight, {
        toValue: 50,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleInfoPress = () => {
    if (isGroupChat) {
      navigation.navigate('GroupChatSettings', { groupId: messageId });
    } else {
      // Navigate to user profile or direct message settings
      console.log('Navigate to user profile (not implemented yet)');
    }
  };

  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      // Hide emoji picker
      Animated.timing(emojiPickerHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setShowEmojiPicker(false);
      });
    } else {
      // Show emoji picker
      setShowEmojiPicker(true);
      Animated.timing(emojiPickerHeight, {
        toValue: 250,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleInputFocus = () => {
    if (showEmojiPicker) {
      toggleEmojiPicker();
    }
  };

  const addEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="black" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerInfo}
        onPress={handleInfoPress}
        activeOpacity={0.7}
      >
        <View style={styles.headerAvatars}>
          {isGroupChat ? (
            <View style={styles.groupAvatarContainer}>
              <Image 
                source={{ uri: avatars[0] }} 
                style={[styles.groupAvatar, { top: 0, left: 0 }]} 
              />
              <Image 
                source={{ uri: avatars[1] }} 
                style={[styles.groupAvatar, { bottom: 0, right: 0 }]} 
              />
            </View>
          ) : (
            <Image source={{ uri: avatars[0] }} style={styles.avatar} />
          )}
        </View>
        
        <View>
          <Text style={styles.headerName}>{name}</Text>
          {otherUserTyping ? (
            <Text style={styles.typingIndicator}>{otherUserTyping} est en train d'écrire...</Text>
          ) : (
            <Text style={styles.headerStatus}>
              {isGroupChat ? `${avatars.length} participants` : 'En ligne'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        {isGroupChat ? (
          <TouchableOpacity style={styles.headerButton} onPress={handleInfoPress}>
            <Ionicons name="ellipsis-vertical" size={24} color="black" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam-outline" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isSystemMessage = item.sender.id === 'system';
    const messageDate = new Date(item.timestamp);
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
          <Text style={styles.systemMessageTime}>{time}</Text>
        </View>
      );
    }
    
    return (
      <View style={[
        styles.messageRow,
        item.isOwn ? styles.ownMessageRow : styles.otherMessageRow
      ]}>
        {!item.isOwn && isGroupChat && (
          <Image source={{ uri: item.sender.avatar }} style={styles.messageAvatar} />
        )}
        
        <View style={[
          styles.messageBubble,
          item.isOwn ? styles.ownMessage : styles.otherMessage
        ]}>
          {!item.isOwn && isGroupChat && (
            <Text style={styles.messageAuthor}>
              {item.sender.name.split(' ')[0]}
            </Text>
          )}
          
          <Text style={styles.messageText}>{item.text}</Text>
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{time}</Text>
            
            {item.isOwn && (
              <View style={styles.statusContainer}>
                {item.status === 'sent' && (
                  <Ionicons name="checkmark" size={16} color="#999" />
                )}
                {item.status === 'delivered' && (
                  <Ionicons name="checkmark-done" size={16} color="#999" />
                )}
                {item.status === 'read' && (
                  <Ionicons name="checkmark-done" size={16} color="#5790DF" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDateSeparator = (dateString: string) => {
    return (
      <View style={styles.dateSeparator}>
        <View style={styles.dateLine} />
        <Text style={styles.dateText}>{dateString}</Text>
        <View style={styles.dateLine} />
      </View>
    );
  };

  const renderEmojiPicker = () => {
    const emojis = ['😊', '👍', '❤️', '🎉', '🙏', '😂', '🥰', '😍', '🤔', '👌', '🎁', '🥳', '🌟', '🙌', '🤗', '🚀'];
    
    return (
      <Animated.View style={[styles.emojiPickerContainer, { height: emojiPickerHeight }]}>
        <View style={styles.emojiGrid}>
          {emojis.map((emoji, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.emojiButton}
              onPress={() => addEmoji(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Chargement des messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={localMessages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={true}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            ListHeaderComponent={() => renderDateSeparator("Aujourd'hui")}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun message. Commencez la conversation !</Text>
              </View>
            )}
          />
        )}
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={26} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.textInputContainer}>
            <Animated.View style={{ height: inputHeight }}>
              <TextInput
                style={styles.input}
                placeholder="Message..."
                value={text}
                onChangeText={handleInputChange}
                multiline
                onFocus={handleInputFocus}
              />
            </Animated.View>
            
            <TouchableOpacity
              style={styles.emojiToggleButton}
              onPress={toggleEmojiPicker}
            >
              <Ionicons name="happy-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {text.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic-outline" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        {showEmojiPicker && renderEmojiPicker()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Helper functions for generating random messages
const getRandomMessage = (isOwn: boolean, isGroup: boolean) => {
  const ownMessages = [
    "Salut ! Comment ça va ?",
    "Tu as des nouvelles pour le cadeau ?",
    "J'ai trouvé quelque chose d'intéressant !",
    "Je pense qu'on devrait choisir quelque chose d'original",
    "C'est dans deux semaines, il faut qu'on se dépêche",
    "As-tu des idées ?",
    "Voici ce que je pensais acheter",
    "Tu préfères qu'on s'organise comment ?",
    "J'ai vu une superbe montre qui pourrait convenir",
    "Je passe au magasin ce soir",
    "Dis-moi ce que tu en penses"
  ];
  
  const otherMessages = [
    "Ça va bien, et toi ?",
    "Pas encore, mais je cherche",
    "Super ! Envoie-moi un lien",
    "Oui, quelque chose de personnalisé serait parfait",
    "Ne t'inquiète pas, on a encore le temps",
    "Peut-être un coffret cadeau ?",
    "Ça a l'air bien !",
    "On peut se retrouver ce weekend pour faire les magasins",
    "Quelle est ta fourchette de prix ?",
    "D'accord, on en reparle demain",
    "Ça me semble parfait !"
  ];
  
  const groupMessages = [
    "On devrait tous mettre 30€, ça vous va ?",
    "Je propose qu'on achète un cadeau commun",
    "Est-ce que tout le monde est d'accord ?",
    "J'ai créé une cagnotte en ligne",
    "Qui peut s'occuper de l'emballage ?",
    "Il faut qu'on signe la carte aussi",
    "On se retrouve à quelle heure à la fête ?",
    "Qui s'occupe d'acheter le gâteau ?",
    "Est-ce que quelqu'un connaît ses goûts ?",
    "Je peux passer chercher le cadeau"
  ];
  
  if (isGroup && Math.random() > 0.7) {
    return groupMessages[Math.floor(Math.random() * groupMessages.length)];
  }
  
  return isOwn 
    ? ownMessages[Math.floor(Math.random() * ownMessages.length)]
    : otherMessages[Math.floor(Math.random() * otherMessages.length)];
};

const getRandomReply = () => {
  const replies = [
    "D'accord, ça me va !",
    "Oui, c'est une bonne idée !",
    "Je suis disponible ce weekend",
    "Parfait, merci !",
    "Je vais y réfléchir",
    "Je t'envoie ça dès que possible",
    "On peut aussi regarder dans cette boutique",
    "Super, on fait comme ça alors",
    "Je m'en occupe !",
    "Je vais voir ce que je peux trouver"
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerAvatars: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  groupAvatarContainer: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  groupAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    color: '#666',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#34C759',
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  ownMessage: {
    backgroundColor: '#E7F3FF',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginRight: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  dateText: {
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#999',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#999',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  systemMessageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  attachButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 36,
  },
  emojiToggleButton: {
    padding: 4,
    alignSelf: 'flex-end',
  },
  sendButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  micButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  emojiPickerContainer: {
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    padding: 10,
    overflow: 'hidden',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emojiButton: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});

export default ChatDetailScreen;