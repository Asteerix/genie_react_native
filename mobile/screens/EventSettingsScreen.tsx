import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

const EventSettingsScreen = () => {
  const navigation = useNavigation();
  const [moneyGoalEnabled, setMoneyGoalEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [adminsEnabled, setAdminsEnabled] = useState(true);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconAndText}>
              <Ionicons name="attach-money" size={24} color="black" />
              <Text style={styles.settingText}>Objectif de cagnotte</Text>
            </View>
            <Switch
              value={moneyGoalEnabled}
              onValueChange={setMoneyGoalEnabled}
              trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
              thumbColor={moneyGoalEnabled ? 'black' : 'white'}
            />
          </View>
          {moneyGoalEnabled && (
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>550 €</Text>
            </View>
          )}
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconAndText}>
              <Ionicons name="location-outline" size={24} color="black" />
              <Text style={styles.settingText}>Lieu d'événement</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
              thumbColor={locationEnabled ? 'black' : 'white'}
            />
          </View>
          {locationEnabled && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>15 rue des Lampes</Text>
              <View style={styles.cityPostalContainer}>
                <Text style={styles.locationText}>Paris</Text>
                <Text style={styles.locationText}>75012</Text>
              </View>
              <Text style={styles.locationText}>Code : 5478A, Etage 4, Apt. 10</Text>
            </View>
          )}
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconAndText}>
              <Ionicons name="people-outline" size={24} color="black" />
              <Text style={styles.settingText}>Administrateur(s)</Text>
            </View>
            <Switch
              value={adminsEnabled}
              onValueChange={setAdminsEnabled}
              trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
              thumbColor={adminsEnabled ? 'black' : 'white'}
            />
          </View>
          {adminsEnabled && (
            <View style={styles.adminsContainer}>
              <View style={styles.adminItem}>
                <Text style={styles.adminName}>Paul Marceau</Text>
                <Text style={styles.adminUsername}>paulmarceau</Text>
              </View>            <TouchableOpacity 
              style={styles.inviteFriendsButton}
              onPress={() => navigation.navigate('EventInviteFriends')}
            >
              <Text style={styles.inviteFriendsText}>Inviter des amis</Text>
            </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  settingIconAndText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 15,
  },
  amountContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  locationContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 15,
  },
  cityPostalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 5,
  },
  adminsContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    padding: 15,
  },
  adminItem: {
    marginBottom: 15,
  },
  adminName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminUsername: {
    fontSize: 14,
    color: '#666',
  },
  inviteFriendsButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  inviteFriendsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventSettingsScreen;