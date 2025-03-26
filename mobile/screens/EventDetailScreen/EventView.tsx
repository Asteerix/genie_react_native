import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EventViewProps, EventDetails, Gift, Host } from './types';
import { formatEventTime, formatEventDate, formatFullAddress, copyToClipboard } from './utils';

const EventView: React.FC<EventViewProps> = ({
  eventDetails,
  eventType,
  handleGiftPress,
  isChristmasEvent,
  mainScrollViewRef,
  handleBack,
  handleAccept,
  handleRefuse,
  handleRejectJoinRequest,
  handleAcceptJoinRequest,
  sheetHeight,
  sheetState,
  panResponder,
  showParticipantsView,
  renderParticipantsView,
  renderGiftsView,
}) => {
  // Récupération des données de l'événement selon son type
  const { title, date, color, image, location, time } = eventDetails;

  // Détermination des propriétés spécifiques au type d'événement
  const description = 'description' in eventDetails ? eventDetails.description : '';
  const subtitle = 'subtitle' in eventDetails ? eventDetails.subtitle : '';
  const period = 'time' in eventDetails && eventDetails.time.period ? eventDetails.time.period : undefined;
  const hosts = 'hosts' in eventDetails ? eventDetails.hosts : undefined;

  // Récupération de l'adresse complète
  const fullAddress = formatFullAddress(location.address, location.city, location.postalCode);

  // Force l'affichage du header anniversaire
  const isWedding = false; // On force ce header à false
  const isBirthday = true; // On force ce header à true
  
  // Pour test/debug:
  console.log('Title:', title);
  console.log('FORCING Is Wedding:', isWedding);
  console.log('FORCING Is Birthday:', isBirthday);

  // Rendu du composant
  return (
    <ScrollView
      ref={mainScrollViewRef}
      style={[
        styles.container,
        isWedding ? { backgroundColor: '#D2F4F9' } :
        isBirthday ? { backgroundColor: '#E6DBFF' } :
        { backgroundColor: color }
      ]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header standard avec boutons de retour et paramètres */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingsButton}
        >
          <MaterialCommunityIcons name="chat-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Format d'anniversaire avec une seule personne */}
      {isBirthday ? (
        <View style={[styles.customHeaderContainer, { backgroundColor: '#E8DAFF' }]}>
          <Text style={[styles.customHeaderTitle, { fontSize: 36, marginBottom: 15 }]}>Anniversaire</Text>
          
          <View style={[styles.dateBadge, { backgroundColor: '#DEFFDB', paddingHorizontal: 20, paddingVertical: 10 }]}>
            <Text style={[styles.dateBadgeText, { fontSize: 17 }]}>09/12/2024</Text>
          </View>
          
          <View style={styles.birthdayInfoContainer}>
            <View style={styles.birthdayAvatarContainer}>
              <Image
                source={{ uri: 'https://api.a0.dev/assets/image?text=young%20man%20cartoon%20portrait&aspect=1:1&seed=111' }}
                style={styles.birthdayAvatar}
                resizeMode="cover"
              />
            </View>
            <View style={styles.birthdayDetailsContainer}>
              <Text style={styles.birthdayPersonName}>Dan Toulet</Text>
              <Text style={styles.birthdayAge}>30 ans</Text>
            </View>
          </View>
        </View>
      ) : (
        // Header standard pour les autres événements
        <>
          <View style={styles.eventImageContainer}>
            <Image
              source={{ uri: image }}
              style={styles.eventImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.eventTitle}>{title}</Text>
            {subtitle && <Text style={styles.eventSubtitle}>{subtitle}</Text>}
          </View>
        </>
      )}

      {/* Section date et lieu */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons name="event" size={24} color="#5E60CE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoText}>
                {formatEventDate(time.day, time.month)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(date)}
            >
              <MaterialIcons name="content-copy" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={24} color="#5E60CE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Heure</Text>
              <Text style={styles.infoText}>
                {formatEventTime(time.hour, time.minute, period)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(
                formatEventTime(time.hour, time.minute, period)
              )}
            >
              <MaterialIcons name="content-copy" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={24} color="#5E60CE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoText} numberOfLines={2}>
                {fullAddress}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(fullAddress)}
            >
              <MaterialIcons name="content-copy" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Description */}
      {description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </View>
      )}

      {/* Section boutons d'action selon le type d'événement */}
      {eventType === 'invitation' && (
        <View style={styles.actionButtonsContainer}>
          {'invitedBy' in eventDetails && (
            <Text style={styles.invitedByText}>
              Invité(e) par {eventDetails.invitedBy.name}
            </Text>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.refuseButton]}
              onPress={handleRefuse}
            >
              <Text style={styles.refuseButtonText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bouton pour ajouter des amis à l'événement (uniquement pour les événements owned) */}
      {eventType === 'owned' && (
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => {/* Navigation vers l'écran d'invitation */}}
        >
          <View style={styles.inviteButtonContent}>
            <Ionicons name="person-add-outline" size={20} color="#5E60CE" />
            <Text style={styles.inviteButtonText}>Inviter des amis</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#5E60CE" />
        </TouchableOpacity>
      )}

      {/* Section des hôtes (supprimée pour l'affichage anniversaire) */}
      {false && (
        <View style={styles.hostsSection}>
          <Text style={styles.hostsSectionTitle}>Hôtes</Text>
          <View style={styles.hostsCard}></View>
        </View>
      )}

      {/* Espace pour permettre le défilement avec le bottomSheet */}
      {eventType === 'owned' && (
        <View style={styles.bottomSpacing} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  // Styles personnalisés pour les headers
  customHeaderContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  customHeaderTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    fontFamily: 'System',
  },
  // Styles pour le header mariage (couple)
  dateBadge: {
    backgroundColor: '#DEFFDB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  dateBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  coupleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  personContainer: {
    alignItems: 'center',
    width: 140,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  ampersand: {
    fontSize: 40,
    fontWeight: 'bold',
    marginHorizontal: 20,
    color: '#000',
  },
  // Styles pour le header anniversaire (profil)
  birthdayInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  birthdayAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#FFD9B5', // Matches exactly the color in the screenshot
  },
  birthdayAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50, // Match container's border radius
  },
  birthdayDetailsContainer: {
    flex: 1,
  },
  birthdayPersonName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  birthdayAge: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  birthdayDateBadge: {
    backgroundColor: '#DEFFDB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  birthdayDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  eventImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  eventSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  copyButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: 2,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  invitedByText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  refuseButton: {
    backgroundColor: '#FFE5E5',
  },
  refuseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5757',
  },
  acceptButton: {
    backgroundColor: '#5E60CE',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inviteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5E60CE',
    marginLeft: 8,
  },
  hostsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  hostsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hostsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  hostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bottomSpacing: {
    height: 150,
  },
});

export default EventView;