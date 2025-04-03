import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PrivacyOption {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const ConfidentialityScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [privacyOptions, setPrivacyOptions] = useState<PrivacyOption[]>([
    {
      id: 'location',
      title: 'Partage de localisation',
      description: 'Permet à l\'application d\'accéder à votre position géographique',
      enabled: false,
    },
    {
      id: 'contacts',
      title: 'Synchronisation des contacts',
      description: 'Permet de trouver vos amis qui utilisent l\'application',
      enabled: true,
    },
    {
      id: 'analytics',
      title: 'Partage des données analytiques',
      description: 'Aide à améliorer l\'application grâce à vos usages anonymisés',
      enabled: true,
    },
    {
      id: 'personalization',
      title: 'Personnalisation',
      description: 'Personnalise votre expérience en fonction de vos activités',
      enabled: true,
    },
    {
      id: 'thirdParty',
      title: 'Partage avec des tiers',
      description: 'Autorise le partage de certaines données avec nos partenaires',
      enabled: false,
    },
    {
      id: 'advertising',
      title: 'Publicités personnalisées',
      description: 'Affiche des publicités en fonction de vos centres d\'intérêt',
      enabled: false,
    },
  ]);

  // Items de visibilité du profil
  const [profileVisibilityOptions, setProfileVisibilityOptions] = useState([
    {
      id: 'profileInfo',
      title: 'Informations du profil',
      value: 'Amis uniquement',
      options: ['Tout le monde', 'Amis uniquement', 'Personne'],
    },
    {
      id: 'wishlistVisibility',
      title: 'Visibilité des listes de souhaits',
      value: 'Amis uniquement',
      options: ['Tout le monde', 'Amis uniquement', 'Sur invitation'],
    },
    {
      id: 'activityStatus',
      title: 'Statut d\'activité',
      value: 'Activé',
      options: ['Activé', 'Désactivé'],
    },
  ]);

  const togglePrivacyOption = (id: string) => {
    setPrivacyOptions(
      privacyOptions.map(option => 
        option.id === id ? { ...option, enabled: !option.enabled } : option
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Privacy Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Paramètres de confidentialité</Text>
          
          {privacyOptions.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Switch
                trackColor={{ false: '#E0E0E0', true: '#000' }}
                thumbColor="#FFF"
                ios_backgroundColor="#E0E0E0"
                value={option.enabled}
                onValueChange={() => togglePrivacyOption(option.id)}
              />
            </View>
          ))}
        </View>

        {/* Profile Visibility */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Visibilité du profil</Text>
          
          {profileVisibilityOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.visibilityItem}
              onPress={() => {
                // Here you would show a modal or navigate to a selection screen
                console.log(`Change ${option.id} visibility`);
              }}
            >
              <View>
                <Text style={styles.visibilityTitle}>{option.title}</Text>
                <Text style={styles.visibilityValue}>{option.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Data Management */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Gestion des données</Text>
          
          <TouchableOpacity style={styles.dataItem}>
            <View style={styles.dataIconContainer}>
              <Ionicons name="download" size={24} color="#000" />
            </View>
            <View style={styles.dataTextContainer}>
              <Text style={styles.dataTitle}>Télécharger mes données</Text>
              <Text style={styles.dataDescription}>
                Recevez une copie de toutes vos données personnelles
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dataItem}>
            <View style={styles.dataIconContainer}>
              <Ionicons name="trash" size={24} color="#FF3B30" />
            </View>
            <View style={styles.dataTextContainer}>
              <Text style={styles.dataTitle}>Supprimer mes données</Text>
              <Text style={styles.dataDescription}>
                Supprimez définitivement vos données personnelles
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Cookies Information */}
        <View style={styles.cookiesContainer}>
          <Text style={styles.cookiesTitle}>À propos des cookies</Text>
          <Text style={styles.cookiesDescription}>
            Nous utilisons des cookies et technologies similaires pour améliorer votre expérience, 
            analyser notre trafic et personnaliser le contenu.
          </Text>
          <TouchableOpacity style={styles.cookiesPolicyButton}>
            <Text style={styles.cookiesPolicyText}>Voir la politique des cookies</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888',
  },
  visibilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  visibilityValue: {
    fontSize: 14,
    color: '#888',
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dataIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  dataTextContainer: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  dataDescription: {
    fontSize: 14,
    color: '#888',
  },
  cookiesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  cookiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cookiesDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  cookiesPolicyButton: {
    alignSelf: 'flex-start',
  },
  cookiesPolicyText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default ConfidentialityScreen;