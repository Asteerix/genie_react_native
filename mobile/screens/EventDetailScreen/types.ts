import { Animated, GestureResponderEvent, PanResponderGestureState, ScrollView } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

export interface EventDetailRouteProp extends RouteProp<{
  EventDetail: {
    eventId: string;
  };
}, 'EventDetail'> {}

export interface Participant {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface Gift {
  id: string;
  name: string;
  price: string;
  image: string;
  isFavorite: boolean;
  addedBy?: {
    name: string;
    avatar: string;
  };
  quantity?: number;
}

export interface EventTime {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  period?: string; // Using string type to be compatible with both AM/PM and other formats
}

export interface Location {
  address: string;
  city: string;
  postalCode: string;
}

export interface Host {
  id: string;
  name: string;
  avatar: string;
}

export interface Participant {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface GiftAddedBy {
  name: string;
  avatar: string;
}

export interface Gift {
  id: string;
  name: string;
  price: string;
  image: string;
  isFavorite: boolean;
  quantity?: number;
  addedBy?: GiftAddedBy;
}

export interface InvitedBy {
  name: string;
  username: string;
  avatar: string;
}

export interface JoinRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

// Types d'événements
export interface BaseEventDetails {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  color: string;
  image: string;
  location: Location;
  time: EventTime;
  isCollective: boolean;
}

export interface OwnedEventDetails extends BaseEventDetails {
  type: 'owned';
  hosts?: Host[];
  description?: string;
  participants?: Participant[];
  gifts?: Gift[];
  joinRequests?: JoinRequest[];
}

export interface JoinedEventDetails extends BaseEventDetails {
  description?: string;
}

export interface InvitationEventDetails extends BaseEventDetails {
  invitedBy: InvitedBy;
}

export type EventDetails = OwnedEventDetails | JoinedEventDetails | InvitationEventDetails;

// Type pour les propriétés d'événement (utilisé dans les helpers)
export interface EventPropertyType {
  description: string;
  subtitle: string;
  invitedBy: InvitedBy;
  period: 'AM' | 'PM';
}

// Props pour les composants
export interface GiftsViewProps {
  gifts?: Gift[];
  isSelectionMode: boolean;
  selectedGifts: { [key: string]: boolean } | Set<string>;
  onGiftPress?: (gift: Gift) => void;
  onSelectGift?: (giftId: string) => void;
  eventDetails: EventDetails;
  handleSelectCollaborativeGift: (gift: Gift) => void;
  handleGiftPress: (gift: Gift) => void;
  setIsSelectionMode: (value: boolean) => void;
  setSelectedGifts: (gifts: { [key: string]: boolean }) => void;
  selectedCount: number;
  setShowParticipantsView: (show: boolean) => void;
}

export interface ParticipantsViewProps {
  participants?: Participant[];
  onParticipantPress?: (participant: Participant) => void;
  selectedParticipant?: string | Participant | null;
  wishesData?: Record<string, Gift[]>;
  eventDetails: EventDetails;
  setShowParticipantsView: (show: boolean) => void;
  handleParticipantSelect: (username: string) => void;
  showExitMenu: boolean;
  toggleExitMenu: () => void;
  navigation: any;
}

export interface BottomSheetProps {
  event?: EventDetails;
  bottomSheetHeight?: Animated.Value;
  onGiftPress?: (gift: Gift) => void;
  onParticipantPress?: (participant: Participant) => void;
  isGiftSelectionMode?: boolean;
  selectedGifts?: { [key: string]: boolean } | Set<string>;
  onGiftSelect?: (giftId: string) => void;
  onAddGiftPress?: () => void;
  selectedParticipant?: string | Participant | null;
  wishesData?: Record<string, Gift[]>;
  eventType?: 'owned' | 'joined' | 'invitation';
  
  height: Animated.Value;
  sheetState: 'collapsed' | 'mid' | 'expanded';
  toggleSheet: () => void;
  setSheetToState: (state: 'collapsed' | 'mid' | 'expanded') => void;
  isChristmasEvent: boolean;
  showParticipantsView: boolean;
  eventDetails: EventDetails;
  setSelectedParticipant: (participant: Participant | null) => void;
  setShowParticipantsView: (show: boolean) => void;
  handleSelectCollaborativeGift: (gift: Gift) => void;
  handleGiftPress: (gift: Gift) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (value: boolean) => void;
  setSelectedGifts: (gifts: { [key: string]: boolean }) => void;
  selectedCount: number;
  panResponder: any;
}

export interface EventViewProps {
  event?: EventDetails;
  onEditHost?: () => void;
  onEditTitle?: () => void;
  onEditDate?: () => void;
  onEditIllustration?: () => void;
  onAcceptInvitation?: () => void;
  onDeclineInvitation?: () => void;
  onAddAdminPress?: () => void;
  onSharePress?: () => void;
  eventType?: 'owned' | 'joined' | 'invitation';
  
  eventDetails: EventDetails;
  handleGiftPress: (gift: Gift) => void;
  isChristmasEvent: boolean;
  mainScrollViewRef: React.RefObject<ScrollView>;
  handleBack: () => void;
  copyToClipboard: (text: string) => void;
  handleAccept: () => void;
  handleRefuse: () => void;
  handleRejectJoinRequest: (requestId: string) => void;
  handleAcceptJoinRequest: (requestId: string) => void;
  sheetHeight: Animated.Value;
  sheetState: 'collapsed' | 'mid' | 'expanded';
  panResponder: any;
  showParticipantsView: boolean;
  renderParticipantsView: () => JSX.Element;
  renderGiftsView: () => JSX.Element;
}

// Types pour les animations et gestes
export interface BottomSheetAnimation {
  translateY: Animated.Value;
  backdropOpacity: Animated.Value;
}

export type CreatePanResponderParams = {
  bottomSheetHeight: Animated.Value;
  bottomSheetAnimation: BottomSheetAnimation;
  onRelease: (gestureState: PanResponderGestureState) => void;
};

export type AnimateBottomSheetParams = {
  bottomSheetHeight: Animated.Value;
  targetHeight: number;
  callback?: () => void;
};