import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationOption {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const NotificationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  
  const [notificationOptions, setNotificationOptions] = useState<NotificationOption[]>([
    {
      id: 'push',
      title: 'Notifications push',
      description: 'Recevez des notifications instantanées sur votre appareil',
      enabled: true,
    },
    {
      id: 'events',
      title: 'Événements',
      description: 'Soyez informé des événements à venir et des mises à jour',
      enabled: true,
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Nouvelles conversations et messages reçus',
      enabled: true,
    },
    {
      id: 'wishlist',
      title: 'Listes de souhaits',
      description: 'Mises à jour et activités sur vos listes de souhaits',
      enabled: false,
    },
    {
      id: 'friends',
      title: 'Amis',
      description: 'Demandes d\'amis et nouveaux contacts',
      enabled: true,
    },
    {
      id: 'payments',
      title: 'Paiements',
      description: 'Transactions et informations financières',
      enabled: true,
    },
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Offres exclusives et actualités',
      enabled: false,
    },
  ]);

  const toggleSwitch = (id: string) => {
    setNotificationOptions(
      notificationOptions.map(option => 
        option.id === id ? { ...option, enabled: !option.enabled } : option
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main toggle for all notifications */}
        <View style={styles.mainToggleContainer}>
          <View style={styles.mainToggleContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications" size={24} color="#000" />
            </View>
            <View style={styles.mainToggleTextContainer}>
              <Text style={styles.mainToggleTitle}>Toutes les notifications</Text>
              <Text style={styles.mainToggleDescription}>
                Activez ou désactivez toutes les notifications en une seule fois
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: '#E0E0E0', true: '#000' }}
            thumbColor="#FFF"
            ios_backgroundColor="#E0E0E0"
            value={notificationOptions.some(option => option.enabled)}
            onValueChange={() => {
              const allEnabled = notificationOptions.every(option => option.enabled);
              setNotificationOptions(
                notificationOptions.map(option => ({ ...option, enabled: !allEnabled }))
              );
            }}
          />
        </View>

        {/* Specific notification options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Préférences de notification</Text>
          
          {notificationOptions.map((option, index) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Switch
                trackColor={{ false: '#E0E0E0', true: '#000' }}
                thumbColor="#FFF"
                ios_backgroundColor="#E0E0E0"
                value={option.enabled}
                onValueChange={() => toggleSwitch(option.id)}
              />
            </View>
          ))}
        </View>

        {/* Additional settings */}
        <View style={styles.additionalSettingsContainer}>
          <Text style={styles.sectionTitle}>Paramètres supplémentaires</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingTitle}>Sons de notification</Text>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingTitle}>Vibrations</Text>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingTitle}>Notifications par email</Text>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>
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
  placeholderButton: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  mainToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  mainToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  mainToggleTextContainer: {
    flex: 1,
  },
  mainToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  mainToggleDescription: {
    fontSize: 14,
    color: '#888',
  },
  optionsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888',
  },
  additionalSettingsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationsScreen;