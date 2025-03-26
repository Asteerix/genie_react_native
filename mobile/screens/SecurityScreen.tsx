import React, { useState, useEffect } from 'react';
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

const SecurityScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // États des paramètres de sécurité
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [saveLoginInfo, setSaveLoginInfo] = useState(true);
  
  // Dates de modification fictives (pour démonstration)
  const passwordLastChanged = "15 février 2025";
  
  // Simuler le chargement des paramètres de sécurité
  useEffect(() => {
    const loadSecuritySettings = async () => {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Données fictives pour la démonstration
      setBiometricEnabled(true);
      setTwoFactorEnabled(false);
      setLoginNotifications(true);
      setSaveLoginInfo(true);
    };
    
    loadSecuritySettings();
  }, []);
  
  // Gérer le changement d'état de l'authentification biométrique
  const handleBiometricToggle = (value: boolean) => {
    if (value) {
      // Simuler une vérification biométrique
      setBiometricEnabled(true);
      Alert.alert("Authentification biométrique", "Authentification biométrique activée avec succès.");
    } else {
      setBiometricEnabled(false);
      Alert.alert("Authentification biométrique", "Authentification biométrique désactivée.");
    }
  };
  
  // Gérer le changement d'état de l'authentification à deux facteurs
  const handleTwoFactorToggle = () => {
    if (!twoFactorEnabled) {
      // Naviguer vers l'écran de configuration de l'authentification à deux facteurs
      navigation.navigate('TwoFactorAuth');
    } else {
      // Demander confirmation avant de désactiver l'authentification à deux facteurs
      Alert.alert(
        "Désactiver l'authentification à deux facteurs",
        "Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ? Cela réduira la sécurité de votre compte.",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Désactiver", 
            style: "destructive",
            onPress: () => {
              setTwoFactorEnabled(false);
              Alert.alert("2FA désactivée", "L'authentification à deux facteurs a été désactivée.");
            }
          }
        ]
      );
    }
  };
  
  // Gérer le changement d'état des notifications de connexion
  const handleLoginNotificationsToggle = (value: boolean) => {
    setLoginNotifications(value);
    Alert.alert(
      "Notifications de connexion",
      value 
        ? "Vous recevrez désormais des notifications lorsque quelqu'un se connecte à votre compte."
        : "Vous ne recevrez plus de notifications lorsque quelqu'un se connecte à votre compte."
    );
  };
  
  // Gérer le changement d'état de la sauvegarde des informations de connexion
  const handleSaveLoginInfoToggle = (value: boolean) => {
    setSaveLoginInfo(value);
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
        <Text style={styles.headerTitle}>Sécurité</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentification</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('PasswordSecurity')}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="key-outline" size={24} color="#333" style={styles.menuItemIcon} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Mot de passe</Text>
                <Text style={styles.menuItemDescription}>
                  Dernière modification : {passwordLastChanged}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="finger-print" size={24} color="#333" style={styles.menuItemIcon} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Authentification biométrique</Text>
                <Text style={styles.menuItemDescription}>
                  Utiliser Face ID ou Touch ID pour vous connecter
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#D1D1D6', true: '#4CD964' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#333" style={styles.menuItemIcon} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Authentification à deux facteurs</Text>
                <Text style={styles.menuItemDescription}>
                  {twoFactorEnabled ? 'Activée' : 'Ajoutez une couche de sécurité supplémentaire'}
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={() => handleTwoFactorToggle()}
              trackColor={{ false: '#D1D1D6', true: '#4CD964' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appareils et Sessions</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ConnectedDevices')}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="phone-portrait-outline" size={24} color="#333" style={styles.menuItemIcon} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Appareils connectés</Text>
                <Text style={styles.menuItemDescription}>
                  Gérer les appareils connectés à votre compte
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
          </TouchableOpacity>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="notifications-outline" size={24} color="#333" style={styles.menuItemIcon} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Notifications de connexion</Text>
                <Text style={styles.menuItemDescription}>
                  Être averti des nouvelles connexions à votre compte
                </Text>
              </View>
            </View>
            <Switch
              value={loginNotifications}
              onValueChange={handleLoginNotificationsToggle}
              trackColor={{ false: '#D1D1D6', true: '#4CD964' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name="save-outline" size={24} color="#333" style={styles.menuItemIcon} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Informations de connexion</Text>
                <Text style={styles.menuItemDescription}>
                  Enregistrer vos informations pour vous connecter plus rapidement
                </Text>
              </View>
            </View>
            <Switch
              value={saveLoginInfo}
              onValueChange={handleSaveLoginInfoToggle}
              trackColor={{ false: '#D1D1D6', true: '#4CD964' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('DeleteAccount')}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" style={styles.menuItemIcon} />
              <View style={styles.menuItemTextContainer}>
                <Text style={[styles.menuItemTitle, { color: '#FF3B30' }]}>Supprimer mon compte</Text>
                <Text style={styles.menuItemDescription}>
                  Supprimer définitivement votre compte et vos données
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#BDBDBD" />
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default SecurityScreen;