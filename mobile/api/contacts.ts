import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, refreshTokenAndUpdate } from './auth';
import { ApiResponse } from './types';
import api from '../services/api';

// Interface pour les contacts suggérés de l'application
export interface AppContact {
  id: string;
  name: string;
  username: string;
  phoneNumber?: string;
  email?: string;
  avatar: string;
  isInApp: boolean;
  hasStory?: boolean;
  birthday?: {
    day: number;
    month: number;
    age: number;
  };
}

export interface StoryMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  timestamp: number | string | Date;
}

export interface Story {
  id: string;
  media: StoryMedia[];
  timestamp: number | string | Date;
  viewed: boolean;
}

export interface Friend extends AppContact {
  stories?: Story[];
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
  requestDate: string;
}

/**
 * Récupérer les utilisateurs qui matchent avec les contacts du téléphone
 */
export const findContactsOnApp = async (phoneNumbers: string[]): Promise<ApiResponse<AppContact[]>> => {
  try {
    // Vérifier si le token existe avant de faire l'appel API
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      // Retourner un tableau vide sans erreur si pas de token
      return { data: [] };
    }
    
    const headers = await getAuthHeaders();
    
    // Appel API réel
    const response = await axios.post<{ contacts: AppContact[] }>(
      `${API_BASE_URL}/api/users/find-contacts`,
      { phoneNumbers },
      { headers }
    );
    
    return { data: response.data.contacts };
  } catch (error) {
    // Erreur silencieuse pour éviter des logs dans la console
    return { 
      data: [] // Retourne un tableau vide au lieu d'une erreur
    };
  }
};

/**
 * Ajouter des amis à partir des contacts
 */
export const addFriendsFromContacts = async (userIds: string[]): Promise<ApiResponse<void>> => {
  try {
    // Vérifier si nous avons un token valide
    const token = await AsyncStorage.getItem('accessToken');
    
    // Si pas de token, continuer silencieusement
    if (!token) {
      return {};
    }
    
    // Vérifier si nous sommes dans le processus d'inscription
    const user = await AsyncStorage.getItem('user');
    
    // Si nous sommes dans le flux d'inscription sans user stocké,
    // retourner un succès silencieux
    if (!user) {
      return {};
    }
    
    // Pour les utilisateurs connectés, tenter l'appel API réel
    try {
      const headers = await getAuthHeaders();
      
      await axios.post(
        `${API_BASE_URL}/api/friends/add-multiple`,
        { userIds },
        { headers }
      );
      
      return {};
    } catch (apiError) {
      // Si erreur 401 ou 404, retourner silencieusement un succès
      if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 404)) {
        return {};
      }
      // Pour toute autre erreur, ne pas la propager pour éviter les plantages
      return {};
    }
  } catch (error) {
    // Toujours retourner un succès silencieux
    return {};
  }
};

/**
 * Récupérer les amis de l'utilisateur
 */
export const getUserFriends = async (): Promise<ApiResponse<Friend[]>> => {
  try {
    // Essayer d'abord de rafraîchir le token
    try {
      await refreshTokenAndUpdate();
    } catch (refreshError) {
      console.log('Échec du rafraîchissement du token avant récupération des amis');
    }
    
    // Utiliser l'instance API qui gère le rafraîchissement automatique des tokens
    const response = await api.get<{ friends: Friend[] }>('/api/friends');
    
    console.log('API FRIENDS RESPONSE:', response.data.friends ? `${response.data.friends.length} amis trouvés` : "Pas d'amis");
    
    return { data: response.data.friends || [] };
  } catch (error) {
    console.error('ERREUR RÉCUPÉRATION AMIS:', error);
    // Gestion silencieuse de l'erreur
    return { 
      data: [], // Retourner un tableau vide au lieu d'une erreur pour éviter les problèmes d'UI
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération des amis'
    };
  }
};

/**
 * Récupérer les demandes d'amis en attente
 */
export const getFriendRequests = async (): Promise<ApiResponse<FriendRequest[]>> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.get<{ requests: FriendRequest[] }>(
      `${API_BASE_URL}/api/friends/requests`,
      { headers }
    );
    
    return { data: response.data.requests };
  } catch (error) {
    // Gestion silencieuse de l'erreur
    return { 
      data: [], // Retourner un tableau vide au lieu d'une erreur
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération des demandes d\'amis'
    };
  }
};

/**
 * Envoyer une demande d'ami
 */
export const sendFriendRequest = async (userId: string): Promise<ApiResponse<void>> => {
  try {
    // Valider l'ID utilisateur
    if (!userId || userId.trim() === '') {
      return { error: 'Identifiant utilisateur invalide' };
    }
    
    // Tenter d'abord de rafraîchir le token pour éviter les 401
    try {
      await refreshTokenAndUpdate();
    } catch (refreshError) {
      console.log('Échec du rafraîchissement de token lors de l\'envoi de la demande d\'ami');
    }
    
    console.log(`📤 ENVOI D'UNE DEMANDE D'AMI À ${userId} VIA API`);
    
    try {
      // Utiliser l'instance API qui gère le rafraîchissement automatique des tokens
      await api.post(
        '/api/friends/request',
        { recipientId: userId }
      );
      
      console.log('✅ DEMANDE ENVOYÉE AVEC SUCCÈS VIA API');
      
      // Synchroniser avec le stockage local pour assurer la cohérence
      await saveSentFriendRequest(userId);
      
      return {};
    } catch (apiError) {
      console.log('⚠️ ERREUR API LORS DE L\'ENVOI:', apiError.response?.status || apiError.message);
      
      // Si l'erreur concerne une demande déjà envoyée, ajouter au stockage local
      // pour que l'interface reflète correctement l'état
      if (apiError.response?.data?.message?.includes('already') || 
          apiError.response?.data?.error?.includes('already') ||
          apiError.response?.data?.message?.includes('déjà') || 
          apiError.response?.data?.error?.includes('déjà')) {
        
        console.log('ℹ️ DEMANDE DÉJÀ ENVOYÉE, MISE À JOUR DU STOCKAGE LOCAL');
        await saveSentFriendRequest(userId);
        
        return { 
          error: 'Une demande d\'ami a déjà été envoyée à cet utilisateur'
        };
      }
      
      // Pour les autres erreurs, les propager normalement
      throw apiError;
    }
  } catch (error) {
    console.log('❌ ERREUR LORS DE L\'ENVOI DE LA DEMANDE D\'AMI:', error);
    
    // Messages d'erreur adaptés selon le type d'erreur
    if (error.response?.status === 401) {
      return { error: 'Vous devez être connecté pour envoyer une demande d\'ami' };
    } else if (error.response?.status === 404) {
      return { error: 'Utilisateur introuvable' };
    } else if (error.response?.data?.error?.includes('déjà ami') || 
               error.response?.data?.error?.includes('already friend')) {
      // S'ils sont déjà amis, on assure que ce soit reflété côté client
      return { error: 'Vous êtes déjà ami avec cet utilisateur' };
    } else {
      return { 
        error: error.response?.data?.error || 'Une erreur est survenue lors de l\'envoi de la demande d\'ami'
      };
    }
  }
};

/**
 * Annuler une demande d'ami envoyée
 */
