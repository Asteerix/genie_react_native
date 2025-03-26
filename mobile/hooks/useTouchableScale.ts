import { useRef, useCallback } from 'react';
import { Animated, GestureResponderEvent, Easing } from 'react-native';

interface UseTouchableScaleParams {
  /**
   * Valeur minimale du scale (entre 0 et 1)
   * @default 0.95
   */
  minScale?: number;
  
  /**
   * Durée de l'animation en ms
   * @default 150
   */
  duration?: number;
  
  /**
   * Si le composant est désactivé
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Callback appelé lors du pressIn
   */
  onPressIn?: (event: GestureResponderEvent) => void;
  
  /**
   * Callback appelé lors du pressOut
   */
  onPressOut?: (event: GestureResponderEvent) => void;
  
  /**
   * Easing à utiliser pour l'animation
   * @default Easing.bezier(0.25, 0.46, 0.45, 0.94)
   */
  easing?: typeof Easing.linear;
}

/**
 * Hook pour gérer l'animation de scale sur les éléments touchables
 * 
 * Fournit une animation de réduction d'échelle au toucher pour donner
 * un retour visuel à l'utilisateur lors des interactions
 */
export const useTouchableScale = ({
  minScale = 0.95,
  duration = 150,
  disabled = false,
  onPressIn,
  onPressOut,
  easing = Easing.bezier(0.25, 0.46, 0.45, 0.94), // Easing.out(Easing.quad)
}: UseTouchableScaleParams = {}) => {
  // Value d'animation de scale, initialisée à 1 (taille normale)
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Animation de pressIn (réduction)
  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) {
        // Annuler toute animation en cours
        scaleValue.stopAnimation();
        
        // Lancer l'animation de réduction
        Animated.timing(scaleValue, {
          toValue: minScale,
          duration: duration,
          easing,
          useNativeDriver: true,
        }).start();
      }
      
      // Appeler le callback personnalisé si fourni
      if (onPressIn) {
        onPressIn(event);
      }
    },
    [scaleValue, minScale, duration, disabled, onPressIn, easing]
  );
  
  // Animation de pressOut (retour à la taille normale)
  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) {
        // Annuler toute animation en cours
        scaleValue.stopAnimation();
        
        // Lancer l'animation de retour
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: duration,
          easing,
          useNativeDriver: true,
        }).start();
      }
      
      // Appeler le callback personnalisé si fourni
      if (onPressOut) {
        onPressOut(event);
      }
    },
    [scaleValue, duration, disabled, onPressOut, easing]
  );
  
  // Retourner les valeurs et fonctions nécessaires
  return {
    scaleValue,
    handlePressIn,
    handlePressOut,
  };
};

export default useTouchableScale;