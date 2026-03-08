import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { HarvestPredictionResponse } from '../../../types';

export default function HarvestResultScreen() {
  const { t, language } = useTheme();
  const isSinhala = language === 'si';
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

  const { predictions, farmer_explanation, farmer_explanation_si } = data;

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesSi = [
    'α╢óα╢▒α╖Çα╖Åα╢╗α╖Æ', 'α╢┤α╖Öα╢╢α╢╗α╖Çα╖Åα╢╗α╖Æ', 'α╢╕α╖Åα╢╗α╖èα╢¡α╖ö', 'α╢àα╢┤α╖èΓÇìα╢╗α╖Üα╢╜α╖è', 'α╢╕α╖Éα╢║α╖Æ', 'α╢óα╖ûα╢▒α╖Æ',
    'α╢óα╖ûα╢╜α╖Æ', 'α╢àα╢£α╖¥α╖âα╖èα╢¡α╖ö', 'α╖âα╖Éα╢┤α╖èα╢¡α╖Éα╢╕α╖èα╢╢α╢╗α╖è', 'α╢öα╢Üα╖èα╢¡α╖¥α╢╢α╢╗α╖è', 'α╢▒α╖£α╖Çα╖Éα╢╕α╖èα╢╢α╢╗α╖è', 'α╢»α╖Öα╖âα╖Éα╢╕α╖èα╢╢α╢╗α╖è'
  ];

  const today = new Date();
  const harvestDate = new Date(today.getTime() + predictions.harvest_days_remaining * 24 * 60 * 60 * 1000);
  const monthIdx = harvestDate.getMonth();
  const harvestYear = harvestDate.getFullYear();
  const harvestMonthName = isSinhala ? monthNamesSi[monthIdx] : monthNamesEn[monthIdx];

  const explanationLines = isSinhala && farmer_explanation_si
    ? farmer_explanation_si
    : farmer_explanation;

  const daysLabel = isSinhala ? 'α╢»α╖Æα╢▒' : 'days';

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
                {predictions.harvest_days_total} {daysLabel}
              </Text>
            </View>

            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('daysRemaining')}</Text>
              <Text style={styles.predictionValue}>
                {predictions.harvest_days_remaining} {daysLabel}
              </Text>
            </View>

            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('expectedHarvestMonth')}</Text>
              <Text style={styles.predictionValue}>
                {harvestMonthName} {harvestYear}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <Text style={styles.sectionTitle}>{t('explanation')}</Text>
          {explanationLines.map((line, index) => (
            <Text 
              key={index} 
              style={[
                styles.explanationText,
                line.trim() === '' && styles.emptyLine,
                line.startsWith('-') && styles.bulletPoint
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
  emptyLine: {
    marginBottom: 4,
  },
  bulletPoint: {
    marginLeft: 8,
    color: '#555',
  },
  button: {
    marginTop: 8,
  },
});
