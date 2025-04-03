import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  TextInput,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserProfile, updateUserProfile } from '../api/profile';
import { User } from '../api/types';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

type MyProfileScreenRouteProp = RouteProp<RootStackParamList, 'MyProfileScreen'>;

const MyProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MyProfileScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  // Vérifier si on vient de l'écran des paramètres
  const comesFromSettings = route.params?.fromSettings === true;
  
  // États pour les données du profil
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // État pour le sélecteur de date
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [genderDropdownVisible, setGenderDropdownVisible] = useState(false);
  
  // Options de genre
  const genderOptions = [
    { label: 'Masculin', value: 'male' },
    { label: 'Féminin', value: 'female' },
    { label: 'Non-binaire', value: 'non-binary' },
    { label: 'Préfère ne pas préciser', value: 'not-specified' }
  ];

  // Charger les informations du profil
  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUserProfile();
      if (response.data) {
        setUser(response.data);
        setUsername(response.data.username || '');
        setFirstName(response.data.firstName || '');
        setLastName(response.data.lastName || '');
        setGender(response.data.gender || '');
        if (response.data.birthDate) {
          setBirthDate(new Date(response.data.birthDate));
        }
        setAvatarUrl(response.data.avatarUrl || null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger le profil au montage du composant
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Sauvegarder les modifications du profil
  const saveProfile = async () => {
    setSaving(true);
    try {
      const updates = {
        firstName,
        lastName,
        gender,
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
        username: username || undefined,
        avatarUrl: avatarUrl || undefined
      };
      
      const response = await updateUserProfile(updates);
      
      if (response.error) {
        Alert.alert('Erreur', response.error);
      } else {
        Alert.alert(
          'Succès',
          'Votre profil a été mis à jour avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirection vers l'écran des paramètres
                navigation.navigate('Settings');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  // Sélection d'image depuis la galerie
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre autorisation pour accéder à vos photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Prendre une photo avec la caméra
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre autorisation pour accéder à votre caméra');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Gérer le changement de date
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Sélectionner un genre
  const selectGender = (value: string) => {
    setGender(value);
    setGenderDropdownVisible(false);
  };

  // Obtenir le libellé du genre
  const getGenderLabel = (value: string) => {
    const option = genderOptions.find(opt => opt.value === value);
    return option ? option.label : 'Sélectionner';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B56D2" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'ios' ? 50 : 20 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon profil</Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={80} color="#CCCCCC" />
              </View>
            )}
          </View>
          
          {/* Avatar modification options */}
          <TouchableOpacity 
            style={styles.avatarOptionButton}
            onPress={pickImage}
          >
            <View style={styles.avatarOptionIconContainer}>
              {avatarUrl && (
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.avatarOptionIcon} 
                />
              )}
            </View>
            <Text style={styles.avatarOptionText}>Modifier mon avatar</Text>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.avatarOptionButton}
            onPress={takePhoto}
          >
            <View style={styles.avatarOptionIconContainer}>
              <Ionicons name="camera" size={24} color="#000" />
            </View>
            <Text style={styles.avatarOptionText}>Photo depuis mon téléphone</Text>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>
        
        {/* Profile form */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Pseudonyme</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Entrez votre pseudonyme"
          />
          
          <Text style={styles.fieldLabel}>Nom</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Entrez votre nom"
          />
          
          <Text style={styles.fieldLabel}>Prénom</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Entrez votre prénom"
          />
          
          <Text style={styles.fieldLabel}>Date de naissance</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={birthDate ? styles.inputText : styles.placeholderText}>
              {birthDate ? formatDate(birthDate) : 'Entrez votre date de naissance'}
            </Text>
            <Ionicons name="calendar" size={24} color="#000" style={styles.inputIcon} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
          
          <Text style={styles.fieldLabel}>Genre</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setGenderDropdownVisible(!genderDropdownVisible)}
          >
            <Text style={gender ? styles.inputText : styles.placeholderText}>
              {gender ? getGenderLabel(gender) : 'Sélectionnez votre genre'}
            </Text>
            <Ionicons 
              name={genderDropdownVisible ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#000" 
              style={styles.inputIcon} 
            />
          </TouchableOpacity>
          
          {genderDropdownVisible && (
            <View style={styles.dropdown}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    gender === option.value && styles.selectedDropdownItem
                  ]}
                  onPress={() => selectGender(option.value)}
                >
                  <Text 
                    style={[
                      styles.dropdownItemText,
                      gender === option.value && styles.selectedDropdownItemText
                    ]}
                  >
                    {option.label}
                  </Text>
                  {gender === option.value && (
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Bouton de validation - uniquement si on accède depuis les paramètres */}
      {comesFromSettings && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Valider</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  placeholderRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderAvatar: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: '100%',
  },
  avatarOptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  avatarOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 60,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#AAA',
    flex: 1,
  },
  inputIcon: {
    marginLeft: 10,
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginTop: -10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDropdownItem: {
    backgroundColor: '#4B56D2',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownItemText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 30,
    margin: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyProfileScreen;