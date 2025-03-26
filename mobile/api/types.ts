// Types généraux pour les réponses API
export interface ApiResponse<T = void> {
  data?: T;
  error?: string;
}

// Types pour les comptes gérés
export interface ManagedAccount {
  id: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedAccountsResponse {
  accounts: ManagedAccount[];
}

export interface ManagedAccountCreateRequest {
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
}

export interface ManagedAccountUpdateRequest {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
}

// Types pour l'authentification
export interface AuthResponse {
  token: string;
  accessToken: string; // Ajout pour compatibilité avec auth.ts
  refreshToken: string;
  user: User;
}

// Interface pour le profil utilisateur stocké localement
export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  avatarUrl?: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces pour les comptes gérés
export interface ManagedAccount {
  id: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedAccountCreateRequest {
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
}

export interface ManagedAccountUpdateRequest {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  avatarUrl?: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignInRequest {
  emailOrPhone: string;
  password: string;
}

export interface SignUpRequest {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  twoFactorEnabled?: boolean;
}

export interface VerifyCodeRequest {
  emailOrPhone: string;
  code: string;
}

export interface ResetPasswordRequest {
  emailOrPhone: string;
}

export interface CreateNewPasswordRequest {
  token: string;
  newPassword: string;
}

export interface SocialSignInRequest {
  provider: 'google' | 'apple' | 'facebook';
  token: string;
  userData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface UserExistsResponse {
  exists: boolean;
  requiresVerification?: boolean;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  avatarUrl?: string;
}