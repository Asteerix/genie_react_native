import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';
import { authApi } from '../../services/api';

type User = {
  id: string;
  email?: string;
  phone?: string;
  twoFactorEnabled?: boolean;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  signUp: (emailOrPhone: string, password: string, isTwoFactorEnabled?: boolean, profileData?: {firstName?: string, lastName?: string, gender?: string, birthdate?: string}) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (emailOrPhone: string) => Promise<void>;
  socialSignIn: (provider: 'apple' | 'google' | 'facebook') => Promise<void>;
  checkUserExists: (emailOrPhone: string) => Promise<boolean>;
  updateProfile: (userData: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifie si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Charger l'utilisateur depuis le stockage local
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      } finally {
        // Simule un temps de chargement minimal pour que le splash screen soit visible
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };
    
    loadUser();
  }, []);

  // Fonction de connexion
  const signIn = async (emailOrPhone: string, password: string) => {
    setIsLoading(true);
    try {
      // Validation des entrées
      if (!emailOrPhone?.trim()) {
        throw new Error('Email ou téléphone requis');
      }
      
      if (!password?.trim()) {
        throw new Error('Mot de passe requis');
      }
      
      // Utiliser le service API pour s'authentifier
      const userData = await authApi.signIn(emailOrPhone, password);
      
      // Mettre à jour l'état
      setUser(userData);
      toast.success('Connexion réussie');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de la connexion';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };  
  
  // Fonction d'inscription
  const signUp = async (
    emailOrPhone: string, 
    password: string, 
    isTwoFactorEnabled: boolean = false,
    profileData?: {firstName?: string, lastName?: string, gender?: string, birthdate?: string}
  ) => {
    setIsLoading(true);
    try {
      // Déterminer si c'est un email ou téléphone
      const isEmail = emailOrPhone.includes('@');
      
      // Préparer les données d'inscription
      const userData = {
        ...(isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }),
        password,
        twoFactorEnabled: isTwoFactorEnabled || !isEmail, // Activer 2FA pour les téléphones
        ...(profileData?.firstName && { firstName: profileData.firstName }),
        ...(profileData?.lastName && { lastName: profileData.lastName }),
        ...(profileData?.gender && { gender: profileData.gender }),
        ...(profileData?.birthdate && { birthDate: profileData.birthdate })
      };
      
      // Appel à l'API pour créer le compte
      const newUser = await authApi.signUp(userData);
      
      // Mettre à jour l'état
      setUser(newUser);
      toast.success('Inscription réussie');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Échec de l'inscription";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    setIsLoading(true);
    try {
      // Appeler l'API pour se déconnecter (invalidation du token)
      try {
        await authApi.signOut();
      } catch (error) {
        console.error('Error during signout from backend', error);
        // On continue même si l'API échoue
      }
      
      // Supprimer les données utilisateur du stockage local
      await AsyncStorage.multiRemove([
        'user',
        'accessToken',
        'refreshToken',
        'userProfile',
        'lastLogin'
      ]);
      
      // Mettre à jour l'état local
      setUser(null);
      toast.success('Déconnexion réussie');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Échec de la déconnexion';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de réinitialisation de mot de passe
  const resetPassword = async (emailOrPhone: string) => {
    setIsLoading(true);
    try {
      // Appeler l'API pour demander une réinitialisation
      await authApi.resetPassword(emailOrPhone);
      toast.success('Instructions de réinitialisation envoyées');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Échec de l'envoi des instructions";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion avec réseaux sociaux
  const socialSignIn = async (provider: 'apple' | 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      // En réalité, il faudrait utiliser les SDKs d'authentification sociale
      // (Apple Auth, Google Sign-In, Facebook SDK)
      // Pour la démo, on simule juste l'appel avec un token factice
      
      // Simuler l'obtention d'un token depuis le provider
      const mockToken = `mock-${provider}-token-${Date.now()}`;
      
      // Appeler l'API avec ce token
      const userData = await authApi.socialSignIn(provider, mockToken, {
        email: `user@example.com`,
        firstName: 'Demo',
        lastName: 'User'
      });
      
      // Mettre à jour l'état
      setUser(userData);
      toast.success(`Connexion avec ${provider} réussie`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Échec de la connexion avec ${provider}`;
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Vérifier si un utilisateur existe déjà
  const checkUserExists = async (emailOrPhone: string): Promise<boolean> => {
    try {
      const response = await authApi.checkUserExists(emailOrPhone);
      return response.exists;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  };
  
  // Mettre à jour le profil
  const updateProfile = async (userData: any) => {
    setIsLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(userData);
      setUser(updatedUser);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Échec de la mise à jour du profil';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        signIn, 
        signUp, 
        signOut, 
        resetPassword,
        socialSignIn,
        checkUserExists,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};