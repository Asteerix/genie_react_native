import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
  StyleProp,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { hp } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

// Types d'animation disponibles
export type AnimationType = 
  | 'fadeIn' 
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight'
  | 'zoomIn' 
  | 'zoomOut'
  | 'none';

interface AnimatedPageProps extends ViewProps {
  /**
   * Type d'animation à l'entrée
   * @default 'fadeIn'
   */
  enterAnimation?: AnimationType;
  
  /**
   * Type d'animation à la sortie
   * @default 'fadeOut'
   */
  exitAnimation?: AnimationType;
  
  /**
   * Durée de l'animation en ms
   * @default 300
   */
  duration?: number;
  
  /**
   * Délai avant de démarrer l'animation
   * @default 0
   */
  delay?: number;
  
  /**
   * Style du conteneur
   */
  containerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Désactiver toutes les animations
   * @default false
   */
  disableAnimations?: boolean;
  
  /**
   * Fonction appelée une fois l'animation d'entrée terminée
   */
  onAnimationComplete?: () => void;

  /**
   * Easing de l'animation (fonction de timing)
   * @default Easing.out(Easing.cubic)
   */
  easing?: typeof Easing.linear;

  /**
   * Activer le parallaxe sur le scroll
   * @default false
   */
  enableParallax?: boolean;
  
  /**
   * Force du parallaxe (0-1)
   * @default 0.3
   */
  parallaxStrength?: number;
}

/**
 * AnimatedPage - Composant de conteneur avec animations
 * 
 * Wrapper pour ajouter des animations aux écrans et conteneurs principaux
 */
const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  enterAnimation = 'fadeIn',
  exitAnimation = 'fadeIn', // La même animation est appliquée à l'inverse pour la sortie par défaut
  duration = 300,
  delay = 0,
  containerStyle,
  disableAnimations = false,
  onAnimationComplete,
  easing = Easing.out(Easing.cubic),
  enableParallax = false,
  parallaxStrength = 0.3,
  ...props
}) => {
  // Valeurs d'animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const translateX = useRef(new Animated.Value(width)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const parallaxY = useRef(new Animated.Value(0)).current;
  
  // Configuration des animations d'entrée
  useEffect(() => {
    if (disableAnimations) {
      opacity.setValue(1);
      translateY.setValue(0);
      translateX.setValue(0);
      scale.setValue(1);
      if (onAnimationComplete) onAnimationComplete();
      return;
    }
    
    // Configuration des valeurs initiales selon le type d'animation
    switch (enterAnimation) {
      case 'fadeIn':
        opacity.setValue(0);
        break;
      case 'slideUp':
        translateY.setValue(hp(50));
        opacity.setValue(0);
        break;
      case 'slideDown':
        translateY.setValue(-hp(50));
        opacity.setValue(0);
        break;
      case 'slideLeft':
        translateX.setValue(width);
        opacity.setValue(0);
        break;
      case 'slideRight':
        translateX.setValue(-width);
        opacity.setValue(0);
        break;
      case 'zoomIn':
        scale.setValue(0.8);
        opacity.setValue(0);
        break;
      case 'zoomOut':
        scale.setValue(1.2);
        opacity.setValue(0);
        break;
      case 'none':
        opacity.setValue(1);
        translateY.setValue(0);
        translateX.setValue(0);
        scale.setValue(1);
        break;
    }
    
    // Création des animations selon le type
    const animations = [];
    
    // Animation de base d'opacité pour toutes les transitions (sauf 'none')
    if (enterAnimation !== 'none') {
      animations.push(
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
          easing,
        })
      );
    }
    
    // Animations spécifiques selon le type
    switch (enterAnimation) {
      case 'slideUp':
      case 'slideDown':
        animations.push(
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
            easing,
          })
        );
        break;
      case 'slideLeft':
      case 'slideRight':
        animations.push(
          Animated.timing(translateX, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
            easing,
          })
        );
        break;
      case 'zoomIn':
      case 'zoomOut':
        animations.push(
          Animated.timing(scale, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
            easing,
          })
        );
        break;
    }
    
    // Lancement de l'animation
    if (animations.length > 0) {
      Animated.parallel(animations).start(({ finished }) => {
        if (finished && onAnimationComplete) {
          onAnimationComplete();
        }
      });
    } else if (onAnimationComplete) {
      onAnimationComplete();
    }
  }, [
    enterAnimation, 
    duration, 
    delay, 
    disableAnimations, 
    opacity, 
    translateY, 
    translateX, 
    scale, 
    easing, 
    onAnimationComplete
  ]);
  
  // Construction du style transformé selon les animations
  const getAnimatedStyle = () => {
    const animatedStyle: any = { opacity };
    
    switch (enterAnimation) {
      case 'slideUp':
      case 'slideDown':
        animatedStyle.transform = [
          { translateY },
          { perspective: 1000 } // Ajoute de la profondeur sur iOS
        ];
        break;
      case 'slideLeft':
      case 'slideRight':
        animatedStyle.transform = [
          { translateX },
          { perspective: 1000 } // Ajoute de la profondeur sur iOS
        ];
        break;
      case 'zoomIn':
      case 'zoomOut':
        animatedStyle.transform = [
          { scale },
          { perspective: 1000 } // Ajoute de la profondeur sur iOS
        ];
        break;
      default:
        animatedStyle.transform = [
          { translateY: 0 },
          { translateX: 0 },
          { scale: 1 },
          { perspective: 1000 } // Ajoute de la profondeur sur iOS
        ];
        break;
    }
    
    // Ajouter l'effet de parallaxe si activé
    if (enableParallax) {
      animatedStyle.transform.push({
        translateY: parallaxY.interpolate({
          inputRange: [-200, 200],
          outputRange: [parallaxStrength * 100, -parallaxStrength * 100],
          extrapolate: 'clamp',
        }),
      });
    }
    
    return animatedStyle;
  };
  
  // Rendu du composant
  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        getAnimatedStyle(),
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedPage;