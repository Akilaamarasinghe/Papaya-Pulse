import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';

export default function QualityIndexScreen() {
  const { user } = useAuth();
  const { t, language } = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('papayaQualityGrader')}</Text>
        <Text style={styles.subtitle}>
          {user?.role === 'farmer' 
            ? t('gradeYourHarvest')
            : t('checkBeforeBuying')}
        </Text>
      </View>

      {user?.role === 'farmer' && (
        <Card
          title={t('farmerGrading')}
          icon="leaf-outline"
          description={language === 'si' ? 'ප්‍රශස්ත වෙළඳපල මිල ගණන් සඳහා පැපොල් ශ්‍රේණිගත කරන්න' : 'Grade papayas for optimal market pricing'}
          onPress={() => router.push('/quality/farmer-input' as any)}
        />
      )}

      {user?.role === 'customer' && (
        <Card
          title={t('customerGrading')}
          icon="checkmark-circle-outline"
          description={language === 'si' ? 'මිලදී ගැනීමට පෙර පැපොල් ගුණාත්මකභාවය තහවුරු කරන්න' : 'Verify papaya quality before purchase'}
          onPress={() => router.push('/quality/customer-input' as any)}
        />
      )}

      {/* Both can access both features if needed */}
      {user?.role === 'farmer' && (
        <Card
          title={t('customerGrading')}
          icon="checkmark-circle-outline"
          description={language === 'si' ? 'ගැනුම්කරුගේ දෘෂ්ටිකෝණයෙන් ගුණාත්මකභාවය පරීක්ෂා කරන්න' : 'Check quality from buyer\'s perspective'}
          onPress={() => router.push('/quality/customer-input' as any)}
        />
      )}

      {user?.role === 'customer' && (
        <Card
          title={t('farmerGrading')}
          icon="leaf-outline"
          description={language === 'si' ? 'ගොවි ශ්‍රේණිගත කිරීමේ ක්‍රියාවලිය ගැන ඉගෙන ගන්න' : 'Learn about farmer grading process'}
          onPress={() => router.push('/quality/farmer-input' as any)}
        />
      )}
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
});
