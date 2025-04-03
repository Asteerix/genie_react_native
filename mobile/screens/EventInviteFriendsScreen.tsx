import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Share,
  Clipboard,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import * as ReactNavigation from '@react-navigation/native'; // Importer l'espace de noms complet
import { RouteProp } from '@react-navigation/native'; // Garder RouteProp séparé si besoin
import { StackNavigationProp } from '@react-navigation/stack'; // Importer StackNavigationProp
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation'; // Importer RootStackParamList
import { toast } from 'sonner-native';
import { StatusBar } from 'expo-status-bar';

interface FriendInfo {
  id: string;
  name: string;
  username: string;
  avatar: string;
  type: 'managed' | 'friend';
}

const FRIENDS_LIST: FriendInfo[] = [
  {
    id: '1',
    name: 'Camille Toulet',
    username: 'camilletoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20girl%20cartoon%20portrait&aspect=1:1&seed=123',
    type: 'managed'
  },
  {
    id: '2',
    name: 'Noémie Sanchez',
    username: 'noemiesanchez',
    avatar: 'https://api.a0.dev/assets/image?text=young%20girl%20cartoon%20portrait&aspect=1:1&seed=456',
    type: 'managed'
  },
  {
    id: '3',
    name: 'Raphaël Toulet',
    username: 'raphaeltoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20boy%20cartoon%20portrait&aspect=1:1&seed=789',
    type: 'managed'
  },
  {
    id: '4',
    name: 'Audriana Toulet',
    username: 'audrianatoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=101',
    type: 'friend'
  },
  {
    id: '5',
    name: 'Johanna Toulet',
    username: 'johannatoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20woman%20cartoon%20portrait&aspect=1:1&seed=102',
    type: 'friend'
  },
  {
    id: '6',
    name: 'Paul Marceau',
    username: 'paulmarceau',
    avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait&aspect=1:1&seed=103',
    type: 'friend'
  }
];

const { width } = Dimensions.get('window');

// Interface pour les props de AnimatedFriendItem
interface AnimatedFriendItemProps {
  friend: FriendInfo;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}

