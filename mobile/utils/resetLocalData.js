/**
 * Reset Local Data Utility
 * 
 * This utility provides functions to reset all local storage data
 * to allow for clean testing of the application.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';
import { Alert } from 'react-native';

/**
 * Reset all AsyncStorage keys
 * @returns {Promise<void>}
 */
export const resetAllStorage = async () => {
  try {
    logger.info('Resetting all AsyncStorage data');
    await AsyncStorage.clear();
    logger.info('AsyncStorage successfully cleared');
    return true;
  } catch (error) {
    logger.error('Failed to clear AsyncStorage', { error: error.message });
    throw error;
  }
};

/**
 * Reset authentication data specifically
 * @returns {Promise<void>}
 */
export const resetAuthData = async () => {
  try {
    logger.info('Resetting authentication data');
    // Remove specific auth-related keys
    await AsyncStorage.multiRemove([
      'user',
      'accessToken', 
      'refreshToken',
      'userProfile',
      'lastLogin'
    ]);
    logger.info('Authentication data successfully cleared');
    return true;
  } catch (error) {
    logger.error('Failed to clear authentication data', { error: error.message });
    throw error;
  }
};

/**
 * Reset app preferences/settings
 * @returns {Promise<void>}
 */
export const resetAppSettings = async () => {
  try {
    logger.info('Resetting app settings');
    // List all keys that start with 'setting:'
    const allKeys = await AsyncStorage.getAllKeys();
    const settingsKeys = allKeys.filter(key => 
      key.startsWith('setting:') || 
      key.startsWith('preference:') ||
      key.startsWith('app:')
    );
    
    if (settingsKeys.length > 0) {
      await AsyncStorage.multiRemove(settingsKeys);
    }
    
    logger.info('App settings successfully cleared', { keyCount: settingsKeys.length });
    return true;
  } catch (error) {
    logger.error('Failed to clear app settings', { error: error.message });
    throw error;
  }
};

/**
 * Show a confirmation dialog and reset all data if confirmed
 */
export const confirmAndResetAllData = (onComplete = () => {}) => {
  Alert.alert(
    'Reset All Data',
    'This will clear all locally stored data including login information. You will need to log in again. Continue?',
    [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetAllStorage();
            Alert.alert('Success', 'All data has been reset.');
            onComplete(true);
          } catch (error) {
            Alert.alert('Error', 'Failed to reset data: ' + error.message);
            onComplete(false);
          }
        }
      }
    ]
  );
};

/**
 * Show options for what to reset
 */
export const showResetOptions = () => {
  Alert.alert(
    'Reset Options',
    'What would you like to reset?',
    [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Auth Data Only',
        onPress: async () => {
          try {
            await resetAuthData();
            Alert.alert('Success', 'Auth data has been reset.');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset auth data: ' + error.message);
          }
        }
      },
      {
        text: 'App Settings Only',
        onPress: async () => {
          try {
            await resetAppSettings();
            Alert.alert('Success', 'App settings have been reset.');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset app settings: ' + error.message);
          }
        }
      },
      {
        text: 'All Data',
        style: 'destructive',
        onPress: () => confirmAndResetAllData()
      }
    ]
  );
};

// Export default for ease of use
export default {
  resetAllStorage,
  resetAuthData,
  resetAppSettings,
  confirmAndResetAllData,
  showResetOptions
};