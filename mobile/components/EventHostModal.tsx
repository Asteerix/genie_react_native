import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EventHostModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: (selectedHosts: string[]) => void;
}

const MANAGED_ACCOUNTS = [
  {
    id: '1',
    name: 'Camille Toulet',
    username: 'camilletoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20girl%20cartoon%20portrait&aspect=1:1&seed=123'
  },
  {
    id: '2',
    name: 'Noémie Sanchez',
    username: 'noemiesanchez',
    avatar: 'https://api.a0.dev/assets/image?text=young%20girl%20cartoon%20portrait&aspect=1:1&seed=456'
  },
  {
    id: '3',
    name: 'Raphaël Toulet',
    username: 'raphaeltoulet',
    avatar: 'https://api.a0.dev/assets/image?text=young%20boy%20cartoon%20portrait&aspect=1:1&seed=789'
  }
];

const EventHostModal: React.FC<EventHostModalProps> = ({
  visible,
  onClose,
  onBack,
  onContinue
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);

  const filteredAccounts = searchQuery
    ? MANAGED_ACCOUNTS.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MANAGED_ACCOUNTS;

  const handleToggleHost = (hostId: string) => {
    setSelectedHosts(prev => {
      if (prev.includes(hostId)) {
        return prev.filter(id => id !== hostId);
      }
      return [...prev, hostId];
    });
  };

  const handleContinue = () => {
    if (selectedHosts.length > 0) {
      onContinue(selectedHosts);
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
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Le(s) hôte(s) de l'événement</Text>
            <TouchableOpacity style={styles.helpButton}>
              <Ionicons name="help-circle-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Trouver un(e) ami(e)..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mes comptes gérés</Text>
            <ScrollView style={styles.accountsList}>
              {filteredAccounts.map(account => (
                <View key={account.id} style={styles.accountItem}>
                  <Image source={{ uri: account.avatar }} style={styles.avatar} />
                  <View style={styles.accountInfo}>
                    <Text style={styles.name}>{account.name}</Text>
                    <Text style={styles.username}>{account.username}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.selectButton,
                      selectedHosts.includes(account.id) && styles.selectedButton
                    ]}
                    onPress={() => handleToggleHost(account.id)}
                  >
                    <Ionicons 
                      name={selectedHosts.includes(account.id) ? "remove" : "add"} 
                      size={24} 
                      color="black" 
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={20} color="#666" />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.nextButton,
                selectedHosts.length === 0 && styles.disabledButton
              ]} 
              onPress={handleContinue}
              disabled={selectedHosts.length === 0}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
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
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
    padding: 5,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  accountsList: {
    flex: 1,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  accountInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    color: '#999',
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default EventHostModal;