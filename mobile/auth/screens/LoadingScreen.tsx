import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoadingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Loading'>;

const LoadingScreen: React.FC = () => {
  const { isLoading, user } = useAuth();
  const navigation = useNavigation<LoadingScreenNavigationProp>();
  // L'état isLoading et user du AuthContext sont suffisants

  // Rediriger l'utilisateur une fois que le chargement initial de AuthContext est terminé
  useEffect(() => {
    // Attendre que AuthContext ait fini de charger l'état initial
    if (!isLoading) {
      if (user) {
        // Utilisateur connecté, rediriger vers la page d'accueil principale
        console.log('AuthContext: Utilisateur trouvé, redirection vers HomePage');
        navigation.replace('HomePage');
      } else {
        // Utilisateur non connecté, rediriger vers l'écran de connexion
        console.log('AuthContext: Aucun utilisateur trouvé, redirection vers Login');
        navigation.replace('Login');
      }
    }
  }, [isLoading, user, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>APP</Text>
      </View>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default LoadingScreen;