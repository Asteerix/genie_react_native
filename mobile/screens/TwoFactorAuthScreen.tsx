import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const TwoFactorAuthScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // États
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backupCodes'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  
  // Simuler la récupération du QR code et de la clé secrète
  useEffect(() => {
    if (step === 'setup') {
      fetchSetupData();
    }
  }, [step]);
  
  const fetchSetupData = async () => {
    setIsLoading(true);
    
    // Simuler une requête API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // QR code fictif pour la démonstration (en réalité, ce serait un data URL ou une URL d'image)
    setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/A0App:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=A0App');
    setSecretKey('JBSWY3DPEHPK3PXP');
    
    setIsLoading(false);
  };
  
  // Simuler la vérification du code
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert(
        "Erreur de validation",
        "Veuillez entrer un code à 6 chiffres",
        [{ text: "OK" }]
      );
      return;
    }
    
    setIsLoading(true);
    
    // Simuler une requête API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Pour démonstration, on accepte n'importe quel code à 6 chiffres
    const isValid = verificationCode.length === 6 && /^\d+$/.test(verificationCode);
    
    setIsLoading(false);
    
    if (isValid) {
      setIsVerified(true);
      
      // Générer des codes de secours fictifs
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 7).toUpperCase() + 
        Math.random().toString(36).substring(2, 7).toUpperCase()
      );
      
      setBackupCodes(codes);
      setStep('backupCodes');
    } else {
      Alert.alert(
        "Code invalide",
        "Le code que vous avez entré est incorrect. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Fonction pour finaliser la configuration
  const finishSetup = () => {
    Alert.alert(
      "Configuration terminée",
      "L'authentification à deux facteurs a été activée avec succès.",
      [
        { 
          text: "OK", 
          onPress: () => navigation.goBack()
        }
      ]
    );
  };
  
  // Afficher l'écran d'introduction
  const renderIntroScreen = () => {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
        </View>
        
        <Text style={styles.title}>
          Authentification à deux facteurs
        </Text>
        
        <Text style={styles.description}>
          L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte. 
          Une fois configurée, vous aurez besoin à la fois de votre mot de passe et d'un code de sécurité 
          généré par votre application d'authentification pour vous connecter.
        </Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Avant de commencer</Text>
          <Text style={styles.infoText}>
            Vous aurez besoin d'installer une application d'authentification comme Google Authenticator, 
            Authy ou Microsoft Authenticator sur votre téléphone.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setStep('setup')}
        >
          <Text style={styles.buttonText}>Commencer la configuration</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Afficher l'écran de configuration
  const renderSetupScreen = () => {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Scanner le QR code
        </Text>
        
        <Text style={styles.description}>
          Scannez ce QR code avec votre application d'authentification ou entrez manuellement la clé secrète.
        </Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Génération du QR code...</Text>
          </View>
        ) : (
          <>
            <View style={styles.qrCodeContainer}>
              {qrCodeUrl && (
                <Image 
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrCode}
                  resizeMode="contain"
                />
              )}
            </View>
            
            {secretKey && (
              <View style={styles.secretKeyContainer}>
                <Text style={styles.secretKeyLabel}>Clé secrète :</Text>
                <View style={styles.secretKeyBox}>
                  <Text style={styles.secretKeyText}>{secretKey}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
                      // Copier dans le presse-papier (simulation)
                      Alert.alert("Copié", "La clé a été copiée dans le presse-papier");
                    }}
                  >
                    <Ionicons name="copy" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setStep('verify')}
            >
              <Text style={styles.buttonText}>Continuer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };
  
  // Afficher l'écran de vérification
  const renderVerifyScreen = () => {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Vérifier la configuration
        </Text>
        
        <Text style={styles.description}>
          Entrez le code à 6 chiffres généré par votre application d'authentification pour vérifier que tout fonctionne correctement.
        </Text>
        
        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#999"
            value={verificationCode}
            onChangeText={setVerificationCode}
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button,
            (verificationCode.length !== 6 || isLoading) && styles.buttonDisabled
          ]}
          onPress={verifyCode}
          disabled={verificationCode.length !== 6 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Vérifier le code</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.textButton}
          onPress={() => setStep('setup')}
        >
          <Text style={styles.textButtonText}>Retour à la configuration</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Afficher l'écran des codes de secours
  const renderBackupCodesScreen = () => {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Codes de secours
        </Text>
        
        <Text style={styles.description}>
          Enregistrez ces codes de secours dans un endroit sûr. Si vous perdez l'accès à votre application d'authentification, 
          vous pourrez utiliser l'un de ces codes à usage unique pour vous connecter.
        </Text>
        
        <View style={styles.backupCodesContainer}>
          {backupCodes.map((code, index) => (
            <View key={index} style={styles.backupCodeItem}>
              <Text style={styles.backupCodeText}>{code}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={finishSetup}
        >
          <Text style={styles.buttonText}>Terminer la configuration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.textButton}
          onPress={() => {
            // Simuler l'impression ou le téléchargement des codes
            Alert.alert("Codes enregistrés", "Les codes ont été enregistrés sur votre appareil.");
          }}
        >
          <Text style={styles.textButtonText}>Enregistrer les codes</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Rendu conditionnel selon l'étape
  const renderContent = () => {
    switch (step) {
      case 'intro':
        return renderIntroScreen();
      case 'setup':
        return renderSetupScreen();
      case 'verify':
        return renderVerifyScreen();
      case 'backupCodes':
        return renderBackupCodesScreen();
      default:
        return renderIntroScreen();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (step === 'intro') {
              navigation.goBack();
            } else if (step === 'setup') {
              setStep('intro');
            } else if (step === 'verify') {
              setStep('setup');
            } else if (isVerified) {
              // Si déjà vérifié et sur l'écran des codes de secours, 
              // demander confirmation avant de revenir en arrière
              Alert.alert(
                "Êtes-vous sûr ?",
                "Si vous revenez en arrière, vous devrez redémarrer la configuration.",
                [
                  { text: "Annuler", style: "cancel" },
                  { text: "Revenir", onPress: () => setStep('verify') }
                ]
              );
            }
          }}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Authentification à deux facteurs
        </Text>
        <View style={styles.placeholderRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {renderContent()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    marginBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 25,
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  textButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
    fontSize: 16,
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  secretKeyContainer: {
    marginVertical: 20,
  },
  secretKeyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  secretKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  secretKeyText: {
    flex: 1,
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
  },
  codeInputContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  codeInput: {
    width: '50%',
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 5,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  backupCodesContainer: {
    marginVertical: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backupCodeItem: {
    width: '80%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  backupCodeText: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
});

export default TwoFactorAuthScreen;