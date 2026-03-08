import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { MarketPriceResponse } from '../../../types';

// Map English best_selling_day values to Sinhala
const SELLING_DAY_SI_MAP: Record<string, string> = {
  'today': 'අද',
  'Today': 'අද',
  'Week 0': 'අද',
  'Week_0': 'අද',
  'week0': 'අද',
  'Week 1': 'සතිය 1',
  'Week_1': 'සතිය 1',
  'week1': 'සතිය 1',
  'Week 2': 'සතිය 2',
  'Week_2': 'සතිය 2',
  'week2': 'සතිය 2',
  '0': 'අද',
  '1': 'සතිය 1',
  '2': 'සතිය 2',
};

function getSellingDayDisplay(day: string, language: string): string {
  if (language === 'si') {
    // Check if a pre-translated Sinhala version exists
    return SELLING_DAY_SI_MAP[day] ?? day;
  }
  return day;
}

export default function MarketResultScreen() {
  const { t, language } = useTheme();
  const params = useLocalSearchParams();
  const data: MarketPriceResponse = params.data 
    ? JSON.parse(params.data as string) 
    : null;

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noData')}</Text>
          <PrimaryButton title={t('goBack')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const { predicted_price_per_kg, predicted_total_income, suggested_selling_day, explanation } = data;

  // Use Sinhala selling day if language is 'si'; prefer backend-provided translation
  const sellingDayDisplay = language === 'si'
    ? ((data as any).suggested_selling_day_si || getSellingDayDisplay(suggested_selling_day, 'si'))
    : suggested_selling_day;

  // Use Sinhala explanation if language is 'si'; prefer backend-provided translation
  const explanationLines: string[] = language === 'si'
    ? ((data as any).explanation_si ?? explanation)
    : explanation;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.priceCard}>
          <Text style={styles.sectionTitle}>{t('pricePrediction')}</Text>
          
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>{t('predictedPricePerKg')}</Text>
            <Text style={styles.priceValue}>
              Rs. {predicted_price_per_kg.toFixed(2)}
            </Text>
          </View>

          <View style={styles.incomeBox}>
            <Text style={styles.incomeLabel}>{t('totalExpectedIncome')}</Text>
            <Text style={styles.incomeValue}>
              Rs. {predicted_total_income.toLocaleString()}
            </Text>
          </View>

          <View style={styles.timingBox}>
            <Text style={styles.timingLabel}>{t('bestSellingTime')}</Text>
            <Text style={styles.timingValue}>{sellingDayDisplay}</Text>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <Text style={styles.sectionTitle}>{t('whyThisPrice')}</Text>
          {explanationLines.map((line, index) => (
            <View key={index} style={styles.explanationItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.explanationText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 {t('tip')}</Text>
          <Text style={styles.tipText}>{t('marketTip')}</Text>
        </View>

        <PrimaryButton
          title={t('done')}
          onPress={() => router.back()}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  priceBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  incomeBox: {
    backgroundColor: '#FFF0EC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  incomeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  incomeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  timingBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
  },
  timingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  explanationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  explanationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 16,
    color: '#FF6B35',
    marginRight: 8,
    marginTop: 2,
  },
  explanationText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  tipCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  button: {
    marginTop: 8,
  },
});
