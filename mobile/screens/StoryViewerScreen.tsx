// import React, { useState, useEffect, useRef } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   Animated,
//   StatusBar,
//   Dimensions,
//   SafeAreaView,
// } from 'react-native';
// import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { Ionicons } from '@expo/vector-icons';
// import { RootStackParamList } from '../types/navigation';
// import { LinearGradient } from 'expo-linear-gradient';

// type StoryViewerScreenRouteProp = RouteProp<RootStackParamList, 'StoryViewer'>;

// // Dimensions de l'écran
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// const StoryViewerScreen = () => {
//   const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const route = useRoute<StoryViewerScreenRouteProp>();
//   const { friendId, friendName, friendAvatar, stories } = route.params;

//   // État pour suivre l'index de la story actuelle
//   const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
//   // État pour suivre l'index du média actuel dans la story
//   const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
//   // Indicateur de pause de la story
//   const [isPaused, setIsPaused] = useState(false);

//   // Animation pour la barre de progression
//   const progressAnimation = useRef(new Animated.Value(0)).current;
//   const progressRef = useRef<Animated.CompositeAnimation | null>(null);

//   // Calculer la durée totale
//   const storyDuration = 5000; // 5 secondes par média

//   // Références pour la gestion des touches
//   const touchStartX = useRef(0);

//   // Obtenir la story actuelle et le média actuel
//   const currentStory = stories[currentStoryIndex];
//   const currentMedia = currentStory?.media[currentMediaIndex];

//   // Mettre à jour les stories en marquant comme vues
//   useEffect(() => {
//     if (currentStory && !currentStory.viewed) {
//       // Dans une vraie application, ceci serait mis à jour dans la base de données
//       currentStory.viewed = true;
//     }
//   }, [currentStory]);

//   // Démarrer l'animation de progression
//   useEffect(() => {
//     startProgressAnimation();
    
//     return () => {
//       if (progressRef.current) {
//         progressRef.current.stop();
//       }
//     };
//   }, [currentStoryIndex, currentMediaIndex, isPaused]);

//   // Fonction pour démarrer l'animation de progression
//   const startProgressAnimation = () => {
//     if (progressRef.current) {
//       progressRef.current.stop();
//     }
    
//     progressAnimation.setValue(0);
    
//     if (!isPaused) {
//       progressRef.current = Animated.timing(progressAnimation, {
//         toValue: 1,
//         duration: storyDuration,
//         useNativeDriver: false,
//       });
      
//       progressRef.current.start(({ finished }) => {
//         if (finished) {
//           goToNextMedia();
//         }
//       });
//     }
//   };

//   // Aller au média suivant
//   const goToNextMedia = () => {
//     const story = stories[currentStoryIndex];
    
//     if (currentMediaIndex < story.media.length - 1) {
//       // Il y a plus de médias dans cette story
//       setCurrentMediaIndex(currentMediaIndex + 1);
//     } else if (currentStoryIndex < stories.length - 1) {
//       // Passer à la story suivante
//       setCurrentStoryIndex(currentStoryIndex + 1);
//       setCurrentMediaIndex(0);
//     } else {
//       // C'était la dernière story, retourner à l'écran précédent
//       navigation.goBack();
//     }
//   };
  
//   // Aller au média précédent
//   const goToPrevMedia = () => {
//     if (currentMediaIndex > 0) {
//       // Revenir au média précédent dans la story actuelle
//       setCurrentMediaIndex(currentMediaIndex - 1);
//     } else if (currentStoryIndex > 0) {
//       // Revenir à la story précédente
//       const prevStoryIndex = currentStoryIndex - 1;
//       setCurrentStoryIndex(prevStoryIndex);
//       setCurrentMediaIndex(stories[prevStoryIndex].media.length - 1);
//     } else {
//       // C'était déjà le premier média de la première story, on ne fait rien ou on retourne
//       navigation.goBack();
//     }
//   };

//   // Gérer les touches de l'utilisateur
//   const handleTouchStart = (event: any) => {
//     // Enregistrer la position X de départ
//     touchStartX.current = event.nativeEvent.pageX;
//     // Mettre en pause l'animation de progression
//     setIsPaused(true);
//   };

//   const handleTouchEnd = (event: any) => {
//     // Calculer la différence X
//     const touchEndX = event.nativeEvent.pageX;
//     const diffX = touchEndX - touchStartX.current;
    
//     // Reprendre l'animation
//     setIsPaused(false);
    
//     // Détecter s'il s'agit d'un tap ou d'un swipe
//     if (Math.abs(diffX) < 10) {
//       // C'est un tap
//       handleTap(touchEndX);
//     } else if (diffX > 50) {
//       // Swipe de droite à gauche -> média précédent
//       goToPrevMedia();
//     } else if (diffX < -50) {
//       // Swipe de gauche à droite -> média suivant
//       goToNextMedia();
//     }
//   };

