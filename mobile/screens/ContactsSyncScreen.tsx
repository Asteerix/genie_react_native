import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { findContactsOnApp, addFriendsFromContacts, AppContact } from '../api/contacts';

// Définition du type de navigation
type ContactsSyncScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Interface pour les contacts utilisés dans l'UI
interface UIContact extends AppContact {
  isAdded: boolean;
}

const ContactsSyncScreen: React.FC = () => {
  const navigation = useNavigation<ContactsSyncScreenNavigationProp>();
  const [contacts, setContacts] = useState<UIContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestContactsPermission();
  }, []);

  // Demander la permission d'accéder aux contacts
  const requestContactsPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
        
        // Charger les vrais contacts du téléphone
        await loadPhoneContacts();
      } else {
        setPermissionGranted(false);
        setIsLoading(false);
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin d'accéder à vos contacts pour vous aider à trouver vos amis. Vous pouvez modifier ce paramètre dans les réglages de votre téléphone."
        );
      }
    } catch (error) {
      console.error("Erreur lors de la demande de permission:", error);
      setIsLoading(false);
      setError("Impossible d'accéder aux contacts");
      toast.error("Impossible d'accéder aux contacts");
    }
  };

  // Charger les contacts du téléphone et les comparer avec la base de données
  const loadPhoneContacts = async () => {
    try {
      setIsSyncing(true);
      
      // Récupérer les contacts du téléphone
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name]
      });
      
      if (data.length > 0) {
        // Extraire les numéros de téléphone
        const phoneNumbers = data
          .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .map(contact => contact.phoneNumbers![0].number!)
          .filter(Boolean);
        
        // Envoyer les numéros au serveur pour trouver les contacts dans l'app
        const response = await findContactsOnApp(phoneNumbers);
        
        if (response.data) {
          // Transformer les contacts de l'API en contacts UI
          const uiContacts: UIContact[] = response.data.map(contact => ({
            ...contact,
            isAdded: false
          }));
          
          setContacts(uiContacts);
        } else if (response.error) {
          console.error("Erreur API:", response.error);
          setError("Erreur lors de la récupération des contacts");
          toast.error("Erreur lors de la récupération des contacts");
        }
      } else {
        setError("Aucun contact trouvé sur votre téléphone");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des contacts:", error);
      setError("Erreur lors du chargement des contacts");
      toast.error("Erreur lors du chargement des contacts");
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Ajouter un contact comme ami
  const handleAddFriend = (id: string) => {
    setContacts(
      contacts.map(contact => 
        contact.id === id 
          ? { ...contact, isAdded: !contact.isAdded } 
          : contact
      )
    );
    
    // Feedback pour l'utilisateur
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      if (!contact.isAdded) {
        toast.success(`${contact.name} ajouté(e) !`);
      } else {
        toast.info(`${contact.name} retiré(e)`);
      }
    }
  };

  // Naviguer vers l'écran d'accueil après avoir sauvegardé les amis
  const handleContinue = async () => {
    try {
      // Obtenir les amis ajoutés
      const addedFriends = contacts.filter(contact => contact.isAdded);
      
      if (addedFriends.length > 0) {
        setIsSyncing(true);
        
        // Enregistrer les amis dans la base de données
        const userIds = addedFriends.map(friend => friend.id);
        const response = await addFriendsFromContacts(userIds);
        
        if (response.error) {
          console.error("Erreur lors de l'ajout des amis:", response.error);
          toast.error("Erreur lors de l'ajout des amis");
          setIsSyncing(false);
          return;
        }
        
        toast.success("Amis ajoutés avec succès !");
      }
      
      // Naviguer vers l'écran des comptes gérés
      navigation.reset({
        index: 0,
        routes: [{ name: 'ManagedAccountsList' }],
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des amis:", error);
      toast.error("Erreur lors de la sauvegarde des amis");
      setIsSyncing(false);
    }
  };

  // Rendu d'un contact individuel
  const renderContact = ({ item }: { item: UIContact }) => (
    <View style={styles.contactItem}>
      <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactUsername}>{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.addButton, item.isAdded && styles.addedButton]} 
        onPress={() => handleAddFriend(item.id)}
      >
        <Ionicons 
          name={item.isAdded ? "checkmark" : "add"} 
          size={24} 
          color={item.isAdded ? "#000" : "#000"} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ajouter mes amis</Text>
        <Text style={styles.subtitle}>
          Ajoute tes amis et familles déjà présentes sur l'application.
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Recherche de contacts...</Text>
          </View>
        ) : !permissionGranted ? (
          <View style={styles.noPermissionContainer}>
            <Ionicons name="lock-closed" size={50} color="#999" />
            <Text style={styles.noPermissionText}>
              Pour trouver vos amis, nous avons besoin d'accéder à vos contacts
            </Text>
            <TouchableOpacity 
              style={styles.requestPermissionButton}
              onPress={requestContactsPermission}
            >
              <Text style={styles.requestPermissionText}>
                Autoriser l'accès
              </Text>
            </TouchableOpacity>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.noContactsContainer}>
            <Ionicons name="people" size={50} color="#999" />
            <Text style={styles.noContactsText}>
              Aucun contact trouvé sur l'application
            </Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contactsList}
          />
        )}

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
  },
  contactsList: {
    paddingBottom: 100, // Espace pour le bouton continuer
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  contactUsername: {
    fontSize: 14,
    color: '#999',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  addedButton: {
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noPermissionText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  requestPermissionButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  requestPermissionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noContactsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noContactsText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ContactsSyncScreen;