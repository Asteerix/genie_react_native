import api from '../services/api';

// Utility function for API retry logic
const withRetry = async <T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Log retry attempt if not the first one
      if (attempt > 1) {
        console.log(`Retry attempt ${attempt}/${maxRetries} for endpoint: ${endpoint}`);
      }
      
      // Execute the API call
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Log the error
      console.error(`API call failed (attempt ${attempt}/${maxRetries}) for ${endpoint}:`, error);
      
      // Don't retry for certain error types (like 400, 401, 403)
      if (error.response) {
        const status = error.response.status;
        if (status === 400 || status === 401 || status === 403 || status === 404) {
          console.log(`Not retrying API call due to ${status} status code`);
          throw error;
        }
      }
      
      // If this is the last retry, throw the error
      if (attempt === maxRetries) {
        console.log(`Maximum retries (${maxRetries}) reached for ${endpoint}`);
        throw error;
      }
      
      // Wait before the next retry with exponential backoff
      const backoffMs = delayMs * Math.pow(2, attempt - 1);
      console.log(`Waiting ${backoffMs}ms before next retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  
  // Should never reach here, but TypeScript needs this
  throw lastError;
};

// Types pour les données des wishlist
export type WishlistType = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  isFavorite: boolean;
  isOwner: boolean;
  sharedWith?: SharedWithType[];
  items?: WishItemType[];
  createdAt: string;
  updatedAt: string;
};

// Product type for real products from Amazon/other retailers
export type ProductType = {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  brand: string;
  rating?: {
    rate: number;
    count: number;
  };
  externalUrl?: string;
  keywords?: string[]; // Keywords for search and recommendation
  relatedProducts?: string[]; // IDs of related products
};

export type WishItemType = {
  id: string;
  wishlistId: string;
  userId: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  imageURL?: string; // Keep for backwards compatibility
  imageUrl?: string; // Add the property as it comes from the API
  link?: string;
  isFavorite: boolean;
  isReserved: boolean;
  reservedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type SharedWithType = {
  userId: string;
  permission: string;
  status: string;
  sharedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
};

// Types pour les requêtes

export type CreateWishlistRequest = {
  title: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
  isFavorite?: boolean;
};

export type UpdateWishlistRequest = {
  title?: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
  isFavorite?: boolean;
};

export type CreateWishItemRequest = {
  wishlistId: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  imageURL?: string;
  link?: string;
  isFavorite?: boolean;
};

export type UpdateWishItemRequest = {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageURL?: string;
  link?: string;
  isFavorite?: boolean;
};

export type ShareWishlistRequest = {
  userId: string;
  permission: string;
};

export type RespondToInvitationRequest = {
  accept: boolean;
};

export type ReserveWishItemRequest = {
  reserve: boolean;
};

// API Functions

// Products from external sources (FakeStore API)
export const getExternalProducts = async (category?: string, limit: number = 10): Promise<ProductType[]> => {
  return withRetry(async () => {
    console.log(`Fetching products from external API, category: ${category || 'all'}, limit: ${limit}`);
    
    // FakeStore API is free and doesn't require authentication
    let url = 'https://fakestoreapi.com/products';
    if (category && category !== 'all') {
      url = `https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`;
    }
    if (limit) {
      url += `?limit=${limit}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} products`);
    
    // Map known categories to actual brands
    const categoryToBrandMap: Record<string, string> = {
      'electronics': 'Samsung',
      'jewelery': 'Cartier',
      'men\'s clothing': 'Nike',
      'women\'s clothing': 'Zara'
    };
    
    // Transform the response to match our ProductType
    const products: ProductType[] = data.map((item: any) => {
      // Attempt to match a better brand name using our mapping
      const identifiedBrand = categoryToBrandMap[item.category] || item.category.split(' ')[0];
      
      // Choose a more appropriate Amazon link for the product type
      let externalUrl = `https://amazon.com/s?k=${encodeURIComponent(item.title)}`;
      if (item.category === 'electronics') {
        externalUrl = `https://amazon.com/s?k=${encodeURIComponent(item.title)}&i=electronics`;
      } else if (item.category === 'jewelery') {
        externalUrl = `https://amazon.com/s?k=${encodeURIComponent(item.title)}&i=jewelry`;
      } else if (item.category.includes('clothing')) {
        externalUrl = `https://amazon.com/s?k=${encodeURIComponent(item.title)}&i=fashion`;
      }
      
      return {
        id: item.id.toString(),
        title: item.title,
        description: item.description,
        price: item.price,
        image: item.image,
        category: item.category,
        brand: identifiedBrand,
        rating: item.rating,
        externalUrl: externalUrl
      };
    });
    
    return products;
  }, 'ExternalProductsAPI', 3, 1000);
};

// Wishlists
export const getUserWishlists = async (): Promise<WishlistType[]> => {
  return withRetry(async () => {
    console.log('Calling GET /api/wishlists endpoint to fetch wishlists...');
    const url = '/api/wishlists';
    console.log('Full URL used for fetching wishlists:', url);
    
    const response = await api.get<WishlistType[] | {wishlists: WishlistType[]}>(url);
    console.log('Successfully fetched user wishlists:', response.status);
    
    // Handle both possible response formats:
    // 1. Direct array of wishlists
    // 2. Object with wishlists property
    let wishlists: WishlistType[] = [];
    
    if (Array.isArray(response.data)) {
      // Backend returns array directly
      wishlists = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Backend returns object with wishlists property
      wishlists = response.data.wishlists || [];
    }
    
    console.log(`Parsed ${wishlists.length} wishlists from response`);
    return wishlists;
  }, '/api/wishlists', 3, 1000);
};

export const getWishlistById = async (id: string): Promise<WishlistType> => {
  return withRetry(async () => {
    const response = await api.get<WishlistType>(`/api/wishlists/${id}`);
    return response.data;
  }, `/api/wishlists/${id}`, 3, 1000);
};

export const createWishlist = async (data: CreateWishlistRequest): Promise<WishlistType> => {
  return withRetry(async () => {
    console.log('Creating wishlist with data:', JSON.stringify(data));
    const response = await api.post<WishlistType>('/api/wishlists', data);
    console.log('Wishlist created successfully:', response.status);
    return response.data;
  }, '/api/wishlists', 3, 1000);
};

export const updateWishlist = async (id: string, data: UpdateWishlistRequest): Promise<WishlistType> => {
  return withRetry(async () => {
    const response = await api.put<WishlistType>(`/api/wishlists/${id}`, data);
    return response.data;
  }, `/api/wishlists/${id}`, 3, 1000);
};

export const deleteWishlist = async (id: string): Promise<void> => {
  return withRetry(async () => {
    await api.delete(`/api/wishlists/${id}`);
  }, `/api/wishlists/${id}`, 3, 1000);
};

export const shareWishlist = async (id: string, data: ShareWishlistRequest): Promise<void> => {
  return withRetry(async () => {
    await api.post(`/api/wishlists/${id}/share`, data);
  }, `/api/wishlists/${id}/share`, 3, 1000);
};

export const getWishlistInvitations = async (): Promise<WishlistType[]> => {
  return withRetry(async () => {
    console.log('Fetching wishlist invitations from API...');
    const response = await api.get<WishlistType[] | {invitations: WishlistType[]}>('/api/wishlists/invitations');
    
    // Handle both possible response formats:
    // 1. Direct array of wishlists
    // 2. Object with invitations property
    let invitations: WishlistType[] = [];
    
    if (Array.isArray(response.data)) {
      // Backend returns array directly (this is the standard format based on wishlist_handler.go)
      invitations = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Backend returns object with invitations property
      invitations = (response.data as any).invitations || [];
    }
    
    console.log(`Fetched ${invitations.length} wishlist invitations successfully`);
    
    // Log a sample invitation for debugging if available
    if (invitations.length > 0) {
      console.log('Sample invitation:', JSON.stringify({
        id: invitations[0].id,
        title: invitations[0].title,
        userId: invitations[0].userId
      }, null, 2));
    }
    
    return invitations;
  }, '/api/wishlists/invitations', 3, 1000);
};

export const respondToInvitation = async (id: string, data: RespondToInvitationRequest): Promise<void> => {
  return withRetry(async () => {
    await api.post(`/api/wishlists/${id}/respond`, data);
  }, `/api/wishlists/${id}/respond`, 3, 1000);
};

export const removeSharing = async (wishlistId: string, userId: string): Promise<void> => {
  return withRetry(async () => {
    await api.delete(`/api/wishlists/${wishlistId}/share/${userId}`);
  }, `/api/wishlists/${wishlistId}/share/${userId}`, 3, 1000);
};

export const searchWishlists = async (query: string): Promise<WishlistType[]> => {
  return withRetry(async () => {
    const response = await api.get<WishlistType[]>(`/api/wishlists/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }, `/api/wishlists/search?q=${encodeURIComponent(query)}`, 3, 1000);
};

// Wish Items
export const getWishlistItems = async (wishlistId: string): Promise<WishItemType[]> => {
  return withRetry(async () => {
    console.log(`Fetching items for wishlist ${wishlistId}...`);
    const response = await api.get<WishItemType[] | {items: WishItemType[]}>(`/api/wishlists/${wishlistId}/items`);
    
    // Handle both possible response formats:
    // 1. Direct array of items
    // 2. Object with items property
    let items: WishItemType[] = [];
    
    if (Array.isArray(response.data)) {
      // Backend returns array directly
      items = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Backend returns object with items property
      items = response.data.items || [];
    }
    
    console.log(`Retrieved ${items.length} items for wishlist ${wishlistId}`);
    return items;
  }, `/api/wishlists/${wishlistId}/items`, 3, 1000);
};

export const getUserWishItems = async (): Promise<WishItemType[]> => {
  return withRetry(async () => {
    console.log('Fetching all user wish items from API...');
    
    // Be explicit about response type - backend returns array directly
    const response = await api.get<WishItemType[]>('/api/wishlists/items/all');
    
    // Get the data from the response
    const items = response.data;
    
    // Verify we have an array
    if (!Array.isArray(items)) {
      console.warn('Unexpected response format from API. Expected array but got:', typeof items);
      // If not array, try to handle different formats gracefully
      if (items && typeof items === 'object' && 'items' in items) {
        // Handle edge case where API might return {items: [...]}
        const itemsArray = (items as unknown as {items: WishItemType[]}).items;
        console.log(`Fetched ${itemsArray.length} wish items (from items property)`);
        return itemsArray || [];
      }
      // Return empty array if we can't parse the response
      console.error('Could not parse API response, returning empty array');
      return [];
    }
    
    console.log(`Fetched ${items.length} wish items successfully`);
    
    // Log a sample item for debugging if available
    if (items.length > 0) {
      console.log('Sample wish item:', JSON.stringify(items[0], null, 2));
    }
    
    return items;
  }, '/api/wishlists/items/all', 3, 1000);
};

export const getWishItem = async (itemId: string): Promise<WishItemType> => {
  return withRetry(async () => {
    const response = await api.get<WishItemType>(`/api/wishlists/items/${itemId}`);
    return response.data;
  }, `/api/wishlists/items/${itemId}`, 3, 1000);
};

export const createWishItem = async (data: CreateWishItemRequest): Promise<WishItemType> => {
  return withRetry(async () => {
    const response = await api.post<WishItemType>('/api/wishlists/items', data);
    return response.data;
  }, '/api/wishlists/items', 3, 1000);
};

export const updateWishItem = async (itemId: string, data: UpdateWishItemRequest): Promise<WishItemType> => {
  return withRetry(async () => {
    const response = await api.put<WishItemType>(`/api/wishlists/items/${itemId}`, data);
    return response.data;
  }, `/api/wishlists/items/${itemId}`, 3, 1000);
};

export const deleteWishItem = async (itemId: string): Promise<void> => {
  return withRetry(async () => {
    await api.delete(`/api/wishlists/items/${itemId}`);
  }, `/api/wishlists/items/${itemId}`, 3, 1000);
};

export const reserveWishItem = async (itemId: string, data: ReserveWishItemRequest): Promise<void> => {
  return withRetry(async () => {
    await api.post(`/api/wishlists/items/${itemId}/reserve`, data);
  }, `/api/wishlists/items/${itemId}/reserve`, 3, 1000);
};

export const searchWishItems = async (query: string): Promise<WishItemType[]> => {
  return withRetry(async () => {
    const response = await api.get<WishItemType[]>(`/api/wishlists/items/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }, `/api/wishlists/items/search?q=${encodeURIComponent(query)}`, 3, 1000);
};

// Transfer wish item to another wishlist by updating the wishlistId
export const transferWishItem = async (itemId: string, targetWishlistId: string): Promise<WishItemType> => {
  return withRetry(async () => {
    console.log(`Transferring wish item ${itemId} to wishlist ${targetWishlistId}...`);
    
    // First, get the current item to preserve its properties
    const currentItem = await getWishItem(itemId);
    
    if (!currentItem) {
      throw new Error(`Item with ID ${itemId} not found`);
    }
    
    // Update the item's wishlistId to move it to the target wishlist
    const response = await api.put<WishItemType>(`/api/wishlists/items/${itemId}`, {
      wishlistId: targetWishlistId
    });
    
    console.log('Wish item transferred successfully');
    return response.data;
  }, `/api/wishlists/items/${itemId}`, 3, 1000);
};

// Image Upload Functions
export const uploadWishlistCover = async (wishlistId: string, imageUri: string): Promise<string> => {
  return withRetry(async () => {
    console.log(`Uploading cover image for wishlist ${wishlistId}...`);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    
    // Extract filename and MIME type
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // Add file to form
    formData.append('image', {
      uri: imageUri,
      name: `wishlist-cover.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    
    // Send the request
    const response = await api.post<{url: string, message: string}>(
      `/api/wishlists/${wishlistId}/upload-cover`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Cover image uploaded successfully:', response.status);
    
    // Return the URL of the uploaded image
    return response.data.url;
  }, `/api/wishlists/${wishlistId}/upload-cover`, 3, 1000);
};

export const uploadWishItemImage = async (itemId: string, imageUri: string): Promise<string> => {
  return withRetry(async () => {
    console.log(`Uploading image for wish item ${itemId}...`);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    
    // Extract filename and MIME type
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // Add file to form
    formData.append('image', {
      uri: imageUri,
      name: `wish-item.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    
    // Send the request
    const response = await api.post<{url: string, message: string}>(
      `/api/wishlists/items/${itemId}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('Wish item image uploaded successfully:', response.status);
    
    // Return the URL of the uploaded image
    return response.data.url;
  }, `/api/wishlists/items/${itemId}/upload-image`, 3, 1000);
};