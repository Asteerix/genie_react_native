import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const ResetDataScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Options de réinitialisation des données
  const [resetOptions, setResetOptions] = useState({
    events: false,
    wishlists: false,
    friends: false,
    messages: false,
    preferences: false
  });

  const toggleOption = (key: keyof typeof resetOptions) => {
    setResetOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const anyOptionSelected = Object.values(resetOptions).some(val => val);

  const handleResetData = () => {
    // Si aucune option n'est sélectionnée, afficher un message
    if (!anyOptionSelected) {
      Alert.alert(
        "Aucune option sélectionnée",
        "Veuillez sélectionner au moins une option à réinitialiser.",
        [{ text: "OK" }]
      );
      return;
    }

    // Demander confirmation avant de réinitialiser
    Alert.alert(
      "Réinitialiser les données",
      "Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Réinitialiser", 
          style: "destructive",
          onPress: () => performReset() 
        }
      ]
    );
  };

  const performReset = async () => {
    try {
      setIsLoading(true);
      
      // Simuler la réinitialisation des données avec un délai
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Ici, vous implémenteriez la réinitialisation réelle des données
      // selon les options sélectionnées
      
      setIsLoading(false);
      
      // Afficher un message de confirmation
      Alert.alert(
        "Données réinitialisées",
        "Les données sélectionnées ont été réinitialisées avec succès.",
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      setIsLoading(false);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la réinitialisation des données.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réinitialiser les données</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={32} color="#FF9500" />
          <Text style={styles.warningText}>
            La réinitialisation des données est irréversible. Assurez-vous de vouloir continuer avant de confirmer.
          </Text>
        </View>
        
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Sélectionnez les données à réinitialiser :</Text>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('events')}
          >
            <Text style={styles.optionLabel}>Événements</Text>
            <Switch
              value={resetOptions.events}
              onValueChange={() => toggleOption('events')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('wishlists')}
          >
            <Text style={styles.optionLabel}>Listes de souhaits</Text>
            <Switch
              value={resetOptions.wishlists}
              onValueChange={() => toggleOption('wishlists')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('friends')}
          >
            <Text style={styles.optionLabel}>Amis</Text>
            <Switch
              value={resetOptions.friends}
              onValueChange={() => toggleOption('friends')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('messages')}
          >
            <Text style={styles.optionLabel}>Messages</Text>
            <Switch
              value={resetOptions.messages}
              onValueChange={() => toggleOption('messages')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => toggleOption('preferences')}
          >
            <Text style={styles.optionLabel}>Préférences</Text>
            <Switch
              value={resetOptions.preferences}
              onValueChange={() => toggleOption('preferences')}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.resetButton, 
            !anyOptionSelected && styles.resetButtonDisabled
          ]}
          onPress={handleResetData}
          disabled={!anyOptionSelected || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={22} color="white" />
              <Text style={styles.resetButtonText}>Réinitialiser les données</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholderRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  warningContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#8B4513',
    lineHeight: 22,
  },
  optionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  resetButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  resetButtonDisabled: {
    backgroundColor: '#FFB3B0',
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetDataScreen;