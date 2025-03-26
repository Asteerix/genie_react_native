import React, { useRef } from 'react';
import {
  Pressable,
  PressableProps,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  GestureResponderEvent,
} from 'react-native';
import { useTouchableScale } from '../hooks/useTouchableScale';

interface PressableScaleProps extends PressableProps {
  /**
   * Valeur minimum du scale (entre 0 et 1)
   * @default 0.95
   */
  minScale?: number;
  
  /**
   * Durée de l'animation en ms
   * @default 150
   */
  duration?: number;
  
  /**
   * Style du conteneur
   */
  containerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Style appliqué pendant que le bouton est pressé
   */
  pressedStyle?: StyleProp<ViewStyle | TextStyle>;
  
  /**
   * Désactiver l'effet ripple sur Android
   * @default false
   */
  disableRipple?: boolean;
  
  /**
   * Activer l'effet shadow avec scale
   * @default false
   */
  scaleShadow?: boolean;
  
  /**
   * Activer l'animation de fade
   * @default false
   */
  fade?: boolean;
}

/**
 * PressableScale - Composant de bouton avec animation de scale
 * 
 * Fournit une expérience utilisateur tactile fluide avec un effet de scale
 * et diverses options de personnalisation.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  minScale = 0.95,
  duration = 150,
  style,
  containerStyle,
  pressedStyle,
  disableRipple = false,
  scaleShadow = false,
  fade = false,
  disabled = false,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const { scaleValue, handlePressIn, handlePressOut } = useTouchableScale({
    minScale,
    duration,
    disabled: disabled === true,
    onPressIn: onPressIn !== null ? onPressIn : undefined,
    onPressOut: onPressOut !== null ? onPressOut : undefined,
  });

  // Animation de shadow et d'opacité pour des effets plus riches
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Transformation de scale
  const scaleTransform = {
    transform: [{ scale: scaleValue }],
  };

  // Animation d'opacité pour l'effet fade
  const animatedOpacity = fade ? {
    opacity: opacityAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.7, 1],
    }),
  } : {};

  // Animation de shadow pour l'effet d'élévation
  const animatedShadow = scaleShadow ? {
    shadowOffset: {
      width: 0,
      height: shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 8],
      }),
    },
    shadowOpacity: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.3],
    }),
    shadowRadius: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [3, 12],
    }),
    elevation: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 8],
    }),
  } : {};

  // Gestion des animations combinées
  const handleCustomPressIn = (event: GestureResponderEvent) => {
    handlePressIn(event);
    if (scaleShadow) {
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();
    }
    if (fade) {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleCustomPressOut = (event: GestureResponderEvent) => {
    handlePressOut(event);
    if (scaleShadow) {
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();
    }
    if (fade) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();
    }
  };

  // Définir le style android par défaut
  const androidStyle = Platform.OS === 'android' && !disableRipple
    ? { overflow: 'hidden' as const }
    : {};

  return (
    <Animated.View 
      style={[
        styles.container,
        containerStyle,
        scaleTransform,
        animatedOpacity,
        animatedShadow,
      ]}
    >
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={handleCustomPressIn}
        onPressOut={handleCustomPressOut}
        style={({ pressed }) => [
          styles.button,
          androidStyle,
          typeof style === 'function' ? style({ pressed }) : style,
          pressed && pressedStyle,
        ]}
        android_ripple={disableRipple ? null : { color: 'rgba(0, 0, 0, 0.1)' }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PressableScale;