export const cancelFriendRequest = async (userId: string): Promise<ApiResponse<void>> => {
  try {
    // Valider l'ID utilisateur
    if (!userId || userId.trim() === '') {
      return { error: 'Identifiant utilisateur invalide' };
    }
    
    // Tenter d'abord de rafraîchir le token pour éviter les 401
    try {
      await refreshTokenAndUpdate();
    } catch (refreshError) {
      console.log('Échec du rafraîchissement de token lors de l\'annulation de la demande d\'ami');
    }
    
    console.log(`📤 TENTATIVE D'ANNULATION DE LA DEMANDE D'AMI POUR ${userId} VIA API`);
    
    try {
      // Utiliser l'instance API qui gère le rafraîchissement automatique des tokens
      await api.post(
        '/api/friends/cancel-request',
        { recipientId: userId }
      );
      
      console.log('✅ ANNULATION RÉUSSIE VIA API');
      
      // Supprimer également la demande du stockage local pour synchronisation
      await removeSentFriendRequest(userId);
      
      return {};
    } catch (apiError) {
      console.log('⚠️ ERREUR API LORS DE L\'ANNULATION:', apiError.response?.status || apiError.message);
      
      // Si l'endpoint n'existe pas encore (404), utiliser le fallback local
      if (apiError.response?.status === 404) {
        console.log('⚠️ ENDPOINT CANCEL-REQUEST NON TROUVÉ (404), UTILISATION DU FALLBACK LOCAL');
        await removeSentFriendRequest(userId);
        return { }; // Succès simulé
      }
      
      // Si la demande n'existe pas (déjà annulée), gérer aussi comme un succès
      if (apiError.response?.status === 404 || 
          (apiError.response?.data?.error && 
           (apiError.response.data.error.includes('introuvable') || 
            apiError.response.data.error.includes('not found')))) {
        console.log('ℹ️ DEMANDE DÉJÀ ANNULÉE OU INTROUVABLE');
        await removeSentFriendRequest(userId);
        return { }; // Succès
      }
      
      // Pour les autres erreurs, propager normalement
      throw apiError;
    }
  } catch (error) {
    console.log('❌ ERREUR LORS DE L\'ANNULATION DE LA DEMANDE D\'AMI:', error);
    
    // Dernière tentative: si tout a échoué, au moins nettoyer le stockage local
    try {
      await removeSentFriendRequest(userId);
      console.log('ℹ️ STOCKAGE LOCAL NETTOYÉ MALGRÉ L\'ERREUR');
    } catch (storageError) {
      console.log('❌ ÉCHEC DE LA SUPPRESSION LOCALE:', storageError);
    }
    
    // Message d'erreur utilisateur approprié
    if (error.response?.status === 401) {
      return { error: 'Vous devez être connecté pour effectuer cette action' };
    } else if (error.response?.status === 404) {
      return { error: 'Aucune demande d\'ami à annuler pour cet utilisateur' };
    } else {
      return { 
        error: error.response?.data?.error || 'Une erreur est survenue lors de l\'annulation de la demande d\'ami'
      };
    }
  }
};

/**
 * Récupérer les demandes d'amis envoyées (en attente)
 * 
 * Utilise l'endpoint backend /api/friends/sent-requests pour récupérer les demandes envoyées
 * avec une solution de fallback sur le stockage local au cas où l'endpoint n'est pas disponible
 */
