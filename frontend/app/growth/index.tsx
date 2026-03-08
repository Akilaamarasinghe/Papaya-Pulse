import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';

export default function GrowthIndexScreen() {
  const { currentTheme, t } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <ScreenContainer>
      <LinearGradient
        colors={
          currentTheme === 'dark'
            ? ['#1A3A20', '#0F172A']
            : ['#34D399', '#10B981']
        }
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor} />
        <View style={styles.heroAvatarBox}>
          <Text style={styles.heroEmoji}>🌿</Text>
        </View>
        <Text style={styles.heroTitle}>{t('growthStageAndHarvest')}</Text>
        <Text style={styles.heroDesc}>{t('monitorYourPlants')}</Text>
      </LinearGradient>

      <Card
        title={t('growthStageCheck')}
        icon="camera"
        description={t('takePhotoToIdentify')}
        onPress={() => router.push('/growth/stage-check')}
      />

      <Card
        title={t('harvestPrediction')}
        icon="calendar"
        description={t('calculateHarvestTime')}
        onPress={() => router.push('/growth/harvest-form')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    marginBottom: 24,
    padding: 26,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -45,
  },
  heroAvatarBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
});
