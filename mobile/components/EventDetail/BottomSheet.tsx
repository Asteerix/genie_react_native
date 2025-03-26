import React from 'react';
import { Animated, View, TouchableOpacity, ScrollView, StyleSheet, Image, Text } from 'react-native';
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';

export interface BottomSheetProps {
  translateY: Animated.Value;
  isSheetExpanded: boolean;
  toggleSheet: () => void;
  panResponder: any;
  selectedParticipant: string | null;
  participantWishes: { [key: string]: any[] };
  eventDetails: any;
  onSelectParticipant: (username: string | null) => void;
  onGiftPress: (gift: any) => void;
  onInviteFriends: () => void;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  translateY,
  isSheetExpanded,
  toggleSheet,
  panResponder,
  selectedParticipant,
  participantWishes,
  eventDetails,
  onSelectParticipant,
  onGiftPress,
  onInviteFriends,
}) => {
  return (
    <Animated.View
      style={[
        styles.bottomSheet,
        { transform: [{ translateY }] }
      ]}
    >
      <View style={styles.bottomSheetContent}>
        <TouchableOpacity
          style={styles.dragHandleContainer}
          onPress={toggleSheet}
          {...panResponder.panHandlers}
          activeOpacity={0.7}
        >
          <View style={styles.dragHandle} />
          <View style={styles.dragIndicator}>
            <AntDesign
              name={isSheetExpanded ? "caretdown" : "caretup"}
              size={18}
              color="#888"
            />
          </View>
        </TouchableOpacity>

        {selectedParticipant ? (
          <View style={styles.participantWishesContainer}>
            <View style={styles.wishesHeader}>
              <TouchableOpacity
                style={styles.backToParticipants}
                onPress={() => onSelectParticipant(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#666" />
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.collaborativeWishButton}
                onPress={() => onInviteFriends()}
              >
                <Feather name="gift" size={20} color="#007AFF" />
                <Text style={styles.collaborativeWishText}>Voeu collaboratif</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.wishesList}>
              {(participantWishes[selectedParticipant] || []).map((wish) => (
                <TouchableOpacity
                  key={wish.id}
                  style={styles.wishItem}
                  onPress={() => onGiftPress(wish)}
                >
                  <Image source={{ uri: wish.image }} style={styles.wishImage} />
                  <View style={styles.wishInfo}>
                    <Text style={styles.wishName}>{wish.name}</Text>
                    <Text style={styles.wishPrice}>{wish.price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <>
            <ScrollView style={styles.participantsContainer}>
              {eventDetails.participants.slice(0, 2).map((participant: any) => (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.participantItem}
                  onPress={() => onSelectParticipant(participant.username)}
                >
                  <Image source={{ uri: participant.avatar }} style={styles.participantAvatar} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantUsername}>{participant.username}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addManagedAccountButton}>
                <View style={styles.addManagedAccountIcon}>
                  <Feather name="plus" size={28} color="#888" />
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>Ajouter un compte géré</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
              </TouchableOpacity>

              <View style={styles.participantsDivider} />

              {eventDetails.participants.slice(2).map((participant: any) => (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.participantItem}
                  onPress={() => onSelectParticipant(participant.username)}
                >
                  <Image source={{ uri: participant.avatar }} style={styles.participantAvatar} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantUsername}>{participant.username}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.inviteFriendsButton}
                onPress={onInviteFriends}
              >
                <Ionicons name="share-outline" size={24} color="black" />
                <Text style={styles.inviteFriendsText}>Inviter des amis</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.lockButton}>
                <Ionicons name="lock-closed" size={24} color="black" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bottomSheetContent: {
    flex: 1,
  },
  dragHandleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  dragHandle: {
    width: 50,
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  dragIndicator: {
    marginTop: 5,
  },
  participantWishesContainer: {
    flex: 1,
    padding: 15,
  },
  wishesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backToParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  collaborativeWishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  collaborativeWishText: {
    marginLeft: 6,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  wishesList: {
    flex: 1,
    marginTop: 10,
  },
  wishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  wishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  wishInfo: {
    flex: 1,
  },
  wishName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  wishPrice: {
    fontSize: 16,
    color: '#888',
    marginTop: 3,
  },
  participantsContainer: {
    flex: 1,
    padding: 15,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  participantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantUsername: {
    fontSize: 16,
    color: '#888',
  },
  addManagedAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  addManagedAccountIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  participantsDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 80,
    paddingVertical: 20,
    marginBottom: 20,
  },
  inviteFriendsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  inviteFriendsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomSheet;