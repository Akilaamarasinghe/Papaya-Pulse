import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { useTheme } from '../../context/ThemeContext';
import { CustomerQualityResponse } from '../../types';

function normalizeCustomerGrade(raw: string): '1' | '2' | '3' {
  const source = String(raw || '').trim();
  if (!source) return '3';

  const upper = source.toUpperCase();
  const lower = source.toLowerCase();

  // Numeric grade formats: "1", "Grade 1", "grade_2", "Quality-3"
  if (/(^|\b)(GRADE|QUALITY)?\s*[-_:]?\s*1(\b|$)/i.test(source)) return '1';
  if (/(^|\b)(GRADE|QUALITY)?\s*[-_:]?\s*2(\b|$)/i.test(source)) return '2';
  if (/(^|\b)(GRADE|QUALITY)?\s*[-_:]?\s*3(\b|$)/i.test(source)) return '3';

  // Roman numerals
  if (/\bIII\b/.test(upper)) return '3';
  if (/\bII\b/.test(upper)) return '2';
  if (/\bI\b/.test(upper)) return '1';

  // Letter grades
  if (/\bA\b/.test(upper)) return '1';
  if (/\bB\b/.test(upper)) return '2';
  if (/\bC\b/.test(upper)) return '3';

  // Textual quality levels
  if (/(best|high|premium|excellent|top)/.test(lower)) return '1';
  if (/(good|medium|average|standard|normal)/.test(lower)) return '2';
  if (/(low|poor|bad|reject|damaged|unacceptable|unripe|overripe)/.test(lower)) return '3';

  return '3';
}

export default function CustomerResultScreen() {
  const params = useLocalSearchParams();
  const data: any = params.data ? JSON.parse(params.data as string) : null;
  const { t } = useTheme();

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

  const isNotPapaya = data?.is_papaya === false || String(data?.message || '').toLowerCase().includes('not a papaya');

  const getGradeConfig = (currentGrade: '1' | '2' | '3') => {
    if (currentGrade === '1') {
      return {
        backgroundColor: '#4CAF50',
        textColor: '#FFFFFF',
        title: t('gradePrefix') + ' 1',
        subtitle: t('verySuitableForBuy'),
      };
    }

    if (currentGrade === '2') {
      return {
        backgroundColor: '#FFC107',
        textColor: '#1F2937',
        title: t('gradePrefix') + ' 2',
        subtitle: t('normalSuitableForBuy'),
      };
    }

    return {
      backgroundColor: '#F44336',
      textColor: '#FFFFFF',
      title: t('gradePrefix') + ' 3',
      subtitle: t('doNotBuySubtitle'),
    };
  };

  if (isNotPapaya) {
    const notPapayaGradeConfig = {
      backgroundColor: '#F44336',
      textColor: '#FFFFFF',
      title: t('notAPapayaTitle'),
      subtitle: t('doNotBuySubtitle'),
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('customerQualityCheck')}</Text>
            <Text style={styles.headerSubtitle}>{t('imageValidationResult')}</Text>
          </View>

          <View style={[styles.gradeCard, { backgroundColor: notPapayaGradeConfig.backgroundColor }]}> 
            <Text style={[styles.gradeLabel, { color: notPapayaGradeConfig.textColor }]}>{t('qualityGrade')}</Text>
            <View style={styles.gradeDisplay}>
              <Text style={[styles.gradeValueTextOnly, { color: notPapayaGradeConfig.textColor }]}>{notPapayaGradeConfig.title}</Text>
            </View>
            <Text style={[styles.gradeLabelText, { color: notPapayaGradeConfig.textColor }]}>{notPapayaGradeConfig.subtitle}</Text>
          </View>

          <View style={styles.tasteCard}>
            <Text style={styles.tasteDescription}>
              {data?.message || t('notAPapayaMessage') || 'The uploaded image does not appear to be a papaya. Please upload a clear full-papaya image.'}
            </Text>

            {!!data?.papaya_probability && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('papayaProbabilityLabel')}</Text>
                <Text style={styles.detailValue}>{data.papaya_probability}</Text>
              </View>
            )}

            {!!data?.not_papaya_probability && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('notPapayaProbLabel')}</Text>
                <Text style={styles.detailValue}>{data.not_papaya_probability}</Text>
              </View>
            )}

            {!!data?.city && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('cityLabel')}</Text>
                <Text style={styles.detailValue}>{data.city}</Text>
              </View>
            )}
          </View>

          <PrimaryButton
            title={t('tryAnotherImage')}
            onPress={() => router.push('/quality/customer-input')}
            style={styles.button}
          />

          <PrimaryButton
            title={t('backToQualityMenu')}
            onPress={() => router.push('/quality')}
            variant="outline"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const {
    color,
    variety,
    ripen_days,
    grade: rawGrade,
    average_temperature,
    city,
    ripeness_stage,
    taste,
    buying_recommendation,
    color_ratios,
    final_suggestion,
    papaya_probability,
  } = data as CustomerQualityResponse;
  const grade = normalizeCustomerGrade(String(rawGrade));
  const safeAvgTemp = Number(average_temperature || 0);
  const normalizedTaste = String(taste || '').toLowerCase();
  const normalizedRipeness = String(ripeness_stage || '').toLowerCase();
  const normalizedBuying = String(buying_recommendation || '').toLowerCase();

  const getTastePrediction = () => {
    if (normalizedTaste.includes('sweet')) {
      return {
        label: t('sweetTaste'),
        emoji: '😋',
        color: '#4CAF50',
        description: t('sweetTasteDesc'),
      };
    }

    if (
      normalizedTaste.includes('bitter') ||
      normalizedTaste.includes('vegetal') ||
      normalizedTaste.includes('sour')
    ) {
      return {
        label: t('lessTaste'),
        emoji: '😐',
        color: '#FF9800',
        description: t('lessTasteDesc'),
      };
    }

    if (normalizedTaste.includes('balanced') || normalizedTaste.includes('mild')) {
      return {
        label: t('balancedTaste'),
        emoji: '🙂',
        color: '#2196F3',
        description: t('balancedTasteDesc'),
      };
    }

    return safeAvgTemp >= 25
      ? {
          label: t('moreTaste'),
          emoji: '😋',
          color: '#4CAF50',
          description: t('tasteWeatherDesc'),
        }
      : {
          label: t('lessTaste'),
          emoji: '😐',
          color: '#FF9800',
          description: t('tasteWeatherDesc'),
        };
  };

  const tastePrediction = getTastePrediction();

  const getTasteHint = () => {
    if (normalizedBuying.includes('do not buy')) {
      return t('tasteHintDontBuy');
    }
    if (normalizedRipeness.includes('ripe')) {
      return t('tasteHintRipe');
    }
    if (normalizedRipeness.includes('unripe') || normalizedRipeness.includes('green')) {
      return t('tasteHintUnripe');
    }
    return t('tasteHintGeneral');
  };

  const gradeConfig = getGradeConfig(grade);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('customerQualityCheck')}</Text>
          <Text style={styles.headerSubtitle}>{t('analysisComplete')}</Text>
        </View>

        <View style={[styles.gradeCard, { backgroundColor: gradeConfig.backgroundColor }]}>
          <Text style={[styles.gradeLabel, { color: gradeConfig.textColor }]}>{t('qualityGrade')}</Text>
          <View style={styles.gradeDisplay}>
            <Text style={[styles.gradePrefix, { color: gradeConfig.textColor }]}>{t('gradePrefix')}</Text>
            <Text style={[styles.gradeValue, { color: gradeConfig.textColor }]}>{grade}</Text>
          </View>
          <Text style={[styles.gradeLabelText, { color: gradeConfig.textColor }]}>{gradeConfig.subtitle}</Text>
        </View>

        <View style={styles.tasteCard}>
          <Text style={styles.sectionTitle}>{t('tastePredictionSection')}</Text>
          <View style={styles.tasteResult}>
            <Text style={styles.tasteEmoji}>{tastePrediction.emoji}</Text>
            <Text style={[styles.tasteLabel, { color: tastePrediction.color }]}>{tastePrediction.label}</Text>
          </View>
          <Text style={styles.tasteDescription}>{tastePrediction.description}</Text>

          {!!taste && (
            <View style={styles.tasteBadge}>
              <Text style={styles.tasteBadgeTitle}>{t('modelPredictedTaste')}</Text>
              <Text style={styles.tasteBadgeValue}>{taste}</Text>
            </View>
          )}

          <Text style={styles.tasteHint}>{getTasteHint()}</Text>

          <View style={styles.tempBox}>
            <Text style={styles.tempLabel}>{t('avgGrowingTemp')}</Text>
            <Text style={styles.tempValue}>{safeAvgTemp.toFixed(1)}°C</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>{t('papayaDetailsSection')}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('colorLabel')}</Text>
            <Text style={styles.detailValue}>{color}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('varietyLabel')}</Text>
            <Text style={styles.detailValue}>{variety}</Text>
          </View>

          {city && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('cityLabel')}</Text>
              <Text style={styles.detailValue}>{city}</Text>
            </View>
          )}

          {ripeness_stage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('ripenessStageLabel')}</Text>
              <Text style={styles.detailValue}>{ripeness_stage}</Text>
            </View>
          )}

          {taste && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('predictedTasteLabel')}</Text>
              <Text style={styles.detailValue}>{taste}</Text>
            </View>
          )}

          {buying_recommendation && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('buyingRecommendationLabel')}</Text>
              <Text style={styles.detailValue}>{buying_recommendation}</Text>
            </View>
          )}

          {papaya_probability && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('papayaProbabilityLabel')}</Text>
              <Text style={styles.detailValue}>{papaya_probability}</Text>
            </View>
          )}

          {color_ratios && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('colorRatiosLabel')}</Text>
              <Text style={styles.detailValue}>
                G:{Math.round(Number(color_ratios.green || 0) * 100)}% / Y:{Math.round(Number(color_ratios.yellow || 0) * 100)}% / O:{Math.round(Number(color_ratios.orange || 0) * 100)}%
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('daysToRipenLabel')}</Text>
            <Text style={styles.detailValue}>{ripen_days} {t('daysUnit')}</Text>
          </View>
        </View>

        {final_suggestion && (
          <View style={styles.tasteCard}>
            <Text style={styles.sectionTitle}>{t('finalSuggestionSection')}</Text>
            <Text style={styles.tasteDescription}>{final_suggestion}</Text>
          </View>
        )}

        <PrimaryButton
          title={t('backToQualityCheck')}
          onPress={() => router.push('/quality')}
          style={styles.button}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 20, color: '#0a0909', marginBottom: 20 },
  header: {
    backgroundColor: '#2196F3', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 18, color: '#E3F2FD' },
  gradeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  gradeLabel: { fontSize: 20, color: '#666', marginBottom: 8 },
  gradeDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  gradePrefix: { fontSize: 37, fontWeight: '600', color: '#333', marginRight: 8 },
  gradeValue: { fontSize: 73, fontWeight: 'bold', marginBottom: 8 },
  gradeValueTextOnly: { fontSize: 43, fontWeight: '700', marginBottom: 8 },
  gradeLabelText: { fontSize: 17, color: '#666' },
  tasteCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  tasteResult: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tasteEmoji: { fontSize: 49, marginRight: 12 },
  tasteLabel: { fontSize: 29, fontWeight: 'bold' },
  tasteDescription: { fontSize: 16, color: '#1a1919', textAlign: 'center', marginBottom: 16, lineHeight: 21 },
  tasteBadge: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  tasteBadgeTitle: { fontSize: 13, color: '#666', marginBottom: 4 },
  tasteBadgeValue: { fontSize: 17, fontWeight: '700', color: '#333', textAlign: 'center' },
  tasteHint: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 12, lineHeight: 19 },
  tempBox: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, alignItems: 'center' },
  tempLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
  tempValue: { fontSize: 21, fontWeight: 'bold', color: '#FF6B35' },
  detailsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 21, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  detailLabel: { fontSize: 17, color: '#666' },
  detailValue: { fontSize: 17, fontWeight: '600', color: '#333' },
  button: { marginTop: 8 },
});