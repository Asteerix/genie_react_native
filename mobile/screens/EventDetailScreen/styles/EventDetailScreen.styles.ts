import { StyleSheet, Dimensions, Platform } from 'react-native';

const { height, width } = Dimensions.get('window');
const IS_IPHONE_X = Platform.OS === 'ios' && (height >= 812 || width >= 812);
const TAB_BAR_HEIGHT = 60 + (IS_IPHONE_X ? 34 : 0);

// Hauteurs de la bottom sheet (identiques à ProfileScreen)
export const MODAL_HEIGHTS = {
  SMALL: height * 0.2,  // 20% (état réduit)
  MEDIUM: height * 0.47, // 47% (état initial/moyen)
  FULL: height * 0.87   // 87% (état plein écran)
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Fond général léger
  },
  // --- Header ---
  headerPlaceholder: { // Espace pour le header fixe
    height: 180, // Hauteur approximative du header avec avatars
    backgroundColor: '#FFD1DC', // Couleur de fond rose pâle (à ajuster)
  },
  // --- ScrollView Principal ---
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent', // Le fond est géré par le container
  },
  scrollContent: {
    paddingBottom: MODAL_HEIGHTS.MEDIUM, // Espace pour la bottom sheet initiale (état MEDIUM)
  },
  // --- Bottom Sheet ---
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    overflow: 'hidden', // Important pour les coins arrondis
  },
  dragIndicator: { // Style pour l'indicateur de la poignée
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CCCCCC', // Gris clair
  },
  bottomSheetHandle: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  handleIcon: {
    // Style pour l'icône chevron si nécessaire
  },
  // --- Contenu de la Bottom Sheet ---
  bottomSheetScrollView: {
    flex: 1,
  },
  bottomSheetContentContainer: {
     paddingHorizontal: 15,
     paddingTop: 10,
     paddingBottom: TAB_BAR_HEIGHT + 20, // Espace pour la barre d'onglets et un peu plus
  },
   // --- Bouton Voeu Collaboratif ---
   collaborativeGiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0', // Gris clair
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collaborativeGiftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  collaborativeGiftTextContainer: {
    flex: 1,
  },
  collaborativeGiftText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  collaborativeGiftSubText: {
    fontSize: 13,
    color: '#666',
  },
  // --- Grille de Cadeaux ---
  giftItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  giftItemCard: {
    width: '48%', // Deux par ligne avec un petit espace
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  giftImageContainer: {
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    position: 'relative', // Pour le tag favori
  },
  giftImage: {
    width: '100%',
    height: '100%',
  },
  favoriteTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFD700', // Jaune pour favori
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  giftInfo: {
    padding: 10,
  },
  giftName: {
    fontSize: 15, // Légèrement plus petit
    fontWeight: '600', // Semi-bold
    color: '#333',
    marginBottom: 3,
  },
  giftPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  addGiftContainer: { // Style pour le bouton "+"
    aspectRatio: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
  },
  addGiftText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  // --- Barre de boutons inférieure ---
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0, // Attaché en bas de la bottom sheet
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: TAB_BAR_HEIGHT - 15, // Ajuster pour la barre d'onglets
    backgroundColor: 'white', // Fond blanc
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  selectButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
   // Styles pour la sélection
   selectionCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCircleSelected: {
    borderColor: '#007AFF', // Bleu pour sélectionné
    backgroundColor: '#007AFF',
  },
  selectionInnerCircle: {
    width: 12, // Plus petit cercle intérieur
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
});