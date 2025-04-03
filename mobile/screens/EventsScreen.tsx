import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  SectionListData,
  DefaultSectionT,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator
} from 'react-native';
import PagerView from 'react-native-pager-view'; // Importer PagerView
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // Ajouter useIsFocused
import { StackNavigationProp } from '@react-navigation/stack';
import { toast } from 'sonner-native';
import BottomTabBar from '../components/BottomTabBar';
import CreateEventModal, { EventDefinition } from '../components/CreateEventModal';
import { useEvents, DraftEvent } from '../context/EventContext';
import { Event, EventParticipant } from '../api/events'; // Importer EventParticipant
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/context/AuthContext'; // Importer useAuth pour l'ID utilisateur

// --- Types ---
interface EventInvitation {
  id: string;
  type: 'invitation'; // Type pour distinguer dans SectionList
  title: string;
  invitedBy: string; // Nom de l'invitant
  date: string; // Date formatée
  emoji: string;
  avatar: string; // Avatar de l'invitant
  // Ajouter les données brutes de l'événement si nécessaire pour la navigation/actions
  rawEventData?: Event;
}

interface EventForRender {
  id: string;
  type: 'event'; // Type pour distinguer dans SectionList
  title: string;
  subtitle: string;
  date: string; // Date formatée
  emoji: string;
  color: string;
  isPastEvent: boolean; // Pour le style
  // Ajouter les données brutes de l'événement si nécessaire
  rawEventData: Event;
}

// Type pour les données de section (incluant DraftEvent)
// Assurer que DraftEvent a une propriété 'type' ou l'ajouter
interface DraftEventWithType extends DraftEvent {
    type: 'draft';
}
type EventSectionData = DraftEventWithType | EventInvitation | EventForRender;


// Type pour les sections de la SectionList
type EventSection = SectionListData<EventSectionData, DefaultSectionT>;


// Utiliser le type général pour permettre la navigation vers n'importe quel écran de la RootStack
type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

