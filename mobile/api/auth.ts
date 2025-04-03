import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { ApiResponse, AuthResponse, UserProfile } from './types';

// Clés de stockage pour les tokens
const ACCESS_TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = 'refreshToken'; // Changé pour correspondre à ce qu'utilise AuthContext
const USER_PROFILE_KEY = '@user_profile';

// Autres clés possibles pour la compatibilité
const ALTERNATIVE_ACCESS_TOKEN_KEYS = ['accessToken', 'token', '@access_token', 'access_token'];
const ALTERNATIVE_REFRESH_TOKEN_KEYS = ['@refresh_token'];

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
      `${API_BASE_URL}/api/auth/signup`,
      userData
    );
    
    // Sauvegarder les tokens et le profil utilisateur
    await saveAuthData(response.data);
    
    return { data: response.data };
  } catch (error) {
    // Gestion silencieuse de l'erreur d'inscription
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
      `${API_BASE_URL}/api/auth/signin`,
      credentials
    );
    
    // Sauvegarder les tokens et le profil utilisateur
    await saveAuthData(response.data);
    
    return { data: response.data };
  } catch (error) {
    // Gestion silencieuse de l'erreur de connexion
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
      `${API_BASE_URL}/api/auth/social-login`,
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
    // Gestion silencieuse de l'erreur de connexion sociale
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
    // Vérifier toutes les clés possibles pour le refresh token
    let refreshTokenValue = null;
    const allRefreshTokenKeys = [REFRESH_TOKEN_KEY, ...ALTERNATIVE_REFRESH_TOKEN_KEYS];
    
    for (const key of allRefreshTokenKeys) {
      const storedRefreshToken = await AsyncStorage.getItem(key);
      if (storedRefreshToken) {
        refreshTokenValue = storedRefreshToken;
        console.log(`Refresh token trouvé dans la clé: ${key} pour le rafraîchissement`);
        break;
      }
    }
    
    if (!refreshTokenValue) {
      console.warn('Aucun refresh token disponible pour le rafraîchissement');
      return { error: 'Aucun token de rafraîchissement disponible' };
    }
    
    console.log('Appel API pour rafraîchir le token...');
    try {
      // Construire l'URL correcte qui correspond exactement à celle utilisée dans services/api.ts
      const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;
      console.log(`URL de rafraîchissement utilisée: ${refreshUrl}`);
      
      // Utiliser le bon endpoint et format de payload
      const payload = { refreshToken: refreshTokenValue }; // Ce format correspond à RefreshTokenRequest.RefreshToken dans le backend
      console.log('Payload de la requête:', JSON.stringify(payload));
      
      console.log('Envoi de la requête avec les détails complets:');
      console.log('- URL:', refreshUrl);
      console.log('- Payload complet:', JSON.stringify(payload));
      
      const response = await axios.post<AuthResponse>(
        refreshUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 secondes de timeout
        }
      );
      
      console.log('Réponse de rafraîchissement reçue:');
      console.log('- Status:', response.status);
      console.log('- Headers:', JSON.stringify(response.headers));
      console.log('- Structure de la réponse:', 
                 'accessToken=' + (response.data.accessToken ? 'présent' : 'absent'), 
                 'refreshToken=' + (response.data.refreshToken ? 'présent' : 'absent'),
                 'user=' + (response.data.user ? 'présent' : 'absent'));
      
      // Sauvegarder les nouveaux tokens et le profil utilisateur
      if (response.data.accessToken && response.data.refreshToken) {
        await saveAuthData(response.data);
        console.log('Données d\'authentification sauvegardées avec succès');
      } else {
        console.error('Réponse incomplète du serveur lors du rafraîchissement du token');
        return { error: 'Réponse incomplète du serveur' };
      }
      
      return { data: response.data };
    } catch (apiError) {
      const statusCode = apiError.response?.status || 'Inconnu';
      const errorMessage = apiError.response?.data?.error || apiError.message || 'Erreur inconnue';
      console.error(`Erreur HTTP ${statusCode} lors du rafraîchissement du token: ${errorMessage}`);
      console.error('Détails complets de l\'erreur:', {
        message: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        headers: apiError.response?.headers
      });
      
      if (statusCode === 404) {
        return { error: 'L\'endpoint de rafraîchissement du token n\'existe pas' };
      } else if (statusCode === 401) {
        return { error: 'Le refresh token a été rejeté ou est expiré' };
      }
      
      return { error: errorMessage };
    }
  } catch (error) {
    console.error('Erreur générale lors du rafraîchissement du token:', error);
    return { 
      error: error.message || 'Une erreur est survenue lors du rafraîchissement du token'
    };
  }
};

