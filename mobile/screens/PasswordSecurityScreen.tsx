import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const PasswordSecurityScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // États pour les options de sécurité
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(true);
  
  const handleToggleTwoFactor = () => {
    if (!twoFactorEnabled) {
      // Normalement, vous lanceriez ici le flux de configuration de l'authentification à deux facteurs
      Alert.alert(
        "Activer l'authentification à deux facteurs",
        "Pour continuer, vous devrez vérifier votre numéro de téléphone et configurer une application d'authentification.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Continuer", onPress: () => setTwoFactorEnabled(true) }
        ]
      );
    } else {
      setTwoFactorEnabled(false);
    }
  };
  
  const handleChangePassword = () => {
    Alert.alert(
      "Changer de mot de passe",
      "Vous allez être redirigé vers l'écran de changement de mot de passe.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Continuer", onPress: () => navigation.navigate('ChangePassword') }
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Attention ! Cette action est irréversible et supprimera définitivement votre compte et toutes vos données.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: () => navigation.navigate('DeleteAccount')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mot de passe & Sécurité</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité du compte</Text>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleChangePassword}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="lock-closed" size={22} color="#333" />
            </View>
            <Text style={styles.optionLabel}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleToggleTwoFactor}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="shield-checkmark" size={22} color="#333" />
            </View>
            <Text style={styles.optionLabel}>Authentification à deux facteurs</Text>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggleTwoFactor}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => setBiometricEnabled(!biometricEnabled)}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="finger-print" size={22} color="#333" />
            </View>
            <Text style={styles.optionLabel}>Connexion biométrique</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={() => setBiometricEnabled(!biometricEnabled)}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => setLoginNotificationsEnabled(!loginNotificationsEnabled)}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="notifications" size={22} color="#333" />
            </View>
            <Text style={styles.optionLabel}>Notifications de connexion</Text>
            <Switch
              value={loginNotificationsEnabled}
              onValueChange={() => setLoginNotificationsEnabled(!loginNotificationsEnabled)}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="phone-portrait" size={22} color="#333" />
            </View>
            <Text style={styles.optionLabel}>Appareils connectés</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="log-out" size={22} color="#333" />
            </View>
            <Text style={styles.optionLabel}>Déconnecter toutes les sessions</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dangerSection}>
          <TouchableOpacity 
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash" size={22} color="#FF3B30" />
            <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholderRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1C1C1E',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  dangerSection: {
    marginTop: 30,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 40,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default PasswordSecurityScreen;