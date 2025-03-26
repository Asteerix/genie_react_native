import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type BankAccountDetailScreenRouteProp = RouteProp<RootStackParamList, 'BankAccountDetail'>;

const BankAccountDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<BankAccountDetailScreenRouteProp>();
  
  const { account, isEditing = false } = route.params || {};
  
  // États pour les champs du formulaire
  const [bankName, setBankName] = useState(account?.bankName || '');
  const [ownerName, setOwnerName] = useState(account?.ownerName || '');
  const [iban, setIban] = useState(account?.iban || '');
  const [bic, setBic] = useState(account?.bic || '');
  const [editMode, setEditMode] = useState(isEditing || !account);
  
  // Validation des champs
  const [errors, setErrors] = useState({
    bankName: '',
    ownerName: '',
    iban: '',
    bic: ''
  });
  
  // Formatage de l'IBAN avec des espaces tous les 4 caractères
  const formatIban = (value: string) => {
    // Supprimer tous les espaces existants
    const cleanedValue = value.replace(/\s/g, '');
    // Ajouter un espace tous les 4 caractères
    return cleanedValue.replace(/(.{4})/g, '$1 ').trim();
  };
  
  // Gestion de la modification de l'IBAN
  const handleIbanChange = (text: string) => {
    // Ne conserver que les lettres et les chiffres
    const sanitizedText = text.replace(/[^A-Za-z0-9\s]/g, '').toUpperCase();
    setIban(formatIban(sanitizedText));
  };
  
  // Validation des champs
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      bankName: '',
      ownerName: '',
      iban: '',
      bic: ''
    };
    
    // Valider le nom de la banque
    if (!bankName.trim()) {
      newErrors.bankName = 'Le nom de la banque est requis';
      isValid = false;
    }
    
    // Valider le nom du bénéficiaire
    if (!ownerName.trim()) {
      newErrors.ownerName = 'Le nom du bénéficiaire est requis';
      isValid = false;
    }
    
    // Valider l'IBAN (version simplifiée)
    const cleanedIban = iban.replace(/\s/g, '');
    if (!cleanedIban) {
      newErrors.iban = 'L\'IBAN est requis';
      isValid = false;
    } else if (cleanedIban.length < 14 || cleanedIban.length > 34) {
      newErrors.iban = 'L\'IBAN doit contenir entre 14 et 34 caractères';
      isValid = false;
    }
    
    // Valider le BIC (version simplifiée)
    if (!bic.trim()) {
      newErrors.bic = 'Le BIC est requis';
      isValid = false;
    } else if (bic.trim().length < 8 || bic.trim().length > 11) {
      newErrors.bic = 'Le BIC doit contenir entre 8 et 11 caractères';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Gestion de la sauvegarde
  const handleSave = () => {
    if (validateForm()) {
      // Créer l'objet de compte bancaire à sauvegarder
      const updatedAccount = {
        id: account?.id || Math.random().toString(36).substring(7),
        bankName,
        ownerName,
        iban: iban.replace(/\s/g, ''),
        bic
      };
      
      // En production, vous enverriez ces données à une API
      // Pour l'instant, on simule une sauvegarde réussie
      if (account) {
        // Mode édition
        Alert.alert(
          "Compte mis à jour",
          "Votre compte bancaire a été mis à jour avec succès.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        // Mode création
        Alert.alert(
          "Compte ajouté",
          "Votre nouveau compte bancaire a été ajouté avec succès.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }
  };
  
  // Gestion du transfert
  const handleTransfer = () => {
    if (validateForm()) {
      const accountToTransfer = {
        id: account?.id || Math.random().toString(36).substring(7),
        bankName,
        ownerName,
        iban: iban.replace(/\s/g, ''),
        bic
      };
      
      navigation.navigate('BankTransfer', { account: accountToTransfer });
    }
  };
  
  // Gestion de la suppression
  const handleDelete = () => {
    Alert.alert(
      "Supprimer le compte",
      "Êtes-vous sûr de vouloir supprimer ce compte bancaire ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => {
            // En production, vous enverriez une requête à une API
            // Pour l'instant, on simule une suppression réussie
            Alert.alert(
              "Compte supprimé",
              "Votre compte bancaire a été supprimé avec succès.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        {/* Header avec bouton de retour et titre */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {account ? (editMode ? 'Modifier le compte' : bankName) : 'Ajouter un compte'}
          </Text>
          {account && !editMode && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditMode(true)}
            >
              <Ionicons name="pencil" size={24} color="#4285F4" />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView style={styles.content}>
          {/* Formulaire */}
          <View style={styles.formContainer}>
            {/* Nom de la banque */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Banque</Text>
              <TextInput
                style={[
                  styles.input,
                  editMode ? styles.inputEditable : styles.inputReadOnly,
                  errors.bankName ? styles.inputError : null
                ]}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Ex: LCL, Revolut, BNP Paribas..."
                editable={editMode}
              />
              {errors.bankName ? <Text style={styles.errorText}>{errors.bankName}</Text> : null}
            </View>
            
            {/* Nom du bénéficiaire */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bénéficiaire</Text>
              <TextInput
                style={[
                  styles.input,
                  editMode ? styles.inputEditable : styles.inputReadOnly,
                  errors.ownerName ? styles.inputError : null
                ]}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Prénom et nom du titulaire du compte"
                editable={editMode}
              />
              {errors.ownerName ? <Text style={styles.errorText}>{errors.ownerName}</Text> : null}
            </View>
            
            {/* IBAN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IBAN</Text>
              <TextInput
                style={[
                  styles.input,
                  editMode ? styles.inputEditable : styles.inputReadOnly,
                  errors.iban ? styles.inputError : null
                ]}
                value={iban}
                onChangeText={handleIbanChange}
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                autoCapitalize="characters"
                editable={editMode}
              />
              {errors.iban ? <Text style={styles.errorText}>{errors.iban}</Text> : null}
            </View>
            
            {/* BIC */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BIC (ou SWIFT)</Text>
              <TextInput
                style={[
                  styles.input,
                  editMode ? styles.inputEditable : styles.inputReadOnly,
                  errors.bic ? styles.inputError : null
                ]}
                value={bic}
                onChangeText={(text) => setBic(text.toUpperCase())}
                placeholder="Ex: LCLFR24"
                autoCapitalize="characters"
                editable={editMode}
              />
              {errors.bic ? <Text style={styles.errorText}>{errors.bic}</Text> : null}
            </View>
          </View>
          
          {/* Boutons d'action en mode édition */}
          {editMode && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
              
              {account && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Espace en bas pour éviter que le contenu soit caché */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Bouton fixe en bas en mode lecture */}
        {!editMode && account && (
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleTransfer}
            >
              <Text style={styles.continueButtonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
    position: 'absolute',
    left: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    right: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 56,
    borderRadius: 10,
    fontSize: 16,
    paddingHorizontal: 16,
  },
  inputEditable: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputReadOnly: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  actionButtonsContainer: {
    marginVertical: 20,
  },
  saveButton: {
    backgroundColor: '#4285F4',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: 'white',
  },
  continueButton: {
    backgroundColor: 'black',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BankAccountDetailScreen;