import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ApiResponse, User } from './types';
import { getAuthHeaders } from './auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Récupérer le profil de l'utilisateur courant
 */
export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  try {
    // Vérifier si l'utilisateur est en cache
    const userJson = await AsyncStorage.getItem('user');
    let userData: User | null = null;
    
    if (userJson) {
      try {
        userData = JSON.parse(userJson);
      } catch (parseError) {
        // Si le JSON est invalide, on continue sans utiliser le cache
      }
    }
    
    // Essayer de récupérer les données fraîches depuis l'API
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<User>(
        `${API_BASE_URL}/api/users/me`,
        { 
          headers,
          timeout: 5000
        }
      );
      
      // Si la réponse API est valide, mettre à jour le cache et retourner
      if (response.data) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        return { data: response.data };
      }
    } catch (apiError) {
      // Silencieux - nous utiliserons le cache si disponible
    }
    
    // Si nous avons des données en cache, les utiliser
    if (userData) {
      return { data: userData };
    }
    
    // Aucune donnée disponible (ni API, ni cache)
    return { 
      data: {
        id: 'temp-user',
        firstName: 'Utilisateur',
        lastName: '',
        isVerified: false,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User 
    };
  } catch (error) {
    // En cas d'erreur générale, retourner un utilisateur par défaut
    return { 
      data: {
        id: 'temp-user',
        firstName: 'Utilisateur',
        lastName: '',
        isVerified: false,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User
    };
  }
};

/**
 * Mettre à jour le profil de l'utilisateur
 */
export const updateUserProfile = async (updates: {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  avatarUrl?: string;
}): Promise<ApiResponse<User>> => {
  try {
    const headers = await getAuthHeaders();
    console.log("[API] Mise à jour du profil utilisateur");
    const response = await axios.put<User>(
      `${API_BASE_URL}/api/users/me`,
      updates,
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    let errorMessage = 'Une erreur est survenue lors de la mise à jour du profil';
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    return { error: errorMessage };
  }
};

/**
 * Mettre à jour spécifiquement le nom d'utilisateur
 */
export const updateUsername = async (username: string): Promise<ApiResponse<{ username: string }>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Mise à jour du nom d'utilisateur vers: ${username}`);
    const response = await axios.put<{ username: string }>(
      `${API_BASE_URL}/api/users/me/username`, // Endpoint spécifique pour le username
      { username }, // Envoyer uniquement le nouveau username
      { headers }
    );

    // Mettre à jour le cache utilisateur local si nécessaire (ou laisser le contexte s'en charger)
    // const userJson = await AsyncStorage.getItem('user');
    // if (userJson) {
    //   const userData = JSON.parse(userJson);
    //   userData.username = response.data.username; // Assurez-vous que le type User inclut username
    //   await AsyncStorage.setItem('user', JSON.stringify(userData));
    // }

    return { data: response.data };
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du nom d\'utilisateur:', error);
    // Essayer de retourner un message d'erreur plus spécifique du backend
    let errorMessage = 'Une erreur est survenue lors de la mise à jour du nom d\'utilisateur';
    if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.response?.data?.message || errorMessage;
    }
    return { error: errorMessage };
  }
};

/**
 * Récupérer le solde du portefeuille de l'utilisateur
 */
export const getUserBalance = async (): Promise<ApiResponse<{balance: number}>> => {
  try {
    // Vérifier si le solde est en cache
    const balanceCacheKey = 'user_balance';
    const cachedBalanceJson = await AsyncStorage.getItem(balanceCacheKey);
    let cachedBalance = 0;
    
    if (cachedBalanceJson) {
      try {
        const parsed = JSON.parse(cachedBalanceJson);
        cachedBalance = parsed.balance || 0;
      } catch {
        // Silencieux - échec du parsing
      }
    }
    
    // Tenter de récupérer le solde frais depuis l'API
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{balance: number}>(
        `${API_BASE_URL}/api/users/me/balance`,
        { 
          headers,
          timeout: 5000
        }
      );
      
      // Mettre à jour le cache et retourner les nouvelles données
      if (response.data && typeof response.data.balance === 'number') {
        await AsyncStorage.setItem(balanceCacheKey, JSON.stringify(response.data));
        return { data: response.data };
      }
    } catch {
      // Silencieux - utiliser le cache
    }
    
    // Si les données API ne sont pas disponibles, utiliser le cache
    return { data: { balance: cachedBalance } };
  } catch {
    // En cas d'erreur générale, retourner un solde à 0
    return { data: { balance: 0 } };
  }
};