export const getSentFriendRequests = async (): Promise<ApiResponse<string[]>> => {
  try {
    // Tenter d'abord de rafraîchir le token pour éviter les 401
    try {
      await refreshTokenAndUpdate();
    } catch (refreshError) {
      console.log('Échec du rafraîchissement de token');
    }
    
    // Utiliser l'API backend pour récupérer les demandes envoyées
    try {
      console.log('🔍 RÉCUPÉRATION DES DEMANDES ENVOYÉES DEPUIS LE BACKEND');
      
      // Essayer d'utiliser directement axios au lieu de l'instance API
      // pour avoir plus de contrôle sur l'erreur en cas de 404
      const headers = await getAuthHeaders();
      const url = `${API_BASE_URL}/api/friends/sent-requests`;
      
      console.log(`📡 TENTATIVE DIRECTE: ${url}`);
      const response = await axios.get<{ sentRequests: string[] }>(url, { headers });
      
      if (response.data && response.data.sentRequests && Array.isArray(response.data.sentRequests)) {
        console.log(`✅ ${response.data.sentRequests.length} DEMANDES ENVOYÉES VIA API: ${response.data.sentRequests.join(', ')}`);
        
        // Mettre à jour le stockage local pour synchronisation
        await AsyncStorage.setItem('sent_friend_requests', JSON.stringify(response.data.sentRequests));
        
        return { data: response.data.sentRequests };
      } else {
        console.log('⚠️ RÉPONSE API INVALIDE POUR LES DEMANDES ENVOYÉES');
      }
    } catch (apiError) {
      console.log(`⚠️ ENDPOINT API NON DISPONIBLE (${apiError.response?.status || 'ERROR'}), UTILISATION DU STOCKAGE LOCAL:`, 
        apiError.response?.status === 404 ? '404 NOT FOUND' : apiError.message);
      
      // Si c'est une erreur 404, essayer avec un URL différent (sans le 's' final)
      if (apiError.response?.status === 404) {
        try {
          console.log('🔄 TENTATIVE AVEC URL ALTERNATIF (sans le "s" final)');
          const headers = await getAuthHeaders();
          const altUrl = `${API_BASE_URL}/api/friends/sent-request`; // Sans le 's' final
          
          const altResponse = await axios.get<{ sentRequests: string[] }>(altUrl, { headers });
          
          if (altResponse.data && altResponse.data.sentRequests && Array.isArray(altResponse.data.sentRequests)) {
            console.log(`✅ ${altResponse.data.sentRequests.length} DEMANDES ENVOYÉES VIA API ALTERNATIVE: ${altResponse.data.sentRequests.join(', ')}`);
            
            await AsyncStorage.setItem('sent_friend_requests', JSON.stringify(altResponse.data.sentRequests));
            return { data: altResponse.data.sentRequests };
          }
        } catch (altError) {
          console.log('❌ ÉCHEC DE LA TENTATIVE ALTERNATIVE:', altError.response?.status || altError.message);
        }
      }
      
      // Si l'API n'est pas disponible, utiliser le stockage local comme fallback
      try {
        const storedRequestsJson = await AsyncStorage.getItem('sent_friend_requests');
        if (storedRequestsJson) {
          console.log('📣 FALLBACK: DEMANDES ENVOYÉES TROUVÉES DANS LE STOCKAGE LOCAL');
          const storedRequests = JSON.parse(storedRequestsJson);
          if (Array.isArray(storedRequests)) {
            console.log(`📣 DEMANDES ENVOYÉES (STOCKAGE LOCAL): ${storedRequests.length} demandes: ${storedRequests.join(', ')}`);
            return { data: storedRequests };
          }
        } else {
          console.log('⚠️ AUCUNE DEMANDE ENVOYÉE TROUVÉE DANS LE STOCKAGE LOCAL');
        }
      } catch (storageError) {
        console.log('Erreur lors de la récupération des demandes envoyées depuis le stockage:', storageError);
      }
    }
    
    // Si pas de données du backend ni en cache, retourner un tableau vide
    return { data: [] };
  } catch (error) {
    console.log('Erreur lors de la récupération des demandes envoyées:', error);
    return { 
      data: [], 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération des demandes envoyées'
    };
  }
};

/**
 * Sauvegarder une demande d'ami envoyée dans le stockage local
 * 
 * Utilisé pour synchroniser l'état local avec le backend et assurer la cohérence
 * lorsque le backend n'est pas disponible ou que la demande a été créée localement.
 */
export const saveSentFriendRequest = async (userId: string): Promise<void> => {
  try {
    console.log(`📝 SYNCHRONISATION LOCALE: AJOUT DE LA DEMANDE ${userId}`);
    
    // Récupérer les demandes existantes
    const storedRequestsJson = await AsyncStorage.getItem('sent_friend_requests');
    let sentRequests: string[] = [];
    
    if (storedRequestsJson) {
      const storedRequests = JSON.parse(storedRequestsJson);
      if (Array.isArray(storedRequests)) {
        sentRequests = storedRequests;
      }
    }
    
    // Ajouter la nouvelle demande si elle n'existe pas déjà
    if (!sentRequests.includes(userId)) {
      sentRequests.push(userId);
      await AsyncStorage.setItem('sent_friend_requests', JSON.stringify(sentRequests));
      console.log(`✅ DEMANDE ${userId} AJOUTÉE AU STOCKAGE LOCAL`);
    } else {
      console.log(`ℹ️ DEMANDE ${userId} DÉJÀ PRÉSENTE DANS LE STOCKAGE LOCAL`);
    }
  } catch (error) {
    console.error('❌ ERREUR LORS DE LA SAUVEGARDE DE LA DEMANDE:', error);
  }
};

/**
 * Supprimer une demande d'ami envoyée du stockage local
 * 
 * Utilisé pour synchroniser l'état local avec le backend et assurer la cohérence
 * lorsque le backend n'est pas disponible ou que la demande a été annulée localement.
 */
export const removeSentFriendRequest = async (userId: string): Promise<void> => {
  try {
    console.log(`📝 SYNCHRONISATION LOCALE: SUPPRESSION DE LA DEMANDE ${userId}`);
    
    // Récupérer les demandes existantes
    const storedRequestsJson = await AsyncStorage.getItem('sent_friend_requests');
    let sentRequests: string[] = [];
    
    if (storedRequestsJson) {
      const storedRequests = JSON.parse(storedRequestsJson);
      if (Array.isArray(storedRequests)) {
        const initialCount = storedRequests.length;
        sentRequests = storedRequests.filter(id => id !== userId);
        
        // Vérifier si la demande a été trouvée et supprimée
        if (initialCount !== sentRequests.length) {
          console.log(`✅ DEMANDE ${userId} SUPPRIMÉE DU STOCKAGE LOCAL`);
        } else {
          console.log(`ℹ️ DEMANDE ${userId} NON TROUVÉE DANS LE STOCKAGE LOCAL`);
        }
        
        await AsyncStorage.setItem('sent_friend_requests', JSON.stringify(sentRequests));
      }
    } else {
      console.log('ℹ️ AUCUNE DEMANDE DANS LE STOCKAGE LOCAL');
    }
  } catch (error) {
    console.error('❌ ERREUR LORS DE LA SUPPRESSION DE LA DEMANDE:', error);
  }
};

/**
 * Accepter une demande d'ami
 */
export const acceptFriendRequest = async (requestId: string): Promise<ApiResponse<void>> => {
  try {
    const headers = await getAuthHeaders();
    
    await axios.post(
      `${API_BASE_URL}/api/friends/accept`,
      { requestId },
      { headers }
    );
    
    return {};
  } catch (error) {
    // Gestion silencieuse de l'erreur
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de l\'acceptation de la demande d\'ami'
    };
  }
};

/**
 * Rejeter une demande d'ami
 */
export const rejectFriendRequest = async (requestId: string): Promise<ApiResponse<void>> => {
  try {
    const headers = await getAuthHeaders();
    
    await axios.post(
      `${API_BASE_URL}/api/friends/reject`,
      { requestId },
      { headers }
    );
    
    return {};
  } catch (error) {
    // Gestion silencieuse de l'erreur
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors du refus de la demande d\'ami'
    };
  }
};

/**
 * Rechercher des utilisateurs
 * @param query La requête de recherche
 */
