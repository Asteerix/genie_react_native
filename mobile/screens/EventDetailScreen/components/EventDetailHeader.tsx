import React, { useRef, useEffect, useMemo } from 'react'; // Ajouter useMemo
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Platform, StatusBar, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types/navigation'; // Ajuster le chemin si nécessaire

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Participant {
  id: string;
  name: string;
  username?: string; // Username peut être optionnel
  avatar: string;
}

interface EventDetailHeaderProps {
  eventTitle: string;
  participants: Participant[]; // Utiliser le type Participant défini
  backgroundColor?: string; // Couleur de fond optionnelle
  onParticipantPress: (participantId: string) => void; // Callback pour clic sur participant
  selectedParticipantId?: string | null; // ID du participant actuellement sélectionné
}

const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({
  eventTitle,
  participants,
  backgroundColor = '#FFD1DC', // Rose pâle par défaut
  onParticipantPress,
  selectedParticipantId,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // Retirer scrollViewRef car on n'utilise plus de ScrollView horizontale
  // const scrollViewRef = useRef<ScrollView>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChat = () => {
    // TODO: Naviguer vers l'écran de chat de l'événement
    console.log('Navigate to event chat');
  };

  // Trouver l'index du participant sélectionné
  const selectedIndex = useMemo(() => {
      if (!selectedParticipantId) return -1; // Aucun sélectionné
      return participants.findIndex(p => p.id === selectedParticipantId);
  }, [selectedParticipantId, participants]);

  // Déterminer l'index précédent et suivant
  const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : -1;
  const nextIndex = selectedIndex < participants.length - 1 ? selectedIndex + 1 : -1;

  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      {/* Barre supérieure avec Retour, Titre, Chat */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{eventTitle}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleChat}>
          <MaterialCommunityIcons name="chat-processing-outline" size={26} color="black" />
          {/* Ajouter un badge si nécessaire */}
          {/* <View style={styles.chatBadge}><Text style={styles.chatBadgeText}>3</Text></View> */}
        </TouchableOpacity>
      </View>

      {/* Affichage des participants (style ProfileScreen) */}
      <View style={styles.participantsRow}>
         {/* Flèche gauche (conditionnelle) */}
         {participants.length > 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, selectedIndex <= 0 ? styles.disabledArrow : {}]}
              onPress={() => {
                  if (prevIndex !== -1) {
                      onParticipantPress(participants[prevIndex].id);
                  }
              }}
              disabled={selectedIndex <= 0}
            >
              <Ionicons name="chevron-back" size={24} color={selectedIndex <= 0 ? "#CCC" : "#333"} />
            </TouchableOpacity>
         )}

        {/* Avatars (max 3 visibles) */}
        <View style={styles.avatarsDisplayArea}>
          {participants.map((participant, index) => {
            const isSelected = index === selectedIndex;
            // Détermine quels profils afficher : le sélectionné, celui d'avant, celui d'après
            const isVisible =
              index === selectedIndex ||
              index === selectedIndex - 1 ||
              index === selectedIndex + 1;

            if (!isVisible || selectedIndex === -1) return null; // Ne rend pas les profils non visibles

            const scale = isSelected ? 1 : 0.8;
            const opacity = isSelected ? 1 : 0.5;
            let translateX = 0;
            if (index < selectedIndex) translateX = -50; // Décalage à gauche
            if (index > selectedIndex) translateX = 50; // Décalage à droite

            return (
              <Animated.View // Utiliser Animated.View si on veut animer plus tard
                key={participant.id}
                style={[
                  styles.participantContainer,
                  { opacity, transform: [{ scale }, { translateX }] }, // Appliquer transformations
                  isSelected && styles.selectedParticipantItem, // Style spécifique si sélectionné
                ]}
              >
                <TouchableOpacity
                  onPress={() => onParticipantPress(participant.id)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.avatarContainer, isSelected && styles.selectedAvatarContainer]}>
                    <Image source={{ uri: participant.avatar }} style={styles.avatar} />
                  </View>
                  {isSelected && ( // Afficher le nom seulement pour l'avatar sélectionné
                     <Text style={styles.participantName} numberOfLines={1}>
                       {participant.name.split(' ')[0]}
                     </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Flèche droite (conditionnelle) */}
        {participants.length > 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, selectedIndex === -1 || selectedIndex >= participants.length - 1 ? styles.disabledArrow : {}]}
              onPress={() => {
                  if (nextIndex !== -1) {
                      onParticipantPress(participants[nextIndex].id);
                  }
              }}
              disabled={selectedIndex === -1 || selectedIndex >= participants.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color={selectedIndex === -1 || selectedIndex >= participants.length - 1 ? "#CCC" : "#333"} />
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  chatBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 110, // Hauteur fixe pour contenir les avatars
  },
  arrowButton: {
    padding: 10,
  },
  disabledArrow: {
    opacity: 0.3,
  },
  avatarsDisplayArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative', // Pour positionnement absolu
    height: '100%',
  },
  participantContainer: {
    position: 'absolute', // Positionnement absolu
    alignItems: 'center',
  },
  selectedParticipantItem: {
    zIndex: 10, // Au premier plan
  },
  // Styles pour positionner les 3 avatars visibles (ajuster translateX si nécessaire)
  leftParticipantItem: {
     transform: [{ translateX: -50 }, { scale: 0.8 }], // Décalage à gauche et réduit
     zIndex: 5,
  },
  rightParticipantItem: {
     transform: [{ translateX: 50 }, { scale: 0.8 }], // Décalage à droite et réduit
     zIndex: 5,
  },
  avatarContainer: { // Style commun
    width: 70, // Taille de base (pour le sélectionné)
    height: 70,
    borderRadius: 35,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedAvatarContainer: { // Style spécifique pour le sélectionné
    borderColor: 'black',
  },
  avatar: { // Taille unique pour l'image
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  participantName: { // Style commun pour le nom
    fontSize: 14, // Taille unique
    fontWeight: '600', // Semi-bold par défaut
    color: 'black',
    textAlign: 'center',
    marginTop: 3, // Petit espace après l'avatar
  },
});

export default EventDetailHeader;