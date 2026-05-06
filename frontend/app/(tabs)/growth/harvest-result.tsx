import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { HarvestPredictionResponse } from '../../../types';

export default function HarvestResultScreen() {
  const { currentTheme, t, language } = useTheme();
  const colors = Colors[currentTheme];
  const isDark = currentTheme === 'dark';
  const isSinhala = language === 'si';
  const params = useLocalSearchParams();

  const data: HarvestPredictionResponse | null = params.data
    ? JSON.parse(params.data as string)
    : null;

  if (!data) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.placeholder }]}>{t('noData')}</Text>
          <PrimaryButton title={t('goBack')} onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  const { predictions, farmer_explanation, farmer_explanation_si } = data;

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesSi = [
    'ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි',
    'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්',
  ];

  const today = new Date();
  const harvestDate = new Date(
    today.getTime() + predictions.harvest_days_remaining * 24 * 60 * 60 * 1000
  );
  const monthIdx = harvestDate.getMonth();
  const harvestYear = harvestDate.getFullYear();
  const harvestMonthName = isSinhala ? monthNamesSi[monthIdx] : monthNamesEn[monthIdx];

  const explanationLines = isSinhala && farmer_explanation_si
    ? farmer_explanation_si
    : farmer_explanation;

  const daysLabel = isSinhala ? 'දින' : 'days';

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Prediction Results Card */}
        <View style={[styles.resultCard, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#333' }]}>
            {t('harvestPredictionResults')}
          </Text>

          <View style={styles.predictionBox}>
            <View style={[styles.predictionItem, { backgroundColor: isDark ? '#1E293B' : '#F8F9FA' }]}>
              <Text style={[styles.predictionLabel, { color: isDark ? '#9CA3AF' : '#666' }]}>
                {t('yieldPerTree')}
              </Text>
              <Text style={[styles.predictionValue, { color: isDark ? '#34D399' : '#FF6B35' }]}>
                {predictions.yield_per_tree.toFixed(2)} kg
              </Text>
            </View>

            <View style={[styles.predictionItem, { backgroundColor: isDark ? '#1E293B' : '#F8F9FA' }]}>
              <Text style={[styles.predictionLabel, { color: isDark ? '#9CA3AF' : '#666' }]}>
                {t('totalHarvestDays')}
              </Text>
              <Text style={[styles.predictionValue, { color: isDark ? '#34D399' : '#FF6B35' }]}>
                {predictions.harvest_days_total} {daysLabel}
              </Text>
            </View>

            <View style={[styles.predictionItem, { backgroundColor: isDark ? '#1E293B' : '#F8F9FA' }]}>
              <Text style={[styles.predictionLabel, { color: isDark ? '#9CA3AF' : '#666' }]}>
                {t('daysRemaining')}
              </Text>
              <Text style={[styles.predictionValue, { color: isDark ? '#34D399' : '#FF6B35' }]}>
                {predictions.harvest_days_remaining} {daysLabel}
              </Text>
            </View>

            <View style={[styles.predictionItem, { backgroundColor: isDark ? '#1E293B' : '#F8F9FA' }]}>
              <Text style={[styles.predictionLabel, { color: isDark ? '#9CA3AF' : '#666' }]}>
                {t('expectedHarvestMonth')}
              </Text>
              <Text style={[styles.predictionValue, { color: isDark ? '#34D399' : '#FF6B35' }]}>
                {harvestMonthName} {harvestYear}
              </Text>
            </View>
          </View>
        </View>

        {/* Explanation Card */}
        <View style={[styles.explanationCard, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#333' }]}>
            {t('explanation')}
          </Text>
          {explanationLines.map((line, index) => (
            <Text
              key={index}
              style={[
                styles.explanationText,
                { color: isDark ? '#D1D5DB' : '#333' },
                line.trim() === '' && styles.emptyLine,
                line.startsWith('-') && styles.bulletPoint,
              ]}
            >
              {line}
            </Text>
          ))}
        </View>

        <PrimaryButton
          title={t('done')}
          onPress={() => router.back()}
          style={styles.button}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  predictionBox: {
    gap: 16,
  },
  predictionItem: {
    padding: 16,
    borderRadius: 12,
  },
  predictionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  explanationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  emptyLine: {
    marginBottom: 4,
  },
  bulletPoint: {
    marginLeft: 8,
  },
  button: {
    marginTop: 8,
    marginBottom: 32,
  },
});
