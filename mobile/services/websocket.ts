import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageResponse } from '../api/messages';

// Simple event emitter class for React Native
class SimpleEventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

// WebSocket message types
interface WebSocketMessage {
  type: string;
  payload?: any;
  chatId?: string;
  messageId?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private clientId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private isConnecting = false;
  private subscriptions: Set<string> = new Set();
  private eventEmitter = new SimpleEventEmitter();
  private authToken: string | null = null;

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<boolean> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return true;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection is already in progress');
      return false;
    }

    this.isConnecting = true;

    try {
      // Get auth token from storage
      this.authToken = await AsyncStorage.getItem('accessToken');
      if (!this.authToken) {
        console.error('No authentication token found');
        this.isConnecting = false;
        return false;
      }

      // Create WebSocket connection
      // Use the WebSocket protocol (ws:// or wss://) based on the API_BASE_URL (http:// or https://)
      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${API_BASE_URL.replace(/^https?:\/\//, '')}/api/ws`; // Corrigé: suppression de /messages
      console.log('Connecting to WebSocket URL:', wsUrl);
      this.ws = new WebSocket(`${wsUrl}?token=${this.authToken}`);

      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
      console.log('WebSocket connection setup completed, waiting for open event...');

      return await new Promise<boolean>((resolve) => {
        // Set a timeout for the connection attempt
        const connectionTimeout = setTimeout(() => {
          this.isConnecting = false;
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            this.ws = null;
          }
          resolve(false);
        }, 10000); // 10 seconds timeout

        // If connection opens successfully
        this.eventEmitter.once('connected', () => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          resolve(true);
        });

        // If connection fails
        this.eventEmitter.once('connection_failed', () => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          resolve(false);
        });
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen() {
    console.log('WebSocket connection established');
    this.reconnectAttempts = 0;
    
    // Start ping interval to keep connection alive
    this.startPingInterval();
    
    // Resubscribe to previously subscribed chats
    this.resubscribeToChats();
    
    // Emit connected event
    this.eventEmitter.emit('connected');
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: WebSocketMessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle different message types
      switch (message.type) {
        case 'connected':
          this.clientId = message.payload?.clientId;
          console.log('WebSocket client registered:', this.clientId);
          break;
          
        case 'new_message':
          // New message received in a chat
          if (message.chatId && message.payload?.message) {
            this.eventEmitter.emit('message', message.payload.message, message.chatId);
          }
          break;
          
        case 'typing':
          // Someone is typing in a chat
          if (message.chatId && message.payload?.userId) {
            this.eventEmitter.emit('typing', message.payload.userId, message.chatId);
          }
          break;
          
        case 'message_sent':
          // Confirmation that our message was sent
          if (message.chatId && message.payload?.message) {
            this.eventEmitter.emit('message_sent', message.payload.message, message.chatId);
          }
          break;
          
        case 'subscribed':
          // Successfully subscribed to a chat
          if (message.payload?.chatId) {
            console.log('Subscribed to chat:', message.payload.chatId);
          }
          break;
          
        case 'unsubscribed':
          // Successfully unsubscribed from a chat
          if (message.payload?.chatId) {
            console.log('Unsubscribed from chat:', message.payload.chatId);
          }
          break;
          
        case 'error':
          // Error message
          console.error('WebSocket error:', message.payload?.message);
          this.eventEmitter.emit('error', message.payload?.message, message.payload?.code);
          break;
          
        case 'pong':
          // Pong response from server
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: WebSocketCloseEvent) {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.ws = null;
    this.stopPingInterval();
    
    // If not a normal closure, attempt to reconnect
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
    
    this.eventEmitter.emit('disconnected');
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: any) {
    console.error('WebSocket error:', error);
    this.eventEmitter.emit('connection_failed');
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      return;
    }
    
    const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000); // Exponential backoff with max of 30 seconds
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectAttempts++;
      const success = await this.connect();
      
      if (!success && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval() {
    this.stopPingInterval(); // Clear any existing interval
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send ping message to keep connection alive
   */
  private sendPing() {
    this.send({
      type: 'ping',
      payload: { timestamp: Date.now() }
    });
  }

  /**
   * Resubscribe to all previously subscribed chats
   */
  private resubscribeToChats() {
    this.subscriptions.forEach(chatId => {
      this.subscribeToChat(chatId);
    });
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not open');
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Subscribe to messages from a specific chat
   */
  subscribeToChat(chatId: string): boolean {
    const result = this.send({
      type: 'subscribe',
      payload: { chatId }
    });
    
    if (result) {
      this.subscriptions.add(chatId);
    }
    
    return result;
  }

  /**
   * Unsubscribe from messages from a specific chat
   */
  unsubscribeFromChat(chatId: string): boolean {
    const result = this.send({
      type: 'unsubscribe',
      payload: { chatId }
    });
    
    if (result) {
      this.subscriptions.delete(chatId);
    }
    
    return result;
  }

  /**
   * Send a chat message via WebSocket
   */
  sendChatMessage(chatId: string, content: string, type: 'text' | 'image' | 'video' | 'file' = 'text', mediaUrl?: string): boolean {
    return this.send({
      type: 'message',
      payload: {
        chatId,
        content,
        type,
        mediaUrl
      }
    });
  }

  /**
   * Send typing notification
   */
  sendTypingNotification(chatId: string): boolean {
    return this.send({
      type: 'typing',
      payload: { chatId }
    });
  }

  /**
   * Mark a message as read
   */
  markMessageRead(messageId: string): boolean {
    return this.send({
      type: 'read',
      payload: { messageId }
    });
  }

  /**
   * Close WebSocket connection
   */
  disconnect() {
    this.stopPingInterval();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.subscriptions.clear();
    this.clientId = null;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get WebSocket ready state
   */
  getReadyState(): number | null {
    return this.ws ? this.ws.readyState : null;
  }

  /**
   * Add event listener
   */
  on(event: 'message' | 'typing' | 'connected' | 'disconnected' | 'error' | 'message_sent', listener: Function): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  off(event: 'message' | 'typing' | 'connected' | 'disconnected' | 'error' | 'message_sent', listener: Function): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Add one-time event listener
   */
  once(event: 'message' | 'typing' | 'connected' | 'disconnected' | 'error' | 'message_sent', listener: Function): void {
    this.eventEmitter.once(event, listener);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService;