import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ParticipantsViewProps, Participant } from './types';

const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  eventDetails,
  setShowParticipantsView,
  handleParticipantSelect,
  showExitMenu,
  toggleExitMenu,
  navigation,
}) => {
  // Vérifier si l'événement a des participants (uniquement dans les événements de type 'owned')
  const hasParticipants = 'type' in eventDetails && 
                          eventDetails.type === 'owned' && 
                          eventDetails.participants && 
                          eventDetails.participants.length > 0;
  
  // La liste des participants à afficher
  const participants: Participant[] = hasParticipants && 'participants' in eventDetails
    ? eventDetails.participants || []
    : [];

  // Fonction pour quitter l'événement
  const handleExitEvent = () => {
    Alert.alert(
      "Quitter l'événement",
      "Êtes-vous sûr de vouloir quitter cet événement ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Quitter",
          style: "destructive",
          onPress: () => {
            // Ici, on naviguerait vers la liste des événements
            if (navigation && navigation.goBack) {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  // Rendu des participants
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowParticipantsView(false)}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Revenir aux cadeaux</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={toggleExitMenu}
        >
          <MaterialIcons name="more-vert" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {showExitMenu && (
        <View style={styles.exitMenu}>
          <TouchableOpacity
            style={styles.exitMenuItem}
            onPress={handleExitEvent}
          >
            <Ionicons name="exit-outline" size={20} color="#FF5757" />
            <Text style={styles.exitMenuText}>Quitter l'événement</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Text style={styles.title}>Participants</Text>
      
      <ScrollView contentContainerStyle={styles.participantsList}>
        {participants.length > 0 ? (
          participants.map((participant: Participant) => (
            <TouchableOpacity
              key={participant.id}
              style={styles.participantItem}
              onPress={() => handleParticipantSelect(participant.username)}
            >
              <Image
                source={{ uri: participant.avatar }}
                style={styles.participantAvatar}
              />
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participant.name}</Text>
                <Text style={styles.participantUsername}>@{participant.username}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BBBBBB" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Aucun participant n'a rejoint cet événement
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  moreButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  participantsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  participantUsername: {
    fontSize: 14,
    color: '#888888',
  },
  exitMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  exitMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  exitMenuText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#FF5757',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ParticipantsView;