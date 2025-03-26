import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

// Dimensions de l'écran
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dimensions de base utilisées pour le design (par exemple un iPhone 11 Pro en portrait)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Calcul des ratios pour les dimensions
const widthRatio = SCREEN_WIDTH / BASE_WIDTH;
const heightRatio = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Convertit une valeur de width du design en valeur responsive
 * @param width Largeur en px du design
 * @returns Largeur responsive adaptée à l'écran
 */
export const wp = (width: number): number => {
  // Arrondi au pixel le plus proche
  return Math.round(width * widthRatio);
};

/**
 * Convertit une valeur de height du design en valeur responsive
 * @param height Hauteur en px du design
 * @returns Hauteur responsive adaptée à l'écran
 */
export const hp = (height: number): number => {
  // Arrondi au pixel le plus proche
  return Math.round(height * heightRatio);
};

/**
 * Calcule une valeur responsive en fonction de la plus petite dimension (pour le scaling)
 * @param size Taille en px du design
 * @returns Taille responsive proportionnelle à l'écran
 */
export const sp = (size: number): number => {
  // Utiliser le plus petit ratio pour éviter les déformations
  const scaleFactor = Math.min(widthRatio, heightRatio);
  return Math.round(size * scaleFactor);
};

/**
 * Convertit une valeur de font size du design en valeur responsive
 * @param size Taille de police en px du design
 * @returns Taille de police responsive
 */
export const fs = (size: number): number => {
  // Utiliser le scale pour éviter les textes trop petits sur certains appareils
  const newSize = sp(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Pour Android, tenir compte de la densité de pixels
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Hauteur de la barre de statut
 */
export const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

/**
 * Largeur de l'écran
 */
export const SCREEN_W = SCREEN_WIDTH;

/**
 * Hauteur de l'écran
 */
export const SCREEN_H = SCREEN_HEIGHT;

/**
 * Hauteur de l'écran sans la barre de statut
 */
export const CONTENT_HEIGHT = SCREEN_HEIGHT - STATUS_BAR_HEIGHT;

/**
 * Détermine si l'appareil est en mode paysage
 */
export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

/**
 * Détecte si l'appareil est une tablette (basé sur la taille)
 */
export const isTablet = (): boolean => {
  // Une diagonale d'écran de 7" ou plus est généralement considérée comme tablette
  const { width, height } = Dimensions.get('window');
  const screenDiagonal = Math.sqrt(width * width + height * height) / PixelRatio.get();
  return screenDiagonal >= 7.0;
};

export default {
  wp,
  hp,
  sp,
  fs,
  SCREEN_W,
  SCREEN_H,
  CONTENT_HEIGHT,
  STATUS_BAR_HEIGHT,
  isLandscape,
  isTablet,
};