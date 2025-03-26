import React, { useState, useRef, useEffect } from 'react';
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
}

const ChatDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatDetailRouteProp>();
  const { messageId, name, avatars, isGroupChat } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputHeight = useRef(new Animated.Value(50)).current;
  const emojiPickerHeight = useRef(new Animated.Value(0)).current;
  
  // Mock users for random message generation
  const users = [
    {
      id: 'me',
      name: 'Moi',
      avatar: 'https://api.a0.dev/assets/image?text=avatar%20profile%20portrait&aspect=1:1',
    },
    {
      id: 'user1',
      name: name.split(',')[0],
      avatar: avatars[0],
    }
  ];
  
  if (isGroupChat && avatars.length > 1) {
    users.push({
      id: 'user2',
      name: name.split(',')[1],
      avatar: avatars[1],
    });
  }

  useEffect(() => {
    // Mock data loading and initial message generation
    const loadMessages = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock messages
      const mockMessages: Message[] = [];
      
      // Today's date at 9:30 AM
      const today = new Date();
      today.setHours(9, 30, 0, 0);
      
      // Add system message about the group creation (for group chats only)
      if (isGroupChat) {
        mockMessages.push({
          id: 'system-1',
          text: `Vous avez créé ce groupe`,
          sender: {
            id: 'system',
            name: 'Système',
            avatar: '',
          },
          timestamp: today.toISOString(),
          status: 'read',
          isOwn: false,
        });
      }
      
      // Add some previous messages
      for (let i = 0; i < 15; i++) {
        const minutesAgo = Math.floor(Math.random() * 60);
        const messageTime = new Date(today);
        messageTime.setMinutes(messageTime.getMinutes() + (i * 10) + minutesAgo);
        
        const isOwnMessage = Math.random() > 0.5;
        const sender = isOwnMessage ? users[0] : users[Math.floor(Math.random() * (users.length - 1)) + 1];
        
        mockMessages.push({
          id: `msg-${i}`,
          text: getRandomMessage(isOwnMessage, isGroupChat),
          sender: sender,
          timestamp: messageTime.toISOString(),
          status: isOwnMessage ? (Math.random() > 0.3 ? 'read' : 'delivered') : 'sent',
          isOwn: isOwnMessage,
        });
      }
      
      // Sort messages by timestamp
      mockMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setMessages(mockMessages);
      setIsLoading(false);
    };
    
    loadMessages();
  }, [messageId, isGroupChat]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 200);
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (text.trim() === '') return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: text.trim(),
      sender: users[0],
      timestamp: new Date().toISOString(),
      status: 'sent',
      isOwn: true,
    };
    
    setMessages([...messages, newMessage]);
    setText('');
    
    // Simulate received message after a delay (for demo purposes)
    setTimeout(() => {
      // Set "typing" status
      setIsTyping(true);
      
      // After a random delay, send a response
      const replyDelay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        setIsTyping(false);
        
        const sender = users[Math.floor(Math.random() * (users.length - 1)) + 1];
        const replyMessage: Message = {
          id: `msg-${Date.now()}`,
          text: getRandomReply(),
          sender: sender,
          timestamp: new Date().toISOString(),
          status: 'sent',
          isOwn: false,
        };
        
        setMessages(prev => [...prev, replyMessage]);
        
        // Update previous message status
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, status: 'read' } 
                : msg
            )
          );
        }, 1000);
      }, replyDelay);
    }, 500);
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

  const handleInputChange = (newText: string) => {
    setText(newText);
    
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
          {isTyping ? (
            <Text style={styles.typingIndicator}>En train d'écrire...</Text>
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
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={true}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            ListHeaderComponent={() => renderDateSeparator("Aujourd'hui")}
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