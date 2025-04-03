import { NavigatorScreenParams } from '@react-navigation/native';
// Importer ProductItem et WishItemType
import { ProductItem } from './products';
import { WishItemType } from '../api/wishlists';

// Types for story-related screens
export type StoryMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;
  timestamp: number | string | Date;
};

export type Story = {
  id: string;
  media: StoryMedia[];
  timestamp: number | string | Date;
  viewed: boolean;
};

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
  HomePage: undefined;
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
  StoryCamera: { returnToScreen?: string };
  StoryEditor: { mediaUri: string; mediaType: 'photo' | 'video' };
  StoryViewer: { 
    storyId: string; 
    friendId: string; 
    friendName: string; 
    friendAvatar: string; 
    stories: Story[] 
  };
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
  ManagedAccountsList: { fromSettings?: boolean };
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
  HomePage: undefined;
  Events: undefined;
  Messages: undefined;
  Wishlist: undefined;
  Profile: { userId?: string }; // Accepter un userId optionnel
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
  StoryCamera: { returnToScreen?: string };
  StoryEditor: { mediaUri: string; mediaType: 'photo' | 'video' };
  StoryViewer: { 
    storyId: string; 
    friendId: string; 
    friendName: string; 
    friendAvatar: string; 
    stories: Story[] 
  };
  Friends: undefined;
  ContactsSync: undefined;
  
  // Forgot password flow screens
  VerifyCode: { emailOrPhone: string; resetToken?: string };
  CreateNewPassword: { emailOrPhone: string; resetToken: string };
  
  // Wishlist related screens
  Search: undefined;
  WishlistSettings: {
    wishlistId?: string;
    pendingWishlist?: {
      title: string;
      description: string;
      addAdmins: boolean;
    }
  };
  ProductDetail: {
    productId: string;
    isBrand?: boolean;
    brandName?: string;
    isNewProduct?: boolean;
    isInspiration?: boolean;
    inspirationName?: string;
    apiPath?: string;
    productData?: ProductItem | WishItemType; // Accepter l'un ou l'autre type
  };
  BrandProducts: {
    brandId: string;
    brandName: string;
  };
  InspirationProducts: { // Add InspirationProducts screen
    inspirationId: string;
    inspirationName: string;
  };
  AllItemsGrid: { // Add the new grid screen
      itemType: 'brands' | 'inspirations' | 'giftIdeas';
      title: string;
      // Optional: Pass initial data or endpoint if needed, though fetching inside is simpler
  };
  EditWish: { wishId: string };
  AddWish: { wishlistId: string; initialUrl?: string }; // Ajouter initialUrl optionnel
  
  // Event related screens
  EventSearch: undefined;
  EventSettings: { eventId: string };
  EventInviteFriends: { eventId: string; draftId?: string; eventData?: Partial<Event> }; // Ajouter draftId et eventData optionnels
  CustomEventTypeSelection: undefined;
  EventChat: { eventId: string; eventTitle?: string; eventIcon?: string; eventColor?: string };
  EventSelector: undefined;
  EventPotSelector: { eventId: string };
  
  // Profile and security screens
  Security: undefined;
  
  // Chat related screens
  ChatDetail: { messageId: string; name: string; avatars: string[]; isGroupChat: boolean };
  NewMessage: { mode?: string };
  GroupChatSettings: { groupId: string };
  
  // Payment related screens
  ChooseAmount: { recipientId?: string; eventId?: string; isAddingFunds?: boolean; user?: { id: string; name: string; avatar: string } };
  PaymentMethod: { amount: number; recipientId?: string; eventId?: string };
  PaymentConfirmation: { amount: number; methodId: string; recipientId?: string; eventId?: string };
  
  // Bank account screens
  BankAccounts: undefined;
  BankAccountDetail: { accountId: string };
  BankTransfer: { accountId: string };
  
  // Transaction screens
  TransactionDetail: { transactionId: string };
  
  // Settings related screens
  NotificationsScreen: undefined;
  FAQsScreen: undefined;
  ConfidentialityScreen: undefined;
  TermsScreen: undefined;
  GuidedTourScreen: undefined;
  MyProfileScreen: { fromSettings?: boolean };
  EditUsernameScreen: undefined; // Ajouter l'écran de modification du nom d'utilisateur
  OngoingPurchases: undefined; // Ajouter le nouvel écran
  EventIllustration: { eventData: Partial<Event>; isDraft?: boolean; draftId?: string; }; // Ajouter params brouillon
  // Ajouter les écrans intermédiaires du flux de création
  EventTitleModal: { eventData: Partial<Event>; isDraft?: boolean; draftId?: string; }; // Ajouter params brouillon
  EventDateModal: { eventData: Partial<Event>; isDraft?: boolean; draftId?: string; }; // Ajouter params brouillon
  EventHostModal: { eventData: Partial<Event>; isDraft?: boolean; draftId?: string; }; // Ajouter params brouillon
  EventOptionalInfoModal: { eventData: Partial<Event>; isDraft?: boolean; draftId?: string; }; // Ajouter params brouillon
  EventBackground: { eventData: Partial<Event>; isDraft?: boolean; draftId?: string; }; // Nouvel écran pour l'image de fond
};