//   // Gérer les taps sur l'écran
//   const handleTap = (touchX: number) => {
//     // Tap sur le côté gauche => média précédent
//     if (touchX < SCREEN_WIDTH / 3) {
//       goToPrevMedia();
//     } 
//     // Tap sur le côté droit => média suivant
//     else if (touchX > (SCREEN_WIDTH * 2) / 3) {
//       goToNextMedia();
//     }
//   };

//   // Fermer le visualiseur de stories
//   const handleClose = () => {
//     navigation.goBack();
//   };

//   // Répondre à la story
//   const handleReply = () => {
//     // Naviguer vers l'écran de chat avec cet ami
//     navigation.navigate('ChatDetail', {
//       messageId: friendId,
//       name: friendName,
//       avatars: [friendAvatar],
//       isGroupChat: false
//     });
//   };

//   // Calculer le nombre de barres de progression
//   const totalMediaCount = stories[currentStoryIndex]?.media.length || 0;
  
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
//       {/* Indicateurs de progression */}
//       <View style={styles.progressContainer}>
//         {Array.from({ length: totalMediaCount }).map((_, index) => (
//           <View key={index} style={styles.progressBar}>
//             <Animated.View
//               style={[
//                 styles.activeProgress,
//                 {
//                   flex: index < currentMediaIndex 
//                     ? 1 
//                     : index === currentMediaIndex 
//                     ? progressAnimation 
//                     : 0
//                 }
//               ]}
//             />
//           </View>
//         ))}
//       </View>
      
//       {/* En-tête avec info utilisateur */}
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           <View style={styles.avatarContainer}>
//             <Image source={{ uri: friendAvatar }} style={styles.avatar} />
//           </View>
//           <View>
//             <Text style={styles.username}>{friendName}</Text>
//             <Text style={styles.timestamp}>
//               {new Date(currentMedia?.timestamp || Date.now()).toLocaleTimeString([], {
//                 hour: '2-digit',
//                 minute: '2-digit'
//               })}
//             </Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
//           <Ionicons name="close" size={28} color="#FFF" />
//         </TouchableOpacity>
//       </View>
      
//       {/* Contenu de la story */}
//       <TouchableOpacity
//         activeOpacity={1}
//         style={styles.mediaContainer}
//         onPressIn={handleTouchStart}
//         onPressOut={handleTouchEnd}
//       >
//         {currentMedia?.type === 'image' ? (
//           <Image
//             source={{ uri: currentMedia.url }}
//             style={styles.media}
//             resizeMode="cover"
//           />
//         ) : (
//           <View style={styles.media}>
//             {/* Pour les vidéos on utiliserait un composant Video */}
//             <Text style={styles.videoPlaceholder}>Vidéo non disponible</Text>
//           </View>
//         )}
//       </TouchableOpacity>
      
//       {/* Pied de page avec options d'interaction */}
//       <View style={styles.footer}>
//         <View style={styles.replyContainer}>
//           <TextInputBox onReply={handleReply} />
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// // Composant d'entrée de texte pour répondre
// const TextInputBox = ({ onReply }: { onReply: () => void }) => {
//   return (
//     <TouchableOpacity style={styles.replyBox} onPress={onReply}>
//       <View style={styles.replyWrapper}>
//         <Image 
//           source={{ uri: 'https://api.a0.dev/assets/image?text=user%20avatar%20cartoon&aspect=1:1&seed=1' }} 
//           style={styles.replyAvatar} 
//         />
//         <Text style={styles.replyPlaceholder}>Répondre à cette story...</Text>
//       </View>
//       <Ionicons name="paper-plane-outline" size={24} color="#FFF" />
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   progressContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 8,
//     paddingTop: StatusBar.currentHeight || 40,
//   },
//   progressBar: {
//     height: 2,
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     marginHorizontal: 2,
//     borderRadius: 2,
//   },
//   activeProgress: {
//     height: '100%',
//     backgroundColor: '#FFF',
//     borderRadius: 2,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatarContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//     borderWidth: 2,
//     borderColor: '#FFF',
//     overflow: 'hidden',
//   },
//   avatar: {
//     width: '100%',
//     height: '100%',
//   },
//   username: {
//     color: '#FFF',
//     fontWeight: 'bold',
//     fontSize: 15,
//   },
//   timestamp: {
//     color: 'rgba(255, 255, 255, 0.7)',
//     fontSize: 12,
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   mediaContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   media: {
//     width: '100%',
//     height: '100%',
//     backgroundColor: '#333',
//   },
//   videoPlaceholder: {
//     color: '#FFF',
//     fontSize: 16,
//     textAlign: 'center',
//   },
//   footer: {
//     paddingBottom: 30,
//     paddingHorizontal: 16,
//   },
//   replyContainer: {
//     marginTop: 10,
//   },
//   replyBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 24,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     justifyContent: 'space-between',
//   },
//   replyWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   replyAvatar: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     marginRight: 10,
//   },
//   replyPlaceholder: {
//     color: 'rgba(255, 255, 255, 0.8)',
//     fontSize: 14,
//   },
// });

// export default StoryViewerScreen;