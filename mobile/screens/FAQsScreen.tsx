import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  expanded: boolean;
  animation: Animated.Value;
}

const FAQsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: '1',
      question: 'Comment créer un événement?',
      answer: 'Pour créer un événement, allez sur l\'écran "Événements" et appuyez sur le bouton + en bas. Suivez ensuite les étapes pour définir le titre, la date, les participants et les autres détails de votre événement.',
      expanded: false,
      animation: new Animated.Value(0),
    },
    {
      id: '2',
      question: 'Comment inviter des amis à rejoindre l\'application?',
      answer: 'Vous pouvez inviter des amis en allant dans "Paramètres" puis en appuyant sur "Inviter des amis". Vous pourrez ensuite choisir comment partager votre invitation: par message, email ou en partageant un lien.',
      expanded: false,
      animation: new Animated.Value(0),
    },
    {
      id: '3',
      question: 'Comment gérer mes listes de souhaits?',
      answer: 'Accédez à l\'onglet "Listes" pour voir toutes vos listes de souhaits. Vous pouvez créer une nouvelle liste, modifier les listes existantes, ou supprimer des éléments. Pour ajouter un article, utilisez le bouton + et complétez les informations demandées.',
      expanded: false,
      animation: new Animated.Value(0),
    },
    {
      id: '4',
      question: 'Comment utiliser les comptes gérés?',
      answer: 'Les comptes gérés vous permettent de gérer les listes et événements pour vos enfants ou proches. Pour configurer un compte géré, allez dans "Paramètres" puis "Comptes gérés" et suivez les instructions pour créer un profil.',
      expanded: false,
      animation: new Animated.Value(0),
    },
    {
      id: '5',
      question: 'Comment modifier mon profil?',
      answer: 'Pour modifier votre profil, accédez à "Paramètres", puis "Mon profil". Vous pourrez alors modifier votre photo, votre nom, votre email ou votre numéro de téléphone en appuyant sur les champs correspondants.',
      expanded: false,
      animation: new Animated.Value(0),
    },
    {
      id: '6',
      question: 'Comment puis-je contacter le support?',
      answer: 'Pour contacter notre équipe de support, allez dans "Paramètres", faites défiler jusqu\'en bas et appuyez sur "Aide et support". Vous pourrez ensuite choisir entre envoyer un email, discuter avec notre chatbot, ou consulter notre centre d\'aide.',
      expanded: false,
      animation: new Animated.Value(0),
    },
    {
      id: '7',
      question: 'Que faire si j\'ai oublié mon mot de passe?',
      answer: 'Sur l\'écran de connexion, appuyez sur "Mot de passe oublié". Vous devrez ensuite saisir votre email ou numéro de téléphone pour recevoir un lien de réinitialisation. Suivez les instructions dans l\'email ou le SMS pour créer un nouveau mot de passe.',
      expanded: false,
      animation: new Animated.Value(0),
    },
    {
      id: '8',
      question: 'Comment fonctionne la synchronisation des contacts?',
      answer: 'La synchronisation des contacts vous permet de trouver facilement vos amis qui utilisent déjà l\'application. Vos contacts sont comparés de manière sécurisée avec notre base de données d\'utilisateurs. Vous pouvez activer ou désactiver cette fonctionnalité dans "Paramètres" puis "Confidentialité".',
      expanded: false,
      animation: new Animated.Value(0),
    },
  ]);

  const toggleFAQ = (id: string) => {
    const updatedFaqs = faqs.map(faq => {
      if (faq.id === id) {
        // Animate the expansion/collapse
        Animated.timing(faq.animation, {
          toValue: faq.expanded ? 0 : 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
        
        return { ...faq, expanded: !faq.expanded };
      }
      return faq;
    });
    
    setFaqs(updatedFaqs);
  };

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
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <Text style={styles.searchText}>Rechercher une question...</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.faqContainer}>
          <Text style={styles.sectionTitle}>Questions fréquemment posées</Text>
          
          {faqs.map(faq => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity 
                style={styles.questionContainer}
                onPress={() => toggleFAQ(faq.id)}
              >
                <Text style={styles.questionText}>{faq.question}</Text>
                <Ionicons 
                  name={faq.expanded ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#000" 
                />
              </TouchableOpacity>
              
              {faq.expanded && (
                <Animated.View 
                  style={[
                    styles.answerContainer,
                    {
                      opacity: faq.animation,
                      maxHeight: faq.animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 500],
                      }),
                    },
                  ]}
                >
                  <Text style={styles.answerText}>{faq.answer}</Text>
                </Animated.View>
              )}
            </View>
          ))}
        </View>

        {/* Still need help section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Vous avez besoin d'aide?</Text>
          <Text style={styles.helpDescription}>
            Si vous ne trouvez pas de réponse à votre question, contactez notre équipe de support.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>
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
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchText: {
    marginLeft: 10,
    color: '#888',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  faqContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    paddingRight: 10,
  },
  answerContainer: {
    paddingTop: 10,
    overflow: 'hidden',
  },
  answerText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  helpSection: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  helpDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#000',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FAQsScreen;