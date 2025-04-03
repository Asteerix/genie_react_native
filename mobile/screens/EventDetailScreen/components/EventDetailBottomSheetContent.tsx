import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList, Platform, ActivityIndicator } from 'react-native'; // Ajouter ActivityIndicator
import { Ionicons, Feather, AntDesign, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'; // Ajouter MaterialCommunityIcons
import { toast } from 'sonner-native';
import * as Clipboard from 'expo-clipboard';
import { Event, EventParticipant, EventGift, EventLocation } from '../../../api/events'; // EventGift contient maintenant les nouveaux champs
import { WishlistType, WishItemType } from '../../../api/wishlists';
import ProgressBar from '../../../components/ProgressBar'; // Chemin corrigé

// --- Types ---
interface ParticipantForHeader {
  id: string; name: string; username?: string; avatar: string;
}
interface GiftForSheet { // Mise à jour pour inclure les nouvelles propriétés
    id: string; name: string; price: string; image: string; isFavorite: boolean;
    addedBy?: { name: string; avatar: string; }; quantity?: number;
    isPinned?: boolean;
    isCollaborative?: boolean;
    currentAmount?: number;
    targetAmount?: number;
    isBought?: boolean;
    isReserved?: boolean;
}

interface EventDetailBottomSheetContentProps {
  eventDetails: Event;
  viewMode: 'gifts' | 'participants' | 'settings';
  participants: ParticipantForHeader[];
  gifts: GiftForSheet[];
  isCollective: boolean;
  isSelectionMode: boolean;
  selectedGifts: { [key: string]: boolean };
  selectedParticipant: ParticipantForHeader | null;
  // Ajouter les wishlists/wishes de l'utilisateur
  userWishlists: WishlistType[]; // Assurez-vous que WishlistType est importé ou défini
  userWishItems: WishItemType[]; // Assurez-vous que WishItemType est importé ou défini
  // Callbacks mis à jour/ajoutés
  onParticipantSelect: (participantId: string) => void;
  onGiftPress: (gift: GiftForSheet) => void; // Garder pour détail ? Ou utiliser les suivants ?
  onBuyGift: (giftId: string) => void;
  onParticipateGift: (giftId: string) => void;
  onPinGift: (giftId: string, pin: boolean) => void;
  onChooseCollaborativeWish: () => void;
  onToggleSelectionMode: () => void;
  onToggleGiftSelection: (giftId: string) => void;
  onDeleteSelectedGifts: () => void;
  onAddGift: () => void; // Ouvre maintenant la sélection wishlist/wish
  onAddManagedAccount: () => void; // Ouvre maintenant la sélection compte géré
  onInviteFriends: () => void;
  onShareEvent: () => void;
  onOptionsPress: () => void;
  onAddToCalendar: () => void;
  onViewAllInvites: () => void;
  onBackFromSettings: () => void;
}

// Importer les types manquants (à ajuster selon l'emplacement réel)
// import { WishlistType, WishItemType } from '../../../api/wishlists'; // Déjà importé plus haut

const EventDetailBottomSheetContent = forwardRef<ScrollView, EventDetailBottomSheetContentProps>(
  (props, ref) => {
    const {
      eventDetails, viewMode, participants, gifts, isCollective, isSelectionMode,
      selectedGifts, selectedParticipant, userWishlists, userWishItems, // Récupérer les nouvelles props
      onParticipantSelect, onGiftPress, onBuyGift, onParticipateGift, onPinGift, // Récupérer les nouveaux handlers
      onChooseCollaborativeWish, onToggleSelectionMode, onToggleGiftSelection, onDeleteSelectedGifts,
      onAddGift, onAddManagedAccount, onInviteFriends, onShareEvent,
      onOptionsPress, onAddToCalendar, onViewAllInvites, onBackFromSettings // Handlers existants
    } = props;

    const selectedCount = Object.values(selectedGifts).filter(Boolean).length;

    // --- Render Functions ---
    const renderParticipantItem = ({ item }: { item: ParticipantForHeader }) => (
        <TouchableOpacity key={item.id} style={styles.participantCard} activeOpacity={0.7} onPress={() => onParticipantSelect(item.id)}>
            <Image source={{ uri: item.avatar }} style={styles.participantCardAvatar} />
            <View style={styles.participantCardInfo}>
                <Text style={styles.participantCardName}>{item.name}</Text>
                {item.username ? <Text style={styles.participantCardUsername}>@{item.username}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={22} color="#CCCCCC" style={styles.participantCardChevron} />
        </TouchableOpacity>
    );

    const renderGiftItem = ({ item }: { item: GiftForSheet }) => {
        const isUnavailable = item.isBought || item.isReserved;
        const priceValue = parseFloat(item.price.replace(' €', '').replace(',', '.'));
        const showParticipateButton = !isNaN(priceValue) && priceValue > 40;

        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.giftItemCard, isUnavailable && styles.giftItemCardUnavailable]}
                activeOpacity={isSelectionMode || isUnavailable ? 1 : 0.7} // Moins d'opacité si sélection ou indisponible
                onPress={() => {
                    if (isSelectionMode) {
                        onToggleGiftSelection(item.id);
                    } else if (!isUnavailable) {
                        // Si non indisponible, on peut ouvrir le détail ou déclencher achat/participation
                        // Pour l'instant, gardons onGiftPress pour le détail
                        onGiftPress(item);
                    }
                }}
            >
                <View style={styles.giftImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.giftImage} />
                    {/* Badges et Overlays */}
                    {item.isPinned && !isSelectionMode && (
                        <View style={[styles.badgeTag, styles.pinnedTag]}>
                            <MaterialCommunityIcons name="pin" size={16} color="white" />
                        </View>
                    )}
                    {isUnavailable && !isSelectionMode && (
                        <View style={styles.unavailableOverlay}>
                            <Ionicons name="lock-closed" size={30} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.unavailableText}>{item.isBought ? 'Acheté' : 'Réservé'}</Text>
                        </View>
                    )}
                    {/* Cercle de sélection */}
                    {isSelectionMode && (
                        <View style={[styles.selectionCircle, selectedGifts[item.id] && styles.selectionCircleSelected]}>
                            {selectedGifts[item.id] && (<View style={styles.selectionInnerCircle} />)}
                        </View>
                    )}
                </View>
                <View style={styles.giftInfo}>
                    <Text style={styles.giftName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    {/* Affichage Prix ou Barre de progression */}
                    {item.isCollaborative && item.targetAmount && item.targetAmount > 0 ? (
                        <View style={styles.progressContainer}>
                            <ProgressBar // Utilisation de ProgressBar importé
                                progress={(item.currentAmount ?? 0) / (item.targetAmount || 1)} // Eviter division par 0 si targetAmount est 0 ou undefined
                                // Les props height, backgroundColor, barColor sont retirées car non supportées par le composant ProgressBar
                            />
                            <Text style={styles.progressText}>
                                {item.currentAmount?.toFixed(0) ?? '0'}€ / {item.targetAmount.toFixed(0)}€
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.giftPrice}>{item.price}</Text>
                    )}
                    {/* Bouton Acheter/Participer */}
                    {!isSelectionMode && !isUnavailable && (
                        <TouchableOpacity
                            style={[styles.actionButtonGift, showParticipateButton ? styles.participateButton : styles.buyButton]}
                            onPress={() => showParticipateButton ? onParticipateGift(item.id) : onBuyGift(item.id)}
                        >
                            <Feather name={showParticipateButton ? "gift" : "shopping-cart"} size={16} color="white" />
                            <Text style={styles.actionButtonGiftText}>{showParticipateButton ? 'Participer' : 'Acheter'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderAddGiftButton = () => (
       <TouchableOpacity style={styles.giftItemCard} activeOpacity={0.7} onPress={onAddGift}>
         <View style={styles.addGiftContainer}><Feather name="plus" size={40} color="#bbb" /><Text style={styles.addGiftText}>Ajouter</Text></View>
       </TouchableOpacity>
     );

    const renderParticipantsView = () => (
        <FlatList
          data={participants} renderItem={renderParticipantItem} keyExtractor={(item) => item.id}
          style={styles.participantsList} nestedScrollEnabled={true}
          ListFooterComponent={
            <TouchableOpacity style={styles.participantCard} activeOpacity={0.7} onPress={onAddManagedAccount}>
              <View style={styles.addAccountAvatarContainer}><Feather name="plus" size={28} color="#999" /></View>
              <View style={styles.participantCardInfo}><Text style={styles.participantCardName}>Ajouter un compte géré</Text><Text style={styles.participantCardUsername}>Gérez les voeux de quelqu'un d'autre</Text></View>
            </TouchableOpacity>
          }
          // Retirer la barre de boutons d'ici
        />
    );

    const renderGiftsView = () => (
        <>
            {/* Affichage de la Cagnotte (Commenté pour l'instant car eventDetails.pot n'existe pas) */}
            {/* {eventDetails.pot && (
                <View style={styles.potContainer}>
                     <View style={styles.potHeader}>
                        <Text style={styles.potTitle}>Cagnotte</Text>
                     </View>
                     <ProgressBar
                        progress={(eventDetails.pot.currentAmount ?? 0) / (eventDetails.pot.targetAmount ?? 1)}
                        height={12}
                        backgroundColor="#E0E0E0"
                        barColor="#FF9500"
                     />
                     <View style={styles.potAmounts}>
                        <Text style={styles.potCurrentAmount}>{eventDetails.pot.currentAmount?.toFixed(2) ?? '0.00'} €</Text>
                        <Text style={styles.potTargetAmount}>sur {eventDetails.pot.targetAmount?.toFixed(2) ?? 'N/A'} €</Text>
                     </View>
                     <TouchableOpacity style={[styles.actionButtonGift, styles.participateButton, styles.potParticipateButton]} onPress={() => onParticipateGift('pot')}>
                         <Feather name="plus" size={16} color="white" />
                         <Text style={styles.actionButtonGiftText}>Participer à la cagnotte</Text>
                     </TouchableOpacity>
                </View>
            )} */}

            {/* Bouton pour choisir le vœu collaboratif (épingler) */}
            <TouchableOpacity style={styles.collaborativeGiftButton} onPress={onChooseCollaborativeWish} activeOpacity={0.7}>
              <View style={styles.collaborativeGiftIcon}><MaterialCommunityIcons name="pin-outline" size={24} color="#007AFF" /></View>
              <View style={styles.collaborativeGiftTextContainer}><Text style={styles.collaborativeGiftText}>Choisir mon vœu prioritaire</Text><Text style={styles.collaborativeGiftSubText}>Mettre en avant un cadeau</Text></View>
              <AntDesign name="arrowright" size={24} color="#007AFF" />
            </TouchableOpacity>
            <FlatList
              data={[...gifts, { id: 'add' }]}
              renderItem={({ item }) => { if ('id' in item && item.id === 'add') { return renderAddGiftButton(); } return renderGiftItem({ item: item as GiftForSheet }); }}
              keyExtractor={(item) => item.id} numColumns={2} style={styles.giftItemsGridContainer} columnWrapperStyle={styles.giftItemsGridColumn}
              showsVerticalScrollIndicator={false} ListFooterComponent={<View style={{ height: 100 }} />} nestedScrollEnabled={true}
            />
            {/* Retirer la barre de boutons d'ici */}
        </>
    );

    const renderSettingsView = () => (
        <View style={styles.settingsContainer}>
            <TouchableOpacity style={styles.settingsButton} onPress={onAddToCalendar}>
                <Ionicons name="calendar-outline" size={22} color="#333" />
                <Text style={styles.settingsButtonText}>Ajouter l'événement à mon calendrier</Text>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={onViewAllInvites}>
                <Ionicons name="people-outline" size={22} color="#333" />
                <Text style={styles.settingsButtonText}>Voir tous les invités</Text>
                <View style={styles.inviteeAvatars}>
                    {participants.slice(0, 3).map((p, index) => (<Image key={index} source={{ uri: p.avatar }} style={styles.inviteeAvatar} />))}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
            {eventDetails.startDate && (
             <View style={styles.infoCard}>
               <View style={styles.infoCardHeader}><View style={styles.infoCardTitleContainer}><MaterialIcons name="date-range" size={20} color="black" /><Text style={styles.infoCardTitle}>Date</Text></View><TouchableOpacity onPress={() => Clipboard.setString(new Date(eventDetails.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))}><Text style={styles.copyText}>copier</Text></TouchableOpacity></View>
               <Text style={styles.infoText}>{new Date(eventDetails.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
               {!eventDetails.allDay && eventDetails.startDate && (<Text style={[styles.infoText, {marginTop: 5}]}>Heure : {new Date(eventDetails.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>)}
             </View>
           )}
           {eventDetails.location?.address && (
             <View style={styles.infoCard}>
               <View style={styles.infoCardHeader}><View style={styles.infoCardTitleContainer}><MaterialIcons name="location-on" size={20} color="black" /><Text style={styles.infoCardTitle}>Lieu</Text></View><TouchableOpacity onPress={() => Clipboard.setString(`${eventDetails.location?.address}, ${eventDetails.location?.city} ${eventDetails.location?.postalCode}`)}><Text style={styles.copyText}>copier</Text></TouchableOpacity></View>
               <Text style={styles.infoText}>{eventDetails.location.address}</Text>
               <Text style={styles.infoText}>{eventDetails.location.postalCode} {eventDetails.location.city}</Text>
             </View>
           )}
           {eventDetails.description && (
             <View style={styles.infoCard}>
               <View style={styles.infoCardHeader}><View style={styles.infoCardTitleContainer}><MaterialIcons name="description" size={20} color="black" /><Text style={styles.infoCardTitle}>Description</Text></View><TouchableOpacity onPress={() => Clipboard.setString(eventDetails.description ?? '')}><Text style={styles.copyText}>copier</Text></TouchableOpacity></View>
               <Text style={styles.infoText}>{eventDetails.description}</Text>
             </View>
           )}
           <View style={styles.infoCard}>
               <View style={styles.infoCardHeader}><View style={styles.infoCardTitleContainer}><Ionicons name="shield-checkmark-outline" size={20} color="black" /><Text style={styles.infoCardTitle}>Admin(s)</Text></View></View>
               {participants.filter(p => eventDetails.participants.find(ep => ep.userId === p.id && ep.role === 'admin')).map(admin => (
                   <View key={admin.id} style={styles.adminItem}><Image source={{ uri: admin.avatar }} style={styles.adminAvatar} /><View style={styles.adminInfo}><Text style={styles.adminName}>{admin.name}</Text>{admin.username && <Text style={styles.adminUsername}>@{admin.username}</Text>}</View></View>
               ))}
           </View>
           {/* Bouton Retour spécifique à la vue settings */}
           <TouchableOpacity style={styles.settingsBackButton} onPress={onBackFromSettings}>
                <Ionicons name="arrow-back" size={20} color="#666" />
                <Text style={styles.settingsBackButtonText}>Retour</Text>
           </TouchableOpacity>
        </View>
    );

    return (
      // Envelopper dans une View pour positionner la barre de boutons
      <View style={{ flex: 1 }}>
          <ScrollView
            ref={ref}
            style={styles.bottomSheetScrollView}
            contentContainerStyle={styles.bottomSheetContentContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Afficher le contenu basé sur viewMode */}
            {viewMode === 'participants' && renderParticipantsView()}
            {viewMode === 'gifts' && renderGiftsView()}
            {viewMode === 'settings' && renderSettingsView()}
          </ScrollView>

          {/* Barre de boutons toujours visible (sauf en mode settings) */}
          {viewMode !== 'settings' && (
              isSelectionMode ? (
                  <View style={styles.selectionBottomBar}>
                      <TouchableOpacity style={styles.selectionBackButton} onPress={onToggleSelectionMode}><Ionicons name="arrow-back" size={24} color="black" /></TouchableOpacity>
                      <View style={styles.selectionCountContainer}><Text style={styles.selectionCountText}>{selectedCount} {selectedCount === 1 ? 'Sélectionné' : 'Sélectionnés'}</Text></View>
                      <TouchableOpacity style={styles.deleteButton} onPress={onDeleteSelectedGifts} disabled={selectedCount === 0}><Ionicons name="trash-outline" size={24} color={selectedCount > 0 ? "#FF3B30" : "#CCC"} /></TouchableOpacity>
                  </View>
              ) : viewMode === 'participants' ? (
                  <View style={styles.actionButtonsBar}>
                      <TouchableOpacity style={styles.actionButton} onPress={onInviteFriends}><Feather name="users" size={20} color="#333" /><Text style={styles.actionButtonText}>Inviter des amis</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={onShareEvent}><Feather name="share-2" size={20} color="#333" /><Text style={styles.actionButtonText}>Partager</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.optionsButton} onPress={onOptionsPress}><Feather name="more-horizontal" size={20} color="#666" /></TouchableOpacity>
                  </View>
              ) : ( // viewMode === 'gifts'
                  <View style={styles.bottomButtonsContainer}>
                      <TouchableOpacity style={styles.selectButton} onPress={onToggleSelectionMode}><Text style={styles.selectButtonText}>Selectionner</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.optionsButton} onPress={onOptionsPress}><Feather name="more-horizontal" size={24} color="#666" /></TouchableOpacity>
                  </View>
              )
          )}
      </View>
    );
  }
);

// Styles
const styles = StyleSheet.create({
  bottomSheetScrollView: { flex: 1 },
  bottomSheetContentContainer: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 100 }, // Augmenter paddingBottom
  // --- Vues spécifiques ---
  settingsContainer: { paddingBottom: 30 },
  participantsList: { paddingTop: 10 },
  giftItemsGridContainer: { flex: 1 },
  giftItemsGridColumn: { justifyContent: 'space-between' },
  // --- Cartes & Items ---
  participantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  participantCardAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  participantCardInfo: { flex: 1 },
  participantCardName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  participantCardUsername: { fontSize: 14, color: '#888' },
  participantCardChevron: { marginLeft: 5 },
  addAccountAvatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  giftItemCard: { width: '48%', marginBottom: 15, borderRadius: 12, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, overflow: 'hidden' },
  giftItemCardUnavailable: { opacity: 0.6 }, // Style pour cadeau indisponible
  giftImageContainer: { aspectRatio: 1, backgroundColor: '#F5F5F5', position: 'relative' },
  giftImage: { width: '100%', height: '100%' },
  badgeTag: { position: 'absolute', top: 8, left: 8, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },
  pinnedTag: { backgroundColor: 'rgba(0,0,0,0.6)' }, // Badge épinglé
  unavailableOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  unavailableText: { color: 'white', marginTop: 5, fontWeight: 'bold', fontSize: 12 },
  giftInfo: { padding: 10, flexGrow: 1 }, // Ajout flexGrow
  giftName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 5 }, // Augmenter marge
  giftPrice: { fontSize: 14, color: '#666', fontWeight: '500', marginBottom: 8 }, // Augmenter marge
  progressContainer: { marginBottom: 8 },
  progressText: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 3 },
  actionButtonGift: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, marginTop: 'auto' }, // marginTop auto pour pousser en bas
  actionButtonGiftText: { color: 'white', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  buyButton: { backgroundColor: '#007AFF' }, // Bleu pour acheter
  participateButton: { backgroundColor: '#FF9500' }, // Orange pour participer
  addGiftContainer: { aspectRatio: 1, backgroundColor: '#F9F9F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', borderStyle: 'dashed' },
  addGiftText: { marginTop: 5, fontSize: 14, fontWeight: '500', color: '#999' },
  infoCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: '#F0F0F0' },
  infoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoCardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  infoCardTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  copyText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  infoText: { fontSize: 15, color: '#333', lineHeight: 22 },
  adminItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  adminAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#E0E0E0' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 15, fontWeight: '600' },
  adminUsername: { fontSize: 13, color: '#888' },
  // --- Cagnotte ---
  potContainer: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderWidth: 1, borderColor: '#F0F0F0' },
  potHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  potTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  potAmounts: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, marginBottom: 12 },
  potCurrentAmount: { fontSize: 16, fontWeight: 'bold', color: '#FF9500' },
  potTargetAmount: { fontSize: 14, color: '#888' },
  potParticipateButton: { marginTop: 5 }, // Style spécifique pour le bouton cagnotte
  // --- Boutons ---
  collaborativeGiftButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  collaborativeGiftIcon: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0, 122, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  collaborativeGiftTextContainer: { flex: 1 },
  collaborativeGiftText: { fontSize: 16, fontWeight: '600', color: '#333' },
  collaborativeGiftSubText: { fontSize: 13, color: '#666', marginTop: 2 },
  settingsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', paddingVertical: 18, paddingHorizontal: 15, borderRadius: 12, marginBottom: 10 },
  settingsButtonText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' },
  inviteeAvatars: { flexDirection: 'row', marginRight: 10 },
  inviteeAvatar: { width: 24, height: 24, borderRadius: 12, marginLeft: -8, borderWidth: 1, borderColor: 'white' },
  settingsBackButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 20, marginTop: 20, alignSelf: 'center' },
  settingsBackButtonText: { fontSize: 16, color: '#666', marginLeft: 8 },
  // --- Barres de boutons inférieures ---
  actionButtonsBar: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: 'rgba(255, 255, 255, 0.98)', paddingVertical: 10, paddingHorizontal: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 12, marginHorizontal: 5 },
  actionButtonText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8, color: '#333' },
  bottomButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: 'rgba(255, 255, 255, 0.98)', paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
  selectButton: { backgroundColor: '#F0F0F0', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  selectButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  optionsButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  selectionBottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: 'rgba(255, 255, 255, 0.98)', paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
  selectionBackButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  selectionCountContainer: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(0, 122, 255, 0.1)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginHorizontal: 10 },
  selectionCountText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  deleteButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#FFEEEE', justifyContent: 'center', alignItems: 'center' },
  // --- Sélection ---
  selectionCircle: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#999', backgroundColor: 'rgba(255, 255, 255, 0.7)', justifyContent: 'center', alignItems: 'center' },
  selectionCircleSelected: { borderColor: '#007AFF', backgroundColor: '#007AFF' },
  selectionInnerCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'white' },
});

export default EventDetailBottomSheetContent;