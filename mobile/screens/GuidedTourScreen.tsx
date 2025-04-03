import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  FlatList, 
  Image, 
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const { width } = Dimensions.get('window');

const GuidedTourScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const tourSteps: TourStep[] = [
    {
      id: '1',
      title: 'Bienvenue dans l\'application',
      description: 'Découvrez toutes les fonctionnalités de notre application pour gérer vos événements et listes de souhaits avec facilité.',
      icon: 'home',
    },
    {
      id: '2',
      title: 'Créez des événements',
      description: 'Organisez des fêtes, anniversaires et autres événements. Invitez vos amis et gérez les détails en quelques clics.',
      icon: 'calendar',
    },
    {
      id: '3',
      title: 'Gérez vos listes de souhaits',
      description: 'Créez des listes pour toutes les occasions. Ajoutez des articles, partagez avec vos proches et suivez les achats.',
      icon: 'gift',
    },
    {
      id: '4',
      title: 'Discutez avec vos amis',
      description: 'Communiquez facilement avec vos amis via notre messagerie intégrée. Partagez des photos et organisez des événements.',
      icon: 'chatbubble',
    },
    {
      id: '5',
      title: 'Comptes gérés',
      description: 'Créez et gérez des comptes pour vos enfants ou proches. Organisez leurs listes de souhaits et événements.',
      icon: 'people',
    },
  ];
  
  const handleNext = () => {
    if (currentIndex < tourSteps.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleComplete = () => {
    navigation.goBack();
  };
  
  const renderItem = ({ item, index }: { item: TourStep; index: number }) => {
    return (
      <View style={styles.slideContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon as any} size={60} color="#000" />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visite guidée de l'app</Text>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleComplete}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Tour Carousel */}
        <Animated.FlatList
          ref={flatListRef}
          data={tourSteps}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
          style={styles.carousel}
        />
        
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {tourSteps.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.paginationDot,
                  { width: dotWidth, opacity },
                ]}
              />
            );
          })}
        </View>
        
        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentIndex > 0 ? (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={handlePrevious}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
              <Text style={styles.navigationButtonText}>Précédent</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navigationButtonPlaceholder} />
          )}
          
          {currentIndex < tourSteps.length - 1 ? (
            <TouchableOpacity
              style={[styles.navigationButton, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={[styles.navigationButtonText, styles.nextButtonText]}>Suivant</Text>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navigationButton, styles.completeButton]}
              onPress={handleComplete}
            >
              <Text style={[styles.navigationButtonText, styles.nextButtonText]}>Terminer</Text>
              <Ionicons name="checkmark" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  skipText: {
    fontSize: 16,
    color: '#888',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  carousel: {
    flex: 1,
  },
  slideContainer: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
    marginHorizontal: 5,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
  },
  navigationButtonPlaceholder: {
    width: 120,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  nextButton: {
    backgroundColor: '#000',
  },
  completeButton: {
    backgroundColor: '#000',
  },
  nextButtonText: {
    color: '#FFF',
  },
});

export default GuidedTourScreen;