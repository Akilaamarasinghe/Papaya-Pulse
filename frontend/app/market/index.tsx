import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { Dropdown } from '../../components/shared/Dropdown';
import api from '../../config/api';
import { District, PapayaVariety, QualityGrade, CultivationMethod, MarketPriceRequest, MarketPriceResponse } from '../../types';

export default function MarketIndexScreen() {
  const { user } = useAuth();
  const { t, language } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    district: user?.district || 'Galle' as District,
    variety: 'RedLady' as PapayaVariety,
    cultivation_method: 'Organic' as CultivationMethod,
    quality_grade: 'A' as QualityGrade,
    total_harvest_count: '',
    avg_weight_per_fruit: '',
    expected_selling_date: '',
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'si' ? 'වෙළඳපල මිල පුරෝකථනය' : 'Market Price Prediction'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'si'
            ? 'පුරෝකථනය සඳහා ප්‍රවර්ගය තෝරන්න'
            : 'Select a category for prediction'}
        </Text>
      </View>

      {/* FARMER CARDS */}
      {user?.role === 'farmer' && (
        <>
          <Card
            title={language === 'si' ? 'හොඳම ගුණාත්මක පැපොල්' : 'Best Quality Papayas'}
            icon="star-outline"
            description={
              language === 'si'
                ? 'ශ්‍රේෂ්ඨ ගුණාත්මක පැපොල් සඳහා වෙළඳපල මිල ලබා ගන්න'
                : 'Predict market price for premium quality papayas'
            }
            onPress={() => router.push('/market/predict-form?category=best' as any)}
          />

          <Card
            title={language === 'si' ? 'කර්මාන්තශාලා අලෙවිසැල්' : 'Factory Outlet Papayas'}
            icon="business-outline"
            description={
              language === 'si'
                ? 'කර්මාන්ත ශාලා සැකසීම සඳහා මිල ලබා ගන්න'
                : 'Predict price for factory processing papayas'
            }
            onPress={() => router.push('/market/predict-form?category=factory' as any)}
          />
        </>
      )}

      {/* CUSTOMER CARD – available to all users */}
      <Card
        title={language === 'si' ? 'පැපොල් ස්කෑන් කරන්න' : 'Scan Papaya for Market Price'}
        icon="camera-outline"
        description={
          language === 'si'
            ? 'ඡායාරූපයක් ගෙන ශීර්ෂත්වය, මිල සහ වෙළඳපල උපදෙස් ලබා ගන්න'
            : 'Take a photo to get ripeness, price estimate & market advice'
        }
        onPress={() => router.push('/market/customer-predict' as any)}
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
