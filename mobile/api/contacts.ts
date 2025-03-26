import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from './auth';
import { ApiResponse } from './types';

// Interface pour les contacts suggérés de l'application
export interface AppContact {
  id: string;
  name: string;
  username: string;
  phoneNumber: string;
  email?: string;
  avatar: string;
  isInApp: boolean;
}

/**
 * Récupérer les utilisateurs qui matchent avec les contacts du téléphone
 */
export const findContactsOnApp = async (phoneNumbers: string[]): Promise<ApiResponse<AppContact[]>> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.post<{ contacts: AppContact[] }>(
      `${API_BASE_URL}/api/v1/users/find-contacts`,
      { phoneNumbers },
      { headers }
    );
    
    return { data: response.data.contacts };
  } catch (error) {
    console.error('Erreur lors de la recherche des contacts:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la recherche des contacts'
    };
  }
};

/**
 * Ajouter des amis à partir des contacts
 */
export const addFriendsFromContacts = async (userIds: string[]): Promise<ApiResponse<void>> => {
  try {
    const headers = await getAuthHeaders();
    
    await axios.post(
      `${API_BASE_URL}/api/v1/users/add-friends`,
      { userIds },
      { headers }
    );
    
    return {};
  } catch (error) {
    console.error('Erreur lors de l\'ajout des amis:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de l\'ajout des amis'
    };
  }
};

/**
 * Récupérer les amis de l'utilisateur
 */
export const getUserFriends = async (): Promise<ApiResponse<AppContact[]>> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.get<{ friends: AppContact[] }>(
      `${API_BASE_URL}/api/v1/users/friends`,
      { headers }
    );
    
    return { data: response.data.friends };
  } catch (error) {
    console.error('Erreur lors de la récupération des amis:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération des amis'
    };
  }
};