import React, { forwardRef } from 'react'; // Importer forwardRef
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions } from 'react-native'; // Importer Dimensions ici
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation'; // Chemin corrigé
import { styles } from '../styles/ProfileScreen.styles'; // Importer les styles
import { WishlistType, WishItemType } from '../../../api/wishlists'; // Ajuster le chemin, InvitationType remplacé par WishlistType

// Type pour le profil actif simplifié
interface ActiveProfile {
  balance: number;
  isPersonal: boolean; // Ajouté pour conditionner l'avertissement
}

// Type pour les données d'invitation (exemple statique)
interface WishlistInviteDataType {
  title: string;
  inviter: string;
}

interface ProfileBottomSheetContentProps {
  activeProfile: ActiveProfile;
  lowBalanceWarningDismissed: boolean;
  wishlistInviteData: WishlistInviteDataType; // Données pour la carte d'invitation statique
  invitations: WishlistType[]; // Utilisation de WishlistType pour les invitations
  wishlists: WishlistType[];
  wishItems: WishItemType[];
  isLoading: boolean; // Pour l'indicateur de chargement
  error: any; // Pour afficher l'erreur
  onDismissLowBalanceWarning: () => void;
  onAddMoney: () => void; // Action pour le bouton "Ajouter de l'argent"
  onAcceptStaticInvite: () => void; // Action pour accepter l'invitation statique
  onDeclineStaticInvite: () => void; // Action pour refuser l'invitation statique
  onAcceptInvitation: (wishlistId: string) => void;
  onRejectInvitation: (wishlistId: string) => void;
  onSeeAllWishes?: () => void; // Action "voir tout" pour les vœux
  onAddWish: () => void; // Action pour ajouter un vœu
  onWishPress: (itemId: string) => void; // Action au clic sur un vœu
  onSeeAllWishlists?: () => void; // Action "voir tout" pour les listes
  onCreateWishlist: () => void; // Action pour créer une liste
  onWishlistPress: (wishlistId: string) => void; // Action au clic sur une liste
  onRetryLoad: () => void; // Action pour réessayer le chargement en cas d'erreur
  onToggleFavoriteWish?: (item: WishItemType) => void; // Optionnel: Gérer favori
}

