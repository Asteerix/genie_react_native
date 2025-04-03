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
import { ManagedAccount } from '../api/types';

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
  currentProfile: ProfileType | null;
  activeProfile: ProfileType | null;
  managedAccounts: ProfileType[] | ManagedAccount[];
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
  // Rendu du profil principal
  const renderMainProfile = () => {
    if (!currentProfile || !activeProfile) return null;
    
    return (
      <TouchableOpacity
        key="current-profile"
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
            <Ionicons key="current-checkmark" name="checkmark-circle" size={24} color="#4285F4" />
          </View>
        )}
        <Ionicons key="current-forward" name="chevron-forward" size={24} color="#DDD" />
      </TouchableOpacity>
    );
  };

  // Rendu des comptes gérés
  const renderManagedAccounts = () => {
    if (managedAccounts.length === 0 || !activeProfile) return null;
    
    return (
      <>
        <Text style={styles.sectionTitle}>Mes comptes gérés</Text>
        {managedAccounts.map((account) => {
          // Handle both ProfileType and ManagedAccount types
          const accountId = account.id;
          const accountName = 'name' in account ? account.name : `${account.firstName || 'Utilisateur'} ${account.lastName || ''}`.trim();
          const accountUsername = account.username || '';
          const accountAvatar = 'avatar' in account ? account.avatar : 
            account.avatarUrl || `https://api.a0.dev/assets/image?text=${account.firstName?.charAt(0) || ''}${account.lastName?.charAt(0) || ''}`;
          const accountBalance = account.balance || 0;
          
          return (
            <TouchableOpacity
              key={`account-${accountId}`}
              style={[
                styles.profileItem,
                activeProfile.id === accountId && styles.activeProfileItem
              ]}
              onPress={() => {
                onSelectProfile(accountId);
                onClose();
              }}
            >
              <Image
                source={{ uri: accountAvatar }}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{accountName}</Text>
                <Text style={styles.profileUsername}>{accountUsername}</Text>
              </View>
              <Text style={styles.balance}>{accountBalance} €</Text>
              {activeProfile.id === accountId && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons key={`checkmark-${accountId}`} name="checkmark-circle" size={24} color="#4285F4" />
                </View>
              )}
              <Ionicons key={`forward-${accountId}`} name="chevron-forward" size={24} color="#DDD" />
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  // Rendu du bouton "Créer un nouveau compte"
  const renderCreateAccountButton = () => (
    <TouchableOpacity 
      key="create-account-button"
      style={styles.createAccountButton}
    >
      <View style={styles.addIconContainer}>
        <Ionicons key="add-icon" name="add" size={24} color="#999" />
      </View>
      <Text style={styles.createAccountText}>Créer un nouveau</Text>
      <View style={{ flex: 1 }} />
      <Ionicons key="create-forward-icon" name="chevron-forward" size={24} color="#DDD" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          key="overlay"
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
            {renderMainProfile()}

            {/* Section "Mes comptes gérés" toujours visible si des comptes existent */}
            {renderManagedAccounts()}

            {/* Bouton pour créer un nouveau compte */}
            {renderCreateAccountButton()}
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