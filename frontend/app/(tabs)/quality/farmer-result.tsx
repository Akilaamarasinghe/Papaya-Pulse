import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { useTheme } from '../../../context/ThemeContext';
import { FarmerQualityResponse } from '../../../types';

export default function FarmerResultScreen() {
  const params = useLocalSearchParams();
  const data: FarmerQualityResponse = params.data ? JSON.parse(params.data as string) : null;
  const category = (params.category as string) || 'best'; // 'best' | 'factory'
  const { t } = useTheme();

  const notPapayaText = String((data as any)?.message || (data as any)?.prediction || '').toLowerCase();
  const isNotPapaya = (data as any)?.is_papaya === false || notPapayaText.includes('not a papaya');

  console.log('\n======= RESULT SCREEN DEBUG START =======');
  console.log('Raw params.data:', params.data);
  console.log('Parsed data:', JSON.stringify(data, null, 2));
  console.log('Category:', category);
  console.log('data.prediction VALUE:', data?.prediction);
  console.log('data.prediction TYPE:', typeof data?.prediction);
  console.log('data.prediction LENGTH:', data?.prediction?.length);
  console.log('data.prediction CHAR CODES:', data?.prediction?.split('').map(c => c.charCodeAt(0)));
  console.log('Is Type A?', data?.prediction === 'Type A');
  console.log('Is Type B?', data?.prediction === 'Type B');
  console.log('======= RESULT SCREEN DEBUG END =======\n');

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No data available</Text>
          <PrimaryButton title={t('goBack')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (isNotPapaya) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.categoryTitle}>{category === 'factory' ? t('factoryOutletPapayas') : t('bestQualityPapayas')}</Text>
            <Text style={styles.categorySubtitle}>{t('imageAnalysisResult')}</Text>
          </View>

          <View style={[styles.gradeCard, { backgroundColor: '#F44336' }]}>
            <Text style={[styles.gradeLabel, { color: '#FFFFFF' }]}>{t('qualityGrade')}</Text>
            <View style={styles.gradeDisplay}>
              <Text style={[styles.gradeValueTextOnly, { color: '#FFFFFF' }]}>{t('notAPapayaTitle')}</Text>
            </View>
            <Text style={[styles.gradeLabelText, { color: '#FFFFFF' }]}>{t('doNotProceedWithGrading')}</Text>
          </View>

          <PrimaryButton
            title={t('backToQualityGrader')}
            onPress={() => router.push('/quality')}
            style={styles.button}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Factory Outlet Result
  if (category === 'factory' && data.prediction) {
    const predictionValue = String(data.prediction || '').trim();
    
    console.log('\n===== FACTORY OUTLET RENDERING =====');
    console.log('Original data.prediction:', data.prediction);
    console.log('Cleaned predictionValue:', predictionValue);
    console.log('predictionValue === "Type A":', predictionValue === 'Type A');
    console.log('predictionValue === "Type B":', predictionValue === 'Type B');
    console.log('=====================================\n');
    
    const typeConfig =
      predictionValue === 'Type A'
        ? {
            backgroundColor: '#4CAF50',
            textColor: '#FFFFFF',
            subtitle: t('smallDamagesSubtitle'),
          }
        : {
            backgroundColor: '#F44336',
            textColor: '#FFFFFF',
            subtitle: t('moreDamagesSubtitle'),
          };

    const confidenceValue = typeof data.confidence === 'string' 
      ? parseFloat((data.confidence as string).replace('%', '')) 
      : ((data.confidence as number) || 0) * 100;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.headerCard}>
            <Text style={styles.categoryTitle}>{t('factoryOutletPapayas')}</Text>
            <Text style={styles.categorySubtitle}>{t('imageAnalysisResult')}</Text>
          </View>

          <View style={[styles.gradeCard, { backgroundColor: typeConfig.backgroundColor }]}> 
            <Text style={[styles.gradeLabel, { color: typeConfig.textColor }]}>{t('qualityType')}</Text>
            <View style={styles.gradeDisplay}>
              <Text style={[styles.gradeValue, { color: typeConfig.textColor, fontSize: 48 }]}>
                {predictionValue}
              </Text>
            </View>
            <Text style={[styles.gradeLabelText, { color: typeConfig.textColor }]}>{typeConfig.subtitle}</Text>

            <View style={styles.probabilityBox}>
              <Text style={styles.probabilityLabel}>{t('confidenceScore')}</Text>
              <Text style={styles.probabilityValue}>{confidenceValue.toFixed(1)}%</Text>
            </View>
          </View>

         

          <View style={styles.explanationCard}>
            <Text style={styles.sectionTitle}>{t('aiAnalysisSection')}</Text>
            <Text style={styles.explanationText}>{data.explanation}</Text>
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.sectionTitle}>{t('recommendations')}</Text>
            <Text style={styles.recommendationText}>
              {predictionValue === 'Type A' && t('typeARecommendation')}
              {predictionValue === 'Type B' && t('typeBRecommendation')}
            </Text>
          </View>

          <PrimaryButton
            title={t('backToQualityGrader')}
            onPress={() => router.push('/quality')}
            style={styles.button}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Best Quality Result
  const { predicted_grade, confidence, all_probabilities, extracted_color, explanation, top_features } = data;
  const grade = predicted_grade;

  const gradeConfig =
    grade === '1'
      ? {
          backgroundColor: '#4CAF50',
          textColor: '#FFFFFF',
          subtitle: t('verySuitableForSell'),
        }
      : grade === '2'
      ? {
          backgroundColor: '#FFC107',
          textColor: '#1F2937',
          subtitle: t('normalSuitableForSell'),
        }
      : {
          backgroundColor: '#F44336',
          textColor: '#FFFFFF',
          subtitle: t('quicklySell'),
        };

  const getCategoryTitle = () => (category === 'best' ? t('bestQualityPapayas') : t('factoryOutletPapayas'));

  const getGradeDescription = () => {
    if (grade === '1') return t('gradeExcellentDesc');
    if (grade === '2') return t('gradeGoodDesc');
    return t('gradeStandardDesc');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.categoryTitle}>{getCategoryTitle()}</Text>
          <Text style={styles.categorySubtitle}>{t('aiPoweredGradingResult')}</Text>
        </View>

        <View style={[styles.gradeCard, { backgroundColor: gradeConfig.backgroundColor }]}>
          <Text style={[styles.gradeLabel, { color: gradeConfig.textColor }]}>{t('qualityGrade')}</Text>
          <View style={styles.gradeDisplay}>
            <Text style={[styles.gradePrefix, { color: gradeConfig.textColor }]}>{t('gradePrefix')}</Text>
            <Text style={[styles.gradeValue, { color: gradeConfig.textColor }]}>{grade}</Text>
          </View>
          <Text style={[styles.gradeLabelText, { color: gradeConfig.textColor }]}>{gradeConfig.subtitle}</Text>

          <View style={styles.probabilityBox}>
            <Text style={styles.probabilityLabel}>{t('confidenceScore')}</Text>
            <Text style={styles.probabilityValue}>{((confidence || 0) * 100).toFixed(1)}%</Text>
          </View>
        </View>

        {/* Color Analysis Card */}
        <View style={styles.colorCard}>
          <Text style={styles.sectionTitle}>{t('colorAnalysisSection')}</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatch, { backgroundColor: extracted_color }]} />
            <View style={styles.colorInfo}>
              <Text style={styles.colorLabel}>{t('extractedColorLabel')}</Text>
              <Text style={styles.colorValue}>{extracted_color}</Text>
            </View>
          </View>
          <Text style={styles.colorDescription}>
            {t('colorUsedForAssessment')}
          </Text>
        </View>

        {/* Grade Probabilities Card */}
        {all_probabilities && (
        <View style={styles.probabilitiesCard}>
          <Text style={styles.sectionTitle}>{t('gradeProbabilitiesSection')}</Text>
          {Object.entries(all_probabilities).map(([gradeKey, probability]) => (
            <View key={gradeKey} style={styles.probabilityRow}>
              <Text style={styles.probabilityGrade}>{t('gradePrefix')} {gradeKey}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(probability * 100).toFixed(0)}%` as any,
                      backgroundColor: gradeKey === '1' ? '#4CAF50' : gradeKey === '2' ? '#FF9800' : '#F44336',
                    },
                  ]}
                />
              </View>
              <Text style={styles.probabilityPercent}>{(probability * 100).toFixed(1)}%</Text>
            </View>
          ))}
        </View>
        )}

        {/* AI Explanation Card */}
        <View style={styles.explanationCard}>
          <Text style={styles.sectionTitle}>{t('aiAnalysisSection')}</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>

        {/* Top Features Card */}
        {top_features && top_features.length > 0 && (
          <View style={styles.featuresCard}>
            <Text style={styles.sectionTitle}>{t('keyFactorsSection')}</Text>
            <Text style={styles.featuresSubtitle}>{t('topFactorsInfluencing')}</Text>
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
                  ({feature.contribution > 0 ? t('increasesGradeLikelihood') : t('decreasesGradeLikelihood')})
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations Card */}
        <View style={styles.recommendationCard}>
          <Text style={styles.sectionTitle}>{t('recommendations')}</Text>
          <Text style={styles.recommendationText}>
            {grade === '1' && t('grade1Recommendation')}
            {grade === '2' && t('grade2Recommendation')}
            {grade === '3' && t('grade3Recommendation')}
          </Text>
        </View>

        <PrimaryButton
          title={t('backToQualityGrader')}
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
  gradeValueTextOnly: { fontSize: 42, fontWeight: '700' },
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
