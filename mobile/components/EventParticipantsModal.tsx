import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';

interface Participant {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  image: string;
}

interface EventParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  event: Event | null;
  onSelectParticipant: (participant: Participant) => void;
}

// Données des participants
const PARTICIPANTS: Participant[] = [
  {
    id: '1',
    name: 'Dan Toulet',
    username: 'dantoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait%20blue%20background&aspect=1:1&seed=10'
  },
  {
    id: '2',
    name: 'Noémie Sanchez',
    username: 'noemiesanchez',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20green%20background&aspect=1:1&seed=11'
  },
  {
    id: '3',
    name: 'Audriana Toulet',
    username: 'audrinatoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait%20pink%20background&aspect=1:1&seed=12'
  },
  {
    id: '4',
    name: 'Paul Marceau',
    username: 'paulmarceau',
    avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait%20cartoon%20orange%20background&aspect=1:1&seed=13'
  },
];

const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({
  visible,
  onClose,
  onBack,
  event,
  onSelectParticipant
}) => {
  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Choisir un participant</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color="#666" />
            <Text style={styles.backText}>Transférer un vœu</Text>
          </TouchableOpacity>

          {/* Event info */}
          <View style={styles.eventContainer}>
            <View style={styles.eventCard}>
              <View style={styles.eventImageContainer}>
                <Image source={{ uri: event.image }} style={styles.eventImage} />
              </View>
              
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{event.date}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider}></View>

          {/* Participants list */}
          <ScrollView style={styles.participantsContainer}>
            {PARTICIPANTS.map((participant, index) => (
              <React.Fragment key={participant.id}>
                <TouchableOpacity 
                  style={styles.participantItem} 
                  onPress={() => onSelectParticipant(participant)}
                >
                  <View style={styles.participantInfo}>
                    <Image source={{ uri: participant.avatar }} style={styles.participantAvatar} />
                    <View>
                      <Text style={styles.participantName}>{participant.name}</Text>
                      <Text style={styles.participantUsername}>{participant.username}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                </TouchableOpacity>
                
                {/* Divider between participants */}
                {index === 1 && <View style={styles.participantsSeparator} />}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 200, 200, 0.95)', // Fond rose comme sur la capture d'écran
  },
  modalContent: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    width: 24,
    height: 24,
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backText: {
    fontSize: 18,
    color: '#666',
    marginLeft: 10,
  },
  eventContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  eventImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventImage: {
    width: 50,
    height: 50,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateContainer: {
    backgroundColor: '#E8F8E8',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 14,
    color: '#2E8B57',
  },
  divider: {
    height: 6,
    backgroundColor: '#E5E5E5',
    marginBottom: 10,
    width: '40%',
    alignSelf: 'center',
    borderRadius: 3,
  },
  participantsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    paddingTop: 10,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  participantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantUsername: {
    fontSize: 16,
    color: '#999',
  },
  participantsSeparator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 10,
    marginHorizontal: 20,
  },
});

export default EventParticipantsModal;