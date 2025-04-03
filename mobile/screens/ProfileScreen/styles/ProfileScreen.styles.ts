import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // Ajusté pour correspondre au code original

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Ajusté pour correspondre au code original
  },
  // Styles pour la carte d'invitation à une wishlist (nouveau design)
  wishlistInvitationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  wishlistInvitationContent: {
    padding: 15,
  },
  wishlistInvitationLeft: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center', // Ajouté pour aligner verticalement
  },
  wishlistInvitationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  wishlistInvitationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  wishlistInvitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  wishlistInvitationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 5,
    color: '#000', // Ajouté pour correspondre au code original
  },
  wishlistInvitationUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistInvitationAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  wishlistInvitationText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    lineHeight: 20, // Ajouté pour correspondre au code original
  },
  wishlistInvitationName: {
    color: '#666', // Modifié pour correspondre au code original
  },
  wishlistInvitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8, // Ajouté pour correspondre au code original
  },
  wishlistInvitationDecline: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF1F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Modifié pour correspondre au code original (était 12)
  },
  wishlistInvitationAccept: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles pour les onglets (conservés car potentiellement réutilisés ou liés à l'animation)
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
    top: 0, // Modifié pour correspondre au code original (était 4)
    left: 0, // Modifié pour correspondre au code original (était 4)
    margin: 4, // Ajouté pour correspondre au code original
    width: (width / 2) - 40 - 8, // Calcul approximatif basé sur translateX et padding
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
  tabContent: {
    width: '100%',
  },
  // Styles pour les nouvelles fonctionnalités (invitations dans la bottom sheet)
  invitationCardContainer: {
    marginBottom: 15,
    paddingHorizontal: 5, // Ajouté pour correspondre au code original
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Modifié pour correspondre au code original (était 3)
  },
  invitationLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invitationTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  invitationContentRow: { // Semble inutilisé dans le JSX original, mais conservé
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  // Styles pour les cartes de wishlist en grille (conservés car potentiellement réutilisés)
  wishlistGridCard: {
    width: width * 0.44,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    marginHorizontal: '1%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  wishlistGridImageContainer: {
    position: 'relative',
    width: '100%',
    height: width * 0.44,
  },
  wishlistGridImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  wishlistGridTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
  },
  wishlistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  addWishlistContainer: { // Style pour la carte "Créer une liste" en grille
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Ajouté pour correspondre au code original
    aspectRatio: 1, // Ajouté pour correspondre au code original
    borderRadius: 16, // Ajouté pour correspondre au code original
    marginBottom: 15, // Ajouté pour correspondre au code original
    marginHorizontal: '1%', // Ajouté pour correspondre au code original
    overflow: 'hidden', // Ajouté pour correspondre au code original
    shadowColor: '#000', // Ajouté pour correspondre au code original
    shadowOffset: { width: 0, height: 2 }, // Ajouté pour correspondre au code original
    shadowOpacity: 0.1, // Ajouté pour correspondre au code original
    shadowRadius: 4, // Ajouté pour correspondre au code original
    elevation: 4, // Ajouté pour correspondre au code original
  },
  // Styles pour les cartes de wishlist en liste (conservés car potentiellement réutilisés)
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
  wishlistImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  favoriteTag: { // Style générique pour le tag favori (liste)
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
  // Styles pour les produits (utilisés par WishCard)
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  productCard: { // Renommé en wishCardStyle pour éviter confusion
    width: width * 0.44,
    height: width * 0.44, // Ajusté pour correspondre au code original
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    marginHorizontal: '1%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  productImageContainer: { // Renommé en wishCardImageContainer
    position: 'relative',
    height: '60%', // Ajusté pour correspondre au code original
    width: '100%',
  },
  productImage: { // Renommé en wishCardImage
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#f3f3f3',
  },
  wishFavoriteButton: { // Style pour le bouton favori sur la carte de vœu
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  favoriteActive: { // Style pour le tag favori actif (utilisé avec wishFavoriteButton)
    backgroundColor: '#FFD700', // Ou la couleur jaune du code original
  },
  deleteButton: { // Style pour le bouton supprimer sur la carte de vœu
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
  productInfo: { // Renommé en wishCardInfo
    padding: 10,
    paddingTop: 5, // Ajouté pour correspondre au code original
    height: '40%', // Ajusté pour correspondre au code original
    justifyContent: 'space-between',
  },
  productName: { // Renommé en wishCardName
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5, // Ajouté pour correspondre au code original
    height: 20, // Ajouté pour correspondre au code original
  },
  priceAndButtonContainer: { // Renommé en wishCardPriceContainer
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: { // Renommé en wishCardPrice
    fontSize: 16,
    fontWeight: 'bold',
  },
  productButton: { // Renommé en wishCardViewButton
    backgroundColor: '#000',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductCard: { // Style pour la carte "Ajouter un vœu" (conservé)
    width: '48%', // Ajusté pour correspondre au code original
    height: 230, // Ajusté pour correspondre au code original
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
  addProductIconContainer: { // Style pour l'icône "+" dans addProductCard
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles pour les états vides
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200, // Ajusté pour correspondre au code original
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: { // Style pour le bouton "Créer" (liste/vœu)
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: { // Style pour le bouton "Réessayer"
    backgroundColor: '#3366ff', // Couleur différente dans le code original
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: { // Texte pour createButton et retryButton
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour le Header (ProfileHeader)
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Modifié pour correspondre au code original (était space-between)
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // Ajusté pour correspondre au code original
    // paddingBottom: 10, // Supprimé car non présent dans l'original
  },
  settingsButton: {
    width: 32, // Ajouté pour correspondre au code original
    height: 32, // Ajouté pour correspondre au code original
    borderRadius: 16, // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
    justifyContent: 'center', // Ajouté pour correspondre au code original
    // backgroundColor: '#f0f0f0', // Supprimé car non présent dans l'original
  },
  // Styles pour les Avatars (ProfileHeader)
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Modifié pour correspondre au code original (était space-between)
    marginTop: -20, // Ajusté pour correspondre au code original
    paddingHorizontal: 20, // Ajouté pour correspondre au code original
    // marginBottom: 10, // Supprimé car non présent dans l'original
  },
  arrowButton: {
    width: 40, // Ajouté pour correspondre au code original
    height: 40, // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
    justifyContent: 'center', // Ajouté pour correspondre au code original
  },
  disabledArrow: {
    opacity: 0.5, // Ajouté pour correspondre au code original
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Ajouté pour correspondre au code original
    flex: 1, // Ajouté pour correspondre au code original
    // width: width - 120, // Supprimé car flex: 1 est utilisé
    // height: 100, // Supprimé car la hauteur est gérée par les items
  },
  profileItem: {
    alignItems: 'center',
    justifyContent: 'center', // Ajouté pour correspondre au code original
    height: 100, // Ajouté pour correspondre au code original
    width: 80, // Ajouté pour correspondre au code original
    // marginHorizontal: -15, // Supprimé car la gestion est différente
  },
  selectedProfileItem: {
    transform: [{ translateY: -15 }], // Ajouté pour correspondre au code original
    zIndex: 2, // Ajouté pour être au-dessus
  },
  leftProfileItem: {
    position: 'absolute', // Ajouté pour correspondre au code original
    left: 0, // Ajouté pour correspondre au code original
    zIndex: 1, // Ajouté pour correspondre au code original
  },
  rightProfileItem: {
    position: 'absolute', // Ajouté pour correspondre au code original
    right: 0, // Ajouté pour correspondre au code original
    zIndex: 1, // Ajouté pour correspondre au code original
  },
  profileAvatar: {
    borderWidth: 2, // Ajouté pour correspondre au code original
    borderColor: '#E0E0E0', // Ajouté pour correspondre au code original
  },
  selectedProfileAvatar: {
    width: 80, // Ajouté pour correspondre au code original
    height: 80, // Ajouté pour correspondre au code original
    borderRadius: 40, // Ajouté pour correspondre au code original
    borderWidth: 3, // Ajouté pour correspondre au code original
    borderColor: '#FF9A9A', // Ajouté pour correspondre au code original
  },
  unselectedProfileAvatar: {
    width: 55, // Ajouté pour correspondre au code original
    height: 55, // Ajouté pour correspondre au code original
    borderRadius: 27.5, // Ajouté pour correspondre au code original
    opacity: 0.7, // Ajouté pour l'effet de désélection
  },
  addProfileButton: {
    width: 55, // Ajouté pour correspondre au code original
    height: 55, // Ajouté pour correspondre au code original
    borderRadius: 27.5, // Ajouté pour correspondre au code original
    backgroundColor: '#F5F5F5', // Ajouté pour correspondre au code original
    justifyContent: 'center', // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
    borderWidth: 1, // Ajouté pour correspondre au code original
    borderColor: '#E0E0E0', // Ajouté pour correspondre au code original
  },
  // Styles pour Nom/Username (ProfileHeader)
  profileNameContainer: {
    alignItems: 'center',
    marginTop: -5, // Ajusté pour correspondre au code original
    // marginBottom: 10, // Supprimé car non présent dans l'original
  },
  profileName: {
    fontSize: 20, // Ajusté pour correspondre au code original
    fontWeight: 'bold',
    color: '#000', // Ajouté pour correspondre au code original
  },
  profileUsername: {
    fontSize: 14, // Ajusté pour correspondre au code original
    color: '#999', // Ajouté pour correspondre au code original
    marginTop: 3, // Ajouté pour correspondre au code original
  },
  // Styles pour la carte de compte (AccountCard)
  accountCardContainer: {
    backgroundColor: '#FFF9C4', // Couleur spécifique du code original
    marginHorizontal: 20,
    marginTop: 10, // Ajusté pour correspondre au code original
    padding: 15,
    paddingBottom: 10, // Ajouté pour correspondre au code original
    borderRadius: 20, // Ajouté pour correspondre au code original
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Ajusté pour correspondre au code original
    shadowOpacity: 0.1, // Ajusté pour correspondre au code original
    shadowRadius: 2, // Ajusté pour correspondre au code original
    elevation: 2, // Ajusté pour correspondre au code original
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'center', // Modifié pour correspondre au code original
    alignItems: 'center',
    marginBottom: 5, // Ajusté pour correspondre au code original
    position: 'relative', // Ajouté pour correspondre au code original
  },
  accountCardTitle: {
    fontSize: 14, // Ajouté pour correspondre au code original
    color: '#666', // Ajouté pour correspondre au code original
    textAlign: 'center', // Ajouté pour correspondre au code original
  },
  refreshButton: {
    position: 'absolute', // Ajouté pour correspondre au code original
    right: 0, // Ajouté pour correspondre au code original
  },
  accountCardBalance: {
    fontSize: 36, // Ajouté pour correspondre au code original
    fontWeight: 'bold',
    color: '#000', // Ajouté pour correspondre au code original
    textAlign: 'center', // Ajouté pour correspondre au code original
    marginBottom: 15, // Ajouté pour correspondre au code original
  },
  accountCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Modifié pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
    // marginTop: 10, // Supprimé car non présent dans l'original
  },
  accountCardActionButton: {
    alignItems: 'center',
    flex: 1, // Ajouté pour correspondre au code original
  },
  actionButtonCircle: {
    width: 45, // Ajouté pour correspondre au code original
    height: 45, // Ajouté pour correspondre au code original
    borderRadius: 22.5, // Ajouté pour correspondre au code original
    backgroundColor: '#000', // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
    justifyContent: 'center', // Ajouté pour correspondre au code original
    marginBottom: 5, // Ajouté pour correspondre au code original
  },
  transferButtonCircle: { // Style spécifique pour le bouton transférer
    backgroundColor: '#FFF', // Ajouté pour correspondre au code original
    borderWidth: 1, // Ajouté pour correspondre au code original
    borderColor: '#E0E0E0', // Ajouté pour correspondre au code original
  },
  detailsButtonCircle: { // Style spécifique pour le bouton détails (compte géré)
    backgroundColor: '#FFF', // Ajouté pour correspondre au code original
    borderWidth: 1, // Ajouté pour correspondre au code original
    borderColor: '#E0E0E0',
  },
  transactionsButtonCircle: { // Style pour le nouveau bouton Transactions
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  goldButtonCircle: { // Style spécifique pour le bouton "g" (compte perso)
    backgroundColor: '#FFD700', // Ajouté pour correspondre au code original
    borderWidth: 1, // Ajouté pour correspondre au code original
    borderColor: '#E0E0E0', // Ajouté pour correspondre au code original
  },
  goldButtonText: { // Texte pour le bouton "g"
    fontSize: 18, // Ajouté pour correspondre au code original
    fontWeight: 'bold', // Ajouté pour correspondre au code original
    color: '#333', // Ajouté pour correspondre au code original
  },
  actionButtonText: {
    fontSize: 12, // Ajouté pour correspondre au code original
    color: '#333', // Ajouté pour correspondre au code original
    marginTop: 2, // Ajouté pour correspondre au code original
  },
  // Styles pour l'écran d'ajout de compte (quand profil '+' est sélectionné)
  addAccountContainer: {
    marginHorizontal: 20,
    marginTop: 20, // Ajusté pour correspondre au code original
    padding: 20,
    backgroundColor: '#F5F5F5', // Ajouté pour correspondre au code original
    borderRadius: 20, // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
  },
  addAccountTitle: {
    fontSize: 20, // Ajouté pour correspondre au code original
    fontWeight: 'bold', // Ajouté pour correspondre au code original
    marginBottom: 10, // Ajouté pour correspondre au code original
  },
  addAccountDescription: {
    fontSize: 14, // Ajouté pour correspondre au code original
    color: '#666', // Ajouté pour correspondre au code original
    textAlign: 'center', // Ajouté pour correspondre au code original
    marginBottom: 20, // Ajouté pour correspondre au code original
  },
  addAccountButton: {
    backgroundColor: '#4285F4', // Couleur spécifique du code original
    paddingHorizontal: 20, // Ajouté pour correspondre au code original
    paddingVertical: 10, // Ajouté pour correspondre au code original
    borderRadius: 20, // Ajouté pour correspondre au code original
  },
  addAccountButtonText: {
    color: 'white', // Ajouté pour correspondre au code original
    fontWeight: 'bold', // Ajouté pour correspondre au code original
  },
  // Styles pour la bottom sheet (ProfileBottomSheetContent)
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 50, // Ajusté pour laisser de la place à la BottomTabBar
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 5, // Assure qu'elle est au-dessus du contenu principal mais sous la TabBar
  },
  bottomSheetHandle: {
    height: 40, // Ajusté pour correspondre au code original
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1, // Ajouté pour correspondre au code original
    borderBottomColor: '#F0F0F0', // Ajouté pour correspondre au code original
    paddingVertical: 8, // Ajouté pour correspondre au code original
    width: '100%', // Ajouté pour correspondre au code original
    // backgroundColor: '#f9f9f9', // Supprimé car non présent dans l'original
  },
  handleIcon: {
    // Pas de style spécifique dans l'original
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20, // Ajusté pour correspondre au code original
    paddingTop: 10, // Ajouté pour correspondre au code original
  },
  bottomSheetTitle: { // Style pour un titre potentiel dans la bottom sheet
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  bottomSheetOption: { // Style pour une option potentielle dans la bottom sheet
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bottomSheetOptionText: { // Texte pour une option potentielle
    fontSize: 16,
    marginLeft: 15,
  },
  // Styles pour la BottomTabBar
  bottomTabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Doit être au-dessus de la BottomSheet
    backgroundColor: 'white', // Ajouté pour éviter la transparence
  },
  // Styles pour la carte d'invitation (version 2, potentiellement obsolète mais conservée)
  invitationCard2: {
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 25,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  invitationHeader: {
    padding: 12,
  },
  invitationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  // invitationTitle: { // Déjà défini plus haut
  //   fontSize: 20,
  //   fontWeight: '600',
  //   marginRight: 5,
  //   color: '#000',
  // },
  invitationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  // invitationImage: { // Déjà défini plus haut
  //   width: 70,
  //   height: 70,
  //   borderRadius: 8,
  //   marginRight: 12,
  // },
  inviterContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  // invitationText: { // Déjà défini plus haut
  //   fontSize: 15,
  //   color: '#333',
  //   flex: 1,
  //   lineHeight: 20,
  // },
  // inviterName: { // Déjà défini plus haut
  //   color: '#666',
  // },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8, // Ajusté pour correspondre au code original
  },
  actionButton: { // Style générique pour les boutons d'action (accepter/refuser)
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  declineButton: {
    backgroundColor: '#FFF1F0',
  },
  acceptButton: {
    backgroundColor: '#E8F5E9',
  },
  // Styles pour les sections dans la BottomSheet (ProfileBottomSheetContent)
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 5, // Ajusté pour correspondre au code original
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10, // Ajouté pour correspondre au code original
  },
  sectionTitle: {
    fontSize: 28, // Taille spécifique du code original
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: -0.5, // Ajouté pour correspondre au code original
  },
  sectionHeaderActions: { // Conteneur pour les actions du header de section
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: { // Bouton d'action dans le header de section (ex: '+')
    marginLeft: 10, // Espace avant le bouton "voir tout"
  },
  seeAllText: {
    fontSize: 16, // Ajusté pour correspondre au code original
    color: '#666',
    fontWeight: '500', // Ajouté pour correspondre au code original
  },
  // Styles pour les items de souhaits (WishCard dans ProfileBottomSheetContent)
  wishItemsContainer: { // Conteneur pour le scroll horizontal des vœux
    paddingRight: 15, // Ajusté pour correspondre au code original
    paddingLeft: 10, // Ajusté pour correspondre au code original
  },
  wishItem: { // Style pour un vœu individuel dans le scroll horizontal (potentiellement obsolète)
    width: 150,
    marginRight: 15,
  },
  wishItemImageContainer: { // Conteneur d'image pour wishItem (potentiellement obsolète)
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  wishItemImage: { // Image pour wishItem (potentiellement obsolète)
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteIconContainer: { // Conteneur pour l'icône favori (potentiellement obsolète)
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700', // Couleur spécifique du code original
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  wishItemName: { // Nom pour wishItem (potentiellement obsolète)
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  wishItemPrice: { // Prix pour wishItem (potentiellement obsolète)
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  // Styles pour les listes de souhaits (WishlistCard dans ProfileBottomSheetContent)
  wishListsContainer: { // Conteneur pour la grille de listes (potentiellement obsolète)
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  wishListItem: { // Style pour une liste individuelle dans la grille (potentiellement obsolète)
    width: '31%',
    marginBottom: 20,
  },
  addListContainer: { // Conteneur pour "Ajouter une liste" dans la grille (potentiellement obsolète)
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
  },
  wishListImageContainer: { // Conteneur d'image pour wishListItem (potentiellement obsolète)
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  wishListImage: { // Image pour wishListItem (potentiellement obsolète)
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishListName: { // Nom pour wishListItem (potentiellement obsolète)
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    color: '#333',
  },
  // Styles pour la carte de progression du profil (ProfileCompletionCard)
  profileCompletionCard: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15, // Ajusté pour correspondre au code original
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Ajusté pour correspondre au code original
    shadowOpacity: 0.1, // Ajusté pour correspondre au code original
    shadowRadius: 2, // Ajusté pour correspondre au code original
    elevation: 2, // Ajusté pour correspondre au code original
  },
  profileCompletionCardPink: {
    backgroundColor: '#FFEBEE', // Couleur spécifique du code original
  },
  profileCompletionCardYellow: {
    backgroundColor: '#FFFDE7', // Couleur spécifique du code original
  },
  profileCompletionCardGreen: {
    backgroundColor: '#E8F5E9', // Couleur spécifique du code original
  },
  profileCompletionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Ajouté pour correspondre au code original
  },
  profileCompletionTitle: {
    fontSize: 16, // Ajouté pour correspondre au code original
    fontWeight: '600', // Ajouté pour correspondre au code original
    color: '#333', // Ajouté pour correspondre au code original
  },
  progressBarContainer: {
    height: 8, // Ajouté pour correspondre au code original
    backgroundColor: '#E0E0E0', // Ajouté pour correspondre au code original
    borderRadius: 4, // Ajouté pour correspondre au code original
    marginBottom: 15, // Ajouté pour correspondre au code original
    overflow: 'hidden', // Ajouté pour correspondre au code original
  },
  progressBar: {
    height: '100%',
    borderRadius: 4, // Ajouté pour correspondre au code original
  },
  progressBarPink: {
    backgroundColor: '#F44336', // Couleur spécifique du code original
  },
  progressBarYellow: {
    backgroundColor: '#FFC107', // Couleur spécifique du code original
  },
  progressBarGreen: {
    backgroundColor: '#4CAF50', // Couleur spécifique du code original
  },
  completionStepsContainer: {
    marginBottom: 15, // Ajouté pour correspondre au code original
  },
  completionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Ajouté pour correspondre au code original
  },
  stepIconContainer: {
    width: 24, // Ajouté pour correspondre au code original
    height: 24, // Ajouté pour correspondre au code original
    justifyContent: 'center', // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
    marginRight: 10, // Ajouté pour correspondre au code original
  },
  emptyCircle: {
    width: 22, // Ajouté pour correspondre au code original
    height: 22, // Ajouté pour correspondre au code original
    borderRadius: 11, // Ajouté pour correspondre au code original
    borderWidth: 1, // Ajouté pour correspondre au code original
    borderColor: '#999', // Ajouté pour correspondre au code original
  },
  stepText: {
    fontSize: 14, // Ajouté pour correspondre au code original
    color: '#333', // Ajouté pour correspondre au code original
    flex: 1, // Ajouté pour correspondre au code original
  },
  stepArrow: {
    marginLeft: 5, // Ajouté pour correspondre au code original
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Ajouté pour correspondre au code original
    paddingVertical: 8, // Ajouté pour correspondre au code original
    paddingHorizontal: 15, // Ajouté pour correspondre au code original
    alignSelf: 'flex-end', // Ajouté pour correspondre au code original
  },
  continueButtonText: {
    fontSize: 14, // Ajouté pour correspondre au code original
    fontWeight: 'bold', // Ajouté pour correspondre au code original
    color: '#333', // Ajouté pour correspondre au code original
    marginRight: 5, // Ajouté pour correspondre au code original
  },
  // Styles pour la section Mes transactions (TransactionsList)
  transactionsContainer: {
    marginHorizontal: 20,
    marginTop: 20, // Ajouté pour correspondre au code original
    marginBottom: 15, // Ajouté pour correspondre au code original
  },
  transactionIconContainer: { // Conteneur pour l'icône et le titre de la section
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionTitle: { // Titre de la section "Mes transactions"
    fontSize: 24, // Ajouté pour correspondre au code original
    fontWeight: 'bold', // Ajouté pour correspondre au code original
    marginLeft: 8, // Ajouté pour correspondre au code original
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, // Ajouté pour correspondre au code original
    borderBottomWidth: 0.5, // Ajouté pour correspondre au code original
    borderBottomColor: '#EEEEEE', // Ajouté pour correspondre au code original
  },
  transactionLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ajouté pour correspondre au code original
  },
  transactionAvatar: {
    width: 50, // Ajouté pour correspondre au code original
    height: 50, // Ajouté pour correspondre au code original
    borderRadius: 25, // Ajouté pour correspondre au code original
    marginRight: 15, // Ajouté pour correspondre au code original
  },
  transactionDetails: {
    flex: 1, // Ajouté pour correspondre au code original
  },
  transactionName: {
    fontSize: 16, // Ajouté pour correspondre au code original
    fontWeight: '600', // Ajouté pour correspondre au code original
    color: '#000', // Ajouté pour correspondre au code original
  },
  invitationRow: { // Ligne spécifique pour une transaction de type invitation
    flexDirection: 'row',
    alignItems: 'center',
  },
  invitationDateContainer: { // Conteneur pour la date d'invitation
    backgroundColor: '#E8F5E9', // Couleur spécifique du code original
    paddingHorizontal: 10, // Ajouté pour correspondre au code original
    paddingVertical: 3, // Ajouté pour correspondre au code original
    borderRadius: 15, // Ajouté pour correspondre au code original
    marginLeft: 10, // Ajouté pour correspondre au code original
  },
  invitationDate: { // Texte de la date d'invitation
    fontSize: 12, // Ajouté pour correspondre au code original
    color: '#333', // Ajouté pour correspondre au code original
  },
  transactionRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 18, // Ajouté pour correspondre au code original
    fontWeight: 'bold', // Ajouté pour correspondre au code original
    marginRight: 10, // Ajouté pour correspondre au code original
  },
  positiveAmount: {
    color: '#000', // Modifié pour correspondre au code original
  },
  negativeAmount: {
    color: '#666', // Modifié pour correspondre au code original
  },
  transactionArrow: {
    marginLeft: 5, // Ajouté pour correspondre au code original
  },
  // Styles pour l'avertissement de solde bas (ProfileBottomSheetContent)
  lowBalanceWarning: {
    backgroundColor: 'white', // Ajouté pour correspondre au code original
    borderRadius: 15, // Ajouté pour correspondre au code original
    padding: 15, // Ajouté pour correspondre au code original
    marginBottom: 20, // Ajouté pour correspondre au code original
    shadowColor: '#000', // Ajouté pour correspondre au code original
    shadowOffset: { width: 0, height: 1 }, // Ajouté pour correspondre au code original
    shadowOpacity: 0.1, // Ajouté pour correspondre au code original
    shadowRadius: 2, // Ajouté pour correspondre au code original
    elevation: 2, // Ajouté pour correspondre au code original
    borderWidth: 0.5, // Ajouté pour correspondre au code original
    borderColor: '#EEEEEE', // Ajouté pour correspondre au code original
  },
  lowBalanceWarningText: {
    fontSize: 18, // Ajouté pour correspondre au code original
    fontWeight: 'bold', // Ajouté pour correspondre au code original
    color: '#000', // Ajouté pour correspondre au code original
    marginBottom: 5, // Ajouté pour correspondre au code original
  },
  lowBalanceWarningSubtext: {
    fontSize: 14, // Ajouté pour correspondre au code original
    color: '#666', // Ajouté pour correspondre au code original
    marginBottom: 15, // Ajouté pour correspondre au code original
    lineHeight: 20, // Ajouté pour correspondre au code original
  },
  lowBalanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
  },
  laterButton: {
    paddingVertical: 10, // Ajouté pour correspondre au code original
    paddingHorizontal: 15, // Ajouté pour correspondre au code original
  },
  laterButtonText: {
    fontSize: 16, // Ajouté pour correspondre au code original
    color: '#333', // Ajouté pour correspondre au code original
    fontWeight: '500', // Ajouté pour correspondre au code original
  },
  addMoneyButton: {
    backgroundColor: 'black', // Ajouté pour correspondre au code original
    flexDirection: 'row', // Ajouté pour correspondre au code original
    alignItems: 'center', // Ajouté pour correspondre au code original
    paddingVertical: 12, // Ajouté pour correspondre au code original
    paddingHorizontal: 20, // Ajouté pour correspondre au code original
    borderRadius: 25, // Ajouté pour correspondre au code original
  },
  addMoneyButtonText: {
    color: 'white', // Ajouté pour correspondre au code original
    fontSize: 16, // Ajouté pour correspondre au code original
    fontWeight: '600', // Ajouté pour correspondre au code original
    marginLeft: 5, // Ajouté pour correspondre au code original
  },
  // Styles pour les items de vœux et listes (design horizontal carré - ProfileBottomSheetContent)
  horizontalScrollContainer: {
    paddingHorizontal: 15, // Marge à gauche de la première carte
    paddingVertical: 10,
  },
  // Style commun pour les cartes horizontales (vœux et listes)
  horizontalWishlistCard: {
    width: cardWidth, // Utiliser la largeur calculée
    marginRight: 15, // Espace entre les cartes
  },
  // Conteneur carré pour l'image ou l'icône '+'
  squareWishlistContainer: {
    width: cardWidth,
    height: cardWidth, // Carré
    borderRadius: 16, // Arrondi comme dans l'image
    backgroundColor: '#F5F5F5', // Fond gris clair pour '+' et comme fallback
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // Espace avant le titre
    overflow: 'hidden', // Pour que l'image respecte le border radius
    position: 'relative', // Pour le tag favori
    borderWidth: 0.5, // Légère bordure comme dans l'image
    borderColor: '#E0E0E0',
  },
  // Image pour les listes et les vœux
  squareWishlistImage: {
    width: '100%',
    height: '100%',
  },
  // Titre sous les cartes (listes et vœux)
  horizontalWishlistTitle: {
    fontSize: 14, // Taille comme dans l'image
    fontWeight: '500', // Moins gras que 'bold'
    textAlign: 'center',
    color: '#333', // Couleur sombre
    paddingHorizontal: 5, // Eviter que le texte long ne touche les bords
  },
   // Prix sous le nom du vœu
  horizontalWishPrice: {
    fontSize: 14, // Même taille que le titre
    fontWeight: '600', // Un peu plus gras pour le prix
    color: '#000', // Noir
    textAlign: 'center',
    marginTop: 2, // Petit espace après le nom
  },
  // Styles spécifiques au tag favori (utilisé par listes et vœux)
  wishlistFavoriteTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 223, 0, 0.9)', // Jaune avec transparence
    borderRadius: 12, // Modifié pour correspondre au code original (était 13)
    width: 24, // Modifié pour correspondre au code original (était 26)
    height: 24, // Modifié pour correspondre au code original (était 26)
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  // Style pour l'icône "+" dans la carte "Créer un vœu" (horizontal)
  addWishItemIconContainer: { // Potentiellement utilisé si on remet une carte dédiée "Créer un vœu"
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginTop: 50,
    alignSelf: 'center',
  },
});