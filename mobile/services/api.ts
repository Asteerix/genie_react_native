import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import logger from '../utils/logger';

// Configuration de base d'Axios
const API_URL = `${API_BASE_URL}/api`;

logger.info('Initializing API service', { baseUrl: API_URL });

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification et logger les requêtes
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request with our custom logger
    const requestStartTime = logger.apiRequest(
      config.method?.toUpperCase() || 'UNKNOWN',
      `${config.baseURL}${config.url}`,
      config.data
    );
    
    // Store the start time for calculating duration
    config.metadata = { startTime: requestStartTime };
    
    return config;
  },
  (error) => {
    logger.error('Request error before sending', { error: error.message });
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs, le rafraîchissement du token et logger les réponses
api.interceptors.response.use(
  (response) => {
    // Log successful response
    if (response.config.metadata?.startTime) {
      logger.apiResponse(
        response.config.method?.toUpperCase() || 'UNKNOWN',
        `${response.config.baseURL}${response.config.url}`,
        response.status,
        response.data,
        response.config.metadata.startTime
      );
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log API error
    if (originalRequest.metadata?.startTime) {
      logger.apiError(
        originalRequest.method?.toUpperCase() || 'UNKNOWN',
        `${originalRequest.baseURL}${originalRequest.url}`,
        error,
        originalRequest.metadata.startTime
      );
    }

    // Si 401 Unauthorized et pas déjà en train d'essayer de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      logger.info('Token expired, attempting refresh');
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Pas de refresh token, on déconnecte l'utilisateur
          logger.warn('No refresh token available, logging out user');
          await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
          return Promise.reject(error);
        }

        // Tentative de rafraîchissement du token
        logger.info('Refreshing token');
        const refreshStartTime = logger.apiRequest(
          'POST',
          `${API_URL}/auth/refresh`,
          { refreshToken: '****' }  // Don't log actual token
        );
        
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        logger.apiResponse(
          'POST',
          `${API_URL}/auth/refresh`,
          response.status,
          { success: true }, // Don't log tokens
          refreshStartTime
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Stockage des nouveaux tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        logger.info('Token refresh successful');

        // Modification du header et nouvelle tentative
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Reset metadata for the new request
        originalRequest.metadata = { startTime: Date.now() };
        return api(originalRequest);
      } catch (refreshError) {
        // En cas d'échec du refresh, on déconnecte l'utilisateur
        logger.error('Token refresh failed', { error: refreshError.message });
        await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authApi = {
  // Vérifier si un utilisateur existe
  checkUserExists: async (emailOrPhone: string) => {
    logger.info('Checking if user exists', { emailOrPhone });
    const response = await api.post('/auth/check', { emailOrPhone });
    logger.info('User check result', { exists: response.data.exists });
    return response.data;
  },

  // Inscription
  signUp: async (userData: {
    email?: string;
    phone?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    birthDate?: string;
    twoFactorEnabled?: boolean;
  }) => {
    const logSafeUserData = { ...userData, password: '******' };
    logger.info('Signing up new user', logSafeUserData);
    
    const response = await api.post('/auth/signup', userData);
    const { user, accessToken, refreshToken } = response.data;
    
    // Stockage des données d'authentification
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    logger.info('User signup successful', { userId: user.id });
    return user;
  },

  // Connexion
  signIn: async (emailOrPhone: string, password: string) => {
    logger.info('User signing in', { emailOrPhone });
    
    const response = await api.post('/auth/signin', { emailOrPhone, password });
    const { user, accessToken, refreshToken } = response.data;
    
    // Stockage des données d'authentification
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    logger.info('User signin successful', { userId: user.id });
    return user;
  },

  // Déconnexion
  signOut: async () => {
    logger.info('User signing out');
    try {
      // Appel au backend pour invalider le token
      await api.post('/auth/signout');
      logger.info('Backend signout successful');
    } catch (error) {
      logger.error('Error during signout from backend', { error: error.message });
    } finally {
      // Suppression des données locales même en cas d'erreur
      await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
      logger.info('Local user data cleared');
    }
  },

  // Demande de réinitialisation de mot de passe
  resetPassword: async (emailOrPhone: string) => {
    logger.info('Requesting password reset', { emailOrPhone });
    await api.post('/auth/reset', { emailOrPhone });
    logger.info('Password reset requested successfully');
  },

  // Vérification du code de réinitialisation
  verifyCode: async (emailOrPhone: string, code: string) => {
    logger.info('Verifying reset code', { emailOrPhone });
    const response = await api.post('/auth/verify-code', { emailOrPhone, code });
    logger.info('Code verification result', { valid: !!response.data.valid });
    return response.data;
  },

  // Définition d'un nouveau mot de passe
  setNewPassword: async (emailOrPhone: string, code: string, password: string) => {
    logger.info('Setting new password', { emailOrPhone });
    await api.post('/auth/reset-password', { emailOrPhone, code, password });
    logger.info('Password reset successful');
  },

  // Connexion via réseau social
  socialSignIn: async (provider: 'apple' | 'google' | 'facebook', token: string, userData?: any) => {
    logger.info('Social signin attempt', { provider });
    
    const payload = {
      provider,
      token,
      ...userData
    };
    
    const response = await api.post('/auth/social', payload);
    const { user, accessToken, refreshToken } = response.data;
    
    // Stockage des données d'authentification
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    logger.info('Social signin successful', { provider, userId: user.id });
    return user;
  },

  // Récupérer le profil de l'utilisateur connecté
  getProfile: async () => {
    logger.info('Getting user profile from local storage');
    // Utilisez la réponse de signin qui inclut déjà les données d'utilisateur,
    // ou obtenez-le depuis le stockage local
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      logger.info('User profile retrieved', { userId: user.id });
      return user;
    }
    logger.warn('No user found in local storage');
    throw new Error('Utilisateur non connecté');
  },

  // Mettre à jour le profil
  updateProfile: async (userData: any) => {
    logger.info('Updating user profile');
    const response = await api.put('/auth/profile', userData);
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    logger.info('Profile updated successfully');
    return response.data;
  },

  // Mettre à jour l'avatar
  updateAvatar: async (avatarUrl: string) => {
    logger.info('Updating user avatar');
    await api.post('/auth/avatar', { avatarUrl });
    logger.info('Avatar updated successfully');
  }
};

// Service de gestion des comptes gérés
export const managedAccountsApi = {
  // Liste des comptes gérés
  getAccounts: async () => {
    logger.info('Fetching managed accounts');
    const response = await api.get('/managed-accounts');
    logger.info('Managed accounts retrieved', { count: response.data.length });
    return response.data;
  },

  // Détails d'un compte géré
  getAccount: async (id: string) => {
    logger.info('Fetching managed account details', { accountId: id });
    const response = await api.get(`/managed-accounts/${id}`);
    logger.info('Managed account details retrieved', { accountId: id });
    return response.data;
  },

  // Créer un compte géré
  createAccount: async (accountData: {
    firstName: string;
    lastName: string;
    gender?: string;
    birthDate?: string;
    avatarUrl?: string;
  }) => {
    logger.info('Creating managed account', accountData);
    const response = await api.post('/managed-accounts', accountData);
    logger.info('Managed account created', { accountId: response.data.id });
    return response.data;
  },

  // Mettre à jour un compte géré
  updateAccount: async (id: string, accountData: any) => {
    logger.info('Updating managed account', { accountId: id, ...accountData });
    const response = await api.put(`/managed-accounts/${id}`, accountData);
    logger.info('Managed account updated', { accountId: id });
    return response.data;
  },

  // Supprimer un compte géré
  deleteAccount: async (id: string) => {
    logger.info('Deleting managed account', { accountId: id });
    await api.delete(`/managed-accounts/${id}`);
    logger.info('Managed account deleted', { accountId: id });
  }
};

export default api;