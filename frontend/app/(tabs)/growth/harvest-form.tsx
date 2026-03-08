import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { LabeledInput } from '../../../components/shared/LabeledInput';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { Dropdown } from '../../../components/shared/Dropdown';
import api from '../../../config/api';
import { useAuth } from '../../../context/AuthContext';
import { District, HarvestPredictionRequest, HarvestPredictionResponse, HarvestPredictionHistory } from '../../../types';

const HARVEST_HISTORY_KEY = 'harvest_prediction_history';

export default function HarvestFormScreen() {
  const { user } = useAuth();
  const { t, language } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trees_count: '',
    plant_month: 11,
    watering_method: 'drip' as 'drip' | 'sprinkler' | 'manual',
    watering_frequency: '2',
    soil_type: 'laterite_soil' as 'laterite_soil' | 'sandy_loam' | 'loam',
    district: (user?.district?.toLowerCase() || 'hambantota') as string,
  });

  const monthOptions = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];

  const wateringMethodOptions = [
    { label: 'Drip', value: 'drip' as const },
    { label: 'Sprinkler', value: 'sprinkler' as const },
    { label: 'Manual', value: 'manual' as const },
  ];

  const soilTypeOptions = [
    { label: 'Laterite Soil', value: 'laterite_soil' as const },
    { label: 'Sandy Loam', value: 'sandy_loam' as const },
    { label: 'Loam', value: 'loam' as const },
  ];

  const districtOptions = [
    { label: 'Hambantota', value: 'hambantota' as const },
    { label: 'Matara', value: 'matara' as const },
    { label: 'Galle', value: 'galle' as const },
  ];

  const calculateHarvest = async () => {
    if (!formData.trees_count) {
      Alert.alert('Error', 'Please enter the number of trees');
      return;
    }

    const treesCount = parseInt(formData.trees_count);
    if (isNaN(treesCount) || treesCount <= 0) {
      Alert.alert('Error', 'Please enter a valid number of trees');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        district: formData.district,
        soil_type: formData.soil_type,
        watering_method: formData.watering_method,
        watering_frequency: parseInt(formData.watering_frequency),
        trees_count: treesCount,
        plant_month: formData.plant_month,
        language,
      };

      console.log('Sending harvest prediction request:', requestData);

      const response = await api.post(
        '/growth/harvest',
        requestData
      );

      console.log('Harvest prediction response:', response.data);

      // Save to history
      try {
        const historyItem: HarvestPredictionHistory = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          input: {
            district: requestData.district,
            soil_type: requestData.soil_type,
            watering_method: requestData.watering_method,
            watering_frequency: requestData.watering_frequency,
            trees_count: requestData.trees_count,
            plant_month: requestData.plant_month,
          },
          result: response.data,
        };
        const existing = await AsyncStorage.getItem(HARVEST_HISTORY_KEY);
        const list: HarvestPredictionHistory[] = existing ? JSON.parse(existing) : [];
        list.unshift(historyItem);
        await AsyncStorage.setItem(HARVEST_HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
      } catch (e) {
        console.warn('Harvest history save failed:', e);
      }

      // Navigate to result screen with data
      router.push({
        pathname: '/growth/harvest-result' as any,
        params: {
          data: JSON.stringify(response.data),
        },
      });
    } catch (error: any) {
      console.error('Harvest prediction error:', error);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to calculate harvest prediction. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('harvestPrediction')}</Text>
        <Text style={styles.subtitle}>{t('enterPlantingDetails')}</Text>
      </View>

      <LabeledInput
        label={t('numberOfTrees')}
        value={formData.trees_count}
        onChangeText={(text) => setFormData({ ...formData, trees_count: text })}
        placeholder={t('egValue').replace('{value}', '120')}
        keyboardType="numeric"
      />

      <Dropdown
        label={t('plantingMonth')}
        value={formData.plant_month}
        options={monthOptions}
        onChange={(value) => setFormData({ ...formData, plant_month: value })}
      />

      <Dropdown
        label={t('wateringMethod')}
        value={formData.watering_method}
        options={wateringMethodOptions}
        onChange={(value) => setFormData({ ...formData, watering_method: value })}
      />

      <LabeledInput
        label={t('wateringFrequency')}
        value={formData.watering_frequency}
        onChangeText={(text) => setFormData({ ...formData, watering_frequency: text })}
        placeholder={t('egValue').replace('{value}', '3')}
        keyboardType="numeric"
      />

      <Dropdown
        label={t('soilType')}
        value={formData.soil_type}
        options={soilTypeOptions}
        onChange={(value) => setFormData({ ...formData, soil_type: value })}
      />

      <Dropdown
        label={t('district')}
        value={formData.district}
        options={districtOptions}
        onChange={(value) => setFormData({ ...formData, district: value })}
      />

      <PrimaryButton
        title="Calculate Harvest Prediction"
        onPress={calculateHarvest}
        loading={loading}
        style={styles.button}
      />

      <PrimaryButton
        title="Cancel"
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