/**
 * Ajouter des fonds au portefeuille de l'utilisateur
 */
export const addFunds = async (amount: number): Promise<ApiResponse<{balance: number}>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Ajout de ${amount} au portefeuille`);
    const response = await axios.post<{balance: number}>(
      `${API_BASE_URL}/api/users/me/balance/add`,
      { amount },
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de l\'ajout de fonds:', error);
    let errorMessage = 'Une erreur est survenue lors de l\'ajout de fonds';
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    return { error: errorMessage };
  }
};

/**
 * Transférer des fonds à un autre utilisateur ou compte géré
 */
export const transferFunds = async (amount: number, recipientId: string, isManagedAccount: boolean = false): Promise<ApiResponse<{balance: number}>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Transfert de ${amount} à ${recipientId}`);
    const response = await axios.post<{balance: number}>(
      `${API_BASE_URL}/api/users/me/balance/transfer`,
      { 
        amount,
        recipientId,
        isManagedAccount 
      },
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors du transfert de fonds:', error);
    let errorMessage = 'Une erreur est survenue lors du transfert de fonds';
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    return { error: errorMessage };
  }
};

/**
 * Récupérer l'historique des transactions
 */
// Interface pour les transactions
interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
  createdAt: string;
}

export const getTransactionHistory = async (limit: number = 10, offset: number = 0): Promise<ApiResponse<{
  transactions: Transaction[];
  total: number;
}>> => {
  const transactionsCacheKey = `transactions_${offset}_${limit}`;

  try {
    // Essayer de récupérer depuis le cache d'abord
    const cachedTransactionsJson = await AsyncStorage.getItem(transactionsCacheKey);
    let cachedTransactions = null;
    
    if (cachedTransactionsJson) {
      try {
        cachedTransactions = JSON.parse(cachedTransactionsJson);
        console.log("[API] Utilisation des transactions depuis le cache");
      } catch (parseError) {
        // Silencieux - échec de parsing du cache
      }
    }
    
    // Tenter de récupérer les transactions fraîches depuis l'API
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get<{
        transactions: Transaction[];
        total: number;
      }>(
        `${API_BASE_URL}/api/users/me/transactions?limit=${limit}&offset=${offset}`,
        { 
          headers,
          timeout: 5000 // Timeout pour éviter que l'app attende trop longtemps
        }
      );
      
      // Mettre à jour le cache et retourner les nouvelles données
      if (response.data && Array.isArray(response.data.transactions)) {
        await AsyncStorage.setItem(transactionsCacheKey, JSON.stringify(response.data));
        return { data: response.data };
      }
    } catch (apiError) {
      // Silencieux - nous allons utiliser le cache
    }
    
    // Si on a des transactions en cache, les utiliser
    if (cachedTransactions && cachedTransactions.transactions) {
      return { data: cachedTransactions };
    }
    
    // Si pas de cache et API échoue, retourner un tableau vide
    return { 
      data: { 
        transactions: [],
        total: 0
      }
    };
  } catch (error) {
    // En cas d'erreur, retourner un tableau vide
    return { 
      data: { 
        transactions: [],
        total: 0
      }
    };
  }
};

/**
 * Récupérer les détails d'une transaction spécifique
 */
export const getTransactionDetails = async (transactionId: string): Promise<ApiResponse<Transaction>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Récupération des détails de la transaction ${transactionId}`);
    const response = await axios.get<Transaction>(
      `${API_BASE_URL}/api/users/me/transactions/${transactionId}`,
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de transaction:', error);
    let errorMessage = 'Une erreur est survenue lors de la récupération des détails de transaction';
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    return { error: errorMessage };
  }
};