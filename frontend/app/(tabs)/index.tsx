import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const { currentTheme, t, language, setLanguage } = useTheme();
  const colors = Colors[currentTheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning', icon: '☀️' };
    if (h < 17) return { text: 'Good Afternoon', icon: '🌤️' };
    return { text: 'Good Evening', icon: '🌙' };
  })();

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const isFarmer = user.role === 'farmer';

  return (
    <ScreenContainer>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ── Hero Header ── */}
        <LinearGradient
          colors={
            currentTheme === 'dark'
              ? ['#1E2D45', '#0F172A']
              : ['#FF6B35', '#FF9A70']
          }
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <View style={styles.heroTop}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroDate}>{dateStr}</Text>
              <Text style={styles.heroGreeting}>{greeting.icon} {greeting.text},</Text>
              <Text style={styles.heroName}>{user.name}!</Text>
            </View>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarEmoji}>{isFarmer ? '🌾' : '🛒'}</Text>
            </View>
          </View>

          <View style={styles.heroBadge}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroBadgeText}>
              {user.district} · {isFarmer ? 'Farmer' : 'Customer'}
            </Text>
          </View>

          <View style={styles.brandTag}>
            <Text style={styles.brandTagText}>🥭 Papaya Pulse</Text>
          </View>
        </LinearGradient>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          {[
            { icon: 'trending-up-outline', color: colors.success, label: 'Market', value: 'Live' },
            { icon: 'analytics-outline',   color: colors.info,    label: 'AI',     value: 'Powered' },
            { icon: 'shield-checkmark-outline', color: colors.primary, label: 'Smart', value: 'Analysis' },
          ].map((s) => (
            <View
              key={s.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.placeholder }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Section Header ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isFarmer ? '🚀 Your Tools' : '🛍️ Your Tools'}
            </Text>
            {/* Language toggle pill */}
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
          <Text style={[styles.sectionSubtitle, { color: colors.placeholder }]}>
            {isFarmer
              ? (language === 'si' ? 'AI සහිතව ඔබේ පැපොල් ගොවිතැන කළමනාකරණය කරන්න' : 'Manage your papaya farm with AI')
              : (language === 'si' ? 'වඩා හොඳ ගැනුම් තීරණ ගන්න' : 'Make smarter buying decisions')}
          </Text>
        </View>

        {/* ── Module Cards ── */}
        <View style={styles.modules}>
          {isFarmer && (
            <>
              <Card title={t('growthStage')} icon="leaf" description={t('growthStageDesc')} onPress={() => router.push('/growth' as any)} />
              <Card title={t('qualityCheck')} icon="star" description={t('qualityCheckDesc')} onPress={() => router.push('/quality' as any)} />
              <Card title={t('marketPrice')} icon="cash" description={t('marketPriceDesc')} onPress={() => router.push('/market' as any)} />
              <Card title={t('leafDisease')} icon="scan" description={t('leafDiseaseDesc')} onPress={() => router.push('/leaf' as any)} />
            </>
          )}
          {user.role === 'customer' && (
            <>
              <Card title={t('qualityCheck')} icon="star" description={t('qualityCheckDesc')} onPress={() => router.push('/quality' as any)} />
              <Card title={t('marketPrice')} icon="cash" description={t('marketPriceDesc')} onPress={() => router.push('/market' as any)} />
            </>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.placeholder }]}>
            🇱🇰 Empowering Sri Lanka's Papaya Farmers
          </Text>
        </View>

      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Hero */
  heroCard: {
    borderRadius: 28,
    padding: 26,
    marginBottom: 20,
    overflow: 'hidden',
    minHeight: 195,
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -45,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -38,
    left: -22,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroGreeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
    marginBottom: 2,
  },
  heroName: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  heroAvatarEmoji: {
    fontSize: 28,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 4,
  },
  heroBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12.5,
    fontWeight: '600',
  },
  brandTag: {
    position: 'absolute',
    bottom: 14,
    right: 18,
  },
  brandTagText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  /* Section */
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.1,
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
  sectionSubtitle: {
    fontSize: 13.5,
  },
  modules: {
    marginBottom: 20,
  },
  /* Footer */
  footer: {
    paddingTop: 14,
    borderTopWidth: 1,
    alignItems: 'center',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
});
