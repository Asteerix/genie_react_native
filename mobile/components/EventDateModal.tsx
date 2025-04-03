import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  AccessibilityInfo,
  Animated,
  Vibration,
  StatusBar,
  ScrollView // Importer ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isValid, isBefore, isAfter, addDays, startOfDay, parseISO, isEqual } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Event } from '../api/events';
import { useEvents } from '../context/EventContext'; // Importer useEvents

// Type pour les paramètres de la route
type EventDateRouteProp = RouteProp<RootStackParamList, 'EventDateModal'>;

// Type pour la navigation
type EventDateNavigationProp = StackNavigationProp<RootStackParamList>;

// Configuration du thème - permet la personnalisation tout en fournissant des valeurs par défaut
const defaultTheme = {
  primaryColor: 'black',
  primaryTextColor: 'white',
  backgroundColor: 'white',
  surfaceColor: '#F0F0F0',
  disabledColor: '#999999',
  accentColor: '#333333',
  errorColor: '#FF3B30',
  successColor: '#34C759',
  textPrimary: '#333333',
  textSecondary: '#666666',
  borderRadius: 15,
};

const EventDateModal = () => {
  const navigation = useNavigation<EventDateNavigationProp>();
  const route = useRoute<EventDateRouteProp>();

  // Récupérer les données de l'événement des paramètres de la route
  const eventDataFromParams = route.params?.eventData || {};
  const isDraft = route.params?.isDraft; // Récupérer si c'est un brouillon
  const draftId = route.params?.draftId; // Récupérer l'ID du brouillon
  const initialStartDateString = (eventDataFromParams as any)['startDate'];
  const initialEndDateString = (eventDataFromParams as any)['endDate']; // Récupérer la date de fin initiale
  const initialStartDate = initialStartDateString && isValid(parseISO(initialStartDateString)) ? parseISO(initialStartDateString) : new Date();
  const initialEndDate = initialEndDateString && isValid(parseISO(initialEndDateString)) ? parseISO(initialEndDateString) : null; // Date de fin initiale (peut être null)
  const initialIncludeTime = !!(eventDataFromParams as any)['endDate'] && (eventDataFromParams as Partial<Event>).allDay === false; // Heure incluse si endDate existe ET allDay est explicitement false

  // Fusion du thème personnalisé avec le thème par défaut (si besoin de thème)
  const theme = { ...defaultTheme }; // Utiliser le thème par défaut pour l'instant

  // Marges de sécurité pour différents appareils
  const insets = useSafeAreaInsets();

  // État des dates avec validation
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(initialStartDate);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(initialEndDate); // État pour la date de fin
  const [isEndDateEnabled, setIsEndDateEnabled] = useState<boolean>(!!initialEndDate); // Activer si une date de fin initiale existe
  const [includeTime, setIncludeTime] = useState<boolean>(initialIncludeTime);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null); // Erreur pour la date de fin
  const [isLoading, setIsLoading] = useState(false);
  const { saveDraft } = useEvents(); // Obtenir saveDraft du contexte

  // Dates min/max (peuvent être passées en params si nécessaire)
  const minDate = new Date(); // Aujourd'hui
  const maxDate = addDays(new Date(), 365 * 3); // 3 ans max

  // État UI pour les sélecteurs
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [activePicker, setActivePicker] = useState<'start' | 'end'>('start'); // Savoir quel picker est actif

  // État d'accessibilité
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // Vérifier si le lecteur d'écran est activé pour les ajustements d'accessibilité
  useEffect(() => {
    const checkScreenReader = async () => {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(screenReaderEnabled);
    };
    checkScreenReader();
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setIsScreenReaderEnabled);
    return () => { subscription.remove(); };
  }, []);

  // Valider les dates chaque fois qu'elles changent
  useEffect(() => {
    validateStartDate(selectedStartDate);
    if (isEndDateEnabled && selectedEndDate) {
      validateEndDate(selectedEndDate, selectedStartDate);
    } else {
      setEndDateError(null); // Effacer l'erreur si la date de fin est désactivée ou nulle
    }
  }, [selectedStartDate, selectedEndDate, isEndDateEnabled, minDate, maxDate]);

  // Fonction de validation de date de début
  const validateStartDate = useCallback((date: Date) => {
    if (!isValid(date)) {
      setStartDateError('Date de début invalide');
      return false;
    }
    if (minDate && isBefore(date, startOfDay(minDate))) {
      setStartDateError(`La date doit être après aujourd'hui`);
      return false;
    }
    if (maxDate && isAfter(date, maxDate)) {
      setStartDateError(`La date doit être avant le ${format(maxDate, 'dd/MM/yyyy')}`);
      return false;
    }
    setStartDateError(null);
    return true;
  }, [minDate, maxDate]);

  // Fonction de validation de date de fin
  const validateEndDate = useCallback((endDate: Date, startDate: Date) => {
    if (!isValid(endDate)) {
      setEndDateError('Date de fin invalide');
      return false;
    }
    // La date de fin doit être égale ou postérieure à la date de début
    if (isBefore(startOfDay(endDate), startOfDay(startDate))) {
      setEndDateError('La date de fin doit être après ou le même jour que la date de début');
      return false;
    }
    // Si l'heure est incluse, vérifier que l'heure de fin est après l'heure de début si les jours sont les mêmes
    if (includeTime && isEqual(startOfDay(endDate), startOfDay(startDate)) && isBefore(endDate, startDate)) {
        setEndDateError('L\'heure de fin doit être après l\'heure de début pour le même jour');
        return false;
    }
    if (maxDate && isAfter(endDate, maxDate)) {
      setEndDateError(`La date de fin doit être avant le ${format(maxDate, 'dd/MM/yyyy')}`);
      return false;
    }
    setEndDateError(null);
    return true;
  }, [maxDate, includeTime]);


  // Valeurs formatées mémorisées pour l'affichage
  const formattedStartDateValues = useMemo(() => {
    try {
      return {
        dayName: format(selectedStartDate, 'EEEE', { locale: fr }).charAt(0).toUpperCase() + format(selectedStartDate, 'EEEE', { locale: fr }).slice(1),
        day: format(selectedStartDate, 'd'),
        month: format(selectedStartDate, 'MMMM', { locale: fr }),
        year: format(selectedStartDate, 'yyyy'),
        time: format(selectedStartDate, 'HH:mm', { locale: fr }),
        fullDate: format(selectedStartDate, 'EEEE d MMMM yyyy', { locale: fr })
      };
    } catch (error) {
      console.error('Erreur lors du formatage de la date de début:', error);
      return { dayName: '', day: '', month: '', year: '', time: '', fullDate: '' };
    }
  }, [selectedStartDate]);

  const formattedEndDateValues = useMemo(() => {
    if (!selectedEndDate) return null;
    try {
      return {
        dayName: format(selectedEndDate, 'EEEE', { locale: fr }).charAt(0).toUpperCase() + format(selectedEndDate, 'EEEE', { locale: fr }).slice(1),
        day: format(selectedEndDate, 'd'),
        month: format(selectedEndDate, 'MMMM', { locale: fr }),
        year: format(selectedEndDate, 'yyyy'),
        time: format(selectedEndDate, 'HH:mm', { locale: fr }),
        fullDate: format(selectedEndDate, 'EEEE d MMMM yyyy', { locale: fr })
      };
    } catch (error) {
      console.error('Erreur lors du formatage de la date de fin:', error);
      return null;
    }
  }, [selectedEndDate]);


  // Helper pour obtenir les données actuelles de l'événement
  const getCurrentEventData = useCallback((): Partial<Event> => {
      const params = eventDataFromParams as any;
      const eventType = ['collectif', 'individuel', 'special'].includes(params['type'] ?? '')
            ? (params['type'] as 'collectif' | 'individuel' | 'special')
            : 'individuel';

      return {
        ...eventDataFromParams,
        type: eventType,
        startDate: selectedStartDate.toISOString(),
        endDate: (isEndDateEnabled && selectedEndDate) ? selectedEndDate.toISOString() : undefined,
        allDay: !includeTime || !isEndDateEnabled,
      };
  }, [eventDataFromParams, selectedStartDate, selectedEndDate, isEndDateEnabled, includeTime]);

  // Gérer l'appui sur le bouton continuer
  const handleContinue = useCallback(() => {
    const isStartDateValid = validateStartDate(selectedStartDate);
    let isEndDateValid = true;
    if (isEndDateEnabled && selectedEndDate) {
      isEndDateValid = validateEndDate(selectedEndDate, selectedStartDate);
    }

    if (isStartDateValid && isEndDateValid) {
      if (Platform.OS === 'ios') Vibration.vibrate(10);

      const params = eventDataFromParams as any; // Utiliser 'as any' pour l'accès aux propriétés

      // Assurer que le type est correctement validé et transmis
      const eventType = ['collectif', 'individuel', 'special'].includes(params['type'] ?? '')
            ? (params['type'] as 'collectif' | 'individuel' | 'special')
            : 'individuel'; // Défaut si invalide

      const updatedEventData = getCurrentEventData(); // Utiliser le helper

      // Naviguer TOUJOURS vers EventOptionalInfoModal depuis EventDateModal
      // Passer aussi isDraft et draftId
      navigation.navigate('EventOptionalInfoModal', { eventData: updatedEventData, isDraft, draftId });
    }
  }, [validateStartDate, validateEndDate, getCurrentEventData, navigation, isDraft, draftId]); // Mettre à jour les dépendances

  // Gérer le changement de date ou d'heure depuis le sélecteur
  const handleDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date && isValid(date)) {
      const currentDate = activePicker === 'start' ? selectedStartDate : (selectedEndDate || selectedStartDate); // Utiliser startDate si endDate est null
      const newDate = new Date(currentDate);

      if (pickerMode === 'date') {
        newDate.setFullYear(date.getFullYear());
        newDate.setMonth(date.getMonth());
        newDate.setDate(date.getDate());
        // Si on change la date de début et que la date de fin est activée et avant la nouvelle date de début, ajuster la date de fin
        if (activePicker === 'start' && isEndDateEnabled && selectedEndDate && isBefore(startOfDay(selectedEndDate), startOfDay(newDate))) {
            const adjustedEndDate = new Date(newDate); // Copier la nouvelle date de début
            if (selectedEndDate) { // Garder l'heure de fin si elle existait
                adjustedEndDate.setHours(selectedEndDate.getHours());
                adjustedEndDate.setMinutes(selectedEndDate.getMinutes());
            }
            setSelectedEndDate(adjustedEndDate);
        }
        // Si on change la date de fin et qu'elle est avant la date de début, ajuster la date de fin (ne devrait pas arriver avec la validation mais sécurité)
        if (activePicker === 'end' && isBefore(startOfDay(newDate), startOfDay(selectedStartDate))) {
            const adjustedEndDate = new Date(selectedStartDate); // Copier la date de début
             if (selectedEndDate) { // Garder l'heure de fin si elle existait
                adjustedEndDate.setHours(selectedEndDate.getHours());
                adjustedEndDate.setMinutes(selectedEndDate.getMinutes());
            }
            setSelectedEndDate(adjustedEndDate);
        }

        if (Platform.OS === 'android' && includeTime) {
          setTimeout(() => { setPickerMode('time'); setShowPicker(true); }, 300);
        }
      } else if (pickerMode === 'time') {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
         // Si on change l'heure de début et que la date de fin est le même jour et avant, ajuster l'heure de fin
        if (activePicker === 'start' && isEndDateEnabled && selectedEndDate && isEqual(startOfDay(selectedEndDate), startOfDay(newDate)) && isBefore(selectedEndDate, newDate)) {
            const adjustedEndDate = new Date(newDate); // Copier la nouvelle date/heure de début
            setSelectedEndDate(adjustedEndDate);
        }
         // Si on change l'heure de fin et qu'elle est avant l'heure de début le même jour, ajuster (ne devrait pas arriver avec validation)
        if (activePicker === 'end' && isEqual(startOfDay(newDate), startOfDay(selectedStartDate)) && isBefore(newDate, selectedStartDate)) {
             const adjustedEndDate = new Date(selectedStartDate); // Copier la date/heure de début
             setSelectedEndDate(adjustedEndDate);
        }
      }

      if (activePicker === 'start') {
        setSelectedStartDate(newDate);
      } else {
        setSelectedEndDate(newDate);
      }
    }
  }, [pickerMode, selectedStartDate, selectedEndDate, includeTime, activePicker, isEndDateEnabled]);


  // Gérer l'activation/désactivation de l'heure
  const handleTimeToggle = useCallback((value: boolean) => {
    setIncludeTime(value);
    if (value && Platform.OS === 'android') {
      // Ouvrir le picker d'heure pour la date de début par défaut si l'heure est activée
      setTimeout(() => { setActivePicker('start'); setPickerMode('time'); setShowPicker(true); }, 300);
    }
    if (Platform.OS === 'ios') Vibration.vibrate(5);
  }, []);

  // Gérer l'activation/désactivation de la date de fin
  const handleEndDateToggle = useCallback((value: boolean) => {
    setIsEndDateEnabled(value);
    if (value && !selectedEndDate) {
      // Si activé et pas de date de fin, initialiser à la date de début
      setSelectedEndDate(new Date(selectedStartDate));
    } else if (!value) {
      setSelectedEndDate(null); // Réinitialiser si désactivé
      setEndDateError(null); // Effacer l'erreur
    }
    if (Platform.OS === 'ios') Vibration.vibrate(5);
  }, [selectedStartDate, selectedEndDate]);


  // Afficher le sélecteur de date ou d'heure
  const openPicker = useCallback((mode: 'date' | 'time', target: 'start' | 'end') => {
    Keyboard.dismiss();
    setActivePicker(target); // Définir quelle date on modifie
    setPickerMode(mode);
    setShowPicker(true);
  }, []);

  // Gérer le bouton retour
  // Modifié pour sauvegarder le brouillon avant de revenir
  const handleBack = useCallback(async () => {
    if (Platform.OS === 'ios') Vibration.vibrate(10);
    const currentData = getCurrentEventData();
    console.log("EventDateModal: Saving draft on back...", currentData);
    try {
      await saveDraft(currentData, 'EventDateModal', draftId);
    } catch (error) {
      console.error("EventDateModal: Failed to save draft on back", error);
    }
    navigation.goBack();
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  // Gérer le bouton fermer (X)
  // Modifié pour sauvegarder le brouillon avant de fermer
  const handleClose = useCallback(async () => {
    if (Platform.OS === 'ios') Vibration.vibrate(10);
    const currentData = getCurrentEventData();
    console.log("EventDateModal: Saving draft on close...", currentData);
    try {
      await saveDraft(currentData, 'EventDateModal', draftId);
    } catch (error) {
      console.error("EventDateModal: Failed to save draft on close", error);
    }
    navigation.popToTop(); // Revenir à EventsScreen
  }, [navigation, getCurrentEventData, saveDraft, draftId]); // Ajouter les dépendances

  // Rendu du sélecteur iOS
  const renderIOSPicker = () => {
    if (!showPicker || Platform.OS !== 'ios') return null;
    const dateToShow = activePicker === 'start' ? selectedStartDate : (selectedEndDate || selectedStartDate);
    const minPickerDate = activePicker === 'end' ? startOfDay(selectedStartDate) : minDate; // Date min pour le picker de fin

    return (
      <View style={styles.iosPickerContainer}>
        <View style={styles.iosPickerHeader}>
          <TouchableOpacity onPress={() => setShowPicker(false)} accessibilityRole="button" accessibilityLabel="Annuler">
            <Text style={styles.iosPickerCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.iosPickerTitle}>{pickerMode === 'date' ? 'Sélectionner la date' : 'Sélectionner l\'heure'}</Text>
          <TouchableOpacity onPress={() => setShowPicker(false)} accessibilityRole="button" accessibilityLabel="OK">
            <Text style={styles.iosPickerDone}>OK</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={dateToShow} mode={pickerMode} display="spinner" onChange={handleDateChange}
          locale="fr-FR" textColor={theme.textPrimary} style={styles.iosPicker}
          minimumDate={minPickerDate} // Utiliser la date min appropriée
          maximumDate={maxDate} is24Hour={true}
        />
      </View>
    );
  };

  // Rendu du sélecteur Android
  const renderAndroidPicker = () => {
    if (!showPicker || Platform.OS !== 'android') return null;
    const dateToShow = activePicker === 'start' ? selectedStartDate : (selectedEndDate || selectedStartDate);
    const minPickerDate = activePicker === 'end' ? startOfDay(selectedStartDate) : minDate; // Date min pour le picker de fin

    return (
      <DateTimePicker
        value={dateToShow} mode={pickerMode} display="default" onChange={handleDateChange}
        minimumDate={minPickerDate} // Utiliser la date min appropriée
        maximumDate={maxDate} is24Hour={true} locale="fr-FR"
      />
    );
  };

  // Styles créés dynamiquement
  const getStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundColor, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
    contentContainer: { flex: 1, backgroundColor: theme.backgroundColor },
  }), [theme, insets]);

  const hasError = !!startDateError || (isEndDateEnabled && !!endDateError);

  return (
    <SafeAreaView style={[styles.container, getStyles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.backgroundColor} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          {/* En-tête */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Fermer">
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.textPrimary }]} accessibilityRole="header">Date de l'événement</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Affichage de la date de début */}
            <Text style={styles.sectionTitle}>Date de début</Text>
            <View style={styles.dateMainContainer}>
              <Text style={[styles.dayNameText, { color: theme.accentColor }]} accessibilityRole="text" accessibilityLabel={`Jour : ${formattedStartDateValues.dayName}`}>
                {formattedStartDateValues.dayName}
              </Text>
              <TouchableWithoutFeedback onPress={() => openPicker('date', 'start')} accessibilityRole="button" accessibilityLabel="Ouvrir le sélecteur de date de début" accessibilityHint={`Date actuelle : ${formattedStartDateValues.fullDate}`}>
                <View style={styles.dateContainer}>
                  <View style={styles.dateRow}>
                    <View style={[styles.dateBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                      <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedStartDateValues.day}</Text>
                    </View>
                    <View style={[styles.dateBox, styles.monthBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                      <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedStartDateValues.month}</Text>
                    </View>
                    <View style={[styles.dateBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                      <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedStartDateValues.year}</Text>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
              {startDateError && <Text style={[styles.errorText, { color: theme.errorColor }]} accessibilityRole="alert">{startDateError}</Text>}
            </View>

            {/* Option d'heure */}
            <View style={[styles.timeOptionContainer, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
              <View style={styles.timeOptionRow}>
                <Ionicons name="time-outline" size={24} color={theme.textPrimary} />
                <Text style={[styles.timeOptionText, { color: theme.textPrimary }]} accessibilityLabel="Ajouter l'heure à l'événement">Ajouter l'heure</Text>
                <Switch
                  value={includeTime} onValueChange={handleTimeToggle}
                  trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }} thumbColor={includeTime ? theme.primaryColor : 'white'}
                  ios_backgroundColor="#E0E0E0" accessibilityRole="switch" accessibilityLabel="Inclure l'heure"
                  accessibilityState={{ checked: includeTime }} accessibilityHint="Active ou désactive la sélection de l'heure"
                />
              </View>
            </View>

            {/* Affichage de l'heure de début */}
            {includeTime && (
              <TouchableWithoutFeedback onPress={() => openPicker('time', 'start')} accessibilityRole="button" accessibilityLabel="Ouvrir le sélecteur d'heure de début" accessibilityHint={`Heure actuelle : ${formattedStartDateValues.time}`}>
                <View style={styles.timeContainer}>
                  <View style={styles.timeRow}>
                    <View style={[styles.timeBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                      <Text style={[styles.timeText, { color: theme.textPrimary }]}>{formattedStartDateValues.time.split(':')[0]}</Text>
                    </View>
                    <Text style={[styles.timeSeparator, { color: theme.textPrimary }]}>:</Text>
                    <View style={[styles.timeBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                      <Text style={[styles.timeText, { color: theme.textPrimary }]}>{formattedStartDateValues.time.split(':')[1]}</Text>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            )}

            {/* Option Date de Fin */}
            <View style={[styles.timeOptionContainer, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius, marginTop: 20 }]}>
              <View style={styles.timeOptionRow}>
                <Ionicons name="calendar-outline" size={24} color={theme.textPrimary} />
                <Text style={[styles.timeOptionText, { color: theme.textPrimary }]} accessibilityLabel="Ajouter une date de fin">Ajouter une date de fin</Text>
                <Switch
                  value={isEndDateEnabled} onValueChange={handleEndDateToggle}
                  trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }} thumbColor={isEndDateEnabled ? theme.primaryColor : 'white'}
                  ios_backgroundColor="#E0E0E0" accessibilityRole="switch" accessibilityLabel="Activer la date de fin"
                  accessibilityState={{ checked: isEndDateEnabled }} accessibilityHint="Permet de définir une date de fin pour l'événement"
                />
              </View>
            </View>

            {/* Affichage de la date de fin (si activée) */}
            {isEndDateEnabled && formattedEndDateValues && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Date de fin</Text>
                <View style={styles.dateMainContainer}>
                  <Text style={[styles.dayNameText, { color: theme.accentColor }]} accessibilityRole="text" accessibilityLabel={`Jour de fin : ${formattedEndDateValues.dayName}`}>
                    {formattedEndDateValues.dayName}
                  </Text>
                  <TouchableWithoutFeedback onPress={() => openPicker('date', 'end')} accessibilityRole="button" accessibilityLabel="Ouvrir le sélecteur de date de fin" accessibilityHint={`Date de fin actuelle : ${formattedEndDateValues.fullDate}`}>
                    <View style={styles.dateContainer}>
                      <View style={styles.dateRow}>
                        <View style={[styles.dateBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                          <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedEndDateValues.day}</Text>
                        </View>
                        <View style={[styles.dateBox, styles.monthBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                          <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedEndDateValues.month}</Text>
                        </View>
                        <View style={[styles.dateBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                          <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedEndDateValues.year}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                  {endDateError && <Text style={[styles.errorText, { color: theme.errorColor }]} accessibilityRole="alert">{endDateError}</Text>}
                </View>

                {/* Affichage de l'heure de fin (si heure incluse) */}
                {includeTime && (
                  <TouchableWithoutFeedback onPress={() => openPicker('time', 'end')} accessibilityRole="button" accessibilityLabel="Ouvrir le sélecteur d'heure de fin" accessibilityHint={`Heure de fin actuelle : ${formattedEndDateValues.time}`}>
                    <View style={styles.timeContainer}>
                      <View style={styles.timeRow}>
                        <View style={[styles.timeBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                          <Text style={[styles.timeText, { color: theme.textPrimary }]}>{formattedEndDateValues.time.split(':')[0]}</Text>
                        </View>
                        <Text style={[styles.timeSeparator, { color: theme.textPrimary }]}>:</Text>
                        <View style={[styles.timeBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                          <Text style={[styles.timeText, { color: theme.textPrimary }]}>{formattedEndDateValues.time.split(':')[1]}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              </>
            )}

          </ScrollView>

          {/* Rendu du sélecteur approprié */}
          {renderIOSPicker()}
          {renderAndroidPicker()}

          {/* Navigation inférieure */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[ styles.backButton, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius, opacity: isLoading ? 0.5 : 1 } ]}
              onPress={handleBack} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Retour"
              accessibilityHint="Revenir à l'étape précédente" accessibilityState={{ disabled: isLoading }}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
              <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ styles.nextButton, { backgroundColor: hasError ? theme.disabledColor : theme.primaryColor, borderRadius: theme.borderRadius, opacity: (isLoading || hasError) ? 0.5 : 1 } ]}
              onPress={handleContinue} disabled={isLoading || hasError} accessibilityRole="button" accessibilityLabel="Suivant"
              accessibilityHint="Passer à l'étape suivante" accessibilityState={{ disabled: isLoading || hasError, busy: isLoading }}
            >
              <Text style={[styles.nextButtonText, { color: theme.primaryTextColor }]}>{isLoading ? 'Chargement...' : 'Suivant'}</Text>
              {!isLoading && <Ionicons name="arrow-forward" size={20} color={theme.primaryTextColor} />}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

// Styles statiques (garder les styles existants et ajuster si nécessaire)
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'white' },
  contentContainer: { flex: 1 },
  content: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingHorizontal: 10 }, // Ajuster padding
  closeButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 40 }, // Ajuster pour correspondre au bouton close
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 15 },
  dateMainContainer: { alignItems: 'center', marginBottom: 25 }, // Moins de marge en bas
  dayNameText: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textTransform: 'capitalize' },
  dateContainer: { alignItems: 'center' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateBox: { backgroundColor: '#F0F0F0', borderRadius: 15, paddingVertical: 15, paddingHorizontal: 25, minWidth: 80, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  monthBox: { width: 140 },
  dateText: { fontSize: 16, fontWeight: '500' },
  errorText: { marginTop: 8, fontSize: 14, color: '#FF3B30', textAlign: 'center' }, // Centrer l'erreur
  timeOptionContainer: { backgroundColor: '#F0F0F0', borderRadius: 15, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  timeOptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeOptionText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' },
  timeContainer: { alignItems: 'center', marginBottom: 20 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBox: { backgroundColor: '#F0F0F0', borderRadius: 15, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', minWidth: 70, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  timeSeparator: { fontSize: 22, fontWeight: 'bold' },
  timeText: { fontSize: 16, fontWeight: '500' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee' }, // Ajouter fond et bordure
  backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 20 },
  backButtonText: { fontSize: 16, color: '#666', marginLeft: 8 },
  nextButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'black', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 25, gap: 8 },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
  iosPickerContainer: { backgroundColor: '#f8f8f8', position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#e0e0e0', zIndex: 1000 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
  iosPickerTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  iosPickerCancel: { fontSize: 16, color: '#999' },
  iosPickerDone: { fontSize: 16, fontWeight: '600', color: 'black' },
  iosPicker: { height: 200 },
});

export default EventDateModal;