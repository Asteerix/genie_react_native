import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  SafeAreaView, 
  TouchableOpacity, 
  View, 
  Text, 
  StyleSheet,
  TextInput,
  Share,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

interface EnhancedInAppBrowserProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  mode: 'image' | 'link';
  onSelectImage?: (imageUrl: string) => void;
  onConfirmLink?: (url: string) => void;
}

const { width } = Dimensions.get('window');

const EnhancedInAppBrowser: React.FC<EnhancedInAppBrowserProps> = ({ 
  visible, 
  url, 
  onClose,
  mode,
  onSelectImage,
  onConfirmLink
}) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Extract all images from current page
  const extractImagesFromPage = () => {
    const injectedJavaScript = `
      (function() {
        const images = Array.from(document.querySelectorAll('img'))
          .map(img => {
            // Get original image URL when possible
            const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.src;
            // Get image dimensions
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            // Only include reasonably sized images (avoid icons, etc.)
            if (width > 100 && height > 100) {
              return src;
            }
            return null;
          })
          .filter(src => src !== null && src.startsWith('http'));
          
        // Also try to find background images in CSS
        const elements = document.querySelectorAll('*');
        const backgroundImages = Array.from(elements)
          .map(el => {
            const style = window.getComputedStyle(el);
            const background = style.backgroundImage;
            if (background && background !== 'none' && background.includes('url')) {
              // Extract URL from "url(...)" format
              const match = background.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/i);
              return match ? match[1] : null;
            }
            return null;
          })
          .filter(src => src !== null && src.startsWith('http'));
        
        // Combine and remove duplicates
        const allImages = [...new Set([...images, ...backgroundImages])];
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'IMAGES_EXTRACTED',
          images: allImages
        }));
        return true;
      })();
    `;
    
    webViewRef.current?.injectJavaScript(injectedJavaScript);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: currentUrl,
        url: currentUrl, // iOS only
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const handleBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'IMAGES_EXTRACTED') {
        console.log(`Found ${data.images.length} images on page`);
        setPageImages(data.images);
        
        if (data.images.length > 0 && mode === 'image') {
          setShowImageSelector(true);
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // When page is loaded, extract images if in image mode
  const handlePageLoad = () => {
    setIsLoading(false);
    if (mode === 'image') {
      setTimeout(() => {
        extractImagesFromPage();
      }, 1000); // Give the page a second to fully render
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirmImageSelection = () => {
    if (selectedImage && onSelectImage) {
      onSelectImage(selectedImage);
      setShowImageSelector(false);
      onClose();
    }
  };

  const handleConfirmLink = () => {
    if (onConfirmLink) {
      onConfirmLink(currentUrl);
      onClose();
    }
  };

  // Extraire le nom de domaine de l'URL
  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        {/* Header with address bar */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.addressBar}>
            <TextInput
              value={getDomainFromUrl(currentUrl)}
              editable={false}
              style={styles.addressInput}
            />
            {isLoading && (
              <View style={styles.loadingIndicator} />
            )}
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleRefresh}
          >
            <Feather name="rotate-cw" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Feather name="share" size={20} color="#666" />
          </TouchableOpacity>
          
          {mode === 'image' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={extractImagesFromPage}
            >
              <Feather name="image" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Navigation actions */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={[styles.navButton, !canGoBack && styles.navButtonDisabled]} 
            onPress={handleBack}
            disabled={!canGoBack}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={canGoBack ? "black" : "#CCC"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* WebView */}
        <WebView 
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={(navState) => {
            setCurrentUrl(navState.url);
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={handlePageLoad}
          onMessage={handleWebViewMessage}
        />
        
        {/* Confirmation button for link mode */}
        {mode === 'link' && (
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmLink}
            >
              <Text style={styles.confirmButtonText}>
                Utiliser ce lien
              </Text>
              <MaterialIcons name="check-circle" size={22} color="white" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Image selector modal */}
        {showImageSelector && (
          <View style={styles.imageSelectorContainer}>
            <View style={styles.imageSelectorHeader}>
              <Text style={styles.imageSelectorTitle}>
                Sélectionnez une image ({pageImages.length} trouvées)
              </Text>
              <TouchableOpacity 
                onPress={() => setShowImageSelector(false)}
                style={styles.imageSelectorCloseButton}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            
            {pageImages.length === 0 ? (
              <View style={styles.noImagesContainer}>
                <Text style={styles.noImagesText}>
                  Aucune image trouvée sur cette page
                </Text>
                <TouchableOpacity 
                  style={styles.extractAgainButton}
                  onPress={extractImagesFromPage}
                >
                  <Text style={styles.extractAgainText}>
                    Réessayer
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={pageImages}
                numColumns={2}
                keyExtractor={(item, index) => `image-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.imageItem, 
                      selectedImage === item && styles.selectedImageItem
                    ]}
                    onPress={() => handleSelectImage(item)}
                  >
                    <Image 
                      source={{ uri: item }} 
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    {selectedImage === item && (
                      <View style={styles.selectedImageOverlay}>
                        <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.imageGridContainer}
              />
            )}
            
            <View style={styles.imageSelectorActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowImageSelector(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.confirmImageButton,
                  !selectedImage && styles.disabledButton
                ]}
                onPress={handleConfirmImageSelection}
                disabled={!selectedImage}
              >
                <Text style={styles.confirmImageButtonText}>
                  Utiliser cette image
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
    backgroundColor: '#FFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 8,
    height: 36,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  loadingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  webview: {
    flex: 1,
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  imageSelectorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  imageSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imageSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageSelectorCloseButton: {
    padding: 4,
  },
  imageGridContainer: {
    padding: 8,
  },
  imageItem: {
    width: (width - 48) / 2,
    height: 150,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedImageItem: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  selectedImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
  },
  noImagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noImagesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  extractAgainButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  extractAgainText: {
    color: '#333',
    fontWeight: '500',
  },
  imageSelectorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmImageButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  confirmImageButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default EnhancedInAppBrowser;