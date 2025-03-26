import { NavigatorScreenParams } from '@react-navigation/native';

// Types pour les paramètres des écrans d'authentification
export type AuthStackParamList = {
  Login: undefined;
  ExistingUserPassword: { emailOrPhone: string };
  SignupPassword: { emailOrPhone: string };
  SignupName: { emailOrPhone: string; password: string };
  SignupLastName: { emailOrPhone: string; password: string; firstName: string };
  SignupBirthday: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string;
  };
  SignupGender: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string;
  };
  SignupProfile: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string; 
    gender: string;
  };
  SignupProfileConfirm: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string; 
    gender: string;
    avatarUrl?: string;
  };
  AvatarCreation: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string; 
    gender: string;
  };
  ForgotPassword: { emailOrPhone: string };
  VerifyPhone: { phone: string; purpose: 'signup' | 'verification' | 'reset' };
  FindFriends: undefined;
  Loading: undefined;
};

// Types pour les paramètres des écrans de comptes gérés
export type ManagedAccountsStackParamList = {
  ManagedAccountsList: undefined;
  ManagedAccountsMain: undefined;
  ManagedAccountName: { managedBy: string };
  ManagedAccountLastName: { managedBy: string; firstName: string };
  ManagedAccountBirthday: { managedBy: string; firstName: string; lastName: string };
  ManagedAccountGender: {
    managedBy: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  ManagedAccountProfile: {
    managedBy: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
  };
  ManagedAccountProfileConfirm: {
    managedBy: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    avatarUrl?: string;
  };
};

// Types pour les paramètres des écrans principaux
export type MainStackParamList = {
  Home: undefined;
  Events: undefined;
  Messages: undefined;
  Wishlist: undefined;
  Profile: undefined;
  EventDetail: { eventId: string };
  WishlistDetail: { wishlistId: string };
  Chat: { chatId: string; chatName?: string };
  Settings: undefined;
  ResetData: undefined;
  PasswordSecurity: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  TwoFactorAuth: undefined;
  ConnectedDevices: undefined;
  StoryCamera: undefined;
  StoryEditor: { mediaUri: string; mediaType: 'photo' | 'video' };
  StoryViewer: { storyId: string };
  Friends: undefined;
};

// Combinaison de tous les paramètres pour la stack principale
export type RootStackParamList = {
  // Navigateurs principaux
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  ManagedAccounts: NavigatorScreenParams<ManagedAccountsStackParamList>;
  
  // Écrans directs dans la stack principale (sans navigateur imbriqué)
  // Pour les écrans d'authentification
  Login: undefined;
  ExistingUserPassword: { emailOrPhone: string };
  SignupPassword: { emailOrPhone: string };
  SignupName: { emailOrPhone: string; password: string };
  SignupLastName: { emailOrPhone: string; password: string; firstName: string };
  SignupBirthday: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string;
  };
  SignupGender: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string;
  };
  SignupProfile: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string; 
    gender: string;
  };
  SignupProfileConfirm: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string; 
    gender: string;
    avatarUrl?: string;
  };
  AvatarCreation: { 
    emailOrPhone: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    birthDate: string; 
    gender: string;
  };
  ForgotPassword: { emailOrPhone: string };
  VerifyPhone: { phone: string; purpose: 'signup' | 'verification' | 'reset' };
  FindFriends: undefined;
  Loading: undefined;
  
  // Pour les écrans de comptes gérés
  ManagedAccountsList: undefined;
  ManagedAccountsMain: undefined;
  ManagedAccountName: { managedBy: string };
  ManagedAccountLastName: { managedBy: string; firstName: string };
  ManagedAccountBirthday: { managedBy: string; firstName: string; lastName: string };
  ManagedAccountGender: {
    managedBy: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  ManagedAccountProfile: {
    managedBy: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
  };
  ManagedAccountProfileConfirm: {
    managedBy: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    avatarUrl?: string;
  };
  
  // Pour les écrans principaux
  Home: undefined;
  Events: undefined;
  Messages: undefined;
  Wishlist: undefined;
  Profile: undefined;
  EventDetail: { eventId: string };
  WishlistDetail: { wishlistId: string };
  Chat: { chatId: string; chatName?: string };
  Settings: undefined;
  ResetData: undefined;
  PasswordSecurity: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  TwoFactorAuth: undefined;
  ConnectedDevices: undefined;
  StoryCamera: undefined;
  StoryEditor: { mediaUri: string; mediaType: 'photo' | 'video' };
  StoryViewer: { storyId: string };
  Friends: undefined;
  ContactsSync: undefined;
};