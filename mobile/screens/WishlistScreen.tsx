import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  FlatList // Importer FlatList
} from 'react-native';
import { Ionicons, FontAwesome, AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import BottomTabBar from '../components/BottomTabBar';
import CreateWishlistModal from '../components/CreateWishlistModal';
import SearchModal from '../components/SearchModal';
import { useWishlist } from '../context/WishlistContext';
import { RootStackParamList } from '../types/navigation';
import {
  WishlistType,
  WishItemType,
  getUserWishlists,
  getUserWishItems,
  getWishlistInvitations
} from '../api/wishlists';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;
const WishlistScreen = () => {
  const [activeTab, setActiveTab] = useState('listes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Handle pull-to-refresh with direct API call for better reliability
  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('WishlistScreen - Pull-to-refresh triggered');
    toast.info('Synchronisation directe des données...');
    
    try {
      // Use direct API fetching for more reliable refresh
      const apiData = await fetchDirectFromAPI();
      console.log(`Pull-to-refresh: Données récupérées en ${apiData.responseTime}ms`);
      
      // Validate data was correctly retrieved
      if (apiData.wishlists.length === 0 && wishlists.length > 0) {
        console.warn('API returned 0 wishlists but context has data - possible API error');
        toast.warning('Synchronisation partielle - vérification des données...');
      }
      
      // Compare loaded data with what's in the context
      console.log('Comparaison des données:');
      console.log(`Context: ${wishlists.length} listes, ${wishItems.length} vœux`);
      console.log(`API: ${apiData.wishlists.length} listes, ${apiData.items.length} vœux`);
      
      // Update the context with the fresh data
      const refreshSuccess = await refreshAllData();
      
      if (refreshSuccess) {
        toast.success(`Données synchronisées: ${apiData.wishlists.length} listes, ${apiData.items.length} vœux`);
      } else {
        toast.warning('Synchronisation terminée avec avertissements');
      }
    } catch (err: any) {
      console.error('Erreur lors du pull-to-refresh:', err);
      toast.error('Échec de la synchronisation directe');
      
      // Fall back to context refresh on error
      console.log('Tentative de synchronisation via le contexte...');
      await refreshAllData();
    } finally {
      setRefreshing(false);
    }
  };
  const {
    wishlists,
    wishItems,
    invitations,
    isLoading,
    error,
    refreshWishlists,
    refreshInvitations,
    respondToWishlistInvitation,
    editWishItem,
    removeWishItem
  } = useWishlist();
  
  // Fonction pour basculer l'état favori d'un voeu
  const handleToggleFavorite = async (item: WishItemType) => {
    try {
      await editWishItem(item.id, {
        isFavorite: !item.isFavorite
      });
      toast.success(item.isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
    } catch (error) {
      console.error('Erreur lors du changement de statut favori:', error);
      toast.error('Impossible de modifier le statut favori');
    }
  };
  
  // Fonction pour supprimer un voeu
  const handleDeleteWish = async (itemId: string) => {
    try {
      await removeWishItem(itemId);
      toast.success('Vœu supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du vœu:', error);
      toast.error('Impossible de supprimer le vœu');
    }
  };
  
  // Helper function to refresh all wishlist data with timeout
  const refreshAllData = async () => {
    try {
      console.log('WishlistScreen - Refreshing all wishlist data...');
      
      // Create promises with timeout to prevent hanging indefinitely
      const timeoutDuration = 10000; // 10 seconds timeout
      
      const createPromiseWithTimeout = (promise: Promise<any>, name: string) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${name} request timed out after ${timeoutDuration}ms`)), timeoutDuration)
          )
        ]);
      };
      
      // Fetch data with timeout protection
      const refreshResults = await Promise.all([
        createPromiseWithTimeout(refreshWishlists(), 'Wishlists'),
        createPromiseWithTimeout(refreshInvitations(), 'Invitations')
      ]);
      
      console.log('WishlistScreen - All data refreshed successfully');
      console.log(`WishlistScreen - Received ${wishlists.length} wishlists`);
      console.log(`WishlistScreen - Received ${wishItems.length} wish items`);
      console.log(`WishlistScreen - Received ${invitations.length} invitations`);
      
      return refreshResults[0] && refreshResults[1]; // Both must succeed
    } catch (err: any) {
      console.error('WishlistScreen - Error refreshing data:', err);
      console.error('WishlistScreen - Error message:', err.message);
      
      // Show more specific error message to the user based on error type
      if (err.message && err.message.includes('timed out')) {
        toast.error('La connexion à l\'API a expiré. Vérifiez votre connexion.');
      } else if (err.response && err.response.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else {
        toast.error(`Erreur: ${err.message || 'Problème de connexion au serveur'}`);
      }
      
      return false;
    }
  };
  
  // Animation values
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const wishesOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Charger les données au montage et gérer les chargements et erreurs
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        console.log('WishlistScreen - Loading data from API...');
        
        // Afficher un toast pour informer l'utilisateur du chargement
        toast.info('Chargement des listes et vœux depuis l\'API...');
        
        // Appel unique au refreshWishlists du contexte
        if (isMounted) {
          // Le contexte gère déjà l'état de chargement
          const success = await refreshWishlists();
          
          // Ne faire une deuxième requête que si nécessaire et si le composant est toujours monté
          if (isMounted) {
            if (success) {
              console.log('WishlistScreen - Data loaded successfully via context');
              toast.success('Données chargées avec succès');
            } else {
              toast.error('Problème lors du chargement des données');
            }
            
            await refreshInvitations();
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('WishlistScreen - Error loading data:', err);
          toast.error(`Erreur: ${err.message || 'Problème de connexion à l\'API'}`);
        }
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates if component unmounts during data fetch
    return () => {
      isMounted = false;
    };
  }, []);

  // Tab switching animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(tabIndicator, {
        toValue: activeTab === 'listes' ? 0 : 1,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(listOpacity, {
        toValue: activeTab === 'listes' ? 1 : 0,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(wishesOpacity, {
        toValue: activeTab === 'listes' ? 0 : 1,
        duration: 250,
        useNativeDriver: true
      })
    ]).start();
  }, [activeTab]);

  const translateX = tabIndicator.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2 - 40]
  });

  // Pressable animation handler
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  // Gérer la création d'une nouvelle wishlist - maintenant toujours via le modal WishlistOptionalInfoModal
  const handleCreateWishlist = async (title: string, options?: { description?: string, addAdmins?: boolean }) => {
    try {
      console.log('WishlistScreen - Preparing wishlist creation:', title, options);
      
      // On passe toujours par le modal WishlistOptionalInfoModal pour finaliser la création
      // C'est dans ce modal qu'on enregistrera réellement la wishlist
      setShowCreateModal(false);
      
      // Naviguer vers l'écran de paramètres avec les données de la wishlist à créer
      navigation.navigate('WishlistSettings', {
        pendingWishlist: {
          title,
          description: options?.description || '',
          addAdmins: options?.addAdmins || false
        }
      });
    } catch (error) {
      console.error("WishlistScreen - Error preparing wishlist creation:", error);
      toast.error("Impossible de préparer la création de la wishlist");
    }
  };

  // Gérer l'acceptation d'une invitation
  const handleAcceptInvitation = async (wishlistId: string) => {
    try {
      await respondToWishlistInvitation(wishlistId, true);
      refreshWishlists();
    } catch (error) {
      console.error("Erreur lors de l'acceptation de l'invitation:", error);
      toast.error("Impossible d'accepter l'invitation");
    }
  };

  // Gérer le refus d'une invitation
  const handleRejectInvitation = async (wishlistId: string) => {
    try {
      await respondToWishlistInvitation(wishlistId, false);
      refreshWishlists();
    } catch (error) {
      console.error("Erreur lors du refus de l'invitation:", error);
      toast.error("Impossible de refuser l'invitation");
    }
  };

  const renderInvitationCard = (wishlist: WishlistType) => {
    // Récupérer l'info de l'utilisateur qui invite
    const owner = wishlist.sharedWith?.find(share => share.userId === wishlist.userId)?.user;
    const invitedBy = owner ? `${owner.firstName} ${owner.lastName}` : "Utilisateur";
    
    return (
      <Animated.View 
        style={[styles.invitationCard, { transform: [{ scale: scaleAnim }] }]} 
        key={wishlist.id}
      >
        <View style={styles.cardContent}>
          <Image 
            source={{ 
              uri: wishlist.coverImage || 'https://api.a0.dev/assets/image?text=wishlist&aspect=1:1'
            }} 
            style={styles.wishlistImage} 
          />
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: owner?.avatarUrl || 'https://api.a0.dev/assets/image?text=user&aspect=1:1'
              }} 
              style={styles.avatarImage} 
            />
          </View>
          <View style={styles.invitationInfo}>
            <Text style={styles.wishlistTitle}>
              {wishlist.title} <Ionicons name="chevron-forward" size={16} color="#888" />
            </Text>
            <Text style={styles.invitationText}>
              <Text style={styles.invitedBy}>{invitedBy}</Text> vous invite sur une liste
            </Text>
          </View>
        </View>
        <View style={styles.invitationActions}>
          <TouchableOpacity 
            style={styles.rejectButton}
            activeOpacity={0.7}
            onPress={() => handleRejectInvitation(wishlist.id)}
          >
            <AntDesign name="close" size={24} color="red" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.acceptButton}
            activeOpacity={0.7}
            onPress={() => handleAcceptInvitation(wishlist.id)}
          >
            <AntDesign name="check" size={24} color="green" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderWishlistCard = (wishlist: WishlistType) => (
    <Pressable 
      style={styles.wishlistCard} 
      key={wishlist.id}
      onPress={() => navigation.navigate('WishlistDetail', { wishlistId: wishlist.id })}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: '#f0f0f0', borderless: false }}
    >
      <View style={styles.wishlistImageContainer}>
        <Image 
          source={{ 
            uri: wishlist.coverImage || 'https://api.a0.dev/assets/image?text=wishlist&aspect=1:1'
          }} 
          style={styles.wishlistImage} 
        />
        {wishlist.isFavorite && (
          <View style={styles.favoriteTag}>
            <AntDesign name="star" size={16} color="black" />
          </View>
        )}
      </View>
      <View style={styles.wishlistInfo}>
        <Text style={styles.wishlistTitle}>{wishlist.title}</Text>
        <Text style={styles.wishlistDescription} numberOfLines={1}>{wishlist.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#888" style={styles.chevronIcon} />
    </Pressable>
  );

  const renderProductCard = (item: WishItemType) => (
    <Pressable
      key={item.id}
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: '#f0f0f0', borderless: false }}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{
            uri: item.imageUrl || item.imageURL || 'https://api.a0.dev/assets/image?text=product&aspect=1:1'
          }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.wishFavoriteButton}
          onPress={() => handleToggleFavorite(item)}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <View style={[styles.wishFavoriteTag, item.isFavorite ? styles.favoriteActive : {}]}>
            <AntDesign name="star" size={16} color={item.isFavorite ? "black" : "gray"} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteWish(item.id)}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.priceAndButtonContainer}>
          <Text style={styles.productPrice}>
            {item.price ? `${item.price} ${item.currency || '€'}` : ''}
          </Text>
          <TouchableOpacity
            style={styles.productButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          >
            <Ionicons name="eye-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );

  // Implement a function to directly fetch data from API
  const fetchDirectFromAPI = async () => {
    try {
      console.log('WishlistScreen - Fetching directly from API...');
      toast.info('Récupération directe depuis l\'API...');
      
      // Start timer to measure API performance
      const startTime = Date.now();
      
      // Get data directly from API with Promise.all for parallel requests
      const results = await Promise.all([
        getUserWishlists(),
        getUserWishItems(),
        getWishlistInvitations()
      ]);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const [directWishlists, directItems, directInvitations] = results;
      
      console.log(`WishlistScreen - API Response (${responseTime}ms): ` +
        `${directWishlists.length} wishlists, ${directItems.length} items, ${directInvitations.length} invitations`);
      
      // Log detailed information about received data
      console.log('===== DÉTAILS SYNCHRONISATION API =====');
      console.log(`Wishlists: ${JSON.stringify(directWishlists.map(w => ({ id: w.id, title: w.title })))}`);
      console.log(`Items: ${JSON.stringify(directItems.map(i => ({ id: i.id, name: i.name })))}`);
      console.log(`Invitations: ${JSON.stringify(directInvitations.map(i => ({ id: i.id, title: i.title })))}`);
      console.log('======================================');
      
      // Force context refresh to update state with new data
      toast.success(`API: ${directWishlists.length} listes, ${directItems.length} vœux récupérés`);
      
      // Return the results for potential further processing
      return {
        wishlists: directWishlists,
        items: directItems,
        invitations: directInvitations,
        responseTime
      };
    } catch (err: any) {
      console.error('WishlistScreen - Error fetching directly from API:', err);
      toast.error(`Erreur API: ${err.message || 'Problème de connexion'}`);
      throw err;
    }
  };
  
  // Récupérer addWishlist du contexte
  const { addWishlist } = useWishlist();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes vœux</Text>
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.7}
            onPress={async () => {
              toast.info('Nouvelle tentative...');
              await refreshAllData();
            }}
          >
            <Ionicons name="refresh" size={28} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
          <Text style={styles.loadingSubtext}>Récupération des listes et des vœux depuis l'API</Text>
          <Text style={[styles.loadingSubtext, {marginTop: 15, fontStyle: 'italic'}]}>
            Connexion à l'API pour synchroniser les wishlists et les souhaits
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes vœux</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.7}
            onPress={async () => {
              toast.info('Actualisation des données...');
              const success = await refreshAllData();
              if (success) {
                toast.success('Données actualisées');
              } else {
                toast.error('Erreur d\'actualisation');
              }
            }}
          >
            <Ionicons name="refresh" size={28} color="black" />
          </TouchableOpacity>
          
          {/* Sync button - press to synchronize data directly from API */}
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.7}
            onPress={async () => {
              try {
                console.log('====== SYNCHRONISATION DIRECTE AVEC L\'API ======');
                toast.info('Synchronisation avec l\'API en cours...');
                
                // Use our dedicated function to fetch directly from API
                const apiData = await fetchDirectFromAPI();
                
                // Log performance metrics
                console.log(`API Performance: ${apiData.responseTime}ms response time`);
                console.log(`API Résultats: ${apiData.wishlists.length} listes, ${apiData.items.length} vœux, ${apiData.invitations.length} invitations`);
                
                // Validate data integrity
                const hasWishlistData = apiData.wishlists.length > 0;
                const hasWishItemsData = apiData.items.length > 0;
                const hasInvitationsData = apiData.invitations.length > 0;
                
                // Update the context with fresh data
                if (hasWishlistData || hasWishItemsData || hasInvitationsData) {
                  console.log('Données récupérées, mise à jour du contexte...');
                  
                  // Using refreshAllData to ensure context state is updated
                  const refreshSuccess = await refreshAllData();
                  
                  if (refreshSuccess) {
                    toast.success(`Synchronisé: ${apiData.wishlists.length} listes, ${apiData.items.length} vœux, ${apiData.invitations.length} invitations`);
                  } else {
                    toast.warning('Synchronisation terminée avec avertissements');
                  }
                } else {
                  // No data found - could be empty or API issue
                  console.log('Aucune donnée reçue de l\'API - vérification...');
                  
                  if (apiData.responseTime < 200) {
                    // Suspiciously fast response might indicate API issue
                    toast.warning('Réponse API anormale - essai de recharger via le contexte');
                    await refreshAllData();
                  } else {
                    toast.info('Aucune donnée trouvée sur l\'API');
                  }
                }
                
                console.log('====== FIN SYNCHRONISATION DIRECTE ======');
              } catch (err: any) {
                console.error('Erreur lors de la synchronisation API directe:', err);
                toast.error(`Erreur API: ${err.message}`);
                
                // Try fallback to context refresh
                try {
                  toast.info('Tentative de récupération via le contexte...');
                  await refreshAllData();
                } catch (fallbackErr) {
                  console.error('Échec de la récupération via le contexte:', fallbackErr);
                }
              }
            }}
          >
            <MaterialIcons name="sync" size={26} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.7}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={28} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.7}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab Container with Animated Indicator */}
      <View style={styles.tabContainer}>
        <Animated.View 
          style={[
            styles.tabIndicator, 
            { 
              transform: [{ translateX }],
              width: width / 2 - 40
            }
          ]} 
        />
        <TouchableOpacity 
          style={styles.tab} 
          activeOpacity={0.7}
          onPress={() => setActiveTab('listes')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'listes' && styles.activeTabText
          ]}>
            Listes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab} 
          activeOpacity={0.7}
          onPress={() => setActiveTab('voeux')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'voeux' && styles.activeTabText
          ]}>
            Vœux
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
      >
        {/* Lists Tab */}
        {/* Utiliser un seul FlatList pour les invitations et les wishlists */}
        {activeTab === 'listes' && (
          <Animated.View style={[styles.tabContent, { opacity: listOpacity }]}>
            <FlatList
              data={[...invitations, ...wishlists]} // Combiner les deux listes
              renderItem={({ item }) => {
                // Déterminer si c'est une invitation ou une wishlist standard
                // On peut se baser sur une propriété unique aux invitations si elle existe,
                // ou sur le fait qu'elle est dans la liste 'invitations' (moins propre ici)
                // Pour cet exemple, on suppose qu'une invitation a un statut spécifique ou manque une propriété
                // Ici, on va juste vérifier si l'item existe dans la liste originale des invitations
                const isInvitation = invitations.some(inv => inv.id === item.id);
                if (isInvitation) {
                  return renderInvitationCard(item);
                } else {
                  return renderWishlistCard(item);
                }
              }}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                // Afficher le message d'état vide seulement si les deux listes sont vides
                invitations.length === 0 && wishlists.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                      {error ? 'Erreur de chargement des données' : 'Vous n\'avez pas encore de listes de souhaits'}
                    </Text>
                    {error ? (
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={async () => {
                          toast.info('Nouvelle tentative de chargement...');
                          const success = await refreshAllData();
                          if (success) {
                            toast.success('Données actualisées');
                          } else {
                            toast.error('Échec du chargement');
                          }
                        }}
                      >
                        <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.createButtonText}>Réessayer</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => setShowCreateModal(true)}
                      >
                        <Text style={styles.createButtonText}>Créer une liste</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null // Ne rien afficher si au moins une liste n'est pas vide
              }
              // Ajouter d'autres props FlatList si nécessaire (initialNumToRender, etc.)
            />
          </Animated.View>
        )}
          
        {/* Le composant ListEmptyComponent gère maintenant l'état vide */}
        
        {/* Wishes Tab */}
        {/* Utiliser FlatList pour l'onglet Vœux */}
        {activeTab === 'voeux' && (
          <Animated.View style={[styles.tabContent, { opacity: wishesOpacity }]}>
            <FlatList
              data={wishItems} // Utiliser les données des vœux
              renderItem={({ item }) => renderProductCard(item)} // Utiliser la fonction de rendu existante
              keyExtractor={(item) => item.id}
              numColumns={2} // Afficher en grille de 2 colonnes
              columnWrapperStyle={styles.productsGridColumnWrapper} // Style pour l'espacement entre colonnes
              // ListHeaderComponent est supprimé pour ne plus afficher la carte "Créer un vœu" en permanence
              ListEmptyComponent={ // Afficher si la liste des vœux est vide (après le bouton créer)
                wishItems.length === 0 ? (
                   <View style={styles.emptyStateContainer}>
                     <Text style={styles.emptyStateText}>
                       {error ? 'Erreur de chargement des vœux' : 'Vous n\'avez pas encore de vœux'}
                     </Text>
                     {error ? (
                       <TouchableOpacity
                         style={styles.retryButton}
                         onPress={async () => {
                           toast.info('Nouvelle tentative de chargement...');
                           const success = await refreshAllData();
                           if (success) {
                             toast.success('Données actualisées');
                           } else {
                             toast.error('Échec du chargement');
                           }
                         }}
                       >
                         <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                         <Text style={styles.createButtonText}>Réessayer</Text>
                       </TouchableOpacity>
                     ) : (
                       <TouchableOpacity
                         style={styles.createButton} // Utilise le même style que "Créer une liste"
                         activeOpacity={0.7}
                         onPress={() => {
                           if (wishlists.length > 0) {
                             const defaultWishlistId = wishlists[0]?.id;
                             if (defaultWishlistId) {
                               navigation.navigate('AddWish', { wishlistId: defaultWishlistId });
                             } else {
                               toast.error("Impossible de trouver une liste par défaut.");
                               setActiveTab('listes');
                               setShowCreateModal(true);
                             }
                           } else {
                             toast.info("Créez d'abord une liste de souhaits");
                             setActiveTab('listes');
                             setShowCreateModal(true);
                           }
                         }}
                       >
                         <Text style={styles.createButtonText}>Créer un vœu</Text>
                       </TouchableOpacity>
                     )}
                   </View>
                ) : null
              }
              // Ajouter d'autres props FlatList si nécessaire
            />
          </Animated.View>
        )}
            
        {/* Le composant ListEmptyComponent gère maintenant l'état vide */}
      </ScrollView>
      
      {/* Create Wishlist Modal */}
      <CreateWishlistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWishlist={handleCreateWishlist}
      />
      
      {/* Modal de recherche */}
      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      
      {/* Bottom navigation bar */}
      <BottomTabBar activeTab="wishes" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 20,
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    padding: 4,
    position: 'relative',
    height: 50,
  },
  tabIndicator: {
    position: 'absolute',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#000',
    top: 0,
    left: 0,
    margin: 4,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 90, // Extra space for bottom tab bar
  },
  tabContent: {
    width: '100%',
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -5,
    left: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  invitationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  invitationText: {
    fontSize: 14,
    color: '#333',
  },
  invitedBy: {
    fontWeight: '400',
    color: '#777',
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  rejectButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  acceptButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEFFEE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  wishlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 5,
  },
  wishlistImageContainer: {
    position: 'relative',
  },
  favoriteTag: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FFD700',
    borderRadius: 5,
    padding: 3,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  wishlistInfo: {
    flex: 1,
    paddingLeft: 15,
  },
  wishlistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wishlistDescription: {
    fontSize: 14,
    color: '#666',
  },
  chevronIcon: {
    paddingLeft: 10,
  },
  // Style pour FlatList numColumns=2
  productsGridColumnWrapper: {
    justifyContent: 'space-between', // Espace entre les colonnes
  },
  productCard: {
    width: cardWidth, // Utiliser la largeur calculée
    height: cardWidth + 60, // Ajuster la hauteur pour le texte
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    // marginHorizontal n'est plus nécessaire avec columnWrapperStyle
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  productImageContainer: {
    position: 'relative',
    height: '60%', // 60% de la hauteur pour l'image
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#f3f3f3', // Couleur de fond pendant le chargement
  },
  wishFavoriteTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  wishFavoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  favoriteActive: {
    backgroundColor: '#FFD700',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  productInfo: {
    padding: 10,
    paddingTop: 5,
    height: '40%', // 40% restant pour les infos produit
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    height: 20,
  },
  priceAndButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productButton: {
    backgroundColor: '#000',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductCard: {
    width: '48%',
    height: 230,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  addProductIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    maxWidth: '80%',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#3366ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createWishCard: {
    // Style pour le bouton "Créer un vœu" en tête de la FlatList
    width: '100%', // Prend toute la largeur
    height: 100, // Hauteur fixe ou dynamique
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  createWishIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  createWishText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  }
});

export default WishlistScreen;
