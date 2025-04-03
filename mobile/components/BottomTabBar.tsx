import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Entypo, FontAwesome5, Ionicons } from '@expo/vector-icons';

interface BottomTabBarProps {
  activeTab?: string;
}

// Constantes pour les dimensions et le design
const SCREEN_WIDTH = Dimensions.get('window').width;
const IS_IPHONE_X = Platform.OS === 'ios' && 
                    (Dimensions.get('window').height >= 812 || 
                     Dimensions.get('window').width >= 812);
const BOTTOM_INSET = IS_IPHONE_X ? 34 : Platform.OS === 'ios' ? 20 : 0;
const TAB_HEIGHT = 56; // Hauteur fixe de la barre sans les insets

// Thème avec design system pro
const THEME = {
  colors: {
    shopping: '#FF2D55',
    events: '#FF9500',
    friends: '#007AFF',
    profile: '#5856D6',
    tabBackground: '#FFFFFF',
    tabBorder: '#EEEEEE',
    tabInactive: '#8E8E93',
    shadow: '#000000'
  }
};

/**
 * BottomTabBar - Composant de navigation inférieure professionnel
 * 
 * @param {BottomTabBarProps} props - Les propriétés du composant
 * @returns {React.ReactElement} - Le composant rendu
 */
const BottomTabBar: React.FC<BottomTabBarProps> = memo(({ activeTab = 'shopping' }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const defaultAvatar = 'https://api.a0.dev/assets/image?text=avatar%20profile%20portrait&aspect=1:1';
  
  /**
   * Gère la navigation entre les écrans
   * @param {string} screen - L'écran de destination
   */
  const handleNavigate = (screen: string) => {
    if (screen === activeTab) return;
    
    switch(screen) {
      case 'shopping':
        navigation.reset({ index: 0, routes: [{ name: 'HomePage' }] });
        break;
      case 'events':
        navigation.reset({ index: 0, routes: [{ name: 'Events' }] });
        break;
      case 'friends':
        navigation.reset({ index: 0, routes: [{ name: 'Friends' }] });
        break;
      case 'profile':
        navigation.reset({ index: 0, routes: [{ name: 'Profile', params: {} }] }); // Garder les params vides
        break;
    }
  };

  /**
   * Détermine les couleurs et styles pour un onglet spécifique
   * @param {string} tab - L'identifiant de l'onglet
   * @returns {object} - Les propriétés de style pour l'onglet
   */
  const getTabProps = (tab: string) => {
    const isActive = activeTab === tab;
    const color = isActive 
      ? THEME.colors[tab as keyof typeof THEME.colors] 
      : THEME.colors.tabInactive;
    
    return { isActive, color };
  };

  // Tableau de configuration des onglets
  const tabs = [
    {
      id: 'shopping',
      label: 'Shopping',
      icon: ({ color, isActive }: { color: string, isActive: boolean }) => (
        <FontAwesome5 name="store" size={20} color={color} solid={isActive} />
      )
    },
    {
      id: 'events',
      label: 'Événements',
      icon: ({ color, isActive }: { color: string, isActive: boolean }) => (
        <Entypo name="calendar" size={20} color={color} />
      )
    },
    {
      id: 'friends',
      label: 'Amis',
      icon: ({ color, isActive }: { color: string, isActive: boolean }) => (
        <Ionicons name={isActive ? "people" : "people-outline"} size={22} color={color} />
      )
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: ({ color, isActive }: { color: string, isActive: boolean }) => (
        <View style={[styles.avatarWrapper, isActive && { borderColor: color, borderWidth: 2 }]}>
          <Image source={{ uri: defaultAvatar }} style={styles.avatar} />
        </View>
      )
    }
  ];

  return (
    <View style={styles.container} testID="bottom-tab-bar">
      <View style={styles.content}>
        {tabs.map((tab) => {
          const { isActive, color } = getTabProps(tab.id);
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => handleNavigate(tab.id)}
              testID={`tab-${tab.id}`}
            >
              <View style={styles.tabContent}>
                {tab.icon({ color, isActive })}
                
                <Text
                  style={[
                    styles.tabLabel,
                    { color },
                    isActive && styles.activeTabLabel
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                
                {isActive && (
                  <View 
                    style={[
                      styles.indicator, 
                      { backgroundColor: color }
                    ]} 
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Safe area pour les iPhones avec notch */}
      {IS_IPHONE_X && <View style={styles.bottomInset} />}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.tabBackground,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.tabBorder,
    width: SCREEN_WIDTH,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: THEME.colors.shadow,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    width: '100%',
  },
  bottomInset: {
    height: BOTTOM_INSET,
    backgroundColor: THEME.colors.tabBackground,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: TAB_HEIGHT,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    paddingTop: 6,
    paddingBottom: 6,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  avatarWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EFEFEF',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});

export default BottomTabBar;