import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TermsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // Date de dernière mise à jour des conditions
  const lastUpdated = "15 mars 2025";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Last Updated */}
        <Text style={styles.lastUpdatedText}>Dernière mise à jour: {lastUpdated}</Text>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            Bienvenue dans notre application. Les présentes Conditions d'utilisation régissent votre utilisation de notre application, y compris toutes les fonctionnalités et services accessibles via cette application. En accédant ou en utilisant notre application, vous acceptez d'être lié par ces Conditions. Si vous n'acceptez pas ces Conditions, veuillez ne pas utiliser notre application.
          </Text>
        </View>

        {/* Account Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions du compte</Text>
          <Text style={styles.paragraph}>
            1. Vous devez être âgé d'au moins 13 ans pour utiliser cette application.
          </Text>
          <Text style={styles.paragraph}>
            2. Vous êtes responsable de maintenir la sécurité de votre compte et mot de passe.
          </Text>
          <Text style={styles.paragraph}>
            3. Vous êtes responsable de tout contenu publié et de toute activité qui se produit sous votre compte.
          </Text>
          <Text style={styles.paragraph}>
            4. Vous ne pouvez pas utiliser notre service à des fins illégales ou non autorisées.
          </Text>
          <Text style={styles.paragraph}>
            5. Vous ne pouvez pas vendre, louer ou transférer votre compte à un tiers.
          </Text>
        </View>

        {/* Content & Conduct */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contenu et conduite</Text>
          <Text style={styles.paragraph}>
            1. Vous conservez tous les droits sur le contenu que vous publiez sur l'application.
          </Text>
          <Text style={styles.paragraph}>
            2. Vous ne pouvez pas télécharger, publier ou partager du contenu qui enfreint les droits d'autrui ou qui est illégal, trompeur, menaçant, abusif, diffamatoire, ou autrement répréhensible.
          </Text>
          <Text style={styles.paragraph}>
            3. Nous nous réservons le droit de supprimer tout contenu et de suspendre les comptes qui violent ces conditions.
          </Text>
        </View>

        {/* Privacy & Data Use */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité et utilisation des données</Text>
          <Text style={styles.paragraph}>
            1. Notre application collecte et traite certaines données personnelles conformément à notre Politique de confidentialité.
          </Text>
          <Text style={styles.paragraph}>
            2. En utilisant notre application, vous consentez à la collecte et au traitement de vos données comme décrit dans notre Politique de confidentialité.
          </Text>
          <Text style={styles.paragraph}>
            3. Vous pouvez consulter notre Politique de confidentialité complète dans la section Confidentialité des paramètres.
          </Text>
        </View>

        {/* Services & Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services et paiements</Text>
          <Text style={styles.paragraph}>
            1. Certaines fonctionnalités de notre application peuvent être payantes ou nécessiter un abonnement.
          </Text>
          <Text style={styles.paragraph}>
            2. Les paiements sont traités par des prestataires de services tiers et sont soumis à leurs propres conditions d'utilisation.
          </Text>
          <Text style={styles.paragraph}>
            3. Nous nous réservons le droit de modifier les prix de nos services à tout moment.
          </Text>
        </View>

        {/* Liability & Warranty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsabilité et garantie</Text>
          <Text style={styles.paragraph}>
            1. Notre application est fournie "telle quelle" sans garantie d'aucune sorte, explicite ou implicite.
          </Text>
          <Text style={styles.paragraph}>
            2. Nous ne garantissons pas que notre service sera ininterrompu, opportun, sécurisé ou sans erreur.
          </Text>
          <Text style={styles.paragraph}>
            3. Nous ne serons pas responsables des dommages indirects, spéciaux, consécutifs ou punitifs résultant de l'utilisation ou de l'impossibilité d'utiliser notre application.
          </Text>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résiliation</Text>
          <Text style={styles.paragraph}>
            1. Nous nous réservons le droit de suspendre ou de résilier votre compte et votre accès à notre application à tout moment, pour quelque raison que ce soit.
          </Text>
          <Text style={styles.paragraph}>
            2. Vous pouvez résilier votre compte à tout moment en suivant les instructions dans les paramètres du compte.
          </Text>
        </View>

        {/* Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modifications des conditions</Text>
          <Text style={styles.paragraph}>
            1. Nous nous réservons le droit de modifier ces Conditions à tout moment.
          </Text>
          <Text style={styles.paragraph}>
            2. Les modifications importantes seront notifiées via l'application ou par email.
          </Text>
          <Text style={styles.paragraph}>
            3. Votre utilisation continue de l'application après de telles modifications constitue votre acceptation des nouvelles Conditions.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>
          <Text style={styles.paragraph}>
            Si vous avez des questions concernant ces Conditions, veuillez nous contacter à support@application.com.
          </Text>
        </View>

        {/* Accept Button */}
        <TouchableOpacity style={styles.acceptButton}>
          <Text style={styles.acceptButtonText}>J'accepte les conditions</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  placeholderButton: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 10,
  },
  acceptButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TermsScreen;