import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // Ajouter useCallback
import {
  WishlistType,
  WishItemType,
  getUserWishlists,
  getWishlistById,
  getWishlistItems,
  getUserWishItems,
  createWishlist,
  createWishItem,
  updateWishlist,
  updateWishItem,
  deleteWishlist,
  deleteWishItem,
  getWishlistInvitations,
  respondToInvitation,
  shareWishlist,
  reserveWishItem,
  removeSharing,
  getWishItem, // Add the missing import
  transferWishItem, // Add transfer function import
  CreateWishlistRequest,
  UpdateWishlistRequest,
  CreateWishItemRequest,
  UpdateWishItemRequest,
  ReserveWishItemRequest
} from '../api/wishlists';
import { useAuth } from '../auth/context/AuthContext';
import { toast } from 'sonner-native';

interface WishlistContextType {
  wishlists: WishlistType[];
  wishItems: WishItemType[];
  invitations: WishlistType[];
  isLoading: boolean;
  error: string | null;
  refreshWishlists: () => Promise<boolean | undefined>;
  getWishlist: (id: string) => Promise<WishlistType>;
  addWishlist: (data: CreateWishlistRequest) => Promise<WishlistType>;
  editWishlist: (id: string, data: UpdateWishlistRequest) => Promise<WishlistType>;
  removeWishlist: (id: string) => Promise<void>;
  addWishItem: (data: CreateWishItemRequest) => Promise<WishItemType>;
  editWishItem: (itemId: string, data: UpdateWishItemRequest) => Promise<WishItemType>;
  removeWishItem: (itemId: string) => Promise<void>;
  reserveItem: (itemId: string, reserve: boolean) => Promise<void>;
  getItems: (wishlistId: string) => Promise<WishItemType[]>;
  getWishItem: (itemId: string) => Promise<WishItemType>;  // Added missing function
  shareWithUser: (wishlistId: string, userId: string, permission: string) => Promise<void>;
  removeUserSharing: (wishlistId: string, userId: string) => Promise<void>;
  respondToWishlistInvitation: (wishlistId: string, accept: boolean) => Promise<void>;
  refreshInvitations: () => Promise<void>;
  transferWish: (itemId: string, targetWishlistId: string) => Promise<WishItemType | null>; // Ajuster le type de retour
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [wishlists, setWishlists] = useState<WishlistType[]>([]);
  const [wishItems, setWishItems] = useState<WishItemType[]>([]);
  const [invitations, setInvitations] = useState<WishlistType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlists();
      refreshInvitations();
    }
  }, [isAuthenticated]);

  // Use a ref to prevent multiple simultaneous refresh calls
  const [refreshInProgress, setRefreshInProgress] = useState<boolean>(false);

  const refreshWishlists = useCallback(async () => {
    if (!isAuthenticated) return;

    // Prevent multiple simultaneous refresh calls
    if (refreshInProgress) {
      console.log('WishlistContext - Refresh already in progress, skipping');
      return;
    }

    setRefreshInProgress(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log('WishlistContext - Fetching wishlists and items from API...');

      // Fetch wishlists and items simultaneously
      const [wishlistsData, itemsData] = await Promise.all([
        getUserWishlists(),
        getUserWishItems()
      ]);

      // Debug logs to see what we got from the API
      console.log('WishlistContext - API Response Details:');
      console.log(`WishlistContext - Wishlists response type: ${Array.isArray(wishlistsData) ? 'array' : typeof wishlistsData}`);
      console.log(`WishlistContext - Wish items response type: ${Array.isArray(itemsData) ? 'array' : typeof itemsData}`);
      console.log(`WishlistContext - Received ${wishlistsData.length} wishlists and ${itemsData.length} items from API`);

      // Update state with the data
      setWishlists(wishlistsData);
      setWishItems(itemsData);
      return true;
    } catch (err: any) {
      // Utiliser toast pour l'erreur et définir un message plus générique pour l'état d'erreur interne
      const apiErrorMessage = (err as any).response?.data?.error || (err as Error).message || 'Erreur inconnue';
      toast.error(`Erreur chargement: ${apiErrorMessage}`);
      setError('Impossible de charger les données des wishlists.'); // Message pour l'état interne
      console.error('Error fetching wishlists:', err);
      console.error('Error details:', err.response ? {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data
      } : 'No response details available');
      return false;
    } finally {
      setIsLoading(false);
      setRefreshInProgress(false);
    }
  }, [isAuthenticated]); // Retirer refreshInProgress des dépendances

  const refreshInvitations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const invitationsData = await getWishlistInvitations();
      setInvitations(invitationsData);
    } catch (err) {
      console.error('Error fetching wishlist invitations', err);
      // Optionnel: setError ou toast ici aussi si nécessaire
    }
  }, [isAuthenticated]); // Ajouter la dépendance

  const getWishlist = async (id: string) => {
    try {
      const wishlist = await getWishlistById(id);
      return wishlist;
    } catch (err) {
      console.error(`Error fetching wishlist ${id}`, err);
      throw err;
    }
  };

  const getItems = async (wishlistId: string) => {
    try {
      const items = await getWishlistItems(wishlistId);
      return items;
    } catch (err) {
      console.error(`Error fetching items for wishlist ${wishlistId}`, err);
      throw err;
    }
  };

  const addWishlist = async (data: CreateWishlistRequest) => {
    try {
      const newWishlist = await createWishlist(data);
      setWishlists(prev => [...prev, newWishlist]);
      toast.success('Liste de souhaits créée avec succès');
      return newWishlist;
    } catch (err) {
      toast.error('Erreur lors de la création de la liste de souhaits');
      console.error('Error creating wishlist', err);
      throw err;
    }
  };

  const editWishlist = async (id: string, data: UpdateWishlistRequest) => {
    try {
      const updatedWishlist = await updateWishlist(id, data);
      setWishlists(prev => prev.map(w => w.id === id ? updatedWishlist : w));
      toast.success('Liste de souhaits mise à jour avec succès');
      return updatedWishlist;
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de la liste de souhaits');
      console.error(`Error updating wishlist ${id}`, err);
      throw err;
    }
  };

  const removeWishlist = async (id: string) => {
    try {
      await deleteWishlist(id);
      setWishlists(prev => prev.filter(w => w.id !== id));
      toast.success('Liste de souhaits supprimée avec succès');
    } catch (err) {
      toast.error('Erreur lors de la suppression de la liste de souhaits');
      console.error(`Error deleting wishlist ${id}`, err);
      throw err;
    }
  };

  const addWishItem = async (data: CreateWishItemRequest) => {
    try {
      const newItem = await createWishItem(data);
      setWishItems(prev => [...prev, newItem]);
      toast.success('Vœu ajouté avec succès');
      return newItem;
    } catch (err) {
      toast.error('Erreur lors de l\'ajout du vœu');
      console.error('Error creating wish item', err);
      throw err;
    }
  };

  const editWishItem = async (itemId: string, data: UpdateWishItemRequest) => {
    try {
      const updatedItem = await updateWishItem(itemId, data);
      setWishItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      toast.success('Vœu mis à jour avec succès');
      return updatedItem;
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du vœu');
      console.error(`Error updating wish item ${itemId}`, err);
      throw err;
    }
  };

  const removeWishItem = async (itemId: string) => {
    try {
      await deleteWishItem(itemId);
      setWishItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Vœu supprimé avec succès');
    } catch (err) {
      toast.error('Erreur lors de la suppression du vœu');
      console.error(`Error deleting wish item ${itemId}`, err);
      throw err;
    }
  };

  const reserveItem = async (itemId: string, reserve: boolean) => {
    try {
      const request: ReserveWishItemRequest = { reserve };
      await reserveWishItem(itemId, request);
      setWishItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return { ...item, isReserved: reserve };
        }
        return item;
      }));
      toast.success(reserve ? 'Vœu réservé avec succès' : 'Réservation annulée avec succès');
    } catch (err) {
      toast.error(reserve ? 'Erreur lors de la réservation' : 'Erreur lors de l\'annulation de la réservation');
      console.error(`Error reserving wish item ${itemId}`, err);
      throw err;
    }
  };

  const shareWithUser = async (wishlistId: string, userId: string, permission: string) => {
    try {
      await shareWishlist(wishlistId, { userId, permission });
      toast.success('Liste de souhaits partagée avec succès');
    } catch (err) {
      toast.error('Erreur lors du partage de la liste de souhaits');
      console.error(`Error sharing wishlist ${wishlistId}`, err);
      throw err;
    }
  };

  const removeUserSharing = async (wishlistId: string, userId: string) => {
    try {
      await removeSharing(wishlistId, userId);
      toast.success('Partage supprimé avec succès');
    } catch (err) {
      toast.error('Erreur lors de la suppression du partage');
      console.error(`Error removing sharing for wishlist ${wishlistId}`, err);
      throw err;
    }
  };

  const respondToWishlistInvitation = async (wishlistId: string, accept: boolean) => {
    try {
      await respondToInvitation(wishlistId, { accept });
      // Mettre à jour les invitations localement
      setInvitations(prev => prev.filter(inv => inv.id !== wishlistId));
      
      if (accept) {
        // Rafraîchir les wishlists si l'invitation est acceptée
        refreshWishlists();
        toast.success('Invitation acceptée avec succès');
      } else {
        toast.success('Invitation refusée');
      }
    } catch (err) {
      toast.error('Erreur lors de la réponse à l\'invitation');
      console.error(`Error responding to invitation for wishlist ${wishlistId}`, err);
      throw err;
    }
  };

  // Implement getWishItem function to fetch a specific wish item by ID
  const getWishItemById = async (itemId: string): Promise<WishItemType> => {
    try {
      console.log(`WishlistContext - Fetching wish item with ID ${itemId}`);
      // Use the imported function from api/wishlists.ts
      return await getWishItem(itemId);
    } catch (err) {
      console.error(`Error fetching wish item ${itemId}`, err);
      toast.error('Erreur lors de la récupération du souhait');
      throw err;
    }
  };

// Helper function to check if a string is a valid MongoDB ObjectID
const isValidObjectId = (id: string): boolean => {
	return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Transfer an EXISTING wish item to another wishlist
  const transferWish = async (itemId: string, targetWishlistId: string): Promise<WishItemType> => {
	console.log(`WishlistContext - Transferring wish item ${itemId} to wishlist ${targetWishlistId}`);

	// Ensure the itemId is a valid ObjectID before calling the API
	if (!isValidObjectId(itemId)) {
		const errorMsg = `Invalid ObjectID format for transfer: ${itemId}`;
		console.error(errorMsg);
		toast.error("Erreur: Impossible de transférer cet élément (ID invalide).");
		throw new Error(errorMsg);
	}

	try {
	  const transferredItem = await transferWishItem(itemId, targetWishlistId);

	  // Update local state to reflect the transfer
	  setWishItems(prev => prev.map(item =>
		item.id === itemId ? { ...item, wishlistId: targetWishlistId } : item
	  ));

	  toast.success('Vœu transféré avec succès');
	  return transferredItem;
	} catch (err) {
	  console.error(`Error transferring wish item ${itemId}`, err);
	  toast.error('Erreur lors du transfert du vœu');
	  throw err; // Re-throw error for the caller to handle
	}
  };

  const value = {
	wishlists,
	wishItems,
	invitations,
	isLoading,
	error,
	refreshWishlists,
	getWishlist,
	addWishlist,
	editWishlist,
	removeWishlist,
	addWishItem, // This should be used directly to add scraped products
	editWishItem,
	removeWishItem,
	reserveItem,
	getItems,
	getWishItem: getWishItemById,
	shareWithUser,
	removeUserSharing,
	respondToWishlistInvitation,
	refreshInvitations,
	transferWish // Keep for transferring existing wishes
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};