import { Animated } from 'react-native';
import { EventDetails, OwnedEventDetails, InvitationEventDetails, JoinedEventDetails, Participant, Gift, EventPropertyType } from './types';

// Utility functions for formatting dates, times and addresses
export const formatEventDate = (day: string, month: string): string => {
  return `${day} ${month}`;
};

export const formatEventTime = (hour: string, minute: string, period?: string): string => {
  if (period) {
    return `${hour}:${minute} ${period}`;
  }
  return `${hour}h${minute}`;
};

export const formatFullAddress = (address: string, city: string, postalCode: string): string => {
  return `${address}, ${postalCode} ${city}`;
};

// Function to copy text to clipboard
export const copyToClipboard = (text: string): void => {
  // In a real app, this would use the Clipboard API
  console.log(`Copied to clipboard: ${text}`);
};

// Type guards
export const isOwnedEvent = (event: EventDetails): event is OwnedEventDetails => {
  return 'type' in event && event.type === 'owned';
};

export const isInvitationEvent = (event: EventDetails): event is InvitationEventDetails => {
  return 'invitedBy' in event;
};

export const isJoinedEvent = (event: EventDetails): event is JoinedEventDetails => {
  return !isOwnedEvent(event) && !isInvitationEvent(event);
};

// Fonctions d'aide pour obtenir les propriétés de l'événement de manière sécurisée
export const getEventProperty = <K extends keyof EventPropertyType>(
  details: EventDetails,
  property: K,
  defaultValue?: EventPropertyType[K]
): EventPropertyType[K] => {
  if (property === 'description') {
    if (isOwnedEvent(details) || isJoinedEvent(details)) {
      return details.description as EventPropertyType[K];
    }
  }
  if (property === 'subtitle') {
    if (isOwnedEvent(details) || isJoinedEvent(details)) {
      return (details.subtitle || '') as EventPropertyType[K];
    }
  }
  if (property === 'invitedBy' && isInvitationEvent(details)) {
    return details.invitedBy as EventPropertyType[K];
  }
  if (property === 'period' && 'period' in details.time) {
    return details.time.period as EventPropertyType[K];
  }
  return defaultValue as EventPropertyType[K];
};

export const getEventParticipants = (details: EventDetails): Participant[] => {
  return isOwnedEvent(details) && details.participants ? details.participants : [];
};

export const getEventGifts = (details: EventDetails): Gift[] => {
  return isOwnedEvent(details) && details.gifts ? details.gifts : [];
};

export const getEventDescription = (details: EventDetails): string => {
  if (isOwnedEvent(details) || isJoinedEvent(details)) {
    return details.description || '';
  }
  return '';
};

export const getEventInvitedBy = (details: EventDetails) => {
  return isInvitationEvent(details) ? details.invitedBy : null;
};

export const getEventSubtitle = (details: EventDetails): string => {
  if (isOwnedEvent(details)) {
    return details.subtitle || '';
  }
  return isJoinedEvent(details) ? (details.subtitle || '') : '';
};

// Fonction pour obtenir la valeur animée actuelle 
export const getAnimatedValue = (animatedValue: Animated.Value): number => {
  const valueObject = animatedValue as any;
  if (typeof valueObject._value === 'number') {
    return valueObject._value;
  }
  return 0; // Valeur par défaut
};