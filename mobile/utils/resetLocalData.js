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
    
    // Get all keys to find any that might be related to auth
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Standard auth keys we know about
    const knownAuthKeys = [
      'user',
      'accessToken', 
      'refreshToken',
      'userProfile',
      'lastLogin',
      '@auth_token',
      'auth_token',
      '@access_token',
      'access_token', 
      'token',
      '@refresh_token',
      'refresh_token',
      '@user_profile',
      'user_profile',
      'managed_accounts_raw',
      'current_user',
      '@current_user',
      'login_state',
      'AUTH_KEY',
      'jwt_token'
    ];
    
    // Find any keys that might be related to auth but aren't in our known list
    const patternMatchedAuthKeys = allKeys.filter(key => 
      key.toLowerCase().includes('token') || 
      key.toLowerCase().includes('auth') || 
      key.toLowerCase().includes('user') ||
      key.toLowerCase().includes('login') ||
      key.toLowerCase().includes('jwt') ||
      key.toLowerCase().includes('session')
    );
    
    // Combine known keys with pattern-matched keys
    const allAuthKeys = [...new Set([...knownAuthKeys, ...patternMatchedAuthKeys])];
    
    // Filter to only include keys that actually exist in storage
    const existingAuthKeys = allAuthKeys.filter(key => allKeys.includes(key));
    
    logger.info(`Found ${existingAuthKeys.length} auth-related keys to remove`);
    
    if (existingAuthKeys.length > 0) {
      await AsyncStorage.multiRemove(existingAuthKeys);
    }
    
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

/**
 * Force reconnection by clearing only token data
 * This is useful when tokens have expired or are invalid
 */
export const forceReconnect = async () => {
  try {
    logger.info('Force reconnect - clearing only token data');
    
    // Standard auth keys related to tokens only
    const tokenKeys = [
      'accessToken', 
      'refreshToken',
      '@auth_token',
      'auth_token',
      '@access_token',
      'access_token', 
      'token',
      '@refresh_token',
      'refresh_token',
      'jwt_token'
    ];
    
    // Get all keys to find any token-related ones
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Find any keys that might be token-related but aren't in our known list
    const patternMatchedTokenKeys = allKeys.filter(key => 
      key.toLowerCase().includes('token') || 
      key.toLowerCase().includes('jwt')
    );
    
    // Combine known keys with pattern-matched keys
    const allTokenKeys = [...new Set([...tokenKeys, ...patternMatchedTokenKeys])];
    
    // Filter to only include keys that actually exist in storage
    const existingTokenKeys = allTokenKeys.filter(key => allKeys.includes(key));
    
    logger.info(`Found ${existingTokenKeys.length} token-related keys to remove`);
    
    if (existingTokenKeys.length > 0) {
      await AsyncStorage.multiRemove(existingTokenKeys);
    }
    
    logger.info('Token data successfully cleared for forced reconnection');
    return true;
  } catch (error) {
    logger.error('Failed to clear token data for forced reconnection', { error: error.message });
    throw error;
  }
};

/**
 * Show a confirmation dialog to force reconnection
 */
export const confirmAndForceReconnect = (onComplete = () => {}) => {
  Alert.alert(
    'Force Reconnection',
    'This will clear your authentication tokens but keep your login information. You will be asked to log in again. Continue?',
    [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Force Reconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await forceReconnect();
            Alert.alert('Success', 'Authentication tokens have been cleared. Please log in again.');
            onComplete(true);
          } catch (error) {
            Alert.alert('Error', 'Failed to clear tokens: ' + error.message);
            onComplete(false);
          }
        }
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
  showResetOptions,
  forceReconnect,
  confirmAndForceReconnect
};