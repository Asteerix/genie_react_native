import React, { useState, useMemo } from 'react'; // Ajouter useMemo ici
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation'; // Assuming RootStackParamList is defined here

// --- Types ---
type OngoingPurchasesNavigationProp = StackNavigationProp<RootStackParamList, 'OngoingPurchases'>;

interface PurchaseItem {
  id: string;
  title: string;
  details: string; // e.g., "Taille 42.5, Blanc"
  price: string;
  goldReward: number;
  imageUrl: string;
  avatarUrl: string; // Avatar of the person who added the wish
}

interface EventPurchaseGroup {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventEmoji: string; // Emoji for the event icon
  eventColor: string; // Background color for the event icon
  items: PurchaseItem[];
  isExpanded: boolean;
}

// --- Mock Data ---
const mockOngoingPurchases: EventPurchaseGroup[] = [
  {
    eventId: 'noel-2024',
    eventName: 'Noël',
    eventDate: '25/12/2024',
    eventEmoji: '🎄',
    eventColor: '#FFE6E6',
    isExpanded: true,
    items: [
      {
        id: 'nike-socks',
        title: 'Nike Chaussettes',
        details: 'Taille 42.5, Blanc',
        price: '29,00 €',
        goldReward: 150,
        imageUrl: 'https://api.a0.dev/assets/image?text=Nike%20Socks&aspect=1:1&seed=socks', // Replace with actual image URL if available
        avatarUrl: 'https://api.a0.dev/assets/image?text=User1&aspect=1:1&seed=avatar1',
      },
      {
        id: 'gucci-bag',
        title: 'Sac Gucci',
        details: 'Couleur Noire',
        price: '690,00 €',
        goldReward: 0, // Assuming no gold reward shown
        imageUrl: 'https://api.a0.dev/assets/image?text=Gucci%20Bag&aspect=1:1&seed=bag', // Replace with actual image URL if available
        avatarUrl: 'https://api.a0.dev/assets/image?text=User1&aspect=1:1&seed=avatar1',
      },
    ],
  },
  {
    eventId: 'anniv-paul',
    eventName: 'Anniversaire',
    eventDate: '09/12/2024',
    eventEmoji: '🎂',
    eventColor: '#E8E1FF',
    isExpanded: true,
    items: [
      {
        id: 'diesel-belt',
        title: 'Ceinture Diesel',
        details: 'Taille M, Couleu...', // Truncated as per image
        price: '89,89 €',
        goldReward: 400,
        imageUrl: 'https://api.a0.dev/assets/image?text=Diesel%20Belt&aspect=1:1&seed=belt', // Replace with actual image URL if available
        avatarUrl: 'https://api.a0.dev/assets/image?text=User2&aspect=1:1&seed=avatar2',
      },
    ],
  },
  {
    eventId: 'mariage-dan',
    eventName: 'Mariage',
    eventDate: '03/07/2024',
    eventEmoji: '💍',
    eventColor: '#E0F7FF',
    isExpanded: false, // Example of a collapsed group
    items: [], // No items shown when collapsed initially
  },
];

// --- Component ---
const OngoingPurchasesScreen = () => {
  const navigation = useNavigation<OngoingPurchasesNavigationProp>();
  const [purchaseGroups, setPurchaseGroups] = useState<EventPurchaseGroup[]>(mockOngoingPurchases);

  const toggleExpand = (eventId: string) => {
    setPurchaseGroups(prevGroups =>
      prevGroups.map(group =>
        group.eventId === eventId ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };

  const totalGoldReward = useMemo(() => {
    return purchaseGroups.reduce((total, group) => {
      return total + group.items.reduce((groupTotal, item) => groupTotal + item.goldReward, 0);
    }, 0);
  }, [purchaseGroups]); // Recalculate if groups change (e.g., items added/removed)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes achats en cours</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      {/* Gold Banner */}
      <View style={styles.goldBanner}>
        <Image source={{ uri: 'https://api.a0.dev/assets/image?text=Gold%20Coin&aspect=1:1&seed=gold' }} style={styles.goldCoin} />
        <Text style={styles.goldText}>
          Récupère <Text style={styles.goldAmount}>+{totalGoldReward} golds</Text> en achetant ces articles
        </Text>
      </View>

      {/* Purchases List */}
      <ScrollView style={styles.scrollView}>
        {purchaseGroups.map((group) => (
          <View key={group.eventId} style={styles.eventGroup}>
            {/* Event Header */}
            {/* Header cliquable pour expand/collapse */}
            {/* Header cliquable pour expand/collapse */}
            <TouchableOpacity style={styles.eventHeaderTouchable} onPress={() => toggleExpand(group.eventId)} activeOpacity={0.8}>
              <View style={styles.eventHeaderContent}>
                {/* Zone cliquable (icône + nom) pour naviguer vers l'événement */}
                <TouchableOpacity
                  style={styles.eventTouchableArea} // Appliquer le style ici
                  onPress={() => navigation.navigate('EventDetail', { eventId: group.eventId })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.eventIconContainer, { backgroundColor: group.eventColor }]}>
                    <Text style={styles.eventEmoji}>{group.eventEmoji}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{group.eventName}</Text>
                    {/* Optionally show subtitle if needed */}
                  </View>
                </TouchableOpacity>
                {/* Fin de la zone cliquable pour navigation */}

                {/* Partie droite (date + chevron) */}
                <View style={styles.eventRight}>
                   <View style={styles.dateBadge}>
                     <Text style={styles.dateText}>{group.eventDate}</Text>
                   </View>
                   <Ionicons
                      name={group.isExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
                      size={22}
                      color="#BDBDBD"
                      style={styles.chevronIcon}
                   />
                </View>
              </View>
            </TouchableOpacity>

            {/* Purchase Items (conditionally rendered) */}
            {group.isExpanded && group.items.map((item) => (
              <View key={item.id} style={styles.purchaseItem}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>{item.details}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                    {item.goldReward > 0 && (
                      <View style={styles.goldRewardBadge}>
                        <Image source={{ uri: 'https://api.a0.dev/assets/image?text=G&aspect=1:1&seed=gold_s' }} style={styles.smallGoldCoin} />
                        <Text style={styles.goldRewardText}>+{item.goldReward} golds</Text>
                      </View>
                    )}
                  </View>
                </View>
                 <Image source={{ uri: item.avatarUrl }} style={styles.itemAvatar} />
                <TouchableOpacity style={styles.buyButton}>
                  <Ionicons name="bag-handle-outline" size={16} color="white" style={{ marginRight: 4 }}/>
                  <Text style={styles.buyButtonText}>Acheter</Text>
                </TouchableOpacity>
              </View>
            ))}
             {group.isExpanded && group.items.length === 0 && (
                 <Text style={styles.noItemsText}>Aucun achat prévu pour cet événement.</Text>
             )}
          </View>
        ))}
        <View style={{ height: 40 }} /> {/* Spacer at the bottom */}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Light grey background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight || 10,
    paddingBottom: 15,
    backgroundColor: '#F8F8F8', // Match background
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  goldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  goldCoin: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  goldText: {
    flex: 1,
    fontSize: 14,
    color: '#A67C00',
  },
  goldAmount: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  eventGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden', // Clip items inside
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  eventHeaderTouchable: { // Style pour le TouchableOpacity global de l'en-tête
    // Pas de style spécifique nécessaire ici, utilise le padding du parent
  },
  eventHeaderContent: { // Conteneur pour aligner la zone cliquable et la partie droite
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  eventTouchableArea: { // Style pour la zone cliquable (icône + nom)
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Prend l'espace disponible à gauche
    marginRight: 10, // Espace avant la partie droite
  },
  // Supprimer la première définition dupliquée de eventIconContainer
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventEmoji: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBadge: {
    backgroundColor: '#E8F8E8', // Example color, match event item style
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#34C759', // Example color
    fontWeight: '500',
  },
  chevronIcon: {
    // marginLeft: 5,
  },
  purchaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  goldRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  smallGoldCoin: {
    width: 10,
    height: 10,
    marginRight: 3,
  },
  goldRewardText: {
    fontSize: 11,
    color: '#A67C00',
    fontWeight: '500',
  },
  itemAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 10,
  },
  buyButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  noItemsText: {
      padding: 15,
      textAlign: 'center',
      color: '#999',
      fontSize: 14,
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
  }
});

export default OngoingPurchasesScreen;