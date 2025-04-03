import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text, // Ajout de Text ici
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
  TouchableOpacity, // Gardé pour le handle de la bottom sheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Gardé pour le handle et refresh
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import BottomTabBar from '../components/BottomTabBar';
import WishlistInviteModal from '../components/WishlistInviteModal'; // Gardé pour la modale statique
import CreateWishlistModal from '../components/CreateWishlistModal';
// import SearchModal from '../components/SearchModal'; // Supprimé car non utilisé dans le JSX final
import { toast } from 'sonner-native';
import { useWishlist } from '../context/WishlistContext';
import { useProfile } from '../context/ProfileContext';
import {
  WishlistType, // Gardé pour le type d'invitation
  WishItemType, // Gardé pour handleToggleFavorite/handleDeleteWish
  getUserWishlists, // Gardé pour fetchDirectFromAPI
  getUserWishItems, // Gardé pour fetchDirectFromAPI
  getWishlistInvitations // Gardé pour fetchDirectFromAPI
} from '../api/wishlists';

// Import des nouveaux composants et styles
import { styles } from './ProfileScreen/styles/ProfileScreen.styles';
import ProfileHeader from './ProfileScreen/components/ProfileHeader';
import AccountCard from './ProfileScreen/components/AccountCard';
import ProfileCompletionCard from './ProfileScreen/components/ProfileCompletionCard';
import TransactionsList from './ProfileScreen/components/TransactionsList';
import ProfileBottomSheetContent from './ProfileScreen/components/ProfileBottomSheetContent';

const { height } = Dimensions.get('window'); // Gardé pour l'animation de la bottom sheet

// Hauteurs de la modal en pourcentage de la hauteur de l'écran
const MODAL_HEIGHTS = {
  SMALL: 0.2, // 20%
  MEDIUM: 0.47, // 47% (Ajusté pour correspondre à l'original)
  FULL: 0.87 // 87% (Ajusté pour correspondre à l'original)
};

// Type pour les profils locaux (utilisé par ProfileHeader et AccountCard)
interface LocalProfileType {
  id: string;
  name: string;
  username: string;
  balance: number;
  avatar: string;
  isAdd: boolean;
  isPersonal: boolean;
}

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser, managedAccounts, setActiveProfile: setProfileContext } = useProfile();
  const {
    wishlists,
    wishItems,
    invitations, // Récupéré du contexte
    isLoading,
    error,
    refreshWishlists,
    refreshInvitations,
    respondToWishlistInvitation,
    editWishItem, // Gardé pour handleToggleFavorite
    removeWishItem // Gardé pour handleDeleteWish
  } = useWishlist();

  // États principaux de l'écran
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null); // Référence pour le scroll principal

  // États et animation de la Bottom Sheet
  const [modalHeight, setModalHeight] = useState(MODAL_HEIGHTS.MEDIUM);
  const modalHeightAnim = useRef(new Animated.Value(MODAL_HEIGHTS.MEDIUM * height)).current;
  const modalScrollViewRef = useRef<ScrollView>(null); // Référence pour le scroll de la bottom sheet

  // États divers
  const [wishlistInviteVisible, setWishlistInviteVisible] = useState(false); // Pour la modale statique
  const [lowBalanceWarningDismissed, setLowBalanceWarningDismissed] = useState(false);

  // Données statiques (peuvent être déplacées si nécessaire)
  const wishlistInviteData = { // Pour la modale statique
    title: 'Vacances Wishlist',
    inviter: 'audrianatoulet'
  };
  // Supprimer profileCompletionData
   const transactionsData = [ // Pour TransactionsList (données d'exemple)
     {
       id: '1',
       type: 'invitation' as const, // Utilisation de 'as const' pour typer plus précisément
       name: 'Invite le',
       date: '09/12/2024',
       avatar: require('../assets/icon.png'), // Garder require pour l'exemple
       amount: null,
     },
     {
       id: '2',
       type: 'transaction' as const,
       name: 'Audriana Toulet',
       avatar: require('../assets/icon.png'),
       amount: -4,
     },
     {
       id: '3',
       type: 'transaction' as const,
       name: 'Paul Marceau',
       avatar: require('../assets/icon.png'),
       amount: 25,
     }
   ];


  // Construction du tableau de profils
  const profiles: LocalProfileType[] = [
    ...(currentUser ? [{
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      balance: currentUser.balance,
      avatar: currentUser.avatar,
      isAdd: false,
      isPersonal: true
    }] : []),
    ...managedAccounts.map(account => ({
      id: account.id,
      name: account.name,
      username: account.username,
      balance: account.balance,
      avatar: account.avatar,
      isAdd: false,
      isPersonal: false
    })),
    {
      id: "add",
      name: "Ajouter",
      username: "",
      balance: 0,
      avatar: "",
      isAdd: true,
      isPersonal: false
    }
  ];

  // Obtenir le profil actif
  const activeProfileLocal: LocalProfileType | undefined = profiles[selectedProfileIndex];

  // --- Fonctions de rafraîchissement et de chargement ---

  // Helper pour rafraîchir toutes les données avec timeout
  const refreshAllData = useCallback(async () => {
    try {
      console.log('ProfileScreen - Refreshing all wishlist data...');
      const timeoutDuration = 10000; // 10 seconds timeout

      const createPromiseWithTimeout = (promise: Promise<any>, name: string) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${name} request timed out after ${timeoutDuration}ms`)), timeoutDuration)
          )
        ]);
      };

      // Utilise les fonctions du contexte directement
      const refreshResults = await Promise.all([
        createPromiseWithTimeout(refreshWishlists(), 'Wishlists'),
        createPromiseWithTimeout(refreshInvitations(), 'Invitations')
      ]);

      console.log('ProfileScreen - All data refreshed successfully via context');
      return refreshResults[0] && refreshResults[1]; // Both must succeed
    } catch (err: any) {
      console.error('ProfileScreen - Error refreshing data via context:', err);
      if (err.message && err.message.includes('timed out')) {
        toast.error('La connexion a expiré. Vérifiez votre connexion.');
      } else if (err.response && err.response.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else {
        toast.error(`Erreur: ${err.message || 'Problème de connexion au serveur'}`);
      }
      return false;
    }
  }, [refreshWishlists, refreshInvitations]); // Dépendances du useCallback

  // Fonction pour fetch directement depuis l'API (utilisée par pull-to-refresh)
  const fetchDirectFromAPI = useCallback(async () => {
    try {
      console.log('ProfileScreen - Fetching directly from API...');
      const startTime = Date.now();
      const results = await Promise.all([
        getUserWishlists(),
        getUserWishItems(),
        getWishlistInvitations()
      ]);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const [directWishlists, directItems, directInvitations] = results;
      console.log(`ProfileScreen - API Response (${responseTime}ms): ` +
        `${directWishlists.length} wishlists, ${directItems.length} items, ${directInvitations.length} invitations`);
      return {
        wishlists: directWishlists,
        items: directItems,
        invitations: directInvitations,
        responseTime
      };
    } catch (err: any) {
      console.error('ProfileScreen - Error fetching directly from API:', err);
      toast.error(`Erreur API: ${err.message || 'Problème de connexion'}`);
      throw err;
    }
  }, []); // Pas de dépendances externes

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('ProfileScreen - Pull-to-refresh triggered');
    toast.info('Synchronisation directe des données...');
    try {
      const apiData = await fetchDirectFromAPI();
      console.log(`Pull-to-refresh: Données récupérées en ${apiData.responseTime}ms`);
      // Optionnel: Validation et comparaison des données
      // ...
      const refreshSuccess = await refreshAllData(); // Met à jour le contexte
      if (refreshSuccess) {
        toast.success(`Données synchronisées: ${apiData.wishlists.length} listes, ${apiData.items.length} vœux`);
      } else {
        toast.warning('Synchronisation terminée avec avertissements');
      }
    } catch (err: any) {
      console.error('Erreur lors du pull-to-refresh:', err);
      toast.error('Échec de la synchronisation directe');
      // Fallback sur le refresh du contexte si le fetch direct échoue
      await refreshAllData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDirectFromAPI, refreshAllData]); // Dépendances du useCallback

  // Chargement initial des données
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        console.log('ProfileScreen - Initial data load using context refresh...');
        toast.info('Chargement des données...');
        const success = await refreshAllData(); // Utilise la fonction unifiée
        if (isMounted) {
            if (success) {
                toast.success('Données chargées.');
            } else {
                // L'erreur est déjà gérée dans refreshAllData
            }
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [refreshAllData]); // Dépendance à refreshAllData

  // --- Fonctions de gestion de la Bottom Sheet ---

  const changeModalHeight = useCallback((newHeight: number) => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    modalScrollViewRef.current?.scrollTo({ y: 0, animated: false });
    setModalHeight(newHeight);
    Animated.spring(modalHeightAnim, {
      toValue: newHeight * height,
      useNativeDriver: false,
      friction: 7,
      tension: 40,
    }).start();
  }, [modalHeightAnim]); // Dépendance à l'animation

  // Modifié pour ne pas descendre en dessous de MEDIUM
  const handleModalPress = useCallback(() => {
    if (modalHeight === MODAL_HEIGHTS.MEDIUM) {
      // Si MEDIUM, monter à FULL
      changeModalHeight(MODAL_HEIGHTS.FULL);
    } else {
      // Si FULL ou SMALL (ou autre), revenir à MEDIUM
      changeModalHeight(MODAL_HEIGHTS.MEDIUM);
    }
  }, [modalHeight, changeModalHeight]); // Dépendances

  // Initialisation de la hauteur de la modal
  useEffect(() => {
    changeModalHeight(MODAL_HEIGHTS.MEDIUM);
  }, [changeModalHeight]); // Dépendance

  // Déterminer l'icône du chevron
  const getChevronIcon = useCallback(() => {
    if (modalHeight === MODAL_HEIGHTS.SMALL) return "chevron-up-outline";
    if (modalHeight === MODAL_HEIGHTS.MEDIUM || modalHeight === MODAL_HEIGHTS.FULL) return "chevron-down-outline";
    return "chevron-up-outline"; // Par défaut
  }, [modalHeight]); // Dépendance

  // --- Fonctions de gestion des profils ---

  const goToNextProfile = useCallback(() => {
    if (selectedProfileIndex < profiles.length - 1) {
      setSelectedProfileIndex(prevIndex => prevIndex + 1);
    }
  }, [selectedProfileIndex, profiles.length]); // Dépendances

  const goToPreviousProfile = useCallback(() => {
    if (selectedProfileIndex > 0) {
      setSelectedProfileIndex(prevIndex => prevIndex - 1);
    }
  }, [selectedProfileIndex]); // Dépendances

  const handleProfileClick = useCallback((index: number) => {
    const profile = profiles[index];
    if (profile.isAdd) {
      // TODO: Naviguer vers l'écran d'ajout de compte géré
      console.log("Navigation vers ajout de compte géré");
      // navigation.navigate('ManagedAccounts'); // TODO: Vérifier les paramètres de navigation
    } else {
      setSelectedProfileIndex(index);
      // Mettre à jour le profil actif dans le contexte ProfileContext
      if (profile.id && !profile.isAdd) {
        setProfileContext({
          id: profile.id,
          name: profile.name,
          username: profile.username,
          balance: profile.balance,
          avatar: profile.avatar
        });
        // Optionnel: Rafraîchir les données spécifiques au profil si nécessaire
        // refreshAllData();
      }
    }
  }, [profiles, navigation, setProfileContext]); // Dépendances

  // --- Handlers pour les actions (passés aux composants enfants) ---

  const handleCreateWishlist = useCallback(async (title: string, options?: { description?: string, addAdmins?: boolean }) => {
    try {
      console.log('ProfileScreen - Preparing wishlist creation:', title, options);
      setShowCreateModal(false); // Ferme la modale de base
      // Navigue vers l'écran de paramètres pour finaliser
      navigation.navigate('WishlistSettings', {
        pendingWishlist: {
          title,
          description: options?.description || '',
          addAdmins: options?.addAdmins || false
        }
      });
    } catch (error) {
      console.error("ProfileScreen - Error preparing wishlist creation:", error);
      toast.error("Impossible de préparer la création de la wishlist");
    }
  }, [navigation]); // Dépendance

  const handleAcceptInvitation = useCallback(async (wishlistId: string) => {
    try {
      await respondToWishlistInvitation(wishlistId, true);
      await refreshAllData(); // Rafraîchit tout pour être sûr
      toast.success('Invitation acceptée !');
    } catch (error) {
      console.error("Erreur lors de l'acceptation de l'invitation:", error);
      toast.error("Impossible d'accepter l'invitation");
    }
  }, [respondToWishlistInvitation, refreshAllData]); // Dépendances

  const handleRejectInvitation = useCallback(async (wishlistId: string) => {
    try {
      await respondToWishlistInvitation(wishlistId, false);
      await refreshInvitations(); // Rafraîchit seulement les invitations
      toast.info('Invitation refusée');
    } catch (error) {
      console.error("Erreur lors du refus de l'invitation:", error);
      toast.error("Impossible de refuser l'invitation");
    }
  }, [respondToWishlistInvitation, refreshInvitations]); // Dépendances

  const handleDismissLowBalanceWarning = useCallback(() => {
    setLowBalanceWarningDismissed(true);
  }, []); // Pas de dépendances

  // Handlers pour la modale d'invitation statique
  const handleAcceptWishlistInvite = useCallback(() => {
    toast.success('Invitation acceptée ! (Statique)');
    setWishlistInviteVisible(false);
    // TODO: Action spécifique si nécessaire
  }, []);
  const handleDeclineWishlistInvite = useCallback(() => {
    toast.info('Invitation refusée (Statique)');
    setWishlistInviteVisible(false);
  }, []);

  // Handler pour ajouter de l'argent (depuis la bottom sheet)
  const handleAddMoney = useCallback(() => {
    // TODO: Naviguer vers l'écran d'ajout d'argent
    console.log("Navigation vers ajout d'argent");
    // navigation.navigate('PaymentMethod'); // TODO: Vérifier les paramètres de navigation
  }, [navigation]);

  // Handler pour ajouter un vœu (depuis la bottom sheet)
  const handleAddWish = useCallback(() => {
    if (wishlists.length > 0) {
      // Navigue vers l'ajout de vœu, en ciblant potentiellement la première liste
      navigation.navigate('AddWish', { wishlistId: wishlists[0].id });
    } else {
      toast.info("Créez d'abord une liste de souhaits");
      setShowCreateModal(true); // Ouvre la modale de création de liste
    }
  }, [wishlists, navigation]);

  // Handler pour voir un vœu (depuis la bottom sheet)
  const handleWishPress = useCallback((itemId: string) => {
    navigation.navigate('ProductDetail', { productId: itemId });
  }, [navigation]);

   // Handler pour créer une liste (depuis la bottom sheet)
   const handleCreateWishlistFromSheet = useCallback(() => {
     setShowCreateModal(true);
   }, []);

  // Handler pour voir une liste (depuis la bottom sheet)
  const handleWishlistPress = useCallback((wishlistId: string) => {
    navigation.navigate('WishlistDetail', { wishlistId });
  }, [navigation]);

  // Handler pour basculer favori (depuis la bottom sheet)
  const handleToggleFavorite = useCallback(async (item: WishItemType) => {
    try {
      await editWishItem(item.id, { isFavorite: !item.isFavorite });
      toast.success(item.isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
      // Pas besoin de refresh manuel si le contexte se met à jour correctement
    } catch (error) {
      console.error('Erreur lors du changement de statut favori:', error);
      toast.error('Impossible de modifier le statut favori');
    }
  }, [editWishItem]); // Dépendance

  // Handler pour supprimer un vœu (potentiellement depuis la bottom sheet si on ajoute le bouton)
  const handleDeleteWish = useCallback(async (itemId: string) => {
    try {
      await removeWishItem(itemId);
      toast.success('Vœu supprimé avec succès');
      // Pas besoin de refresh manuel si le contexte se met à jour correctement
    } catch (error) {
      console.error('Erreur lors de la suppression du vœu:', error);
      toast.error('Impossible de supprimer le vœu');
    }
  }, [removeWishItem]);

  // Handler pour le nouveau bouton Transactions
  const handleTransactionsPress = useCallback(() => {
    // TODO: Naviguer vers l'écran des transactions
    console.log("Navigation vers l'écran des transactions");
    // Exemple: navigation.navigate('TransactionHistory'); // Remplacer par le nom d'écran correct
  }, [navigation]);

  // --- Rendu du composant ---

  if (!currentUser || !activeProfileLocal) {
    // Affiche un indicateur de chargement si les données de profil ne sont pas prêtes
    // Ou une vue vide/d'erreur si nécessaire
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Optionnel: Afficher un message d'erreur si error existe */}
          {/* <ActivityIndicator size="large" color="#0000ff" /> */}
        </View>
        <View style={styles.bottomTabBarContainer}>
           <BottomTabBar activeTab="profile" />
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#000']}
            tintColor={'#000'}
            title={'Synchronisation...'}
            titleColor={'#999'}
          />
        }
        // Désactiver le scroll si la bottom sheet est complètement ouverte ?
        // scrollEnabled={modalHeight !== MODAL_HEIGHTS.FULL}
      >
        {/* Header: Settings, Avatars, Name */}
        <ProfileHeader
          profiles={profiles}
          selectedProfileIndex={selectedProfileIndex}
          onSelectProfile={handleProfileClick}
          onGoToPreviousProfile={goToPreviousProfile}
          onGoToNextProfile={goToNextProfile}
        />

        {/* Affiche la carte de compte ou le contenu pour ajouter un compte */}
        {activeProfileLocal.isAdd ? (
          <View style={styles.addAccountContainer}>
             {/* Contenu pour ajouter un compte (peut aussi devenir un composant) */}
             <TouchableOpacity
                style={styles.addAccountButton}
                onPress={() => navigation.navigate('ManagedAccounts', { screen: 'ManagedAccountsList' })}
             >
               <Text style={styles.addAccountButtonText}>Gérer les comptes</Text>
             </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Account Card: Balance & Actions */}
            <AccountCard
              activeProfile={activeProfileLocal}
              onRefreshBalance={handleRefresh} // Utilise le pull-to-refresh pour le moment
              // onTransfer={() => navigation.navigate('BankTransfer')} // TODO: Vérifier les paramètres de navigation
              onUse={() => console.log("Action: Utiliser")} // Placeholder
              onAddMoney={handleAddMoney}
              onTransactions={handleTransactionsPress} // Passer le nouveau handler
              // onDetails={() => navigation.navigate('ManagedAccountProfile', { accountId: activeProfileLocal.id })}
            />

            {/* Profile Completion Card supprimée */}

            {/* Transactions List (only for personal account) */}
            <TransactionsList
              transactions={transactionsData} // Utilise les données d'exemple
              isPersonalAccount={activeProfileLocal.isPersonal}
              onSeeAll={() => console.log("Action: Voir toutes les transactions")} // Placeholder
              onTransactionPress={(id) => console.log("Action: Voir transaction", id)} // Placeholder
            />

            {/* Espacement pour permettre au contenu de la bottom sheet de ne pas masquer les transactions */}
            <View style={{ height: height * 0.3 }} />
          </>
        )}

      </ScrollView>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheetContainer,
          { height: modalHeightAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.bottomSheetHandle}
          onPress={handleModalPress}
          activeOpacity={0.7}
        >
          <Ionicons name={getChevronIcon()} size={24} color="#999" style={styles.handleIcon} />
        </TouchableOpacity>

        {/* Contenu scrollable de la Bottom Sheet */}
        <ProfileBottomSheetContent
           ref={modalScrollViewRef} // Passe la ref
           activeProfile={activeProfileLocal} // Passe seulement les infos nécessaires
           lowBalanceWarningDismissed={lowBalanceWarningDismissed}
           wishlistInviteData={wishlistInviteData} // Pour la carte statique
           invitations={invitations} // Données dynamiques du contexte
           wishlists={wishlists} // Données dynamiques du contexte
           wishItems={wishItems} // Données dynamiques du contexte
           isLoading={isLoading}
           error={error}
           onDismissLowBalanceWarning={handleDismissLowBalanceWarning}
           onAddMoney={handleAddMoney}
           onAcceptStaticInvite={handleAcceptWishlistInvite}
           onDeclineStaticInvite={handleDeclineWishlistInvite}
           onAcceptInvitation={handleAcceptInvitation}
           onRejectInvitation={handleRejectInvitation}
           // onSeeAllWishes={() => {}} // Placeholder si besoin
           onAddWish={handleAddWish}
           onWishPress={handleWishPress}
           // onSeeAllWishlists={() => {}} // Placeholder si besoin
           onCreateWishlist={handleCreateWishlistFromSheet}
           onWishlistPress={handleWishlistPress}
           onRetryLoad={handleRefresh} // Utilise le refresh global pour réessayer
           onToggleFavoriteWish={handleToggleFavorite} // Passe la fonction
        />
      </Animated.View>

      {/* Barre de navigation en bas */}
      <View style={styles.bottomTabBarContainer}>
        <BottomTabBar activeTab="profile" />
      </View>

      {/* Modales globales */}
      <WishlistInviteModal
        visible={wishlistInviteVisible}
        onClose={() => setWishlistInviteVisible(false)}
        onAccept={handleAcceptWishlistInvite}
        onDecline={handleDeclineWishlistInvite}
        wishlistData={wishlistInviteData}
      />
      <CreateWishlistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWishlist={handleCreateWishlist} // Passe la fonction de navigation/préparation
      />

    </SafeAreaView>
  );
};

export default ProfileScreen;
