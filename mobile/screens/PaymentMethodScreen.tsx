import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList, 'PaymentMethod'>;
type RouteProps = RouteProp<RootStackParamList, 'PaymentMethod'>;

const PaymentMethodScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleSelectMethod = (method: string) => {
    // Convertir le nom lisible de la méthode en identifiant pour l'API
    let paymentMethodId = '';
    if (method === 'Apple Pay') {
      paymentMethodId = 'ApplePay';
    } else if (method === 'Carte de débit') {
      paymentMethodId = 'DebitCard';
    } else if (method === 'Compte bancaire') {
      paymentMethodId = 'BankAccount';
    }
    
    // Naviguer vers l'écran de confirmation de paiement
    navigation.navigate('PaymentConfirmation', {
      amount: route.params?.amount || '0',
      recipient: route.params?.recipient || {
        id: 'default-id',
        name: 'Destinataire'
      },
      paymentMethod: paymentMethodId as 'ApplePay' | 'DebitCard' | 'BankAccount'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Changer de paiement</Text>
      </View>

      {/* Options de paiement */}
      <View style={styles.paymentOptions}>
        {/* Apple Pay */}
        <TouchableOpacity 
          style={styles.paymentOption}
          onPress={() => handleSelectMethod('Apple Pay')}
        >
          <View style={styles.paymentIconContainer}>
            <View style={styles.applePay}>
              <Ionicons name="logo-apple" size={28} color="black" />
              <Text style={styles.applePayText}>Pay</Text>
            </View>
          </View>
          <Text style={styles.paymentOptionText}>Apple Pay</Text>
          <TouchableOpacity style={styles.chooseButton}>
            <Text style={styles.chooseButtonText}>Choisir</Text>
          </TouchableOpacity>
        </TouchableOpacity>
        
        {/* Carte de débit */}
        <TouchableOpacity 
          style={styles.paymentOption}
          onPress={() => handleSelectMethod('Carte de débit')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="card-outline" size={28} color="black" />
          </View>
          <Text style={styles.paymentOptionText}>Carte de débit</Text>
          <TouchableOpacity style={styles.chooseButton}>
            <Text style={styles.chooseButtonText}>Choisir</Text>
          </TouchableOpacity>
        </TouchableOpacity>
        
        {/* Compte bancaire */}
        <TouchableOpacity 
          style={styles.paymentOption}
          onPress={() => handleSelectMethod('Compte bancaire')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="business-outline" size={28} color="black" />
          </View>
          <Text style={styles.paymentOptionText}>Compte bancaire</Text>
          <TouchableOpacity style={styles.chooseButton}>
            <Text style={styles.chooseButtonText}>Choisir</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 30,
  },
  paymentOptions: {
    padding: 15,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  paymentIconContainer: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    marginRight: 15,
  },
  applePay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applePayText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  chooseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  chooseButtonText: {
    fontSize: 18,
    color: '#888',
    fontWeight: '500',
  },
});

export default PaymentMethodScreen;