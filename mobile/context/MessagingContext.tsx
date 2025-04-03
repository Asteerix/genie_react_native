import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios'; // Importer AxiosError
import messagingApi, { ChatResponse, MessageResponse, SendMessageRequest } from '../api/messages';
import websocketService from '../services/websocket';
import { useAuth } from '../auth/context/AuthContext';

// Context type definitions
interface MessagingContextType {
  chats: ChatResponse[];
  loading: boolean;
  error: string | null;
  messages: Record<string, MessageResponse[]>;
  typing: Record<string, { userId: string; timestamp: number }>;
  loadChats: () => Promise<void>;
  getChat: (chatId: string) => Promise<ChatResponse | null>;
  createChat: (type: 'direct' | 'group' | 'event', participants: string[], name?: string, eventId?: string) => Promise<ChatResponse | null>;
  loadMessages: (chatId: string, limit?: number, offset?: number) => Promise<MessageResponse[] | null>;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'video' | 'file', mediaUrl?: string) => Promise<MessageResponse | null>;
  markMessageRead: (messageId: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  sendTypingNotification: (chatId: string) => void;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  isUserTyping: (chatId: string, userId: string) => boolean;
  leaveChat: (chatId: string) => Promise<boolean>;
  updateChat: (chatId: string, name?: string, participants?: string[]) => Promise<ChatResponse | null>;
  connectWebSocket: () => Promise<boolean>;
  disconnectWebSocket: () => void;
  isWebSocketConnected: () => boolean;
}

// Create context
const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

