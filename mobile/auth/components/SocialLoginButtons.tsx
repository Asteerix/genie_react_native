import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const SocialLoginButtons: React.FC = () => {
  const { socialSignIn } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.orText}>Ou continuer avec</Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.socialButton} 
          onPress={() => socialSignIn('apple')}
        >
          <AntDesign name="apple1" size={24} color="black" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.socialButton} 
          onPress={() => socialSignIn('google')}
        >
          <AntDesign name="google" size={24} color="#DB4437" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.socialButton, styles.facebookButton]} 
          onPress={() => socialSignIn('facebook')}
        >
          <FontAwesome name="facebook" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  orText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  socialButton: {
    width: 100,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
});

export default SocialLoginButtons;