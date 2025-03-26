import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { BottomSheetProps } from './types';
import GiftsView from './GiftsView';
import ParticipantsView from './ParticipantsView';
import { COLLAPSED_HEIGHT, INITIAL_HEIGHT, FULL_HEIGHT } from './constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomSheet: React.FC<BottomSheetProps> = ({
  height,
  sheetState,
  toggleSheet,
  setSheetToState,
  isChristmasEvent,
  showParticipantsView,
  eventDetails,
  selectedParticipant,
  setSelectedParticipant,
  setShowParticipantsView,
  handleSelectCollaborativeGift,
  handleGiftPress,
  isSelectionMode,
  setIsSelectionMode,
  selectedGifts,
  setSelectedGifts,
  selectedCount,
  panResponder,
}) => {
  // Calcul de l'opacité du fond en fonction de la hauteur du bottom sheet
  const backdropOpacity = height.interpolate({
    inputRange: [COLLAPSED_HEIGHT, INITIAL_HEIGHT],
    outputRange: [0, 0.5],
    extrapolate: 'clamp',
  });

  // Calcul de la hauteur de contenu disponible
  const contentHeight = height.interpolate({
    inputRange: [COLLAPSED_HEIGHT, INITIAL_HEIGHT, FULL_HEIGHT],
    outputRange: [0, INITIAL_HEIGHT - 60, FULL_HEIGHT - 60],
    extrapolate: 'clamp',
  });

  // Calcul de la transformation pour le contenu
  const translateY = height.interpolate({
    inputRange: [COLLAPSED_HEIGHT, INITIAL_HEIGHT, FULL_HEIGHT],
    outputRange: [SCREEN_HEIGHT, 60, 60],
    extrapolate: 'clamp',
  });

  // Gestion du sélecteur de participant
  const handleParticipantSelect = (username: string) => {
    if (selectedParticipant && selectedParticipant.username === username) {
      setSelectedParticipant(null);
    } else {
      // Dans une application réelle, on récupérerait les détails du participant depuis l'API
      // Pour cette maquette, on le simule en trouvant le participant dans la liste
      const foundParticipant = 
        'participants' in eventDetails && 
        eventDetails.participants ? 
        eventDetails.participants.find(p => p.username === username) : null;
      
      if (foundParticipant) {
        setSelectedParticipant(foundParticipant);
      }
    }
    setShowParticipantsView(false);
  };

  // Rendu conditionnel des vues
  return (
    <>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={sheetState > 0 ? 'auto' : 'none'}
      />
      
      <Animated.View
        style={[
          styles.container,
          {
            height: height,
            transform: [{ translateY: translateY }]
          }
        ]}
        {...panResponder?.panHandlers}
      >
        <View style={styles.handle} />
        
        <Animated.View
          style={[
            styles.content,
            { height: contentHeight }
          ]}
        >
          {showParticipantsView ? (
            <ParticipantsView
              eventDetails={eventDetails}
              setShowParticipantsView={setShowParticipantsView}
              handleParticipantSelect={handleParticipantSelect}
              showExitMenu={false}
              toggleExitMenu={() => {}}
              navigation={{}}
            />
          ) : (
            <GiftsView
              eventDetails={eventDetails}
              handleSelectCollaborativeGift={handleSelectCollaborativeGift}
              handleGiftPress={handleGiftPress}
              isSelectionMode={isSelectionMode}
              setIsSelectionMode={setIsSelectionMode}
              selectedGifts={selectedGifts}
              setSelectedGifts={setSelectedGifts}
              selectedCount={selectedCount}
              setShowParticipantsView={setShowParticipantsView}
            />
          )}
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDDDDD',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default BottomSheet;