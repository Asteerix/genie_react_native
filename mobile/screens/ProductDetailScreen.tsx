import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
  Share
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import TransferWishModal from '../components/TransferWishModal';
import { useWishlist } from '../context/WishlistContext';
import { WishItemType, CreateWishItemRequest } from '../api/wishlists';
import { ProductItem } from '../types/products'; // Importer ProductItem
import { toast } from 'sonner-native';
// Importer l'instance 'api' configurée au lieu d'axios directement
import api from '../services/api';
// API_BASE_URL n'est plus nécessaire ici si on utilise les chemins relatifs avec 'api'
// import { API_BASE_URL } from '../config';

// Types
type ProductDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

// Suppression du type local ScraperProduct, on utilisera ProductItem

// Type pour les articles
interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  url: string;
  productId: string;
  brandId: string;
}

// Constants
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const BUTTON_HEIGHT = 60;
const BUTTON_RADIUS = 30;
const FAVORITE_ICON_SIZE = 24;
const ACTION_ICON_SIZE = 28;
const CART_ICON_SIZE = 24;

// Extracted components for better organization and reusability
const HeaderButton = React.memo(({ onPress, iconName }: { onPress: () => void; iconName: any }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={styles.headerButton}
    accessibilityRole="button"
  >
    <Ionicons name={iconName} size={ACTION_ICON_SIZE} color="black" />
  </TouchableOpacity>
));

const ActionButton = React.memo(({ 
  onPress, 
  text, 
  icon = null,
  disabled = false
}: { 
  onPress: () => void; 
  text: string; 
  icon?: React.ReactNode | null;
  disabled?: boolean;
}) => (
  <TouchableOpacity 
    style={[styles.actionButton, disabled && styles.disabledButton]} 
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={text}
    accessibilityState={{ disabled }}
  >
    <Text style={[styles.buttonText, disabled && styles.disabledButtonText]}>{text}</Text>
    {icon}
  </TouchableOpacity>
));

const FavoriteButton = React.memo(({ isFavorite, onToggle, disabled = false }: { isFavorite: boolean; onToggle: () => void; disabled?: boolean }) => (
  <TouchableOpacity 
    onPress={onToggle} 
    style={styles.favoriteButton}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    accessibilityState={{ selected: isFavorite, disabled }}
  >
    <View style={[styles.favoriteIconContainer, disabled && styles.disabledFavoriteButton]}>
      <AntDesign name="star" size={FAVORITE_ICON_SIZE} color={isFavorite ? "black" : "#DDDDDD"} />
    </View>
  </TouchableOpacity>
));

// Helper function to check if a string is a valid MongoDB ObjectID
const isValidObjectId = (id: string): boolean => {
	// Simple regex check for 24 hex characters
	return /^[0-9a-fA-F]{24}$/.test(id);
  };


const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const { productId } = route.params;
  
  // Récupérer uniquement les fonctions nécessaires au niveau supérieur
  const { getWishItem, editWishItem, reserveItem } = useWishlist();
  
  // State management
  const [state, setState] = useState({
    product: null as WishItemType | ProductItem | null,
    articles: [] as Article[],
    isLoading: true,
    showTransferModal: false,
    error: null as string | null,
    isUpdating: false, // Ajouter la virgule manquante
  }); // Ajouter l'accolade et le point-virgule manquants

  // Extract state variables for cleaner code
  const { product, articles, isLoading, showTransferModal, error, isUpdating } = state;

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      // Vérifier d'abord si les données produit sont passées en paramètre
      const passedProductData = route.params.productData;

      if (passedProductData) {
        console.log("ProductDetailScreen: Utilisation des données produit passées en paramètres.");
        // Assurer la compatibilité de type (mapper si nécessaire)
        // Différencier ProductItem et WishItemType et créer un objet unifié pour l'état
        let productForState: WishItemType | ProductItem | null = null;

        if ('title' in passedProductData) { // C'est probablement un ProductItem
            const priceAsNumber = typeof passedProductData.price === 'number' ? passedProductData.price : 0;
             if (typeof passedProductData.price !== 'number') {
                 console.warn(`ProductDetailScreen: Received ProductItem with non-numeric price (${passedProductData.price}). Defaulting to 0.`);
             }
            productForState = {
                ...passedProductData, // Garde tous les champs de ProductItem
                price: priceAsNumber, // Assure que le prix est un nombre
                // Ajouter des valeurs par défaut si nécessaire
                description: passedProductData.description || '',
                currency: passedProductData.currency || '€',
                brand: passedProductData.brand || 'Inconnu',
            };
             console.log("ProductDetailScreen: Using passed ProductItem data.");

        } else if ('name' in passedProductData) { // C'est probablement un WishItemType
             const priceAsNumber = typeof passedProductData.price === 'number' ? passedProductData.price : 0;
             if (typeof passedProductData.price !== 'number') {
                 console.warn(`ProductDetailScreen: Received WishItemType with non-numeric price (${passedProductData.price}). Defaulting to 0.`);
             }
            // Créer un objet qui ressemble à ProductItem pour la cohérence de l'état local
            // mais c'est techniquement toujours un WishItemType pour les fonctions du contexte
             productForState = {
                ...passedProductData, // Garde tous les champs de WishItemType
                price: priceAsNumber, // Assure que le prix est un nombre
                // Ajouter des champs manquants de ProductItem avec des valeurs par défaut ou mappées
                title: passedProductData.name, // Mapper name vers title
                description: passedProductData.description || '',
                currency: passedProductData.currency || '€',
                imageUrl: passedProductData.imageURL || passedProductData.imageUrl || '', // Gérer les deux noms possibles
                brand: 'Inconnu', // WishItemType n'a pas de marque
                url: passedProductData.link, // Mapper link vers url
            };
             console.log("ProductDetailScreen: Using passed WishItemType data (mapped).");
        } else {
             console.error("ProductDetailScreen: Invalid productData structure passed.", passedProductData);
             // Gérer l'erreur, peut-être en continuant le fetch normal
             setState(prev => ({ ...prev, error: "Données produit invalides reçues." , isLoading: false}));
             return; // Sortir pour éviter de définir un produit invalide
        }

        // Mettre à jour l'état avec l'objet correctement formaté
        setState(prev => ({
          ...prev,
          product: productForState,
          articles: [], // Pas d'articles si on vient directement avec les données
          isLoading: false,
          error: null,
        }));
        return; // Sortir tôt, pas besoin de fetch
      }

      // Si productData n'est pas passé, continuer avec la logique de fetch
      console.log("ProductDetailScreen: Données produit non passées, fetch depuis l'API...");
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null })); // Reset error state

        let productDataResult: WishItemType | ProductItem | null = null; // Utiliser le type uni
        let articlesData: Article[] = [];

        // Vérifier si nous avons un chemin d'API spécifique (pour les marques, nouveautés ou inspirations)
        const apiPath = (route.params as any).apiPath;
        const isBrand = (route.params as any).isBrand;
        const isNewProduct = (route.params as any).isNewProduct;
        const isInspiration = (route.params as any).isInspiration;
        const brandName = (route.params as any).brandName;
        const inspirationName = (route.params as any).inspirationName;

        if (apiPath) {
          // --- Logique pour récupérer depuis l'API scraper (si apiPath est fourni) ---
          try {
            console.log(`Requête API scraper via instance: ${apiPath}`);
            const response = await api.get(apiPath);

            let targetProduct = null;
            if (response.data && Array.isArray(response.data)) {
              targetProduct = response.data.find(item => item.id === productId);
              if (!targetProduct && response.data.length > 0) {
                // Fallback: prendre le premier si l'ID exact n'est pas trouvé (moins idéal)
                // targetProduct = response.data[0];
                 console.warn(`Product with ID ${productId} not found directly in apiPath response. Trying to find by ID in the list.`);
              }
            }

            if (targetProduct) {
              const item = targetProduct;
              // Créer un objet ProductItem
              const productItemData: ProductItem = {
                id: item.id,
                title: item.title,
                description: item.description || '',
                price: typeof item.price === 'number' ? item.price : 0, // Assurer un nombre
                currency: item.currency || 'EUR',
                imageUrl: item.imageUrl || '',
                brand: item.brand || 'Inconnu',
                url: item.url,
              };
              productDataResult = productItemData; // Assigner le ProductItem

              // Articles ne sont plus récupérés
              articlesData = [];

            } else {
              console.error(`Aucun produit trouvé pour ID ${productId} via apiPath ${apiPath}`);
              throw new Error('Produit non trouvé via apiPath');
            }
          } catch (err) {
            console.error('Erreur lors de la récupération via apiPath:', err);
            throw new Error('Impossible de charger les détails du produit via apiPath');
          }
        } else {
          // --- Logique pour récupérer un WishItem existant (si pas d'apiPath et pas de productData) ---
          console.log(`ProductDetailScreen: Tentative de récupération du WishItem avec ID: ${productId}`);
          if (isValidObjectId(productId)) { // Vérifier si c'est un ObjectID valide
             productDataResult = await getWishItem(productId);
             // Les articles ne sont pas récupérés pour les WishItems existants ici
             articlesData = [];
          } else {
             console.error(`ProductDetailScreen: ID invalide (${productId}) fourni sans apiPath ni productData.`);
             throw new Error("ID de produit invalide fourni.");
          }
        }

        // Mettre à jour l'état final
        setState(prev => ({
          ...prev,
          product: productDataResult, // Utiliser le résultat du fetch (WishItemType ou ProductItem)
          articles: articlesData,
          isLoading: false
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: (err as Error).message || 'Impossible de charger les détails du produit', // Afficher un message d'erreur plus précis
          isLoading: false
        }));
        console.error('Error fetching product data:', err);

        // Ne pas essayer de remettre product à productToSet ici, car productToSet n'existe pas dans ce scope
        // L'état d'erreur est déjà défini ci-dessus
        return; // Sortir tôt, pas besoin de fetch
      }

      // Si productData n'est pas passé, continuer avec la logique de fetch
      console.log("ProductDetailScreen: Données produit non passées, fetch depuis l'API...");
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null })); // Reset error state

        let productDataResult: WishItemType | ProductItem | null = null; // Utiliser le type uni
        let articlesData: Article[] = [];

        // Vérifier si nous avons un chemin d'API spécifique (pour les marques, nouveautés ou inspirations)
        const apiPath = (route.params as any).apiPath;
        const isBrand = (route.params as any).isBrand;
        const isNewProduct = (route.params as any).isNewProduct;
        const isInspiration = (route.params as any).isInspiration;
        const brandName = (route.params as any).brandName;
        const inspirationName = (route.params as any).inspirationName;

        if (apiPath) {
          // --- Logique pour récupérer depuis l'API scraper (si apiPath est fourni) ---
          try {
            console.log(`Requête API scraper via instance: ${apiPath}`);
            const response = await api.get(apiPath);

            let targetProduct = null;
            if (response.data && Array.isArray(response.data)) {
              targetProduct = response.data.find(item => item.id === productId);
              if (!targetProduct && response.data.length > 0) {
                targetProduct = response.data[0];
              }
            }

            if (targetProduct) {
              const item = targetProduct;
              // Créer un objet ProductItem
              const productItemData: ProductItem = {
                id: item.id,
                title: item.title,
                description: item.description || '',
                price: item.price || 0,
                currency: item.currency || 'EUR',
                imageUrl: item.imageUrl || '',
                brand: item.brand || '',
                url: item.url,
              };
              productDataResult = productItemData; // Assigner le ProductItem

              // Construire et appeler l'API pour les articles
              let articlesApiPath = '';
              if (isBrand && !isNewProduct) {
                articlesApiPath = `/api/scraper/brands/${brandName}/products/${item.id}/articles`;
              } else if (isBrand && isNewProduct) {
                articlesApiPath = `/api/scraper/brands/${brandName}/new-products/${item.id}/articles`;
              } else if (isInspiration) {
                articlesApiPath = `/api/scraper/inspirations/${inspirationName}/products/${item.id}/articles`;
              }

              // L'appel API pour les articles a été supprimé car jugé inutile et causant des erreurs 404.
              // articlesData restera un tableau vide par défaut.
            } else {
              throw new Error('Aucun produit trouvé via apiPath');
            }
          } catch (err) {
            console.error('Erreur lors de la récupération via apiPath:', err);
            throw new Error('Impossible de charger les détails du produit via apiPath');
          }
        } else {
          // --- Logique pour récupérer un WishItem existant (si pas d'apiPath et pas de productData) ---
          console.log(`ProductDetailScreen: Tentative de récupération du WishItem avec ID: ${productId}`);
          if (isValidObjectId(productId)) { // Vérifier si c'est un ObjectID valide
             productDataResult = await getWishItem(productId);
             // Les articles ne sont pas récupérés pour les WishItems existants ici
          } else {
             console.error(`ProductDetailScreen: ID invalide (${productId}) fourni sans apiPath ni productData.`);
             throw new Error("ID de produit invalide fourni.");
          }
        }
        
        setState(prev => ({
          ...prev,
          product: productDataResult, // Utiliser le résultat du fetch (WishItemType ou ProductItem)
          articles: articlesData,
          isLoading: false
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: (err as Error).message || 'Impossible de charger les détails du produit', // Afficher un message d'erreur plus précis
          isLoading: false
        }));
        console.error('Error fetching product data:', err);
      }
    };

    fetchProductData();
  }, [productId, getWishItem, route.params]); // Garder les dépendances

  // Memoized event handlers to prevent unnecessary recreations
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Use a ref to track if wishlists refresh is already in progress
  const refreshingWishlists = useRef(false);
  const { refreshWishlists } = useWishlist();

  // Use a ref to track if transfer operation is in progress
  const transferInProgress = useRef(false);
  
  const handleTransfer = useCallback(() => {
    // Simply show the modal without triggering refresh cycles
    setState(prev => ({ ...prev, showTransferModal: true }));
  }, []);

  const handleCloseModal = useCallback(() => {
    // Close the modal first to prevent UI issues
    setState(prev => ({ ...prev, showTransferModal: false }));
  }, []);
  
  // Transfer success handler that will be passed to TransferWishModal
  const handleTransferSuccess = useCallback(() => {
    toast.success('Vœu transféré avec succès');
    
    // First close the modal
    setState(prev => ({ ...prev, showTransferModal: false }));
    
    // Then navigate back after a short delay to ensure modal is closed
    setTimeout(() => {
      navigation.goBack();
    }, 300);
  }, [navigation]);

  const handleModify = useCallback(() => {
    if (product) {
      navigation.navigate('EditWish', { wishId: product.id });
    }
  }, [navigation, product]);

  const toggleFavorite = useCallback(async () => {
    if (!product || isUpdating) return;

    // Vérifier si c'est un WishItemType avant de permettre l'action
    if (!('isFavorite' in product)) {
        toast.info("Vous ne pouvez ajouter que des vœux existants aux favoris.");
        return;
    }

    try {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      // Optimistic UI update
      setState(prevState => ({
        ...prevState,
        product: prevState.product ? {
          ...prevState.product,
          // Utiliser un type guard pour accéder à isFavorite
          isFavorite: product && 'isFavorite' in product ? !product.isFavorite : false
        } : null
      }));
      
      const updatedItem = await editWishItem(product.id, {
        // Utiliser un type guard
        isFavorite: product && 'isFavorite' in product ? !product.isFavorite : false
      });
      
      setState(prev => ({
        ...prev,
        product: updatedItem,
        isUpdating: false
      }));
      
      // Utiliser un type guard pour le message
      toast.success(('isFavorite' in updatedItem && updatedItem.isFavorite)
        ? 'Produit ajouté aux favoris' 
        : 'Produit retiré des favoris');
    } catch (err) {
      // Revert optimistic update
      setState(prevState => ({
        ...prevState,
        product: prevState.product ? {
          ...prevState.product,
          // Utiliser un type guard
          isFavorite: product && 'isFavorite' in product ? product.isFavorite : false
        } : null,
        isUpdating: false
      }));
      
      toast.error('Erreur lors de la mise à jour des favoris');
      console.error('Error toggling favorite:', err);
    }
  }, [product, editWishItem, isUpdating]);

  const handleReserve = useCallback(async () => {
    if (!product || isUpdating) return;

     // Vérifier si c'est un WishItemType avant de permettre l'action
     if (!('isReserved' in product)) {
        toast.info("Vous ne pouvez réserver que des vœux existants.");
        return;
    }
    
    try {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      // Optimistic UI update
      setState(prevState => ({
        ...prevState,
        product: prevState.product ? {
          ...prevState.product,
          // Utiliser un type guard
          isReserved: product && 'isReserved' in product ? !product.isReserved : false
        } : null
      }));
      
      // Utiliser un type guard
      await reserveItem(product.id, product && 'isReserved' in product ? !product.isReserved : true); // Si pas WishItem, on essaie de réserver (true)
      
      setState(prev => ({
        ...prev,
        isUpdating: false
      }));
      
      // Utiliser un type guard pour le message
      toast.success((product && 'isReserved' in product && product.isReserved)
        ? 'Réservation annulée' 
        : 'Produit réservé avec succès');
    } catch (err) {
      // Revert optimistic update
      setState(prevState => ({
        ...prevState,
        product: prevState.product ? {
          ...prevState.product,
          // Utiliser un type guard
          isReserved: product && 'isReserved' in product ? product.isReserved : false
        } : null,
        isUpdating: false
      }));
      
      toast.error('Erreur lors de la réservation');
      console.error('Error reserving product:', err);
    }
  }, [product, reserveItem, isUpdating]);

  const handleBuy = useCallback(() => {
    // Utiliser 'url' pour ProductItem, 'link' pour WishItemType
    // Utiliser 'url' pour ProductItem, 'link' pour WishItemType
    const buyLink = product && (('url' in product && product.url) ? product.url : (('link' in product && product.link) ? product.link : undefined));
    if (!buyLink) {
      toast.error('Aucun lien d\'achat disponible pour ce produit');
      return;
    }
    
    Linking.canOpenURL(buyLink).then(supported => {
      if (supported) {
        Linking.openURL(buyLink!); // Utiliser l'assertion non-null car buyLink est vérifié
      } else {
        toast.error('Impossible d\'ouvrir le lien');
      }
    }).catch(err => {
      console.error('Error opening URL:', err);
      toast.error('Erreur lors de l\'ouverture du lien');
    });
  }, [product]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    
    // Utiliser 'title' ou 'name'
    const productName = ('title' in product ? product.title : product.name) || 'ce produit';
    // Utiliser 'url' ou 'link'
    const productLink = product && (('url' in product && product.url) ? product.url : (('link' in product && product.link) ? product.link : undefined));

    try {
      // Construire les messages de partage avec les détails du produit
      const title = `Regarde mon vœu: ${productName}`;
      const message = `J'ai ajouté "${productName}" à ma liste de souhaits.\n${product.description || ''}\n${product.price ? `Prix: ${product.price} ${product.currency || '€'}` : ''}`;
      
      // URL fictive que nous remplacerons par une URL réelle pour visualiser ou collaborer
      const fallbackUrl = `https://wishes.app/view?wishId=${product.id}`;
      
      // Options pour le partage
      const shareOptions = {
        title: title,
        message: message,
        url: productLink || fallbackUrl,
      };
      
      // Afficher la feuille de partage native
      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        // Le partage a été effectué
        toast.success('Partage effectué avec succès');
        
        if (result.activityType) {
          // Partagé avec une activité spécifique
          console.log(`Partagé via: ${result.activityType}`);
        }
      } else if (result.action === Share.dismissedAction) {
        // Le partage a été annulé
        console.log('Partage annulé');
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      toast.error('Erreur lors du partage');
    }
  }, [product]);

  // Format price with currency
  const formattedPrice = useMemo(() => {
    // Vérifier explicitement que product et product.price sont valides et de type number
    if (!product || typeof product.price !== 'number' || isNaN(product.price)) {
        return 'Prix non disponible';
    }

    const currencySymbol = product.currency || '€';
    // Utiliser replace('.', ',') pour le format français
    return `${product.price.toFixed(2).replace('.', ',')} ${currencySymbol}`;
  }, [product]);

  // Memoized sections to prevent unnecessary re-renders
  const renderHeader = useMemo(() => (
    <View style={styles.header}>
      <HeaderButton onPress={handleClose} iconName="close" />
      <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
        {/* Utiliser 'title' ou 'name' */}
        {product ? (('title' in product && product.title) ? product.title : (('name' in product && product.name) ? product.name : 'Détail')) : 'Détail du produit'}
      </Text>
      <HeaderButton onPress={handleShare} iconName="share-outline" />
    </View>
  ), [handleClose, handleShare, product?.id]); // Utiliser product.id pour la dépendance

  const renderActionButtons = useMemo(() => (
    <View style={styles.actionButtons}>
      <ActionButton 
        onPress={handleModify} 
        text="Modifier" 
        // Désactiver Modifier si ce n'est pas un WishItem existant
        disabled={isUpdating || !product || !('wishlistId' in product) || product.wishlistId === 'scraper'}
      />
      <ActionButton 
        onPress={handleTransfer} 
        text="Transférer" 
        icon={<Ionicons name="arrow-forward" size={20} color="black" />} 
        disabled={isUpdating}
      />
    </View>
  ), [handleModify, handleTransfer, isUpdating, product]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>Chargement du produit...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={handleClose}>
          <Text style={styles.reloadButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If we have no product data after loading
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="orange" />
        <Text style={styles.errorText}>Produit non trouvé</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={handleClose}>
          <Text style={styles.reloadButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {renderHeader}
        
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.imageUrl || 'https://via.placeholder.com/400?text=No+Image' }}
              style={styles.productImage}
              resizeMethod="resize"
              fadeDuration={300}
            />
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>{formattedPrice}</Text>
            <Text style={styles.quantityText}>Quantité : 1</Text>
          </View>

          {renderActionButtons}

          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>Informations</Text>
              {/* Afficher le bouton favori seulement si c'est un WishItemType */}
              {product && 'isFavorite' in product && (
                <FavoriteButton
                  isFavorite={product.isFavorite}
                  onToggle={toggleFavorite}
                  disabled={isUpdating}
                />
              )}
            </View>
            
            <Text style={styles.infoText}>{product.description || 'Aucune description disponible'}</Text>
          </View>
          
          {/* Section Articles */}
          {articles.length > 0 && (
            <View style={styles.articlesSection}>
              <Text style={styles.articlesSectionTitle}>Articles</Text>
              {articles.map((article, index) => (
                <View key={article.id} style={styles.articleItem}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleDate}>
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.articleContent}>{article.content}</Text>
                  {index < articles.length - 1 && <View style={styles.articleDivider} />}
                </View>
              ))}
            </View>
          )}
          
          {/* Buy button - now inside the scroll view */}
          {/* Vérifier link ou url */}
          {/* Vérifier l'existence de url OU link avant d'afficher le bouton */}
          {product && (('url' in product && product.url) || ('link' in product && product.link)) && (
            <View style={styles.bottomButtonsContainer}>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={handleBuy}
                disabled={isUpdating}
                accessibilityRole="button"
                accessibilityLabel="Acheter"
              >
                <Ionicons name="cart-outline" size={CART_ICON_SIZE} color="white" />
                <Text style={styles.buyButtonText}>Acheter</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <TransferWishModal
          visible={showTransferModal}
          onClose={handleCloseModal}
          itemData={product} // Passer l'objet WishItemType | ProductItem | null
          onTransferSuccess={handleTransferSuccess}
        />
      </SafeAreaView>
    </View>
  );
};

// Optimized StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  // Content styles
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    padding: 20,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
  },
  reservedBadge: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: '#FF385C',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reservedText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // Price section
  priceSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productLink: {
    fontSize: 14,
    color: '#0066CC',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
  quantityText: {
    fontSize: 16,
    color: '#444',
    marginTop: 5,
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    gap: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  disabledButton: {
    borderColor: '#CCCCCC',
    backgroundColor: '#F5F5F5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  disabledButtonText: {
    color: '#999999',
  },
  // Info section
  infoSection: {
    paddingHorizontal: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disabledFavoriteButton: {
    backgroundColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  // Bottom buttons
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'black',
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  reserveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF385C',
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Articles section
  articlesSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  articlesSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  articleItem: {
    marginBottom: 15,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  articleDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  articleContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  articleDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
});

export default React.memo(ProductDetailScreen);
