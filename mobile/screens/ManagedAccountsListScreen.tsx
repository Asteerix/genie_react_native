import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Easing,
  useWindowDimensions
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useManagedAccounts } from '../context/ManagedAccountsContext';
import { ManagedAccount } from '../api/types';

type ManagedAccountsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManagedAccountsList'>;
type ManagedAccountsListScreenRouteProp = RouteProp<RootStackParamList, 'ManagedAccountsList'>;

const ManagedAccountsListScreen: React.FC = () => {
  const navigation = useNavigation<ManagedAccountsListScreenNavigationProp>();
  const route = useRoute<ManagedAccountsListScreenRouteProp>();
  const fromSettings = route.params?.fromSettings;
  const { width, height } = useWindowDimensions();
  const isSmallDevice = height < 700;
  const { accounts, fetchAccounts, isLoading } = useManagedAccounts();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonAnim = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  // State for managing display accounts
  const [displayAccounts, setDisplayAccounts] = useState<ManagedAccount[]>([]);
  
  // Shadow height calculation for the sticky finish button
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollEnabled = contentHeight > scrollViewHeight;
  
  // For showing shadow over the button when content is scrollable
  const [showButtonShadow, setShowButtonShadow] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  
  // Helper function to safely generate usernames
  const safeUsername = (account: ManagedAccount) => {
    // Safety check for the account object
    if (!account) return 'user';
    
    // Safety check for the account id
    const safeId = account.id ? account.id.substring(0, 5) : '00000';
    
    // If neither firstName nor lastName exists
    if (!account.firstName && !account.lastName) return `user_${safeId}`;
    
    // Create baseText safely
    const baseText = `${account.firstName || ''}${account.lastName || ''}`;
    
    // Return cleaned username or fallback
    return baseText ? baseText.toLowerCase().replace(/[^a-z0-9]/g, '') : `user_${safeId}`;
  };
  
  // Fetch accounts when component mounts
  useEffect(() => {
    console.log('ManagedAccountsListScreen mounted, fetching accounts...');
    fetchAccounts().then(() => {
      console.log('Fetch accounts completed in ManagedAccountsListScreen');
    }).catch(err => {
      console.error('Error fetching accounts in ManagedAccountsListScreen:', err);
    });
  }, []);
  
  // Animations when the screen comes into focus
  useEffect(() => {
    // Simulate a loading effect, adding accounts one by one
    if (accounts.length > 0) {
      setTimeout(() => {
        setDisplayAccounts([accounts[0]]);
        if (accounts.length > 1) {
          setTimeout(() => {
            setDisplayAccounts([accounts[0], accounts[1]]);
            if (accounts.length > 2) {
              setTimeout(() => {
                setDisplayAccounts(accounts);
              }, 150);
            }
          }, 150);
        }
      }, 150);
    }
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(buttonAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)),
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          })
        ])
      ])
    ]).start();
  }, [accounts]);
  
  useEffect(() => {
    // Update shadow state when scroll state changes
    setShowButtonShadow(!isScrolledToBottom && scrollEnabled);
  }, [isScrolledToBottom, scrollEnabled]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsScrolledToBottom(isCloseToBottom);
  };

  const handleCreateNewAccount = () => {
    navigation.navigate('ManagedAccountName', {
      managedBy: 'user' // Nous devons fournir un managedBy pour ce paramètre
    });
  };

  const handleFinish = () => {
    if (fromSettings) {
      // Si on vient des paramètres, rediriger vers les paramètres
      navigation.navigate('Settings');
    } else {
      // Sinon, réinitialiser la pile de navigation avec Wishlist comme écran principal
      // Wishlist est un écran qui existe réellement dans App.tsx
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomePage' }], // Utiliser un écran qui existe dans App.tsx
      });
    }
  };

  const handleAccountPress = (account: ManagedAccount) => {
    // In a real app, this would navigate to account details/edit screen
    // This could be implemented later when needed
  };

  const renderAccountItem = ({ item, index }: { item: ManagedAccount, index: number }) => {
    // Calculate delay for staggered animation
    const animationDelay = 150 * index;
    
    // Générer un nom d'utilisateur si non présent dans l'API en utilisant la fonction sécurisée
    const username = safeUsername(item);
    
    // Ensure we have safe values for the image URL
    const safeName = item?.firstName || 'User';
    const safeId = item?.id || '0';

    return (
      <Animated.View
        key={`animated-account-${item.id || index}`}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: Animated.multiply(slideAnim, new Animated.Value(index + 1)) }]
        }}
      >
        <TouchableOpacity 
          style={[
            styles.accountItem,
            isSmallDevice && styles.accountItemSmall
          ]}
          onPress={() => handleAccountPress(item)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.avatarContainer,
            isSmallDevice && styles.avatarContainerSmall
          ]}>
            <Image 
              source={{ 
                uri: item.avatarUrl || 
                     `https://api.a0.dev/assets/image?text=${encodeURIComponent(safeName)}&aspect=1:1&seed=${safeId}` 
              }} 
              style={styles.avatar}
              resizeMode="cover" 
            />
          </View>
          <View style={styles.accountDetails}>
            <Text 
              style={[
                styles.accountName,
                isSmallDevice && styles.accountNameSmall
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {`${item.firstName || ''} ${item.lastName || ''}`}
            </Text>
            <Text 
              style={[
                styles.accountUsername,
                isSmallDevice && styles.accountUsernameSmall
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.username || username}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={isSmallDevice ? 20 : 24} color="#CCCCCC" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCreateNewButton = () => (
    <Animated.View
      key="create-new-button-container"
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: Animated.multiply(slideAnim, new Animated.Value(displayAccounts.length + 1)) }]
      }}
    >
      <TouchableOpacity 
        style={[
          styles.accountItem, 
          styles.createNewItem,
          isSmallDevice && styles.accountItemSmall
        ]}
        onPress={handleCreateNewAccount}
        activeOpacity={0.7}
      >
        <View style={[
          styles.avatarContainer, 
          styles.createNewAvatar,
          isSmallDevice && styles.avatarContainerSmall
        ]}>
          <LinearGradient
            colors={['#f8f8f8', '#e8e8e8']}
            style={styles.gradientBackground}
          >
            <Feather name="plus" size={isSmallDevice ? 24 : 30} color="#999999" />
          </LinearGradient>
        </View>
        <View style={styles.accountDetails}>
          <Text 
            style={[
              styles.createNewText,
              isSmallDevice && styles.createNewTextSmall
            ]}
          >
            Créer un nouveau
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={isSmallDevice ? 20 : 24} color="#CCCCCC" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.helpButton} 
            activeOpacity={0.7}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <View style={styles.helpCircle}>
              <Text style={styles.helpText}>?</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Animated.Text 
          style={[
            styles.title,
            isSmallDevice && styles.titleSmall,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          Mes comptes gérés
        </Animated.Text>

        <View 
          style={[
            styles.scrollContainerWrapper, 
            { paddingBottom: showButtonShadow ? 12 : 0 }
          ]}
          onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Chargement des comptes...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={(width, height) => {
                setContentHeight(height);
              }}
            >
              {displayAccounts.map((account, index) => (
                <View key={`account-item-${account.id || index}`}>
                  {renderAccountItem({ item: account, index })}
                </View>
              ))}
              {renderCreateNewButton()}
              
              {/* Bottom padding to ensure the button doesn't overlap content */}
              <View 
                style={[
                  styles.bottomPadding, 
                  { height: isSmallDevice ? 60 : 80 }
                ]} 
              />
            </ScrollView>
          )}
        </View>
        
        {/* Shadow overlay when content is scrollable */}
        {showButtonShadow && (
          <View style={styles.buttonShadow} />
        )}

        {/* Finish button with animation */}
        <Animated.View
          style={[
            styles.finishButtonContainer,
            { 
              opacity: buttonOpacity,
              transform: [{ translateY: buttonAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.finishButton,
              isSmallDevice && styles.finishButtonSmall
            ]}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.finishButtonText,
              isSmallDevice && styles.finishButtonTextSmall
            ]}>
              {fromSettings ? "Valider" : "Cela me semble parfait !"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  helpButton: {
    padding: 5,
  },
  helpCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  titleSmall: {
    fontSize: 28,
    marginBottom: 30,
  },
  scrollContainerWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 12,
  },
  accountItemSmall: {
    marginBottom: 15,
    paddingVertical: 8,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  avatarContainerSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createNewAvatar: {
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountNameSmall: {
    fontSize: 16,
    marginBottom: 2,
  },
  accountUsername: {
    fontSize: 16,
    color: '#999999',
  },
  accountUsernameSmall: {
    fontSize: 14,
  },
  createNewText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555555',
  },
  createNewTextSmall: {
    fontSize: 16,
  },
  createNewItem: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  bottomPadding: {
    height: 80,
  },
  buttonShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1,
    pointerEvents: 'none',
  },
  finishButtonContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 20 : 15,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  finishButton: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  finishButtonSmall: {
    paddingVertical: 14,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  finishButtonTextSmall: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ManagedAccountsListScreen;