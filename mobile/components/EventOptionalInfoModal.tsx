import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Switch,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Event, EventParticipant, EventLocation } from '../api/events';
import { useEvents } from '../context/EventContext'; // Importer useEvents
import AddAdminModal from './AddAdminModal'; // Garder l'import si utilisé

interface Admin {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

// Type pour les paramètres de la route
type EventOptionalInfoRouteProp = RouteProp<RootStackParamList, 'EventOptionalInfoModal'>;

// Type pour la navigation
type EventOptionalInfoNavigationProp = StackNavigationProp<RootStackParamList>;

const EventOptionalInfoModal = () => {
  const navigation = useNavigation<EventOptionalInfoNavigationProp>();
  const route = useRoute<EventOptionalInfoRouteProp>();

  const eventDataFromParams = route.params?.eventData || {};
  const isDraft = route.params?.isDraft; // Récupérer si c'est un brouillon
  const draftId = route.params?.draftId; // Récupérer l'ID du brouillon
  const isIndividual = (eventDataFromParams as any)['type'] === 'individuel'; // Déterminer si c'est individuel

  // États pour les options, initialisés depuis les params
  const [includeMoneyGoal, setIncludeMoneyGoal] = useState(!!(eventDataFromParams as any)['moneyGoalAmount']);
  const [moneyGoalAmount, setMoneyGoalAmount] = useState((eventDataFromParams as any)['moneyGoalAmount'] || '0€');
  const [includeLocation, setIncludeLocation] = useState(!!(eventDataFromParams as any)['location']?.address);
  const [address, setAddress] = useState((eventDataFromParams as any)['location']?.address || '');
  const [city, setCity] = useState((eventDataFromParams as any)['location']?.city || '');
  const [postalCode, setPostalCode] = useState((eventDataFromParams as any)['location']?.postalCode || '');
  const [apartment, setApartment] = useState((eventDataFromParams as any)['location']?.apartment || '');
  const [includeMessage, setIncludeMessage] = useState(!!(eventDataFromParams as any)['description']);
  const [invitationMessage, setInvitationMessage] = useState((eventDataFromParams as any)['description'] || '');
  const [includeAdmins, setIncludeAdmins] = useState(
    !!(eventDataFromParams as any)['participants']?.some((p: EventParticipant) => p.role === 'admin')
  );
  // Initialiser les admins depuis les participants (à adapter selon la structure réelle)
  const [admins, setAdmins] = useState<Admin[]>(
    (eventDataFromParams as any)['participants']
      ?.filter((p: EventParticipant) => p.role === 'admin')
      .map((p: EventParticipant) => ({ id: p.userId, name: 'Admin Name', username: 'adminuser', avatar: '' })) // Placeholder
    || []
  );
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Références pour les champs de texte
  const invitationMessageRef = useRef<TextInput>(null);
  const moneyGoalAmountRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const { saveDraft } = useEvents(); // Obtenir saveDraft du contexte

  const handleAddAdmin = () => {
    setShowAddAdminModal(true);
  };

  const handleAddAdminComplete = (selectedAdmins: Admin[]) => {
    setAdmins(selectedAdmins);
    setShowAddAdminModal(false);
  };

  const handleRemoveAdmin = (adminId: string) => {
    setAdmins(admins.filter(admin => admin.id !== adminId));
  };

  // Helper pour obtenir les données actuelles de l'événement
  const getCurrentEventData = useCallback((): Partial<Event> => {
      const locationData: EventLocation | undefined = includeLocation ? {
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        // apartment: apartment.trim() || undefined,
      } : undefined;

      const adminParticipants: EventParticipant[] = includeAdmins
        ? admins.map(admin => ({
            userId: admin.id,
            role: 'admin',
            status: 'confirmed',
            invitedAt: new Date().toISOString(),
          }))
        : [];

      // Récupérer les participants de l'étape précédente (qui ont déjà la logique de limitation d'hôte appliquée)
      const participantsFromPreviousStep = (eventDataFromParams as Partial<Event>).participants || [];

      // Filtrer les participants existants pour exclure les admins (car on les rajoute)
      const existingNonAdminParticipants = participantsFromPreviousStep.filter(p => p.role !== 'admin');

      const params = eventDataFromParams as any;
      const eventType = ['collectif', 'individuel', 'special'].includes(params['type'] ?? '')
                        ? (params['type'] as 'collectif' | 'individuel' | 'special')
                        : 'individuel';

      return {
        ...eventDataFromParams,
        type: eventType,
        description: includeMessage ? invitationMessage.trim() : undefined,
        location: locationData,
        // moneyGoal: includeMoneyGoal ? parseFloat(moneyGoalAmount.replace('€', '').replace(',', '.')) || 0 : undefined,
        // Combiner les participants non-admins existants (avec la bonne logique d'hôte) et les nouveaux admins
        participants: [...existingNonAdminParticipants, ...adminParticipants],
      };
  }, [
      eventDataFromParams, includeLocation, address, city, postalCode, apartment,
      includeAdmins, admins, includeMessage, invitationMessage, includeMoneyGoal, moneyGoalAmount
  ]);


  const handleContinue = useCallback(() => {
    const updatedEventData = getCurrentEventData(); // Utiliser le helper
    const locationData: EventLocation | undefined = includeLocation ? {
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      // apartment: apartment.trim() || undefined, // Ajouter si nécessaire
    } : undefined;

    const adminParticipants: EventParticipant[] = includeAdmins
      ? admins.map(admin => ({
          userId: admin.id,
          role: 'admin',
          status: 'confirmed',
          invitedAt: new Date().toISOString(),
        }))
      : [];

    const existingNonAdminParticipants = (eventDataFromParams as any)['participants']?.filter((p: EventParticipant) => p.role !== 'admin') || [];

    // Assurer que le type est correctement transmis
    const params = eventDataFromParams as any;
    const eventType = ['collectif', 'individuel', 'special'].includes(params['type'] ?? '')
                      ? (params['type'] as 'collectif' | 'individuel' | 'special')
                      : 'individuel'; // Défaut si invalide

    // Pas besoin de redéclarer updatedEventData

    // Passer aussi isDraft et draftId
    navigation.navigate('EventIllustration', { eventData: updatedEventData, isDraft, draftId });

  }, [getCurrentEventData, navigation, isDraft, draftId]); // Mettre à jour les dépendances

  // Modifié pour sauvegarder le brouillon avant de revenir
  const handleBack = useCallback(async () => {
    const currentData = getCurrentEventData();
    console.log("EventOptionalInfoModal: Saving draft on back...", currentData);
    try {
      await saveDraft(currentData, 'EventOptionalInfoModal', draftId);
    } catch (error) {
      console.error("EventOptionalInfoModal: Failed to save draft on back", error);
    }
    navigation.goBack();
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  // Modifié pour sauvegarder le brouillon avant de fermer
  const handleClose = useCallback(async () => {
    const currentData = getCurrentEventData();
    console.log("EventOptionalInfoModal: Saving draft on close...", currentData);
    try {
      await saveDraft(currentData, 'EventOptionalInfoModal', draftId);
    } catch (error) {
      console.error("EventOptionalInfoModal: Failed to save draft on close", error);
    }
    navigation.popToTop();
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  // Effet pour focus le champ message quand le switch est activé
  useEffect(() => {
    if (includeMessage) {
      const timer = setTimeout(() => {
        invitationMessageRef.current?.focus();
      }, 100); // Petit délai pour assurer le rendu
      return () => clearTimeout(timer);
    }
  }, [includeMessage]);

  // Effet pour focus le champ objectif cagnotte quand le switch est activé
  useEffect(() => {
    if (includeMoneyGoal) {
      const timer = setTimeout(() => {
        moneyGoalAmountRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [includeMoneyGoal]);

  // Effet pour focus le champ adresse quand le switch est activé
  useEffect(() => {
    if (includeLocation) {
      const timer = setTimeout(() => {
        addressRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [includeLocation]);

  return (
    <SafeAreaView style={styles.container}>
       <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Informations facultatives</Text>
          <TouchableOpacity style={styles.helpButton}>
            <View style={styles.helpCircle}>
              <Text style={styles.helpText}>?</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.content}>
            {/* Description toggle */}
            <View style={styles.optionContainer}>
              <View style={styles.optionIconAndText}>
                <Ionicons name="mail-outline" size={24} color="black" style={styles.optionIcon} />
                <Text style={styles.optionText}>Message d'invitation</Text>
              </View>
              <Switch
                value={includeMessage} onValueChange={setIncludeMessage}
                trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }} thumbColor={includeMessage ? 'black' : 'white'}
                ios_backgroundColor="#E0E0E0" style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>
            {includeMessage && (
              <View style={styles.descriptionInputContainer}>
                <TextInput
                  ref={invitationMessageRef} // Assigner la référence
                  style={styles.descriptionInput} value={invitationMessage} onChangeText={setInvitationMessage}
                  placeholder="Ajouter un message..." multiline
                />
              </View>
            )}

            {/* Money Goal toggle */}
            {isIndividual && (
              <>
                <View style={styles.optionContainer}>
                  <View style={styles.optionIconAndText}>
                    <Ionicons name="trophy-outline" size={24} color="black" style={styles.optionIcon} />
                    <Text style={styles.optionText}>Objectif de cagnotte</Text>
                  </View>
                  <Switch
                    value={includeMoneyGoal} onValueChange={setIncludeMoneyGoal}
                    trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }} thumbColor={includeMoneyGoal ? 'black' : 'white'}
                    ios_backgroundColor="#E0E0E0" style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                  />
                </View>
                {includeMoneyGoal && (
                  <View style={styles.descriptionInputContainer}>
                    <TextInput
                      ref={moneyGoalAmountRef} // Assigner la référence
                      style={styles.descriptionInput} placeholder="0€" placeholderTextColor="#999"
                      value={moneyGoalAmount} onChangeText={setMoneyGoalAmount} keyboardType="numeric"
                    />
                  </View>
                )}
              </>
            )}

            {/* Location toggle */}
            <View style={styles.optionContainer}>
              <View style={styles.optionIconAndText}>
                <Ionicons name="location-outline" size={24} color="black" style={styles.optionIcon} />
                <Text style={styles.optionText}>Lieu d'événement</Text>
              </View>
              <Switch
                value={includeLocation} onValueChange={setIncludeLocation}
                trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }} thumbColor={includeLocation ? 'black' : 'white'}
                ios_backgroundColor="#E0E0E0" style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>
            {includeLocation && (
              <View style={styles.descriptionInputContainer}>
                <TextInput ref={addressRef} style={styles.descriptionInput} placeholder="Adresse" placeholderTextColor="#999" value={address} onChangeText={setAddress} />
                <View style={styles.rowInputs}>
                  <TextInput style={[styles.input, styles.halfWidthInput]} placeholder="Ville" placeholderTextColor="#999" value={city} onChangeText={setCity} />
                  <TextInput style={[styles.input, styles.halfWidthInput]} placeholder="Code Postal" placeholderTextColor="#999" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
                </View>
                <TextInput style={styles.descriptionInput} placeholder="Apt, Étg, etc." placeholderTextColor="#999" value={apartment} onChangeText={setApartment} />
              </View>
            )}

            {/* Admin toggle */}
            <View style={styles.optionContainer}>
              <View style={styles.optionIconAndText}>
                <Ionicons name="people-outline" size={24} color="black" style={styles.optionIcon} />
                <Text style={styles.optionText}>Ajouter des administrateurs</Text>
              </View>
              <Switch
                value={includeAdmins} onValueChange={setIncludeAdmins}
                trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }} thumbColor={includeAdmins ? 'black' : 'white'}
                ios_backgroundColor="#E0E0E0" style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>
            {includeAdmins && (
              <View style={styles.adminsContainer}>
                {admins.map(admin => (
                  <View key={admin.id} style={styles.adminItem}>
                    <View style={styles.adminInfo}>
                      <Image source={{ uri: admin.avatar }} style={styles.adminAvatar} />
                      <View style={styles.adminTextContainer}>
                        <Text style={styles.adminName}>{admin.name}</Text>
                        <Text style={styles.adminUsername}>{admin.username}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.removeAdminButton} onPress={() => handleRemoveAdmin(admin.id)}>
                      <AntDesign name="close" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addAdminButton} onPress={handleAddAdmin}>
                  <View style={styles.addAdminIconContainer}>
                    <Feather name="plus" size={24} color="#999" />
                  </View>
                  <Text style={styles.addAdminText}>Ajouter un admin</Text>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Admin Modal */}
        <AddAdminModal
          visible={showAddAdminModal}
          onClose={() => setShowAddAdminModal(false)}
          onBack={() => setShowAddAdminModal(false)}
          onComplete={handleAddAdminComplete}
          currentAdmins={admins}
        />

        {/* Navigation buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#666" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleContinue}>
            <Text style={styles.nextButtonText}>Suivant</Text>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  safeArea: { flex: 1, backgroundColor: 'white' },
  contentWrapper: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  helpButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  helpCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  helpText: { fontSize: 16, fontWeight: 'bold' },
  scrollContainer: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  optionContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 25, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 20 },
  optionIconAndText: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: { marginRight: 15 },
  optionText: { fontSize: 16, fontWeight: '500' },
  descriptionInputContainer: { backgroundColor: '#F9F9F9', borderRadius: 15, padding: 15, marginBottom: 20 },
  descriptionInput: { minHeight: 40, fontSize: 16, marginBottom: 10, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  input: { minHeight: 40, fontSize: 16, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  halfWidthInput: { width: '48%' },
  adminsContainer: { backgroundColor: '#F9F9F9', borderRadius: 15, padding: 10, marginBottom: 20 },
  adminItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 },
  adminInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  adminAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#E0E0E0' },
  adminTextContainer: { flex: 1 },
  adminName: { fontSize: 16, fontWeight: 'bold' },
  adminUsername: { fontSize: 14, color: '#999' },
  removeAdminButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  addAdminButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, marginTop: 5 },
  addAdminIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  addAdminText: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: 'white' },
  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0', borderRadius: 30, paddingVertical: 15, paddingHorizontal: 25 },
  backButtonText: { fontSize: 16, fontWeight: 'bold', color: '#666', marginLeft: 5 },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black', borderRadius: 30, paddingVertical: 15, paddingHorizontal: 25 },
  nextButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white', marginRight: 5 },
});

export default EventOptionalInfoModal;