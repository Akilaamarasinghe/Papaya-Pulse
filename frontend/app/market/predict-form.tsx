import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { LabeledInput } from '../../components/shared/LabeledInput';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { Dropdown } from '../../components/shared/Dropdown';
import api from '../../config/api';
import { District, PapayaVariety, QualityGrade, CultivationMethod, MarketPriceRequest, MarketPriceResponse } from '../../types';

export default function MarketPredictFormScreen() {
  const { user } = useAuth();
  const { t, language } = useTheme();
  const params = useLocalSearchParams();
  const category = params.category as string; // 'best' or 'factory'
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    district: user?.district || 'Galle' as District,
    variety: 'RedLady' as PapayaVariety,
    cultivation_method: 'Organic' as CultivationMethod,
    quality_grade: (category === 'best' ? 'I' : 'A') as QualityGrade,
    total_harvest_count: '',
    avg_weight_per_fruit: '',
    expected_selling_date: 'today',
  });

  const districtOptions = [
    { label: 'Hambanthota', value: 'Hambanthota' as District },
    { label: 'Matara', value: 'Matara' as District },
    { label: 'Galle', value: 'Galle' as District },
  ];

  const varietyOptions = [
    { label: 'Red Lady', value: 'RedLady' as PapayaVariety },
    { label: 'Tainung', value: 'Tenim' as PapayaVariety },
  ];

  const cultivationOptions = [
    { label: 'Organic', value: 'Organic' as CultivationMethod },
    { label: 'Inorganic', value: 'Inorganic' as CultivationMethod },
  ];

  // Different options based on category
  const gradeOptions = category === 'best'
    ? [
        { label: 'Grade I', value: 'I' as QualityGrade },
        { label: 'Grade II', value: 'II' as QualityGrade },
        { label: 'Grade III', value: 'III' as QualityGrade },
      ]
    : [
        { label: 'Grade A', value: 'A' as QualityGrade },
        { label: 'Grade B', value: 'B' as QualityGrade },
      ];

  const sellingDayOptions = category === 'best'
    ? [
        { label: 'Today', value: 'today' },
        { label: '1 Day', value: '1day' },
        { label: '2 Days', value: '2day' },
        { label: '3 Days', value: '3day' },
        { label: '4 Days', value: '4day' },
        { label: '5 Days', value: '5day' },
      ]
    : [
        { label: 'Today', value: 'today' },
        { label: '1 Day', value: '1day' },
        { label: '2 Days', value: '2day' },
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
          category: category,
        },
      });
    } catch (error: any) {
      console.error('Market price prediction error:', error);
      Alert.alert('Error', 'Failed to predict market price. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categoryTitle = category === 'best' 
    ? (language === 'si' ? 'හොඳම ගුණාත්මක පැපොල්' : 'Best Quality Papayas')
    : (language === 'si' ? 'කර්මාන්තශාලා අලෙවිසැල් පැපොල්' : 'Factory Outlet Papayas');

  const categoryDesc = category === 'best'
    ? 'Grade premium papayas for best market pricing'
    : 'Grade papayas suitable for factory processing';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{categoryTitle}</Text>
        <Text style={styles.subtitle}>{categoryDesc}</Text>
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

      <Dropdown
        label={t('expectedSellingDate')}
        value={formData.expected_selling_date}
        options={sellingDayOptions}
        onChange={(value) => setFormData({ ...formData, expected_selling_date: value })}
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
});
