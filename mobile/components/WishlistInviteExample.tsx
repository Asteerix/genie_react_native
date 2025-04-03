import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import WishlistInviteModal from './WishlistInviteModal';
import { toast } from 'sonner-native';

const WishlistInviteExample = () => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Données d'exemple pour la wishlist
  const wishlistData = {
    title: 'Vacances Wishlist',
    inviter: 'audrianatoulet'
  };
  
  const handleAccept = () => {
    toast.success('Invitation acceptée !');
    setModalVisible(false);
    // Ici, vous pourriez naviguer vers la wishlist ou effectuer d'autres actions
  };
  
  const handleDecline = () => {
    toast.info('Invitation refusée');
    setModalVisible(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Exemple d'invitation à une liste de souhaits</Text>
        <Text style={styles.description}>
          Cliquez sur le bouton ci-dessous pour voir la modale d'invitation à une liste de souhaits.
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>Afficher l'invitation</Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal d'invitation */}
      <WishlistInviteModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAccept={handleAccept}
        onDecline={handleDecline}
        wishlistData={wishlistData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WishlistInviteExample;