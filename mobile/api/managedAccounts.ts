import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ApiResponse, ManagedAccount, ManagedAccountCreateRequest, ManagedAccountUpdateRequest } from './types';
import { getAuthHeaders } from './auth';

/**
 * Récupérer tous les comptes gérés de l'utilisateur
 */
export const getManagedAccounts = async (): Promise<ApiResponse<ManagedAccount[]>> => {
  try {
    const headers = await getAuthHeaders();
    console.log("[API] Récupération des comptes gérés");
    const response = await axios.get<ManagedAccount[]>(
      `${API_BASE_URL}/api/managed-accounts`,
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes gérés:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération des comptes gérés'
    };
  }
};

/**
 * Récupérer un compte géré spécifique
 */
export const getManagedAccount = async (accountId: string): Promise<ApiResponse<ManagedAccount>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Récupération du compte géré ${accountId}`);
    const response = await axios.get<ManagedAccount>(
      `${API_BASE_URL}/api/managed-accounts/${accountId}`,
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error(`Erreur lors de la récupération du compte géré (ID: ${accountId}):`, error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la récupération du compte géré'
    };
  }
};

/**
 * Créer un nouveau compte géré
 */
export const createManagedAccount = async (account: ManagedAccountCreateRequest): Promise<ApiResponse<ManagedAccount>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Création d'un compte géré`, account);
    const response = await axios.post<ManagedAccount>(
      `${API_BASE_URL}/api/managed-accounts`,
      account,
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error('Erreur lors de la création du compte géré:', error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la création du compte géré'
    };
  }
};

/**
 * Mettre à jour un compte géré
 */
export const updateManagedAccount = async (accountId: string, updates: ManagedAccountUpdateRequest): Promise<ApiResponse<ManagedAccount>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Mise à jour du compte géré ${accountId}`, updates);
    const response = await axios.put<ManagedAccount>(
      `${API_BASE_URL}/api/managed-accounts/${accountId}`,
      updates,
      { headers }
    );
    
    return { data: response.data };
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du compte géré (ID: ${accountId}):`, error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la mise à jour du compte géré'
    };
  }
};

/**
 * Supprimer un compte géré
 */
export const deleteManagedAccount = async (accountId: string): Promise<ApiResponse<void>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Suppression du compte géré ${accountId}`);
    await axios.delete(
      `${API_BASE_URL}/api/managed-accounts/${accountId}`,
      { headers }
    );
    
    return {};
  } catch (error) {
    console.error(`Erreur lors de la suppression du compte géré (ID: ${accountId}):`, error);
    return { 
      error: error.response?.data?.error || 'Une erreur est survenue lors de la suppression du compte géré'
    };
  }
};

/**
 * Mettre à jour l'avatar d'un compte géré
 */
export const updateManagedAccountAvatar = async (accountId: string, avatarUrl: string): Promise<ApiResponse<void>> => {
  try {
    const headers = await getAuthHeaders();
    console.log(`[API] Mise à jour de l'avatar du compte géré ${accountId}`);
    await axios.post(
      `${API_BASE_URL}/api/managed-accounts/${accountId}/avatar`,
      { avatarUrl },
      { headers }
    );
    
    return {};
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'avatar (ID: ${accountId}):`, error);
    return {
      error: error.response?.data?.error || 'Une erreur est survenue lors de la mise à jour de l\'avatar'
    };
  }
};