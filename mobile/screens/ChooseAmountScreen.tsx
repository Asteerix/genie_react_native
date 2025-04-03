import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useProfile } from '../context/ProfileContext';

type ChooseAmountScreenRouteProp = RouteProp<RootStackParamList, 'ChooseAmount'>;

const ChooseAmountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChooseAmountScreenRouteProp>();
  const { activeProfile } = useProfile();
  
  const { user, paymentMethod, isAddingFunds } = route.params || {};
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  
  // Déterminer si on est dans un contexte de transfert vers une cagnotte d'événement
  const isEventTransfer = user && user.id.startsWith('event_');
  
  // Fonction pour formater le montant avec deux décimales (€)
  const formatAmount = (value: string) => {
    if (value === '') return '';
    
    // Supprimer tous les caractères non numériques, sauf le point décimal
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    
    // Gérer le cas où il y a plusieurs points décimaux
    const parts = cleanedValue.split('.');
    let formattedValue = parts[0];
    
    if (parts.length > 1) {
      // Conserver seulement les deux premières décimales
      formattedValue += '.' + parts[1].slice(0, 2);
    }
    
    return formattedValue;
  };
  
  // Gestion de la modification du montant
  const handleAmountChange = (text: string) => {
    const formattedAmount = formatAmount(text);
    setAmount(formattedAmount);
    
    // Réinitialiser l'erreur lors de la modification du montant
    if (error) setError('');
  };
  
  // Vérification du montant
  const isValidAmount = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setError('Veuillez entrer un montant valide.');
      return false;
    }
    
    const numericAmount = parseFloat(amount);
    
    if (numericAmount <= 0) {
      setError('Le montant doit être supérieur à zéro.');
      return false;
    }
    
    // Vérifier le solde uniquement si on fait un transfert (pas quand on ajoute des fonds)
    if (!isAddingFunds) {
      const availableBalance = activeProfile?.balance || 0;
      
      if (numericAmount > availableBalance) {
        setError(`Le montant dépasse votre solde disponible (${availableBalance} €).`);
        return false;
      }
    }
    
    return true;
  };
  
  // Gestion du transfert
  const handleTransfer = () => {
    if (!isValidAmount()) return;
    
    // Nous récupérons les fonctions du contexte à l'avance (en respectant les règles des hooks)
    const { addFunds } = useProfile();
    
    // Afficher une confirmation avec un message approprié
    Alert.alert(
      isAddingFunds ? "Confirmer l'ajout" : "Confirmer le transfert",
      isAddingFunds 
        ? `Voulez-vous vraiment ajouter ${amount} € à votre compte ?`
        : `Voulez-vous vraiment transférer ${amount} € vers ${user?.name || 'ce destinataire'} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: async () => {
            try {
              // Convertir le montant en nombre
              const numericAmount = parseFloat(amount);
              
              if (isAddingFunds) {
                // Si on ajoute des fonds (par exemple depuis une source externe)
                
                // Simulation d'une attente réseau
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Ajouter les fonds au portefeuille (avec la fonction récupérée à l'avance)
                const result = await addFunds(numericAmount);
                
                if (result) {
                  Alert.alert(
                    "Fonds ajoutés",
                    `${amount} € ont été ajoutés à votre compte avec succès.`,
                    [{ 
                      text: "OK", 
                      onPress: () => navigation.goBack() // Juste fermer l'écran actuel
                    }]
                  );
                } else {
                  Alert.alert(
                    "Erreur",
                    "Une erreur est survenue lors de l'ajout des fonds. Veuillez réessayer."
                  );
                }
              } else if (user) {
                // Si on envoie de l'argent à un utilisateur/compte
                // Ici on pourrait appeler une API pour effectuer un transfert
                // Par exemple:
                // await API.transferToUser(user.id, numericAmount);
                
                // Simulation d'une attente réseau
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                Alert.alert(
                  "Transfert effectué",
                  `Votre transfert de ${amount} € a été effectué avec succès.`,
                  [{ 
                    text: "OK", 
                    onPress: () => navigation.navigate('Profile')
                  }]
                );
              }
            } catch (error) {
              console.error("Erreur lors de l'opération:", error);
              Alert.alert(
                "Erreur",
                "Une erreur est survenue. Veuillez réessayer ou contacter le support."
              );
            }
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        {/* Header avec croix pour fermer */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isAddingFunds ? "Ajouter des fonds" : "Choisir un montant"}</Text>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Montant à transférer */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountPrefix}>0</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder=""
              keyboardType="decimal-pad"
              autoFocus={true}
            />
            <Text style={styles.amountSuffix}>€</Text>
          </View>
          
          {/* Affichage de l'erreur si présente */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          {/* Information sur le destinataire */}
          <View style={styles.transferInfoContainer}>
            <View style={styles.fromToContainer}>
              <Image 
                source={{ uri: activeProfile?.avatar || 'https://api.a0.dev/assets/image?text=User' }} 
                style={styles.avatarImage} 
              />
              <Ionicons name="arrow-forward" size={24} color="black" style={styles.arrowIcon} />
              
              {user && (
                <>
                  {isEventTransfer ? (
                    // Si c'est une cagnotte d'événement, afficher un emoji dans un cercle coloré
                    <View style={styles.eventIconContainer}>
                      <Text style={styles.eventEmoji}>{user.avatar || '🎁'}</Text>
                    </View>
                  ) : (
                    // Si c'est un participant, afficher son avatar
                    <Image 
                      source={{ uri: user.avatar || 'https://api.a0.dev/assets/image?text=U' }} 
                      style={styles.recipientAvatar} 
                    />
                  )}
                  <Text style={styles.recipientName}>{user.name}</Text>
                </>
              )}
            </View>
          </View>
          
          {/* Information additionnelle */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Instantané et Sans frais</Text>
          </View>
        </ScrollView>
        
        {/* Bouton de confirmation */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!amount || parseFloat(amount) <= 0) ? styles.disabledButton : null
            ]}
            onPress={handleTransfer}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <Ionicons name="arrow-forward" size={24} color="white" style={styles.sendIcon} />
            <Text style={styles.sendButtonText}>{isAddingFunds ? "Ajouter" : "Envoyer"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    left: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  amountPrefix: {
    fontSize: 48,
    fontWeight: '300',
    color: '#CCCCCC',
    marginRight: 5,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000000',
    minWidth: 100,
    textAlign: 'center',
  },
  amountSuffix: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 5,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  transferInfoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
  },
  fromToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  arrowIcon: {
    marginHorizontal: 10,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eventEmoji: {
    fontSize: 20,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: 'bold',
    maxWidth: 150,
  },
  infoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#888888',
  },
  bottomButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: 'white',
  },
  sendButton: {
    backgroundColor: 'black',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  sendIcon: {
    marginRight: 10,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChooseAmountScreen;