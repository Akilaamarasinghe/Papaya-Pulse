import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
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
  const data: CustomerQualityResponse = params.data ? JSON.parse(params.data as string) : null;

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No data available</Text>
          <PrimaryButton title="Go Back" onPress={() => router.back()} />
        </View>
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
  } = data;
  const grade = normalizeCustomerGrade(String(rawGrade));
  const safeAvgTemp = Number(average_temperature || 0);
  const normalizedTaste = String(taste || '').toLowerCase();
  const normalizedRipeness = String(ripeness_stage || '').toLowerCase();
  const normalizedBuying = String(buying_recommendation || '').toLowerCase();

  const getTastePrediction = () => {
    if (normalizedTaste.includes('sweet')) {
      return {
        label: 'Sweet Taste',
        emoji: '😋',
        color: '#4CAF50',
        description: 'This papaya is predicted to be sweet and flavorful based on detected fruit characteristics.',
      };
    }

    if (
      normalizedTaste.includes('bitter') ||
      normalizedTaste.includes('vegetal') ||
      normalizedTaste.includes('sour')
    ) {
      return {
        label: 'Less Taste',
        emoji: '😐',
        color: '#FF9800',
        description: 'This papaya is likely less sweet with a more raw or vegetal taste profile.',
      };
    }

    if (normalizedTaste.includes('balanced') || normalizedTaste.includes('mild')) {
      return {
        label: 'Balanced Taste',
        emoji: '🙂',
        color: '#2196F3',
        description: 'This papaya is expected to have a balanced and moderate flavor.',
      };
    }

    return safeAvgTemp >= 25
      ? {
          label: 'More Taste',
          emoji: '😋',
          color: '#4CAF50',
          description: 'Taste estimate is based on weather trend because a specific taste label was not provided.',
        }
      : {
          label: 'Less Taste',
          emoji: '😐',
          color: '#FF9800',
          description: 'Taste estimate is based on weather trend because a specific taste label was not provided.',
        };
  };

  const tastePrediction = getTastePrediction();

  const getTasteHint = () => {
    if (normalizedBuying.includes('do not buy')) {
      return 'Buying advice indicates lower eating quality right now.';
    }
    if (normalizedRipeness.includes('ripe')) {
      return 'Ripeness stage suggests this fruit is close to ready for eating.';
    }
    if (normalizedRipeness.includes('unripe') || normalizedRipeness.includes('green')) {
      return 'Ripeness stage suggests this fruit needs more time before best taste.';
    }
    return 'Taste prediction combines image analysis, ripeness, and weather factors.';
  };

  const getGradeColor = () => {
    if (grade === '1') return '#4CAF50';
    if (grade === '2') return '#FF9800';
    return '#F44336';
  };

  const getGradeLabel = () => {
    if (grade === '1') return 'Grade 1 - Best Quality';
    if (grade === '2') return 'Grade 2 - Good Quality';
    return 'Grade 3 - Acceptable';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Customer Quality Check</Text>
          <Text style={styles.headerSubtitle}>Analysis Complete</Text>
        </View>

        <View style={styles.gradeCard}>
          <Text style={styles.gradeLabel}>Quality Grade</Text>
          <View style={styles.gradeDisplay}>
            <Text style={styles.gradePrefix}>Grade</Text>
            <Text style={[styles.gradeValue, { color: getGradeColor() }]}>{grade}</Text>
          </View>
          <Text style={styles.gradeLabelText}>{getGradeLabel()}</Text>
        </View>

        <View style={styles.tasteCard}>
          <Text style={styles.sectionTitle}>🍈 Taste Prediction</Text>
          <View style={styles.tasteResult}>
            <Text style={styles.tasteEmoji}>{tastePrediction.emoji}</Text>
            <Text style={[styles.tasteLabel, { color: tastePrediction.color }]}>{tastePrediction.label}</Text>
          </View>
          <Text style={styles.tasteDescription}>{tastePrediction.description}</Text>

          {!!taste && (
            <View style={styles.tasteBadge}>
              <Text style={styles.tasteBadgeTitle}>Model Predicted Taste</Text>
              <Text style={styles.tasteBadgeValue}>{taste}</Text>
            </View>
          )}

          <Text style={styles.tasteHint}>{getTasteHint()}</Text>

          <View style={styles.tempBox}>
            <Text style={styles.tempLabel}>Average Growing Temperature</Text>
            <Text style={styles.tempValue}>{safeAvgTemp.toFixed(1)}°C</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Papaya Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🎨 Color</Text>
            <Text style={styles.detailValue}>{color}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🌱 Variety</Text>
            <Text style={styles.detailValue}>{variety}</Text>
          </View>

          {city && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📍 City</Text>
              <Text style={styles.detailValue}>{city}</Text>
            </View>
          )}

          {ripeness_stage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🥭 Ripeness Stage</Text>
              <Text style={styles.detailValue}>{ripeness_stage}</Text>
            </View>
          )}

          {taste && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>👅 Predicted Taste</Text>
              <Text style={styles.detailValue}>{taste}</Text>
            </View>
          )}

          {buying_recommendation && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🛒 Buying Recommendation</Text>
              <Text style={styles.detailValue}>{buying_recommendation}</Text>
            </View>
          )}

          {papaya_probability && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>✅ Papaya Probability</Text>
              <Text style={styles.detailValue}>{papaya_probability}</Text>
            </View>
          )}

          {color_ratios && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🎯 Color Ratios</Text>
              <Text style={styles.detailValue}>
                G:{Math.round(Number(color_ratios.green || 0) * 100)}% / Y:{Math.round(Number(color_ratios.yellow || 0) * 100)}% / O:{Math.round(Number(color_ratios.orange || 0) * 100)}%
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱️ Days to Ripen</Text>
            <Text style={styles.detailValue}>{ripen_days} days</Text>
          </View>
        </View>

        {final_suggestion && (
          <View style={styles.tasteCard}>
            <Text style={styles.sectionTitle}>🤖 Final Suggestion</Text>
            <Text style={styles.tasteDescription}>{final_suggestion}</Text>
          </View>
        )}

        <PrimaryButton
          title="Back to Quality Check"
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
  errorText: { fontSize: 18, color: '#666', marginBottom: 20 },
  header: {
    backgroundColor: '#2196F3', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#E3F2FD' },
  gradeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  gradeLabel: { fontSize: 18, color: '#666', marginBottom: 8 },
  gradeDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  gradePrefix: { fontSize: 36, fontWeight: '600', color: '#333', marginRight: 8 },
  gradeValue: { fontSize: 72, fontWeight: 'bold', marginBottom: 8 },
  gradeLabelText: { fontSize: 16, color: '#666' },
  tasteCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  tasteResult: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tasteEmoji: { fontSize: 48, marginRight: 12 },
  tasteLabel: { fontSize: 28, fontWeight: 'bold' },
  tasteDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  tasteBadge: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  tasteBadgeTitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  tasteBadgeValue: { fontSize: 16, fontWeight: '700', color: '#333', textAlign: 'center' },
  tasteHint: { fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 12, lineHeight: 18 },
  tempBox: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, alignItems: 'center' },
  tempLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  tempValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  detailsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  detailLabel: { fontSize: 16, color: '#666' },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#333' },
  button: { marginTop: 8 },
});