import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';
import { PrimaryButton } from '../../components/shared/PrimaryButton';

export default function MarketIndexScreen() {
  const { user } = useAuth();
  const { t, language } = useTheme();

  // Check if user is a farmer
  if (user?.role !== 'farmer') {
    return (
      <ScreenContainer>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedTitle}>{t('farmersOnly')}</Text>
          <Text style={styles.restrictedText}>
            {language === 'si' 
              ? 'මෙම විශේෂාංගය ගොවීන් සඳහා පමණි. වෙළඳපල මිල පුරෝකථන වලට ප්‍රවේශ වීමට කරුණාකර ගොවි ගිණුමක් සමඟ පුරන්න.'
              : 'This feature is only available for farmers. Please sign in with a farmer account to access market price predictions.'}
          </Text>
          <PrimaryButton
            title={t('goBack')}
            onPress={() => router.back()}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'si' ? 'වෙළඳපල මිල පුරෝකථනය' : 'Market Price Prediction'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'si' 
            ? 'පුරෝකථනය සඳහා පැපොල් වර්ගය තෝරන්න'
            : 'Select papaya category for prediction'}
        </Text>
      </View>

      {/* FARMER SIDE - Show two category options */}
      <Card
        title="Best Quality Papayas"
        icon="star-outline"
        description="Predict market price for premium quality papayas"
        onPress={() => router.push('/market/predict-form?category=best' as any)}
      />

      <Card
        title="Factory Outlet Papayas"
        icon="business-outline"
        description="Predict price for factory processing papayas"
        onPress={() => router.push('/market/predict-form?category=factory' as any)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  restrictedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});
