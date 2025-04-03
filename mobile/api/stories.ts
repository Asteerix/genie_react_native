import axios, { AxiosError } from 'axios'; // Importer AxiosError
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, refreshTokenAndUpdate } from './auth';
import { ApiResponse } from './types';
import api from '../services/api';
import { Friend, Story, StoryMedia } from './contacts';

/**
 * Récupérer les stories des amis
 */
export const getFriendStories = async (): Promise<ApiResponse<Friend[]>> => {
  try {
    // Supprimer le refresh manuel, l'intercepteur s'en charge
    
    // Utiliser l'instance API qui gère le rafraîchissement automatique des tokens
    const response = await api.get<{ friends: Friend[] }>('/api/stories-v2/friends'); // Corrigé
    
    console.log('API STORIES RESPONSE:', response.data.friends ? `${response.data.friends.length} amis avec stories trouvés` : "Pas de stories");
    
    return { data: response.data.friends || [] };
  } catch (error) {
    console.error('ERREUR RÉCUPÉRATION STORIES:', error);
    let errorMessage = 'Une erreur est survenue lors de la récupération des stories';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      data: [],
      error: errorMessage
    };
  }
};

/**
 * Marquer une story comme vue
 */
export const markStoryAsViewed = async (storyId: string): Promise<ApiResponse<void>> => {
  try {
    const headers = await getAuthHeaders();
    
    await axios.post(
      `${API_BASE_URL}/api/stories-v2/view`, // Corrigé
      { storyId },
      { headers }
    );
    
    return {};
  } catch (error) {
    let errorMessage = 'Une erreur est survenue lors du marquage de la story comme vue';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      error: errorMessage
    };
  }
};

/**
 * Créer une nouvelle story
 */
export const createStory = async (mediaUrl: string, mediaType: 'image' | 'video'): Promise<ApiResponse<Story>> => {
  try {
    // Supprimer le refresh manuel, l'intercepteur s'en charge
    
    console.log(`CRÉATION DE STORY: Type=${mediaType}, URL=${mediaUrl.substring(0, 30)}...`);
    
    // Utiliser l'instance API pour gérer automatiquement les tokens
    const response = await api.post<{ story: Story }>(
      '/api/stories-v2', // Corrigé
      { 
        mediaUrl,
        mediaType
      }
    );
    
    console.log('STORY CRÉÉE AVEC SUCCÈS:', response.data.story.id);
    return { data: response.data.story };
  } catch (error) {
    console.error('ERREUR CRÉATION STORY:', error);
    let errorMessage = 'Une erreur est survenue lors de la création de la story';
     if (axios.isAxiosError(error)) {
       errorMessage = error.response?.data?.error || error.message || errorMessage;
     } else if (error instanceof Error) {
       errorMessage = error.message;
     }
    return {
      error: errorMessage
    };
  }
};

/**
 * Récupérer mes propres stories
 */
export const getMyStories = async (): Promise<ApiResponse<Story[]>> => {
  try {
    // Supprimer le refresh manuel, l'intercepteur s'en charge
    
    // Utiliser l'instance API qui gère le rafraîchissement automatique des tokens
    const response = await api.get<{ stories: Story[] }>('/api/stories-v2/me'); // Corrigé
    
    console.log('MES STORIES:', response.data.stories ? `${response.data.stories.length} stories trouvées` : "Pas de stories");
    
    return { data: response.data.stories || [] };
  } catch (error) {
    console.error('ERREUR RÉCUPÉRATION MES STORIES:', error);
    let errorMessage = 'Une erreur est survenue lors de la récupération de vos stories';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      data: [],
      error: errorMessage
    };
  }
};

/**
 * Supprimer une story
 */
export const deleteStory = async (storyId: string): Promise<ApiResponse<void>> => {
  try {
    // Supprimer le refresh manuel, l'intercepteur s'en charge
    
    // Utiliser l'instance API qui gère le rafraîchissement automatique des tokens
    await api.delete(`/api/stories-v2/${storyId}`); // Corrigé
    
    console.log('STORY SUPPRIMÉE AVEC SUCCÈS:', storyId);
    
    return {};
  } catch (error) {
    console.error('ERREUR SUPPRESSION STORY:', error);
    let errorMessage = 'Une erreur est survenue lors de la suppression de la story';
     if (axios.isAxiosError(error)) {
       errorMessage = error.response?.data?.error || error.message || errorMessage;
     } else if (error instanceof Error) {
       errorMessage = error.message;
     }
    return {
      error: errorMessage
    };
  }
};