// Composant animé pour les éléments de liste
const AnimatedFriendItem: React.FC<AnimatedFriendItemProps> = ({ friend, isSelected, onToggle, index }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 50,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const toggleAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  
  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isSelected ? 1 : 0,
      friction: 7,
      tension: 40,
      useNativeDriver: true
    }).start();
  }, [isSelected]);

  return (
    <Animated.View
      style={[
        styles.friendItem,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <Image source={{ uri: friend.avatar }} style={styles.avatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.name}>{friend.name}</Text>
        <Text style={styles.username}>{friend.username}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.addButton,
          isSelected && styles.addButtonSelected
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Animated.View style={{
          transform: [
            { rotate: toggleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '135deg']
            })}
          ]
        }}>
          <Ionicons name="add" size={22} color={isSelected ? "white" : "black"} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EventInviteFriendsScreen = () => {
  // Typer correctement la navigation
  const navigation = ReactNavigation.useNavigation<StackNavigationProp<RootStackParamList>>(); // Utiliser l'espace de noms
  // Si vous avez besoin des paramètres de la route (ex: eventId):
  // Décommenter pour récupérer eventId
  type EventInviteFriendsRouteProp = RouteProp<RootStackParamList, 'EventInviteFriends'>;
  const route = ReactNavigation.useRoute<EventInviteFriendsRouteProp>(); // Utiliser l'espace de noms
  const { eventId } = route.params; // Récupérer l'eventId
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false); // Nouvel état pour gérer la sauvegarde
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation pour le bouton Save
  const saveButtonAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(saveButtonAnim, {
      toValue: selectedFriends.length > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1)
    }).start();
  }, [selectedFriends]);

  // Filtrer les amis en fonction de la recherche
  const filteredFriends = searchQuery
    ? FRIENDS_LIST.filter(friend => 
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FRIENDS_LIST;

  // Séparer les comptes gérés et les amis
  const managedAccounts = filteredFriends.filter(friend => friend.type === 'managed');
  const friends = filteredFriends.filter(friend => friend.type === 'friend');

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Rejoins-moi sur cet événement !',
        url: 'https://example.com/event'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString('https://example.com/event');
    toast.success('Lien copié !', {
      duration: 2000,
      // position: 'top-center' // Supprimer la position pour utiliser la valeur par défaut
    });
  };
  
  const handleSelectFriend = (friendId: string) => {
    setSelectedFriends(prev => {
      const arrayPrev = Array.isArray(prev) ? prev : [];
      return arrayPrev.includes(friendId)
        ? arrayPrev.filter(id => id !== friendId)
        : [...arrayPrev, friendId];
    });
  };

  const handleSave = () => {
    if (isSaving) return; // Empêcher double clic
    setIsSaving(true); // Désactiver le bouton

    // Supprimer l'animation de sortie explicite ici
    // L'animation d'apparition/disparition est gérée par useEffect [selectedFriends]
    // Simuler un délai pour l'API (ou l'appel API réel)
    setTimeout(() => {
        toast.success(`${selectedFriends.length} invitation(s) envoyée(s) !`, {
            duration: 2000,
            style: { marginBottom: 20 }
        });
        // Revenir à l'écran principal des événements PUIS naviguer vers le détail
        navigation.popToTop(); // Retourne à EventsScreen (ou la racine de la stack)
        navigation.push('EventDetail', { eventId: eventId }); // Ajoute EventDetail par-dessus
        // isSaving sera réinitialisé au prochain montage de l'écran si nécessaire
    }, 300); // Petit délai pour montrer l'état désactivé
  };

  // Animation pour l'apparition des éléments du header
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { 
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0]
          })}]
        }
      ]}>
        <TouchableOpacity 
          onPress={() => navigation.popToTop()} // Revient au premier écran de la pile (EventsScreen)
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitez vos amis</Text>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name="help-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </Animated.View>

      {/* Share Options avec animation */}
      <Animated.View style={[
        styles.shareOptions,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0]
          })}]
        }
      ]}>
        <TouchableOpacity style={styles.shareOption} onPress={handleShare} activeOpacity={0.8}>
          <View style={styles.shareIconContainer}>
            <Ionicons name="share-outline" size={24} color="black" />
          </View>
          <Text style={styles.shareOptionLabel}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink} activeOpacity={0.8}>
          <View style={styles.shareIconContainer}>
            <Ionicons name="link" size={24} color="black" />
          </View>
          <Text style={styles.shareOptionLabel}>Copier</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} activeOpacity={0.8}>
          <View style={[styles.appIconContainer, { backgroundColor: '#4CD964' }]}>
            <Ionicons name="chatbubble-outline" size={22} color="white" />
          </View>
          <Text style={styles.shareOptionLabel}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} activeOpacity={0.8}>
          <View style={[styles.appIconContainer, { backgroundColor: '#007AFF' }]}>
            <Ionicons name="mail-outline" size={22} color="white" />
          </View>
          <Text style={styles.shareOptionLabel}>Email</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Search Bar avec animation */}
      <Animated.View style={[
        styles.searchContainer,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}]
        }
      ]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Trouver un(e) ami(e)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery !== '' && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Managed Accounts Section */}
        {managedAccounts.length > 0 && (
          <Animated.View style={[
            styles.section,
            { 
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}]
            }
          ]}>
            <Text style={styles.sectionTitle}>Mes comptes gérés</Text>
            {managedAccounts.map((account, index) => (
              <AnimatedFriendItem 
                key={account.id} 
                friend={account} 
                index={index}
                isSelected={selectedFriends.includes(account.id)}
                onToggle={() => handleSelectFriend(account.id)}
              />
            ))}
          </Animated.View>
        )}

        {/* Friends Section */}
        {friends.length > 0 && (
          <Animated.View style={[
            styles.section,
            { 
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0]
              })}]
            }
          ]}>
            <Text style={styles.sectionTitle}>Mes amis</Text>
            {friends.map((friend, index) => (
              <AnimatedFriendItem 
                key={friend.id} 
                friend={friend} 
                index={index + managedAccounts.length}
                isSelected={selectedFriends.includes(friend.id)}
                onToggle={() => handleSelectFriend(friend.id)}
              />
            ))}
          </Animated.View>
        )}
        
        {/* Espace en bas pour le floating button */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Save Button avec animation */}
      <Animated.View 
        style={[
          styles.saveButtonContainer,
          {
            transform: [
              { translateY: saveButtonAnim.interpolate({
                  inputRange: [0, 1], // Garder l'animation d'entrée
                  outputRange: [100, 0],
                  extrapolate: 'clamp' // Empêcher d'aller au-delà de 0 pour translateY
                })},
                { scale: saveButtonAnim.interpolate({
                  inputRange: [0, 1], // Garder uniquement l'animation d'entrée/sortie basée sur selectedFriends
                  outputRange: [0.8, 1]
                })}
              ],
              opacity: saveButtonAnim.interpolate({ // Garder uniquement l'animation d'entrée/sortie basée sur selectedFriends
                inputRange: [0, 1],
                outputRange: [0, 1]
              })
            } // Supprimer l'accolade en trop ici
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.saveButton,
            selectedFriends.length === 0 && styles.disabledButton
          ]} 
          onPress={handleSave}
          disabled={selectedFriends.length === 0 || isSaving} // Désactiver aussi si isSaving est true
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  shareOption: {
    alignItems: 'center',
    width: width / 4 - 10,
  },
  shareIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  shareOptionLabel: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 5,
  },
  searchInputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  friendInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#8E8E93',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  addButtonSelected: {
    backgroundColor: '#000',
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: { // Style appliqué quand disabled={true}
    opacity: 0.5, // Garder l'opacité réduite pour l'état désactivé
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default EventInviteFriendsScreen;