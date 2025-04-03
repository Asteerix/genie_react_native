import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ProfileScreen.styles'; // Importer les styles

interface ProfileCompletionStep {
  id: string;
  label: string;
  completed: boolean;
}

interface ProfileCompletionData {
  percentage: number; // 25, 50, 75 ou 100
  steps: ProfileCompletionStep[];
}

interface ProfileCompletionCardProps {
  completionData: ProfileCompletionData;
  isPersonalAccount: boolean; // Pour conditionner l'affichage
  onContinue?: () => void; // Action pour le bouton "CONTINUER"
  onStepPress?: (stepId: string) => void; // Action si on clique sur une étape (optionnel)
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  completionData,
  isPersonalAccount,
  onContinue,
  onStepPress,
}) => {
  // N'affiche la carte que si c'est un compte personnel
  if (!isPersonalAccount) {
    return null;
  }

  const getCardStyle = () => {
    if (completionData.percentage <= 25) return styles.profileCompletionCardPink;
    if (completionData.percentage <= 50) return styles.profileCompletionCardYellow;
    return styles.profileCompletionCardGreen; // >= 75%
  };

  const getProgressBarStyle = () => {
    if (completionData.percentage <= 25) return styles.progressBarPink;
    if (completionData.percentage <= 50) return styles.progressBarYellow;
    return styles.progressBarGreen; // >= 75%
  };

  return (
    <View style={[styles.profileCompletionCard, getCardStyle()]}>
      <View style={styles.profileCompletionHeader}>
        <Text style={styles.profileCompletionTitle}>
          Profil complété à {completionData.percentage} %
        </Text>
        {/* L'icône chevron pourrait dépendre d'un état "déplié/replié" si nécessaire */}
        <Ionicons
          name={completionData.percentage >= 75 ? "chevron-up" : "chevron-down"} // Logique simplifiée basée sur le %
          size={18}
          color="#333"
        />
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            getProgressBarStyle(),
            { width: `${completionData.percentage}%` }
          ]}
        />
      </View>

      <View style={styles.completionStepsContainer}>
        {completionData.steps.map((step) => (
          <TouchableOpacity
            key={step.id}
            style={styles.completionStep}
            onPress={() => onStepPress?.(step.id)} // Permet de cliquer sur une étape
            disabled={!onStepPress} // Désactive si aucune action n'est fournie
          >
            <View style={styles.stepIconContainer}>
              {step.completed ? (
                <Ionicons name="checkmark-circle" size={22} color="#34C759" />
              ) : (
                <View style={styles.emptyCircle} />
              )}
            </View>
            <Text style={styles.stepText}>{step.label}</Text>
            {/* Affiche la flèche seulement si une action est possible */}
            {onStepPress && step.id !== 'invite_friends' && ( // Condition originale conservée
              <Ionicons name="chevron-forward" size={16} color="#999" style={styles.stepArrow} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {onContinue && ( // Affiche le bouton seulement si une action est fournie
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>CONTINUER</Text>
          <Ionicons name="chevron-forward" size={16} color="#333" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProfileCompletionCard;