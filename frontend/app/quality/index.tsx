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

  // If no user, don't show anything
  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.title}>{t('pleaseLogin')}</Text>
          <Text style={styles.subtitle}>{t('loginToAccess')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('papayaQualityGrader')}</Text>
        <Text style={styles.subtitle}>
          {user.role === 'farmer' 
            ? t('selectPapayaCategoryToGrade')
            : t('checkPapayaQualityBeforeBuying')}
        </Text>
      </View>

      {/* FARMER SIDE - Show two category options */}
      {user.role === 'farmer' && (
        <>
          <Card
            title={t('bestQualityPapayas')}
            icon="star-outline"
            description={t('gradePremiumDescription')}
            onPress={() => router.push('/quality/farmer-input?category=best' as any)}
          />

          <Card
            title={t('factoryOutletPapayas')}
            icon="business-outline"
            description={t('gradeFactoryDescription')}
            onPress={() => router.push('/quality/farmer-input?category=factory' as any)}
          />
        </>
      )}

      {/* CUSTOMER SIDE - Show single option */}
      {user.role === 'customer' && (
        <Card
          title={t('checkQuality')}
          icon="checkmark-circle-outline"
          description={t('checkPapayaQualityDescription')}
          onPress={() => router.push('/quality/customer-input' as any)}
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

