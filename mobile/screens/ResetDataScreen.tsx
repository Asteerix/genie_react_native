import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import resetLocalData, { resetAuthData, resetAppSettings, resetAllStorage, forceReconnect } from '../utils/resetLocalData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResetDataScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Options de réinitialisation des données
  const [resetOptions, setResetOptions] = useState({
    auth: false,
    managedAccounts: false,
    events: false,
    wishlists: false,
    friends: false,
    messages: false,
    preferences: false,
    all: false
  });

  const toggleOption = (key: keyof typeof resetOptions) => {
    setResetOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const anyOptionSelected = Object.values(resetOptions).some(val => val);

  const handleResetData = () => {
    // Show message if no option is selected
    if (!anyOptionSelected) {
      Alert.alert(
        "No Option Selected",
        "Please select at least one data category to reset.",
        [{ text: "OK" }]
      );
      return;
    }

    // Ask for confirmation before resetting
    Alert.alert(
      "Reset Data",
      "This action cannot be undone. Are you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: () => performReset() 
        }
      ]
    );
  };

  const performReset = async () => {
    try {
      setIsLoading(true);
      
      // Get all AsyncStorage keys to help with targeted reset
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Handle different reset options
      if (resetOptions.all) {
        await resetAllStorage();
      } else {
        // Handle authentication data reset
        if (resetOptions.auth) {
          await resetAuthData();
        }
        
        // Handle managed accounts reset
        if (resetOptions.managedAccounts) {
          const managedAccountKeys = allKeys.filter(key => 
            key.includes('managed_account') || 
            key.includes('managedAccount') || 
            key.includes('profile_') ||
            key.includes('active_account')
          );
          
          if (managedAccountKeys.length > 0) {
            await AsyncStorage.multiRemove(managedAccountKeys);
            console.log(`Cleared ${managedAccountKeys.length} managed account related keys`);
          }
        }
        
        // Handle events reset
        if (resetOptions.events) {
          const eventKeys = allKeys.filter(key => 
            key.includes('event_') || 
            key.includes('events_') || 
            key.includes('calendar_')
          );
          
          if (eventKeys.length > 0) {
            await AsyncStorage.multiRemove(eventKeys);
          }
        }
        
        // Handle wishlists reset
        if (resetOptions.wishlists) {
          const wishlistKeys = allKeys.filter(key => 
            key.includes('wish_') || 
            key.includes('wishlist_') || 
            key.includes('product_')
          );
          
          if (wishlistKeys.length > 0) {
            await AsyncStorage.multiRemove(wishlistKeys);
          }
        }
        
        // Handle friends reset
        if (resetOptions.friends) {
          const friendKeys = allKeys.filter(key => 
            key.includes('friend_') || 
            key.includes('contact_') || 
            key.includes('social_')
          );
          
          if (friendKeys.length > 0) {
            await AsyncStorage.multiRemove(friendKeys);
          }
        }
        
        // Handle messages reset
        if (resetOptions.messages) {
          const messageKeys = allKeys.filter(key => 
            key.includes('message_') || 
            key.includes('chat_') || 
            key.includes('conversation_')
          );
          
          if (messageKeys.length > 0) {
            await AsyncStorage.multiRemove(messageKeys);
          }
        }
        
        // Handle preferences reset
        if (resetOptions.preferences) {
          await resetAppSettings();
        }
      }
      
      setIsLoading(false);
      
      // Show confirmation message
      Alert.alert(
        "Data Reset Complete",
        "The selected data has been successfully reset. You may need to restart the app for all changes to take effect.",
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('Loading')
          }
        ]
      );
    } catch (error) {
      setIsLoading(false);
      console.error('Reset error:', error);
      
      Alert.alert(
        "Reset Error",
        "An error occurred while resetting the data: " + (error instanceof Error ? error.message : "Unknown error"),
        [{ text: "OK" }]
      );
    }
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
        <Text style={styles.headerTitle}>Reset Application Data</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={32} color="#FF9500" />
          <Text style={styles.warningText}>
            Data reset is irreversible. This is primarily intended for testing and debugging. Make sure you want to proceed before confirming.
          </Text>
        </View>
        
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Select data to reset:</Text>
          
          <TouchableOpacity 
            style={[styles.optionItem, styles.criticalOption]}
            onPress={() => toggleOption('all')}
          >
            <Text style={styles.optionLabel}>All Data (Complete Reset)</Text>
            <Switch
              value={resetOptions.all}
              onValueChange={() => toggleOption('all')}
              trackColor={{ false: '#D1D1D6', true: '#FF3B30' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('auth')}
          >
            <Text style={styles.optionLabel}>Authentication (Logout)</Text>
            <Switch
              value={resetOptions.auth}
              onValueChange={() => toggleOption('auth')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('managedAccounts')}
          >
            <Text style={styles.optionLabel}>Managed Accounts</Text>
            <Switch
              value={resetOptions.managedAccounts}
              onValueChange={() => toggleOption('managedAccounts')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('events')}
          >
            <Text style={styles.optionLabel}>Events</Text>
            <Switch
              value={resetOptions.events}
              onValueChange={() => toggleOption('events')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('wishlists')}
          >
            <Text style={styles.optionLabel}>Wishlists</Text>
            <Switch
              value={resetOptions.wishlists}
              onValueChange={() => toggleOption('wishlists')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('friends')}
          >
            <Text style={styles.optionLabel}>Friends</Text>
            <Switch
              value={resetOptions.friends}
              onValueChange={() => toggleOption('friends')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('messages')}
          >
            <Text style={styles.optionLabel}>Messages</Text>
            <Switch
              value={resetOptions.messages}
              onValueChange={() => toggleOption('messages')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('preferences')}
          >
            <Text style={styles.optionLabel}>Preferences</Text>
            <Switch
              value={resetOptions.preferences}
              onValueChange={() => toggleOption('preferences')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.resetButton, 
            !anyOptionSelected && styles.resetButtonDisabled
          ]}
          onPress={handleResetData}
          disabled={!anyOptionSelected || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={22} color="white" />
              <Text style={styles.resetButtonText}>Reset Selected Data</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.reconnectContainer}>
          <Ionicons name="key-outline" size={32} color="#007BFF" />
          <Text style={styles.reconnectText}>
            Having issues with authentication errors (401)? Force a reconnection to get new authentication tokens without losing your account data.
          </Text>
          
          <TouchableOpacity 
            style={styles.reconnectButton}
            onPress={() => resetLocalData.confirmAndForceReconnect(() => navigation.navigate('Loading'))}
          >
            <Ionicons name="log-in-outline" size={22} color="white" />
            <Text style={styles.resetButtonText}>Force Reconnection</Text>
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
  criticalOption: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
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
  warningContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#8B4513',
    lineHeight: 22,
  },
  optionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  resetButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  resetButtonDisabled: {
    backgroundColor: '#FFB3B0',
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reconnectContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B0E0FF',
  },
  reconnectText: {
    fontSize: 15,
    color: '#0062CC',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  reconnectButton: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
});

export default ResetDataScreen;