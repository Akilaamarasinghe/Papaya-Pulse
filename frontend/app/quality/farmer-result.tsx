import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { FarmerQualityResponse } from '../../types';

export default function FarmerResultScreen() {
  const params = useLocalSearchParams();
  const data: FarmerQualityResponse = params.data ? JSON.parse(params.data as string) : null;
  const category = (params.category as string) || 'best'; // 'best' | 'factory'

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

  const { predicted_grade, confidence, all_probabilities, extracted_color, explanation, top_features, quality_category } = data;
  const grade = predicted_grade;

  const getGradeColor = () => {
    if (grade === '1') return '#4CAF50';
    if (grade === '2') return '#FF9800';
    return '#F44336';
  };

  const getGradeLabel = () => {
    if (grade === '1') return 'Grade 1 - Premium Quality';
    if (grade === '2') return 'Grade 2 - Good Quality';
    return 'Grade 3 - Standard Quality';
  };

  const getCategoryTitle = () => (category === 'best' ? 'Best Quality Papayas' : 'Factory Outlet Papayas');

  const getGradeDescription = () => {
    if (grade === '1') return 'Excellent! Top-tier quality for premium markets.';
    if (grade === '2') return 'Good quality suitable for best quality segment.';
    return 'Standard quality — suitable for standard market or processing.';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.categoryTitle}>{getCategoryTitle()}</Text>
          <Text style={styles.categorySubtitle}>AI-Powered Grading Result</Text>
        </View>

        <View style={styles.gradeCard}>
          <Text style={styles.gradeLabel}>Quality Grade</Text>
          <View style={styles.gradeDisplay}>
            <Text style={styles.gradePrefix}>Grade</Text>
            <Text style={[styles.gradeValue, { color: getGradeColor() }]}>{grade}</Text>
          </View>
          <Text style={styles.gradeLabelText}>{getGradeLabel()}</Text>
          <Text style={styles.gradeDescription}>{getGradeDescription()}</Text>

          <View style={styles.probabilityBox}>
            <Text style={styles.probabilityLabel}>Confidence Score</Text>
            <Text style={styles.probabilityValue}>{(confidence * 100).toFixed(1)}%</Text>
          </View>
        </View>

        {/* Color Analysis Card */}
        <View style={styles.colorCard}>
          <Text style={styles.sectionTitle}>Color Analysis</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: extracted_color }]} />
            <View style={styles.colorInfo}>
              <Text style={styles.colorLabel}>Extracted Color</Text>
              <Text style={styles.colorValue}>{extracted_color}</Text>
            </View>
          </View>
          <Text style={styles.colorDescription}>
            This color was extracted from your papaya image and used for quality assessment.
          </Text>
        </View>

        {/* Grade Probabilities Card */}
        <View style={styles.probabilitiesCard}>
          <Text style={styles.sectionTitle}>Grade Probabilities</Text>
          {Object.entries(all_probabilities).map(([gradeKey, probability]) => (
            <View key={gradeKey} style={styles.probabilityRow}>
              <Text style={styles.probabilityGrade}>Grade {gradeKey}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(probability * 100).toFixed(0)}%`,
                      backgroundColor: gradeKey === '1' ? '#4CAF50' : gradeKey === '2' ? '#FF9800' : '#F44336',
                    },
                  ]}
                />
              </View>
              <Text style={styles.probabilityPercent}>{(probability * 100).toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        {/* AI Explanation Card */}
        <View style={styles.explanationCard}>
          <Text style={styles.sectionTitle}>AI Analysis</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>

        {/* Top Features Card */}
        {top_features && top_features.length > 0 && (
          <View style={styles.featuresCard}>
            <Text style={styles.sectionTitle}>Key Factors</Text>
            <Text style={styles.featuresSubtitle}>Top factors influencing this grade:</Text>
            {top_features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureHeader}>
                  <Text style={styles.featureRank}>{index + 1}</Text>
                  <Text style={styles.featureName}>{feature.feature.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.featureValue}>Value: {feature.value.toFixed(2)}</Text>
                <Text style={[
                  styles.featureImpact,
                  { color: feature.contribution > 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  Impact: {feature.contribution > 0 ? '+' : ''}{feature.contribution.toFixed(4)} 
                  ({feature.contribution > 0 ? 'increases' : 'decreases'} grade likelihood)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations Card */}
        <View style={styles.recommendationCard}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <Text style={styles.recommendationText}>
            {grade === '1' &&
              'Excellent! Premium standards met. List for best quality market at optimal pricing.'}
            {grade === '2' &&
              'Good quality. Market as best quality with competitive pricing and proper storage.'}
            {grade === '3' &&
              'Quality is standard. Consider factory outlet regrading for better returns or move to processing quickly.'}
          </Text>
        </View>

        <PrimaryButton
          title="Back to Quality Grader"
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
  headerCard: {
    backgroundColor: '#2196F3', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center',
  },
  categoryTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  categorySubtitle: { fontSize: 16, color: '#E3F2FD' },
  gradeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  gradeLabel: { fontSize: 18, color: '#666', marginBottom: 12 },
  gradeDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  gradePrefix: { fontSize: 36, fontWeight: '600', color: '#333', marginRight: 8 },
  gradeValue: { fontSize: 72, fontWeight: 'bold' },
  gradeLabelText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  gradeDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
  probabilityBox: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  probabilityLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  probabilityValue: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  colorCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  colorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  colorSwatch: { width: 60, height: 60, borderRadius: 8, marginRight: 16, borderWidth: 1, borderColor: '#ddd' },
  colorInfo: { flex: 1 },
  colorLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  colorValue: { fontSize: 18, fontWeight: '600', color: '#333' },
  colorDescription: { fontSize: 14, color: '#666', lineHeight: 20 },
  probabilitiesCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  probabilityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  probabilityGrade: { fontSize: 14, fontWeight: '600', color: '#333', width: 70 },
  progressBar: { flex: 1, height: 24, backgroundColor: '#F0F0F0', borderRadius: 12, overflow: 'hidden', marginHorizontal: 12 },
  progressFill: { height: '100%', borderRadius: 12 },
  probabilityPercent: { fontSize: 14, fontWeight: '600', color: '#333', width: 50, textAlign: 'right' },
  explanationCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  explanationText: { fontSize: 16, lineHeight: 24, color: '#333' },
  featuresCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  featuresSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  featureItem: {
    backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  featureHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureRank: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2196F3', color: '#fff',
    textAlign: 'center', lineHeight: 28, fontWeight: 'bold', marginRight: 12,
  },
  featureName: { fontSize: 16, fontWeight: '600', color: '#333' },
  featureValue: { fontSize: 14, color: '#666', marginBottom: 4, marginLeft: 40 },
  featureImpact: { fontSize: 14, fontWeight: '500', marginLeft: 40 },
  recommendationCard: {
    backgroundColor: '#FFF0EC', borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF6B35',
  },
  recommendationText: { fontSize: 16, lineHeight: 24, color: '#333' },
  button: { marginTop: 8 },
});