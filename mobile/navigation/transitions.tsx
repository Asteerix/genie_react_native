import React from 'react';
import { Dimensions, ViewStyle } from 'react-native';
import { StackCardInterpolationProps } from '@react-navigation/stack';
import Animated, {
  Easing,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Les différents types de transitions disponibles
export type TransitionType = 'horizontal' | 'vertical' | 'fade' | 'none';

// Récupération des dimensions de l'écran
const { width, height } = Dimensions.get('window');

// Configuration des animations spring pour des transitions fluides
const SPRING_CONFIG = {
  damping: 20,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Durées d'animation par défaut
const DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 450,
};

// Fonction utilitaire pour créer une animation spring
const createSpringTransition = (value: number) => {
  return withSpring(value, SPRING_CONFIG);
};

// Fonction utilitaire pour créer une animation timing
const createTimingTransition = (value: number, duration: number) => {
  return withTiming(value, {
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
};

// Mapping des transitions disponibles
export const transitionMap: Record<TransitionType, {
  gestureDirection?: string;
  cardStyleInterpolator: (props: StackCardInterpolationProps) => {
    cardStyle: ViewStyle;
    overlayStyle?: ViewStyle;
    nextCardStyle?: ViewStyle;
  };
  transitionSpec?: {
    open: any;
    close: any;
  };
}> = {
  horizontal: {
    gestureDirection: 'horizontal',
    cardStyleInterpolator: ({ current, layouts, next }) => {
      const translateX = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.width, 0],
      });

      const overlayOpacity = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
      });

      const nextTranslateX = next
        ? next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -width * 0.2],
          })
        : 0;

      const nextOpacity = next
        ? next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.8],
          })
        : 1;

      return {
        cardStyle: {
          transform: [{ translateX }],
        },
        overlayStyle: {
          opacity: overlayOpacity,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        nextCardStyle: {
          transform: [{ translateX: nextTranslateX }],
          opacity: nextOpacity,
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring',
        config: SPRING_CONFIG,
      },
      close: {
        animation: 'spring',
        config: SPRING_CONFIG,
      },
    },
  },
  vertical: {
    gestureDirection: 'vertical',
    cardStyleInterpolator: ({ current, layouts, next }) => {
      const translateY = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.height, 0],
      });

      const overlayOpacity = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
      });

      const scale = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.95, 1],
      });

      const borderRadius = current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [20, 10, 0],
      });

      const nextScale = next
        ? next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.95],
          })
        : 1;

      return {
        cardStyle: {
          transform: [{ translateY }, { scale }],
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        },
        overlayStyle: {
          opacity: overlayOpacity,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        nextCardStyle: {
          transform: [{ scale: nextScale }],
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'spring',
        config: SPRING_CONFIG,
      },
      close: {
        animation: 'spring',
        config: SPRING_CONFIG,
      },
    },
  },
  fade: {
    cardStyleInterpolator: ({ current }) => {
      const opacity = current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
      });

      const scale = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.98, 1],
      });

      return {
        cardStyle: {
          opacity,
          transform: [{ scale }],
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: DURATIONS.normal,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: DURATIONS.fast,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
  },
  none: {
    cardStyleInterpolator: () => ({
      cardStyle: {},
    }),
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 0,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 0,
        },
      },
    },
  },
};

/**
 * Crée les options d'écran avec la transition spécifiée
 * 
 * @param transitionType Type de transition à appliquer
 * @param additionalOptions Options supplémentaires à fusionner
 * @returns Options d'écran complètes
 */
export const createScreenOptions = (
  transitionType: TransitionType = 'horizontal',
  additionalOptions = {}
) => {
  return {
    ...transitionMap[transitionType],
    ...additionalOptions,
  };
};

export {
  SPRING_CONFIG,
  DURATIONS,
  createSpringTransition,
  createTimingTransition,
};