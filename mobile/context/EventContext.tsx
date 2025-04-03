import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importer AsyncStorage
import {
  Event,
  PredefinedEvent,
  createEvent,
  getEvent,
  listEvents,
  updateEvent,
  deleteEvent,
  addParticipant,
  updateParticipantStatus,
  addGift,
  getPredefinedEvents,
  createFromPredefinedType
} from '../api/events';
import { useAuth } from '../auth/context/AuthContext';
import { RootStackParamList } from '../types/navigation';

// --- Type pour les brouillons (exporté) ---
export interface DraftEvent { // Ajouter export
  draftId: string; // ID unique du brouillon
  type: 'draft';
  title?: string;
  emoji?: string;
  lastStep?: keyof RootStackParamList;
  eventData: Partial<Event>;
}

const DRAFTS_STORAGE_KEY = '@eventDrafts'; // Clé pour AsyncStorage

interface EventContextProps {
  events: Event[];
  predefinedEvents: PredefinedEvent[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  fetchEvent: (id: string) => Promise<Event | null>;
  fetchPredefinedEvents: () => Promise<void>;
  createNewEvent: (eventData: Omit<Event, 'id' | 'creatorId' | 'createdAt' | 'updatedAt'>) => Promise<Event | null>;
  createFromPredefined: (predefinedType: string, eventData: Partial<Event>) => Promise<Event | null>;
  updateExistingEvent: (id: string, eventData: Partial<Event>) => Promise<Event | null>;
  removeEvent: (id: string) => Promise<boolean>;
  addEventParticipant: (eventId: string, userId: string, role: string) => Promise<boolean>;
  updateEventParticipantStatus: (eventId: string, status: string) => Promise<boolean>;
  addEventGift: (eventId: string, gift: any) => Promise<boolean>;
  // --- Ajouts pour les brouillons ---
  draftEvents: DraftEvent[];
  saveDraft: (draftData: Partial<Event>, lastStep?: keyof RootStackParamList, existingDraftId?: string) => Promise<string | null>; // Retourne l'ID du brouillon sauvegardé/créé
  deleteDraft: (draftId: string) => Promise<boolean>;
}

export const EventContext = createContext<EventContextProps>({
  events: [],
  predefinedEvents: [],
  loading: false,
  error: null,
  fetchEvents: async () => {},
  fetchEvent: async () => null,
  fetchPredefinedEvents: async () => {},
  createNewEvent: async () => null,
  createFromPredefined: async () => null,
  updateExistingEvent: async () => null,
  removeEvent: async () => false,
  addEventParticipant: async () => false,
  updateEventParticipantStatus: async () => false,
  addEventGift: async () => false,
  // --- Valeurs par défaut pour les brouillons ---
  draftEvents: [],
  saveDraft: async () => null,
  deleteDraft: async () => false,
});

export const useEvents = () => useContext(EventContext);

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [predefinedEvents, setPredefinedEvents] = useState<PredefinedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [draftEvents, setDraftEvents] = useState<DraftEvent[]>([]); // État pour les brouillons
  const { user } = useAuth();

  // Fetch all events for the current user (wrapped in useCallback)
  const fetchEvents = useCallback(async () => {
    // Ne pas exécuter si pas d'utilisateur (ou si déjà en chargement?)
    // On garde la dépendance à `user` pour re-fetch si l'utilisateur change.
    if (!user) {
        setEvents([]); // Vider les events si l'utilisateur se déconnecte
        return;
    }
    
    console.log("EventContext: fetchEvents triggered"); // Log de debug
    setLoading(true);
    setError(null);
    
    try {
      const fetchedEvents = await listEvents();
      console.log("EventContext: Events fetched:", fetchedEvents.length); // Log de debug
      setEvents(fetchedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      console.error('Error fetching events:', err);
      setEvents([]); // Vider en cas d'erreur ? Ou garder les anciens ? À discuter.
    } finally {
      setLoading(false);
    }
  }, [user]); // Dépend de `user` pour re-fetch au changement d'utilisateur

  // Fetch a specific event by ID (wrapped in useCallback)
  const fetchEvent = useCallback(async (id: string): Promise<Event | null> => {
    if (!user) return null;
    
    // Peut-être un état de chargement spécifique pour fetchEvent ?
    // setLoading(true);
    setError(null);
    
    try {
      const fetchedEvent = await getEvent(id);
      return fetchedEvent;
    } catch (err: any) {
      setError(err.message || `Failed to fetch event with ID: ${id}`);
      console.error(`Error fetching event ${id}:`, err);
      return null;
    } finally {
      // setLoading(false);
    }
  }, [user]); // Dépend de `user`

  // Fetch predefined events (wrapped in useCallback)
  const fetchPredefinedEvents = useCallback(async () => {
    // Pas besoin de dépendre de `user` ici a priori
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPredefinedEvents = await getPredefinedEvents();
      setPredefinedEvents(fetchedPredefinedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch predefined events');
      console.error('Error fetching predefined events:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Pas de dépendances a priori

  // Create a new event (wrapped in useCallback)
  const createNewEvent = useCallback(async (eventData: Omit<Event, 'id' | 'creatorId' | 'createdAt' | 'updatedAt'>): Promise<Event | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const newEvent = await createEvent(eventData);
      // Mettre à jour l'état local après succès
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      console.error('Error creating event:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]); // Dépend de `user` (pour vérifier l'auth)

  // Create from predefined event type (wrapped in useCallback)
  const createFromPredefined = useCallback(async (predefinedType: string, eventData: Partial<Event>): Promise<Event | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const newEvent = await createFromPredefinedType(predefinedType, eventData);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err: any) {
      setError(err.message || 'Failed to create event from predefined type');
      console.error('Error creating predefined event:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]); // Dépend de `user`

  // Update an existing event (wrapped in useCallback)
  const updateExistingEvent = useCallback(async (id: string, eventData: Partial<Event>): Promise<Event | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedEvent = await updateEvent(id, eventData);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      return updatedEvent;
    } catch (err: any) {
      setError(err.message || `Failed to update event with ID: ${id}`);
      console.error(`Error updating event ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]); // Dépend de `user`

  // Delete an event (wrapped in useCallback)
  const removeEvent = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to delete event with ID: ${id}`);
      console.error(`Error deleting event ${id}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]); // Dépend de `user`

  // Add a participant to an event (wrapped in useCallback)
  // Note: dépend de fetchEvents, qui est maintenant stable grâce à useCallback
  const addEventParticipant = useCallback(async (eventId: string, userId: string, role: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await addParticipant(eventId, { userId, role, status: 'invited' });
      await fetchEvents(); // Refresh events list
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to add participant to event with ID: ${eventId}`);
      console.error(`Error adding participant to event ${eventId}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]); // Dépend de `user` et `fetchEvents`

  // Update participant status (accept/decline invitation) (wrapped in useCallback)
  const updateEventParticipantStatus = useCallback(async (eventId: string, status: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await updateParticipantStatus(eventId, status);
      await fetchEvents(); // Refresh events list
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to update participant status for event with ID: ${eventId}`);
      console.error(`Error updating participant status for event ${eventId}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]); // Dépend de `user` et `fetchEvents`

  // Add a gift to an event (wrapped in useCallback)
  const addEventGift = useCallback(async (eventId: string, gift: any): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await addGift(eventId, gift);
      await fetchEvents(); // Refresh events list
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to add gift to event with ID: ${eventId}`);
      console.error(`Error adding gift to event ${eventId}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchEvents]); // Dépend de `user` et `fetchEvents`

  // --- Fonctions de gestion des brouillons ---

  // Charger les brouillons depuis AsyncStorage
  const loadDrafts = useCallback(async () => {
    if (!user) {
        setDraftEvents([]); // Vider si pas d'utilisateur
        return;
    }
    try {
      const storedDrafts = await AsyncStorage.getItem(`${DRAFTS_STORAGE_KEY}_${user.id}`);
      if (storedDrafts) {
        setDraftEvents(JSON.parse(storedDrafts));
        console.log("EventContext: Drafts loaded from AsyncStorage:", JSON.parse(storedDrafts).length);
      } else {
        setDraftEvents([]);
        console.log("EventContext: No drafts found in AsyncStorage.");
      }
    } catch (e) {
      console.error('EventContext: Failed to load drafts from AsyncStorage', e);
      setError('Failed to load drafts');
      setDraftEvents([]); // Assurer un état vide en cas d'erreur
    }
  }, [user]); // Dépend de l'utilisateur pour charger les brouillons spécifiques

  // Sauvegarder un brouillon (créer ou mettre à jour)
  const saveDraft = useCallback(async (
    eventData: Partial<Event>,
    lastStep?: keyof RootStackParamList,
    existingDraftId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    let draftId = existingDraftId || `draft_${Date.now()}`;
    const newDraft: DraftEvent = {
      draftId,
      type: 'draft',
      title: eventData.title,
      emoji: eventData.emoji,
      lastStep,
      eventData,
    };

    try {
      let updatedDrafts: DraftEvent[];
      if (existingDraftId) {
        // Mettre à jour un brouillon existant
        updatedDrafts = draftEvents.map(d => d.draftId === existingDraftId ? newDraft : d);
      } else {
        // Ajouter un nouveau brouillon
        updatedDrafts = [...draftEvents, newDraft];
      }

      setDraftEvents(updatedDrafts);
      await AsyncStorage.setItem(`${DRAFTS_STORAGE_KEY}_${user.id}`, JSON.stringify(updatedDrafts));
      console.log(`EventContext: Draft ${existingDraftId ? 'updated' : 'saved'} with ID: ${draftId}`);
      return draftId;
    } catch (e) {
      console.error('EventContext: Failed to save draft to AsyncStorage', e);
      setError('Failed to save draft');
      // Revenir à l'état précédent en cas d'erreur de sauvegarde ?
      // setDraftEvents(draftEvents); // Peut causer des problèmes si l'état a déjà changé
      return null;
    }
  }, [user, draftEvents]); // Dépend de l'utilisateur et de l'état actuel des brouillons

  // Supprimer un brouillon
  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const updatedDrafts = draftEvents.filter(d => d.draftId !== draftId);
      setDraftEvents(updatedDrafts);
      await AsyncStorage.setItem(`${DRAFTS_STORAGE_KEY}_${user.id}`, JSON.stringify(updatedDrafts));
      console.log(`EventContext: Draft deleted with ID: ${draftId}`);
      return true;
    } catch (e) {
      console.error('EventContext: Failed to delete draft from AsyncStorage', e);
      setError('Failed to delete draft');
      // Revenir à l'état précédent ?
      // setDraftEvents(draftEvents);
      return false;
    }
  }, [user, draftEvents]); // Dépend de l'utilisateur et de l'état actuel des brouillons

  // --- Fin Fonctions Brouillons ---


  // Load events and drafts when authenticated
  useEffect(() => {
    if (user) {
      console.log("EventContext: User authenticated, fetching events and loading drafts...");
      fetchEvents();
      fetchPredefinedEvents();
      loadDrafts(); // Charger les brouillons
    } else {
      console.log("EventContext: User logged out, clearing events and drafts.");
      setEvents([]); // Vider les événements si déconnecté
      setDraftEvents([]); // Vider les brouillons si déconnecté
    }
  // Les dépendances de useCallback assurent que fetchEvents et fetchPredefinedEvents
  // ne sont pas recréées inutilement, mais sont mises à jour si `user` change.
  // loadDrafts dépend aussi de user.
  }, [user, fetchEvents, fetchPredefinedEvents, loadDrafts]);

  return (
    <EventContext.Provider
      value={{
        events,
        predefinedEvents,
        loading,
        error,
        fetchEvents,
        fetchEvent,
        fetchPredefinedEvents,
        createNewEvent,
        createFromPredefined,
        updateExistingEvent,
        removeEvent,
        addEventParticipant,
        updateEventParticipantStatus,
        addEventGift,
        // --- Export des fonctions brouillons ---
        draftEvents,
        saveDraft,
        deleteDraft,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};