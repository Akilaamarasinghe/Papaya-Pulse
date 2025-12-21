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

  // Calculate taste prediction based on temperature
  const tastePrediction = average_temperature >= 25 
    ? { label: 'More Taste', emoji: '😋', color: '#4CAF50', description: 'Higher temperature during growing period indicates sweeter, more flavorful papaya' }
    : { label: 'Less Taste', emoji: '😐', color: '#FF9800', description: 'Lower temperature may result in less sweetness and flavor' };

  const getGradeColor = () => {
    switch (grade) {
      case 'I': case 'A': return '#4CAF50';
      case 'II': case 'B': return '#FF9800';
      case 'III': case 'C': return '#F44336';
      default: return '#999';
    }
  };

  const getGradeLabel = () => {
    if (grade === 'I' || grade === 'A') return 'Grade I - Best Quality';
    if (grade === 'II' || grade === 'B') return 'Grade II - Good Quality';
    if (grade === 'III' || grade === 'C') return 'Grade III - Acceptable';
    return `Grade ${grade}`;
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
          <Text style={[styles.gradeValue, { color: getGradeColor() }]}>
            {grade}
          </Text>
          <Text style={styles.gradeLabelText}>{getGradeLabel()}</Text>
        </View>

        <View style={styles.tasteCard}>
          <Text style={styles.sectionTitle}>🍈 Taste Prediction</Text>
          <View style={styles.tasteResult}>
            <Text style={styles.tasteEmoji}>{tastePrediction.emoji}</Text>
            <Text style={[styles.tasteLabel, { color: tastePrediction.color }]}>
              {tastePrediction.label}
            </Text>
          </View>
          <Text style={styles.tasteDescription}>
            {tastePrediction.description}
          </Text>
          <View style={styles.tempBox}>
            <Text style={styles.tempLabel}>Average Growing Temperature</Text>
            <Text style={styles.tempValue}>{average_temperature.toFixed(1)}°C</Text>
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

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱️ Days to Ripen</Text>
            <Text style={styles.detailValue}>{ripen_days} days</Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.sectionTitle}>💡 Recommendations</Text>
          <Text style={styles.recommendationText}>
            {(grade === 'I' || grade === 'A') && 'Excellent quality papaya! Perfect for immediate consumption or as a gift. This is premium fruit.'}
            {(grade === 'II' || grade === 'B') && 'Good quality papaya. Suitable for most uses. Great value for money.'}
            {(grade === 'III' || grade === 'C') && 'Acceptable quality. Best used soon or for cooking purposes. May have some imperfections.'}
          </Text>
          <Text style={styles.recommendationText}>
            {'\n'}
            <Text style={styles.bold}>Ripeness: </Text>
            {ripen_days === 0 
              ? 'Ready to eat now! Enjoy immediately for best taste.' 
              : `Wait ${ripen_days} day${ripen_days > 1 ? 's' : ''} for optimal ripeness and sweetness.`}
          </Text>
        </View>

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
  header: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
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
    marginBottom: 8,
  },
  gradeLabelText: {
    fontSize: 16,
    color: '#666',
  },
  tasteCard: {
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
  tasteResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tasteEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  tasteLabel: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tasteDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  tempBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tempLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  tempValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
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
  bold: {
    fontWeight: 'bold',
  },
  button: {
    marginTop: 8,
  },
});
