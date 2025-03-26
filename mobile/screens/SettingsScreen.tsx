import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/context/AuthContext';
import { resetAuthData } from '../utils/resetLocalData';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useAuth();

  // Fonction combinée pour la déconnexion et réinitialisation des données d'authentification
  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              // Déconnexion via le contexte d'authentification
              await signOut();
              
              // Réinitialiser également les données d'authentification stockées localement
              await resetAuthData();
              
              // Rediriger vers l'écran de connexion
              navigation.navigate('Login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert("Erreur", "Une erreur est survenue lors de la déconnexion.");
            }
          }
        }
      ]
    );
  };

  const settingsOptions = [
    {
      id: 'profile',
      icon: <Image 
        source={{ uri: 'https://api.a0.dev/assets/image?text=D' }} 
        style={styles.profileOptionImage} 
      />,
      title: 'Mon profil',
      onPress: () => navigation.navigate('Profile'),
    },
    {
      id: 'managed-accounts',
      icon: <Ionicons name="people-outline" size={24} color="#333" />,
      title: 'Mes comptes gérés',
      onPress: () => navigation.navigate('ManagedAccountsList'),
    },
    {
      id: 'password-security',
      icon: <Ionicons name="lock-closed-outline" size={24} color="#333" />,
      title: 'Mot de passe & Sécurité',
      onPress: () => navigation.navigate('PasswordSecurity'),
    },
    {
      id: 'reset-data',
      icon: <Ionicons name="refresh-outline" size={24} color="#333" />,
      title: 'Réinitialiser les données',
      onPress: () => navigation.navigate('ResetData'),
    },
    {
      id: 'notifications',
      icon: <Ionicons name="notifications-outline" size={24} color="#333" />,
      title: 'Notifications',
      onPress: () => {},
    },
    {
      id: 'faqs',
      icon: <Ionicons name="help-circle-outline" size={24} color="#333" />,
      title: 'FAQs',
      onPress: () => {},
    },
    {
      id: 'confidentiality',
      icon: <Ionicons name="shield-outline" size={24} color="#333" />,
      title: 'Confidentialité',
      onPress: () => {},
    },
    {
      id: 'terms',
      icon: <Ionicons name="document-text-outline" size={24} color="#333" />,
      title: "Conditions d'utilisation",
      onPress: () => {},
    },
    {
      id: 'guided-tour',
      icon: <Ionicons name="footsteps-outline" size={24} color="#333" />,
      title: "Visite guidée de l'app",
      onPress: () => {},
    },
    {
      id: 'logout',
      icon: <Ionicons name="log-out-outline" size={24} color="#E53935" />,
      title: "Déconnexion",
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        
        <TouchableOpacity style={styles.darkModeButton}>
          <Ionicons name="moon" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.optionsContainer}>
          {settingsOptions.map((option) => (
            <TouchableOpacity 
              key={option.id}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionIconContainer}>
                {option.icon}
              </View>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.inviteButtonContainer}>
          <TouchableOpacity style={styles.inviteButton}>
            <Ionicons name="share-outline" size={22} color="white" />
            <Text style={styles.inviteButtonText}>Inviter des amis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  darkModeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingTop: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileOptionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  inviteButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 30,
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  inviteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;