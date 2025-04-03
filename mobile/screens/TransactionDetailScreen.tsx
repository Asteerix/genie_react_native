import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getTransactionDetails } from '../api/profile';

type TransactionDetailScreenRouteProp = RouteProp<RootStackParamList, 'TransactionDetail'>;

const TransactionDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TransactionDetailScreenRouteProp>();
  const { transactionId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const loadTransaction = useCallback(async () => {
    setLoading(true);
    
    try {
      const result = await getTransactionDetails(transactionId);
      if (result.error) {
        setError(result.error);
        setTransaction(null);
      } else {
        setTransaction(result.data);
        setError(null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la transaction:', err);
      setError('Impossible de charger les détails de la transaction');
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);
  
  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadTransaction}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={50} color="#888" />
        <Text style={styles.errorText}>Transaction introuvable</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Format de la date
  const formattedDate = new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la transaction</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.transactionCard}>
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amountText,
              transaction.type === 'CREDIT' ? styles.creditAmount : styles.debitAmount
            ]}>
              {transaction.type === 'CREDIT' ? '+' : '-'}{Math.abs(transaction.amount)} €
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: transaction.type === 'CREDIT' ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: transaction.type === 'CREDIT' ? '#388E3C' : '#D32F2F' }
              ]}>
                {transaction.type === 'CREDIT' ? 'Crédit' : 'Débit'}
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue}>{transaction.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{transaction.description || 'Pas de description'}</Text>
            </View>
          </View>
          
          {transaction.recipientId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Destinataire</Text>
              <View style={styles.recipientContainer}>
                <Image
                  source={{ 
                    uri: transaction.recipientAvatar || 
                         `https://ui-avatars.com/api/?name=${encodeURIComponent(transaction.recipientName?.charAt(0) || 'U')}&background=random&color=FFFFFF&size=100` 
                  }}
                  style={styles.recipientAvatar}
                />
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>{transaction.recipientName || 'Utilisateur'}</Text>
                  <Text style={styles.recipientId}>ID: {transaction.recipientId}</Text>
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download-outline" size={20} color="#4285F4" />
              <Text style={styles.actionText}>Reçu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-social-outline" size={20} color="#4285F4" />
              <Text style={styles.actionText}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="repeat-outline" size={20} color="#4285F4" />
              <Text style={styles.actionText}>Répéter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  creditAmount: {
    color: '#4CD964',
  },
  debitAmount: {
    color: '#FF3B30',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  recipientId: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#4285F4',
  },
});

export default TransactionDetailScreen;