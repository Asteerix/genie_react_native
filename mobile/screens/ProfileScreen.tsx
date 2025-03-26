import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Modal } from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import BottomTabBar from '../components/BottomTabBar';
import ProfileBottomSheet from '../components/ProfileBottomSheet';
import { useProfile, ProfileType } from '../context/ProfileContext';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { activeProfile, currentUser, managedAccounts, setActiveProfile } = useProfile();
  
  const [profileCompletion, setProfileCompletion] = useState(50);
  const [cardView, setCardView] = useState<'front' | 'back'>('front');
  const [modalVisible, setModalVisible] = useState(false);
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);
  
  // Show profile bottom sheet when component mounts initially
  useEffect(() => {
    // Délai court pour permettre le rendu complet de l'écran
    const timer = setTimeout(() => {
      setProfileSheetVisible(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle selecting a profile
  const handleProfileSelect = (profileId: string) => {
    if (!activeProfile) return;
    
    if (profileId === currentUser?.id) {
      setActiveProfile(currentUser);
    } else {
      const selectedAccount = managedAccounts.find(account => account.id === profileId);
      if (selectedAccount) {
        setActiveProfile(selectedAccount);
      }
    }
  };

  const progressColor = () => {
    if (profileCompletion <= 25) return '#FF6B6B'; // Rouge
    if (profileCompletion <= 50) return '#FFC043'; // Orange
    return '#4CD964'; // Vert
  };

  const progressBackgroundColor = () => {
    if (profileCompletion <= 25) return '#FFEEEE';
    if (profileCompletion <= 50) return '#FFF6E5';
    return '#EEFFF0';
  };

  const handleUserSelection = () => {
    setModalVisible(false);
    // Navigation vers l'écran de sélection d'utilisateur pour transfert
    navigation.navigate('NewMessage', { mode: 'transfer' });
  };

  const handleEventSelection = () => {
    setModalVisible(false);
    // Navigation vers l'écran de sélection d'événement pour transfert
    navigation.navigate('EventSelector');
  };

  const handleBankAccountSelection = () => {
    setModalVisible(false);
    // Naviguer vers l'écran des comptes bancaires
    navigation.navigate('BankAccounts');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* En-tête du profil avec avatar et nom */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setProfileSheetVisible(true)}
          >
            <Image
              source={{ uri: activeProfile?.avatar || 'https://api.a0.dev/assets/image?text=User' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nameContainer}
            onPress={() => setProfileSheetVisible(true)}
          >
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{activeProfile?.name || 'Utilisateur'}</Text>
            </View>
            <View style={styles.handleRow}>
              <Text style={styles.userHandle}>{activeProfile?.username || '@utilisateur'}</Text>
              <TouchableOpacity style={styles.profileSwitcher} onPress={() => setProfileSheetVisible(true)}>
                <Text style={styles.switcherText}>Changer de profil</Text>
                <Ionicons name="chevron-down" size={16} color="#4285F4" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionButtonText}>Paramètres</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Partager mon profil</Text>
          </TouchableOpacity>
        </View>

        {/* Indicateur de séparation */}
        <View style={styles.separator} />

        {/* Barre de progression du profil */}
        {profileCompletion < 100 && (
          <TouchableOpacity 
            style={[
              styles.profileCompletionContainer, 
              { backgroundColor: progressBackgroundColor() }
            ]}
          >
            <View style={styles.profileCompletionHeader}>
              <Text style={styles.profileCompletionText}>
                Profil complété à {profileCompletion} %
              </Text>
              <Ionicons 
                name={profileCompletion < 100 ? "chevron-down" : "chevron-up"} 
                size={20} 
                color="black" 
              />
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${profileCompletion}%`,
                    backgroundColor: progressColor()
                  }
                ]} 
              />
            </View>
            <View style={styles.checklistContainer}>
              <View style={styles.checklistItem}>
                <View style={[styles.checkCircle, { backgroundColor: profileCompletion >= 25 ? progressColor() : '#F0F0F0' }]}>
                  {profileCompletion >= 25 && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={styles.checklistText}>Créer un profil gratuit</Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={[styles.checkCircle, { backgroundColor: profileCompletion >= 50 ? progressColor() : '#F0F0F0' }]}>
                  {profileCompletion >= 50 && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={styles.checklistText}>Activer double authentification</Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={[styles.checkCircle, { backgroundColor: profileCompletion >= 75 ? progressColor() : '#F0F0F0' }]}>
                  {profileCompletion >= 75 && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={styles.checklistText}>Ajouter un premier vœu</Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={[styles.checkCircle, { backgroundColor: profileCompletion >= 100 ? progressColor() : '#F0F0F0' }]}>
                  {profileCompletion >= 100 && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={styles.checklistText}>Inviter mes amis & famille</Text>
                {profileCompletion < 100 && <Ionicons name="chevron-forward" size={16} color="#888" />}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Section Gold */}
        <View style={styles.goldContainer}>
          <View style={styles.goldIconContainer}>
            <Image 
              source={{ uri: 'https://api.a0.dev/assets/image?text=G&background=gold&foreground=white' }} 
              style={styles.goldIcon} 
            />
          </View>
          <View style={styles.goldInfoContainer}>
            <Text style={styles.goldPoints}>1050 gold</Text>
            <Text style={styles.goldDescription}>
              Récupère de l'argent sur tes achats depuis l'application Genie
            </Text>
          </View>
        </View>

        {/* Carte Virtuelle */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>CARTE VIRTUELLE GENIE</Text>
            <Text style={styles.cardBalance}>{activeProfile?.balance || 0} €</Text>
          </View>
          <Text style={styles.cardNumber}>•••• •••• •••• 3040</Text>
          <Text style={styles.cardExpiry}>••/••</Text>
          
          <View style={styles.cardButtonsContainer}>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => navigation.navigate('ChooseAmount', { isAddingFunds: true })}
            >
              <Ionicons name="add" size={22} color="white" />
              <Text style={styles.cardButtonText}>Ajouter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cardButtonOutline}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="arrow-up" size={20} color="black" />
              <Text style={styles.cardButtonOutlineText}>Envoyer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardEyeButton}>
              <Ionicons name={cardView === 'front' ? "eye-off" : "eye"} size={24} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recevoir une carte physique */}
        <TouchableOpacity style={styles.physicalCardButton}>
          <Text style={styles.physicalCardText}>Recevoir une carte physique</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Mes transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {/* Transactions individuelles */}
          <TouchableOpacity style={styles.transactionItem}>
            <View style={styles.transactionAvatar}>
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=A&background=pink' }} 
                style={styles.transactionAvatarImage} 
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionName}>Audriana Toulet</Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={styles.transactionNegative}>-4 €</Text>
              <Ionicons name="chevron-forward" size={16} color="#888" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.transactionItem}>
            <View style={styles.transactionAvatar}>
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=P&background=orange' }} 
                style={styles.transactionAvatarImage} 
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionName}>Paul Marceau</Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={styles.transactionPositive}>+25 €</Text>
              <Ionicons name="chevron-forward" size={16} color="#888" />
            </View>
          </TouchableOpacity>
        </View>

                {/* Mon compte principal */}
                {currentUser && activeProfile?.id !== currentUser.id && (
                  <View style={styles.mainAccountContainer}>
                    <Text style={styles.sectionTitle}>Mon compte principal</Text>
                    
                    <TouchableOpacity
                      key={currentUser.id}
                      style={styles.managedAccountItem}
                      onPress={() => handleProfileSelect(currentUser.id)}
                    >
                      <Image
                        source={{ uri: currentUser.avatar }}
                        style={styles.managedAccountAvatar}
                      />
                      <View style={styles.managedAccountDetails}>
                        <Text style={styles.managedAccountName}>{currentUser.name}</Text>
                        <Text style={styles.managedAccountUsername}>{currentUser.username}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                )}
        
                {/* Mes comptes gérés */}
                <View style={styles.managedAccountsContainer}>
                  <Text style={styles.sectionTitle}>Mes comptes gérés</Text>
                  
                  {/* Affiche les comptes gérés (en excluant le compte actif) */}
                  {managedAccounts
                    .filter(account => account.id !== activeProfile?.id)
                    .map((account) => (
                      <TouchableOpacity
                        key={account.id}
                        style={styles.managedAccountItem}
                        onPress={() => handleProfileSelect(account.id)}
                      >
                        <Image
                          source={{ uri: account.avatar }}
                          style={styles.managedAccountAvatar}
                        />
                        <View style={styles.managedAccountDetails}>
                          <Text style={styles.managedAccountName}>{account.name}</Text>
                          <Text style={styles.managedAccountUsername}>{account.username}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                      </TouchableOpacity>
                    ))}
                  
                  {/* Bouton pour créer un nouveau compte géré */}
                  <TouchableOpacity
                    style={styles.addNewAccountButton}
                    onPress={() => navigation.navigate('ManagedAccountsList')}
                  >
                    <View style={styles.addNewAccountIcon}>
                      <Ionicons name="add" size={28} color="#888" />
                    </View>
                    <Text style={styles.addNewAccountText}>Créer un compte géré</Text>
                    <Ionicons name="chevron-forward" size={20} color="#888" />
                  </TouchableOpacity>
                </View>

        {/* Espace en bas pour éviter que le contenu soit caché par la barre de navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal pour envoyer de l'argent */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Envoyer de l'argent</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleUserSelection}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="person-outline" size={24} color="#4285F4" />
              </View>
              <Text style={styles.modalOptionText}>Un utilisateur</Text>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleEventSelection}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="gift-outline" size={24} color="#4285F4" />
              </View>
              <Text style={styles.modalOptionText}>Un événement</Text>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleBankAccountSelection}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="business-outline" size={24} color="#4285F4" />
              </View>
              <Text style={styles.modalOptionText}>Un compte bancaire</Text>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <BottomTabBar activeTab="profile" />
      
      {/* Profile Bottom Sheet */}
      <ProfileBottomSheet
        visible={profileSheetVisible}
        onClose={() => setProfileSheetVisible(false)}
        currentProfile={currentUser || {
          id: '1',
          name: 'Utilisateur',
          username: '@utilisateur',
          avatar: 'https://api.a0.dev/assets/image?text=User',
          balance: 0
        }}
        activeProfile={activeProfile || {
          id: '1',
          name: 'Utilisateur',
          username: '@utilisateur',
          avatar: 'https://api.a0.dev/assets/image?text=User',
          balance: 0
        }}
        managedAccounts={managedAccounts}
        onSelectProfile={handleProfileSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  /* Styles pour les comptes gérés */
  managedAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  managedAccountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  managedAccountDetails: {
    flex: 1,
  },
  managedAccountName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  managedAccountUsername: {
    fontSize: 14,
    color: '#888',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  userHandle: {
    fontSize: 18,
    color: '#888',
  },
  profileSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switcherText: {
    fontSize: 14,
    color: '#4285F4',
    marginRight: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  separator: {
    height: 10,
    backgroundColor: '#F5F5F5',
    marginBottom: 20,
  },
  profileCompletionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
  },
  profileCompletionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileCompletionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  checklistContainer: {
    marginTop: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFCF2',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE7B3',
  },
  goldIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFDF80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  goldIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  goldInfoContainer: {
    flex: 1,
  },
  goldPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  goldDescription: {
    fontSize: 14,
    color: '#666',
  },
  cardContainer: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 14,
    color: '#777',
  },
  cardBalance: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardNumber: {
    fontSize: 16,
    marginBottom: 5,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#777',
    marginBottom: 20,
  },
  cardButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  cardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  cardButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  cardButtonOutlineText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  cardEyeButton: {
    marginLeft: 'auto',
    padding: 10,
  },
  physicalCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  physicalCardText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4285F4',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    marginRight: 15,
  },
  transactionAvatarImage: {
    width: '100%',
    height: '100%',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionPositive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CD964',
    marginRight: 5,
  },
  transactionNegative: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginRight: 5,
  },
  // Style pour le modal d'envoi
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  modalOptionText: {
    fontSize: 16,
    flex: 1,
  },
  mainAccountContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  managedAccountsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  addNewAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  addNewAccountIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  addNewAccountText: {
    fontSize: 16,
    flex: 1,
  },
});

export default ProfileScreen;