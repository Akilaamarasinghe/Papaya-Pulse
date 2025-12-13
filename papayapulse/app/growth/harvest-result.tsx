import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { HarvestPredictionResponse } from '../../types';

export default function HarvestResultScreen() {
  const { t } = useTheme();
  const params = useLocalSearchParams();
  const data: HarvestPredictionResponse = params.data 
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

  const { predictions, farmer_explanation } = data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>{t('harvestPredictionResults')}</Text>
          
          <View style={styles.predictionBox}>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('yieldPerTree')}</Text>
              <Text style={styles.predictionValue}>
                {predictions.yield_per_tree.toFixed(2)} kg
              </Text>
            </View>

            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('totalHarvestDays')}</Text>
              <Text style={styles.predictionValue}>
                {predictions.harvest_days_total} {t('language') === 'si' ? 'දින' : 'days'}
              </Text>
            </View>

            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('daysRemaining')}</Text>
              <Text style={styles.predictionValue}>
                {predictions.harvest_days_remaining} {t('language') === 'si' ? 'දින' : 'days'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <Text style={styles.sectionTitle}>{t('explanation')}</Text>
          {farmer_explanation.map((line, index) => (
            <Text key={index} style={styles.explanationText}>
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
  resultCard: {
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
  predictionBox: {
    gap: 16,
  },
  predictionItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  predictionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
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
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
});