// Provider component
export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<ChatResponse[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageResponse[]>>({});
  const [typing, setTyping] = useState<Record<string, { userId: string; timestamp: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // --- WebSocket Handlers (définis avec useCallback) ---

  const handleNewMessage = useCallback((message: MessageResponse, chatId: string) => {
    console.log(`[WS] New message received for chat ${chatId}`);
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      if (chatMessages.some(m => m.id === message.id)) return prev; // Éviter doublons
      const newMessages = [...chatMessages, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return { ...prev, [chatId]: newMessages };
    });
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, lastMessage: message, updatedAt: message.createdAt } : chat
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    // Marquer comme lu si ce n'est pas notre message
    if (user && message.senderId !== user.id) {
      websocketService.markMessageRead(message.id);
    }
  }, [user]); // Dépend de user pour la comparaison senderId

  const handleTypingNotification = useCallback((userId: string, chatId: string) => {
    console.log(`[WS] Typing notification from ${userId} in chat ${chatId}`);
    setTyping(prev => ({ ...prev, [chatId]: { userId, timestamp: Date.now() } }));
    setTimeout(() => {
      setTyping(prev => {
        const chatTyping = prev[chatId];
        // Vérifier si la notification à supprimer est toujours la même (évite race condition)
        if (chatTyping && chatTyping.userId === userId) {
          const { [chatId]: _, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    }, 3000); // Délai avant de supprimer l'indicateur
  }, []);

  const handleMessageSent = useCallback((message: MessageResponse, chatId: string) => {
    console.log(`[WS] Confirmation message sent for chat ${chatId}`);
    // Mettre à jour l'état local avec le message confirmé par le serveur
    setMessages(prev => {
      const chatMessages = prev[chatId] || [];
      // Remplacer le message temporaire (si on en avait un) ou ajouter le nouveau
      const existingIndex = chatMessages.findIndex(m => m.id === message.id); // Ou un ID temporaire si utilisé
      let newMessages;
      if (existingIndex > -1) {
        newMessages = [...chatMessages];
        newMessages[existingIndex] = message;
      } else {
        newMessages = [...chatMessages, message];
      }
      return { ...prev, [chatId]: newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) };
    });
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, lastMessage: message, updatedAt: message.createdAt } : chat
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);

  // --- Fonctions API (enveloppées dans useCallback) ---

  const connectWebSocket = useCallback(async (): Promise<boolean> => {
    console.log("MessagingContext: connectWebSocket called");
    return await websocketService.connect();
  }, []);

  const disconnectWebSocket = useCallback(() => {
    console.log("MessagingContext: disconnectWebSocket called");
    websocketService.disconnect();
  }, []);

  const isWebSocketConnected = useCallback((): boolean => {
    return websocketService.isConnected();
  }, []);

  const loadCachedChats = useCallback(async () => {
    try {
      const cachedChats = await AsyncStorage.getItem('cached_chats');
      if (cachedChats) {
        setChats(JSON.parse(cachedChats));
        console.log("MessagingContext: Loaded cached chats");
      }
    } catch (error) {
      console.error('Error loading cached chats:', error);
    }
  }, []);

  const cacheChats = useCallback(async (chatsToCache: ChatResponse[]) => {
    try {
      await AsyncStorage.setItem('cached_chats', JSON.stringify(chatsToCache));
    } catch (error) {
      console.error('Error caching chats:', error);
    }
  }, []);

  const subscribeToChat = useCallback((chatId: string) => {
    if (websocketService.isConnected()) {
      console.log(`MessagingContext: Subscribing to chat ${chatId}`);
      websocketService.subscribeToChat(chatId);
    } else {
       console.warn(`MessagingContext: Cannot subscribe to chat ${chatId}, WebSocket not connected.`);
    }
  }, []); // isConnected est déjà useCallback

  const loadChats = useCallback(async () => {
    console.log("MessagingContext: loadChats triggered");
    setLoading(true);
    setError(null);
    try {
      const response = await messagingApi.getChats();
      if (response.data) {
        console.log("MessagingContext: Chats loaded:", response.data.length);
        setChats(response.data);
        await cacheChats(response.data);
        // Tenter de connecter/souscrire après chargement
        if (!isWebSocketConnected()) { // Utilise la version useCallback
          console.log('Connecting to WebSocket after loading chats');
          const connected = await connectWebSocket(); // Utilise la version useCallback
          if (connected) {
            response.data.forEach(chat => subscribeToChat(chat.id)); // Utilise la version useCallback
          }
        } else {
          response.data.forEach(chat => subscribeToChat(chat.id)); // Utilise la version useCallback
        }
      } else if (response.error) {
        setError(response.error);
        console.error('API error when loading chats:', response.error);
      }
    } catch (err) {
       let errorMessage = 'Failed to load chats';
       if (axios.isAxiosError(err)) {
         errorMessage = err.response?.data?.error || err.message || errorMessage;
       } else if (err instanceof Error) {
         errorMessage = err.message;
       }
      setError(errorMessage);
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  }, [connectWebSocket, isWebSocketConnected, subscribeToChat, cacheChats]); // Ajouter les dépendances useCallback

  const getChat = useCallback(async (chatId: string): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagingApi.getChat(chatId);
      if (response.data) {
        const updatedChat = response.data;
        setChats(prev => {
          const index = prev.findIndex(c => c.id === chatId);
          if (index >= 0) {
            const newChats = [...prev];
            newChats[index] = updatedChat;
            return newChats;
          }
          return [...prev, updatedChat].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
        return updatedChat;
      } else if (response.error) {
        setError(response.error);
      }
      return null;
    } catch (err) {
       let errorMessage = 'Failed to get chat';
       if (axios.isAxiosError(err)) {
         errorMessage = err.response?.data?.error || err.message || errorMessage;
       } else if (err instanceof Error) {
         errorMessage = err.message;
       }
      setError(errorMessage);
      console.error('Error getting chat:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createChat = useCallback(async (
    type: 'direct' | 'group' | 'event', participants: string[], name?: string, eventId?: string
  ): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagingApi.createChat({ type, participants, name, eventId });
      if (response.data) {
        const newChat = response.data;
        setChats(prev => [...prev, newChat].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        subscribeToChat(newChat.id); // Utilise la version useCallback
        return newChat;
      } else if (response.error) {
        setError(response.error);
      }
      return null;
    } catch (err) {
       let errorMessage = 'Failed to create chat';
       if (axios.isAxiosError(err)) {
         errorMessage = err.response?.data?.error || err.message || errorMessage;
       } else if (err instanceof Error) {
         errorMessage = err.message;
       }
      setError(errorMessage);
      console.error('Error creating chat:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [subscribeToChat]); // Dépend de subscribeToChat stable

  const loadMessages = useCallback(async (chatId: string, limit = 50, offset = 0): Promise<MessageResponse[] | null> => {
    setError(null);
    try {
      const response = await messagingApi.getMessages(chatId, limit, offset);
      if (response.data) {
        const newMessages = response.data.messages;
        setMessages(prev => {
          const chatMessages = prev[chatId] || [];
          const existingIds = new Set(chatMessages.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
          const mergedMessages = [...(offset === 0 ? [] : chatMessages), ...uniqueNewMessages].sort((a, b) => // Remplacer si offset=0
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return { ...prev, [chatId]: mergedMessages };
        });
        subscribeToChat(chatId); // Utilise la version useCallback
        return newMessages;
      } else if (response.error) {
        setError(response.error);
      }
      return null;
    } catch (err) {
       let errorMessage = 'Failed to load messages';
       if (axios.isAxiosError(err)) {
         errorMessage = err.response?.data?.error || err.message || errorMessage;
       } else if (err instanceof Error) {
         errorMessage = err.message;
       }
      setError(errorMessage);
      console.error('Error loading messages:', err);
      return null;
    }
  }, [subscribeToChat]); // Dépend de subscribeToChat stable

  const sendMessage = useCallback(async (
    chatId: string, content: string, type: 'text' | 'image' | 'video' | 'file' = 'text', mediaUrl?: string
  ): Promise<MessageResponse | null> => {
    setError(null);
    try {
      if (websocketService.isConnected() && websocketService.sendChatMessage(chatId, content, type, mediaUrl)) {
        // Optimistic update (optionnel) - Ajouter un message temporaire
        // setMessages(prev => { ... });
        return null; // Attendre la confirmation via WS (handleMessageSent)
      }

      // Fallback API REST
      const response = await messagingApi.sendMessage(chatId, { type, content, mediaUrl });
      if (response.data) {
        const newMessage = response.data;
        // Mettre à jour l'état local
        handleMessageSent(newMessage, chatId); // Utiliser le handler existant pour la mise à jour
        return newMessage;
      } else if (response.error) {
        setError(response.error);
      }
      return null;
    } catch (err) {
       let errorMessage = 'Failed to send message';
       if (axios.isAxiosError(err)) {
         errorMessage = err.response?.data?.error || err.message || errorMessage;
       } else if (err instanceof Error) {
         errorMessage = err.message;
       }
      setError(errorMessage);
      console.error('Error sending message:', err);
      return null;
    }
  }, [handleMessageSent]); // Dépend de handleMessageSent stable

  const markMessageRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      if (websocketService.isConnected() && websocketService.markMessageRead(messageId)) {
        return true;
      }
      const response = await messagingApi.markMessageRead(messageId);
      return !response.error;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await messagingApi.deleteMessage(messageId);
      if (!response.error) {
        setMessages(prev => {
          const newMessages = { ...prev };
          Object.keys(newMessages).forEach(chatId => {
            newMessages[chatId] = newMessages[chatId].map(msg =>
              msg.id === messageId ? { ...msg, content: 'Ce message a été supprimé', type: 'system' as any, mediaUrl: undefined } : msg // Mettre mediaUrl à undefined
            );
          });
          return newMessages;
        });
        // TODO: Update lastMessage if needed
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }, []);

  const sendTypingNotification = useCallback((chatId: string) => {
    if (isWebSocketConnected()) { // Utilise la version useCallback
      websocketService.sendTypingNotification(chatId);
    }
  }, [isWebSocketConnected]); // Dépend de isWebSocketConnected stable

  const unsubscribeFromChat = useCallback((chatId: string) => {
    if (isWebSocketConnected()) { // Utilise la version useCallback
      console.log(`MessagingContext: Unsubscribing from chat ${chatId}`);
      websocketService.unsubscribeFromChat(chatId);
    }
  }, [isWebSocketConnected]); // Dépend de isWebSocketConnected stable

  const isUserTyping = useCallback((chatId: string, userId: string): boolean => {
    const chatTyping = typing[chatId];
    if (!chatTyping) return false;
    const isRecent = Date.now() - chatTyping.timestamp < 3000;
    return chatTyping.userId === userId && isRecent;
  }, [typing]);

  const leaveChat = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      const response = await messagingApi.leaveChat(chatId);
      if (!response.error) {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        setMessages(prev => {
          const { [chatId]: _, ...rest } = prev;
          return rest;
        });
        unsubscribeFromChat(chatId); // Utilise la version useCallback
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error leaving chat:', error);
      return false;
    }
  }, [unsubscribeFromChat]); // setChats/setMessages n'ont pas besoin d'être des dépendances

  const updateChat = useCallback(async (chatId: string, name?: string, participants?: string[]): Promise<ChatResponse | null> => {
    try {
      const response = await messagingApi.updateChat(chatId, { name, participants });
      if (response.data) {
        const updatedChat = response.data;
        setChats(prev => prev.map(chat => chat.id === chatId ? updatedChat : chat));
        return updatedChat;
      }
      return null;
    } catch (error) {
      console.error('Error updating chat:', error);
      return null;
    }
  }, []);

  // --- Effets ---

  // Load cached chats on mount
  useEffect(() => {
    loadCachedChats();
  }, [loadCachedChats]); // Ajouter loadCachedChats comme dépendance

  // Setup listeners on mount and cleanup on unmount
  useEffect(() => {
    const handleConnect = () => {
      console.log('WS Connected - Subscribing to chats');
      // Utiliser l'état 'chats' actuel au moment de la connexion
      setChats(currentChats => {
         currentChats.forEach(chat => subscribeToChat(chat.id));
         return currentChats; // Ne pas modifier l'état ici
      });
    };
    const handleDisconnect = () => {
      console.log('WS Disconnected - Attempting reconnect');
      setTimeout(() => connectWebSocket(), 3000);
    };
    const handleError = (errorMsg: any, code: any) => {
      console.error('WS Error:', errorMsg, code);
    };

    websocketService.on('message', handleNewMessage);
    websocketService.on('typing', handleTypingNotification);
    websocketService.on('message_sent', handleMessageSent);
    websocketService.on('connected', handleConnect);
    websocketService.on('disconnected', handleDisconnect);
    websocketService.on('error', handleError);

    return () => {
      websocketService.off('message', handleNewMessage);
      websocketService.off('typing', handleTypingNotification);
      websocketService.off('message_sent', handleMessageSent);
      websocketService.off('connected', handleConnect);
      websocketService.off('disconnected', handleDisconnect);
      websocketService.off('error', handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleNewMessage, handleTypingNotification, handleMessageSent, connectWebSocket, subscribeToChat]); // Ajouter les handlers useCallback comme dépendances

  // Load initial chats when user logs in or loadChats changes
  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      // Clear data on logout
      setChats([]);
      setMessages({});
      setTyping({});
      disconnectWebSocket();
    }
  }, [user, loadChats, disconnectWebSocket]); // Utiliser les versions useCallback

  // --- Valeur du Contexte ---
  const value: MessagingContextType = {
    chats,
    loading,
    error,
    messages,
    typing,
    loadChats,
    getChat,
    createChat,
    loadMessages,
    sendMessage,
    markMessageRead,
    deleteMessage,
    sendTypingNotification,
    subscribeToChat,
    unsubscribeFromChat,
    isUserTyping,
    leaveChat,
    updateChat,
    connectWebSocket,
    disconnectWebSocket,
    isWebSocketConnected
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

// Custom hook to use the messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};