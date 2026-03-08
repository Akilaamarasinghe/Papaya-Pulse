import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

interface LabeledInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: focused ? colors.primary : colors.subtext }]}>
        {label.toUpperCase()}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error
              ? colors.error
              : focused
              ? colors.primary
              : colors.inputBorder,
            shadowColor: focused ? colors.primary : 'transparent',
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            style,
          ]}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  inputWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 0,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    marginLeft: 4,
  },
});
