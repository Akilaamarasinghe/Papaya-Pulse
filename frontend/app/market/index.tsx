import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { LabeledInput } from '../../components/shared/LabeledInput';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { Dropdown } from '../../components/shared/Dropdown';
import api from '../../config/api';
import { District, PapayaVariety, MarketGrade, CultivationMethod, MarketPriceRequest, MarketPriceResponse } from '../../types';

export default function MarketIndexScreen() {
  const { user } = useAuth();
  const { t, language } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    district: user?.district || 'Galle' as District,
    variety: 'RedLady' as PapayaVariety,
    cultivation_method: 'Organic' as CultivationMethod,
    quality_grade: 'A' as MarketGrade,
    total_harvest_count: '',
    avg_weight_per_fruit: '',
    expected_selling_date: '',
  });

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

  const districtOptions = [
    { label: 'Hambanthota', value: 'Hambanthota' as District },
    { label: 'Matara', value: 'Matara' as District },
    { label: 'Galle', value: 'Galle' as District },
  ];

  const varietyOptions = [
    { label: 'Red Lady', value: 'RedLady' as PapayaVariety },
    { label: 'Solo', value: 'Solo' as PapayaVariety },
    { label: 'Tainung', value: 'Tenim' as PapayaVariety },
  ];

  const cultivationOptions = [
    { label: 'Organic', value: 'Organic' as CultivationMethod },
    { label: 'Inorganic', value: 'Inorganic' as CultivationMethod },
  ];

  const gradeOptions = [
    { label: 'Grade A', value: 'A' as MarketGrade },
    { label: 'Grade B', value: 'B' as MarketGrade },
    { label: 'Grade C', value: 'C' as MarketGrade },
  ];

  const predictPrice = async () => {
    if (!formData.total_harvest_count || !formData.avg_weight_per_fruit || !formData.expected_selling_date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const harvestCount = parseInt(formData.total_harvest_count);
    const avgWeight = parseFloat(formData.avg_weight_per_fruit);

    if (isNaN(harvestCount) || isNaN(avgWeight) || harvestCount <= 0 || avgWeight <= 0) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    setLoading(true);
    try {
      const requestData: MarketPriceRequest = {
        district: formData.district,
        variety: formData.variety,
        cultivation_method: formData.cultivation_method,
        quality_grade: formData.quality_grade,
        total_harvest_count: harvestCount,
        avg_weight_per_fruit: avgWeight,
        expected_selling_date: formData.expected_selling_date,
      };

      const response = await api.post<MarketPriceResponse>(
        '/market/predict',
        requestData
      );

      router.push({
        pathname: '/market/result' as any,
        params: {
          data: JSON.stringify(response.data),
        },
      });
    } catch (error: any) {
      console.error('Market price prediction error:', error);
      Alert.alert('Error', 'Failed to predict market price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('marketPricePredictor')}</Text>
        <Text style={styles.subtitle}>{t('getBestPrice')}</Text>
      </View>

      <Dropdown
        label={t('district')}
        value={formData.district}
        options={districtOptions}
        onChange={(value) => setFormData({ ...formData, district: value })}
      />

      <Dropdown
        label={t('variety')}
        value={formData.variety}
        options={varietyOptions}
        onChange={(value) => setFormData({ ...formData, variety: value })}
      />

      <Dropdown
        label={t('cultivationMethod')}
        value={formData.cultivation_method}
        options={cultivationOptions}
        onChange={(value) => setFormData({ ...formData, cultivation_method: value })}
      />

      <Dropdown
        label={t('qualityGrade')}
        value={formData.quality_grade}
        options={gradeOptions}
        onChange={(value) => setFormData({ ...formData, quality_grade: value })}
      />

      <LabeledInput
        label={t('totalHarvestCount')}
        value={formData.total_harvest_count}
        onChangeText={(text) => setFormData({ ...formData, total_harvest_count: text })}
        placeholder={t('egValue').replace('{value}', '500')}
        keyboardType="numeric"
      />

      <LabeledInput
        label={t('avgWeightPerFruit')}
        value={formData.avg_weight_per_fruit}
        onChangeText={(text) => setFormData({ ...formData, avg_weight_per_fruit: text })}
        placeholder={t('egValue').replace('{value}', '1.2')}
        keyboardType="decimal-pad"
      />

      <LabeledInput
        label={t('expectedSellingDate')}
        value={formData.expected_selling_date}
        onChangeText={(text) => setFormData({ ...formData, expected_selling_date: text })}
        placeholder={t('egValue').replace('{value}', '2025-12-10')}
      />

      <PrimaryButton
        title={t('predictMarketPrice')}
        onPress={predictPrice}
        loading={loading}
        style={styles.button}
      />

      <PrimaryButton
        title={t('cancel')}
        onPress={() => router.back()}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
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
