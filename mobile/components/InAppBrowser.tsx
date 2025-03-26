import React, { useState, useRef } from 'react';
import { 
  Modal, 
  SafeAreaView, 
  TouchableOpacity, 
  View, 
  Text, 
  StyleSheet,
  TextInput,
  Share,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, Feather } from '@expo/vector-icons';

interface InAppBrowserProps {
  visible: boolean;
  url: string;
  onClose: () => void;
}

const InAppBrowser: React.FC<InAppBrowserProps> = ({ visible, url, onClose }) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

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
          onLoadEnd={() => setIsLoading(false)}
        />
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
});

export default InAppBrowser;