import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation'; // Chemin corrigé
import { styles } from '../styles/ProfileScreen.styles'; // Importer les styles

// Type pour les profils locaux avec les propriétés supplémentaires
interface LocalProfileType {
  id: string;
  name: string;
  username: string;
  balance: number; // Gardé pour référence potentielle, mais pas utilisé directement ici
  avatar: string;
  isAdd: boolean;
  isPersonal: boolean;
}

interface ProfileHeaderProps {
  profiles: LocalProfileType[];
  selectedProfileIndex: number;
  onSelectProfile: (index: number) => void;
  onGoToPreviousProfile: () => void;
  onGoToNextProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profiles,
  selectedProfileIndex,
  onSelectProfile,
  onGoToPreviousProfile,
  onGoToNextProfile,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeProfileLocal = profiles[selectedProfileIndex];

  return (
    <>
      {/* En-tête avec l'icône de paramètres */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Avatars avec navigation */}
      <View style={styles.avatarsContainer}>
        {/* Flèche gauche */}
        <TouchableOpacity
          style={[styles.arrowButton, selectedProfileIndex === 0 && styles.disabledArrow]}
          onPress={onGoToPreviousProfile}
          disabled={selectedProfileIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={selectedProfileIndex === 0 ? "#CCC" : "#333"} />
        </TouchableOpacity>

        {/* Avatars */}
        <View style={styles.avatarsRow}>
          {profiles.map((profile, index) => {
            const isSelected = index === selectedProfileIndex;
            // Détermine quels profils afficher : le sélectionné, celui d'avant, celui d'après
            const isVisible =
              index === selectedProfileIndex ||
              index === selectedProfileIndex - 1 ||
              index === selectedProfileIndex + 1;

            if (!isVisible) return null; // Ne rend pas les profils non visibles

            return (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileItem,
                  isSelected && styles.selectedProfileItem,
                  // Applique des styles spécifiques pour positionner les avatars adjacents
                  index < selectedProfileIndex && styles.leftProfileItem,
                  index > selectedProfileIndex && styles.rightProfileItem
                ]}
                onPress={() => onSelectProfile(index)}
              >
                {profile.isAdd ? (
                  <View style={styles.addProfileButton}>
                    <Ionicons name="add" size={22} color="#999" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: profile.avatar || 'https://ui-avatars.com/api/?name=?' }} // Fallback avatar
                    style={[
                      styles.profileAvatar,
                      isSelected ? styles.selectedProfileAvatar : styles.unselectedProfileAvatar
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Flèche droite */}
        <TouchableOpacity
          style={[styles.arrowButton, selectedProfileIndex === profiles.length - 1 && styles.disabledArrow]}
          onPress={onGoToNextProfile}
          disabled={selectedProfileIndex === profiles.length - 1}
        >
          <Ionicons name="chevron-forward" size={24} color={selectedProfileIndex === profiles.length - 1 ? "#CCC" : "#333"} />
        </TouchableOpacity>
      </View>

      {/* Nom et username du profil (si ce n'est pas le bouton "+") */}
      {!activeProfileLocal?.isAdd && activeProfileLocal && (
        <View style={styles.profileNameContainer}>
          <Text style={styles.profileName}>{activeProfileLocal.name}</Text>
          <Text style={styles.profileUsername}>{activeProfileLocal.username}</Text>
        </View>
      )}
    </>
  );
};

export default ProfileHeader;