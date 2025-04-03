import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView, // Garder pour la bottom sheet
  Platform,
  Animated, // Rétablir pour la bottom sheet
  Dimensions,
  PanResponder, // Rétablir pour la bottom sheet
  StatusBar,
  ActivityIndicator,
  ImageBackground // Garder pour le fond global
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Importer LinearGradient
import EventGiftDetailModal from '../components/EventGiftDetailModal'; // Rétablir l'import
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useEvents } from '../context/EventContext';
import { useProfile } from '../context/ProfileContext'; // Importer useProfile
import { useWishlist } from '../context/WishlistContext'; // Importer useWishlist
import { Event, EventParticipant, EventGift, EventLocation } from '../api/events';

// Importer les composants et styles
import EventDetailBottomSheetContent from './EventDetailScreen/components/EventDetailBottomSheetContent'; // Rétablir l'import
// Ne plus importer EventDetailHeader
import { styles as importedStyles, MODAL_HEIGHTS } from './EventDetailScreen/styles/EventDetailScreen.styles'; // Rétablir l'import

// --- Types ---
type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
type EventDetailNavigationProp = StackNavigationProp<RootStackParamList>;
type EventDetails = Event;

// Définir les types attendus par les composants enfants (mapping depuis les types API)
// Supprimer la définition locale de ParticipantForHeader
interface GiftForSheet {
    id: string; name: string; price: string; image: string; isFavorite: boolean;
    addedBy?: { name: string; avatar: string; }; quantity?: number;
    // Nouvelles propriétés pour les fonctionnalités demandées
    isPinned?: boolean;
    isCollaborative?: boolean;
    currentAmount?: number;
    targetAmount?: number;
    isBought?: boolean;
    isReserved?: boolean;
}
// --- Fin Types ---

const { height } = Dimensions.get('window'); // Rétablir nom original
const SHEET_HEIGHT_SMALL = MODAL_HEIGHTS.SMALL; // Rétablir
const SHEET_HEIGHT_MEDIUM = MODAL_HEIGHTS.MEDIUM; // Rétablir
const SHEET_HEIGHT_FULL = MODAL_HEIGHTS.FULL; // Rétablir

// Redéfinir ParticipantForHeader ici car il est utilisé par les composants enfants
// et n'est plus défini localement dans EventDetailScreen
interface ParticipantForHeader {
  id: string;
  name: string;
  username?: string;
  avatar: string;
}


