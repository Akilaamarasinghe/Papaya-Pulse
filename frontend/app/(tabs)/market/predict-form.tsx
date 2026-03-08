import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { LabeledInput } from '../../../components/shared/LabeledInput';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { Dropdown } from '../../../components/shared/Dropdown';
import api from '../../../config/api';
import { District, PapayaVariety, QualityGrade, CultivationMethod, MarketPriceRequest, MarketPriceResponse } from '../../../types';

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
    { label: language === 'si' ? 'α╢╗α╢¡α╖ö α╢╜α╖Üα╢⌐α╖Æ' : 'Red Lady', value: 'RedLady' as PapayaVariety },
    { label: language === 'si' ? 'α╢ºα╢║α╖Æα╢▒α╖öα╢é' : 'Tainung', value: 'Tenim' as PapayaVariety },
  ];

  const cultivationOptions = [
    { label: language === 'si' ? 'α╢Üα╖Åα╢╢α╢▒α╖Æα╢Ü' : 'Organic', value: 'Organic' as CultivationMethod },
    { label: language === 'si' ? 'α╢àα╢Üα╖Åα╢╢α╢▒α╖Æα╢Ü' : 'Inorganic', value: 'Inorganic' as CultivationMethod },
  ];

  // Different options based on category
  const gradeOptions = category === 'best'
    ? [
        { label: language === 'si' ? 'α╖üα╖èΓÇìα╢╗α╖Üα╢½α╖Æα╢║ I' : 'Grade I', value: 'I' as QualityGrade },
        { label: language === 'si' ? 'α╖üα╖èΓÇìα╢╗α╖Üα╢½α╖Æα╢║ II' : 'Grade II', value: 'II' as QualityGrade },
        { label: language === 'si' ? 'α╖üα╖èΓÇìα╢╗α╖Üα╢½α╖Æα╢║ III' : 'Grade III', value: 'III' as QualityGrade },
      ]
    : [
        { label: language === 'si' ? 'α╖üα╖èΓÇìα╢╗α╖Üα╢½α╖Æα╢║ A' : 'Grade A', value: 'A' as QualityGrade },
        { label: language === 'si' ? 'α╖üα╖èΓÇìα╢╗α╖Üα╢½α╖Æα╢║ B' : 'Grade B', value: 'B' as QualityGrade },
      ];

  const sellingDayOptions = category === 'best'
    ? [
        { label: language === 'si' ? 'α╢àα╢»' : 'Today', value: 'today' },
        { label: language === 'si' ? 'α╢»α╖Æα╢▒ 1 α╢Üα╖Æα╢▒α╖è' : '1 Day', value: '1day' },
        { label: language === 'si' ? 'α╢»α╖Æα╢▒ 2 α╢Üα╖Æα╢▒α╖è' : '2 Days', value: '2day' },
        { label: language === 'si' ? 'α╢»α╖Æα╢▒ 3 α╢Üα╖Æα╢▒α╖è' : '3 Days', value: '3day' },
        { label: language === 'si' ? 'α╢»α╖Æα╢▒ 4 α╢Üα╖Æα╢▒α╖è' : '4 Days', value: '4day' },
        { label: language === 'si' ? 'α╢»α╖Æα╢▒ 5 α╢Üα╖Æα╢▒α╖è' : '5 Days', value: '5day' },
      ]
    : [
        { label: language === 'si' ? 'α╢àα╢»' : 'Today', value: 'today' },
        { label: language === 'si' ? 'α╢»α╖Æα╢▒ 1 α╢Üα╖Æα╢▒α╖è' : '1 Day', value: '1day' },
        { label: language === 'si' ? 'α╢»α╖Æα╢▒ 2 α╢Üα╖Æα╢▒α╖è' : '2 Days', value: '2day' },
      ];

  const predictPrice = async () => {
    if (!formData.total_harvest_count || !formData.avg_weight_per_fruit || !formData.expected_selling_date) {
      Alert.alert(
        language === 'si' ? 'α╢»α╖¥α╖éα╢║α╢Üα╖Æ' : 'Error',
        language === 'si' ? 'α╢Üα╢╗α╖öα╢½α╖Åα╢Üα╢╗ α╖âα╖Æα╢║α╢╜α╖ö α╢Üα╖èα╖éα╖Üα╢¡α╖èΓÇìα╢╗ α╢┤α╖öα╢╗α╖Çα╢▒α╖èα╢▒' : 'Please fill in all fields'
      );
      return;
    }

    const harvestCount = parseInt(formData.total_harvest_count);
    const avgWeight = parseFloat(formData.avg_weight_per_fruit);

    if (isNaN(harvestCount) || isNaN(avgWeight) || harvestCount <= 0 || avgWeight <= 0) {
      Alert.alert(
        language === 'si' ? 'α╢»α╖¥α╖éα╢║α╢Üα╖Æ' : 'Error',
        language === 'si' ? 'α╢Üα╢╗α╖öα╢½α╖Åα╢Üα╢╗ α╖Çα╢╜α╢éα╢£α╖ö α╖âα╢éα╢¢α╖èΓÇìα╢║α╖Å α╢çα╢¡α╖öα╖àα╢¡α╖è α╢Üα╢╗α╢▒α╖èα╢▒' : 'Please enter valid numbers'
      );
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
        language: language,
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
      Alert.alert(
        language === 'si' ? 'α╢»α╖¥α╖éα╢║α╢Üα╖Æ' : 'Error',
        language === 'si'
          ? 'α╖Çα╖Öα╖àα╢│α╢┤α╢╜ α╢╕α╖Æα╢╜ α╢┤α╖öα╢╗α╖¥α╢Üα╢«α╢▒α╢║ α╢àα╖âα╖Åα╢╗α╖èα╢«α╢Ü α╖Çα╖Æα╢║. α╢▒α╖Éα╖Çα╢¡ α╢ïα╢¡α╖èα╖âα╖Åα╖ä α╢Üα╢╗α╢▒α╖èα╢▒.'
          : 'Failed to predict market price. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const categoryTitle = category === 'best' 
    ? (language === 'si' ? 'α╖äα╖£α╢│α╢╕ α╢£α╖öα╢½α╖Åα╢¡α╖èα╢╕α╢Ü α╢┤α╖Éα╢┤α╖£α╢╜α╖è' : 'Best Quality Papayas')
    : (language === 'si' ? 'α╢Üα╢╗α╖èα╢╕α╖Åα╢▒α╖èα╢¡α╖üα╖Åα╢╜α╖Å α╢àα╢╜α╖Öα╖Çα╖Æα╖âα╖Éα╢╜α╖è α╢┤α╖Éα╢┤α╖£α╢╜α╖è' : 'Factory Outlet Papayas');

  const categoryDesc = category === 'best'
    ? (language === 'si' ? 'α╖äα╖£α╢│α╢╕ α╖Çα╖Öα╖àα╢│α╢┤α╢╜ α╢╕α╖Æα╢╜α╢Üα╢º α╖üα╖èΓÇìα╢╗α╖Üα╖éα╖èα╢¿ α╢┤α╖Éα╢┤α╖£α╢╜α╖è α╖üα╖èΓÇìα╢╗α╖Üα╢½α╖Æα╢£α╢¡ α╢Üα╢╗α╢▒α╖èα╢▒' : 'Grade premium papayas for best market pricing')
    : (language === 'si' ? 'α╢Üα╖Åα╢╗α╖èα╢╕α╖Æα╢Ü α╖âα╖Éα╢Üα╖âα╖ôα╢╕α╢º α╖âα╖öα╢»α╖öα╖âα╖ö α╢┤α╖Éα╢┤α╖£α╢╜α╖è α╖üα╖èΓÇìα╢╗α╖Üα╢½α╖Æα╢£α╢¡ α╢Üα╢╗α╢▒α╖èα╢▒' : 'Grade papayas suitable for factory processing');

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
