import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ProfileScreen.styles'; // Importer les styles

// Type pour les profils locaux (simplifié pour ce composant)
interface LocalProfileType {
  id: string;
  name: string;
  username: string;
  balance: number;
  avatar: string;
  isAdd: boolean;
  isPersonal: boolean;
}

interface AccountCardProps {
  activeProfile: LocalProfileType;
  onRefreshBalance?: () => void; // Optionnel: fonction pour rafraîchir le solde
  onTransfer?: () => void; // Optionnel: fonction pour l'action "Transférer"
  onUse?: () => void; // Optionnel: fonction pour l'action "Utiliser" (compte perso)
  onAddMoney?: () => void;
  onDetails?: () => void;
  onTransactions?: () => void; // Ajouter la prop pour l'action "Transactions"
}

const AccountCard: React.FC<AccountCardProps> = ({
  activeProfile,
  onRefreshBalance,
  onTransfer,
  onUse,
  onAddMoney,
  onDetails,
  onTransactions, // Récupérer la nouvelle prop
}) => {
  // Ne rend rien si le profil est le bouton "+" ou si le profil n'est pas défini
  if (!activeProfile || activeProfile.isAdd) {
    return null;
  }

  return (
    <View style={styles.accountCardContainer}>
      <View style={styles.accountCardHeader}>
        <Text style={styles.accountCardTitle}>
          {activeProfile.isPersonal ? "MONTANT DISPONIBLE" : "MONTANT DU COMPTE GÉRÉ"}
        </Text>
        {onRefreshBalance && ( // Affiche le bouton refresh seulement si la fonction est fournie
          <TouchableOpacity style={styles.refreshButton} onPress={onRefreshBalance}>
            <Ionicons name="sync-outline" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.accountCardBalance}>{activeProfile.balance.toFixed(2)} €</Text>

      {activeProfile.isPersonal ? (
        /* Interface pour compte personnel */
        <View style={styles.accountCardActions}>
          <TouchableOpacity style={styles.accountCardActionButton} onPress={onTransfer}>
            <View style={[styles.actionButtonCircle, styles.transferButtonCircle]}>
              <Ionicons name="arrow-forward-outline" size={20} color="black" />
            </View>
            <Text style={styles.actionButtonText}>Transférer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountCardActionButton} onPress={onUse}>
            <View style={styles.actionButtonCircle}>
              <Ionicons name="card" size={24} color="white" />
            </View>
            <Text style={styles.actionButtonText}>Utiliser</Text>
          </TouchableOpacity>

          {/* Nouveau bouton Transactions */}
          <TouchableOpacity style={styles.accountCardActionButton} onPress={onTransactions}>
            <View style={[styles.actionButtonCircle, styles.transactionsButtonCircle]}>
              <Ionicons name="list-outline" size={20} color="black" />
            </View>
            <Text style={styles.actionButtonText}>Transactions</Text>
          </TouchableOpacity>

          {/* Le bouton "Gold" semble être une donnée statique/placeholder, on le garde simple */}
          <TouchableOpacity style={styles.accountCardActionButton}>
            <View style={[styles.actionButtonCircle, styles.goldButtonCircle]}>
              <Text style={styles.goldButtonText}>g</Text>
            </View>
            <Text style={styles.actionButtonText}>1050</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Interface pour compte géré */
        <View style={styles.accountCardActions}>
          <TouchableOpacity style={styles.accountCardActionButton} onPress={onAddMoney}>
            <View style={styles.actionButtonCircle}>
              <Ionicons name="add" size={24} color="white" />
            </View>
            <Text style={styles.actionButtonText}>Ajouter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountCardActionButton} onPress={onTransfer}>
            <View style={[styles.actionButtonCircle, styles.transferButtonCircle]}>
              <Ionicons name="arrow-forward-outline" size={20} color="black" />
            </View>
            <Text style={styles.actionButtonText}>Transférer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountCardActionButton} onPress={onDetails}>
            <View style={[styles.actionButtonCircle, styles.detailsButtonCircle]}>
              <Ionicons name="card" size={20} color="black" />
            </View>
            <Text style={styles.actionButtonText}>Détails</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AccountCard;