import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';

type NavigationProp = StackNavigationProp<RootStackParamList, 'PaymentConfirmation'>;
type RouteProps = RouteProp<RootStackParamList, 'PaymentConfirmation'>;

const PaymentConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { amount, recipient, paymentMethod } = route.params;
  const { currentUser, transferFunds } = useProfile();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleConfirm = () => {
    // Convertir le montant en nombre
    const amountNumber = parseFloat(amount) || 0;
    
    if (amountNumber <= 0) {
      alert('Montant invalide');
      return;
    }
    
    // Commencer le traitement
    setIsProcessing(true);
    
    // Effectuer le transfert via le context
    setTimeout(() => {
      const success = transferFunds(amountNumber, recipient.id);
      
      if (success) {
        setIsProcessing(false);
        setIsSuccess(true);
        
        // Fermer l'écran après un délai
        setTimeout(() => {
          navigation.navigate('Messages');
        }, 1500);
      } else {
        setIsProcessing(false);
        alert('Erreur lors du transfert. Veuillez vérifier votre solde et réessayer.');
      }
    }, 1000);
  };

  // Formater le nom de la méthode de paiement
  const getPaymentMethodName = () => {
    switch(paymentMethod) {
      case 'ApplePay':
        return 'Apple Pay';
      case 'DebitCard':
        return 'Carte de débit';
      case 'BankAccount':
        return 'Compte bancaire';
      default:
        return 'Méthode inconnue';
    }
  };

  const renderPaymentMethodIcon = () => {
    switch(paymentMethod) {
      case 'ApplePay':
        return (
          <View style={styles.applePay}>
            <Ionicons name="logo-apple" size={28} color="black" />
            <Text style={styles.applePayText}>Pay</Text>
          </View>
        );
      case 'DebitCard':
        return <Ionicons name="card-outline" size={28} color="black" />;
      case 'BankAccount':
        return <Ionicons name="business-outline" size={28} color="black" />;
      default:
        return <Ionicons name="help-circle-outline" size={28} color="black" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {!isSuccess && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {isProcessing ? "Traitement en cours..." : 
           isSuccess ? "Paiement réussi" : "Confirmation de paiement"}
        </Text>
      </View>

      <View style={styles.content}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.processingText}>Traitement du paiement...</Text>
          </View>
        ) : isSuccess ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.successText}>{amount}€ envoyés à {recipient.name}</Text>
          </View>
        ) : (
          <>
            {/* Détails du paiement */}
            <View style={styles.paymentDetails}>
              {/* Montant et destinataire */}
              <View style={styles.mainAmountContainer}>
                {/* Photo destinataire */}
                <View style={styles.userAvatarContainer}>
                  {recipient.avatar ? (
                    <Image 
                      source={{ uri: recipient.avatar }} 
                      style={styles.userAvatar} 
                    />
                  ) : (
                    <View style={[styles.userAvatar, { backgroundColor: '#8effa9' }]}>
                      <Text style={styles.avatarInitial}>
                        {recipient.name ? recipient.name.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Signe + */}
                <Text style={styles.plusSign}>+</Text>
                
                {/* Montant */}
                <Text style={styles.amountText}>{amount}</Text>
                
                {/* Symbole € */}
                <Text style={styles.currencySymbol}>€</Text>
              </View>
            </View>

            {/* Méthode de paiement */}
            <View style={styles.paymentMethodContainer}>
              <View style={styles.paymentMethod}>
                <View style={styles.iconCircle}>
                  {renderPaymentMethodIcon()}
                </View>
                <Text style={styles.paymentMethodText}>{getPaymentMethodName()}</Text>
                <TouchableOpacity 
                  style={styles.changeButton}
                  onPress={() => navigation.navigate('PaymentMethod', { amount, recipient })}
                >
                  <Text style={styles.changeButtonText}>Changer</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.feeText}>Instantané et Sans frais</Text>
          </>
        )}
      </View>

      {!isProcessing && !isSuccess && (
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirmer</Text>
        </TouchableOpacity>
      )}
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  paymentDetails: {
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  // Styles pour l'affichage du montant principal
  mainAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 20,
    width: '90%',
  },
  userAvatarContainer: {
    marginRight: 10,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e1ffd6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  plusSign: {
    fontSize: 36,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Styles pour la méthode de paiement
  paymentMethodContainer: {
    width: '100%',
    paddingHorizontal: 15,
    marginBottom: 30,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
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
  paymentMethodText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeButton: {
    paddingHorizontal: 15,
  },
  changeButtonText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  feeText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  // Styles pour le bouton de confirmation
  confirmButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 30,
    margin: 20,
    marginBottom: 40,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Styles pour le traitement
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  processingText: {
    fontSize: 18,
    marginTop: 20,
    color: '#555',
  },
  // Styles pour le succès
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
});

export default PaymentConfirmationScreen;