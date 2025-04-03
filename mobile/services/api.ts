import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import logger from '../utils/logger';
// --- Type Definitions (Placeholders - TODO: Move to a central types file like api/types.ts) ---
type User = any; // Placeholder for the actual User type
type ManagedAccount = any; // Placeholder for the actual ManagedAccount type
type Transaction = any; // Placeholder for the actual Transaction type

type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type BalanceResponse = {
  balance: number;
};

type TransactionHistoryResponse = {
  transactions: Transaction[];
};
// --- End Type Definitions ---


// Configuration de base d'Axios
const API_URL = `${API_BASE_URL}`;

logger.info('Initializing API service', { baseUrl: API_URL });

// Make sure we have a clean base URL without duplicate /api
const baseURL = API_URL;

logger.info('Using API base URL', { baseURL });

// Log the final URL that will be used for API calls
logger.info('Full API routes will be', { 
  wishlistsUrl: `${baseURL}/api/wishlists`,
  messagesUrl: `${baseURL}/api/messages` 
});

// Make sure our baseURL doesn't end with /api
// This way we'll explicitly include /api in each endpoint path
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes de timeout
});

// Définir une interface personnalisée pour la configuration de la requête
// Ajout de _retry pour suivre les tentatives de rafraîchissement
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: number };
  _retry?: boolean; // Ajouter la propriété _retry ici
}

// Ajouter un intercepteur pour vérifier les URLs des requêtes
// Utiliser InternalAxiosRequestConfig pour le premier intercepteur simple
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Logger l'URL complète de la requête avant tout traitement
  const fullUrlBefore = `${config.baseURL}${config.url}`;
  logger.info('API Request URL (before processing)', { 
    url: fullUrlBefore,
    baseURL: config.baseURL,
    path: config.url
  });
  
  // On ne modifie plus l'URL car l'URL complète doit contenir /api/
  // Laissons la requête aller directement au serveur
  
  return config;
});

// Intercepteur pour ajouter le token d'authentification et logger les requêtes
api.interceptors.request.use(
  // Utiliser CustomAxiosRequestConfig pour l'intercepteur qui ajoute metadata et gère le token
  async (config: CustomAxiosRequestConfig) => {
    // Ne pas ajouter d'en-têtes d'authentification pour les requêtes d'authentification
    const isAuthRequest = config.url?.includes('/auth/signin') || 
                         config.url?.includes('/auth/signup') || 
                         config.url?.includes('/auth/refresh');
                         
    // Vérifier plusieurs clés de stockage possible pour le token
    const possibleTokenKeys = ['accessToken', '@auth_token', 'auth_token', '@access_token', 'access_token', 'token'];
    let token = null;
    
    // Ne pas chercher le token pour les requêtes d'authentification
    if (!isAuthRequest) {
      for (const key of possibleTokenKeys) {
        const storedToken = await AsyncStorage.getItem(key);
        if (storedToken) {
          token = storedToken;
          break;
        }
      }
      
      if (token) {
        // Assurer que headers existe (déjà fait dans le diff précédent, mais on vérifie)
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
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
  (error: any) => { // Garder 'any' pour la simplicité ici, ou utiliser AxiosError
    logger.error('Request error before sending', { error: error.message });
    return Promise.reject(error);
  }
);

// --- Variables pour gérer le rafraîchissement de token ---
let isRefreshing = false;
// La file d'attente attend maintenant le nouveau token en cas de succès
let failedQueue: Array<{ resolve: (token: string) => void; reject: (reason?: any) => void }> = [];

// processQueue nécessite maintenant un token en cas de succès
const processQueue = (error: Error | null, token: string | null) => {
 failedQueue.forEach(prom => {
   if (error || !token) { // Rejeter si erreur ou pas de token
     prom.reject(error || new Error("Token refresh failed"));
   } else {
     prom.resolve(token); // Résoudre avec le nouveau token
   }
 });
 failedQueue = [];
};
// --- Fin Variables ---

// Intercepteur pour gérer les erreurs, le rafraîchissement du token et logger les réponses
api.interceptors.response.use(
  (response: AxiosResponse) => { // Utiliser AxiosResponse
    // Log successful response
    // Utiliser le type personnalisé pour accéder à metadata
    // Utiliser le type personnalisé pour accéder à metadata
    const config = response.config as CustomAxiosRequestConfig;
    if (config.metadata?.startTime) {
      logger.apiResponse(
        response.config.method?.toUpperCase() || 'UNKNOWN',
        // Accéder à metadata via le type personnalisé (déjà fait, mais on vérifie)
        `${config.baseURL}${config.url}`,
        response.status,
        response.data,
        config.metadata.startTime
      );
    }
    
    return response;
  },
  // Typer l'erreur comme AxiosError pour accéder à .response et .config
  async (error: AxiosError | any) => {
    // Si pas de config, c'est probablement une erreur de réseau
    if (!error.config) {
      logger.error('Network error', { error: error.message });
      return Promise.reject(error);
    }
    
    // Utiliser le type personnalisé pour la requête originale
    // Utiliser le type personnalisé pour la requête originale (déjà fait, mais on vérifie)
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Log API error (sauf pour les erreurs d'authentification)
    const isAuthError = error.response?.status === 401;
    
    // Ne pas logger les erreurs d'authentification pour éviter du bruit dans les logs
    // Accéder à metadata via le type personnalisé
    // Accéder à metadata via le type personnalisé (déjà fait, mais on vérifie)
    if (originalRequest?.metadata?.startTime && !isAuthError) {
      logger.apiError(
        originalRequest.method?.toUpperCase() || 'UNKNOWN',
        `${originalRequest.baseURL}${originalRequest.url}`,
        error, // L'objet error complet
        originalRequest.metadata.startTime
      );
    }
    // Ne pas tenter de refresh le token pour les requêtes d'auth
    // Vérifier si originalRequest et originalRequest.url existent
    // Vérifier si originalRequest et originalRequest.url existent (déjà fait, mais on vérifie)
    const isAuthRequest = originalRequest?.url?.includes('/auth/signin') ||
                         originalRequest?.url?.includes('/auth/signup') ||
                         originalRequest?.url?.includes('/auth/refresh');

    // Si 401 Unauthorized et pas déjà en train d'essayer de refresh et pas une requête d'auth
    // Vérifier si originalRequest existe avant d'accéder à _retry
    // Accéder à _retry via le type CustomAxiosRequestConfig
    if (error.response?.status === 401 && originalRequest && !isAuthRequest) {
      if (isRefreshing) {
        // Si un rafraîchissement est déjà en cours, mettre la requête en attente
        // Typer explicitement la promesse pour qu'elle résolve en string (le nouveau token)
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject }); // resolve attend maintenant une string
        })
        .then((newToken: string) => { // Le token résolu est le nouveau token
          // Mettre à jour l'en-tête avec le NOUVEAU token et réessayer
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + newToken; // Utiliser le token résolu
          } else {
            logger.warn('Original request headers missing when retrying from queue');
          }
          originalRequest.metadata = { startTime: Date.now() }; // Réinitialiser le temps de début
          // LOG AJOUTÉ : Vérifier l'en-tête juste avant de renvoyer
          logger.debug('>>> Retrying request from queue - Final Authorization header:', { header: originalRequest.headers?.Authorization });
          // Créer une nouvelle instance d'en-têtes et copier les anciens
          const newHeaders = new axios.AxiosHeaders(originalRequest.headers);
          newHeaders.set('Authorization', `Bearer ${newToken}`);

          // Créer une nouvelle config basée sur l'originale pour éviter effets de bord potentiels
          const newConfig: CustomAxiosRequestConfig = {
            ...originalRequest,
            headers: newHeaders, // Utiliser la nouvelle instance d'en-têtes
            metadata: { startTime: Date.now() },
            _retry: true, // Marquer comme déjà réessayé
          };
          logger.debug('>>> Retrying request from queue with new config - Final Authorization header:', { header: newConfig.headers?.Authorization });
          return api(newConfig);
        })
        .catch(err => {
          logger.error('Failed to retry request from queue', { error: err.message });
          return Promise.reject(err); // Propager l'erreur si le refresh a échoué
        });
      }

      // Marquer qu'un rafraîchissement est en cours
      isRefreshing = true;
      originalRequest._retry = true; // Marquer la requête comme ayant déjà tenté un retry

      return new Promise(async (resolve, reject) => {
        try {
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (!refreshToken) {
            logger.warn('No refresh token found, logging out.');
            await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken', '@auth_token']);
            processQueue(new Error('Session expirée'), null); // Rejeter les requêtes en attente
            return reject({ ...error, __handled: true, message: 'Session expirée' });
          }

          const refreshUrl = `${API_URL}/api/auth/refresh`;
          logger.debug(`Attempting API token refresh with URL: ${refreshUrl}`);
          const payload = { refreshToken };

          // Utiliser axios directement pour éviter la boucle d'intercepteurs
          const refreshResponse = await axios.post<{ accessToken: string; refreshToken?: string }>(refreshUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

          if (!accessToken) {
            throw new Error('No access token received from refresh endpoint');
          }

          // Stocker les nouveaux tokens
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('@auth_token', accessToken); // Compatibilité
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
          }

          logger.info('Token refreshed successfully.');

          // Mettre à jour le header de la requête originale
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          }
          originalRequest.metadata = { startTime: Date.now() }; // Reset start time

          // Mettre à jour l'en-tête de la requête originale AVANT de traiter la file ou de résoudre
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
             // LOG AJOUTÉ : Vérifier l'en-tête juste avant de renvoyer
             logger.debug('>>> Retrying original request - Final Authorization header:', { header: originalRequest.headers?.Authorization });
          } else {
             logger.warn('Original request headers missing when retrying original request');
          }
          originalRequest.metadata = { startTime: Date.now() }; // Réinitialiser le temps de début

          // Traiter la file d'attente avec le nouveau token
          processQueue(null, accessToken);
          // Créer une nouvelle instance d'en-têtes et copier les anciens
          const newHeaders = new axios.AxiosHeaders(originalRequest.headers);
          newHeaders.set('Authorization', `Bearer ${accessToken}`);

          // Créer une nouvelle config basée sur l'originale
          const newConfig: CustomAxiosRequestConfig = {
            ...originalRequest,
            headers: newHeaders, // Utiliser la nouvelle instance d'en-têtes
            metadata: { startTime: Date.now() },
            _retry: true, // Marquer comme déjà réessayé
          };
          logger.debug('>>> Retrying original request with new config - Final Authorization header:', { header: newConfig.headers?.Authorization });
          // Résoudre la promesse principale, ce qui relance la requête avec la nouvelle config
          resolve(api(newConfig));

        } catch (refreshError) {
          logger.error('Refresh token process failed', { error: (refreshError as Error).message });
          await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken', '@auth_token']);
          // Traiter la file d'attente avec une erreur
          processQueue(refreshError instanceof Error ? refreshError : new Error('Token refresh failed'), null);
          reject({ ...error, __handled: true, message: 'Session expirée' }); // Rejeter la promesse principale
        } finally {
          isRefreshing = false; // Marquer la fin du rafraîchissement
        }
      });
    }
    
    // Si c'est une requête 401 déjà traitée ou tout autre type d'erreur, on la propage
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authApi = {
  // Vérifier si un utilisateur existe
  checkUserExists: async (emailOrPhone: string) => {
    logger.info('Checking if user exists', { emailOrPhone });
    try {
      // Appel direct au backend
      // Typer la réponse attendue
      // Ajouter le préfixe /api
      const response = await api.post<{ exists: boolean }>('/api/auth/check', { emailOrPhone });
      logger.info('User check result', { exists: response.data?.exists }); // Optional chaining
      return response.data;
    } catch (error) {
      // Typer l'erreur
      logger.error('User check failed', { error: (error as Error).message });
      // En cas d'erreur, propager l'exception pour que l'interface utilisateur puisse la gérer
      throw new Error('Erreur lors de la vérification de l\'utilisateur');
    }
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
    
    try {
      // Définir un type pour la réponse de signup/signin (peut être déplacé hors de la fonction)
      // Utiliser le type AuthResponse défini en haut du fichier
      // Ajouter le préfixe /api
      const response = await api.post<AuthResponse>('/api/auth/signup', userData);
      // Accéder aux données typées (ajouter optional chaining si nécessaire)
      const { user, accessToken, refreshToken } = response.data;
      
      // Stockage des données d'authentification
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      logger.info('User signup successful', { userId: user.id });
      return user;
    } catch (error) {
      // Typer l'erreur
      logger.error('Signup failed', { error: (error as AxiosError).message });
      
      // Si l'utilisateur existe déjà (409 Conflict)
      // Utiliser AxiosError pour accéder à .response
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 409) {
        throw new Error('Un compte avec cet email ou téléphone existe déjà');
      }
      
      // Si les données sont invalides (400 Bad Request)
      if (axiosError.response && axiosError.response.status === 400) {
        // Typer response.data si possible, sinon utiliser 'any'
        const responseData = axiosError.response?.data as any; // Ajouter optional chaining
        const errorMessage = responseData?.message || 'Données d\'inscription invalides';
        throw new Error(errorMessage);
      }
      
      // Erreur serveur ou réseau
      throw error;
    }
  },

  // Connexion
  signIn: async (emailOrPhone: string, password: string) => {
    logger.info('User signing in', { emailOrPhone });
    
    try {
      // Appel direct au backend
      // Utiliser le type AuthResponse défini plus haut
      // Ajouter le préfixe /api
      const response = await api.post<AuthResponse>('/api/auth/signin', { emailOrPhone, password });
      const { user, accessToken, refreshToken } = response.data;
      
      // Stockage des données d'authentification
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      logger.info('User signin successful', { userId: user.id });
      return user;
    } catch (error) {
      // Typer l'erreur
      logger.error('Signin failed', { error: (error as AxiosError).message });
      
      // Erreurs spécifiques
      // Utiliser AxiosError
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // Erreur d'authentification (401)
        if (axiosError.response.status === 401) {
          throw new Error('Email ou mot de passe incorrect');
        }
        
        // Utilisateur non trouvé (404)
        if (axiosError.response.status === 404) {
          throw new Error('Utilisateur non trouvé');
        }
        
        // Autres erreurs de réponse
        // Typer response.data si possible
        const responseData = axiosError.response?.data as any; // Ajouter optional chaining
        if (responseData?.message) { // Ajouter optional chaining
          throw new Error(responseData.message);
        }
      }
      
      // Erreur réseau ou serveur générique
      throw new Error('Erreur de connexion. Veuillez réessayer.');
    }
  },

  // Déconnexion
  signOut: async () => {
    logger.info('User signing out');
    try {
      // Récupérer le refresh token pour le passer lors de la déconnexion
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (refreshToken) {
        // Appel au backend pour invalider le token
        // Ajouter le préfixe /api
        // Préfixe /api déjà présent
        await api.post('/api/auth/signout', { refreshToken });
        logger.info('Backend signout successful with refresh token');
      } else {
        // Tenter de faire la déconnexion même sans refresh token
        // Ajouter le préfixe /api
        // Ajouter le préfixe /api
        await api.post('/api/auth/signout');
        logger.warn('Backend signout requested without refresh token');
      }
    } catch (error) {
      // Typer l'erreur
      logger.error('Error during signout from backend', { error: (error as Error).message });
    } finally {
      // Suppression des données locales même en cas d'erreur
      // Utiliser un tableau plus complet pour supprimer tous les tokens possibles
      await AsyncStorage.multiRemove([
        'user', 
        'accessToken', 
        'refreshToken',
        '@auth_token',
        '@refresh_token',
        'token',
        '@access_token',
        'access_token',
        'userProfile',
        '@user_profile'
      ]);
      logger.info('All local auth data cleared during signout');
    }
  },

  // Demande de réinitialisation de mot de passe
  resetPassword: async (emailOrPhone: string) => {
    logger.info('Requesting password reset', { emailOrPhone });
    // Ajouter le préfixe /api
    // Préfixe /api déjà présent
    await api.post('/api/auth/reset', { emailOrPhone });
    logger.info('Password reset requested successfully');
  },

  // Vérification du code de réinitialisation
  verifyCode: async (emailOrPhone: string, code: string) => {
    logger.info('Verifying reset code', { emailOrPhone });
    // Typer la réponse attendue
    // Ajouter le préfixe /api
    // Préfixe /api déjà présent
    const response = await api.post<{ valid: boolean }>('/api/auth/verify-code', { emailOrPhone, code });
    logger.info('Code verification result', { valid: !!response.data?.valid }); // Optional chaining
    return response.data;
  },

  // Définition d'un nouveau mot de passe
  setNewPassword: async (emailOrPhone: string, code: string, password: string) => {
    logger.info('Setting new password', { emailOrPhone });
    // Ajouter le préfixe /api
    // Préfixe /api déjà présent
    await api.post('/api/auth/reset-password', { emailOrPhone, code, password });
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
    
    // Utiliser le type AuthResponse
    // Ajouter le préfixe /api
    const response = await api.post<AuthResponse>('/api/auth/social', payload);
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
    // Ajouter le préfixe /api
    // Préfixe /api déjà présent
    const response = await api.put('/api/auth/profile', userData);
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    logger.info('Profile updated successfully');
    return response.data;
  },

  // Mettre à jour l'avatar
  updateAvatar: async (avatarUrl: string) => {
    logger.info('Updating user avatar');
    // Ajouter le préfixe /api
    // Préfixe /api déjà présent
    await api.post('/api/auth/avatar', { avatarUrl });
    logger.info('Avatar updated successfully');
  }
};

