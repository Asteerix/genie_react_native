import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';
import { authApi } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type User = {
  id: string;
  email?: string;
  phone?: string;
  username?: string; // Ajouter username
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
  checkUserExists: (emailOrPhone: string) => Promise<{exists: boolean, requiresVerification?: boolean}>;
  updateProfile: (userData: Partial<User>) => Promise<void>; // Utiliser Partial<User> pour userData
  updateUsername: (newUsername: string) => Promise<void>; // Ajouter la fonction updateUsername
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Vérifie si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Charger l'utilisateur depuis le stockage local
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        console.log(`État de connexion: User=${!!storedUser}, Token=${!!token}, RefreshToken=${!!refreshToken}`);
        
        // Si l'utilisateur et au moins un des tokens sont présents
        if (storedUser && (token || refreshToken)) {
          setUser(JSON.parse(storedUser));
        } 
        // Si token manquant mais utilisateur présent, déconnecter proprement
        else if (storedUser && !token && !refreshToken) {
          console.warn('Incohérence: utilisateur trouvé mais pas de tokens');
          await AsyncStorage.removeItem('user');
          setUser(null);
        }
        // Cas où ni utilisateur ni tokens ne sont présents - déjà déconnecté
        else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
        // En cas d'erreur, on supprime tout pour éviter un état incohérent
        await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
        setUser(null);
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
      
      // Assurer que le token est également sauvegardé dans une clé supplémentaire pour compatibilité
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await AsyncStorage.setItem('@auth_token', token);
        console.log('Token dupliqué dans @auth_token pour compatibilité');
      }
      
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
      
      // Assurer que le token est également sauvegardé dans une clé supplémentaire pour compatibilité
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await AsyncStorage.setItem('@auth_token', token);
        console.log('Token dupliqué dans @auth_token pour compatibilité'); 
      }
      
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
      // Vérifier si nous avons un refresh token à fournir
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      console.log(`Déconnexion: refresh token ${refreshToken ? 'trouvé' : 'non trouvé'}`);
      
      // Appeler l'API pour se déconnecter (invalidation du token)
      try {
        await authApi.signOut();
        console.log('Déconnexion backend réussie');
      } catch (error) {
        console.error('Error during signout from backend', error);
        // On continue même si l'API échoue
      }
      
      // Utiliser resetAllStorage pour garantir une purge complète de tous les données
      // en important le module resetLocalData qui nettoie tous les caches
      try {
        const resetLocalData = require('../../utils/resetLocalData').default;
        await resetLocalData.resetAllStorage();
        console.log('Nettoyage complet de toutes les données via resetAllStorage');
      } catch (resetError) {
        console.error('Erreur lors du nettoyage resetAllStorage:', resetError);
        
        // Fallback: Supprimer TOUTES les données d'authentification possibles du stockage local
        await AsyncStorage.multiRemove([
          // Données utilisateur
          'user',
          'userProfile',
          '@user_profile',
          'lastLogin',
          
          // Tokens d'accès (toutes les clés possibles)
          'accessToken',
          '@auth_token',
          'token',
          '@access_token',
          'access_token',
          
          // Tokens de rafraîchissement (toutes les clés possibles)
          'refreshToken',
          '@refresh_token',
          
          // Données de profil
          'managed_accounts',
          'managed_accounts_raw',
          'current_profile',
          'active_profile'
        ]);
      }
      
      console.log('Toutes les données d\'authentification ont été supprimées');
      
      // Mettre à jour l'état local
      setUser(null);
      toast.success('Déconnexion réussie');
      
      // Rediriger vers l'écran de connexion
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
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
      
      // Assurer que le token est également sauvegardé dans une clé supplémentaire pour compatibilité
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await AsyncStorage.setItem('@auth_token', token);
        console.log('Token dupliqué dans @auth_token pour compatibilité');
      }
      
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
  const checkUserExists = async (emailOrPhone: string): Promise<{exists: boolean, requiresVerification?: boolean}> => {
    try {
      const response = await authApi.checkUserExists(emailOrPhone);
      console.log('User check response:', response);
      return response;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      throw new Error('Erreur lors de la vérification de l\'utilisateur');
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

  // Fonction pour mettre à jour le nom d'utilisateur
  const updateUsername = async (newUsername: string) => {
    if (!user) throw new Error("Utilisateur non connecté");
    setIsLoading(true);
    try {
      // Importer l'API profile ici pour éviter dépendance cyclique potentielle au niveau module
      const profileApi = require('../../api/profile');
      const response = await profileApi.updateUsername(newUsername);

      if (response.error) {
        throw new Error(response.error);
      }

      // Mettre à jour l'état local de l'utilisateur
      const updatedUser = { ...user, username: response.data.username };
      setUser(updatedUser);
      // Mettre aussi à jour le cache AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Nom d\'utilisateur mis à jour');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Échec de la mise à jour du nom d\'utilisateur';
      toast.error(errorMessage);
      throw error; // Renvoyer l'erreur pour que l'écran puisse la gérer
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
        updateProfile,
        updateUsername // Exposer la nouvelle fonction
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