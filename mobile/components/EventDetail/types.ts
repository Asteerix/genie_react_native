export type EventType = 'owned' | 'joined' | 'invitation';

export interface Host {
  id: string;
  name: string;
  avatar: string;
}

export interface JoinRequest {
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
  quantity?: number;
  addedBy?: {
    name: string;
    avatar: string;
  };
}

export interface Time {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  period?: string;
}

export interface Location {
  address: string;
  city: string;
  postalCode: string;
}

export interface Event {
  id: string;
  type?: EventType;
  title: string;
  subtitle?: string;
  date: string;
  color: string;
  image: string;
  location: Location;
  time: Time;
  description?: string;
  hosts?: Host[];
  gifts?: Gift[];
  participants?: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
  }>;
  isCollective: boolean;
  invitedBy?: {
    name: string;
    username: string;
    avatar: string;
  };
}
