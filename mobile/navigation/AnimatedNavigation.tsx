/**
 * Système de Navigation React Native Optimisé avec Animations Professionnelles
 * Version 2.0 - Mars 2025
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { 
  createNativeStackNavigator, 
  NativeStackNavigationOptions
} from '@react-navigation/native-stack';
import { 
  createBottomTabNavigator,
  BottomTabNavigationOptions,
  BottomTabBarProps
} from '@react-navigation/bottom-tabs';
import { 
  NavigationContainer, 
  DefaultTheme,
  useNavigationContainerRef,
  useNavigation,
  useIsFocused,
  Theme,
  ParamListBase
} from '@react-navigation/native';
import { 
  Platform, 
  StatusBar, 
  StyleSheet, 
  View,
  Text,
  Dimensions,
  BackHandler,
  Keyboard,
  InteractionManager,
  LayoutAnimation,
  UIManager,
  Pressable,
  ViewStyle,
  StyleProp,
  LayoutChangeEvent
} from 'react-native';
import Animated, { 
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  SlideInUp,
  SlideOutDown,
  Layout,
  withSpring,
  withTiming,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSequence,
  SharedValue
} from 'react-native-reanimated';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Constantes d'écran
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || (IS_IOS ? 44 : 0);
const BOTTOM_TAB_HEIGHT = 80;
const HEADER_HEIGHT = IS_IOS ? 88 : 64;

// Constantes pour les animations
const TIMING = {
  INSTANT: 0,
  VERY_FAST: 150,
  FAST: 250,
  NORMAL: 300,
  SLOW: 450,
  VERY_SLOW: 600,
};

// Easings optimisés pour des animations naturelles
const EASINGS = {
  DEFAULT: Easing.bezier(0.25, 0.1, 0.25, 1),
  BOUNCE: Easing.bezier(0.175, 0.885, 0.32, 1.275),
  SMOOTH_OUT: Easing.bezier(0, 0, 0.2, 1),
  SMOOTH_IN: Easing.bezier(0.4, 0, 1, 1),
  DECELERATE: Easing.bezier(0, 0, 0.2, 1),
  ACCELERATE: Easing.bezier(0.4, 0, 1, 1),
};

// Configuration Spring optimisée
const SPRING_CONFIG = {
  RESPONSIVE: {
    damping: 15,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
  BOUNCY: {
    damping: 12,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  }
};

// Thème et couleurs
const COLORS = {
  primary: '#4B56D2',
  primaryDark: '#3A45C0',
  primaryLight: '#6B76E2',
  secondary: '#FFB830',
  background: '#FFFFFF',
  surface: '#F7F9FC',
  text: '#333333',
  textSecondary: '#666666',
  border: 'rgba(0, 0, 0, 0.1)',
  disabled: '#CCCCCC',
  error: '#FF3B30',
  success: '#34C759',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',
};

// Styles globaux
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 10,
    left: 16,
    zIndex: 100,
  },
  backButtonTouchable: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabBar: {
    height: BOTTOM_TAB_HEIGHT,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 12,
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabBarIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabBarIndicator: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    bottom: -4, 
    backgroundColor: COLORS.primary,
  },
  tabBarIconBg: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(75, 86, 210, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    width: '100%',
    backgroundColor: COLORS.background,
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
});

// Créer les navigateurs standard
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Thème personnalisé pour la navigation
const NavigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.transparent,
    card: COLORS.background,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.error,
  },
};

// Définition des types de transitions
export type TransitionType = 'default' | 'slide_right' | 'slide_left' | 'fade' | 'modal' | 'none';

// Définir les transitions d'écran optimisées
const SCREEN_TRANSITIONS: Record<TransitionType, {
  entering: any;
  exiting: any;
  layout: any;
}> = {
  default: {
    entering: SlideInRight.springify().damping(20).stiffness(100),
    exiting: SlideOutLeft.springify().damping(20).stiffness(100),
    layout: Layout.springify().damping(20).stiffness(100),
  },
  slide_right: {
    entering: SlideInRight.springify().damping(20).stiffness(100),
    exiting: SlideOutLeft.springify().damping(20).stiffness(100),
    layout: Layout.springify().damping(20).stiffness(100),
  },
  slide_left: {
    entering: SlideInLeft.springify().damping(20).stiffness(100),
    exiting: SlideOutRight.springify().damping(20).stiffness(100),
    layout: Layout.springify().damping(20).stiffness(100),
  },
  fade: {
    entering: FadeIn.duration(TIMING.NORMAL),
    exiting: FadeOut.duration(TIMING.NORMAL),
    layout: Layout.springify().damping(20).stiffness(100),
  },
  modal: {
    entering: SlideInUp.duration(TIMING.NORMAL),
    exiting: SlideOutDown.duration(TIMING.NORMAL),
    layout: Layout.springify().damping(20).stiffness(100),
  },
  none: {
    entering: FadeIn.duration(0),
    exiting: FadeOut.duration(0),
    layout: Layout,
  },
};

// Options par défaut pour les écrans stack
const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: COLORS.background },
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
};

// Options pour les écrans modaux
const modalScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  presentation: 'transparentModal',
  contentStyle: { backgroundColor: COLORS.transparent },
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
};

// Options pour la barre de navigation du bas
const defaultTabOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarHideOnKeyboard: true,
  tabBarShowLabel: true,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textSecondary,
  tabBarStyle: styles.tabBar,
};

// Type pour les écrans dans un Stack Navigator
export interface StackScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  options?: NativeStackNavigationOptions;
}

// Type pour les écrans dans un Tab Navigator
export interface TabScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  icon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  label?: string;
  options?: BottomTabNavigationOptions;
}

/**
 * Interface pour AnimatedHeader
 */
export interface AnimatedHeaderProps {
  title: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  elevation?: number;
}

/**
 * Custom AnimatedHeader Component
 */
export const AnimatedHeader = memo(({ 
  title, 
  leftComponent, 
  rightComponent,
  backgroundColor = COLORS.background,
  titleColor = COLORS.text,
  elevation = 3,
}: AnimatedHeaderProps) => {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withTiming(isFocused ? 1 : 0, {
      duration: TIMING.FAST,
      easing: EASINGS.SMOOTH_OUT,
    });
  }, [isFocused, opacity]);
  
  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: interpolate(opacity.value, [0, 1], [-10, 0]) }
      ]
    };
  });
  
  return (
    <Animated.View 
      style={[
        styles.headerContainer, 
        headerStyle, 
        { 
          backgroundColor,
          elevation,
          shadowOpacity: elevation > 0 ? 0.1 : 0 
        }
      ]}
    >
      <View style={styles.headerLeft}>
        {leftComponent}
      </View>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.headerRight}>
        {rightComponent}
      </View>
    </Animated.View>
  );
});

/**
 * Interface pour AnimatedBackButton
 */
export interface AnimatedBackButtonProps {
  onPress: () => void;
  label?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * BackButton amélioré avec animation
 */
export const AnimatedBackButton = memo(({ 
  onPress, 
  label = 'Retour', 
  color = COLORS.primary,
  style,
}: AnimatedBackButtonProps) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withTiming(1, {
      duration: TIMING.NORMAL,
      easing: EASINGS.BOUNCE,
    });
    
    opacity.value = withTiming(1, {
      duration: TIMING.NORMAL,
      easing: EASINGS.SMOOTH_OUT,
    });
  }, [scale, opacity]);
  
  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateX: interpolate(opacity.value, [0, 1], [-20, 0]) }
      ]
    };
  });
  
  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 200, easing: EASINGS.BOUNCE })
    );
    
    // Delay to allow animation to play before navigation
    setTimeout(onPress, 50);
  }, [onPress, scale]);
  
  return (
    <Animated.View style={[styles.backButton, buttonStyle, style]}>
      <Pressable 
        onPress={handlePress} 
        style={({ pressed }) => [
          styles.backButtonTouchable,
          { opacity: pressed ? 0.7 : 1 }
        ]}
      >
        <Text style={[styles.backButtonText, { color }]}>
          ← {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

/**
 * Custom TabBar optimisé avec animations fluides
 */
export const AnimatedTabBar = memo((props: BottomTabBarProps) => {
  const { state, descriptors, navigation } = props;
  const [tabWidths, setTabWidths] = useState<Record<string, number>>({});
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabPositions = useRef<Record<string, number>>({});
  
  // Mettre à jour la position de l'indicateur lors du changement d'onglet
  useEffect(() => {
    const index = state.index;
    const route = state.routes[index];
    const position = tabPositions.current[route.key] || 0;
    const width = tabWidths[route.key] || 0;
    
    indicatorPosition.value = withTiming(position, {
      duration: TIMING.NORMAL,
      easing: EASINGS.SMOOTH_OUT,
    });
    
    indicatorWidth.value = withTiming(width, {
      duration: TIMING.NORMAL,
      easing: EASINGS.SMOOTH_OUT,
    });
  }, [state.index, tabWidths, indicatorPosition, indicatorWidth]);
  
  // Style animé pour l'indicateur
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
      width: indicatorWidth.value,
    };
  });
  
  return (
    <View style={styles.tabBar}>
      <Animated.View style={[styles.tabBarIndicator, indicatorStyle]} />
      <View style={{ flexDirection: 'row' }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          // Gestion correcte du label en fonction du type
          const label = 
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title || route.name;
                
          const isFocused = state.index === index;
          
          const onTabPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            
            if (!isFocused && !event.defaultPrevented) {
              // La clé ici est de passer les paramètres de manière appropriée
              // @ts-ignore - Nécessaire pour contourner les limites du système de types
              navigation.navigate(route.name);
            }
          };
          
          const onTabLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };
          
          const onLayout = (e: LayoutChangeEvent) => {
            const { width, x } = e.nativeEvent.layout;
            tabPositions.current[route.key] = x;
            setTabWidths(prev => ({
              ...prev,
              [route.key]: width,
            }));
          };
          
          const color = isFocused ? COLORS.primary : COLORS.textSecondary;
          
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onTabPress}
              onLongPress={onTabLongPress}
              onLayout={onLayout}
              style={styles.tabItemContainer}
            >
              <Animated.View 
                style={[
                  styles.tabItemWrapper,
                  isFocused && { 
                    transform: [{ translateY: -2 }]
                  }
                ]}
              >
                {isFocused && (
                  <Animated.View 
                    style={styles.tabBarIconBg}
                    entering={FadeIn.duration(TIMING.FAST)}
                    exiting={FadeOut.duration(TIMING.FAST)}
                  />
                )}
                
                <View style={styles.tabBarIcon}>
                  {options.tabBarIcon && options.tabBarIcon({ 
                    focused: isFocused, 
                    color, 
                    size: 24 
                  })}
                </View>
                
                <Animated.Text 
                  style={[
                    styles.tabBarLabel,
                    { color },
                    isFocused && { fontWeight: '700' }
                  ]}
                >
                  {typeof label === 'string' ? label : route.name}
                </Animated.Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

/**
 * Interface pour AnimatedNavigationContainer
 */
export interface AnimatedNavigationContainerProps {
  children: React.ReactNode;
  onReady?: () => void;
  onNavigationStateChange?: (state: any) => void;
  fallback?: React.ReactNode;
}

/**
 * Wrapper pour le NavigationContainer avec historique et gestion améliorée
 */
export const AnimatedNavigationContainer = memo(({
  children,
  onReady,
  onNavigationStateChange,
  fallback = null,
}: AnimatedNavigationContainerProps) => {
  const navigationRef = useNavigationContainerRef();
  const [isReady, setIsReady] = useState(false);
  const isNavigating = useRef(false);
  
  const handleNavigationReady = useCallback(() => {
    setIsReady(true);
    onReady?.();
  }, [onReady]);
  
  // Gestion du bouton retour sur Android
  useEffect(() => {
    if (!isReady) return;
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!navigationRef.current) return false;
        
        // Dismiss keyboard when back button is pressed
        Keyboard.dismiss();
        
        // Prevent rapid back presses
        if (isNavigating.current) return true;
        
        // Check if the current screen can handle the back action itself
        if (navigationRef.current.canGoBack()) {
          isNavigating.current = true;
          
          // Delay to prevent multiple back actions
          requestAnimationFrame(() => {
            navigationRef.current?.goBack();
            
            // Reset the flag after animation completes
            setTimeout(() => {
              isNavigating.current = false;
            }, TIMING.NORMAL + 50);
          });
          
          return true;
        }
        
        return false;
      }
    );
    
    return () => backHandler.remove();
  }, [isReady]);
  
  // Gestion de l'historique de navigation
  const handleNavigationStateChange = useCallback((state: any) => {
    if (!navigationRef.current || !state) return;
    
    // Fermer le clavier lors des transitions
    Keyboard.dismiss();
    
    // Callback pour l'état de navigation externe
    onNavigationStateChange?.(state);
  }, [onNavigationStateChange]);
  
  if (!isReady) {
    return fallback;
  }
  
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
      theme={NavigationTheme}
    >
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {children}
    </NavigationContainer>
  );
});

/**
 * Interface pour AnimatedScreen
 */
export interface AnimatedScreenProps {
  children: React.ReactNode;
  transitionType?: TransitionType;
  style?: StyleProp<ViewStyle>;
  layoutId?: string;
}

