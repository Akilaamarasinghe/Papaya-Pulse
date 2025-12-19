import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';

export default function GrowthIndexScreen() {
  const { currentTheme, t } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('growthStageAndHarvest')}</Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>{t('monitorYourPlants')}</Text>
      </View>

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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});
