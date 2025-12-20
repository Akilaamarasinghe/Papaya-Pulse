import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import { ScreenContainer } from '../components/shared/ScreenContainer';
import { LabeledInput } from '../components/shared/LabeledInput';
import { PrimaryButton } from '../components/shared/PrimaryButton';
import { Dropdown } from '../components/shared/Dropdown';
import { SignUpData, UserRole, District } from '../types';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { currentTheme, t, language } = useTheme();
  const colors = Colors[currentTheme];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SignUpData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
    district: 'Galle',
  });

  const roleOptions = [
    { label: t('farmer'), value: 'farmer' as UserRole },
    { label: t('customer'), value: 'customer' as UserRole },
  ];

  const districtOptions = [
    { label: language === 'si' ? 'හම්බන්තොට' : 'Hambanthota', value: 'Hambanthota' as District },
    { label: language === 'si' ? 'මාතර' : 'Matara', value: 'Matara' as District },
    { label: language === 'si' ? 'ගාල්ල' : 'Galle', value: 'Galle' as District },
  ];

  const handleSignUp = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(formData);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('createAccount')}</Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>{t('joinPapayaPulse')}</Text>
      </View>

      <LabeledInput
        label={t('fullName')}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Enter your full name"
        autoCapitalize="words"
      />

      <LabeledInput
        label={t('email')}
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <LabeledInput
        label={t('password')}
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        placeholder="Enter your password"
        secureTextEntry
        autoCapitalize="none"
      />

      <LabeledInput
        label={t('confirmPassword')}
        value={formData.confirmPassword}
        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
        placeholder="Confirm your password"
        secureTextEntry
        autoCapitalize="none"
      />

      <Dropdown
        label={t('role')}
        value={formData.role}
        options={roleOptions}
        onChange={(value) => setFormData({ ...formData, role: value })}
      />

      <Dropdown
        label={t('district')}
        value={formData.district}
        options={districtOptions}
        onChange={(value) => setFormData({ ...formData, district: value })}
      />

      <PrimaryButton
        title={t('signup')}
        onPress={handleSignUp}
        loading={loading}
        style={styles.button}
      />

      <PrimaryButton
        title={t('alreadyHaveAccount')}
        onPress={() => router.replace('/login' as any)}
        variant="outline"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});
