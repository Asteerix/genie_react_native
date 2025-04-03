import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, getUserBalance, addFunds as apiAddFunds, transferFunds as apiTransferFunds } from '../api/profile';
import { getManagedAccounts, getManagedAccount, getManagedAccountBalance } from '../api/managedAccounts';
import { uploadAvatar, uploadProfilePicture } from '../api/auth';
import { User, ManagedAccount } from '../api/types';

// Type pour les profils
export interface ProfileType {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
}

// Type pour le contexte
interface ProfileContextType {
  currentUser: ProfileType | null;
  managedAccounts: ProfileType[];
  activeProfile: ProfileType | null;
  setActiveProfile: (profile: ProfileType | null) => void;
  selectProfile: (profileId: string) => void;
  addFunds: (amount: number, userId?: string) => Promise<boolean>;
  transferFunds: (amount: number, recipientId: string) => Promise<boolean>;
  refreshProfiles: () => Promise<void>;
  uploadProfileImage: (imageUri: string, isAvatar?: boolean) => Promise<boolean>;
  loading: boolean;
}

// Création du contexte avec une valeur par défaut
const ProfileContext = createContext<ProfileContextType>({
  currentUser: null,
  managedAccounts: [],
  activeProfile: null,
  setActiveProfile: () => {},
  selectProfile: () => {},
  addFunds: async () => false,
  transferFunds: async () => false,
  refreshProfiles: async () => {},
  uploadProfileImage: async () => false,
  loading: false,
});

// Hook personnalisé pour utiliser le contexte
export const useProfile = () => useContext(ProfileContext);

// Props pour le Provider
interface ProfileProviderProps {
  children: ReactNode;
}

// Convertir un utilisateur API en ProfileType
const convertUserToProfile = (user: User): ProfileType => {
  // Générer un nom d'utilisateur à partir du prénom et du nom sans caractères spéciaux
  const usernameBase = `${user.firstName || ''}${user.lastName || ''}`.toLowerCase();
  const username = user.username || usernameBase.replace(/[^a-z0-9]/g, '');
  
  return {
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    username,
    avatar: user.avatarUrl || `https://api.a0.dev/assets/image?text=${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`,
    balance: user.balance || 0,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender,
    birthDate: user.birthDate,
    twoFactorEnabled: user.twoFactorEnabled,
    avatarUrl: user.avatarUrl
  };
};

// Convertir un compte géré API en ProfileType
const convertManagedAccountToProfile = (account: ManagedAccount): ProfileType => {
  // Générer un nom d'utilisateur à partir du prénom et du nom sans caractères spéciaux
  const usernameBase = `${account.firstName || ''}${account.lastName || ''}`.toLowerCase();
  const username = account.username || usernameBase.replace(/[^a-z0-9]/g, '');
  
  return {
    id: account.id,
    name: `${account.firstName || 'Utilisateur'} ${account.lastName || ''}`.trim(),
    username,
    avatar: account.avatarUrl || `https://api.a0.dev/assets/image?text=${account.firstName?.charAt(0) || ''}${account.lastName?.charAt(0) || ''}`,
    balance: account.balance || 0,
    firstName: account.firstName,
    lastName: account.lastName,
    gender: account.gender,
    birthDate: account.birthDate,
    avatarUrl: account.avatarUrl
  };
};

