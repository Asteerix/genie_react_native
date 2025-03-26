import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import EventTitleModal from './EventTitleModal';
import EventDateModal from './EventDateModal';
import EventHostModal from './EventHostModal';
import EventOptionalInfoModal from './EventOptionalInfoModal';
import EventIllustrationModal from './EventIllustrationModal';

interface EventData {
  type: 'collectif' | 'individuel';
  title: string;
  date: {
    day: string;
    month: string;
    year: string;
    includeTime: boolean;
  };
  hosts?: string[];
  optionalInfo?: {
    includeMoneyGoal: boolean;
    moneyGoalAmount?: string;
    includeLocation: boolean;
    includeMessage: boolean;
    includeAdmins: boolean;
  };
  illustration?: string;
}

type ModalStep = 'title' | 'date' | 'host' | 'optional' | 'illustration';

const CustomEventTypeSelection: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentStep, setCurrentStep] = useState<ModalStep>('title');
  const [eventData, setEventData] = useState<EventData | null>(null);

  const handleCollectiveChoice = () => {
    setEventData({ type: 'collectif' } as EventData);
    setCurrentStep('title');
  };

  const handleIndividualChoice = () => {
    setEventData({ type: 'individuel' } as EventData);
    setCurrentStep('title');
  };

  const handleTitleContinue = (title: string) => {
    setEventData(prev => ({ ...prev!, title }));
    setCurrentStep('date');
  };

  const handleDateContinue = (date: EventData['date']) => {
    setEventData(prev => ({ ...prev!, date }));
    setCurrentStep(eventData?.type === 'individuel' ? 'host' : 'optional');
  };

  const handleHostContinue = (hosts: string[]) => {
    setEventData(prev => ({ ...prev!, hosts }));
    setCurrentStep('optional');
  };

  const handleOptionalContinue = (optionalInfo: EventData['optionalInfo']) => {
    setEventData(prev => ({ ...prev!, optionalInfo }));
    setCurrentStep('illustration');
  };

  const handleIllustrationContinue = (illustration: string) => {
    setEventData(prev => ({ ...prev!, illustration }));
    // Navigate to EventInviteFriends screen
    navigation.navigate('EventInviteFriends');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'date':
        setCurrentStep('title');
        break;
      case 'host':
        setCurrentStep('date');
        break;
      case 'optional':
        setCurrentStep(eventData?.type === 'individuel' ? 'host' : 'date');
        break;
      case 'illustration':
        setCurrentStep('optional');
        break;
      default:
        setEventData(null);
        setCurrentStep('title');
    }
  };

  const handleClose = () => {
    setEventData(null);
    setCurrentStep('title');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Événement Customisable</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Option Collectif */}
      <View style={styles.optionCard}>
        <Text style={styles.optionTitle}>Collectif</Text>
        
        <View style={styles.diagram}>
          {/* Diagramme avec icônes et flèches */}
          <View style={styles.iconRow}>
            <View style={styles.giftBox} />
          </View>
          
          <View style={styles.peopleRow}>
            <View style={styles.person} />
            <View style={styles.arrows}>
              <View style={styles.arrowRight} />
              <View style={styles.arrowLeft} />
            </View>
            <View style={styles.person} />
          </View>
          
          <View style={styles.iconRow}>
            <View style={styles.giftBox} />
          </View>
        </View>
        
        <Text style={styles.optionDescription}>
          Chacun offre ou reçoit des cadeaux de la 
          part de <Text style={styles.boldText}>chaque participants</Text>.
        </Text>
        
        <TouchableOpacity 
          style={styles.chooseButton}
          onPress={handleCollectiveChoice}
        >
          <Text style={styles.buttonText}>Choisir</Text>
        </TouchableOpacity>
      </View>
      
      {/* Option Individuel */}
      <View style={styles.optionCard}>
        <Text style={styles.optionTitle}>Individuel</Text>
        
        <View style={styles.diagram}>
          {/* Diagramme avec icônes et flèches */}
          <View style={styles.iconRow}>
            <View style={styles.giftBox} />
          </View>
          
          <View style={styles.peopleRow}>
            <View style={styles.multiPerson}>
              <View style={styles.person} />
              <View style={styles.person} />
              <View style={styles.person} />
            </View>
            <View style={styles.arrows}>
              <View style={styles.arrowRight} />
            </View>
            <View style={styles.person} />
          </View>
        </View>
        
        <Text style={styles.optionDescription}>
          Les invités offrent des cadeaux à <Text style={styles.boldText}>l'hôte
          (une personne</Text> ou <Text style={styles.boldText}>un couple)</Text>.
        </Text>
        
        <TouchableOpacity 
          style={styles.chooseButton}
          onPress={handleIndividualChoice}
        >
          <Text style={styles.buttonText}>Choisir</Text>
        </TouchableOpacity>
      </View>

      {/* All modals */}
      <EventTitleModal
        visible={currentStep === 'title' && eventData !== null}
        onClose={handleClose}
        onBack={handleClose}
        onContinue={handleTitleContinue}
        eventType={eventData?.type}
      />

      <EventDateModal
        visible={currentStep === 'date'}
        onClose={handleClose}
        onBack={handleBack}
        onContinue={handleDateContinue}
      />

      {eventData?.type === 'individuel' && (
        <EventHostModal
          visible={currentStep === 'host'}
          onClose={handleClose}
          onBack={handleBack}
          onContinue={handleHostContinue}
        />
      )}

      <EventOptionalInfoModal
        visible={currentStep === 'optional'}
        onClose={handleClose}
        onBack={handleBack}
        onContinue={handleOptionalContinue}
        isIndividual={eventData?.type === 'individuel'}
      />

      <EventIllustrationModal
        visible={currentStep === 'illustration'}
        onClose={handleClose}
        onBack={handleBack}
        onContinue={handleIllustrationContinue}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34, // Same as backButton width
  },
  optionCard: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  diagram: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  iconRow: {
    alignItems: 'center',
    marginVertical: 5,
  },
  giftBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 10,
  },
  person: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'black',
  },
  multiPerson: {
    flexDirection: 'row',
  },
  arrows: {
    flexDirection: 'row',
  },
  arrowRight: {
    width: 30,
    height: 2,
    backgroundColor: 'black',
    marginHorizontal: 5,
  },
  arrowLeft: {
    width: 30,
    height: 2,
    backgroundColor: 'black',
    marginHorizontal: 5,
  },
  optionDescription: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
  },
  chooseButton: {
    backgroundColor: 'black',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default CustomEventTypeSelection;