import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AuthInput from '../components/AuthInput';

const ForgotPasswordScreen: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword, isLoading } = useAuth();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!emailOrPhone.trim()) return;
    
    try {
      await resetPassword(emailOrPhone);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mot de passe oublié ?</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Entre ton {isSubmitted ? 'e-mail' : 'e-mail ou téléphone'}</Text>
          
          <AuthInput
            placeholder={isSubmitted ? "E-mail" : "Téléphone ou e-mail"}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSubmitted}
          />
          
          {isSubmitted && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>
                Nous avons envoyé <Text style={styles.boldText}>un lien de réinitialisation de mot de passe</Text> dans votre boîte e-mail.
              </Text>
              
              <View style={styles.spamWarning}>
                <FontAwesome name="info-circle" size={20} color="black" />
                <Text style={styles.spamText}>Vérifiez vos spams</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!emailOrPhone.trim() || isLoading) && styles.disabledButton
            ]} 
            onPress={handleSubmit}
            disabled={!emailOrPhone.trim() || isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Chargement...' : (isSubmitted ? 'Recevoir un lien' : 'Continuer')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  messageContainer: {
    width: '100%',
    marginTop: 30,
    marginBottom: 40,
  },
  messageText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
  },
  spamWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  spamText: {
    fontSize: 16,
    color: 'black',
    marginLeft: 10,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: 'black',
    borderRadius: 50,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ForgotPasswordScreen;