// Provider qui va envelopper notre application
export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ProfileType | null>(null);
  const [managedAccounts, setManagedAccounts] = useState<ProfileType[]>([]);
  const [activeProfile, setActiveProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Vérifier si l'utilisateur est connecté en surveillant les tokens
  const [authTokens, setAuthTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    accessToken: null,
    refreshToken: null
  });
  
  // Vérifier régulièrement les tokens pour détecter les déconnexions
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const [accessToken, refreshToken] = await Promise.all([
          AsyncStorage.getItem('accessToken'),
          AsyncStorage.getItem('refreshToken')
        ]);
        
        // Mettre à jour l'état des tokens
        setAuthTokens({ accessToken, refreshToken });
        
        // Si les tokens disparaissent (déconnexion), réinitialiser le profil
        if (!accessToken && !refreshToken && (authTokens.accessToken || authTokens.refreshToken)) {
          console.log('Tokens disparus, réinitialisation du ProfileContext');
          setCurrentUser(null);
          setManagedAccounts([]);
          setActiveProfile(null);
          // Supprimer le cache des comptes gérés
          await AsyncStorage.removeItem('managed_accounts');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des tokens:', error);
      }
    };
    
    // Vérifier au démarrage
    checkAuthStatus();
    
    // Vérifier périodiquement (toutes les 5 secondes)
    const interval = setInterval(checkAuthStatus, 5000);
    
    return () => clearInterval(interval);
  }, [authTokens.accessToken, authTokens.refreshToken]);

  // Fonction pour créer un utilisateur avec des données réelles ou par défaut si nécessaire
  const createUserProfile = (data: Partial<ProfileType> = {}): ProfileType => {
    return {
      id: data.id || 'temp-id',
      name: data.name || '',
      username: data.username || '',
      avatar: data.avatar || 'https://api.a0.dev/assets/image?text=U',
      balance: data.balance || 0,
    };
  };

  // Fonction pour charger les données utilisateur depuis l'API
  const loadUserData = async () => {
    setLoading(true);
    
    try {
      // Vérifier d'abord si les tokens existent
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken')
      ]);
      
      // Si aucun token n'existe, ne pas essayer de charger le profil
      if (!accessToken && !refreshToken) {
        console.log('Aucun token trouvé, impossible de charger le profil utilisateur');
        setCurrentUser(null);
        setActiveProfile(null);
        setManagedAccounts([]);
        setLoading(false);
        return;
      }
    
      // Récupérer le profil utilisateur (avec tentative API et fallback cache)
      const userProfileResponse = await getUserProfile();
      
      if (userProfileResponse.data) {
        // Tenter de charger le solde du portefeuille (sans afficher d'erreurs)
        let userBalance = 0;
        try {
          const userBalanceResponse = await getUserBalance();
          if (userBalanceResponse.data) {
            userBalance = userBalanceResponse.data.balance || 0;
          }
        } catch {
          // Silencieux - continuer avec un solde à 0
        }
        
        // Préparer les données utilisateur avec les informations disponibles
        const userData = {
          ...userProfileResponse.data,
          balance: userBalance
        };
        
        // Construire le profil avec nom, prénom, etc.
        const userProfile = convertUserToProfile(userData);
        setCurrentUser(userProfile);
        
        // Si aucun profil actif, définir l'utilisateur courant comme profil actif
        if (!activeProfile) {
          setActiveProfile(userProfile);
        }
      } else {
        // Créer un profil par défaut en dernier recours
        const defaultUser = createUserProfile();
        setCurrentUser(defaultUser);
        
        if (!activeProfile) {
          setActiveProfile(defaultUser);
        }
      }
      
      // Charger les comptes gérés (gestion d'erreur interne)
      await loadManagedAccounts();
    } catch {
      // En cas d'erreur générale, créer un profil par défaut
      const defaultUser = createUserProfile();
      setCurrentUser(defaultUser);
      
      if (!activeProfile) {
        setActiveProfile(defaultUser);
      }
    } finally {
      setLoading(false);
    }
  }
  
  // Fonction pour charger les comptes gérés
  const loadManagedAccounts = async () => {
    try {
      // Vérifier d'abord si les tokens existent
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken')
      ]);
      
      // Si aucun token n'existe, effacer les données et ne pas charger
      if (!accessToken && !refreshToken) {
        console.log('Aucun token trouvé, suppression du cache des comptes gérés');
        await AsyncStorage.removeItem('managed_accounts');
        setManagedAccounts([]);
        return;
      }
      
      // Obtenir l'ID utilisateur actuel pour validation du cache
      const userJson = await AsyncStorage.getItem('user');
      let currentUserId = null;
      
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          currentUserId = userData.id;
        } catch (e) {
          // Silencieux - erreur de parsing
        }
      }
      
      // Si pas d'ID utilisateur, ne pas charger et purger le cache
      if (!currentUserId) {
        console.log('Aucun utilisateur trouvé, suppression du cache des comptes gérés');
        await AsyncStorage.removeItem('managed_accounts');
        setManagedAccounts([]);
        return;
      }
            
      // Essayer de charger depuis le cache d'abord
      const cachedAccountsJson = await AsyncStorage.getItem('managed_accounts');
      let cachedAccounts = [];
      
      if (cachedAccountsJson) {
        try {
          cachedAccounts = JSON.parse(cachedAccountsJson);
        } catch (parseError) {
          // Silencieux - erreur de parsing
        }
      }
      
      // Tenter de charger de nouvelles données depuis l'API
      try {
        const managedAccountsResponse = await getManagedAccounts();
        
        if (!managedAccountsResponse.error && managedAccountsResponse.data) {
          // Pour chaque compte géré, récupérer son solde et le convertir en ProfileType
          const managedAccountsWithBalancePromises = managedAccountsResponse.data.map(async (account) => {
            let balance = 0;
            
            try {
              const balanceResponse = await getManagedAccountBalance(account.id);
              balance = balanceResponse.data?.balance || 0;
            } catch (balanceError) {
              // Silencieux - erreur de récupération du solde
            }
            
            return convertManagedAccountToProfile({
              ...account,
              balance
            });
          });
          
          // Attendre que toutes les promesses soient résolues
          const managedAccountsWithBalance = await Promise.all(managedAccountsWithBalancePromises);
          
          // Mettre à jour le cache avec l'ID de l'utilisateur propriétaire
          const cacheData = {
            userId: currentUserId,
            accounts: managedAccountsWithBalance,
            timestamp: Date.now()
          };
          
          await AsyncStorage.setItem('managed_accounts', JSON.stringify(cacheData));
          
          // Mettre à jour l'état
          setManagedAccounts(managedAccountsWithBalance);
          return;
        }
      } catch (apiError) {
        // Silencieux - utiliser le cache
      }
      
      // Si API échoue, utiliser le cache mais vérifier qu'il appartient à l'utilisateur actuel
      if (cachedAccountsJson) {
        try {
          const parsedCache = JSON.parse(cachedAccountsJson);
          
          // Si le cache a un format ancien (juste un tableau)
          if (Array.isArray(parsedCache)) {
            // On utilise quand même le cache, mais on le considère potentiellement périmé
            setManagedAccounts(parsedCache);
          } 
          // Si le cache a le nouveau format avec userId
          else if (parsedCache.userId && parsedCache.accounts) {
            // On vérifie que c'est bien le même utilisateur
            if (parsedCache.userId === currentUserId) {
              setManagedAccounts(parsedCache.accounts);
            } else {
              // Si c'est un autre utilisateur, on n'utilise pas le cache
              console.log('Cache appartenant à un autre utilisateur, on le vide');
              await AsyncStorage.removeItem('managed_accounts');
              setManagedAccounts([]);
            }
          } else {
            // Format de cache non reconnu, on le vide
            await AsyncStorage.removeItem('managed_accounts');
            setManagedAccounts([]);
          }
        } catch (e) {
          // Erreur de parsing, on vide le cache
          await AsyncStorage.removeItem('managed_accounts');
          setManagedAccounts([]);
        }
      } else {
        setManagedAccounts([]);
      }
    } catch (error) {
      // Erreur générale - définir un tableau vide
      setManagedAccounts([]);
      
      // Tenter de nettoyer le cache en cas d'erreur
      try {
        await AsyncStorage.removeItem('managed_accounts');
      } catch (cleanupError) {
        // Silencieux - échec du nettoyage
      }
    }
  };
  
  // Charger les données utilisateur au premier rendu
  useEffect(() => {
    loadUserData();
  }, []);
  
  // Fonction pour recharger toutes les données
  const refreshProfiles = async () => {
    await loadUserData();
  };

  // Fonction pour sélectionner un profil par son ID
  const selectProfile = (profileId: string) => {
    if (currentUser && profileId === currentUser.id) {
      setActiveProfile(currentUser);
    } else {
      const selectedAccount = managedAccounts.find(account => account.id === profileId);
      if (selectedAccount) {
        setActiveProfile(selectedAccount);
      }
    }
  };
  
  // Fonction pour ajouter des fonds au portefeuille d'un utilisateur
  const addFunds = async (amount: number, userId?: string): Promise<boolean> => {
    try {
      console.log(`Début de l'ajout de ${amount}€ au portefeuille`);
      
      // Si aucun userId n'est fourni, on ajoute au compte actif
      const targetId = userId || (activeProfile?.id || currentUser?.id);
      
      if (!targetId) {
        console.error("Aucun ID cible trouvé pour l'ajout de fonds");
        return false;
      }
      
      // Si c'est le compte de l'utilisateur principal
      if (currentUser && currentUser.id === targetId) {
        console.log(`Ajout de ${amount}€ au compte utilisateur principal (${targetId})`);
        
        try {
          // Ajouter des fonds à l'utilisateur courant via l'API
          const result = await apiAddFunds(amount);
          if (result.error) {
            console.error("Erreur API lors de l'ajout de fonds:", result.error);
            // On continue pour faire une mise à jour locale malgré l'erreur API
          }
          
          // Mettre à jour le solde en local (utiliser la réponse API si disponible)
          let newBalance = currentUser.balance + amount;
          if (result.data && typeof result.data.balance === 'number') {
            newBalance = result.data.balance;
            console.log(`Nouveau solde obtenu de l'API: ${newBalance}€`);
          } else {
            console.log(`Solde calculé localement: ${newBalance}€`);
          }
          
          console.log(`Mise à jour du solde: ${currentUser.balance}€ -> ${newBalance}€`);
          
          // Mettre à jour le solde dans currentUser
          setCurrentUser({
            ...currentUser,
            balance: newBalance
          });
          
          // Mettre à jour le profil actif si c'est l'utilisateur courant
          if (activeProfile && activeProfile.id === currentUser.id) {
            console.log(`Mise à jour du profil actif avec le nouveau solde: ${newBalance}€`);
            setActiveProfile({
              ...activeProfile,
              balance: newBalance
            });
          }
          
          return true;
        } catch (apiError) {
          console.error("Exception lors de l'appel API d'ajout de fonds:", apiError);
          
          // Même en cas d'échec de l'API, on fait une mise à jour locale
          const newBalance = currentUser.balance + amount;
          console.log(`Mise à jour locale après échec API: ${newBalance}€`);
          
          setCurrentUser({
            ...currentUser,
            balance: newBalance
          });
          
          if (activeProfile && activeProfile.id === currentUser.id) {
            setActiveProfile({
              ...activeProfile,
              balance: newBalance
            });
          }
          
          // On considère l'opération comme réussie pour l'utilisateur
          return true;
        }
      } else {
        // Chercher dans les comptes gérés
        const managedAccount = managedAccounts.find(account => account.id === targetId);
        if (!managedAccount) {
          console.error(`Compte géré non trouvé: ${targetId}`);
          return false;
        }
        
        console.log(`Ajout de ${amount}€ au compte géré ${managedAccount.name}`);
        
        // Mettre à jour le solde
        const newBalance = managedAccount.balance + amount;
        console.log(`Nouveau solde du compte géré: ${newBalance}€`);
        
        setManagedAccounts(prevAccounts =>
          prevAccounts.map(account =>
            account.id === targetId
              ? { ...account, balance: newBalance }
              : account
          )
        );
        
        // Mettre à jour le profil actif si c'est le compte géré cible
        if (activeProfile && activeProfile.id === targetId) {
          console.log(`Mise à jour du profil actif (compte géré) avec le nouveau solde: ${newBalance}€`);
          setActiveProfile({
            ...activeProfile,
            balance: newBalance
          });
        }
        
        return true;
      }
    } catch (error) {
      console.error("Erreur générale lors de l'ajout de fonds:", error);
      return false;
    }
  };
  
  // Fonction pour transférer des fonds d'un utilisateur à un autre
  const transferFunds = async (amount: number, recipientId: string): Promise<boolean> => {
    try {
      // Vérifier que l'utilisateur courant a suffisamment de fonds
      if (!currentUser || currentUser.balance < amount) {
        return false;
      }
      
      // Vérifier si le destinataire est un compte géré
      const isManagedAccount = managedAccounts.some(account => account.id === recipientId);
      
      // Appeler l'API pour effectuer le transfert
      const result = await apiTransferFunds(amount, recipientId, isManagedAccount);
      if (result.error) {
        console.error("Erreur lors du transfert de fonds:", result.error);
        return false;
      }
      
      // Mettre à jour le solde de l'expéditeur en local
      const newSenderBalance = result.data?.balance || currentUser.balance - amount;
      setCurrentUser({
        ...currentUser,
        balance: newSenderBalance
      });
      
      // Mettre à jour le solde du destinataire s'il s'agit d'un compte géré
      if (isManagedAccount) {
        const recipient = managedAccounts.find(account => account.id === recipientId);
        if (recipient) {
          const newRecipientBalance = recipient.balance + amount;
          
          setManagedAccounts(prevAccounts =>
            prevAccounts.map(account =>
              account.id === recipientId
                ? { ...account, balance: newRecipientBalance }
                : account
            )
          );
          
          // Mettre à jour le profil actif si c'est le destinataire
          if (activeProfile && activeProfile.id === recipientId) {
            setActiveProfile({
              ...activeProfile,
              balance: newRecipientBalance
            });
          }
        }
      }
      
      // Mettre à jour le profil actif si c'est l'utilisateur courant
      if (activeProfile && activeProfile.id === currentUser.id) {
        setActiveProfile({
          ...activeProfile,
          balance: newSenderBalance
        });
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors du transfert de fonds:", error);
      return false;
    }
  };

  // Fonction pour télécharger et définir une image de profil
  const uploadProfileImage = async (imageUri: string, isAvatar: boolean = false): Promise<boolean> => {
    try {
      if (!currentUser) {
        console.error("Impossible de télécharger l'image : utilisateur non connecté");
        return false;
      }
      
      let imageUrl = '';
      if (isAvatar) {
        // Télécharger comme avatar
        const result = await uploadAvatar(imageUri);
        if (result.error) {
          console.error("Erreur lors du téléchargement de l'avatar:", result.error);
          return false;
        }
        imageUrl = result.data?.url || '';
      } else {
        // Télécharger comme photo de profil
        const result = await uploadProfilePicture(imageUri);
        if (result.error) {
          console.error("Erreur lors du téléchargement de la photo de profil:", result.error);
          return false;
        }
        imageUrl = result.data?.url || '';
      }
      
      if (!imageUrl) {
        console.error("Erreur: URL d'image non reçue du serveur");
        return false;
      }
      
      // Mettre à jour le profil utilisateur avec la nouvelle URL d'image
      if (isAvatar) {
        // Mettre à jour le profil avec la nouvelle URL d'avatar
        setCurrentUser(prev => prev ? {
          ...prev,
          avatar: imageUrl,
          avatarUrl: imageUrl
        } : null);
        
        if (activeProfile && activeProfile.id === currentUser.id) {
          setActiveProfile({
            ...activeProfile,
            avatar: imageUrl,
            avatarUrl: imageUrl
          });
        }
      } else {
        // Mettre à jour le profil avec la nouvelle URL de photo de profil
        setCurrentUser(prev => prev ? {
          ...prev,
          avatar: imageUrl,
          avatarUrl: imageUrl
        } : null);
        
        if (activeProfile && activeProfile.id === currentUser.id) {
          setActiveProfile({
            ...activeProfile,
            avatar: imageUrl,
            avatarUrl: imageUrl
          });
        }
      }
      
      // Mettre également à jour l'utilisateur dans AsyncStorage
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          if (isAvatar) {
            userData.avatarUrl = imageUrl;
            userData.profilePictureUrl = '';
          } else {
            userData.profilePictureUrl = imageUrl;
            userData.avatarUrl = '';
          }
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (storageError) {
        console.error("Erreur lors de la mise à jour du stockage local:", storageError);
        // Continue même en cas d'erreur de stockage
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image de profil:", error);
      return false;
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        currentUser,
        managedAccounts,
        activeProfile,
        setActiveProfile,
        selectProfile,
        addFunds,
        transferFunds,
        refreshProfiles,
        uploadProfileImage,
        loading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};