import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Type pour les appareils connectés
interface ConnectedDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet' | 'other';
  lastActive: string;
  location: string;
  isCurrentDevice: boolean;
}

const ConnectedDevicesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  
  // Simuler le chargement des appareils connectés
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoading(true);
        
        // Simuler une requête API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Données fictives pour la démonstration
        const mockDevices: ConnectedDevice[] = [
          {
            id: '1',
            name: 'iPhone 15 Pro',
            type: 'mobile',
            lastActive: 'Actuellement actif',
            location: 'Paris, France',
            isCurrentDevice: true
          },
          {
            id: '2',
            name: 'MacBook Pro',
            type: 'desktop',
            lastActive: 'Il y a 2 heures',
            location: 'Paris, France',
            isCurrentDevice: false
          },
          {
            id: '3',
            name: 'iPad Air',
            type: 'tablet',
            lastActive: 'Hier, 20:45',
            location: 'Lyon, France',
            isCurrentDevice: false
          },
          {
            id: '4',
            name: 'Windows PC',
            type: 'desktop',
            lastActive: '15 mars 2025, 10:30',
            location: 'Marseille, France',
            isCurrentDevice: false
          }
        ];
        
        setDevices(mockDevices);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        Alert.alert(
          "Erreur",
          "Impossible de charger les appareils connectés",
          [{ text: "OK" }]
        );
      }
    };
    
    loadDevices();
  }, []);
  
  // Retourner l'icône appropriée selon le type d'appareil
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Ionicons name="phone-portrait" size={24} color="#333" />;
      case 'desktop':
        return <Ionicons name="desktop" size={24} color="#333" />;
      case 'tablet':
        return <Ionicons name="tablet-portrait" size={24} color="#333" />;
      default:
        return <Ionicons name="hardware-chip" size={24} color="#333" />;
    }
  };
  
  // Gérer la déconnexion d'un appareil
  const handleLogoutDevice = (device: ConnectedDevice) => {
    if (device.isCurrentDevice) {
      Alert.alert(
        "Appareil actuel",
        "Vous êtes actuellement connecté avec cet appareil. Voulez-vous vous déconnecter ?",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Déconnecter", 
            style: "destructive",
            onPress: () => {
              // Rediriger vers l'écran de connexion (simulé)
              Alert.alert(
                "Déconnecté",
                "Vous avez été déconnecté avec succès",
                [
                  { text: "OK", onPress: () => navigation.navigate('Login') }
                ]
              );
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Déconnecter l'appareil",
        `Voulez-vous vraiment déconnecter "${device.name}" ?`,
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Déconnecter", 
            style: "destructive",
            onPress: () => {
              // Simuler la déconnexion de l'appareil
              setDevices(prevDevices => 
                prevDevices.filter(d => d.id !== device.id)
              );
              
              Alert.alert(
                "Appareil déconnecté",
                `"${device.name}" a été déconnecté avec succès`,
                [{ text: "OK" }]
              );
            }
          }
        ]
      );
    }
  };
  
  // Gérer la déconnexion de tous les autres appareils
  const handleLogoutAllDevices = () => {
    Alert.alert(
      "Déconnecter tous les appareils",
      "Voulez-vous vraiment déconnecter tous les autres appareils ? Vous resterez connecté sur cet appareil.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnecter tout", 
          style: "destructive",
          onPress: () => {
            // Filtrer pour ne garder que l'appareil actuel
            setDevices(prevDevices => 
              prevDevices.filter(device => device.isCurrentDevice)
            );
            
            Alert.alert(
              "Appareils déconnectés",
              "Tous les autres appareils ont été déconnectés avec succès",
              [{ text: "OK" }]
            );
          }
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
        <Text style={styles.headerTitle}>Appareils connectés</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des appareils...</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollView}>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Voici la liste des appareils qui sont actuellement connectés à votre compte. 
                Vous pouvez déconnecter les appareils que vous ne reconnaissez pas.
              </Text>
            </View>
            
            <View style={styles.devicesContainer}>
              {devices.map(device => (
                <View key={device.id} style={styles.deviceItem}>
                  <View style={styles.deviceIconContainer}>
                    {getDeviceIcon(device.type)}
                  </View>
                  
                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceNameContainer}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      {device.isCurrentDevice && (
                        <View style={styles.currentDeviceBadge}>
                          <Text style={styles.currentDeviceText}>Actuel</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.deviceLastActive}>{device.lastActive}</Text>
                    <Text style={styles.deviceLocation}>{device.location}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={() => handleLogoutDevice(device)}
                  >
                    <Ionicons name="log-out" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            {devices.length > 1 && (
              <TouchableOpacity 
                style={styles.logoutAllButton}
                onPress={handleLogoutAllDevices}
              >
                <Ionicons name="log-out" size={20} color="#FF3B30" />
                <Text style={styles.logoutAllText}>Déconnecter tous les autres appareils</Text>
              </TouchableOpacity>
            )}
            
            {devices.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#34C759" />
                <Text style={styles.emptyStateTitle}>Aucun autre appareil connecté</Text>
                <Text style={styles.emptyStateText}>
                  Vous êtes connecté uniquement sur cet appareil.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F0FF',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3C',
  },
  devicesContainer: {
    marginTop: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  currentDeviceBadge: {
    backgroundColor: '#E9F9EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1EFDC',
  },
  currentDeviceText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  deviceLastActive: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deviceLocation: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 12,
  },
  logoutAllText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ConnectedDevicesScreen;