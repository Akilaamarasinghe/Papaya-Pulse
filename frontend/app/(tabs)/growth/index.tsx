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

      {/* Stage history button */}
      <TouchableOpacity
        style={[styles.historyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/growth/stage-history' as any)}
        activeOpacity={0.85}
      >
        <View style={[styles.historyIconBox, { backgroundColor: 'rgba(52,211,153,0.14)' }]}>
          <Ionicons name="time-outline" size={20} color="#34D399" />
        </View>
        <Text style={[styles.historyBtnText, { color: colors.text }]}>View Stage Scan History</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </TouchableOpacity>

      <Card
        title={t('harvestPrediction')}
        icon="calendar"
        description={t('calculateHarvestTime')}
        onPress={() => router.push('/growth/harvest-form')}
      />

      {/* Harvest history button */}
      <TouchableOpacity
        style={[styles.historyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/growth/harvest-history' as any)}
        activeOpacity={0.85}
      >
        <View style={[styles.historyIconBox, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
          <Ionicons name="calendar-outline" size={20} color="#10B981" />
        </View>
        <Text style={[styles.historyBtnText, { color: colors.text }]}>View Harvest History</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </TouchableOpacity>
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
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  historyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