export const searchUsers = async (query: string): Promise<ApiResponse<AppContact[]>> => {
  try {
    // Vérifier si la requête est vide
    if (!query || query.trim() === '') {
      return getSuggestedUsers(); // Utiliser les suggestions si la requête est vide
    }
    
    // Tenter d'abord de rafraîchir le token pour éviter les 401
    try {
      await refreshTokenAndUpdate();
    } catch (refreshError) {
      console.log('Échec du rafraîchissement de token lors de la recherche');
    }
    
    console.log('⚠️ RECHERCHE LANCÉE AVEC TYPE=ALL POUR INCLURE TOUS LES UTILISATEURS ⚠️');
    
    // CRUCIAL: Utiliser l'instance API avec le type=all & includeAll=true pour inclure TOUS les utilisateurs
    // Le paramètre type=all ET includeAll=true sont essentiels - ils indiquent au backend de renvoyer TOUS les types d'utilisateurs
    try {
      console.log(`⚠️ REQUEST URL AVEC PARAMS CLÉS: /api/users/search?q=${encodeURIComponent(query)}&type=all&includeAll=true&includeFriends=true&includePending=true ⚠️`);
      const response = await api.get<{ users: AppContact[] }>(
        `/api/users/search?q=${encodeURIComponent(query)}&type=all&includeAll=true&includeFriends=true&includePending=true`
      );
      
      console.log('API SEARCH RESPONSE URL:', `/api/users/search?q=${encodeURIComponent(query)}&type=all&includeAll=true&includeFriends=true&includePending=true`);
      console.log('API SEARCH RESPONSE USERS:', response.data.users ? `${response.data.users.length} utilisateurs trouvés` : 'Aucun utilisateur');
      
      if (!response.data.users || response.data.users.length === 0) {
        console.log('⚠️ AUCUN UTILISATEUR RETOURNÉ PAR L\'API ⚠️');
      } else {
        // Afficher tous les utilisateurs trouvés pour le debug
        response.data.users.forEach(user => {
          console.log(`API USER: ${user.name || 'Sans nom'} (${user.id})`);
        });
      }
      
      // NE PAS FILTRER DU TOUT - INCLURE TOUS LES UTILISATEURS SANS EXCEPTION
      console.log("AUCUN FILTRAGE - TOUS LES UTILISATEURS SONT INCLUS");
      const filteredUsers = response.data.users || [];
      
      // Log pour vérifier que tous les utilisateurs sont bien présents
      filteredUsers.forEach(user => {
        console.log(`INCLUS: ${user.name || 'Sans nom'} (${user.id}) - isInApp=${user.isInApp}`);
      });
      
      console.log(`FILTRAGE TERMINÉ: ${filteredUsers.length} utilisateurs après filtrage`);
      
      // S'assurer que chaque utilisateur a un avatar et un nom valides
      const usersWithAvatars = filteredUsers.map(user => {
        // Créer un objet de base avec toutes les propriétés de l'utilisateur
        const processedUser = {
          ...user,
        };
        
        // Garantir un nom valide pour l'affichage et la génération d'avatar
        if (!user.name || user.name.trim() === '') {
          // Utiliser le nom d'utilisateur ou l'email comme nom de substitution
          processedUser.name = user.username || 'Utilisateur';
        }
        
        // Garantir un avatar valide
        if (!user.avatar || user.avatar.trim() === '' || user.avatar === 'null' || user.avatar === 'undefined') {
          processedUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(processedUser.name)}&background=random&color=fff`;
        }
        
        return processedUser;
      });
      
      console.log(`RÉSULTAT FINAL: ${usersWithAvatars.length} utilisateurs à afficher`);
      return { data: usersWithAvatars };
    } catch (apiError) {
      console.error('ERREUR API SEARCH:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.log('Erreur globale lors de la recherche d\'utilisateurs:', error);
    return { 
      data: [], // Retourner un tableau vide en cas d'erreur
      error: error.response?.data?.error || 'Une erreur est survenue lors de la recherche d\'utilisateurs'
    };
  }
};

/**
 * Obtenir des suggestions d'utilisateurs (utilisé quand aucun critère de recherche n'est fourni)
 * Comme le backend n'a pas d'endpoint dédié pour les suggestions, on utilise plusieurs lettres
 * communes pour obtenir un maximum de résultats et les combine.
 */
export const getSuggestedUsers = async (): Promise<ApiResponse<AppContact[]>> => {
  try {
    // Tenter d'abord de rafraîchir le token pour éviter les 401
    try {
      await refreshTokenAndUpdate();
      console.log('Token rafraîchi avant de récupérer les suggestions');
    } catch (refreshError) {
      console.log('Échec du rafraîchissement de token');
    }
    
    // Utiliser plusieurs caractères communs pour rechercher des utilisateurs
    const commonLetters = ['a', 'e', 's', 'i', 'm'];
    const allUsers: AppContact[] = [];
    const seenIds = new Set<string>();
    
    // CRUCIAL: Utiliser type=all ET includeAll=true pour obtenir TOUS les utilisateurs sans exception
    // Faire plusieurs requêtes en parallèle pour obtenir plus de suggestions
    // Utiliser api de services/api.ts qui gère déjà le rafraîchissement automatique des tokens
    const requests = commonLetters.map(letter => 
      api.get<{ users: AppContact[] }>(
        `/api/users/search?q=${letter}&type=all&includeAll=true&includeFriends=true&includePending=true`
      ).catch(() => ({ data: { users: [] } })) // Ignorer les erreurs individuelles
    );
    
    console.log('API SUGGESTION SEARCH URLS MODIFIÉES:', commonLetters.map(l => `/api/users/search?q=${l}&type=all&includeAll=true&includeFriends=true&includePending=true`));
    
    // Attendre que toutes les requêtes soient terminées
    const responses = await Promise.all(requests);
    
    // Combiner les résultats en évitant les doublons
    for (const response of responses) {
      const users = response.data.users || [];
      for (const user of users) {
        // Vérifier si l'utilisateur est déjà dans les résultats
        if (!seenIds.has(user.id)) {
          // NE PLUS FILTRER LES COMPTES GÉRÉS - INCLURE TOUS LES UTILISATEURS
          // Ancien filtre désactivé: if (user.isInApp === false) continue;
          
          seenIds.add(user.id);
          console.log(`SUGGESTION INCLUSE: ${user.name || 'Sans nom'} (${user.id}) - isInApp=${user.isInApp}`);
          
          // Créer un objet utilisateur avec des valeurs valides garanties
          const processedUser = {
            ...user,
            // Garantir un nom valide
            name: (!user.name || user.name.trim() === '') ? (user.username || 'Utilisateur') : user.name,
            // Garantir un avatar valide
            avatar: (!user.avatar || user.avatar.trim() === '' || user.avatar === 'null' || user.avatar === 'undefined')
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(!user.name || user.name.trim() === '' ? (user.username || 'User') : user.name)}&background=random&color=fff`
              : user.avatar
          };
          
          allUsers.push(processedUser);
        }
      }
    }
    
    // Limiter à 15 suggestions maximum pour éviter de surcharger l'UI
    // et mélanger les résultats pour varier les suggestions
    const shuffled = allUsers.sort(() => 0.5 - Math.random());
    
    return { data: shuffled.slice(0, 15) };
  } catch (error) {
    // Gestion silencieuse de l'erreur
    console.log('Erreur lors de la récupération des suggestions:', error);
    return { 
      data: [], // Retourner un tableau vide en cas d'erreur
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération des suggestions'
    };
  }
};

/**
 * Récupérer les stories des amis
 */
export const getFriendStories = async (): Promise<ApiResponse<Friend[]>> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.get<{ friends: Friend[] }>(
      `${API_BASE_URL}/api/stories/friends`,
      { headers }
    );
    
    return { data: response.data.friends };
  } catch (error) {
    // Gestion silencieuse de l'erreur
    return { 
      data: [], // Retourner un tableau vide au lieu d'une erreur
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération des stories des amis'
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
      `${API_BASE_URL}/api/stories/view`,
      { storyId },
      { headers }
    );
    
    return {};
  } catch (error) {
    // Gestion silencieuse de l'erreur
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors du marquage de la story comme vue'
    };
  }
};

/**
 * Créer une nouvelle story
 */
export const createStory = async (mediaUrl: string, mediaType: 'image' | 'video'): Promise<ApiResponse<Story>> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await axios.post<{ story: Story }>(
      `${API_BASE_URL}/api/stories`,
      { 
        mediaUrl,
        mediaType
      },
      { headers }
    );
    
    return { data: response.data.story };
  } catch (error) {
    // Gestion silencieuse de l'erreur
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la création de la story'
    };
  }
};