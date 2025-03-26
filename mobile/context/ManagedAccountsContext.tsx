import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  createManagedAccount, 
  getManagedAccounts,
  getManagedAccount,
  updateManagedAccount,
  deleteManagedAccount,
  updateManagedAccountAvatar
} from '../api/managedAccounts';
import { ManagedAccount, ManagedAccountCreateRequest, ManagedAccountUpdateRequest } from '../api/types';
import { useAuth } from '../auth/context/AuthContext';

interface ManagedAccountsContextType {
  // État
  accounts: ManagedAccount[];
  currentAccount: ManagedAccount | null;
  isLoading: boolean;
  error: string | null;
  
  // Form state for creating/updating accounts
  formData: {
    firstName: string;
    lastName: string;
    gender: string;
    birthDate: string;
    avatarUrl: string;
  };
  
  // Actions
  fetchAccounts: () => Promise<void>;
  fetchAccount: (accountId: string) => Promise<void>;
  createAccount: (data: ManagedAccountCreateRequest) => Promise<ManagedAccount | null>;
  updateAccount: (accountId: string, data: ManagedAccountUpdateRequest) => Promise<ManagedAccount | null>;
  removeAccount: (accountId: string) => Promise<boolean>;
  updateAvatar: (accountId: string, avatarUrl: string) => Promise<boolean>;
  
  // Form actions
  setFormField: (field: keyof ManagedAccountCreateRequest, value: string) => void;
  resetForm: () => void;
  setCurrentAccount: (account: ManagedAccount | null) => void;
}

// Valeurs par défaut pour le contexte
const defaultManagedAccountsContext: ManagedAccountsContextType = {
  accounts: [],
  currentAccount: null,
  isLoading: false,
  error: null,
  
  formData: {
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    avatarUrl: '',
  },
  
  fetchAccounts: async () => {},
  fetchAccount: async () => {},
  createAccount: async () => null,
  updateAccount: async () => null,
  removeAccount: async () => false,
  updateAvatar: async () => false,
  
  setFormField: () => {},
  resetForm: () => {},
  setCurrentAccount: () => {},
};

// Création du contexte
const ManagedAccountsContext = createContext<ManagedAccountsContextType>(defaultManagedAccountsContext);

// Hook personnalisé pour utiliser le contexte
export const useManagedAccounts = () => useContext(ManagedAccountsContext);

// Provider du contexte
export const ManagedAccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // État
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<ManagedAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // État du formulaire pour la création/mise à jour d'un compte
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    avatarUrl: '',
  });
  
  const { user } = useAuth();
  
  // Charger les comptes lors de l'initialisation du contexte
  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);
  
  // Définir un champ du formulaire
  const setFormField = useCallback((field: keyof ManagedAccountCreateRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  // Réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      birthDate: '',
      avatarUrl: '',
    });
  }, []);
  
  // Récupérer tous les comptes gérés
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getManagedAccounts();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setAccounts(response.data); // La réponse est déjà un tableau de ManagedAccount
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des comptes gérés:', err);
      setError('Une erreur est survenue lors de la récupération des comptes gérés');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Récupérer un compte géré spécifique
  const fetchAccount = useCallback(async (accountId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getManagedAccount(accountId);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setCurrentAccount(response.data);
        
        // Mettre à jour le formulaire avec les données du compte
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          gender: response.data.gender || '',
          birthDate: response.data.birthDate || '',
          avatarUrl: response.data.avatarUrl || '',
        });
      }
    } catch (err) {
      console.error(`Erreur lors de la récupération du compte géré ${accountId}:`, err);
      setError('Une erreur est survenue lors de la récupération du compte géré');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Créer un nouveau compte géré
  const createAccount = useCallback(async (data: ManagedAccountCreateRequest): Promise<ManagedAccount | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await createManagedAccount(data);
      
      if (response.error) {
        setError(response.error);
        return null;
      } else if (response.data) {
        // Mettre à jour la liste des comptes
        await fetchAccounts();
        return response.data;
      }
      
      return null;
    } catch (err) {
      console.error('Erreur lors de la création du compte géré:', err);
      setError('Une erreur est survenue lors de la création du compte géré');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccounts]);
  
  // Mettre à jour un compte géré
  const updateAccount = useCallback(async (accountId: string, data: ManagedAccountUpdateRequest): Promise<ManagedAccount | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await updateManagedAccount(accountId, data);
      
      if (response.error) {
        setError(response.error);
        return null;
      } else if (response.data) {
        // Mettre à jour la liste des comptes
        await fetchAccounts();
        
        // Mettre à jour le compte courant si nécessaire
        if (currentAccount && currentAccount.id === accountId) {
          setCurrentAccount(response.data);
        }
        
        return response.data;
      }
      
      return null;
    } catch (err) {
      console.error(`Erreur lors de la mise à jour du compte géré ${accountId}:`, err);
      setError('Une erreur est survenue lors de la mise à jour du compte géré');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccounts, currentAccount]);
  
  // Supprimer un compte géré
  const removeAccount = useCallback(async (accountId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await deleteManagedAccount(accountId);
      
      if (response.error) {
        setError(response.error);
        return false;
      } else {
        // Mettre à jour la liste des comptes
        await fetchAccounts();
        
        // Réinitialiser le compte courant si nécessaire
        if (currentAccount && currentAccount.id === accountId) {
          setCurrentAccount(null);
        }
        
        return true;
      }
    } catch (err) {
      console.error(`Erreur lors de la suppression du compte géré ${accountId}:`, err);
      setError('Une erreur est survenue lors de la suppression du compte géré');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccounts, currentAccount]);
  
  // Mettre à jour l'avatar d'un compte géré
  const updateAvatar = useCallback(async (accountId: string, avatarUrl: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await updateManagedAccountAvatar(accountId, avatarUrl);
      
      if (response.error) {
        setError(response.error);
        return false;
      } else {
        // Mettre à jour la liste des comptes
        await fetchAccounts();
        
        // Mettre à jour le compte courant si nécessaire
        if (currentAccount && currentAccount.id === accountId) {
          setCurrentAccount({
            ...currentAccount,
            avatarUrl
          });
        }
        
        return true;
      }
    } catch (err) {
      console.error(`Erreur lors de la mise à jour de l'avatar du compte géré ${accountId}:`, err);
      setError('Une erreur est survenue lors de la mise à jour de l\'avatar');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccounts, currentAccount]);
  
  // Valeurs du contexte
  const value = {
    accounts,
    currentAccount,
    isLoading,
    error,
    formData,
    
    fetchAccounts,
    fetchAccount,
    createAccount,
    updateAccount,
    removeAccount,
    updateAvatar,
    
    setFormField,
    resetForm,
    setCurrentAccount,
  };
  
  return (
    <ManagedAccountsContext.Provider value={value}>
      {children}
    </ManagedAccountsContext.Provider>
  );
};