/**
 * Composant AnimatedScreen optimisé pour Reanimated 2
 */
export const AnimatedScreen = memo(({
  children,
  transitionType = 'default',
  style,
  layoutId,
}: AnimatedScreenProps) => {
  const transition = SCREEN_TRANSITIONS[transitionType];
  
  return (
    <Animated.View
      style={[styles.fullScreen, style]}
      entering={transition.entering}
      exiting={transition.exiting}
      layout={layoutId ? Layout.springify().damping(20).stiffness(100) : undefined}
    >
      {children}
    </Animated.View>
  );
});

/**
 * Interface pour AnimatedModal
 */
export interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade';
  overlayOpacity?: number;
  height?: number;
  dismissible?: boolean;
}

/**
 * Composant Modal avec animation et overlay
 */
export const AnimatedModal = memo(({
  visible = false,
  onClose,
  children,
  animationType = 'slide',
  overlayOpacity = 0.5,
  height,
  dismissible = true,
}: AnimatedModalProps) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayAlpha = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      overlayAlpha.value = withTiming(overlayOpacity, {
        duration: TIMING.NORMAL,
        easing: EASINGS.SMOOTH_OUT,
      });
      
      translateY.value = withTiming(0, {
        duration: TIMING.NORMAL,
        easing: EASINGS.SMOOTH_OUT,
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: TIMING.NORMAL,
        easing: EASINGS.SMOOTH_IN,
      });
      
      overlayAlpha.value = withTiming(0, {
        duration: TIMING.NORMAL,
        easing: EASINGS.SMOOTH_IN,
      });
    }
  }, [visible, translateY, overlayAlpha, overlayOpacity]);
  
  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayAlpha.value,
      backgroundColor: `rgba(0, 0, 0, ${overlayAlpha.value})`,
    };
  });
  
  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });
  
  const handleOverlayPress = useCallback(() => {
    if (dismissible) {
      onClose();
    }
  }, [dismissible, onClose]);
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View 
        style={[styles.modalOverlay, overlayStyle]} 
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable 
          style={{ flex: 1 }} 
          onPress={handleOverlayPress}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.modalContainer,
          modalStyle,
          height !== undefined ? { height } : { minHeight: SCREEN_HEIGHT * 0.3 }
        ]}
      >
        <View style={styles.modalHandle} />
        {children}
      </Animated.View>
    </View>
  );
});

/**
 * Crée un Stack Navigator optimisé avec des animations fluides
 */
export function createStackNavigator(
  screens: StackScreenConfig[],
  customOptions?: NativeStackNavigationOptions
): React.FC {
  return () => (
    <Stack.Navigator
      screenOptions={{
        ...defaultScreenOptions,
        ...customOptions,
      }}
    >
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Stack.Navigator>
  );
}

/**
 * Crée un Modal Stack Navigator optimisé pour les écrans modaux
 */
export function createModalNavigator(
  screens: StackScreenConfig[],
  customOptions?: NativeStackNavigationOptions
): React.FC {
  return () => (
    <Stack.Navigator
      screenOptions={{
        ...modalScreenOptions,
        ...customOptions,
      }}
    >
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Stack.Navigator>
  );
}

/**
 * Crée un Tab Navigator optimisé avec animations professionnelles
 */
export function createTabNavigator(
  screens: TabScreenConfig[],
  customOptions?: BottomTabNavigationOptions
): React.FC {
  return () => (
    <Tab.Navigator
      screenOptions={{
        ...defaultTabOptions,
        ...customOptions,
      }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      {screens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            ...screen.options,
            tabBarLabel: screen.label || screen.name,
            tabBarIcon: screen.icon,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

/**
 * Hook simplifié pour la navigation
 */
export function useAppNavigation() {
  const navigation = useNavigation();
  
  // Créer des méthodes simplifiées qui évitent les erreurs TypeScript
  const navigate = useCallback((name: string, params?: object) => {
    InteractionManager.runAfterInteractions(() => {
      // @ts-ignore - Ceci est nécessaire car les types génériques complexes causent des erreurs
      navigation.navigate(name, params);
    });
  }, [navigation]);
  
  const goBack = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.goBack();
    });
  }, [navigation]);
  
  return { navigate, goBack, navigation };
}

// Exporter les constantes principales
export {
  COLORS,
  TIMING,
  EASINGS,
  SPRING_CONFIG,
  SCREEN_TRANSITIONS,
  defaultScreenOptions,
  modalScreenOptions,
  defaultTabOptions,
};