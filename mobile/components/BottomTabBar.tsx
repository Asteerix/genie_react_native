import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, Animated } from 'react-native';
import { Ionicons, Feather, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface BottomTabBarProps {
  activeTab?: string;
}

// Tab color configuration
const TAB_COLORS = {
  wishes: '#FF2D55',
  events: '#FF9500',
  add: '#000000',
  friends: '#007AFF',
  profile: '#5856D6'
};

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab = 'home' }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  // Placeholder avatar URL for all users since the User type doesn't include avatar
  const defaultAvatar = 'https://api.a0.dev/assets/image?text=avatar%20profile%20portrait&aspect=1:1';
  const avatarUrl = defaultAvatar;
  
  const handleNavigate = (screen: string) => {
    // Don't navigate if we're already on this screen
    if (screen === activeTab) return;
    
    switch(screen) {
      case 'wishes':
        navigation.navigate('Wishlist');
        break;
      case 'events':
        navigation.navigate('Events');
        break;
      case 'add':
        navigation.navigate('AddWish');
        break;
      case 'friends':
        navigation.navigate('Friends');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        navigation.navigate('AddWish');
    }
  };

  const renderTabIcon = (tab: string) => {
    const isActive = activeTab === tab;
    const color = isActive ? TAB_COLORS[tab as keyof typeof TAB_COLORS] : '#888';
    const size = isActive ? 26 : 24;
    
    switch(tab) {
      case 'wishes':
        return (
          <Ionicons
            name={isActive ? "heart" : "heart-outline"}
            size={size}
            color={color}
          />
        );
      case 'events':
        return (
          <FontAwesome
            name="birthday-cake"
            size={size - 2}
            color={color}
          />
        );
      case 'friends':
        return (
          <Ionicons
            name={isActive ? "people" : "people-outline"}
            size={size}
            color={color}
          />
        );
      case 'profile':
        return (
          <Ionicons
            name={isActive ? "person" : "person-outline"}
            size={size - 2}
            color={color}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {['wishes', 'events', 'add', 'friends', 'profile'].map((tab) => {
        if (tab === 'add') {
          return (
            <TouchableOpacity
              key={tab}
              style={styles.centerButton}
              onPress={() => handleNavigate('add')}
              activeOpacity={0.8}
            >
              <View style={styles.plusButton}>
                <Feather name="plus" size={30} color="white" />
              </View>
            </TouchableOpacity>
          );
        }
        
        const isActive = activeTab === tab;
        const tabColor = TAB_COLORS[tab as keyof typeof TAB_COLORS];
        
        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabItem,
              isActive && styles.activeTabItem
            ]}
            onPress={() => handleNavigate(tab)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {renderTabIcon(tab)}
              <Text
                style={[
                  styles.tabLabel,
                  isActive && [styles.activeTabLabel, { color: tabColor }]
                ]}
                numberOfLines={1}
              >
                {tab === 'wishes' && 'Vœux'}
                {tab === 'events' && 'Événements'}
                {tab === 'friends' && 'Amis'}
                {tab === 'profile' && 'Profil'}
              </Text>
              
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: tabColor }]} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.07,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    paddingHorizontal: 4,
  },
  activeTabItem: {
    transform: [{ translateY: -5 }],
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -35,
  },
  plusButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 5,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});

export default BottomTabBar;