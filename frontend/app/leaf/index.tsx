import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';

export default function LeafIndexScreen() {
  const { t, language } = useTheme();
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('leafDiseaseScanner')}</Text>
        <Text style={styles.subtitle}>{t('identifyTreatDiseases')}</Text>
      </View>

      <Card
        title={t('scanLeaf')}
        icon="camera-outline"
        description={t('scanPhoto')}
        onPress={() => router.push('/leaf/scan' as any)}
      />

      <Card
        title={t('scanHistory')}
        icon="time-outline"
        description={t('viewPastScans')}
        onPress={() => router.push('/leaf/history' as any)}
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📋 {t('detectableDiseases')}</Text>
        <Text style={styles.infoText}>• {language === 'si' ? 'ඇන්ත්‍රැක්නෝස්' : 'Anthracnose'}</Text>
        <Text style={styles.infoText}>• {language === 'si' ? 'කරල්' : 'Curl'}</Text>
        <Text style={styles.infoText}>• {language === 'si' ? 'මයිට් රෝගය' : 'Mite disease'}</Text>
        <Text style={styles.infoText}>• {language === 'si' ? 'රින්ග්ස්පොට්' : 'Ringspot'}</Text>
        <Text style={styles.infoText}>• {language === 'si' ? 'සෞඛ්‍ය සම්පන්න' : 'Healthy leaves'}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
});