const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation<EventDetailNavigationProp>();
  const route = useRoute<EventDetailRouteProp>();
  const { eventId } = route.params || {};

  const { events, loading: eventsLoading, error: eventsError, fetchEvents } = useEvents();
  const { currentUser, managedAccounts } = useProfile(); // Récupérer infos profil
  const { wishlists, wishItems } = useWishlist(); // Récupérer wishlists et wishes de l'utilisateur

  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false); // Rétablir
  const [selectedGifts, setSelectedGifts] = useState<{ [key: string]: boolean }>({}); // Rétablir
  const [showGiftDetailModal, setShowGiftDetailModal] = useState(false); // Rétablir
  const [selectedGift, setSelectedGift] = useState<GiftForSheet | null>(null); // Rétablir
  const [bottomSheetViewMode, setBottomSheetViewMode] = useState<'gifts' | 'participants' | 'settings'>('gifts'); // Rétablir
  const [selectedParticipantIdForGifts, setSelectedParticipantIdForGifts] = useState<string | null>(null); // Rétablir

  const bottomSheetScrollViewRef = useRef<ScrollView>(null); // Rétablir
  const sheetHeight = useRef(new Animated.Value(SHEET_HEIGHT_MEDIUM)).current; // Rétablir
  const [sheetState, setSheetState] = useState(1); // Rétablir

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) { setError("ID d'événement manquant."); setLoading(false); return; }
      setLoading(true); setError(null);
      let foundEvent = events.find(event => event.id === eventId);
      if (!foundEvent && !eventsLoading) {
        try { await fetchEvents(); } catch (fetchErr: any) { setError(fetchErr.message || "Erreur fetch."); setLoading(false); return; }
      }
      foundEvent = events.find(event => event.id === eventId);

      if (foundEvent) {
        setEventDetails(foundEvent);
        const isCollective = foundEvent.type === 'collectif'; // Rétablir
        setBottomSheetViewMode(isCollective ? 'participants' : 'gifts'); // Rétablir
        const participants = foundEvent.participants || []; // Rétablir
        const firstHost = participants.find(p => p.role === 'host'); // Rétablir
        setSelectedParticipantIdForGifts(isCollective ? participants[0]?.userId : (firstHost ? firstHost.userId : null)); // Rétablir
        sheetHeight.setValue(SHEET_HEIGHT_MEDIUM); setSheetState(1); // Rétablir
      } else { setError("Événement non trouvé."); }
      setLoading(false);
    };
    loadEventData();
  }, [eventId, events, eventsLoading, fetchEvents, sheetHeight]); // Rétablir sheetHeight dans les dépendances

  // --- Bottom Sheet Logic (Rétablie) ---
  const setSheetToState = useCallback((state: number) => {
    let toValue;
    switch (state) { case 0: toValue = SHEET_HEIGHT_SMALL; break; case 1: toValue = SHEET_HEIGHT_MEDIUM; break; case 2: toValue = SHEET_HEIGHT_FULL; break; default: toValue = SHEET_HEIGHT_MEDIUM; }
    if (typeof toValue === 'number' && !isNaN(toValue)) {
        Animated.spring(sheetHeight, { toValue, useNativeDriver: false, tension: 50, friction: 12 }).start();
        setSheetState(state);
    } else { console.error("Invalid animation value:", toValue); }
  }, [sheetHeight]);

  const toggleSheet = useCallback(() => {
    let nextState;
    if (sheetState === 0) nextState = 1; else if (sheetState === 1) nextState = 2; else nextState = 0;
    setSheetToState(nextState);
  }, [sheetState, setSheetToState]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderGrant: () => { sheetHeight.extractOffset(); },
      onPanResponderMove: (_, gestureState) => {
         const currentVal = (sheetHeight as any)._value;
         if (typeof currentVal === 'number' && !isNaN(currentVal)) {
             let newHeight = currentVal - gestureState.dy;
             if (typeof newHeight === 'number' && !isNaN(newHeight)) {
                 sheetHeight.setValue(Math.max(SHEET_HEIGHT_SMALL, Math.min(SHEET_HEIGHT_FULL, newHeight)));
             }
         }
      },
      onPanResponderRelease: (_, gestureState) => {
        sheetHeight.flattenOffset();
        const currentHeight = (sheetHeight as any)._value;
        if (typeof currentHeight !== 'number' || isNaN(currentHeight)) { setSheetToState(1); return; }
        let targetState = sheetState;
        if (Math.abs(gestureState.vy) > 0.5) { targetState = gestureState.vy < 0 ? Math.min(sheetState + 1, 2) : Math.max(sheetState - 1, 0); }
        else {
          const thresholdLow = (SHEET_HEIGHT_SMALL + SHEET_HEIGHT_MEDIUM) / 2;
          const thresholdHigh = (SHEET_HEIGHT_MEDIUM + SHEET_HEIGHT_FULL) / 2;
          if (currentHeight < thresholdLow) targetState = 0; else if (currentHeight < thresholdHigh) targetState = 1; else targetState = 2;
        }
        setSheetToState(targetState);
      },
    })
  ).current;
  // --- Fin Bottom Sheet Logic ---

  // --- Handlers liés à la Bottom Sheet (Rétablis) ---
  const handleGiftPress = (gift: GiftForSheet) => { setSelectedGift(gift); setShowGiftDetailModal(true); };
  const handleParticipantSelect = (participantId: string) => {
      setSelectedParticipantIdForGifts(participantId);
      setBottomSheetViewMode('gifts');
      setSheetToState(1); // Revenir à la taille medium quand on sélectionne un participant
  };
  const handleToggleSelectionMode = () => { setIsSelectionMode(!isSelectionMode); setSelectedGifts({}); };
  const handleToggleGiftSelection = (giftId: string) => { setSelectedGifts(prev => ({ ...prev, [giftId]: !prev[giftId] })); };
  const handleDeleteSelectedGifts = () => {
    const count = Object.values(selectedGifts).filter(Boolean).length;
    toast.success(`${count} ${count === 1 ? 'produit supprimé' : 'produits supprimés'}`);
    // TODO: Ajouter la logique API pour supprimer les cadeaux
    setIsSelectionMode(false); setSelectedGifts({});
  };
  const handleAddGift = () => { toast.info("Ouvrir modal/écran sélection Wishlist/Wish"); /* TODO: Implémenter ouverture modal/écran */ };
  const handleAddManagedAccount = () => { toast.info("Ouvrir modal/écran sélection Compte Géré"); /* TODO: Implémenter ouverture modal/écran */ };
  const handleInviteFriends = () => { if(eventId) navigation.navigate('EventInviteFriends', { eventId }); };
  const handleShareEvent = () => { toast.info("Partager l'événement"); /* TODO: Implémenter partage */ };
  const handleOptionsPress = () => { setBottomSheetViewMode('settings'); setSheetToState(1); }; // Afficher les options
  const handleAddToCalendar = () => { toast.info("Ajouter au calendrier"); /* TODO: Implémenter ajout calendrier */ };
  const handleViewAllInvites = () => { toast.info("Voir tous les invités"); /* TODO: Naviguer vers écran invités */ };
  const handleBackFromSettings = () => {
    const defaultView = eventDetails?.type === 'collectif' ? 'participants' : 'gifts';
    setBottomSheetViewMode(defaultView);
    setSheetToState(1);
  };
  // Nouveaux Handlers
  const handleBuyGift = (giftId: string) => { toast.info(`Acheter le cadeau ${giftId}`); /* TODO: Implémenter logique API achat */ };
  const handleParticipateGift = (giftId: string) => { toast.info(`Participer au cadeau ${giftId}`); /* TODO: Implémenter logique API participation */ };
  const handlePinGift = (giftId: string, pin: boolean) => { toast.info(`${pin ? 'Épingler' : 'Désépingler'} le cadeau ${giftId}`); /* TODO: Implémenter logique API épinglage */ };
  const handleChooseCollaborativeWish = () => { toast.info("Choisir le vœu collaboratif"); /* TODO: Implémenter logique sélection vœu collaboratif */ };
  // --- Fin Handlers Bottom Sheet ---

  // Handlers conservés
  const handleBack = () => { navigation.goBack(); };
  const handleChat = () => { console.log('Navigate to event chat'); }; // TODO: Implémenter la navigation vers le chat

  // Handlers pour les cartes d'info (Rétablis)
  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    toast.success(`${label} copié !`);
  };

  if (loading || eventsLoading) {
    return <SafeAreaView style={localStyles.centered}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;
  }
  const displayError = error || eventsError;
  if (displayError || !eventDetails) {
    return <SafeAreaView style={localStyles.centered}><Text>{displayError || "Impossible de charger l'événement."}</Text></SafeAreaView>;
  }

  // Mapper les participants API vers le type attendu par les composants enfants
  const participantsForSheet: ParticipantForHeader[] = (eventDetails.participants || []).map(p => {
      let name = `Participant ${p.userId.substring(0, 4)}`;
      let username: string | undefined = undefined; // Username est optionnel
      let avatar = `https://api.a0.dev/assets/image?text=${p.userId.substring(0, 2)}&aspect=1:1&seed=${p.userId}`;
      if (currentUser && p.userId === currentUser.id) { name = currentUser.name; username = currentUser.username; avatar = currentUser.avatar; }
      else { const managedAccount = managedAccounts.find(acc => acc.id === p.userId); if (managedAccount) { name = managedAccount.name; username = managedAccount.username; avatar = managedAccount.avatar; } }
      return { id: p.userId, name, username, avatar };
  });

  // Mapper les cadeaux API vers le type attendu par la BottomSheet, incluant les nouvelles propriétés
  const giftsForSheet: GiftForSheet[] = (eventDetails.gifts || []).map(g => ({
      id: g.id || Date.now().toString() + Math.random(),
      name: g.title,
      price: `${g.price?.toFixed(2) ?? 'N/A'} €`,
      image: g.imageUrl || `https://api.a0.dev/assets/image?text=${g.title.substring(0,3)}&aspect=1:1&seed=${g.id}`,
      isFavorite: false, // TODO: Gérer isFavorite depuis l'API
      // Nouvelles propriétés (valeurs par défaut ou à récupérer de l'API si disponibles)
      isPinned: g.isPinned ?? false, // Utilise la nouvelle propriété optionnelle
      isCollaborative: g.isCollaborative ?? (g.price ? g.price > 40 : false), // Utilise la nouvelle propriété optionnelle ou logique prix
      currentAmount: g.currentAmount ?? 0, // Utilise la nouvelle propriété optionnelle
      targetAmount: g.targetAmount ?? g.price ?? 0, // Utilise la nouvelle propriété optionnelle ou le prix
      isBought: g.status === 'purchased', // Dérivé du statut existant
      isReserved: g.status === 'reserved', // Dérivé du statut existant
      // addedBy et quantity sont optionnels ici
  }));

  const giftsToShow = eventDetails.type === 'collectif' ? [] : giftsForSheet; // TODO: Logique cadeaux par participant si collectif
  const selectedParticipant = participantsForSheet.find(p => p.id === selectedParticipantIdForGifts) || null; // Rétablir

  // --- Fonctions utilitaires pour l'affichage ---
  const calculateTimeLeft = (dateString: string): string => {
      // TODO: Implémenter la logique de calcul du temps restant
      const targetDate = new Date(dateString);
      const now = new Date();
      const diffTime = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return "Passé";
      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return "Demain";
      return `Dans ${diffDays} jours`;
  };

  const formatDate = (dateString: string): { day: string, month: string, year: string } => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('fr-FR', { month: 'long' });
      const year = date.getFullYear().toString();
      return { day, month, year };
  };

  const formatTime = (dateString: string): { hour: string, minute: string } => {
      const date = new Date(dateString);
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return { hour, minute };
  };

  const formatLocation = (location: EventLocation | undefined): { address: string, city: string, zip: string } => {
      if (!location?.address) return { address: 'Lieu non défini', city: '', zip: '' }; // Vérifier location et address

      // Simple split, à adapter si la structure de l'adresse est plus complexe
      const parts = location.address.split(',');
      const address = parts[0]?.trim() || location.address; // address est défini ici
      const cityZipPart = parts[1]?.trim() || '';
      const cityZip = cityZipPart.split(' ') || [];
      const zip = cityZip.find(p => /^\d{5}$/.test(p)) || ''; // Fournit '' si non trouvé
      const city = cityZip.filter(p => !/^\d{5}$/.test(p)).join(' ').trim() || ''; // Fournit '' si non trouvé ou vide
      return { address, city, zip }; // Tous les champs sont maintenant string
  };

  const { day, month, year } = formatDate(eventDetails.startDate);
  const { hour, minute } = formatTime(eventDetails.startDate);
  const { address, city, zip } = formatLocation(eventDetails.location);

  return (
    <ImageBackground
        source={{ uri: eventDetails.illustration || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop' }} // Placeholder image internet
        style={localStyles.backgroundImage}
        resizeMode="cover"
    >
      <SafeAreaView style={localStyles.safeAreaContainer}>
        <StatusBar barStyle="light-content" />

        {/* Header Fixe avec Dégradé */}
        <LinearGradient
            // Dégradé ajusté pour une transition plus douce
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.2)', 'transparent']} // Commence un peu plus sombre, finit transparent plus bas
            style={localStyles.headerContainer}
            locations={[0, 0.7, 1]} // Contrôle la position: 70% noir à 0%, 20% noir à 70% de la hauteur, transparent à 100%
        >
            <View style={localStyles.topBar}>
                <TouchableOpacity style={localStyles.iconButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={localStyles.headerTitle} numberOfLines={1}>{eventDetails.title}</Text>
                <TouchableOpacity style={localStyles.iconButton} onPress={handleChat}>
                    <MaterialCommunityIcons name="chat-processing-outline" size={26} color="white" />
                </TouchableOpacity>
            </View>
            <View style={localStyles.headerEventInfo}>
                <Text style={localStyles.headerSubtitle}>
                    {eventDetails.type === 'individuel'
                        ? participantsForSheet.find(p => eventDetails.participants.find(ep => ep.userId === p.id && ep.role === 'host'))?.name || eventDetails.subtitle || ''
                        : eventDetails.subtitle || ''}
                </Text>
                <View style={localStyles.dateBadge}>
                    <Text style={localStyles.dateBadgeText}>{calculateTimeLeft(eventDetails.startDate)}</Text>
                </View>
            </View>
        </LinearGradient>

        {/* ScrollView pour les cartes d'information */}
        <ScrollView
            style={localStyles.infoScrollView}
            contentContainerStyle={localStyles.infoScrollViewContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Carte Date */}
            <View style={localStyles.infoCard}>
                <View style={localStyles.infoCardHeader}>
                    <View style={localStyles.infoCardTitleContainer}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={20} color="#333" style={localStyles.infoCardIcon} />
                        <Text style={localStyles.infoCardTitle}>Date de l'événement</Text>
                    </View>
                    <TouchableOpacity onPress={() => copyToClipboard(`${day} ${month} ${year} à ${hour}:${minute}`, 'Date')}>
                        <Text style={localStyles.copyText}>copier</Text>
                    </TouchableOpacity>
                </View>
                <View style={localStyles.infoCardContentRow}>
                    <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>{day}</Text></View>
                    <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>{month}</Text></View>
                    <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>{year}</Text></View>
                </View>
                <View style={localStyles.infoCardContentRow}>
                    <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>Heure</Text></View>
                    <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>{hour}</Text></View>
                    <Text style={localStyles.timeSeparator}>:</Text>
                    <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>{minute}</Text></View>
                </View>
            </View>

            {/* Carte Lieu */}
            <View style={localStyles.infoCard}>
                <View style={localStyles.infoCardHeader}>
                    <View style={localStyles.infoCardTitleContainer}>
                        <Ionicons name="location-outline" size={20} color="#333" style={localStyles.infoCardIcon} />
                        <Text style={localStyles.infoCardTitle}>Lieu d'événement</Text>
                    </View>
                    <TouchableOpacity onPress={() => copyToClipboard(`${address}, ${city} ${zip}`, 'Lieu')}>
                        <Text style={localStyles.copyText}>copier</Text>
                    </TouchableOpacity>
                </View>
                <View style={localStyles.infoCardContentColumn}>
                    <View style={localStyles.infoChipFullWidth}><Text style={localStyles.infoChipText}>{address || 'Adresse non définie'}</Text></View>
                    <View style={localStyles.infoCardContentRow}>
                         {city && <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>{city}</Text></View>}
                         {zip && <View style={localStyles.infoChip}><Text style={localStyles.infoChipText}>{zip}</Text></View>}
                    </View>
                </View>
            </View>

            {/* Carte Description */}
            {eventDetails.description && (
                <View style={localStyles.infoCard}>
                    <View style={localStyles.infoCardHeader}>
                        <View style={localStyles.infoCardTitleContainer}>
                            <Feather name="info" size={20} color="#333" style={localStyles.infoCardIcon} />
                            <Text style={localStyles.infoCardTitle}>Description</Text>
                        </View>
                        <TouchableOpacity onPress={() => copyToClipboard(eventDetails.description || '', 'Description')}>
                            <Text style={localStyles.copyText}>copier</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={localStyles.infoCardContentColumn}>
                         <View style={localStyles.infoChipFullWidth}><Text style={localStyles.infoChipText}>{eventDetails.description}</Text></View>
                    </View>
                </View>
            )}

             {/* Carte Administrateurs */}
             <View style={localStyles.infoCard}>
                <View style={localStyles.infoCardHeader}>
                    <View style={localStyles.infoCardTitleContainer}>
                        <MaterialIcons name="admin-panel-settings" size={20} color="#333" style={localStyles.infoCardIcon} />
                        <Text style={localStyles.infoCardTitle}>Administrateur(s)</Text>
                    </View>
                    {/* Pas de bouton copier ici a priori */}
                </View>
                <View style={localStyles.adminContainer}>
                    {participantsForSheet.filter(p => eventDetails.participants.find(ep => ep.userId === p.id && ep.role === 'host')).map(admin => (
                        <View key={admin.id} style={localStyles.adminItem}>
                            <Image source={{ uri: admin.avatar }} style={localStyles.adminAvatar} />
                            <Text style={localStyles.adminName}>{admin.name}</Text>
                        </View>
                    ))}
                     {/* Ajouter un bouton pour voir tous les admins si nécessaire */}
                </View>
            </View>
        </ScrollView>

        {/* Bottom Sheet Animée (Rétablie) */}
        <Animated.View
          style={[ importedStyles.bottomSheetContainer, localStyles.bottomSheetPosition, { height: sheetHeight } ]} // Ajout positionnement
          {...panResponder.panHandlers}
        >
          {/* Poignée */}
          <TouchableOpacity style={importedStyles.bottomSheetHandle} onPress={toggleSheet}>
             <View style={importedStyles.dragIndicator} />
          </TouchableOpacity>

          {/* Contenu de la Bottom Sheet */}
          <EventDetailBottomSheetContent
            ref={bottomSheetScrollViewRef}
            viewMode={bottomSheetViewMode}
            eventDetails={eventDetails}
            participants={participantsForSheet}
            gifts={giftsToShow}
            isCollective={eventDetails.type === 'collectif'}
            isSelectionMode={isSelectionMode}
            selectedGifts={selectedGifts}
            selectedParticipant={selectedParticipant}
            // Passer les wishlists/wishes et les nouveaux handlers
            userWishlists={wishlists}
            userWishItems={wishItems}
            onParticipantSelect={handleParticipantSelect}
            onGiftPress={handleGiftPress} // Garder pour ouvrir détail ? Ou remplacer par achat/participation ? À clarifier.
            onBuyGift={handleBuyGift}
            onParticipateGift={handleParticipateGift}
            onPinGift={handlePinGift}
            onChooseCollaborativeWish={handleChooseCollaborativeWish}
            onToggleSelectionMode={handleToggleSelectionMode}
            onToggleGiftSelection={handleToggleGiftSelection}
            onDeleteSelectedGifts={handleDeleteSelectedGifts}
            onAddGift={handleAddGift}
            onAddManagedAccount={handleAddManagedAccount}
            onInviteFriends={handleInviteFriends}
            onShareEvent={handleShareEvent}
            onOptionsPress={handleOptionsPress}
            onAddToCalendar={handleAddToCalendar}
            onViewAllInvites={handleViewAllInvites}
            onBackFromSettings={handleBackFromSettings}
          />
        </Animated.View>

        {/* Modale de détail de cadeau (Rétablie) */}
        {selectedGift && (
          <EventGiftDetailModal
            visible={showGiftDetailModal}
            onClose={() => setShowGiftDetailModal(false)}
            gift={{
                id: selectedGift.id, name: selectedGift.name, price: selectedGift.price, image: selectedGift.image,
                quantity: selectedGift.quantity ?? 1, addedBy: selectedGift.addedBy || { name: 'Inconnu', avatar: '' }, isFavorite: selectedGift.isFavorite,
            }}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

// Styles locaux (mis à jour pour inclure les cartes et le positionnement)
const localStyles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
    },
    safeAreaContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    headerContainer: {
        paddingBottom: 15, // Augmenter un peu l'espace en bas du dégradé
        // backgroundColor est maintenant géré par LinearGradient
        // Ce header n'est plus 'absolute', il fait partie du flux normal
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    },
    iconButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerEventInfo: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    dateBadge: {
        backgroundColor: '#90EE90',
        borderRadius: 15,
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignSelf: 'center',
    },
    dateBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#006400',
    },
    infoScrollView: { // ScrollView pour les cartes
        flex: 1, // Prend l'espace restant avant la bottom sheet
        // Pas de marginTop ici, le header est au-dessus
    },
    infoScrollViewContent: { // Contenu du ScrollView
        paddingHorizontal: 20,
        paddingTop: 20, // Espace après le header
        paddingBottom: SHEET_HEIGHT_SMALL + 20, // Espace pour que le contenu ne soit pas caché par la bottom sheet minimale
    },
    infoCard: { // Styles des cartes (rétablis)
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Fond blanc semi-transparent
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        // Effet glassmorphism optionnel avec @react-native-community/blur
    },
    infoCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoCardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoCardIcon: {
        marginRight: 10,
        color: '#444',
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    copyText: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500',
    },
    infoCardContentRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 5,
    },
    infoCardContentColumn: {
        marginTop: 5,
    },
    infoChip: {
        backgroundColor: '#F0F0F0',
        borderRadius: 15,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 8,
        marginBottom: 8,
    },
    infoChipFullWidth: {
        backgroundColor: '#F0F0F0',
        borderRadius: 15,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 8,
        width: '100%',
    },
    infoChipText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
    },
    timeSeparator: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
        marginHorizontal: 5,
    },
    adminContainer: {
        marginTop: 10,
    },
    adminItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    adminAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    adminName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    bottomSheetPosition: { // Style pour positionner la bottom sheet
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    }
});

export default EventDetailScreen;