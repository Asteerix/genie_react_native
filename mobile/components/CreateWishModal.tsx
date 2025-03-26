import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

interface CreateWishModalProps {
  visible: boolean;
  onClose: () => void;
}

const PLACEHOLDER_IMAGE = 'https://api.a0.dev/assets/image?text=add%20product%20image%20placeholder&aspect=1:1';

const CreateWishModal: React.FC<CreateWishModalProps> = ({
  visible,
  onClose,
}) => {
  const [webLink, setWebLink] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [details, setDetails] = useState('');
  const [image, setImage] = useState(PLACEHOLDER_IMAGE);

  const handleAddWish = () => {
    if (!title.trim()) {
      toast.error('Veuillez saisir un titre');
      return;
    }

    // Dans une vraie app, envoyez les données au backend
    console.log('Nouveau vœu:', {
      webLink,
      title,
      price,
      quantity,
      details,
      image,
    });

    toast.success('Vœu ajouté avec succès !');
    handleClose();
  };

  const handleClose = () => {
    setWebLink('');
    setTitle('');
    setPrice('');
    setQuantity('1');
    setDetails('');
    setImage(PLACEHOLDER_IMAGE);
    onClose();
  };

  const incrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    setQuantity((current + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    if (current > 1) {
      setQuantity((current - 1).toString());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Créer un vœu</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Web Link Input */}
          <View style={styles.linkContainer}>
            <TouchableOpacity style={styles.linkButton}>
              <Ionicons name="link" size={24} color="#666" />
              <Text style={styles.linkButtonText}>Coller un lien du web</Text>
            </TouchableOpacity>
          </View>

          {/* Tip Box */}
          <View style={styles.tipBox}>
            <View style={styles.tipHeader}>
              <Ionicons name="share" size={24} color="black" />
              <Image 
                source={{ uri: 'https://api.a0.dev/assets/image?text=app%20icon%20rounded&aspect=1:1' }}
                style={styles.appIcon}
              />
            </View>
            <Text style={styles.tipTitle}>Astuce :</Text>
            <Text style={styles.tipText}>
              Tu peux aussi appuyer sur le bouton de partage vers l'application Genie sur ton navigateur pour ajouter un article facilement.
            </Text>
            <TouchableOpacity style={styles.tipCloseButton}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Titre de l'article</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Par exemple : Chaussures Rouges"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfSection}>
              <Text style={styles.label}>Prix</Text>
              <View style={styles.priceContainer}>
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <Text style={styles.currency}>€</Text>
              </View>
            </View>

            <View style={styles.halfSection}>
              <Text style={styles.label}>Quantité</Text>
              <View style={styles.quantityContainer}>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <View style={styles.quantityButtons}>
                  <TouchableOpacity onPress={incrementQuantity}>
                    <Ionicons name="chevron-up" size={24} color="black" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={decrementQuantity}>
                    <Ionicons name="chevron-down" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Détails de l'article</Text>
            <TextInput
              style={[styles.input, styles.detailsInput]}
              value={details}
              onChangeText={setDetails}
              placeholder="Par exemple : Taille M, Couleur rouge..."
              placeholderTextColor="#999"
              multiline
            />
          </View>

          {/* Illustration Section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Illustration</Text>
            <TouchableOpacity style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
            </TouchableOpacity>
          </View>

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddWish}>
            <Ionicons name="heart-outline" size={24} color="white" />
            <Text style={styles.addButtonText}>Ajouter ce vœu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 24,
  },
  linkContainer: {
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    gap: 10,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#666',
  },
  tipBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    position: 'relative',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  appIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  halfSection: {
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  priceInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  currency: {
    fontSize: 16,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  quantityInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  quantityButtons: {
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    paddingHorizontal: 10,
  },
  detailsInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 25,
    padding: 16,
    gap: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateWishModal;