import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { Card } from '../../../components/shared/Card';

export default function GrowthIndexScreen() {
  const { currentTheme, t, language, setLanguage } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <ScreenContainer>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={[styles.langPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && { backgroundColor: colors.primary }]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, { color: language === 'en' ? '#fff' : colors.placeholder }]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'si' && { backgroundColor: colors.primary }]}
            onPress={() => setLanguage('si')}
          >
            <Text style={[styles.langBtnText, { color: language === 'si' ? '#fff' : colors.placeholder }]}>සි</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <Text style={styles.heroEmoji}>🌳</Text>
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  langPill: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  langBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
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
