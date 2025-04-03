import api from '../services/api';
import axios from 'axios';

// Configuration d'une instance axios spécifique pour les événements
// (car le backend Go n'a pas encore les endpoints)
const eventsApi = axios.create({
  baseURL: 'http://localhost:3000'
});

export interface EventLocation {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface EventParticipant {
  userId: string;
  role: string; // host, guest, etc.
  status: string; // invited, confirmed, declined
  invitedAt: string;
  respondedAt?: string;
}

export interface EventGift {
  id?: string;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  productUrl?: string;
  assignedTo?: string; // ID de l'utilisateur auquel le cadeau est assigné (pour événements individuels)
  status: 'available' | 'reserved' | 'purchased' | 'contributed'; // Statut du cadeau
  createdAt: string;
  updatedAt: string;
  // Nouvelles propriétés pour les fonctionnalités avancées
  isPinned?: boolean; // Si le cadeau est épinglé en haut
  isCollaborative?: boolean; // Si c'est un cadeau participatif
  currentAmount?: number; // Montant actuel collecté pour un cadeau collaboratif
  targetAmount?: number; // Montant cible pour un cadeau collaboratif (peut être égal à price)
  // isBought peut être dérivé de status === 'purchased'
  // isReserved peut être dérivé de status === 'reserved'
}

export interface Event {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: 'collectif' | 'individuel' | 'special';
  predefinedType?: string; // identifiant de l'événement prédéfini
  emoji?: string;
  color?: string;
  illustration?: string;
  backgroundImage?: string; // Nouvelle propriété pour l'image de fond
  startDate: string; // ISO format
  endDate?: string; // ISO format
  allDay: boolean;
  location?: EventLocation;
  creatorId?: string;
  participants: EventParticipant[];
  gifts?: EventGift[];
  isPrivate: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Interface pour les événements prédéfinis du système
export interface PredefinedEvent {
  id: string;
  name: string;
  type: 'collectif' | 'individuel' | 'special';
  icon: string;
  emojis: string[];
  defaultDate?: string;
  invitations: string;
  info?: string;
  dateFormat?: string;
}

// Ces événements sont stockés localement pour l'instant
let localEvents: Event[] = [];

// API simulée jusqu'à ce que le backend soit prêt
const mockApi = {
  events: localEvents,
  
  addEvent: (event: Event) => {
    event.id = Date.now().toString();
    event.createdAt = new Date().toISOString();
    event.updatedAt = new Date().toISOString();
    localEvents.push(event);
    return event;
  },
  
  getEvents: () => {
    return localEvents;
  },
  
  getEvent: (id: string) => {
    return localEvents.find(e => e.id === id);
  },
  
  updateEvent: (id: string, eventData: Partial<Event>) => {
    const index = localEvents.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    localEvents[index] = {
      ...localEvents[index],
      ...eventData,
      updatedAt: new Date().toISOString()
    };
    
    return localEvents[index];
  },
  
  deleteEvent: (id: string) => {
    const index = localEvents.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    localEvents.splice(index, 1);
    return true;
  }
};

// Create a new event
export const createEvent = async (eventData: Omit<Event, 'id' | 'creatorId' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  // Ne plus utiliser le fallback local. L'erreur sera gérée par le contexte.
  console.log("API CALL: Attempting to create event via POST /api/events with data:", JSON.stringify(eventData, null, 2));
  try {
      const response = await api.post('/api/events', eventData);
      console.log("API CALL: Event created successfully via backend API:", response.data);
      return response.data as Event;
  } catch (error: any) {
      console.error("API CALL ERROR: Failed to create event via backend API:", error.response?.data || error.message);
      // Propager l'erreur pour qu'elle soit gérée par le contexte/appelant
      throw new Error(error.response?.data?.error || error.message || 'Failed to create event');
  }
};

// Get event by ID
export const getEvent = async (eventId: string): Promise<Event> => {
  // Ne plus utiliser le fallback local.
  console.log(`API CALL: Attempting to get event via GET /api/events/${eventId}`);
  try {
      const response = await api.get(`/api/events/${eventId}`);
      return response.data as Event;
  } catch (error: any) {
      console.error(`API CALL ERROR: Failed to get event ${eventId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get event');
  }
};

// Get list of events for the current user
export const listEvents = async (): Promise<Event[]> => {
  // Ne plus utiliser le fallback local.
  console.log("API CALL: Attempting to list events via GET /api/events/list");
  try {
      const response = await api.get('/api/events/list');
      return response.data as Event[];
  } catch (error: any) {
      console.error("API CALL ERROR: Failed to list events:", error.response?.data || error.message);
      // Retourner un tableau vide ou propager l'erreur ? Propager pour l'instant.
      throw new Error(error.response?.data?.error || error.message || 'Failed to list events');
      // Alternative: return [];
  }
};

// Update an existing event
export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
  // Ne plus utiliser le fallback local.
  console.log(`API CALL: Attempting to update event via PUT /api/events/${eventId}`);
  try {
      const response = await api.put(`/api/events/${eventId}`, eventData);
      return response.data as Event;
  } catch (error: any) {
      console.error(`API CALL ERROR: Failed to update event ${eventId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to update event');
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<void> => {
  // Ne plus utiliser le fallback local.
  console.log(`API CALL: Attempting to delete event via DELETE /api/events/${eventId}`);
   try {
      await api.delete(`/api/events/${eventId}`);
  } catch (error: any) {
      console.error(`API CALL ERROR: Failed to delete event ${eventId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete event');
  }
};

// Add a participant to an event
export const addParticipant = async (eventId: string, participant: Omit<EventParticipant, 'invitedAt'>): Promise<void> => {
  // Ne plus utiliser le fallback local.
  console.log(`API CALL: Attempting to add participant via POST /api/events/${eventId}/participants`);
  try {
      await api.post(`/api/events/${eventId}/participants`, participant);
  } catch (error: any) {
      console.error(`API CALL ERROR: Failed to add participant to event ${eventId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to add participant');
  }
};

// Update participant status (accept/decline invitation)
export const updateParticipantStatus = async (eventId: string, status: string): Promise<void> => {
  // Ne plus utiliser le fallback local.
  // Note: L'endpoint attend probablement l'ID du participant ou utilise le token pour identifier l'utilisateur courant.
  // L'implémentation actuelle envoie juste le statut, à vérifier avec le backend.
  console.log(`API CALL: Attempting to update participant status via PUT /api/events/${eventId}/participants/status`);
  try {
      await api.put(`/api/events/${eventId}/participants/status`, { status });
  } catch (error: any) {
      console.error(`API CALL ERROR: Failed to update participant status for event ${eventId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to update participant status');
  }
};

// Add a gift to an event
export const addGift = async (eventId: string, gift: Omit<EventGift, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  // Ne plus utiliser le fallback local.
  console.log(`API CALL: Attempting to add gift via POST /api/events/${eventId}/gifts`);
  try {
      await api.post(`/api/events/${eventId}/gifts`, gift);
  } catch (error: any) {
      console.error(`API CALL ERROR: Failed to add gift to event ${eventId}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to add gift');
  }
};

// Événements prédéfinis mockés pour le développement local
const mockPredefinedEvents: PredefinedEvent[] = [
  {
    id: "noel",
    name: "Noël",
    type: "collectif",
    icon: "🎄",
    emojis: ["🎄", "🎅", "☃️", "❄️"],
    defaultDate: "25 Décembre",
    invitations: "Tous le monde"
  },
  {
    id: "anniversaire",
    name: "Anniversaire",
    type: "individuel",
    icon: "🎂",
    emojis: ["🎂", "🎉", "🍰", "🥳"],
    invitations: "Tous le monde",
    info: "C'est l'anniversaire de...",
    dateFormat: "personal"
  }
  // Autres événements prédéfinis...
];
// Get all predefined events
export const getPredefinedEvents = async (): Promise<PredefinedEvent[]> => {
  try {
    // Utiliser l'API backend pour récupérer les événements prédéfinis
    const response = await api.get<PredefinedEvent[]>('/api/events/predefined'); // Ajouter /api
    const predefinedEvents = response.data;
    console.log("Événements prédéfinis récupérés avec succès:", predefinedEvents.length);
    
    // Transformer les IDs au format du frontend si nécessaire
    const events = predefinedEvents.map((event: PredefinedEvent) => ({
      ...event,
      // Convert any IDs with underscores to hyphens for frontend compatibility
      id: event.id.replace(/_/g, '-')
    }));
    
    return events;
  } catch (error) {
    console.error("Erreur lors de la récupération des événements prédéfinis:", error);
    console.log("Utilisation des événements prédéfinis mockés");
    // Retourner les événements mockés en cas d'erreur
    return mockPredefinedEvents;
  }
};

// Create an event from a predefined type
export const createFromPredefinedType = async (
  predefinedType: string,
  eventData: Partial<Event>
): Promise<Event> => {
  // Ne plus utiliser le fallback local.
  console.log(`API CALL: Attempting to create predefined event via POST /api/events/predefined/${predefinedType}`);
  try {
      // Préparer les données minimales nécessaires
      const data = {
        ...eventData,
        title: eventData.title || '', // Assurer que title est présent
        startDate: eventData.startDate || new Date().toISOString(),
        allDay: eventData.allDay !== undefined ? eventData.allDay : true,
        participants: eventData.participants || [],
        isPrivate: eventData.isPrivate !== undefined ? eventData.isPrivate : false,
      };
      const response = await api.post(`/api/events/predefined/${predefinedType}`, data);
      console.log("Événement prédéfini créé avec succès:", response.data);
      return response.data as Event;
  } catch (error: any) {
      console.error(`API CALL ERROR: Failed to create predefined event ${predefinedType}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to create predefined event');
  }
};