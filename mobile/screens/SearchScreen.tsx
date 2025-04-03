import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { 
  searchUsers, 
  getSuggestedUsers, 
  getSentFriendRequests,
  getUserFriends,
  sendFriendRequest, 
  cancelFriendRequest,
  saveSentFriendRequest,
  removeSentFriendRequest,
  AppContact,
  Friend
} from '../api/contacts';
import { toast } from 'sonner-native';

const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // États pour les données
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppContact[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<AppContact[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<string[]>([]);
  
  // États pour le statut de l'interface
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [sendingRequests, setSendingRequests] = useState<Record<string, boolean>>({});

  // Collection des utilisateurs connus pour afficher les vraies informations des utilisateurs
  const knownUsers = useMemo(() => {
    const userMap = new Map<string, AppContact>();
    
    // Ajouter tous les utilisateurs connus à la map
    [...searchResults, ...suggestedUsers].forEach(user => {
      if (user && user.id) {
        userMap.set(user.id, user);
      }
    });
    
    return userMap;
  }, [searchResults, suggestedUsers]);

  // Fonction pour mettre à jour toutes les données
  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Charger les données dans un ordre spécifique
      await Promise.all([
        loadSentFriendRequests(),
        loadFriends(),
        loadSuggestedUsers()
      ]);
      
      console.log("✅ TOUTES LES DONNÉES RECHARGÉES");
    } catch (error) {
      console.error("❌ ERREUR LORS DU RECHARGEMENT DES DONNÉES:", error);
      toast.error("Erreur lors du rechargement des données");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Charger les données initiales au démarrage
  useEffect(() => {
    refreshAllData();
  }, []);

  // Fonction pour charger la liste des amis
  const loadFriends = async () => {
    setFriendsLoading(true);
    try {
      console.log('🔍 CHARGEMENT DES AMIS');
      const response = await getUserFriends();
      
      if (response.data && response.data.length > 0) {
        // Extraire les IDs des amis
        const ids = response.data.map(friend => friend.id);
        console.log(`✅ ${ids.length} AMIS CHARGÉS: ${ids.join(', ')}`);
        setFriendIds(ids);
      } else {
        console.log('ℹ️ AUCUN AMI TROUVÉ');
        setFriendIds([]);
      }
    } catch (error) {
      console.error('❌ ERREUR LORS DU CHARGEMENT DES AMIS:', error);
      setFriendIds([]);
    } finally {
      setFriendsLoading(false);
    }
  };
  
  // Fonction pour charger les demandes d'amis envoyées
  const loadSentFriendRequests = async () => {
    try {
      console.log('🔍 CHARGEMENT DES DEMANDES ENVOYÉES');
      const response = await getSentFriendRequests();
      
      if (response.data && response.data.length > 0) {
        console.log(`✅ ${response.data.length} DEMANDES ENVOYÉES: ${response.data.join(', ')}`);
        setSentFriendRequests(response.data);
        
        // Créer un objet pour vérifier rapidement le statut d'une demande
        const pendingMap: Record<string, boolean> = {};
        response.data.forEach(id => {
          pendingMap[id] = true;
        });
        setPendingRequests(pendingMap);
      } else {
        console.log('ℹ️ AUCUNE DEMANDE ENVOYÉE TROUVÉE');
        setSentFriendRequests([]);
        setPendingRequests({});
      }
    } catch (error) {
      console.error('❌ ERREUR LORS DU CHARGEMENT DES DEMANDES ENVOYÉES:', error);
      setSentFriendRequests([]);
      setPendingRequests({});
    }
  };

  // Fonction pour charger les suggestions d'utilisateurs
  const loadSuggestedUsers = async () => {
    setSuggestionsLoading(true);
    try {
      console.log('🔍 CHARGEMENT DES SUGGESTIONS');
      const response = await getSuggestedUsers();
      
      if (response.data && response.data.length > 0) {
        console.log(`✅ ${response.data.length} SUGGESTIONS CHARGÉES`);
        setSuggestedUsers(response.data);
      } else {
        console.log('ℹ️ AUCUNE SUGGESTION TROUVÉE');
        setSuggestedUsers([]);
      }
    } catch (error) {
      console.error('❌ ERREUR LORS DU CHARGEMENT DES SUGGESTIONS:', error);
      setSuggestedUsers([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Effectuer une recherche lorsque la requête change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 1) {
        console.log(`🔍 RECHERCHE DÉCLENCHÉE: "${searchQuery}"`);
        handleSearch();
      } else {
        console.log('🔄 RÉINITIALISATION DES RÉSULTATS DE RECHERCHE');
        setSearchResults([]);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fonction de recherche
  const handleSearch = async () => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // S'assurer que les amis et demandes sont chargés
      if (friendIds.length === 0) {
        console.log("⚠️ CHARGEMENT DES AMIS AVANT LA RECHERCHE");
        await loadFriends();
      }
      
      if (sentFriendRequests.length === 0) {
        console.log("⚠️ CHARGEMENT DES DEMANDES AVANT LA RECHERCHE");
        await loadSentFriendRequests();
      }

      // Effectuer la recherche
      console.log(`🔍 RECHERCHE: "${searchQuery}" AVEC TOUS LES PARAMÈTRES D'INCLUSION`);
      const response = await searchUsers(searchQuery);
      
      if (response.error) {
        console.error('❌ ERREUR API LORS DE LA RECHERCHE:', response.error);
        toast.error(response.error);
        setSearchResults([]);
      } else if (response.data) {
        console.log(`✅ ${response.data.length} UTILISATEURS TROUVÉS`);
        
        // Vérifier si les amis et demandes sont bien présents
        const foundFriendsCount = response.data.filter(user => friendIds.includes(user.id)).length;
        const foundPendingCount = response.data.filter(user => sentFriendRequests.includes(user.id)).length;
        
        console.log(`- Amis présents: ${foundFriendsCount}/${friendIds.length}`);
        console.log(`- Demandes présentes: ${foundPendingCount}/${sentFriendRequests.length}`);
        
        setSearchResults(response.data);
      } else {
        console.log('ℹ️ AUCUN RÉSULTAT TROUVÉ');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ EXCEPTION LORS DE LA RECHERCHE:', error);
      toast.error('Une erreur est survenue lors de la recherche');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'envoi d'une demande d'ami
  const handleSendFriendRequest = async (userId: string) => {
    if (!userId || userId.trim() === '') {
      toast.error('Identifiant utilisateur invalide');
      return;
    }
    
    // Vérifier que l'utilisateur n'est pas déjà un ami
    if (friendIds.includes(userId)) {
      console.log(`⚠️ ${userId} EST DÉJÀ VOTRE AMI`);
      toast.info('Cet utilisateur est déjà votre ami');
      return;
    }
    
    // Vérifier que l'utilisateur n'a pas déjà une demande
    if (sentFriendRequests.includes(userId) || pendingRequests[userId]) {
      console.log(`⚠️ UNE DEMANDE A DÉJÀ ÉTÉ ENVOYÉE À ${userId}`);
      toast.info('Une demande d\'ami a déjà été envoyée à cet utilisateur');
      return;
    }
    
    // Marquer cette demande comme en cours d'envoi
    setSendingRequests(prev => ({ ...prev, [userId]: true }));

    try {
      console.log(`📤 ENVOI D'UNE DEMANDE D'AMI À ${userId}`);
      const response = await sendFriendRequest(userId);
      
      if (response.error) {
        console.error('❌ ERREUR:', response.error);
        
        // Si l'erreur concerne une demande déjà envoyée, on la traite comme un succès
        if (response.error.includes('déjà') || response.error.includes('already')) {
          toast.info('Une demande d\'ami a déjà été envoyée à cet utilisateur');
          
          // Ajouter à la liste des demandes en attente
          setPendingRequests(prev => ({ ...prev, [userId]: true }));
          setSentFriendRequests(prev => [...prev, userId]);
          await saveSentFriendRequest(userId);
        } else {
          toast.error(response.error);
        }
      } else {
        console.log('✅ DEMANDE ENVOYÉE AVEC SUCCÈS');
        toast.success('Demande d\'ami envoyée');
        
        // Ajouter à la liste des demandes en attente
        setPendingRequests(prev => ({ ...prev, [userId]: true }));
        setSentFriendRequests(prev => [...prev, userId]);
        await saveSentFriendRequest(userId);
      }
    } catch (error) {
      console.error('❌ EXCEPTION:', error);
      toast.error('Une erreur est survenue lors de l\'envoi de la demande');
    } finally {
      setSendingRequests(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Gérer l'annulation d'une demande d'ami
  const handleCancelFriendRequest = async (userId: string) => {
    Alert.alert(
      'Annuler la demande d\'ami',
      'Voulez-vous vraiment annuler cette demande d\'ami ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui', 
          onPress: async () => {
            setSendingRequests(prev => ({ ...prev, [userId]: true }));
            
            try {
              console.log(`📤 ANNULATION DE LA DEMANDE D'AMI POUR ${userId}`);
              const response = await cancelFriendRequest(userId);
              
              if (response.error) {
                console.error('❌ ERREUR:', response.error);
                
                // Si l'erreur est 404, le backend n'a probablement pas cet endpoint
                // Traiter quand même localement
                if (response.error.includes('404') || response.error.includes('Not Found')) {
                  console.log('⚠️ ENDPOINT NON TROUVÉ - TRAITEMENT LOCAL');
                  toast.success('Demande d\'ami annulée');
                  
                  // Supprimer de la liste des demandes en attente
                  const newPendingRequests = { ...pendingRequests };
                  delete newPendingRequests[userId];
                  setPendingRequests(newPendingRequests);
                  setSentFriendRequests(prev => prev.filter(id => id !== userId));
                  await removeSentFriendRequest(userId);
                } else {
                  toast.error(response.error);
                }
              } else {
                console.log('✅ DEMANDE ANNULÉE AVEC SUCCÈS');
                toast.success('Demande d\'ami annulée');
                
                // Supprimer de la liste des demandes en attente
                const newPendingRequests = { ...pendingRequests };
                delete newPendingRequests[userId];
                setPendingRequests(newPendingRequests);
                setSentFriendRequests(prev => prev.filter(id => id !== userId));
                await removeSentFriendRequest(userId);
              }
            } catch (error) {
              console.error('❌ EXCEPTION:', error);
              
              // Même en cas d'erreur, traiter localement
              toast.success('Demande d\'ami annulée localement');
              
              // Supprimer de la liste des demandes en attente
              const newPendingRequests = { ...pendingRequests };
              delete newPendingRequests[userId];
              setPendingRequests(newPendingRequests);
              setSentFriendRequests(prev => prev.filter(id => id !== userId));
              await removeSentFriendRequest(userId);
            } finally {
              setSendingRequests(prev => ({ ...prev, [userId]: false }));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Préparer les données à afficher en combinant résultats et suggestions
  // et en s'assurant que tous les amis et demandes sont toujours présents
  const displayData = useMemo(() => {
    console.log("🔄 PRÉPARATION DES DONNÉES D'AFFICHAGE");
    
    // Choisir la source de base des données
    const baseData = searchQuery.length >= 1 ? searchResults : suggestedUsers;
    const displayData = [...baseData];
    const displayDataIds = new Set(displayData.map(item => item.id));
    
    // Ajouter les amis manquants
    friendIds.forEach(friendId => {
      if (!displayDataIds.has(friendId)) {
        // Vérifier si on connaît cet ami
        const knownUser = knownUsers.get(friendId);
        
        if (knownUser) {
          console.log(`➕ AJOUT DE L'AMI CONNU: ${knownUser.name} (${friendId})`);
          displayData.push({
            ...knownUser,
            isInApp: true
          });
        } else {
          console.log(`➕ AJOUT DE L'AMI INCONNU: ${friendId}`);
          displayData.push({
            id: friendId,
            name: `Ami ${friendId.substring(0, 6)}...`,
            username: `ami_${friendId.substring(0, 6)}`,
            avatar: `https://ui-avatars.com/api/?name=AMI&background=4CD964&color=fff`,
            isInApp: true
          });
        }
        
        displayDataIds.add(friendId);
      }
    });
    
    // Ajouter les demandes manquantes
    sentFriendRequests.forEach(requestId => {
      if (!displayDataIds.has(requestId)) {
        // Vérifier si on connaît cet utilisateur
        const knownUser = knownUsers.get(requestId);
        
        if (knownUser) {
          console.log(`➕ AJOUT DE LA DEMANDE CONNUE: ${knownUser.name} (${requestId})`);
          displayData.push({
            ...knownUser,
            isInApp: true
          });
        } else {
          console.log(`➕ AJOUT DE LA DEMANDE INCONNUE: ${requestId}`);
          displayData.push({
            id: requestId,
            name: `Demande ${requestId.substring(0, 6)}...`,
            username: `demande_${requestId.substring(0, 6)}`,
            avatar: `https://ui-avatars.com/api/?name=DEM&background=FF9500&color=fff`,
            isInApp: true
          });
        }
      }
    });
    
    console.log(`🔄 TOTAL: ${displayData.length} UTILISATEURS À AFFICHER`);
    return displayData;
  }, [searchQuery, searchResults, suggestedUsers, friendIds, sentFriendRequests, knownUsers]);

  // Rendu d'un élément utilisateur
  const renderUserItem = useCallback(({ item }: { item: AppContact }) => {
    // Déterminer le statut de l'utilisateur
    const isFriend = friendIds.includes(item.id);
    const isPendingRequest = sentFriendRequests.includes(item.id) || pendingRequests[item.id];
    const isLoading = sendingRequests[item.id] || false;
    
    // Traiter l'avatar de manière sécurisée
    let avatarUrl = item.avatar;
    if (!avatarUrl || avatarUrl.trim() === '' || avatarUrl === 'null' || avatarUrl === 'undefined') {
      if (isFriend) {
        avatarUrl = `https://ui-avatars.com/api/?name=AMI&background=4CD964&color=fff`;
      } else if (isPendingRequest) {
        avatarUrl = `https://ui-avatars.com/api/?name=DEM&background=FF9500&color=fff`;
      } else {
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=random&color=fff`;
      }
    }
    
    return (
      <View style={[
        styles.userCard, 
        isFriend ? styles.friendCard : null,
        isPendingRequest ? styles.pendingCard : null
      ]}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={styles.avatar}
          defaultSource={require('../assets/icon.png')}
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.name || 'Utilisateur'}</Text>
          <Text style={styles.username}>@{item.username || 'utilisateur'}</Text>
          
          {isFriend && (
            <View style={styles.badgeContainer}>
              <Ionicons name="checkmark-circle" size={14} color="#4CD964" style={styles.badgeIcon} />
              <Text style={styles.friendBadge}>Ami</Text>
            </View>
          )}
          
          {isPendingRequest && (
            <View style={styles.badgeContainer}>
              <Ionicons name="time" size={14} color="#FF9500" style={styles.badgeIcon} />
              <Text style={styles.pendingBadge}>Demande envoyée</Text>
            </View>
          )}
        </View>
        
        {isFriend ? (
          // Bouton ami
          <View style={[styles.addButton, styles.friendButton]}>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </View>
        ) : (
          // Bouton envoyer/annuler demande
          <TouchableOpacity
            style={[
              styles.addButton, 
              isPendingRequest ? styles.pendingButton : null
            ]}
            onPress={() => 
              isPendingRequest 
                ? handleCancelFriendRequest(item.id) 
                : handleSendFriendRequest(item.id)
            }
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : isPendingRequest ? (
              <Ionicons name="close" size={20} color="#FFF" />
            ) : (
              <Ionicons name="person-add" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }, [friendIds, sentFriendRequests, pendingRequests, sendingRequests]);

  // Rendu principal
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rechercher des amis</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {loading && <ActivityIndicator size="small" color="#007AFF" />}
      </View>

      {/* Liste des utilisateurs */}
      <FlatList
        data={displayData}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAllData}
            colors={["#007AFF"]}
          />
        }
        extraData={{ friendIds, sentFriendRequests }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {!loading ? (
              <View>
                <View style={styles.emptyIcon}>
                  <Ionicons name="search-outline" size={60} color="#CCCCCC" />
                </View>
                <Text style={styles.emptyText}>
                  {searchQuery.length >= 1 
                    ? `Aucun utilisateur trouvé pour "${searchQuery}"`
                    : "Aucune suggestion disponible pour le moment."}
                </Text>
                <Text style={styles.emptySubText}>
                  Essayez de rechercher un nom ou un email
                </Text>
              </View>
            ) : null}
          </View>
        )}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 20,
    marginBottom: 10,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#222',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  badgeIcon: {
    marginRight: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  pendingButton: {
    backgroundColor: '#FF9500',
  },
  friendButton: {
    backgroundColor: '#4CD964',
  },
  friendCard: {
    backgroundColor: '#F0FFF0',
    borderLeftWidth: 4,
    borderLeftColor: '#4CD964',
  },
  pendingCard: {
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  friendBadge: {
    color: '#4CD964',
    fontWeight: 'bold',
    fontSize: 12,
  },
  pendingBadge: {
    color: '#FF9500',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default SearchScreen;