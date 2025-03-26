import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { ApiResponse, AuthResponse, UserProfile } from './types';

// Clés de stockage pour les tokens
const ACCESS_TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_PROFILE_KEY = '@user_profile';

/**
 * Enregistrement d'un nouvel utilisateur
 */
export const signUp = async (userData: {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
}): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/v1/auth/signup`,
      userData
    );
    
    // Sauvegarder les tokens et le profil utilisateur
    await saveAuthData(response.data);
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de l\'inscription'
    };
  }
};

/**
 * Connexion d'un utilisateur existant
 */
export const signIn = async (credentials: {
  emailOrPhone: string;
  password: string;
}): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/v1/auth/signin`,
      credentials
    );
    
    // Sauvegarder les tokens et le profil utilisateur
    await saveAuthData(response.data);
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la connexion'
    };
  }
};

/**
 * Connexion via un réseau social
 */
export const socialLogin = async (provider: string, token: string, userData?: {
  email?: string;
  firstName?: string;
  lastName?: string;
}): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/v1/auth/social-login`,
      {
        provider,
        token,
        ...userData
      }
    );
    
    // Sauvegarder les tokens et le profil utilisateur
    await saveAuthData(response.data);
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la connexion sociale:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la connexion sociale'
    };
  }
};

/**
 * Rafraîchir le token d'accès
 */
export const refreshToken = async (): Promise<ApiResponse<AuthResponse>> => {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      return { error: 'Aucun token de rafraîchissement disponible' };
    }
    
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/v1/auth/refresh-token`,
      { refreshToken }
    );
    
    // Sauvegarder les nouveaux tokens et le profil utilisateur
    await saveAuthData(response.data);
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors du rafraîchissement du token'
    };
  }
};

/**
 * Déconnexion
 */
export const signOut = async (): Promise<void> => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_PROFILE_KEY]);
};

/**
 * Vérifier si un utilisateur existe
 */
export const checkUserExists = async (emailOrPhone: string): Promise<ApiResponse<{ exists: boolean }>> => {
  try {
    const response = await axios.post<{ exists: boolean }>(
      `${API_BASE_URL}/api/v1/auth/check-user`,
      { emailOrPhone }
    );
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la vérification'
    };
  }
};

/**
 * Demander une réinitialisation de mot de passe
 */
export const requestPasswordReset = async (emailOrPhone: string): Promise<ApiResponse<void>> => {
  try {
    await axios.post(
      `${API_BASE_URL}/api/v1/auth/forgot-password`,
      { emailOrPhone }
    );
    return {};
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la demande de réinitialisation'
    };
  }
};

/**
 * Vérifier un code de réinitialisation
 */
export const verifyResetCode = async (emailOrPhone: string, code: string): Promise<ApiResponse<{ valid: boolean }>> => {
  try {
    const response = await axios.post<{ valid: boolean }>(
      `${API_BASE_URL}/api/v1/auth/verify-code`,
      { emailOrPhone, code }
    );
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la vérification du code'
    };
  }
};

/**
 * Réinitialiser le mot de passe
 */
export const resetPassword = async (emailOrPhone: string, code: string, password: string): Promise<ApiResponse<void>> => {
  try {
    await axios.post(
      `${API_BASE_URL}/api/v1/auth/reset-password`,
      { emailOrPhone, code, password }
    );
    return {};
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la réinitialisation du mot de passe'
    };
  }
};

/**
 * Obtenir les en-têtes d'authentification pour les requêtes API
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  
  if (!token) {
    // Si le token n'existe pas, essayer de le rafraîchir
    const refreshResult = await refreshToken();
    if (refreshResult.error) {
      throw new Error('Non authentifié');
    }
  }
  
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Obtenir le profil de l'utilisateur connecté
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const userProfileJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
  if (!userProfileJson) return null;
  
  return JSON.parse(userProfileJson);
};

/**
 * Vérifier si l'utilisateur est connecté
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return !!token;
};

/**
 * Sauvegarder les données d'authentification
 */
const saveAuthData = async (authData: AuthResponse): Promise<void> => {
  const promises = [
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken),
    AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authData.user))
  ];
  
  await Promise.all(promises);
};