// Utiliser forwardRef pour pouvoir passer une ref au ScrollView interne
const ProfileBottomSheetContent = forwardRef<ScrollView, ProfileBottomSheetContentProps>(({
  activeProfile,
  lowBalanceWarningDismissed,
  wishlistInviteData,
  invitations,
  wishlists,
  wishItems,
  isLoading,
  error,
  onDismissLowBalanceWarning,
  onAddMoney,
  onAcceptStaticInvite,
  onDeclineStaticInvite,
  onAcceptInvitation,
  onRejectInvitation,
  onSeeAllWishes,
  onAddWish,
  onWishPress,
  onSeeAllWishlists,
  onCreateWishlist,
  onWishlistPress,
  onRetryLoad,
  onToggleFavoriteWish,
}, ref) => { // Ajouter ref comme deuxième argument
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Rendu d'une carte de vœu horizontale (utilisé dans la section "Mes vœux")
  const renderHorizontalWishCard = (item: WishItemType) => (
     <TouchableOpacity
       key={item.id}
       style={styles.horizontalWishlistCard} // Utilise le même style que les listes pour la cohérence
       onPress={() => onWishPress(item.id)}
     >
       <View style={styles.squareWishlistContainer}>
         <Image
           source={{ uri: item.imageUrl || item.imageURL || 'https://api.a0.dev/assets/image?text=product&aspect=1:1' }}
           style={styles.squareWishlistImage}
           resizeMode="cover"
         />
         {/* Bouton Favori optionnel */}
         {onToggleFavoriteWish && (
            <TouchableOpacity
              style={styles.wishlistFavoriteTag} // Utilise le style de tag favori unifié
              onPress={() => onToggleFavoriteWish(item)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} // Zone de clic plus grande
            >
               <AntDesign name={item.isFavorite ? "star" : "staro"} size={16} color={item.isFavorite ? "black" : "gray"} />
            </TouchableOpacity>
         )}
       </View>
       <Text style={styles.horizontalWishlistTitle} numberOfLines={1}>{item.name}</Text>
       {item.price && (
          <Text style={styles.horizontalWishPrice}>{item.price} {item.currency || '€'}</Text>
       )}
     </TouchableOpacity>
  );

  // Rendu d'une carte de liste de vœux horizontale
  const renderHorizontalWishlistCard = (wishlist: WishlistType) => (
    <TouchableOpacity
      style={styles.horizontalWishlistCard}
      key={wishlist.id}
      onPress={() => onWishlistPress(wishlist.id)}
      activeOpacity={0.8}
    >
      <View style={styles.squareWishlistContainer}>
        <Image
          source={{
            uri: wishlist.coverImage || 'https://api.a0.dev/assets/image?text=wishlist&aspect=1:1'
          }}
          style={styles.squareWishlistImage}
        />
        {wishlist.isFavorite && (
          <View style={styles.wishlistFavoriteTag}>
            <AntDesign name="star" size={16} color="black" />
          </View>
        )}
      </View>
      <Text style={styles.horizontalWishlistTitle}>{wishlist.title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      ref={ref} // Appliquer la ref transmise ici
      style={styles.bottomSheetContent} // Style du ScrollView interne
      showsVerticalScrollIndicator={false}
    >
      {/* Message d'avertissement pour solde bas - Utilisation du ternaire */}

      <View style={styles.wishlistInvitationCard}>
        <View style={styles.wishlistInvitationContent}>
          <View style={styles.wishlistInvitationLeft}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2946&q=80' }}
              style={styles.wishlistInvitationImage}
            />
            <View style={styles.wishlistInvitationInfo}>
              <View style={styles.wishlistInvitationHeader}>
                <Text style={styles.wishlistInvitationTitle}>{wishlistInviteData.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#000" />
              </View>
              <View style={styles.wishlistInvitationUser}>
                <Image
                  source={{ uri: 'https://ui-avatars.com/api/?name=AT&background=ff9a9a&color=fff&size=200' }}
                  style={styles.wishlistInvitationAvatar}
                />
                <Text style={styles.wishlistInvitationText}>
                  <Text style={styles.wishlistInvitationName}>{wishlistInviteData.inviter}</Text> vous invite sur une liste
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.wishlistInvitationActions}>
            <TouchableOpacity
              style={styles.wishlistInvitationDecline}
              onPress={onDeclineStaticInvite}
            >
              <Ionicons name="close" size={24} color="#FF3B30" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.wishlistInvitationAccept}
              onPress={onAcceptStaticInvite}
            >
              <Ionicons name="checkmark" size={24} color="#34C759" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Invitations dynamiques - Utilisation du ternaire */}
      {invitations.length > 0 ? (
        <View style={styles.sectionContainer}>
          {invitations.map(invitation => (
            <View style={styles.invitationCardContainer} key={invitation.id}>
              <View style={styles.invitationCard}>
                <View style={styles.invitationLeftContent}>
                  <Image
                    source={{ uri: invitation.coverImage || 'https://api.a0.dev/assets/image?text=wishlist&aspect=1:1' }}
                    style={styles.wishlistInvitationImage}
                  />
                  <View style={styles.invitationTextContainer}>
                    <Text style={styles.wishlistInvitationTitle}>{invitation.title} <Ionicons name="chevron-forward" size={16} color="#000" /></Text>
                    <View style={styles.inviterContainer}>
                      <Image
                        source={{ uri: (invitation as any).inviter?.avatar || 'https://ui-avatars.com/api/?name=?' }}
                        style={styles.inviterAvatar}
                      />
                      <Text style={styles.wishlistInvitationText}>
                        <Text style={styles.wishlistInvitationName}>{(invitation as any).inviter?.username || 'Quelqu\'un'}</Text> vous invite sur une liste
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.invitationActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => onRejectInvitation(invitation.id)}
                  >
                    <Ionicons name="close" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => onAcceptInvitation(invitation.id)}
                  >
                    <Ionicons name="checkmark" size={22} color="#34C759" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes vœux</Text>
          <View style={styles.sectionHeaderActions}>
             {onSeeAllWishes && wishItems.length > 0 && (
               <TouchableOpacity onPress={onSeeAllWishes}>
                 <Text style={styles.seeAllText}>voir tout</Text>
               </TouchableOpacity>
             )}
          </View>
        </View>
        {/* Indicateur de chargement pour les vœux - Utilisation du ternaire */}
        {isLoading && wishItems.length === 0 ? (
           <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
        ) : null}
        {/* Carrousel des vœux - Utilisation du ternaire */}
        {!isLoading && !error ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            <TouchableOpacity
              style={styles.horizontalWishlistCard}
              activeOpacity={0.7}
              onPress={onAddWish}
            >
              <View style={styles.squareWishlistContainer}>
                <Feather name="plus" size={40} color="#999" />
              </View>
              <Text style={styles.horizontalWishlistTitle}>Créer un vœu</Text>
            </TouchableOpacity>
            {/* Filtrer les wishItems pour n'afficher que ceux sans wishlistId */}
            {wishItems.filter(item => !item.wishlistId).map(renderHorizontalWishCard)}
          </ScrollView>
        ) : null}
         {/* Affichage de l'erreur pour les vœux - Utilisation du ternaire */}
         {/* Adapter l'affichage de l'erreur pour tenir compte du filtrage */}
         {!isLoading && error && wishItems.filter(item => !item.wishlistId).length === 0 ? (
           <View style={styles.emptyStateContainer}>
             <Text style={styles.emptyStateText}>Erreur de chargement des vœux</Text>
             <TouchableOpacity
               style={styles.retryButton}
               onPress={onRetryLoad}
             >
               <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
               <Text style={styles.createButtonText}>Réessayer</Text>
             </TouchableOpacity>
           </View>
         ) : null}
     </View>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes listes de vœux</Text>
          {onSeeAllWishlists && wishlists.length > 0 && ( // Affiche "voir tout" si fonction fournie et listes existent
            <TouchableOpacity onPress={onSeeAllWishlists}>
              <Text style={styles.seeAllText}>voir tout</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Indicateur de chargement pour les listes - Utilisation du ternaire */}
        {isLoading && wishlists.length === 0 ? (
           <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
        ) : null}
       {/* Carrousel des listes - Utilisation du ternaire */}
       {!isLoading && (wishlists.length > 0 || !error) ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContainer}
          >
            <TouchableOpacity
              style={styles.horizontalWishlistCard}
              activeOpacity={0.7}
              onPress={onCreateWishlist}
            >
              <View style={styles.squareWishlistContainer}>
                <Feather name="plus" size={40} color="#999" />
              </View>
              <Text style={styles.horizontalWishlistTitle}>Créer une liste</Text>
            </TouchableOpacity>
            {wishlists.map(renderHorizontalWishlistCard)}
          </ScrollView>
        ) : null}
         {!isLoading && error && wishlists.length === 0 && (
           <View style={styles.emptyStateContainer}>
             <Text style={styles.emptyStateText}>Erreur de chargement des listes</Text>
             <TouchableOpacity
               style={styles.retryButton}
               onPress={onRetryLoad}
             >
               <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
               <Text style={styles.createButtonText}>Réessayer</Text>
             </TouchableOpacity>
           </View>
         )}
      </View>
      {/* Espacement */}
      <View style={{ height: height * 0.1 }} />
    </ScrollView>
  );
}); // Ajouter la parenthèse fermante pour forwardRef

// Dimensions est maintenant importé en haut
const { height } = Dimensions.get('window');

export default ProfileBottomSheetContent; // L'export reste le même, car forwardRef enveloppe le composant