import api from '../services/api';
import { ApiResponse } from './types';

// Types for messaging API
export interface ChatResponse {
  id: string;
  type: 'direct' | 'group' | 'event';
  name?: string;
  participants: string[];
  eventId?: string;
  lastMessage?: MessageResponse;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'file' | 'system';
  content: string;
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  type: 'direct' | 'group' | 'event';
  name?: string;
  participants: string[];
  eventId?: string;
}

export interface UpdateChatRequest {
  name?: string;
  participants?: string[];
}

export interface SendMessageRequest {
  type: 'text' | 'image' | 'video' | 'file';
  content: string;
  mediaUrl?: string;
}

// Messaging service
export const messagingApi = {
  // Chat management
  createChat: async (data: CreateChatRequest): Promise<ApiResponse<ChatResponse>> => {
    try {
      const response = await api.post('/api/messages/chats', data);
      return { data: response.data };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to create chat' };
    }
  },

  getChats: async (): Promise<ApiResponse<ChatResponse[]>> => {
    try {
      const response = await api.get('/api/messages/chats');
      return { data: response.data.chats };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to get chats' };
    }
  },

  getChat: async (chatId: string): Promise<ApiResponse<ChatResponse>> => {
    try {
      const response = await api.get(`/api/messages/chats/${chatId}`);
      return { data: response.data };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to get chat' };
    }
  },

  updateChat: async (chatId: string, data: UpdateChatRequest): Promise<ApiResponse<ChatResponse>> => {
    try {
      const response = await api.put(`/api/messages/chats/${chatId}`, data);
      return { data: response.data };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to update chat' };
    }
  },

  leaveChat: async (chatId: string): Promise<ApiResponse> => {
    try {
      await api.delete(`/api/messages/chats/${chatId}`);
      return {};
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to leave chat' };
    }
  },

  // Message management
  getMessages: async (chatId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<{ messages: MessageResponse[], pagination: any }>> => {
    try {
      const response = await api.get(`/api/messages/chats/${chatId}/messages`, {
        params: { limit, offset }
      });
      return { data: response.data };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to get messages' };
    }
  },

  sendMessage: async (chatId: string, data: SendMessageRequest): Promise<ApiResponse<MessageResponse>> => {
    try {
      const response = await api.post(`/api/messages/chats/${chatId}/messages`, data);
      return { data: response.data };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to send message' };
    }
  },

  markMessageRead: async (messageId: string): Promise<ApiResponse> => {
    try {
      await api.put(`/api/messages/messages/${messageId}/read`);
      return {};
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to mark message as read' };
    }
  },

  deleteMessage: async (messageId: string): Promise<ApiResponse> => {
    try {
      await api.delete(`/api/messages/messages/${messageId}`);
      return {};
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to delete message' };
    }
  },

  // Event chats
  getEventChats: async (eventId: string): Promise<ApiResponse<ChatResponse[]>> => {
    try {
      const response = await api.get(`/api/messages/events/${eventId}/chats`);
      return { data: response.data.chats };
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to get event chats' };
    }
  },
};

export default messagingApi;