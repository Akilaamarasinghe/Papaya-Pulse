import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { LeafDiseaseResponse, DiseaseType, SeverityLevel } from '../../types';

// Disease advisory information
const diseaseAdvisory: Record<DiseaseType, { description: string; treatment: string[] }> = {
  'Anthracnose': {
    description: 'A fungal disease causing dark, sunken lesions on leaves and fruits.',
    treatment: [
      'Remove and destroy infected plant parts',
      'Apply copper-based fungicides',
      'Ensure proper drainage and air circulation',
      'Avoid overhead irrigation',
    ],
  },
  'Curl': {
    description: 'Leaf curling caused by viral infection, often spread by insects.',
    treatment: [
      'Remove infected plants to prevent spread',
      'Control insect vectors (aphids, whiteflies)',
      'Use resistant varieties',
      'Maintain field hygiene',
    ],
  },
  'Mite disease': {
    description: 'Damage caused by mites feeding on leaf tissues.',
    treatment: [
      'Apply miticides or neem oil',
      'Release predatory mites',
      'Maintain proper humidity levels',
      'Remove heavily infested leaves',
    ],
  },
  'Ringspot': {
    description: 'Viral disease causing ring-shaped spots and stunted growth.',
    treatment: [
      'No cure available - remove infected plants',
      'Control aphid vectors',
      'Use virus-free planting material',
      'Implement strict sanitation practices',
    ],
  },
  'Healthy': {
    description: 'Your papaya leaf appears healthy with no visible diseases.',
    treatment: [
      'Continue regular monitoring',
      'Maintain good cultural practices',
      'Ensure balanced nutrition',
      'Keep optimal watering schedule',
    ],
  },
  'NotPapaya': {
    description: 'This does not appear to be a papaya leaf.',
    treatment: [
      'Please take a photo of an actual papaya leaf',
      'Ensure the entire leaf is visible',
      'Use good lighting for better detection',
    ],
  },
};

const formatPercent = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return `${(value * 100).toFixed(1)}%`;
};

const formatStageLabel = (label?: string | null) => {
  if (!label) {
    return 'Not provided';
  }
  return label
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function LeafResultScreen() {
  const params = useLocalSearchParams();
  const data: LeafDiseaseResponse = params.data 
    ? JSON.parse(params.data as string) 
    : null;

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

  const { disease, disease_confidence, severity, severity_confidence } = data;
  const advisory = diseaseAdvisory[disease];
  const isNotLeaf = data.is_leaf === false || disease === 'NotPapaya';
  const showSeverity = !isNotLeaf && disease !== 'Healthy' && severity !== 'unknown' && severity_confidence > 0;
  const showStage = !isNotLeaf && Boolean(data.stage_label);

  const getSeverityColor = (sev: SeverityLevel) => {
    switch (sev) {
      case 'mild': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'severe': return '#F44336';
      default: return '#999';
    }
  };

  const getDiseaseColor = () => {
    if (disease === 'Healthy') return '#4CAF50';
    if (disease === 'NotPapaya') return '#999';
    return '#F44336';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Detection Result</Text>
          <Text style={[styles.diseaseValue, { color: getDiseaseColor() }]}>
            {isNotLeaf ? 'Not a Papaya Leaf' : disease}
          </Text>
          <View style={styles.confidenceBox}>
            <Text style={styles.confidenceLabel}>Model Confidence</Text>
            <Text style={styles.confidenceValue}>{formatPercent(disease_confidence)}</Text>
          </View>

          {showSeverity && (
            <View style={[styles.severityBox, { backgroundColor: getSeverityColor(severity) + '20' }]}>
              <Text style={styles.severityLabel}>Severity Level</Text>
              <Text style={[styles.severityValue, { color: getSeverityColor(severity) }]}>
                {severity.toUpperCase()}
              </Text>
              <Text style={styles.severityConfidence}>
                ({formatPercent(severity_confidence)} confidence)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Leaf Verification</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Leaf Confidence</Text>
              <Text style={styles.metricValue}>{formatPercent(data.leaf_confidence)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Not Leaf</Text>
              <Text style={styles.metricValue}>{formatPercent(data.not_leaf_confidence)}</Text>
            </View>
          </View>
          <Text style={styles.sectionHint}>
            {isNotLeaf
              ? 'Please retake the photo ensuring a papaya leaf fills most of the frame.'
              : 'Great! The model is confident that the uploaded image is a papaya leaf.'}
          </Text>
        </View>

        {showStage && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Disease Stage Insight</Text>
            <Text style={styles.stageValue}>{formatStageLabel(data.stage_label)}</Text>
            <Text style={styles.stageConfidence}>Confidence: {formatPercent(data.stage_confidence)}</Text>
          </View>
        )}

        {data.model_metadata && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Model Details</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Version</Text>
                <Text style={styles.metricValue}>
                  {data.model_metadata.model_version || '—'}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Latency</Text>
                <Text style={styles.metricValue}>
                  {data.model_metadata.inference_time_ms
                    ? `${data.model_metadata.inference_time_ms} ms`
                    : '—'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {advisory && (
          <>
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>About This {disease === 'Healthy' ? 'Result' : 'Disease'}</Text>
              <Text style={styles.descriptionText}>{advisory.description}</Text>
            </View>

            <View style={styles.treatmentCard}>
              <Text style={styles.sectionTitle}>
                {disease === 'Healthy' ? 'Recommendations' : disease === 'NotPapaya' ? 'Instructions' : 'Treatment & Prevention'}
              </Text>
              {advisory.treatment.map((step, index) => (
                <View key={index} style={styles.treatmentItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.treatmentText}>{step}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <PrimaryButton
          title="Done"
          onPress={() => router.back()}
          style={styles.button}
        />

        <PrimaryButton
          title="Scan Another Leaf"
          onPress={() => router.replace('/leaf/scan' as any)}
          variant="outline"
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
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  diseaseValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  confidenceBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  severityBox: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  severityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  severityConfidence: {
    fontSize: 12,
    color: '#666',
  },
  sectionCard: {
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metricItem: {
    flex: 1,
    paddingRight: 12,
  },
  metricLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  sectionHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  stageValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  stageConfidence: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  descriptionCard: {
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
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  treatmentCard: {
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
  treatmentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  treatmentText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  button: {
    marginBottom: 16,
  },
});
