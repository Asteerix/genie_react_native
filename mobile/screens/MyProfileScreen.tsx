import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useProfile } from '../context/ProfileContext';

const transactions = [
  {
    id: '1',
    name: 'Audriana Toulet',
    amount: -4,
    profilePicture: { uri: 'https://api.a0.dev/assets/image?text=Audriana' },
  },
];

const MyProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { currentUser } = useProfile();

  // Default data if currentUser is null
  const userData = currentUser ? {
    name: currentUser.name,
    username: currentUser.username,
    profilePicture: { uri: currentUser.avatar },
    goldPoints: 1050, // These could be added to the ProfileType in the future
    cardBalance: currentUser.balance,
    cardNumber: '**** **** **** 3040',
    cardExpiry: '••/••',
  } : {
    name: 'Utilisateur',
    username: 'utilisateur',
    profilePicture: { uri: 'https://api.a0.dev/assets/image?text=User' },
    goldPoints: 0,
    cardBalance: 0,
    cardNumber: '**** **** **** ****',
    cardExpiry: '••/••',
  };

  const handleSettings = () => {
    // Navigate to settings screen
    navigation.navigate('Settings');
  };

  const handleShareProfile = () => {
    // Share profile
    console.log('Share profile');
  };

  const handleAddMoney = () => {
    // Add money to card
    Alert.alert("Ajouter de l'argent", "Fonctionnalité d'ajout d'argent");
  };

  const handleSendMoney = () => {
    // Activate the send options section
    setShowSendOptions(true);
    
    // Scroll down to the send options after a small delay
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleGetPhysicalCard = () => {
    // Get physical card
    Alert.alert("Carte physique", "Commandez votre carte physique");
  };

  const handleSeeAllTransactions = () => {
    // See all transactions
    Alert.alert("Transactions", "Voir toutes vos transactions");
  };

  const handleUserSelection = () => {
    // Navigate to NewMessage screen in transfer mode to select a user
    setModalVisible(false);
    navigation.navigate('NewMessage', { mode: 'transfer' });
  };

  const handleEventSelection = () => {
    // Select an event
    Alert.alert("Sélection d'événement", "Sélectionnez un événement pour envoyer de l'argent");
  };

  const handleBankAccountSelection = () => {
    // Select a bank account
    Alert.alert("Compte bancaire", "Effectuer un virement vers un compte bancaire");
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={userData.profilePicture} style={styles.profilePicture} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.name}</Text>
            <Text style={styles.username}>{userData.username}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Text style={styles.buttonText}>Paramètres</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
            <Text style={styles.buttonText}>Partager mon profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Gold Points Section */}
        <View style={styles.goldContainer}>
          <View style={styles.goldIconContainer}>
            <FontAwesome5 name="coins" size={30} color="#DAA520" />
          </View>
          <View style={styles.goldInfo}>
            <View style={styles.goldHeader}>
              <Text style={styles.goldAmount}>{userData.goldPoints}</Text>
              <Text style={styles.goldLabel}>gold</Text>
            </View>
            <Text style={styles.goldDescription}>
              Récupère de l'argent sur tes achats depuis l'application Genie
            </Text>
          </View>
        </View>

        {/* Virtual Card Section */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>CARTE VIRTUELLE GENIE</Text>
          <Text style={styles.cardBalance}>{userData.cardBalance} €</Text>
          
          <View style={styles.cardDetails}>
            <Text style={styles.cardNumber}>{userData.cardNumber}</Text>
            <Text style={styles.cardExpiry}>{userData.cardExpiry}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddMoney}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMoney}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={20} color="black" />
              <Text style={styles.sendButtonText}>Envoyer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hideButton}>
              <Ionicons name="eye-off-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
{/* Physical Card Option */}
<TouchableOpacity style={styles.physicalCard} onPress={handleGetPhysicalCard}>
  <Text style={styles.physicalCardText}>Recevoir une carte physique</Text>
  <Ionicons name="chevron-forward" size={24} color="#999" />
</TouchableOpacity>

{/* Section séparateur - Comptes gérés */}
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Mes comptes gérés</Text>
</View>

{/* Managed Accounts Option - With highlight to make it more visible */}
<TouchableOpacity
  style={[styles.physicalCard, styles.managedAccountsCard]}
  onPress={() => navigation.navigate('ManagedAccountsList')}
>
  <View style={styles.managedAccountsContent}>
    <Ionicons name="people" size={22} color="#4285F4" style={styles.managedAccountsIcon} />
    <Text style={styles.managedAccountsText}>Voir mes comptes gérés</Text>
  </View>
  <Ionicons name="chevron-forward" size={24} color="#4285F4" />
