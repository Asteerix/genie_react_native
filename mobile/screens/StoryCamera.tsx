import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  SafeAreaView,
  Animated,
  ActivityIndicator // Ajoutez cet import manquant
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

type StoryCameraRouteProps = RouteProp<RootStackParamList, 'StoryCamera'>;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAPTURE_SIZE = 78;

const StoryCamera = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<StoryCameraRouteProps>();
  const { returnToScreen = 'Friends' } = route.params || {};
  
  // Camera states
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  
  // Animation
  const captureButtonScale = useRef(new Animated.Value(1)).current;
  const captureButtonOpacity = useRef(new Animated.Value(1)).current;
  const flashAnimation = useRef(new Animated.Value(0)).current;
  const camButtonsOpacity = useRef(new Animated.Value(1)).current;
  
  // Refs
  const cameraRef = useRef<CameraView | null>(null);
  const isComponentMounted = useRef(true);
  
  // Demander les permissions au montage du composant
  useEffect(() => {
    (async () => {
      try {
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(cameraPermission.status === 'granted');
        
        // Demander également l'autorisation de la médiathèque
        const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
        if (mediaLibraryPermission.status === 'granted') {
          // Obtenir la photo la plus récente de l'appareil
          try {
            const assets = await MediaLibrary.getAssetsAsync({
              first: 1,
              mediaType: ['photo'],
              sortBy: [['creationTime', false]]
            });
            
            if (assets.assets.length > 0) {
              // Obtenir les informations sur le fichier pour obtenir une URI file:// correcte
              const assetInfo = await MediaLibrary.getAssetInfoAsync(assets.assets[0]);
              if (assetInfo && assetInfo.localUri) {
                setLastPhotoUri(assetInfo.localUri);
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération de la dernière photo:', error);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la demande de permissions:', error);
        Alert.alert('Erreur', 'Impossible d\'accéder à la caméra. Veuillez vérifier vos paramètres.');
      }
    })();
    
    // Nettoyage lors du démontage du composant
    return () => {
      isComponentMounted.current = false;
    };
  }, []);
  
  // Animation du bouton de capture
  const animateCaptureButton = () => {
    // Animation de l'échelle du bouton
    Animated.sequence([
      Animated.parallel([
        Animated.timing(captureButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(captureButtonOpacity, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        // Animer aussi l'opacité des autres boutons
        Animated.timing(camButtonsOpacity, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(captureButtonScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(captureButtonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Restaurer l'opacité des autres boutons
        Animated.timing(camButtonsOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };
  
  // Animation du flash
  const animateFlash = () => {
    flashAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Contrôles de la caméra
  const toggleCameraType = () => {
    setCameraType(current => (
      current === 'back' ? 'front' : 'back'
    ));
  };
  
  const toggleFlashMode = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
      }
    });
  };
  
  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on':
        return 'flash-on';
      case 'auto':
        return 'flash-auto';
      case 'off':
      default:
        return 'flash-off';
    }
  };
  
  // Fonction de capture de photo
  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;
    
    try {
      setIsProcessing(true);
      animateCaptureButton();
      
      // Configuration de la photo
      const options = {
        quality: 0.9,
        base64: false,
        skipProcessing: false,
        exif: false,
      };
      
      // Animer le flash
      if (flashMode === 'on') {
        animateFlash();
      }
      
      // Prendre la photo
      const photo = await cameraRef.current.takePictureAsync(options);
      
      if (photo && isComponentMounted.current) {
        // Feedback haptique et visuel
        try {
          // Vibration.vibrate(10); // Feedback tactile
        } catch (e) {
          console.error('Erreur lors de la vibration:', e);
        }
        
        // Sauvegarder la photo dans la galerie
        try {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
          console.log('Photo sauvegardée dans la galerie');
        } catch (error) {
          console.error('Erreur lors de la sauvegarde dans la galerie:', error);
        }
        
        // Naviguer vers l'éditeur avec l'image capturée
        navigation.navigate('StoryEditor', {
          mediaUri: photo.uri,
          mediaType: 'photo'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      if (isComponentMounted.current) {
        Alert.alert('Erreur', 'Échec de la capture photo. Veuillez réessayer.');
      }
    } finally {
      if (isComponentMounted.current) {
        setIsProcessing(false);
      }
    }
  };
  
  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // Photos uniquement
        quality: 1,
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      if (!result.canceled) {
        const asset = result.assets[0];
        
        // Naviguer vers l'éditeur avec l'image sélectionnée
        navigation.navigate('StoryEditor', {
          mediaUri: asset.uri,
          mediaType: 'photo'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection depuis la galerie:', error);
      Alert.alert('Erreur', 'Échec de la sélection de photo depuis la galerie. Veuillez réessayer.');
    }
  };
  
  const handleClose = () => {
    if (returnToScreen === 'Friends') {
      navigation.navigate('Friends');
    } else {
      navigation.goBack();
    }
  };
  
  // Si les autorisations ne sont pas encore accordées
  if (hasCameraPermission === null) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="photo-camera" size={60} color="#FFF" />
          <Text style={styles.permissionText}>Demande d'autorisation de la caméra...</Text>
          <ActivityIndicator size="large" color="#0095f6" style={styles.permissionLoader} />
        </View>
      </View>
    );
  }
  
  // Si les autorisations sont refusées
  if (hasCameraPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="no-photography" size={60} color="#FFF" />
          <Text style={styles.permissionText}>Accès à la caméra refusé</Text>
          <Text style={styles.permissionSubtext}>
            Veuillez autoriser l'accès à la caméra dans les paramètres de votre appareil pour utiliser cette fonctionnalité.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleClose}>
            <Text style={styles.permissionButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.cameraContainer}>
        {/* Caméra */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          enableTorch={flashMode === 'on'}
          onCameraReady={() => console.log('Caméra prête')}
        />
        
        {/* Flash overlay animation */}
        <Animated.View 
          style={[
            styles.flashOverlay,
            { opacity: flashAnimation }
          ]} 
          pointerEvents="none"
        />
        
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ opacity: camButtonsOpacity }}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>PHOTO</Text>
          </View>
          
          <Animated.View style={{ opacity: camButtonsOpacity }}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={toggleFlashMode}
            >
              <MaterialIcons name={getFlashIcon()} size={26} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Contrôles du bas */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <Animated.View style={{ opacity: camButtonsOpacity }}>
              <TouchableOpacity
                style={styles.sideControl}
                onPress={pickFromGallery}
                disabled={isProcessing}
              >
                <MaterialIcons name="photo-library" size={26} color="#FFF" />
                {lastPhotoUri && (
                  <Image 
                    source={{ uri: lastPhotoUri }}
                    style={styles.galleryThumbnail}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.captureButtonContainer,
                {
                  transform: [{ scale: captureButtonScale }],
                  opacity: captureButtonOpacity
                }
              ]}
            >
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                activeOpacity={0.7}
                disabled={isProcessing}
              />
            </Animated.View>
            
            <Animated.View style={{ opacity: camButtonsOpacity }}>
              <TouchableOpacity 
                style={styles.sideControl} 
                onPress={toggleCameraType}
                disabled={isProcessing}
              >
                <Ionicons name="camera-reverse" size={32} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {/* Petit texte d'aide */}
          <Text style={styles.hintText}>
            Appuyez pour prendre une photo
          </Text>
        </View>
        
        {/* Overlay de traitement */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
  },
  permissionLoader: {
    marginTop: 24,
  },
  permissionSubtext: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 32,
    backgroundColor: '#0095f6',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerCenter: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 16,
  },
  sideControl: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  captureButtonContainer: {
    width: CAPTURE_SIZE + 10,
    height: CAPTURE_SIZE + 10,
    borderRadius: (CAPTURE_SIZE + 10) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: CAPTURE_SIZE / 2,
    backgroundColor: '#FFF',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  hintText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  galleryThumbnail: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFF',
    opacity: 0.7,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default StoryCamera;