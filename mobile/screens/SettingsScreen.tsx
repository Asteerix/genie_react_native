import React, { useState, useCallback } from 'react'; // Ajouter useCallback
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, Dimensions, Alert } from 'react-native'; // Ajouter Alert
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/context/AuthContext'; // Importer useAuth

type SettingItem = {
  id: string;
  title: string;
  subtitle?: string; // Ajouter pour afficher le username actuel
  icon: React.ReactNode;
  screen?: keyof RootStackParamList; // Rendre screen optionnel pour Déconnexion
  action?: () => void; // Ajouter une action optionnelle
  isDestructive?: boolean; // Pour styliser le bouton Déconnexion
};

const { width, height } = Dimensions.get('window');

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth(); // Récupérer signOut et user
  const [darkMode, setDarkMode] = useState(false);

  // Fonction de déconnexion avec confirmation
  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Se déconnecter",
          onPress: async () => {
            try {
              await signOut();
              // La navigation vers l'écran de connexion est gérée par le AuthProvider/Navigation
            } catch (error) {
              console.error("Erreur lors de la déconnexion:", error);
              Alert.alert("Erreur", "Impossible de se déconnecter. Veuillez réessayer.");
            }
          },
          style: "destructive" // Style pour iOS
        }
      ]
    );
  }, [signOut]);

  // Configuration des éléments du menu
  const settingsItems: SettingItem[] = [
    {
      id: 'profile',
      title: 'Mon profil',
      icon: (
        <View style={styles.profileIconContainer}>
          {/* Utiliser user.avatarUrl s'il existe, sinon fallback */}
          <Image
            source={user?.avatarUrl ? { uri: user.avatarUrl } : require('../assets/splash-icon.png')}
            style={styles.profileIcon}
          />
        </View>
      ),
      screen: 'MyProfileScreen',
    },
    // --- Ajout de l'item Nom d'utilisateur ---
    {
        id: 'username',
        title: 'Nom d\'utilisateur',
        // subtitle: user?.username ? `@${user.username}` : 'Non défini', // Supprimé car user.username n'existe pas
        icon: (
          <View style={styles.iconContainer}>
            <Ionicons name="at" size={24} color="#000" />
          </View>
        ),
        screen: 'EditUsernameScreen', // Décommenté maintenant que l'écran et les types sont prêts
      },
    // --- Fin de l'ajout ---
    {
      id: 'managed_accounts',
      title: 'Mes comptes gérés',
      icon: (
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={24} color="#000" />
        </View>
      ),
      screen: 'ManagedAccountsList',
    },
    {
      id: 'security',
      title: 'Mot de passe & Sécurité',
      icon: (
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={24} color="#000" />
        </View>
      ),
      screen: 'PasswordSecurity',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: (
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color="#000" />
        </View>
      ),
      screen: 'NotificationsScreen',
    },
    {
      id: 'faqs',
      title: 'FAQs',
      icon: (
        <View style={styles.iconContainer}>
          <Ionicons name="help-circle" size={24} color="#000" />
        </View>
      ),
      screen: 'FAQsScreen',
    },
    {
      id: 'confidentiality',
      title: 'Confidentialité',
      icon: (
        <View style={styles.iconContainer}>
          <Ionicons name="shield" size={24} color="#000" />
        </View>
      ),
      screen: 'ConfidentialityScreen',
    },
    {
      id: 'terms',
      title: 'Conditions d\'utilisation',
      icon: (
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={24} color="#000" />
        </View>
      ),
      screen: 'TermsScreen',
    },
    {
      id: 'guided_tour',
      title: 'Visite guidée de l\'app',
      icon: (
        <View style={styles.iconContainer}>
          <Ionicons name="footsteps" size={24} color="#000" />
        </View>
      ),
      screen: 'GuidedTourScreen',
    },
     // --- Section Déconnexion ---
     {
        id: 'logout',
        title: 'Déconnexion',
        icon: (
          <View style={[styles.iconContainer, styles.logoutIconContainer]}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </View>
        ),
        action: handleSignOut, // Utiliser l'action de déconnexion
        isDestructive: true, // Marquer comme destructif
      },
  ];

  // Fonction pour naviguer vers un écran ou exécuter une action
  const handleItemPress = (item: SettingItem) => {
    if (item.screen) {
      // Pour l'écran de profil et la liste des comptes gérés, on ajoute un paramètre indiquant qu'on vient des paramètres
      if (item.screen === 'MyProfileScreen' || item.screen === 'ManagedAccountsList') {
        navigation.navigate(item.screen, { fromSettings: true });
      } else {
        navigation.navigate(item.screen as any);
      }
    } else if (item.action) {
      item.action();
    }
  };

  // Fonction pour basculer le mode sombre
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Fonction pour inviter des amis
  const inviteFriends = () => {
    console.log("Inviter des amis");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'ios' ? 50 : 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <TouchableOpacity
          style={styles.darkModeButton}
          onPress={toggleDarkMode}
        >
          <View style={styles.darkModeIconContainer}>
            <Ionicons
              name={darkMode ? "sunny" : "moon"}
              size={24}
              color={darkMode ? "#FFF" : "#000"}
            />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Menu Items */}
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
                styles.menuItem,
                item.isDestructive && styles.destructiveItem // Style pour déconnexion
            ]}
            onPress={() => handleItemPress(item)}
          >
            {item.icon}
            <View style={styles.menuItemTextContainer}>
                <Text style={[
                    styles.menuItemText,
                    item.isDestructive && styles.destructiveText // Style pour déconnexion
                ]}>
                    {item.title}
                </Text>
                {/* Afficher le sous-titre (username) si présent */}
                {item.subtitle && !item.isDestructive && (
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                )}
            </View>
            {/* Ne pas afficher la flèche pour la déconnexion */}
            {!item.isDestructive && <Ionicons name="chevron-forward" size={24} color="#CCC" />}
          </TouchableOpacity>
        ))}

        {/* Invite Friends Button */}
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={inviteFriends}
        >
          <Ionicons name="share" size={24} color="#FFF" />
          <Text style={styles.inviteButtonText}>Inviter des amis</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  darkModeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkModeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000', // A adapter si le thème change
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  menuItemTextContainer: { // Conteneur pour titre et sous-titre
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: { // Style pour le sous-titre (username)
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 30,
  },
  inviteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Styles pour l'élément Déconnexion
  destructiveItem: {
    // Pas de style de fond spécifique, mais on pourrait en ajouter
  },
  logoutIconContainer: {
    backgroundColor: '#FFE5E5', // Fond rouge clair pour l'icône
  },
  destructiveText: {
    color: '#FF3B30', // Texte en rouge
    // flex: 1, // Retiré car géré par le conteneur parent
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsScreen;