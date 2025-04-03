import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../auth/context/AuthContext'; // Importer useAuth
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EditUsernameNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditUsernameScreen'>;

const EditUsernameScreen = () => {
  const navigation = useNavigation<EditUsernameNavigationProp>();
  const { user, updateUsername } = useAuth(); // Récupérer user et la future fonction updateUsername
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState(user?.username || ''); // Initialiser avec le username actuel
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour le champ si l'utilisateur change dans le contexte (peu probable mais bonne pratique)
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  const handleSave = useCallback(async () => {
    if (!username.trim()) {
      setError('Le nom d\'utilisateur ne peut pas être vide.');
      return;
    }
    // Ajouter d'autres validations si nécessaire (longueur, caractères autorisés, etc.)
    // Exemple : Vérifier si le nom d'utilisateur contient des espaces
    if (/\s/.test(username)) {
        setError('Le nom d\'utilisateur ne peut pas contenir d\'espaces.');
        return;
    }
    // Exemple : Longueur minimale
    if (username.length < 3) {
        setError('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
        return;
    }

    if (username === user?.username) {
      // Pas de changement, on peut simplement revenir en arrière
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Appeler la fonction de mise à jour du contexte (à implémenter)
      if (updateUsername) { // Vérifier si la fonction existe
        await updateUsername(username.trim());
        Alert.alert("Succès", "Nom d'utilisateur mis à jour.");
        navigation.goBack();
      } else {
          throw new Error("La fonction de mise à jour du nom d'utilisateur n'est pas disponible.");
      }
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du nom d'utilisateur:", err);
      setError(err.message || 'Une erreur est survenue.');
      Alert.alert("Erreur", err.message || 'Impossible de mettre à jour le nom d\'utilisateur.');
    } finally {
      setIsLoading(false);
    }
  }, [username, user?.username, updateUsername, navigation]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.flex}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={isLoading}
              >
                <Ionicons name="chevron-back" size={28} color={isLoading ? "#CCC" : "#000"} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Nom d'utilisateur</Text>
              {/* Placeholder pour centrer le titre */}
              <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
              <Text style={styles.label}>Modifier votre nom d'utilisateur</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Votre nom d'utilisateur"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30} // Limiter la longueur
                  editable={!isLoading}
                />
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <Text style={styles.infoText}>
                Le nom d'utilisateur doit être unique et peut contenir des lettres, des chiffres, des points (.) et des tirets bas (_).
              </Text>

              <TouchableOpacity
                style={[styles.saveButton, (isLoading || !username.trim() || username === user?.username) && styles.disabledButton]}
                onPress={handleSave}
                disabled={isLoading || !username.trim() || username === user?.username}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 38, // Largeur approx du bouton retour + padding
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 50,
  },
  atSymbol: {
    fontSize: 18,
    color: '#888',
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 10,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 'auto', // Pousse le bouton vers le bas
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
});

export default EditUsernameScreen;