</TouchableOpacity>

{/* Bouton pour créer un nouveau compte géré */}
<TouchableOpacity
  style={[styles.physicalCard, styles.newManagedAccountCard]}
  onPress={() => navigation.navigate('ManagedAccounts')}
>
  <View style={styles.managedAccountsContent}>
    <Ionicons name="person-add" size={22} color="#34A853" style={styles.managedAccountsIcon} />
    <Text style={styles.newManagedAccountText}>Créer un nouveau compte géré</Text>
  </View>
  <Ionicons name="chevron-forward" size={24} color="#34A853" />
</TouchableOpacity>

{/* Section séparateur - Amis */}
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Mes amis</Text>
</View>

{/* Friends Option */}
<TouchableOpacity
  style={[styles.physicalCard, styles.friendsCard]}
  onPress={() => navigation.navigate('Friends')}
>
  <View style={styles.managedAccountsContent}>
    <Ionicons name="people-circle" size={22} color="#EA4335" style={styles.managedAccountsIcon} />
    <Text style={styles.friendsText}>Voir tous mes amis</Text>
  </View>
  <Ionicons name="chevron-forward" size={24} color="#EA4335" />
</TouchableOpacity>

        {/* Section séparateur - Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes transactions</Text>
          <TouchableOpacity onPress={handleSeeAllTransactions}>
            <Text style={styles.viewAllText}>voir tout</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction List */}
        {transactions.map(transaction => (
          <View key={transaction.id} style={styles.transactionItem}>
            <Image source={transaction.profilePicture} style={styles.transactionAvatar} />
            <Text style={styles.transactionName}>{transaction.name}</Text>
            <Text style={styles.transactionAmount}>{transaction.amount} €</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </View>
        ))}

        {/* Send Money Options */}
        <View style={[styles.sendOptionsContainer, showSendOptions && styles.sendOptionsHighlighted]}>
          <Text style={styles.sendOptionsTitle}>Envoyer de l'argent à :</Text>
          
          <TouchableOpacity
            style={[styles.optionButton, showSendOptions && styles.optionButtonHighlighted]}
            onPress={handleUserSelection}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="person-outline" size={24} color={showSendOptions ? "#4285F4" : "black"} />
            </View>
            <Text style={styles.optionText}>Un utilisateur</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, showSendOptions && styles.optionButtonHighlighted]}
            onPress={handleEventSelection}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="gift-outline" size={24} color={showSendOptions ? "#4285F4" : "black"} />
            </View>
            <Text style={styles.optionText}>Un événement</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, showSendOptions && styles.optionButtonHighlighted]}
            onPress={handleBankAccountSelection}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="business-outline" size={24} color={showSendOptions ? "#4285F4" : "black"} />
            </View>
            <Text style={styles.optionText}>Un compte bancaire</Text>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollContainer: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  notificationButton: {
    padding: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  settingsButton: {
    flex: 1,
    backgroundColor: '#EAEAEA',
    borderRadius: 25,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#EAEAEA',
    borderRadius: 25,
    paddingVertical: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  goldContainer: {
    backgroundColor: '#FFF9E0',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldIconContainer: {
    marginRight: 15,
  },
  goldInfo: {
    flex: 1,
  },
  goldHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  goldAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 8,
  },
  goldLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goldDescription: {
    fontSize: 14,
    color: '#333',
  },
  cardContainer: {
    backgroundColor: '#E0F4F7',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardNumber: {
    fontSize: 16,
  },
  cardExpiry: {
    fontSize: 16,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#333',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  sendButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  hideButton: {
    padding: 10,
  },
  physicalCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  physicalCardText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#666',
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    marginBottom: 2,
  },
  transactionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 20,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  sendOptionsContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  sendOptionsHighlighted: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#4285F4',
    padding: 10,
  },
  sendOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 10,
    color: '#4285F4',
  },
  optionButtonHighlighted: {
    backgroundColor: '#f7f9fc',
    borderLeftWidth: 3,
    borderLeftColor: '#4285F4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'white',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  // Styles for managed accounts section
  managedAccountsCard: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#E0E8FF',
  },
  managedAccountsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  managedAccountsIcon: {
    marginRight: 12,
  },
  managedAccountsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285F4',
  },
  // Styles for section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Styles for new managed account
  newManagedAccountCard: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#E0FFE8',
  },
  newManagedAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34A853',
  },
  // Styles for friends section
  friendsCard: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  friendsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EA4335',
  },
});

export default MyProfileScreen;