import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Animated,
  TextInput,
  Switch,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import AddAdminModal from './AddAdminModal';

interface Admin {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface EventOptionalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  isIndividual?: boolean;
  onContinue: (info: {
    includeMoneyGoal: boolean;
    moneyGoalAmount?: string;
    includeLocation: boolean;
    includeMessage: boolean;
    includeAdmins: boolean;
  }) => void;
}

const EventOptionalInfoModal: React.FC<EventOptionalInfoModalProps> = ({
  visible,
  onClose,
  onBack,
  onContinue,
  isIndividual = true,
}) => {
  // États pour les options
  const [includeMoneyGoal, setIncludeMoneyGoal] = useState(false);
  const [moneyGoalAmount, setMoneyGoalAmount] = useState('0€');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [apartment, setApartment] = useState('');
  const [includeMessage, setIncludeMessage] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [includeAdmins, setIncludeAdmins] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: '1',
      name: 'Paul Marceau',
      username: 'paulmarceau',
      avatar: 'https://api.a0.dev/assets/image?text=man%20beard%20hat%20portrait%20cartoon%20orange%20background&aspect=1:1&seed=13'
    }
  ]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

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

  const handleContinue = () => {
    onContinue({
      includeMoneyGoal,
      moneyGoalAmount: includeMoneyGoal ? moneyGoalAmount : undefined,
      includeLocation,
      includeMessage,
      includeAdmins,
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: new Animated.Value(0) }] }]}>
          {/* Draggable handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
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
                  value={includeMessage}
                  onValueChange={setIncludeMessage}
                  trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
                  thumbColor={includeMessage ? 'black' : 'white'}
                  ios_backgroundColor="#E0E0E0"
                  style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                />
              </View>
              
              {/* Description input field (only shown when enabled) */}
              {includeMessage && (
                <View style={styles.descriptionInputContainer}>
                  <TextInput
                    style={styles.descriptionInput}
                    value={invitationMessage}
                    onChangeText={setInvitationMessage}
                    placeholder="Ajouter un message..."
                    multiline
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
                      value={includeMoneyGoal}
                      onValueChange={setIncludeMoneyGoal}
                      trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
                      thumbColor={includeMoneyGoal ? 'black' : 'white'}
                      ios_backgroundColor="#E0E0E0"
                      style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                    />
                  </View>
                  
                  {includeMoneyGoal && (
                    <View style={styles.descriptionInputContainer}>
                      <TextInput
                        style={styles.descriptionInput}
                        placeholder="0€"
                        placeholderTextColor="#999"
                        value={moneyGoalAmount}
                        onChangeText={setMoneyGoalAmount}
                        keyboardType="numeric"
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
                  value={includeLocation}
                  onValueChange={setIncludeLocation}
                  trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
                  thumbColor={includeLocation ? 'black' : 'white'}
                  ios_backgroundColor="#E0E0E0"
                  style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                />
              </View>
              
              {/* Location fields (only shown when enabled) */}
              {includeLocation && (
                <View style={styles.descriptionInputContainer}>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Adresse"
                    placeholderTextColor="#999"
                    value={address}
                    onChangeText={setAddress}
                  />
                  <View style={styles.rowInputs}>
                    <TextInput
                      style={[styles.input, styles.halfWidthInput]}
                      placeholder="Ville"
                      placeholderTextColor="#999"
                      value={city}
                      onChangeText={setCity}
                    />
                    <TextInput
                      style={[styles.input, styles.halfWidthInput]}
                      placeholder="Code Postal"
                      placeholderTextColor="#999"
                      value={postalCode}
                      onChangeText={setPostalCode}
                      keyboardType="numeric"
                    />
                  </View>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Apt, Étg, etc."
                    placeholderTextColor="#999"
                    value={apartment}
                    onChangeText={setApartment}
                  />
                </View>
              )}
              
              {/* Admin toggle */}
              <View style={styles.optionContainer}>
                <View style={styles.optionIconAndText}>
                  <Ionicons name="people-outline" size={24} color="black" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Ajouter des administrateurs</Text>
                </View>
                <Switch
                  value={includeAdmins}
                  onValueChange={setIncludeAdmins}
                  trackColor={{ false: '#E0E0E0', true: '#E0E0E0' }}
                  thumbColor={includeAdmins ? 'black' : 'white'}
                  ios_backgroundColor="#E0E0E0"
                  style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                />
              </View>
              
              {/* Admins list (only shown when enabled) */}
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
                      <TouchableOpacity 
                        style={styles.removeAdminButton}
                        onPress={() => handleRemoveAdmin(admin.id)}
                      >
                        <AntDesign name="close" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity 
                    style={styles.addAdminButton}
                    onPress={handleAddAdmin}
                  >
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={24} color="#666" />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleContinue}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 550,
    maxHeight: Dimensions.get('window').height * 0.9,
    paddingBottom: 30,
  },
  dragHandleContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionIconAndText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
  },
  descriptionInputContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  descriptionInput: {
    minHeight: 40,
    fontSize: 16,
    marginBottom: 10,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    minHeight: 40,
    fontSize: 16,
  },
  halfWidthInput: {
    width: '48%',
  },
  adminsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  adminItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminUsername: {
    fontSize: 14,
    color: '#999',
  },
  removeAdminButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  addAdminIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addAdminText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 5,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 5,
  },
});

export default EventOptionalInfoModal;