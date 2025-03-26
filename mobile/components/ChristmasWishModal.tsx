import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Image,
  Dimensions
} from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { Participant } from '../screens/EventDetailScreen/types';

interface ChristmasWishModalProps {
  visible: boolean;
  onClose: () => void;
  participant: Participant;
  isCurrentUser: boolean;
  onSelectWish: () => void;
  onSelectCollaborativeWish: () => void;
}

const { width } = Dimensions.get('window');

const ChristmasWishModal: React.FC<ChristmasWishModalProps> = ({
  visible,
  onClose,
  participant,
  isCurrentUser,
  onSelectWish,
  onSelectCollaborativeWish
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Noël 2024</Text>
            <View style={{width: 24}} /> {/* Spacer for alignment */}
          </View>

          {/* Participant Card */}
          <View style={styles.participantCard}>
            <Image source={{ uri: participant?.avatar }} style={styles.participantAvatar} />
            <Text style={styles.participantName}>{participant?.name}</Text>
            <Text style={styles.participantUsername}>@{participant?.username}</Text>
          </View>

          {/* Christmas decoration */}
          <View style={styles.decorationContainer}>
            <View style={styles.snowflake}>
              <Ionicons name="snow-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.giftIcon}>
              <Feather name="gift" size={28} color="#FF3B30" />
            </View>
            <View style={styles.snowflake}>
              <Ionicons name="snow-outline" size={24} color="#007AFF" />
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={onSelectWish}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="checkbox-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Sélectionner</Text>
                <Text style={styles.optionDescription}>Choisir un cadeau de sa liste</Text>
              </View>
              <AntDesign name="right" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={onSelectCollaborativeWish}>
              <View style={styles.optionIconContainer}>
                <Feather name="users" size={24} color="#007AFF" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>
                  {isCurrentUser ? "Choisir mon voeu collaboratif" : "Choisir son voeu collaboratif"}
                </Text>
                <Text style={styles.optionDescription}>
                  {isCurrentUser ? "Ajouter un souhait à réaliser à plusieurs" : "Participer à un cadeau collectif"}
                </Text>
              </View>
              <AntDesign name="right" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  participantCard: {
    alignItems: 'center',
    padding: 20,
  },
  participantAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#FFD1D1',
  },
  participantName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  participantUsername: {
    fontSize: 16,
    color: '#666',
  },
  decorationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  snowflake: {
    marginHorizontal: 15,
  },
  giftIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#FFD1D1',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default ChristmasWishModal;