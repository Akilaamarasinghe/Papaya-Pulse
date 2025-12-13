import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { FarmerQualityResponse } from '../../types';

export default function FarmerResultScreen() {
  const params = useLocalSearchParams();
  const data: FarmerQualityResponse = params.data 
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

  const { grade, damage_probability, explanation } = data;

  const getGradeColor = () => {
    switch (grade) {
      case 'A': return '#4CAF50';
      case 'B': return '#FF9800';
      case 'C': return '#F44336';
      default: return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.gradeCard}>
          <Text style={styles.gradeLabel}>Quality Grade</Text>
          <Text style={[styles.gradeValue, { color: getGradeColor() }]}>
            {grade}
          </Text>
          <View style={styles.probabilityBox}>
            <Text style={styles.probabilityLabel}>Damage Probability</Text>
            <Text style={styles.probabilityValue}>
              {(damage_probability * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <Text style={styles.sectionTitle}>Detailed Analysis</Text>
          {explanation.map((line, index) => (
            <View key={index} style={styles.explanationItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.explanationText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <Text style={styles.recommendationText}>
            {grade === 'A' && 'Excellent quality! Perfect for premium market pricing.'}
            {grade === 'B' && 'Good quality. Suitable for standard market with minor considerations.'}
            {grade === 'C' && 'Fair quality. Consider quick sale or processing options.'}
          </Text>
        </View>

        <PrimaryButton
          title="Done"
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
  gradeCard: {
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
  gradeLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  gradeValue: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  probabilityBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  probabilityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  probabilityValue: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  recommendationCard: {
    backgroundColor: '#FFF0EC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  button: {
    marginTop: 8,
  },
});
