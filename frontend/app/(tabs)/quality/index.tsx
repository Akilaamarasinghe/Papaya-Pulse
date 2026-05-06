import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { Card } from '../../../components/shared/Card';

export default function QualityIndexScreen() {
  const { user } = useAuth();
  const { t, language, currentTheme, setLanguage } = useTheme();
  const colors = Colors[currentTheme];

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.msgBox}>
          <Text style={[styles.msgTitle, { color: colors.text }]}>{t('pleaseLogin')}</Text>
          <Text style={[styles.msgSub, { color: colors.placeholder }]}>{t('loginToAccess')}</Text>
        </View>
      </ScreenContainer>
    );
  }

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
            ? ['#3A2A08', '#0F172A']
            : ['#FBBF24', '#F59E0B']
        }
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor} />
        <View style={styles.heroAvatarBox}>
          <Text style={styles.heroEmoji}>⭐</Text>
        </View>
        <Text style={styles.heroTitle}>{t('papayaQualityGrader')}</Text>
        <Text style={styles.heroDesc}>
          {user.role === 'farmer'
            ? t('selectPapayaCategoryToGrade')
            : t('checkPapayaQualityBeforeBuying')}
        </Text>
      </LinearGradient>

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
  msgBox: {
    marginTop: 60,
    alignItems: 'center',
  },
  msgTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  msgSub: {
    fontSize: 15,
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

