import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ProfileScreen.styles'; // Importer les styles

interface Transaction {
  id: string;
  type: 'invitation' | 'transaction'; // Type de transaction
  name: string; // Nom (personne ou type d'invitation)
  date?: string; // Date (pour invitation)
  avatar: any; // Type 'any' car utilise require() dans l'original
  amount: number | null; // Montant (null pour invitation)
}

interface TransactionsListProps {
  transactions: Transaction[];
  isPersonalAccount: boolean; // Pour conditionner l'affichage
  onSeeAll?: () => void; // Action pour "voir tout"
  onTransactionPress?: (transactionId: string) => void; // Action au clic sur une transaction
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  isPersonalAccount,
  onSeeAll,
  onTransactionPress,
}) => {
  // N'affiche la section que si c'est un compte personnel et qu'il y a des transactions
  if (!isPersonalAccount || transactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.transactionsContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.transactionIconContainer}>
          {/* L'icône rose semble statique dans l'original */}
          <Ionicons name="rose" size={22} color="#FF0000" />
          <Text style={styles.transactionTitle}>Mes transactions</Text>
        </View>
        {onSeeAll && ( // Affiche "voir tout" seulement si la fonction est fournie
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>voir tout</Text>
          </TouchableOpacity>
        )}
      </View>

      {transactions.map(transaction => (
        <TouchableOpacity
          key={transaction.id}
          style={styles.transactionItem}
          onPress={() => onTransactionPress?.(transaction.id)}
          disabled={!onTransactionPress} // Désactive si aucune action n'est fournie
        >
          <View style={styles.transactionLeftContent}>
            <Image
              source={transaction.avatar} // Utilise la source fournie
              style={styles.transactionAvatar}
            />
            <View style={styles.transactionDetails}>
              {transaction.type === 'invitation' ? (
                <View style={styles.invitationRow}>
                  <Text style={styles.transactionName}>{transaction.name}</Text>
                  {transaction.date && ( // Affiche la date seulement si elle existe
                    <View style={styles.invitationDateContainer}>
                      <Text style={styles.invitationDate}>{transaction.date}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.transactionName}>{transaction.name}</Text>
              )}
            </View>
          </View>

          <View style={styles.transactionRightContent}>
            {transaction.amount !== null && (
              <Text style={[
                styles.transactionAmount,
                transaction.amount < 0 ? styles.negativeAmount : styles.positiveAmount
              ]}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount} €
              </Text>
            )}
            {/* Affiche la flèche seulement si une action est possible */}
            {onTransactionPress && (
              <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.transactionArrow} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TransactionsList;