import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps } from 'react-native';

interface AuthInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const AuthInput: React.FC<AuthInputProps> = ({ value, onChangeText, style, ...rest }) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
        autoCapitalize="none"
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    width: '100%',
    marginVertical: 10,
  },
  input: {
    height: 60,
    paddingHorizontal: 20,
    fontSize: 18,
  },
});

export default AuthInput;