import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { CustomerQualityResponse } from '../../types';

export default function CustomerResultScreen() {
  const params = useLocalSearchParams();
  const data: CustomerQualityResponse = params.data 
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

  const { color, variety, ripen_days, grade, average_temperature } = data;

  // Calculate taste prediction
  const taste = average_temperature >= 25 ? 'More Taste' : 'Less Taste';

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
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Papaya Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Color</Text>
            <Text style={styles.detailValue}>{color}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Variety</Text>
            <Text style={styles.detailValue}>{variety}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Days to Ripen</Text>
            <Text style={styles.detailValue}>{ripen_days} days</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Average Temperature</Text>
            <Text style={styles.detailValue}>{average_temperature.toFixed(1)}°C</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Taste Prediction</Text>
            <Text style={[styles.detailValue, styles.tasteValue]}>
              {taste}
            </Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <Text style={styles.recommendationText}>
            {grade === 'A' && 'Excellent quality papaya! Perfect for immediate consumption or as a gift.'}
            {grade === 'B' && 'Good quality papaya. Suitable for most uses with minor considerations.'}
            {grade === 'C' && 'Fair quality. Best used soon or for cooking purposes.'}
          </Text>
          <Text style={styles.recommendationText}>
            {'\n'}
            {ripen_days === 0 
              ? 'Ready to eat now!' 
              : `Wait ${ripen_days} day${ripen_days > 1 ? 's' : ''} for optimal ripeness.`}
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
  },
  detailsCard: {
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tasteValue: {
    color: '#FF6B35',
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
