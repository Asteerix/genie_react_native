// import React, { useState } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   TextInput,
//   SafeAreaView,
//   StatusBar,
// } from 'react-native';
// import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { Ionicons } from '@expo/vector-icons';
// import { RootStackParamList } from '../types/navigation';

// type StoryEditorScreenRouteProp = RouteProp<RootStackParamList, 'StoryEditor'>;

// const StoryEditorScreen = () => {
//   const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const route = useRoute<StoryEditorScreenRouteProp>();
//   const { mediaUri, mediaType } = route.params;
  
//   const [caption, setCaption] = useState('');
//   const [isPosting, setIsPosting] = useState(false);

//   // Publier la story
//   const postStory = async () => {
//     try {
//       setIsPosting(true);
      
//       // Dans une vraie app, ici on uploadera la story au serveur
//       // Simulons un délai pour l'upload
//       await new Promise(resolve => setTimeout(resolve, 1500));
      
//       // Naviguer vers l'écran Friends après avoir posté la story
//       navigation.navigate('Friends');
//     } catch (error) {
//       console.error('Erreur lors de la publication:', error);
//     } finally {
//       setIsPosting(false);
//     }
//   };

//   // Annuler et retourner à l'écran précédent
//   const handleCancel = () => {
//     navigation.goBack();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#000" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
//           <Ionicons name="close" size={28} color="#FFF" />
//         </TouchableOpacity>
        
//         <Text style={styles.title}>Nouvelle story</Text>
        
//         <TouchableOpacity 
//           style={[styles.postButton, isPosting && styles.postingButton]} 
//           onPress={postStory}
//           disabled={isPosting}
//         >
//           <Text style={styles.postButtonText}>
//             {isPosting ? 'Publication...' : 'Publier'}
//           </Text>
//         </TouchableOpacity>
//       </View>
      
//       {/* Aperçu du média */}
//       <View style={styles.mediaPreviewContainer}>
//         {mediaType === 'image' ? (
//           <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
//         ) : (
//           <View style={styles.videoPreview}>
//             <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
//             <View style={styles.videoOverlay}>
//               <Ionicons name="play-circle" size={60} color="rgba(255, 255, 255, 0.8)" />
//             </View>
//           </View>
//         )}
//       </View>
      
//       {/* Zone de saisie de légende */}
//       <View style={styles.captionContainer}>
//         <TextInput
//           style={styles.captionInput}
//           placeholder="Ajouter une légende..."
//           placeholderTextColor="#999"
//           value={caption}
//           onChangeText={setCaption}
//           multiline
//           maxLength={150}
//         />
//         <Text style={styles.captionCount}>{caption.length}/150</Text>
//       </View>
      
//       {/* Options supplémentaires */}
//       <View style={styles.optionsContainer}>
//         <TouchableOpacity style={styles.optionButton}>
//           <Ionicons name="location-outline" size={24} color="#FFF" />
//           <Text style={styles.optionText}>Ajouter un lieu</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity style={styles.optionButton}>
//           <Ionicons name="at-outline" size={24} color="#FFF" />
//           <Text style={styles.optionText}>Mentionner</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity style={styles.optionButton}>
//           <Ionicons name="pricetag-outline" size={24} color="#FFF" />
//           <Text style={styles.optionText}>Hashtag</Text>
//         </TouchableOpacity>
//       </View>
      
//       {/* Footer avec bouton de publication pour mobile */}
//       <View style={styles.footer}>
//         <TouchableOpacity 
//           style={[styles.publishButton, isPosting && styles.postingButton]} 
//           onPress={postStory}
//           disabled={isPosting}
//         >
//           <Text style={styles.publishButtonText}>
//             {isPosting ? 'Publication en cours...' : 'Publier la story'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//   },
//   title: {
//     color: '#FFF',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   cancelButton: {
//     padding: 5,
//   },
//   postButton: {
//     backgroundColor: '#0095f6',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 4,
//   },
//   postingButton: {
//     backgroundColor: '#0377c2',
//   },
//   postButtonText: {
//     color: '#FFF',
//     fontWeight: 'bold',
//   },
//   mediaPreviewContainer: {
//     height: 400,
//     width: '100%',
//     backgroundColor: '#111',
//   },
//   mediaPreview: {
//     width: '100%',
//     height: '100%',
//   },
//   videoPreview: {
//     width: '100%',
//     height: '100%',
//     position: 'relative',
//   },
//   videoOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.2)',
//   },
//   captionContainer: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//   },
//   captionInput: {
//     color: '#FFF',
//     fontSize: 16,
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
//   captionCount: {
//     color: '#999',
//     fontSize: 12,
//     alignSelf: 'flex-end',
//     marginTop: 4,
//   },
//   optionsContainer: {
//     padding: 16,
//   },
//   optionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//   },
//   optionText: {
//     color: '#FFF',
//     fontSize: 16,
//     marginLeft: 12,
//   },
//   footer: {
//     padding: 16,
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#000',
//     borderTopWidth: 1,
//     borderTopColor: '#333',
//   },
//   publishButton: {
//     backgroundColor: '#0095f6',
//     paddingVertical: 12,
//     borderRadius: 4,
//     alignItems: 'center',
//   },
//   publishButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default StoryEditorScreen;