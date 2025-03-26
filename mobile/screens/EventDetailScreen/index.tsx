import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, BackHandler } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EventDetailRouteProp, EventDetails, Participant, Gift } from './types';
import { 
  determineEventType, 
  isChristmasEvent, 
  copyToClipboard, 
  createBottomSheetAnimation, 
  createPanResponder, 
  animateBottomSheet, 
  countSelectedGifts 
} from './utils';
import { 
  EVENT_DETAILS, 
  COLLAPSED_HEIGHT, 
  INITIAL_HEIGHT, 
  FULL_HEIGHT,
  joinedEventDetails,
  invitationDetails 
} from './constants';
import EventView from './EventView';
import BottomSheet from './BottomSheet';

/**
 * Écran de détail d'un événement
 * Affiche les détails d'un événement et permet d'interagir avec celui-ci
 */
const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<EventDetailRouteProp>();
  const eventId = route.params?.eventId || '2'; // Forcer l'ID 2 pour tester l'anniversaire (au lieu de '1' pour le mariage)

  // Récupération des données de l'événement
  let eventData: EventDetails;
  
  if (eventId === '1' || eventId === '3') {
    // Événement "owned"
    eventData = EVENT_DETAILS[eventId];
  } else if (eventId === '2') {
    // Événement "joined"
    eventData = joinedEventDetails;
  } else {
    // Invitation
    eventData = invitationDetails;
  }

  // État pour le type d'événement
  const eventType = determineEventType(eventData);
  const isChristmas = isChristmasEvent(eventData);

  // Références et états pour le bottom sheet
  const mainScrollViewRef = useRef<any>(null);
  const [sheetState, setSheetState] = useState<number>(1); // 0: collapsed, 1: mid, 2: expanded
  const height = useRef(createBottomSheetAnimation(INITIAL_HEIGHT)).current;
  
  // État pour les participants
  const [showParticipantsView, setShowParticipantsView] = useState<boolean>(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showExitMenu, setShowExitMenu] = useState<boolean>(false);
  
  // État pour la sélection des cadeaux
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedGifts, setSelectedGifts] = useState<{[key: string]: boolean}>({});
  
  // Pan responder pour le bottom sheet
  const panResponder = createPanResponder(
    height,
    toggleSheet,
    setSheetToState
  );

  // Nombre de cadeaux sélectionnés
  const selectedCount = countSelectedGifts(selectedGifts);

  // Effet pour gérer le bouton retour
  useEffect(() => {
    const backAction = () => {
      if (showParticipantsView) {
        setShowParticipantsView(false);
        return true;
      }
      if (isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedGifts({});
        return true;
      }
      if (sheetState === 2) {
        setSheetToState(1);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showParticipantsView, isSelectionMode, sheetState]);

  /**
   * Fonction pour basculer l'état du bottom sheet entre réduit et intermédiaire
   */
  function toggleSheet() {
    if (sheetState === 0) {
      setSheetToState(1);
    } else {
      setSheetToState(0);
    }
  }

  /**
   * Fonction pour définir le bottom sheet à un état spécifique
   */
  function setSheetToState(state: number) {
    let newHeight = INITIAL_HEIGHT;
    
    if (state === 0) {
      newHeight = COLLAPSED_HEIGHT;
    } else if (state === 2) {
      newHeight = FULL_HEIGHT;
    }
    
    setSheetState(state);
    animateBottomSheet(height, newHeight);
  }

  /**
   * Gestionnaire pour appuyer sur un cadeau
   */
  const handleGiftPress = (gift: Gift) => {
    // Dans une application réelle, on naviguerait vers la page de détail du cadeau
    console.log('Gift pressed:', gift);
  };

  /**
   * Gestionnaire pour sélectionner un cadeau collaboratif
   */
  const handleSelectCollaborativeGift = () => {
    // Dans une application réelle, on ouvrirait une modale ou naviguerait vers un écran de sélection
    console.log('Select collaborative gift');
  };

  /**
   * Gestionnaire pour le bouton retour
   */
  const handleBack = () => {
    navigation.goBack();
  };

  /**
   * Gestionnaire pour accepter une invitation
   */
  const handleAccept = () => {
    // Dans une application réelle, on enverrait une requête API pour accepter l'invitation
    console.log('Invitation accepted');
    navigation.goBack();
  };

  /**
   * Gestionnaire pour refuser une invitation
   */
  const handleRefuse = () => {
    // Dans une application réelle, on enverrait une requête API pour refuser l'invitation
    console.log('Invitation refused');
    navigation.goBack();
  };

  /**
   * Gestionnaire pour accepter une demande de rejoindre
   */
  const handleAcceptJoinRequest = (requestId: string) => {
    // Dans une application réelle, on enverrait une requête API pour accepter la demande
    console.log('Join request accepted:', requestId);
  };

  /**
   * Gestionnaire pour rejeter une demande de rejoindre
   */
  const handleRejectJoinRequest = (requestId: string) => {
    // Dans une application réelle, on enverrait une requête API pour rejeter la demande
    console.log('Join request rejected:', requestId);
  };

  /**
   * Basculer l'affichage du menu de sortie
   */
  const toggleExitMenu = () => {
    setShowExitMenu(!showExitMenu);
  };

  // Rendu du composant
  return (
    <View style={styles.container}>
      <EventView
        eventDetails={eventData}
        eventType={eventType}
        handleGiftPress={handleGiftPress}
        isChristmasEvent={isChristmas}
        mainScrollViewRef={mainScrollViewRef}
        handleBack={handleBack}
        copyToClipboard={copyToClipboard}
        handleAccept={handleAccept}
        handleRefuse={handleRefuse}
        handleRejectJoinRequest={handleRejectJoinRequest}
        handleAcceptJoinRequest={handleAcceptJoinRequest}
      />

      {/* Bottom Sheet pour les événements "owned" uniquement */}
      {eventType === 'owned' && (
        <BottomSheet
          height={height}
          sheetState={sheetState}
          toggleSheet={toggleSheet}
          setSheetToState={setSheetToState}
          isChristmasEvent={isChristmas}
          showParticipantsView={showParticipantsView}
          eventDetails={eventData}
          selectedParticipant={selectedParticipant}
          setSelectedParticipant={setSelectedParticipant}
          setShowParticipantsView={setShowParticipantsView}
          handleSelectCollaborativeGift={handleSelectCollaborativeGift}
          handleGiftPress={handleGiftPress}
          isSelectionMode={isSelectionMode}
          setIsSelectionMode={setIsSelectionMode}
          selectedGifts={selectedGifts}
          setSelectedGifts={setSelectedGifts}
          selectedCount={selectedCount}
          panResponder={panResponder}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default EventDetailScreen;