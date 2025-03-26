import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Switch,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  AccessibilityInfo,
  Animated,
  Vibration,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isValid, isBefore, isAfter, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventDateModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: (date: { jour: string; mois: string; annee: string; inclureHeure: boolean; heureComplete?: string }) => void;
  initialDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  isLoading?: boolean;
  customTheme?: Partial<typeof defaultTheme>;
}

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

const EventDateModal: React.FC<EventDateModalProps> = ({
  visible,
  onClose,
  onBack,
  onContinue,
  initialDate,
  minDate = new Date(),
  maxDate = addDays(new Date(), 365), // Date max par défaut : 1 an à partir d'aujourd'hui
  isLoading = false,
  customTheme = {}
}) => {
  // Fusion du thème personnalisé avec le thème par défaut
  const theme = { ...defaultTheme, ...customTheme };

  // Marges de sécurité pour différents appareils
  const insets = useSafeAreaInsets();
  
  // Valeurs d'animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(100)).current;
  
  // État de la date avec validation
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate && isValid(initialDate) ? initialDate : new Date()
  );
  const [inclureHeure, setInclureHeure] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  
  // État UI pour le sélecteur
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  
  // État d'accessibilité
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  
  // Vérifier si le lecteur d'écran est activé pour les ajustements d'accessibilité
  useEffect(() => {
    const checkScreenReader = async () => {
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(screenReaderEnabled);
    };
    
    checkScreenReader();
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );
    
    return () => {
      // Nettoyer l'écouteur - éviter les fuites de mémoire
      subscription.remove();
    };
  }, []);
  
  // Gérer les animations de la modale
  useEffect(() => {
    if (visible) {
      // Démarrer les animations lorsque la modale devient visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Réinitialiser les animations lorsque la modale est masquée
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
    }
  }, [visible, fadeAnim, slideAnim]);
  
  // Valider la date chaque fois qu'elle change
  useEffect(() => {
    validateDate(selectedDate);
  }, [selectedDate, minDate, maxDate]);
  
  // Fonction de validation de date
  const validateDate = useCallback((date: Date) => {
    if (!isValid(date)) {
      setDateError('Date invalide');
      return false;
    }
    
    // Vérifier si la date est dans la plage valide
    if (minDate && isBefore(date, startOfDay(minDate))) {
      setDateError(`La date doit être après le ${format(minDate, 'dd/MM/yyyy')}`);
      return false;
    }
    
    if (maxDate && isAfter(date, maxDate)) {
      setDateError(`La date doit être avant le ${format(maxDate, 'dd/MM/yyyy')}`);
      return false;
    }
    
    setDateError(null);
    return true;
  }, [minDate, maxDate]);
  
  // Valeurs formatées mémorisées pour l'affichage - évite les recalculs inutiles
  const formattedValues = useMemo(() => {
    try {
      return {
        // Jour de la semaine en minuscule avec première lettre en majuscule
        formattedDayName: format(selectedDate, 'EEEE', { locale: fr })
          .charAt(0).toUpperCase() + format(selectedDate, 'EEEE', { locale: fr }).slice(1),
        formattedDay: format(selectedDate, 'd'),
        // Mois en minuscule
        formattedMonth: format(selectedDate, 'MMMM', { locale: fr }),
        formattedYear: format(selectedDate, 'yyyy'),
        // Format 24h pour l'heure
        formattedTime: format(selectedDate, 'HH:mm', { locale: fr }),
        // Format complet de la date pour l'accessibilité
        formattedFullDate: format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
      };
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return {
        formattedDayName: '',
        formattedDay: '',
        formattedMonth: '',
        formattedYear: '',
        formattedTime: '',
        formattedFullDate: ''
      };
    }
  }, [selectedDate]);
  
  // Extraction pour lisibilité
  const { formattedDayName, formattedDay, formattedMonth, formattedYear, formattedTime, formattedFullDate } = formattedValues;
  
  // Extraction des heures et minutes pour l'affichage (format 24h)
  const heures = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();
  
  // Formater les heures et minutes avec des zéros en tête
  const formattedHeure = heures.toString().padStart(2, '0');
  const formattedMinute = minutes.toString().padStart(2, '0');
  
  // Gérer l'appui sur le bouton continuer
  const handleContinue = useCallback(() => {
    if (validateDate(selectedDate)) {
      // Retour haptique sur pression du bouton
      if (Platform.OS === 'ios') {
        Vibration.vibrate(10);
      }
      
      onContinue({
        jour: format(selectedDate, 'd'),
        mois: format(selectedDate, 'MMMM', { locale: fr }),
        annee: format(selectedDate, 'yyyy'),
        inclureHeure: inclureHeure,
        heureComplete: inclureHeure ? format(selectedDate, 'HH:mm', { locale: fr }) : undefined
      });
    }
  }, [selectedDate, inclureHeure, validateDate, onContinue]);
  
  // Gérer le changement de date ou d'heure depuis le sélecteur
  const handleDateChange = useCallback((event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date && isValid(date)) {
      const newDate = new Date(selectedDate);
      
      if (pickerMode === 'date') {
        newDate.setFullYear(date.getFullYear());
        newDate.setMonth(date.getMonth());
        newDate.setDate(date.getDate());
        
        // Sur Android, nous devons déclencher le sélecteur d'heure séparément
        if (Platform.OS === 'android' && inclureHeure) {
          setTimeout(() => {
            setPickerMode('time');
            setShowPicker(true);
          }, 300);
        }
      } else if (pickerMode === 'time') {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
      }
      
      setSelectedDate(newDate);
    }
  }, [pickerMode, selectedDate, inclureHeure]);
  
  // Gérer l'activation/désactivation de l'heure
  const handleTimeToggle = useCallback((value: boolean) => {
    setInclureHeure(value);
    // Si on active l'heure, afficher le sélecteur d'heure
    if (value && Platform.OS === 'android') {
      setTimeout(() => {
        setPickerMode('time');
        setShowPicker(true);
      }, 300);
    }
    
    // Retour haptique sur basculement
    if (Platform.OS === 'ios') {
      Vibration.vibrate(5);
    }
  }, []);
  
  // Afficher le sélecteur de date ou d'heure
  const openPicker = useCallback((mode: 'date' | 'time') => {
    Keyboard.dismiss();
    setPickerMode(mode);
    setShowPicker(true);
  }, []);
  
  // Gérer l'appui sur le bouton retour
  const handleBack = useCallback(() => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    onBack();
  }, [onBack]);
  
  // Gérer l'appui sur le bouton fermer
  const handleClose = useCallback(() => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    onClose();
  }, [onClose]);
  
  // Rendu du sélecteur iOS avec en-tête personnalisé
  const renderIOSPicker = () => {
    if (!showPicker || Platform.OS !== 'ios') return null;
    
    return (
      <View style={styles.iosPickerContainer}>
        <View style={styles.iosPickerHeader}>
          <TouchableOpacity 
            onPress={() => setShowPicker(false)}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
            accessibilityHint="Annule la sélection de date"
          >
            <Text style={styles.iosPickerCancel}>Annuler</Text>
          </TouchableOpacity>
          
          <Text style={styles.iosPickerTitle}>
            {pickerMode === 'date' ? 'Sélectionner la date' : 'Sélectionner l\'heure'}
          </Text>
          
          <TouchableOpacity 
            onPress={() => setShowPicker(false)}
            accessibilityRole="button"
            accessibilityLabel="OK"
            accessibilityHint="Confirme la sélection de date"
          >
            <Text style={styles.iosPickerDone}>OK</Text>
          </TouchableOpacity>
        </View>
        
        <DateTimePicker
          value={selectedDate}
          mode={pickerMode}
          display="spinner"
          onChange={handleDateChange}
          locale="fr-FR"
          textColor={theme.textPrimary}
          style={styles.iosPicker}
          minimumDate={minDate}
          maximumDate={maxDate}
          is24Hour={true} // Utiliser le format 24h pour correspondre aux normes françaises
        />
      </View>
    );
  };
  
  // Rendu du sélecteur Android
  const renderAndroidPicker = () => {
    if (!showPicker || Platform.OS !== 'android') return null;
    
    return (
      <DateTimePicker
        value={selectedDate}
        mode={pickerMode}
        display="default"
        onChange={handleDateChange}
        minimumDate={minDate}
        maximumDate={maxDate}
        is24Hour={true} // Utiliser le format 24h pour correspondre aux normes françaises
        locale="fr-FR"
      />
    );
  };
  
  // Styles créés dynamiquement pour incorporer le thème et les marges de sécurité
  const getStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    // Autres styles créés dynamiquement...
  }), [theme, insets]);
  
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none" // Utilisation d'animations personnalisées
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.backgroundColor} />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View 
          style={[
            styles.container,
            getStyles.container,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <SafeAreaView style={styles.contentContainer}>
            <Animated.View 
              style={[
                styles.content,
                {
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* En-tête */}
              <View style={styles.header}>
                <TouchableOpacity 
                  onPress={handleClose} 
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                  accessibilityHint="Ferme le sélecteur de date"
                >
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                
                <Text 
                  style={[styles.title, { color: theme.textPrimary }]}
                  accessibilityRole="header"
                >
                  Date de l'événement
                </Text>
                
                <View style={styles.headerSpacer} />
              </View>

              {/* Affichage de la date */}
              <View style={styles.dateMainContainer}>
                <Text 
                  style={[styles.dayNameText, { color: theme.accentColor }]}
                  accessibilityRole="text"
                  accessibilityLabel={`Jour : ${formattedDayName}`}
                >
                  {formattedDayName}
                </Text>
                
                <TouchableWithoutFeedback 
                  onPress={() => openPicker('date')}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir le sélecteur de date"
                  accessibilityHint={`Date actuelle : ${formattedFullDate}`}
                >
                  <View style={styles.dateContainer}>
                    <View style={styles.dateRow}>
                      <View style={[styles.dateBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                        <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedDay}</Text>
                      </View>
                      
                      <View style={[styles.dateBox, styles.monthBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                        <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedMonth}</Text>
                      </View>
                      
                      <View style={[styles.dateBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                        <Text style={[styles.dateText, { color: theme.textPrimary }]}>{formattedYear}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
                
                {/* Message d'erreur de date */}
                {dateError && (
                  <Text 
                    style={[styles.errorText, { color: theme.errorColor }]}
                    accessibilityRole="alert"
                  >
                    {dateError}
                  </Text>
                )}
              </View>

              {/* Option d'heure */}
              <View style={[styles.timeOptionContainer, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                <View style={styles.timeOptionRow}>
                  <Ionicons name="time-outline" size={24} color={theme.textPrimary} />
                  
                  <Text 
                    style={[styles.timeOptionText, { color: theme.textPrimary }]}
                    accessibilityLabel="Ajouter l'heure à l'événement"
                  >
                    Ajouter l'heure
                  </Text>
                  
                  <Switch
                    value={inclureHeure}
                    onValueChange={handleTimeToggle}
                    trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
                    thumbColor={inclureHeure ? theme.primaryColor : 'white'}
                    ios_backgroundColor="#E0E0E0"
                    accessibilityRole="switch"
                    accessibilityLabel="Inclure l'heure"
                    accessibilityState={{ checked: inclureHeure }}
                    accessibilityHint="Active ou désactive la sélection de l'heure"
                  />
                </View>
              </View>

              {/* Affichage de l'heure */}
              {inclureHeure && (
                <TouchableWithoutFeedback 
                  onPress={() => openPicker('time')}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir le sélecteur d'heure"
                  accessibilityHint={`Heure actuelle : ${formattedHeure}:${formattedMinute}`}
                >
                  <View style={styles.timeContainer}>
                    <View style={styles.timeRow}>
                      <View style={[styles.timeBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                        <Text style={[styles.timeText, { color: theme.textPrimary }]}>{formattedHeure}</Text>
                      </View>
                      
                      <Text style={[styles.timeSeparator, { color: theme.textPrimary }]}>:</Text>
                      
                      <View style={[styles.timeBox, { backgroundColor: theme.surfaceColor, borderRadius: theme.borderRadius }]}>
                        <Text style={[styles.timeText, { color: theme.textPrimary }]}>{formattedMinute}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              )}

              {/* Rendu du sélecteur approprié selon la plateforme */}
              {renderIOSPicker()}
              {renderAndroidPicker()}

              {/* Navigation inférieure */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.backButton, 
                    { 
                      backgroundColor: theme.surfaceColor, 
                      borderRadius: theme.borderRadius,
                      opacity: isLoading ? 0.5 : 1
                    }
                  ]}
                  onPress={handleBack}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Retour"
                  accessibilityHint="Revenir à l'étape précédente"
                  accessibilityState={{ disabled: isLoading }}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
                  <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.nextButton, 
                    { 
                      backgroundColor: dateError ? theme.disabledColor : theme.primaryColor,
                      borderRadius: theme.borderRadius,
                      opacity: (isLoading || dateError) ? 0.5 : 1
                    }
                  ]}
                  onPress={handleContinue}
                  disabled={isLoading || !!dateError}
                  accessibilityRole="button"
                  accessibilityLabel="Suivant"
                  accessibilityHint="Passer à l'étape suivante"
                  accessibilityState={{ 
                    disabled: isLoading || !!dateError,
                    busy: isLoading
                  }}
                >
                  <Text style={[styles.nextButtonText, { color: theme.primaryTextColor }]}>
                    {isLoading ? 'Chargement...' : 'Suivant'}
                  </Text>
                  {!isLoading && <Ionicons name="arrow-forward" size={20} color={theme.primaryTextColor} />}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Styles statiques
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  dateMainContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  dayNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthBox: {
    width: 140,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF3B30',
  },
  timeOptionContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeOptionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeSeparator: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
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
  // Styles de sélecteur iOS
  iosPickerContainer: {
    backgroundColor: '#f8f8f8',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 1000,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  iosPickerCancel: {
    fontSize: 16,
    color: '#999',
  },
  iosPickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  iosPicker: {
    height: 200,
  },
});

export default EventDateModal;