// Service de gestion des comptes gérés
export const managedAccountsApi = {
  // Liste des comptes gérés
  getAccounts: async () => {
    logger.info('Fetching managed accounts');
    // Typer la réponse (TODO: remplacer 'any[]' par le type réel des comptes)
    // Utiliser le type ManagedAccount défini en haut
    const response = await api.get<ManagedAccount[]>('/managed-accounts');
    logger.info('Managed accounts retrieved', { count: response.data?.length || 0 }); // Optional chaining
    return response.data;
  },

  // Détails d'un compte géré
  getAccount: async (id: string) => {
    logger.info('Fetching managed account details', { accountId: id });
    // Typer la réponse (TODO: remplacer 'any' par le type réel du compte)
    const response = await api.get<ManagedAccount>(`/managed-accounts/${id}`); // Utilise le type défini
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
    // Typer la réponse (TODO: remplacer 'any' par le type réel du compte créé)
    const response = await api.post<ManagedAccount>('/managed-accounts', accountData); // Utilise le type défini
    logger.info('Managed account created', { accountId: response.data?.id }); // Optional chaining
    return response.data;
  },

  // Mettre à jour un compte géré
  updateAccount: async (id: string, accountData: any) => {
    logger.info('Updating managed account', { accountId: id, ...accountData });
    // Typer la réponse (TODO: remplacer 'any' par le type réel du compte mis à jour)
    const response = await api.put<ManagedAccount>(`/managed-accounts/${id}`, accountData); // Utilise le type défini
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

// Service de gestion des transactions
export const transactionsApi = {
  // Récupérer l'historique des transactions
  getTransactions: async (limit: number = 10, offset: number = 0) => {
    logger.info('Fetching transaction history', { limit, offset });
    // Typer la réponse (TODO: remplacer 'any' par le type réel de l'historique)
    // Utiliser les types Transaction et TransactionHistoryResponse définis en haut
    const response = await api.get<TransactionHistoryResponse>(`/api/users/me/transactions?limit=${limit}&offset=${offset}`);
    logger.info('Transaction history retrieved', { count: response.data?.transactions?.length || 0 });
    return response.data;
  },

  // Ajouter des fonds au compte
  addFunds: async (amount: number) => {
    logger.info('Adding funds to wallet', { amount });
    // Typer la réponse (TODO: remplacer 'any' par le type réel de la réponse)
    // Utiliser le type BalanceResponse défini en haut
    const response = await api.post<BalanceResponse>('/api/users/me/balance/add', { amount });
    logger.info('Funds added successfully', { newBalance: response.data?.balance });
    return response.data;
  },

  // Transférer des fonds
  transferFunds: async (amount: number, recipientId: string, isManagedAccount: boolean = false) => {
    logger.info('Transferring funds', { amount, recipientId, isManagedAccount });
    // Typer la réponse (TODO: remplacer 'any' par le type réel de la réponse)
    const response = await api.post<BalanceResponse>('/api/users/me/balance/transfer', { // Utilise le type défini
      amount,
      recipientId,
      isManagedAccount
    });
    logger.info('Funds transferred successfully', { newBalance: response.data?.balance });
    return response.data;
  }
};

export default api;