/**
 * Déconnexion
 */
export const signOut = async (): Promise<void> => {
  try {
    // Récupérer le refresh token pour l'envoyer lors de la déconnexion au serveur
    let refreshTokenValue = null;
    const allRefreshTokenKeys = [REFRESH_TOKEN_KEY, ...ALTERNATIVE_REFRESH_TOKEN_KEYS];
    
    // Chercher le refresh token dans toutes les clés possibles
    for (const key of allRefreshTokenKeys) {
      const storedRefreshToken = await AsyncStorage.getItem(key);
      if (storedRefreshToken) {
        refreshTokenValue = storedRefreshToken;
        console.log(`Déconnexion: refresh token trouvé dans la clé ${key}`);
        break;
      }
    }
    
    // Si un refresh token est trouvé, faire un appel au backend pour l'invalider
    if (refreshTokenValue) {
      try {
        console.log('Envoi du refresh token au serveur pour déconnexion');
        await axios.post(`${API_BASE_URL}/api/auth/signout`, { refreshToken: refreshTokenValue });
        console.log('Déconnexion du serveur réussie avec refresh token');
      } catch (error) {
        console.error('Erreur lors de la déconnexion du serveur:', error);
        // Continuer même en cas d'erreur
      }
    } else {
      console.warn('Déconnexion sans refresh token - les sessions côté serveur ne seront pas nettoyées');
    }
  } catch (error) {
    console.error('Erreur lors de la préparation de la déconnexion:', error);
  } finally {
    // Toujours nettoyer le stockage local, même en cas d'erreur
    const keysToRemove = [
      ACCESS_TOKEN_KEY, 
      REFRESH_TOKEN_KEY, 
      USER_PROFILE_KEY, 
      'user',
      'lastLogin',
      'userProfile',
      ...ALTERNATIVE_ACCESS_TOKEN_KEYS,
      ...ALTERNATIVE_REFRESH_TOKEN_KEYS
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('Toutes les données d\'authentification ont été supprimées localement');
  }
};

/**
 * Vérifier si un utilisateur existe
 */
export const checkUserExists = async (emailOrPhone: string): Promise<ApiResponse<{ exists: boolean }>> => {
  try {
    const response = await axios.post<{ exists: boolean }>(
      `${API_BASE_URL}/api/auth/check-user`,
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
      `${API_BASE_URL}/api/auth/forgot-password`,
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
      `${API_BASE_URL}/api/auth/verify-code`,
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
      `${API_BASE_URL}/api/auth/reset-password`,
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
  try {
    // Essayer plusieurs clés de stockage possibles pour le token
    const possibleTokenKeys = [ACCESS_TOKEN_KEY, ...ALTERNATIVE_ACCESS_TOKEN_KEYS];
    let accessToken = null;
    
    for (const key of possibleTokenKeys) {
      const storedToken = await AsyncStorage.getItem(key);
      if (storedToken) {
        accessToken = storedToken;
        console.log(`Token d'accès trouvé dans la clé: ${key}`);
        break;
      }
    }
    
    if (!accessToken) {
      // Essayer de récupérer l'utilisateur et vérifier s'il est administrateur
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        console.log('Utilisateur trouvé dans le stockage, mais pas de token');
        
        // Tenter de rafraîchir le token si nous avons un refresh token
        // Vérifier toutes les clés possibles pour le refresh token
        let refreshToken = null;
        const allRefreshTokenKeys = [REFRESH_TOKEN_KEY, ...ALTERNATIVE_REFRESH_TOKEN_KEYS];
        
        for (const key of allRefreshTokenKeys) {
          const storedRefreshToken = await AsyncStorage.getItem(key);
          if (storedRefreshToken) {
            refreshToken = storedRefreshToken;
            console.log(`Refresh token trouvé dans la clé: ${key}`);
            
            // Synchroniser également les autres clés possibles pour éviter ce problème à l'avenir
            for (const otherKey of allRefreshTokenKeys) {
              if (otherKey !== key) {
                await AsyncStorage.setItem(otherKey, storedRefreshToken);
              }
            }
            
            break;
          }
        }
        
        if (refreshToken) {
          console.log('Tentative de rafraîchissement du token...');
          const refreshResult = await refreshTokenAndUpdate();
          if (refreshResult.success) {
            // Récupérer le nouveau token
            accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
            if (accessToken) {
              console.log('Token rafraîchi avec succès, utilisation du nouveau token');
              return {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              };
            }
          }
        } else {
          console.warn('Aucun refresh token trouvé dans le stockage');
        }
      }
      
      // Créer des en-têtes sans token pour les API publiques
      return {
        'Content-Type': 'application/json',
      };
    }
    
    // Si nous avons un token, l'inclure dans les en-têtes
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des en-têtes d\'authentification:', error);
    // Gestion silencieuse de l'erreur de récupération des en-têtes d'authentification
    // En cas d'erreur, retourner des en-têtes basiques sans arrêter le flux
    return {
      'Content-Type': 'application/json',
    };
  }
};

/**
 * Rafraîchir le token et mettre à jour le stockage
 */
export const refreshTokenAndUpdate = async (): Promise<{success: boolean}> => {
  try {
    // Vérifier toutes les clés possibles pour le refresh token
    let refreshTokenValue = null;
    const allRefreshTokenKeys = [REFRESH_TOKEN_KEY, ...ALTERNATIVE_REFRESH_TOKEN_KEYS];
    
    for (const key of allRefreshTokenKeys) {
      const storedRefreshToken = await AsyncStorage.getItem(key);
      if (storedRefreshToken) {
        refreshTokenValue = storedRefreshToken;
        console.log(`Refresh token trouvé dans la clé: ${key}`);
        
        // Synchroniser le refresh token dans toutes les clés possibles
        for (const otherKey of allRefreshTokenKeys) {
          if (otherKey !== key) {
            await AsyncStorage.setItem(otherKey, storedRefreshToken);
          }
        }
        
        break;
      }
    }
    
    if (!refreshTokenValue) {
      console.warn('Aucun refresh token disponible pour rafraîchir la session');
      return { success: false };
    }
    
    console.log('Tentative de rafraîchissement du token avec le refresh token...');
    
    // Appel direct à l'API sans passer par la fonction refreshToken
    // pour avoir plus de contrôle et de logs sur ce qui se passe
    try {
      // Construire l'URL correcte qui correspond exactement à celle utilisée dans services/api.ts
      const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;
      console.log(`URL de rafraîchissement utilisée dans refreshTokenAndUpdate: ${refreshUrl}`);
      
      const payload = { refreshToken: refreshTokenValue }; // RefreshTokenRequest.RefreshToken dans le backend
      console.log('Payload de la requête refreshTokenAndUpdate:', JSON.stringify(payload));
      
      const response = await axios.post<AuthResponse>(
        refreshUrl,
        payload
      );
      
      if (response.data) {
        console.log('Token rafraîchi avec succès depuis le serveur');
        
        // Sauvegarder les nouveaux tokens dans toutes les clés
        // Synchroniser le access token
        const allAccessTokenKeys = [ACCESS_TOKEN_KEY, ...ALTERNATIVE_ACCESS_TOKEN_KEYS];
        for (const key of allAccessTokenKeys) {
          await AsyncStorage.setItem(key, response.data.accessToken);
        }
        
        // Synchroniser le refresh token 
        for (const key of allRefreshTokenKeys) {
          await AsyncStorage.setItem(key, response.data.refreshToken);
        }
        
        // Sauvegarder également le profil utilisateur si présent
        if (response.data.user) {
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(response.data.user));
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        console.log('Token rafraîchi avec succès et synchronisé dans toutes les clés');
        return { success: true };
      } else {
        console.error('Réponse vide du serveur lors du rafraîchissement du token');
        return { success: false };
      }
    } catch (apiError) {
      const statusCode = apiError.response?.status || 'Inconnu';
      const errorMessage = apiError.response?.data?.error || apiError.message || 'Erreur inconnue';
      console.error(`Erreur HTTP ${statusCode} lors du rafraîchissement du token: ${errorMessage}`);
      
      if (statusCode === 404) {
        console.error('L\'endpoint de rafraîchissement du token n\'existe pas, vérifiez l\'URL');
      } else if (statusCode === 401) {
        console.error('Le refresh token a été rejeté ou est expiré');
        // Nettoyer les données d'authentification expirées
        await signOut();
      }
      
      return { success: false };
    }
  } catch (error) {
    console.error('Exception lors du rafraîchissement du token:', error);
    return { success: false };
  }
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
 * Télécharger et définir une photo de profil
 */
export const uploadProfilePicture = async (imageUri: string): Promise<ApiResponse<{url: string}>> => {
  try {
    const headers = await getAuthHeaders();
    
    // Créer un objet FormData pour envoyer le fichier
    const formData = new FormData();
    
    // Extraire le nom du fichier et le type MIME
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // Ajouter le fichier au formulaire
    formData.append('image', {
      uri: imageUri,
      name: `profile-picture.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    
    // Spécifier le type d'image
    formData.append('type', 'profilePicture');
    
    console.log('[API] Téléchargement de la photo de profil');
    
    // Utiliser le nouvel endpoint d'upload
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/upload`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors du téléchargement de la photo de profil:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors du téléchargement de la photo de profil'
    };
  }
};

/**
 * Télécharger et définir un avatar
 */
export const uploadAvatar = async (imageUri: string): Promise<ApiResponse<{url: string}>> => {
  try {
    const headers = await getAuthHeaders();
    
    // Créer un objet FormData pour envoyer le fichier
    const formData = new FormData();
    
    // Extraire le nom du fichier et le type MIME
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // Ajouter le fichier au formulaire
    formData.append('image', {
      uri: imageUri,
      name: `avatar.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    
    // Spécifier le type d'image
    formData.append('type', 'avatar');
    
    console.log('[API] Téléchargement de l\'avatar');
    
    // Utiliser le nouvel endpoint d'upload
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/upload`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'avatar:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors du téléchargement de l\'avatar'
    };
  }
};

/**
 * Sauvegarder les données d'authentification
 */
const saveAuthData = async (authData: AuthResponse): Promise<void> => {
  const promises = [];
  
  // Sauvegarder le token d'accès dans toutes les clés possibles
  const allAccessTokenKeys = [ACCESS_TOKEN_KEY, ...ALTERNATIVE_ACCESS_TOKEN_KEYS];
  for (const key of allAccessTokenKeys) {
    promises.push(AsyncStorage.setItem(key, authData.accessToken));
  }
  
  // Sauvegarder le token de rafraîchissement dans toutes les clés possibles
  const allRefreshTokenKeys = [REFRESH_TOKEN_KEY, ...ALTERNATIVE_REFRESH_TOKEN_KEYS];
  for (const key of allRefreshTokenKeys) {
    promises.push(AsyncStorage.setItem(key, authData.refreshToken));
  }
  
  // Sauvegarder le profil utilisateur
  promises.push(AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(authData.user)));
  
  // Sauvegarder également l'utilisateur dans la clé 'user' utilisée par AuthContext
  promises.push(AsyncStorage.setItem('user', JSON.stringify(authData.user)));
  
  await Promise.all(promises);
  console.log('Données d\'authentification sauvegardées et synchronisées dans toutes les clés');
};