import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type pour les profils
export interface ProfileType {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number;
}

// Type pour le contexte
interface ProfileContextType {
  currentUser: ProfileType | null;
  managedAccounts: ProfileType[];
  activeProfile: ProfileType | null;
  setActiveProfile: (profile: ProfileType | null) => void;
  selectProfile: (profileId: string) => void;
  addFunds: (amount: number, userId?: string) => boolean;
  transferFunds: (amount: number, recipientId: string) => boolean;
}

// Création du contexte avec une valeur par défaut
const ProfileContext = createContext<ProfileContextType>({
  currentUser: null,
  managedAccounts: [],
  activeProfile: null,
  setActiveProfile: () => {},
  selectProfile: () => {},
  addFunds: () => false,
  transferFunds: () => false,
});

// Hook personnalisé pour utiliser le contexte
export const useProfile = () => useContext(ProfileContext);

// Props pour le Provider
interface ProfileProviderProps {
  children: ReactNode;
}

// Données de test pour simuler un utilisateur et ses comptes gérés
const mockCurrentUser: ProfileType = {
  id: '1',
  name: 'Dan Toulet',
  username: 'dantoulet',
  avatar: 'https://api.a0.dev/assets/image?text=DT',
  balance: 342,
};

const mockManagedAccounts: ProfileType[] = [
  {
    id: '2',
    name: 'Noémie Sanchez',
    username: 'noemiesanchez',
    avatar: 'https://api.a0.dev/assets/image?text=NS',
    balance: 24,
  },
  {
    id: '3',
    name: 'Camille Toulet',
    username: 'camilletoulet',
    avatar: 'https://api.a0.dev/assets/image?text=CT',
    balance: 125,
  },
  {
    id: '4',
    name: 'Raphaël Toulet',
    username: 'raphaeltoulet',
    avatar: 'https://api.a0.dev/assets/image?text=RT',
    balance: 125,
  },
];

// Provider qui va envelopper notre application
export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ProfileType | null>(mockCurrentUser);
  const [managedAccounts, setManagedAccounts] = useState<ProfileType[]>(mockManagedAccounts);
  const [activeProfile, setActiveProfile] = useState<ProfileType | null>(currentUser);

  // Initialise le profil actif avec l'utilisateur courant au premier rendu
  useEffect(() => {
    if (currentUser && !activeProfile) {
      setActiveProfile(currentUser);
    }
  }, [currentUser]);

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
  const addFunds = (amount: number, userId?: string): boolean => {
    try {
      // Si aucun userId n'est fourni, on ajoute au compte actif
      const targetId = userId || (activeProfile?.id || currentUser?.id);
      
      if (!targetId) return false;
      
      if (currentUser && currentUser.id === targetId) {
        // Ajouter des fonds à l'utilisateur courant
        setCurrentUser({
          ...currentUser,
          balance: currentUser.balance + amount
        });
        return true;
      } else {
        // Ajouter des fonds à un compte géré
        setManagedAccounts(prevAccounts =>
          prevAccounts.map(account =>
            account.id === targetId
              ? { ...account, balance: account.balance + amount }
              : account
          )
        );
        
        // Mettre à jour le profil actif si c'est celui qui a reçu les fonds
        if (activeProfile && activeProfile.id === targetId) {
          setActiveProfile({
            ...activeProfile,
            balance: activeProfile.balance + amount
          });
        }
        
        return true;
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de fonds:", error);
      return false;
    }
  };
  
  // Fonction pour transférer des fonds d'un utilisateur à un autre
  const transferFunds = (amount: number, recipientId: string): boolean => {
    try {
      // Vérifier que l'utilisateur courant a suffisamment de fonds
      if (!currentUser || currentUser.balance < amount) {
        return false;
      }
      
      // Réduire le solde de l'expéditeur (utilisateur courant)
      setCurrentUser({
        ...currentUser,
        balance: currentUser.balance - amount
      });
      
      // Augmenter le solde du destinataire
      // Vérifier si le destinataire est un compte géré
      const recipientIndex = managedAccounts.findIndex(account => account.id === recipientId);
      
      if (recipientIndex >= 0) {
        // Le destinataire est un compte géré
        const updatedAccounts = [...managedAccounts];
        updatedAccounts[recipientIndex] = {
          ...updatedAccounts[recipientIndex],
          balance: updatedAccounts[recipientIndex].balance + amount
        };
        setManagedAccounts(updatedAccounts);
        
        // Mettre à jour le profil actif si c'est le destinataire
        if (activeProfile && activeProfile.id === recipientId) {
          setActiveProfile({
            ...activeProfile,
            balance: activeProfile.balance + amount
          });
        }
      } else {
        // Le destinataire n'est pas dans notre liste (compte externe)
        // Dans un cas réel, cela impliquerait une API call
        console.log(`Transfert de ${amount} vers le compte externe ${recipientId}`);
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors du transfert de fonds:", error);
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
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};