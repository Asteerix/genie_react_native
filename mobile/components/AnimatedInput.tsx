import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  TextInputFocusEventData
} from 'react-native';

// Récupération des dimensions de l'écran
const { width } = Dimensions.get('window');

interface AnimatedInputProps extends TextInputProps {
  /**
   * Label à afficher au-dessus du champ
   */
  label: string;
  
  /**
   * Style du conteneur
   */
  containerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Style du label
   */
  labelStyle?: StyleProp<TextStyle>;
  
  /**
   * Style du champ de saisie
   */
  inputStyle?: StyleProp<TextStyle>;
  
  /**
   * Style de la bordure
   */
  borderStyle?: StyleProp<ViewStyle>;
  
  /**
   * Message d'erreur à afficher sous le champ
   */
  error?: string;
  
  /**
   * Style du message d'erreur
   */
  errorStyle?: StyleProp<TextStyle>;
  
  /**
   * Couleur de la bordure active
   */
  activeBorderColor?: string;
  
  /**
   * Couleur de la bordure par défaut
   */
  defaultBorderColor?: string;
  
  /**
   * Couleur de la bordure d'erreur
   */
  errorBorderColor?: string;
  
  /**
   * Hauteur du champ de saisie
   */
  inputHeight?: number;
}

/**
 * Composant d'input animé avec label flottant
 */
export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  value,
  onChangeText,
  containerStyle,
  labelStyle,
  inputStyle,
  borderStyle,
  error,
  errorStyle,
  onFocus,
  onBlur,
  activeBorderColor = '#007AFF',
  defaultBorderColor = '#E0E0E0',
  errorBorderColor = '#FF3B30',
  inputHeight = 56,
  ...props
}) => {
  // États
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const [isLabelAnimated, setIsLabelAnimated] = useState(!!value);
  
  // Valeurs d'animation
  const labelPositionAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  
  // Déterminer si le champ a une valeur
  useEffect(() => {
    setHasValue(!!value);
    if (!!value && !isLabelAnimated) {
      setIsLabelAnimated(true);
      Animated.timing(labelPositionAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  }, [value, labelPositionAnim, isLabelAnimated]);
  
  // Animation de focus/blur
  useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    if (isFocused || hasValue) {
      Animated.timing(labelPositionAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
      setIsLabelAnimated(true);
    } else {
      Animated.timing(labelPositionAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
      setIsLabelAnimated(false);
    }
  }, [isFocused, hasValue, labelPositionAnim, borderColorAnim]);
  
  // Gestionnaires d'événements
  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };
  
  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };
  
  const handleChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
  };
  
  // Animations des positions et tailles
  const labelTop = labelPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [inputHeight / 2 - 10, 6],
  });
  
  const labelFontSize = labelPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });
  
  const labelColor = labelPositionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9E9E9E', '#757575'],
  });
  
  // Couleur de la bordure en fonction de l'état
  const borderColor = error
    ? errorBorderColor
    : borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [defaultBorderColor, activeBorderColor],
      });
  
  // Rendu du composant
  return (
    <View style={[styles.container, containerStyle]}>
      <View>
        <Animated.View
          style={[
            styles.border,
            {
              borderColor,
              height: inputHeight,
            },
            borderStyle,
            error && styles.errorBorder,
          ]}
        >
          <Animated.Text
            style={[
              styles.label,
              {
                top: labelTop,
                fontSize: labelFontSize,
                color: labelColor,
              },
              labelStyle,
              error && styles.errorLabel,
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            style={[
              styles.input,
              {
                height: inputHeight,
                paddingTop: 16,
              },
              inputStyle,
            ]}
            value={value}
            onChangeText={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            blurOnSubmit
            {...props}
          />
        </Animated.View>
      </View>
      {error ? (
        <Animated.Text
          style={[
            styles.error,
            errorStyle,
          ]}
        >
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  border: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 12,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  input: {
    fontSize: 16,
    color: '#212121',
    paddingHorizontal: 0,
    paddingBottom: 8,
    zIndex: 0,
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  errorBorder: {
    borderWidth: 1.5,
  },
  errorLabel: {
    color: '#FF3B30',
  },
});

export default AnimatedInput;