// --- Composants d'items mémoïsés (définis en dehors du composant principal) ---
const InvitationItem = memo(({
  invitation,
  onPress,
  onAccept,
  onReject,
}: {
  invitation: EventInvitation;
  onPress: (invitation: EventInvitation) => void; // Passer l'objet complet
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.invitationCard}
      onPress={() => onPress(invitation)}
      activeOpacity={0.9}
    >
      <View style={styles.invitationContent}>
        <View style={[styles.invitationImageContainer, { backgroundColor: '#EFE6FF' }]}>
          <Text style={styles.emojiIcon}>{invitation.emoji}</Text>
          <View style={styles.avatarCircle}>
            <Image source={{ uri: invitation.avatar }} style={styles.avatarImage} />
          </View>
        </View>
        <View style={styles.invitationInfo}>
          <View style={styles.invitationHeaderRow}>
            <Text style={styles.invitationTitle} numberOfLines={1}>{invitation.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </View>
          <View style={styles.invitationUserDetails}>
            <Text style={styles.usernameText} numberOfLines={1}>{invitation.invitedBy}</Text>
            <Text style={styles.inviteText}> vous invite le </Text>
            <View style={styles.dateBadgeGreen}>
              <Text style={styles.dateTextGreen}>{invitation.date}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={(e) => { e.stopPropagation(); onReject(invitation.id); }}
          >
            <MaterialIcons name="close" size={20} color="#FF3B30" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={(e) => { e.stopPropagation(); onAccept(invitation.id); }}
          >
            <MaterialIcons name="check" size={20} color="#34C759" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const EventItem = memo(({
  event,
  onPress,
}: {
  event: EventForRender;
  onPress: (event: EventForRender) => void; // Passer l'objet complet
}) => {
  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => onPress(event)}
      activeOpacity={0.9}
    >
      <View style={[styles.eventImageContainer, { backgroundColor: event.color || '#F0F0F0' }]}>
        <Text style={styles.emojiIcon}>{event.emoji}</Text>
      </View>
      <View style={styles.eventInfo}>
        <View>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.eventSubtitle} numberOfLines={1}>{event.subtitle}</Text>
        </View>
        <View style={styles.eventRightSide}>
          <View style={[
            styles.dateBadge,
            event.isPastEvent ? styles.dateBadgePast : styles.dateBadgeUpcoming
          ]}>
            <Text style={[
              styles.dateText,
              event.isPastEvent ? styles.dateTextPast : styles.dateTextUpcoming
            ]}>
              {event.date}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color="#BDBDBD"
            style={styles.chevronIcon}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const DraftEventItem = memo(({
  draft,
  onContinue,
  onDelete,
}: {
  draft: DraftEventWithType; // Utiliser le type avec 'type'
  onContinue: (draftId: string) => void;
  onDelete: (draftId: string) => void;
}) => {
  return (
    <View style={styles.draftCard}>
      <View style={styles.draftContent}>
        <View style={[styles.draftImageContainer]}>
          <Text style={styles.emojiIcon}>{draft.emoji || '📝'}</Text>
        </View>
        <View style={styles.draftInfo}>
          <Text style={styles.draftTitle} numberOfLines={1}>{draft.title || 'Brouillon d\'événement'}</Text>
          <Text style={styles.draftSubtitle}>Non terminé</Text>
        </View>
        <View style={styles.draftActions}>
          <TouchableOpacity
            style={styles.draftDeleteButton}
            onPress={() => onDelete(draft.draftId)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.draftContinueButton}
            onPress={() => onContinue(draft.draftId)}
          >
            <Text style={styles.draftContinueText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});


const SectionHeader = memo(({ title }: { title: string }) => {
  // Ne pas afficher le header si le titre est vide
  if (!title) return null;
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
});

// --- Composant Principal ---
const EventsScreen = () => {
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const isFocused = useIsFocused(); // Pour recharger quand l'écran est focus
  const { user } = useAuth(); // Pour identifier les événements de l'utilisateur
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    events: backendEvents,
    loading,
    error,
    fetchEvents,
    draftEvents,
    deleteDraft,
    // acceptInvitation: acceptApiInvitation, // Commenté: Fonction non trouvée dans le contexte
    // rejectInvitation: rejectApiInvitation, // Commenté: Fonction non trouvée dans le contexte
  } = useEvents();

  // Animation values
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  // fadeAnim n'est plus nécessaire avec PagerView
  const sectionListRefUpcoming = useRef<SectionList>(null); // Ref pour chaque liste
  const sectionListRefPast = useRef<SectionList>(null);
  const pagerRef = useRef<PagerView>(null); // Ref pour PagerView

  // --- Données Mock pour les invitations (à remplacer par API) ---
  const invitationsMock = useMemo((): EventInvitation[] => [
     {
       id: 'inv1', type: 'invitation', title: 'Anniversaire Surprise', invitedBy: 'audrianatoulet',
       date: '25/04/2025', emoji: '🎉',
       avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20pink%20background&aspect=1:1&seed=12',
       rawEventData: { id: 'evt1', title: 'Anniversaire Surprise', startDate: '2025-04-25T19:00:00Z', type: 'individuel' } as Event // Exemple de données brutes
     }
   ], []);
  // --- Fin Données Mock Invitation ---

  // Recharger les événements quand l'écran est focus ou l'utilisateur change
  useEffect(() => {
    if (isFocused) {
      fetchEvents();
    }
  }, [fetchEvents, isFocused]);

  // Animation de l'indicateur de tabulation
  const translateX = useMemo(() => tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - 24] // Ajusté pour le padding
  }), [tabIndicatorPosition]);

  // Effet pour animer l'indicateur lors du changement d'onglet (via état ou swipe)
  useEffect(() => {
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'upcoming' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 70
    }).start();
    // Le fondu n'est plus nécessaire avec PagerView
    // Le scroll vers le haut est géré par le rendu de chaque page
  }, [activeTab, tabIndicatorPosition]);

  // --- Préparation des données pour SectionList ---
  const sectionsData = useMemo(() => {
    const now = new Date();
    const userId = user?.id;

    // 1. Filtrer les événements backend en "Mes Événements" et "Invitations Reçues"
    const myEvents: Event[] = [];
    const receivedInvitationsRaw: Event[] = []; // Invitations brutes de l'API

    if (userId && backendEvents) {
      backendEvents.forEach(event => {
        const participant = event.participants?.find(p => p.userId === userId);
        if (participant?.role === 'host' || event.creatorId === userId) {
          myEvents.push(event);
        } else if (participant?.status === 'pending') { // Assumer que les invitations sont 'pending'
          receivedInvitationsRaw.push(event);
        }
      });
    }

    // 2. Formater les données pour le rendu
    const mapBackendEventToRenderFormat = (backendEvent: Event, isPast: boolean): EventForRender => ({
      id: backendEvent.id || `fallback-${Math.random()}`,
      type: 'event',
      title: backendEvent.title,
      subtitle: backendEvent.subtitle || '',
      date: new Date(backendEvent.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      emoji: backendEvent.emoji || '🎉',
      color: backendEvent.color || '#E0F7FF',
      isPastEvent: isPast,
      rawEventData: backendEvent,
    });

    // Formater les invitations reçues
    const formattedInvitations: EventInvitation[] = receivedInvitationsRaw.map(event => {
         const inviter = event.participants?.find(p => p.role === 'host') || { userId: event.creatorId || 'unknown' };
         const inviterName = `Utilisateur ${inviter.userId.substring(0, 4)}`; // Placeholder
         const inviterAvatar = 'https://api.a0.dev/assets/image?text=user&aspect=1:1'; // Placeholder

        return {
            id: event.id || `inv-${Math.random()}`,
            type: 'invitation',
            title: event.title,
            invitedBy: inviterName,
            date: new Date(event.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            emoji: event.emoji || '💌',
            avatar: inviterAvatar,
            rawEventData: event,
        };
    });

    // Utiliser les invitations mockées si l'API ne les fournit pas encore
    const finalInvitations = formattedInvitations.length > 0 ? formattedInvitations : invitationsMock;


    // 3. Séparer "Mes Événements" en à venir et passés
    const upcomingMyEvents = myEvents
      .filter(event => new Date(event.startDate) >= now)
      .map(event => mapBackendEventToRenderFormat(event, false));

    const pastMyEvents = myEvents
      .filter(event => new Date(event.startDate) < now)
      .map(event => mapBackendEventToRenderFormat(event, true));

    // 4. Construire les sections pour l'onglet "À venir" dans l'ordre demandé
    const upcomingSections: EventSection[] = [];
    // Section 1: Brouillons (si existants)
    if (draftEvents.length > 0) {
      // Ajouter le type 'draft' aux données de brouillon
      const draftDataWithType: DraftEventWithType[] = draftEvents.map(d => ({ ...d, type: 'draft' }));
      upcomingSections.push({ title: 'Brouillons', data: draftDataWithType });
    }
    // Section 2: Mes Événements (si existants)
    if (upcomingMyEvents.length > 0) {
      upcomingSections.push({ title: 'Mes Événements', data: upcomingMyEvents });
    }
    // Section 3: Mes Invitations (si existantes)
     if (finalInvitations.length > 0) {
      upcomingSections.push({ title: 'Mes Invitations', data: finalInvitations });
    }


    const pastSections: EventSection[] = [];
    if (pastMyEvents.length > 0) {
      // Pour les souvenirs, un seul titre suffit généralement
      pastSections.push({ title: '', data: pastMyEvents }); // Titre vide pour ne pas l'afficher
    }

    return { upcoming: upcomingSections, past: pastSections };

  }, [backendEvents, draftEvents, user?.id, invitationsMock]); // Ajouter user?.id et invitationsMock aux dépendances

  const displayedSections = activeTab === 'upcoming' ? sectionsData.upcoming : sectionsData.past;
  // --- Fin Préparation des données ---


  // --- Callbacks mémoïsés ---
  const handleSearch = useCallback(() => {
    navigation.navigate('EventSearch');
  }, [navigation]);

  const handleCreateEvent = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleAcceptInvitation = useCallback(async (invitationId: string) => {
    const invitation = invitationsMock.find(inv => inv.id === invitationId) || sectionsData.upcoming.flatMap(s => s.data).find(item => item.type === 'invitation' && item.id === invitationId) as EventInvitation | undefined;
    const eventId = invitation?.rawEventData?.id;
    if (!eventId) { toast.error("Détails invitation introuvables."); return; }
    console.warn("Logique d'acceptation à implémenter.");
    toast.info("Fonctionnalité en cours de dev.");
  }, [fetchEvents, invitationsMock, sectionsData]); // Retirer acceptApiInvitation

  const handleRejectInvitation = useCallback(async (invitationId: string) => {
     const invitation = invitationsMock.find(inv => inv.id === invitationId) || sectionsData.upcoming.flatMap(s => s.data).find(item => item.type === 'invitation' && item.id === invitationId) as EventInvitation | undefined;
     const eventId = invitation?.rawEventData?.id;
     if (!eventId) { toast.error("Détails invitation introuvables."); return; }
     console.warn("Logique de refus à implémenter.");
     toast.info("Fonctionnalité en cours de dev.");
  }, [fetchEvents, invitationsMock, sectionsData]); // Retirer rejectApiInvitation

  const handleInvitationPress = useCallback((invitation: EventInvitation) => {
    if (invitation.rawEventData?.id) {
        console.log("Navigating to event detail for invitation:", invitation.rawEventData.id);
        navigation.navigate('EventDetail', { eventId: invitation.rawEventData.id });
    } else {
        console.warn("Missing raw event data for invitation:", invitation.id);
        toast.info("Détails de l'événement non disponibles.");
    }
  }, [navigation]);

  const handleEventPress = useCallback((event: EventForRender) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  }, [navigation]);

  // Nouveau: Gérer le changement d'onglet via les boutons
  const handleTabChange = useCallback((newTab: 'upcoming' | 'past') => {
    setActiveTab(newTab);
    pagerRef.current?.setPage(newTab === 'upcoming' ? 0 : 1); // Changer la page du PagerView
  }, []);

  // Nouveau: Gérer le changement de page via le swipe du PagerView
  const onPageSelected = useCallback((e: any) => {
    const newPage = e.nativeEvent.position;
    // Mettre à jour l'onglet actif sans redéclencher setPage
    if (newPage === 0 && activeTab !== 'upcoming') {
        setActiveTab('upcoming');
    } else if (newPage === 1 && activeTab !== 'past') {
        setActiveTab('past');
    }
  }, [activeTab]);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleEventSelectedFromModal = useCallback((selectedEvent: EventDefinition) => {
    setShowCreateModal(false);
    const initialEventData: Partial<Event> = {
      title: selectedEvent.name,
      type: selectedEvent.type,
      emoji: selectedEvent.icon,
      predefinedType: selectedEvent.id,
    };
    console.log(`LOG: Predefined event selected: ${selectedEvent.name} (Type: ${selectedEvent.type}). Navigating.`);
    if (selectedEvent.type === 'individuel') {
      navigation.navigate('EventHostModal', { eventData: initialEventData });
    } else {
      navigation.navigate('EventDateModal', { eventData: initialEventData });
    }
  }, [navigation]);

  const handleContinueDraft = useCallback((draftId: string) => {
    const draft = draftEvents.find(d => d.draftId === draftId);
    if (!draft) { console.warn(`Draft ${draftId} not found.`); return; }
    const targetScreen = draft.lastStep || 'CreateEventModal';
    const params = { eventData: draft.eventData, isDraft: true, draftId: draft.draftId };
    console.log("Continuing draft:", draftId, "Target:", targetScreen);
    switch (targetScreen) {
        case 'EventTitleModal': navigation.navigate('EventTitleModal', params); break;
        case 'EventHostModal': navigation.navigate('EventHostModal', params); break;
        case 'EventDateModal': navigation.navigate('EventDateModal', params); break;
        case 'EventOptionalInfoModal': navigation.navigate('EventOptionalInfoModal', params); break;
        case 'EventIllustration': navigation.navigate('EventIllustration', params); break;
        default: console.error(`Unknown screen ${targetScreen}`); navigation.navigate('Events'); break;
    }
  }, [navigation, draftEvents]);

  const handleDeleteDraft = useCallback(async (draftId: string) => {
    const success = await deleteDraft(draftId);
    toast[success ? 'success' : 'error'](success ? 'Brouillon supprimé' : 'Erreur suppression');
  }, [deleteDraft]);
  // --- Fin Callbacks ---


  // --- Rendu Item pour SectionList ---
  const renderListItem = useCallback(({ item }: { item: EventSectionData }) => {
    // Vérifier le type ajouté pour DraftEvent
    if (item.type === 'draft') {
      return <DraftEventItem draft={item} onContinue={handleContinueDraft} onDelete={handleDeleteDraft} />;
    } else if (item.type === 'invitation') {
      return <InvitationItem invitation={item} onPress={handleInvitationPress} onAccept={handleAcceptInvitation} onReject={handleRejectInvitation} />;
    } else if (item.type === 'event') {
      return <EventItem event={item} onPress={handleEventPress} />;
    }
    return null; // Ne devrait pas arriver si les types sont corrects
  }, [handleContinueDraft, handleDeleteDraft, handleInvitationPress, handleAcceptInvitation, handleRejectInvitation, handleEventPress]);
  // --- Fin Rendu Item ---


  // --- Fin Rendu Item ---

  // --- Fonction pour rendre le contenu d'une page (onglet) ---
  const renderPageContent = useCallback((tabType: 'upcoming' | 'past') => {
    const sections = tabType === 'upcoming' ? sectionsData.upcoming : sectionsData.past;
    const listRef = tabType === 'upcoming' ? sectionListRefUpcoming : sectionListRefPast;

    if (loading && sections.length === 0) {
      return (
        <View style={styles.loadingIndicator}>
           <ActivityIndicator size="large" color="#000000" />
           <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      );
    }
    if (error && sections.length === 0) {
      return (
         <View style={styles.errorState}>
           <Ionicons name="cloud-offline-outline" size={60} color="#FF3B30" />
           <Text style={styles.errorStateText}>Impossible de charger</Text>
           <TouchableOpacity onPress={fetchEvents} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
           </TouchableOpacity>
         </View>
      );
    }

    return (
      <SectionList
        ref={listRef}
        sections={sections}
        renderItem={renderListItem}
        renderSectionHeader={({ section: { title } }) => <SectionHeader title={title} />}
        keyExtractor={(item: EventSectionData, index: number) => {
            const keyId = item.type === 'draft' ? item.draftId : item.id;
            return `${item.type}-${keyId ?? index}`;
        }}
        style={styles.sectionList}
        contentContainerStyle={styles.scrollContentContainer}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>
                {tabType === 'upcoming' ? "Aucun événement à venir" : "Aucun souvenir"}
              </Text>
            </View>
          ) : null
        }
      />
    );
  }, [loading, error, sectionsData, renderListItem, fetchEvents]);
  // --- Fin Rendu Page ---

  // --- Rendu Principal ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Événements</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate<any>('OngoingPurchases')}>
            <Ionicons name="gift-outline" size={26} color="black" />
            <View style={styles.badgeContainer}><Text style={styles.badgeText}>2</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.addButton]} onPress={handleCreateEvent} activeOpacity={0.7}>
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <Animated.View style={[styles.tabIndicator, { transform: [{ translateX }] }]} />
          <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('upcoming')} activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>À venir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton} onPress={() => handleTabChange('past')} activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Souvenirs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content - SectionList */}
      <Animated.View style={[styles.content]}>
        {loading && displayedSections.length === 0 ? (
          <View style={styles.loadingIndicator}>
             <ActivityIndicator size="large" color="#000000" />
             <Text style={styles.loadingText}>Chargement des événements...</Text>
          </View>
        ) : error && displayedSections.length === 0 ? (
           <View style={styles.errorState}>
             <Ionicons name="cloud-offline-outline" size={60} color="#FF3B30" />
             <Text style={styles.errorStateText}>Impossible de charger les événements</Text>
             <TouchableOpacity onPress={fetchEvents} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
             </TouchableOpacity>
           </View>
        ) : (
          <SectionList
          ref={activeTab === 'upcoming' ? sectionListRefUpcoming : sectionListRefPast}
            sections={displayedSections}
            renderItem={renderListItem}
            renderSectionHeader={({ section: { title } }) => <SectionHeader title={title} />}
            keyExtractor={(item: EventSectionData, index: number) => { // Ajouter index pour robustesse
                if (item.type === 'draft') {
                    // Assurer que draftId existe sur DraftEvent
                    return `draft-${item.draftId}`;
                }
                // Pour les autres types (event, invitation), utiliser item.id
                // S'assurer que item.id existe pour ces types
                // Utiliser l'index comme fallback si id est manquant (ne devrait pas arriver)
                return `${item.type}-${item.id ?? index}`;
            }}
            style={styles.sectionList}
            contentContainerStyle={styles.scrollContentContainer}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={60} color="#CCCCCC" />
                  <Text style={styles.emptyStateText}>
                    {activeTab === 'upcoming' ? "Aucun événement à venir" : "Aucun souvenir pour le moment"}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </Animated.View>


      <BottomTabBar activeTab="events" />

      {/* Create Event Modal */}
      {showCreateModal ? (
        <CreateEventModal
          visible={showCreateModal}
          onClose={handleCloseModal}
          onEventSelect={handleEventSelectedFromModal}
        />
      ) : null}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fond blanc général
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 15 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 15, // Réduit
    backgroundColor: '#FFFFFF', // Assurer un fond blanc pour le header
  },
  headerTitle: {
    fontSize: 30, // Légèrement réduit
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold', // Utiliser bold
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Ajoute un petit espace entre les icônes
  },
  iconButton: {
    width: 44, // Légèrement plus grand pour le toucher
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22, // Rond
    position: 'relative', // Pour positionner le badge
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'black', // Fond noir pour le badge
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF', // Bordure blanche
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#000000', // Fond noir pour le bouton "+"
  },
  tabContainerWrapper: {
     paddingHorizontal: 20,
     paddingBottom: 15, // Espace avant le contenu
     backgroundColor: '#FFFFFF', // Assure la continuité du fond blanc
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 25, // Plus arrondi
    backgroundColor: '#F0F0F0', // Fond gris clair pour le conteneur des onglets
    height: 44, // Hauteur ajustée
    position: 'relative',
    padding: 4, // Padding interne pour l'indicateur
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%', // Prend la moitié de la largeur
    height: '100%',
    backgroundColor: '#000000', // Indicateur noir
    borderRadius: 21, // Arrondi correspondant au conteneur - padding
    top: 4, // Positionné selon le padding
    left: 4, // Positionné selon le padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 21, // Correspond à l'indicateur
    zIndex: 1, // Au-dessus de l'indicateur
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666666', // Texte gris pour l'onglet inactif
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  activeTabText: {
    color: '#FFFFFF', // Texte blanc pour l'onglet actif
    fontWeight: '600', // Un peu plus gras
  },
  pagerView: { // Style pour PagerView
    flex: 1,
  },
  pageStyle: { // Style pour chaque page dans PagerView
    flex: 1,
  },
  content: { // Style pour le conteneur de contenu (maintenant utilisé par PagerView)
    flex: 1,
  },
   sectionList: {
    // flex: 1, // Retiré - Le parent 'content' gère déjà le flex space
  },
  scrollContentContainer: {
     paddingHorizontal: 20, // Padding pour le contenu scrollable
     paddingTop: 10, // Petit espace en haut
     paddingBottom: 80, // Espace pour la BottomTabBar
     flexGrow: 1, // Permet au contenu de remplir l'espace si court
  },
  sectionHeader: {
    marginBottom: 15, // Espace après le titre de section
    marginTop: 10, // Espace avant le titre (sauf le premier)
  },
  sectionTitle: {
    fontSize: 22, // Taille ajustée
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    color: '#000000',
  },

  /* Styles pour les invitations */
  invitationCard: {
    backgroundColor: '#FFFFFF', // Fond blanc
    borderRadius: 16, // Arrondi
    marginBottom: 15, // Espace entre les cartes
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, // Très légère
    shadowRadius: 10,
    elevation: 3,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible', // Gérer l'ombre sur Android
    borderWidth: Platform.OS === 'android' ? 0.5 : 0, // Bordure fine sur Android pour l'ombre
    borderColor: Platform.OS === 'android' ? '#E0E0E0' : 'transparent',
  },
  invitationContent: {
    flexDirection: 'row',
    alignItems: 'center', // Aligner verticalement
    padding: 12, // Padding interne réduit
  },
  invitationImageContainer: {
    width: 65, // Taille réduite
    height: 65, // Taille réduite
    borderRadius: 12, // Arrondi réduit
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Espace réduit
    position: 'relative',
    backgroundColor: '#F3EFFF', // Fond violet très clair (ajuster si besoin)
  },
  emojiIcon: {
    fontSize: 30, // Taille réduite
  },
  avatarCircle: {
    position: 'absolute',
    bottom: -6, // Ajusté pour la nouvelle taille
    left: -6,  // Ajusté pour la nouvelle taille
    width: 30,  // Taille réduite
    height: 30, // Taille réduite
    borderRadius: 15, // Moitié de la taille
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4, // Pour Android
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  invitationInfo: {
    flex: 1, // Prend l'espace restant
    justifyContent: 'center',
    marginRight: 10, // Espace avant les boutons d'action
  },
  invitationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Espace le titre et la flèche
    alignItems: 'center',
    marginBottom: 3, // Espace réduit
  },
  invitationTitle: {
    fontSize: 17, // Taille ajustée
    fontWeight: '600', // Semi-bold
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    flexShrink: 1, // Permet au titre de réduire si besoin
  },
  invitationUserDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Permet le retour à la ligne si nécessaire
  },
  usernameText: {
    fontSize: 14, // Taille réduite
    color: '#555', // Gris un peu plus foncé
    marginRight: 4,
    flexShrink: 1,
  },
  inviteText: {
    fontSize: 14, // Taille réduite
    color: '#555',
    marginRight: 4,
  },
  dateBadgeGreen: {
    backgroundColor: '#E8F8E8', // Fond vert clair
    borderRadius: 12, // Arrondi
    paddingVertical: 4, // Padding réduit
    paddingHorizontal: 10, // Padding réduit
    alignSelf: 'flex-start', // S'adapte au contenu
  },
  dateTextGreen: {
    fontSize: 12, // Taille réduite
    color: '#34C759', // Vert correspondant
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row', // Garder en ligne pour l'instant, ajuster si besoin
    alignItems: 'center',
  },
  rejectButton: {
    width: 38, // Taille réduite
    height: 38, // Taille réduite
    borderRadius: 19, // Rond
    backgroundColor: '#FFF0F0', // Fond rouge très clair
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // Espace réduit
  },
  acceptButton: {
    width: 38, // Taille réduite
    height: 38, // Taille réduite
    borderRadius: 19, // Rond
    backgroundColor: '#F0FFF0', // Fond vert très clair
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Styles pour les événements */
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center', // Aligner verticalement
    backgroundColor: '#FFFFFF', // Fond blanc
    borderRadius: 16,
    padding: 12,
    marginBottom: 12, // Espace réduit
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    borderWidth: Platform.OS === 'android' ? 0.5 : 0,
    borderColor: Platform.OS === 'android' ? '#E0E0E0' : 'transparent',
  },
  eventImageContainer: {
    width: 65, // Taille cohérente avec invitations
    height: 65,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 17, // Cohérent avec invitations
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    marginBottom: 3, // Espace sous le titre
  },
  eventSubtitle: {
    fontSize: 14, // Cohérent avec invitations
    color: '#666', // Gris standard
  },
  eventRightSide: {
    flexDirection: 'row', // Aligner badge et flèche horizontalement
    alignItems: 'center',
  },
  dateBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8, // Espace avant la flèche
  },
  dateBadgeUpcoming: {
     backgroundColor: '#E8F8E8', // Vert clair pour à venir
  },
  dateBadgePast: {
     backgroundColor: '#FFF5E6', // Orange clair pour souvenirs
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateTextUpcoming: {
     color: '#34C759', // Vert
  },
  dateTextPast: {
     color: '#FF9500', // Orange
  },
  chevronIcon: {
    // Pas de style spécifique nécessaire si aligné correctement par le parent
  },

  emptyState: {
    flex: 1, // Prend l'espace disponible
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50, // Espace vertical
    minHeight: 200, // Hauteur minimale pour centrer
  },
  emptyStateText: {
    fontSize: 16, // Taille ajustée
    color: '#999',
    marginTop: 15, // Espace réduit
    textAlign: 'center',
    paddingHorizontal: 20, // Empêcher le texte de toucher les bords
  },
  loadingIndicator: {
    flex: 1, // Prend l'espace disponible
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorState: {
    flex: 1, // Prend l'espace disponible
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  errorStateText: {
    fontSize: 16,
    color: '#FF3B30', // Rouge pour l'erreur
    marginTop: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
     backgroundColor: '#007AFF', // Bleu standard pour le bouton
     paddingVertical: 10,
     paddingHorizontal: 20,
     borderRadius: 20,
  },
  retryButtonText: {
     color: '#FFFFFF',
     fontSize: 14,
     fontWeight: '600',
 },

 /* Styles pour les brouillons */
 draftCard: {
   backgroundColor: '#F8F8F8', // Fond gris clair pour distinguer
   borderRadius: 16,
   marginBottom: 15,
   borderWidth: 1,
   borderColor: '#EFEFEF', // Bordure légère
 },
 draftContent: {
   flexDirection: 'row',
   alignItems: 'center',
   padding: 12,
 },
 draftImageContainer: {
   width: 65,
   height: 65,
   borderRadius: 12,
   justifyContent: 'center',
   alignItems: 'center',
   marginRight: 12,
   backgroundColor: '#EAEAEA', // Fond gris un peu plus foncé
 },
 draftInfo: {
   flex: 1,
   justifyContent: 'center',
   marginRight: 10,
 },
 draftTitle: {
   fontSize: 17,
   fontWeight: '600',
   color: '#333', // Couleur plus sombre que le sous-titre
   marginBottom: 3,
 },
 draftSubtitle: {
   fontSize: 14,
   color: '#888', // Gris moyen
 },
 draftActions: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 draftDeleteButton: {
   width: 38,
   height: 38,
   borderRadius: 19,
   backgroundColor: '#F0F0F0', // Fond gris clair
   justifyContent: 'center',
   alignItems: 'center',
   marginRight: 8,
 },
 draftContinueButton: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#000000', // Bouton noir
   borderRadius: 19,
   paddingVertical: 8,
   paddingHorizontal: 12,
 },
 draftContinueText: {
   color: 'white',
   fontSize: 13,
   fontWeight: '600',
   marginRight: 4,
  }
});

export default EventsScreen;
