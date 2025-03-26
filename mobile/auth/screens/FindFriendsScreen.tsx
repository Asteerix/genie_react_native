import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

type FindFriendsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FindFriends'>;

const FindFriendsScreen: React.FC = () => {
  const navigation = useNavigation<FindFriendsScreenNavigationProp>();  const handleContinue = () => {
    // Naviguer vers l'écran de synchronisation des contacts
    navigation.navigate('ContactsSync');
  };

  const handleSkip = () => {
    // Ignorer cette étape et aller directement à l'écran d'accueil
    navigation.reset({
      index: 0,
      routes: [{ name: 'AddWish' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.illustrationContainer}>
            {/* Avatar 1 - Haut */}
            <View style={[styles.avatarBubble, styles.avatarTop]}>
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=avatar%20young%20person%20with%20hat&aspect=1:1&seed=123' }} 
                style={styles.avatar} 
              />
            </View>
            
            {/* Avatar 2 - Gauche */}
            <View style={[styles.avatarBubble, styles.avatarLeft]}>
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=avatar%20cute%20child&aspect=1:1&seed=456' }} 
                style={styles.avatar} 
              />
            </View>
            
            {/* Avatar 3 - Droite */}
            <View style={[styles.avatarBubble, styles.avatarRight]}>
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=avatar%20young%20woman%20smiling&aspect=1:1&seed=789' }} 
                style={styles.avatar} 
              />
            </View>

            {/* Illustration du téléphone */}
            <View style={styles.phoneContainer}>
              <View style={styles.phone}>
                {/* Lignes pour représenter une liste dans le téléphone */}
                <View style={styles.notch} />
                {[1, 2, 3, 4, 5].map((item) => (
                  <View key={item} style={styles.listItem}>
                    <View style={styles.listItemDot} />
                    <View style={styles.listItemLine} />
                  </View>
                ))}
              </View>
            </View>

            {/* Étoiles décoratives */}
            <View style={[styles.star, styles.starTopRight]} />
            <View style={[styles.star, styles.starBottomLeft]} />
            <View style={[styles.smallDot, styles.dotBottomRight]} />
            <View style={[styles.smallDot, styles.dotBottomLeft]} />
          </View>

          <Text style={styles.title}>Trouve tes amis</Text>
          <Text style={styles.description}>
            Synchronise tes contacts qui sont déjà présents, partage des événements, vœux et surtout des moments inoubliables !
          </Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  spacer: {
    width: 50,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    width: 300,
    height: 300,
    position: 'relative',
    marginBottom: 50,
  },
  phoneContainer: {
    width: 180,
    height: 300,
    position: 'absolute',
    top: 50,
    left: 60,
    zIndex: 1,
  },
  phone: {
    width: '100%',
    height: '80%',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 30,
    backgroundColor: 'transparent',
    padding: 20,
    position: 'relative',
  },
  notch: {
    width: 40,
    height: 8,
    backgroundColor: '#000',
    borderRadius: 4,
    position: 'absolute',
    top: 15,
    alignSelf: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  listItemDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
    marginRight: 10,
  },
  listItemLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#000',
  },
  avatarBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 2,
  },
  avatarTop: {
    top: 0,
    left: 110,
    backgroundColor: '#D8BFE5', // Violet clair
  },
  avatarLeft: {
    bottom: 60,
    left: 0,
    backgroundColor: '#FFBABA', // Rose clair
  },
  avatarRight: {
    top: 170,
    right: 0,
    backgroundColor: '#D8F5BD', // Vert clair
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 3,
    backgroundColor: 'transparent',
    transform: [{ rotate: '45deg' }],
    zIndex: 0,
  },
  starTopRight: {
    top: 100,
    right: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  starBottomLeft: {
    bottom: 30,
    left: 70,
    borderWidth: 2,
    borderColor: '#FFB6C1',
  },
  smallDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000',
    zIndex: 0,
  },
  dotBottomRight: {
    bottom: 10,
    right: 70,
  },
  dotBottomLeft: {
    bottom: 120,
    left: 190,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FindFriendsScreen;