import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type LoadingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Loading'>;

const LoadingScreen: React.FC = () => {
  const { isLoading, user } = useAuth();
  const navigation = useNavigation<LoadingScreenNavigationProp>();

  useEffect(() => {
    if (!isLoading) {
      // Si l'utilisateur est connecté, aller à l'écran d'accueil
      // Sinon, aller à l'écran de connexion
      if (user) {
        navigation.replace('AddWish');
      } else {
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