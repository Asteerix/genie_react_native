import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Interface pour les comptes bancaires
interface BankAccount {
  id: string;
  bankName: string;
  ownerName: string;
  iban: string;
  bic: string;
}

const BankAccountsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Exemple de comptes bancaires (en production, ces données viendraient d'une API)
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: 'acc1',
      bankName: 'LCL',
      ownerName: 'Dan Toulet',
      iban: 'FR76XXXXXXXXXXXXXXXXX71',
      bic: 'LCLFR24'
    },
    {
      id: 'acc2',
      bankName: 'Revolut',
      ownerName: 'Dan Toulet',
      iban: 'FR76XXXXXXXXXXXXXXXXX64',
      bic: 'REVOFR21'
    }
  ]);
  
  // Fonction pour masquer partiellement l'IBAN pour l'affichage
  const formatIbanForDisplay = (iban: string) => {
    if (!iban) return '';
    
    // Conserver les 2 premiers et les 2 derniers caractères, cacher le reste
    const start = iban.substring(0, 2);
    const end = iban.substring(iban.length - 2);
    
    // Remplacer les caractères cachés par des astérisques
    return `${start}** **** **** **** **** ${end}`;
  };
  
  // Ajouter un nouveau compte
  const handleAddAccount = () => {
    navigation.navigate('BankAccountDetail', { isEditing: true });
  };
  
  // Sélectionner un compte existant
  const handleAccountSelect = (account: BankAccount) => {
    navigation.navigate('BankAccountDetail', { account });
  };
  
  // Rendu d'un item de liste
  const renderAccountItem = ({ item }: { item: BankAccount }) => (
    <TouchableOpacity 
      style={styles.accountItem}
      onPress={() => handleAccountSelect(item)}
    >
      <View style={styles.bankIconContainer}>
        <Ionicons name="business" size={24} color="#333" />
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.bankName}>{item.bankName} - {item.ownerName}</Text>
        <Text style={styles.ibanText}>* {formatIbanForDisplay(item.iban)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#CCC" />
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton de retour et titre */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comptes bancaires</Text>
      </View>
      
      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Bouton pour ajouter un compte */}
        <TouchableOpacity 
          style={styles.addAccountButton}
          onPress={handleAddAccount}
        >
          <View style={styles.addIconContainer}>
            <Ionicons name="add" size={28} color="#777" />
          </View>
          <Text style={styles.addAccountText}>Ajouter un compte</Text>
          <Ionicons name="chevron-forward" size={24} color="#CCC" style={styles.forwardIcon} />
        </TouchableOpacity>
        
        {/* Liste des comptes bancaires */}
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Texte informatif si aucun compte n'est disponible */}
        {accounts.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Vous n'avez pas encore ajouté de compte bancaire.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Ajoutez un compte pour pouvoir transférer votre argent.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
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
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addAccountText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  forwardIcon: {
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  bankIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ibanText: {
    fontSize: 14,
    color: '#777',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
});

export default BankAccountsScreen;