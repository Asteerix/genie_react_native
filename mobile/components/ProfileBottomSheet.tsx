import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Hauteur de l'écran
const { height } = Dimensions.get('window');

// Types pour les profils
interface ProfileType {
  id: string;
  name: string;
  username: string;
  avatar: string;
  balance: number;
}

interface ProfileBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentProfile: ProfileType;
  activeProfile: ProfileType;
  managedAccounts: ProfileType[];
  onSelectProfile: (profileId: string) => void;
}

const ProfileBottomSheet: React.FC<ProfileBottomSheetProps> = ({
  visible,
  onClose,
  currentProfile,
  activeProfile,
  managedAccounts,
  onSelectProfile,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.bottomSheet}>
          {/* Indicateur de glissement */}
          <View style={styles.handle} />
          
          {/* Titre du sélecteur de profil */}
          <Text style={styles.sheetTitle}>Sélectionner un profil</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Section "Mon compte" toujours visible */}
            <Text style={styles.sectionTitle}>Mon compte</Text>
            <TouchableOpacity
              style={[
                styles.profileItem,
                activeProfile.id === currentProfile.id && styles.activeProfileItem
              ]}
              onPress={() => {
                onSelectProfile(currentProfile.id);
                onClose();
              }}
            >
              <Image
                source={{ uri: currentProfile.avatar }}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{currentProfile.name}</Text>
                <Text style={styles.profileUsername}>{currentProfile.username}</Text>
              </View>
              <Text style={styles.balance}>{currentProfile.balance} €</Text>
              {activeProfile.id === currentProfile.id && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#4285F4" />
                </View>
              )}
              <Ionicons name="chevron-forward" size={24} color="#DDD" />
            </TouchableOpacity>

            {/* Section "Mes comptes gérés" toujours visible si des comptes existent */}
            {managedAccounts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Mes comptes gérés</Text>
                {managedAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.profileItem,
                      activeProfile.id === account.id && styles.activeProfileItem
                    ]}
                    onPress={() => {
                      onSelectProfile(account.id);
                      onClose();
                    }}
                  >
                    <Image
                      source={{ uri: account.avatar }}
                      style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{account.name}</Text>
                      <Text style={styles.profileUsername}>{account.username}</Text>
                    </View>
                    <Text style={styles.balance}>{account.balance} €</Text>
                    {activeProfile.id === account.id && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark-circle" size={24} color="#4285F4" />
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={24} color="#DDD" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Bouton pour créer un nouveau compte */}
            <TouchableOpacity style={styles.createAccountButton}>
              <View style={styles.addIconContainer}>
                <Ionicons name="add" size={24} color="#999" />
              </View>
              <Text style={styles.createAccountText}>Créer un nouveau</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={24} color="#DDD" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: height * 0.7,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileUsername: {
    fontSize: 14,
    color: '#999',
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  addIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeProfileItem: {
    backgroundColor: '#F5F9FF',
  },
  checkmarkContainer: {
    marginRight: 10,
  },
});

export default ProfileBottomSheet;