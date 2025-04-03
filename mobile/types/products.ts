import { WishItemType } from '../api/wishlists'; // Importer WishItemType

// Types related to products

export interface ProductItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  brand: string;
  category?: string; // Optional category
  url?: string;      // Optional URL
  isNew?: boolean;   // Optional flag for new products
  addedDate?: string; // Optional date added
}

export interface Inspiration {
  id: string;
  name: string;
  image: string;
  products?: ProductItem[]; // Optional list of products for this inspiration
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export interface Category {
  id: string;
  name: string;
}

// Type unifié pour les données d'un item (vœu ou produit scrapé)
// Utilisé pour la navigation vers ProductDetail et dans TransferWishModal
export type ItemDataType = WishItemType | (ProductItem & {
  // Ajoute les champs spécifiques de WishItemType qui pourraient manquer à ProductItem
  // ou utilise des alias si les noms diffèrent mais représentent la même chose.
  // Ici, on s'assure que les champs communs existent et on ajoute les optionnels.
  name?: string; // Ajouté pour compatibilité avec WishItemType (sera le 'title' de ProductItem)
  link?: string; // Ajouté pour compatibilité avec WishItemType (sera l''url' de ProductItem)
});