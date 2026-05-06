import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { PrimaryButton } from '../../components/shared/PrimaryButton';

export default function AboutScreen() {
  const { currentTheme, t, language } = useTheme();
  const colors = Colors[currentTheme];

  const openWebsite = () => {
    Linking.openURL('https://papayapulse.com');
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@papayapulse.com');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* ── Gradient Hero Header ── */}
      <LinearGradient
        colors={
          currentTheme === 'dark'
            ? ['#1E2D45', '#0F172A']
            : ['#FF6B35', '#FF9A70']
        }
        style={styles.heroHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor} />
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🥭</Text>
        </View>
        <Text style={styles.appName}>Papaya Pulse</Text>
        <Text style={styles.version}>{t('version')} 1.0.0</Text>
        <Text style={styles.tagline}>{t('empoweringFarmers')}</Text>
      </LinearGradient>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('aboutPapayaPulse')}</Text>
        <Text style={[styles.description, { color: colors.placeholder }]}>
          {t('aboutDescription')}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('keyFeatures')}</Text>

        {[
          { icon: 'leaf', color: '#34D399', bg: 'rgba(52,211,153,0.14)', titleKey: 'growthStageDetectionFeature', descKey: 'growthStageFeatureDesc' },
          { icon: 'star', color: '#FBBF24', bg: 'rgba(251,191,36,0.14)', titleKey: 'qualityGrading', descKey: 'qualityGradingDesc' },
          { icon: 'trending-up', color: '#60A5FA', bg: 'rgba(96,165,250,0.14)', titleKey: 'marketPricePrediction', descKey: 'marketPricePredictionDesc' },
          { icon: 'scan', color: '#F472B6', bg: 'rgba(244,114,182,0.14)', titleKey: 'diseaseDetection', descKey: 'diseaseDetectionDesc' },
        ].map((f, i, arr) => (
          <View
            key={f.icon}
            style={[
              styles.featureCard,
              { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 },
            ]}
          >
            <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon as any} size={22} color={f.color} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{t(f.titleKey as any)}</Text>
              <Text style={[styles.featureText, { color: colors.placeholder }]}>{t(f.descKey as any)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ourMission')}</Text>
        <Text style={[styles.description, { color: colors.placeholder }]}>
          {t('ourMissionText')}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('targetRegions')}</Text>
        <View style={styles.regionList}>
          <Text style={[styles.regionItem, { color: colors.text, backgroundColor: colors.inputBackground }]}>
            📍 {language === 'si' ? 'හම්බන්තොට දිස්ත්‍රික්කය' : 'Hambantota District'}
          </Text>
          <Text style={[styles.regionItem, { color: colors.text, backgroundColor: colors.inputBackground }]}>
            📍 {language === 'si' ? 'මාතර දිස්ත්‍රික්කය' : 'Matara District'}
          </Text>
          <Text style={[styles.regionItem, { color: colors.text, backgroundColor: colors.inputBackground }]}>
            📍 {language === 'si' ? 'ගාල්ල දිස්ත්‍රික්කය' : 'Galle District'}
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contactUs')}</Text>
        <View style={styles.contactCard}>
          <View style={[styles.contactIconBox, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
            <Ionicons name="mail" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.contactText, { color: colors.text }]}>support@papayapulse.com</Text>
        </View>
        <View style={styles.contactCard}>
          <View style={[styles.contactIconBox, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <Ionicons name="call" size={18} color={colors.success} />
          </View>
          <Text style={[styles.contactText, { color: colors.text }]}>+94 11 234 5678</Text>
        </View>
        <View style={styles.contactCard}>
          <View style={[styles.contactIconBox, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
            <Ionicons name="globe" size={18} color={colors.info} />
          </View>
          <Text style={[styles.contactText, { color: colors.text }]}>www.papayapulse.com</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.copyright, { color: colors.placeholder }]}>© 2026 Papaya Pulse. All rights reserved.</Text>
        <Text style={[styles.footerText, { color: colors.text }]}>Made in Sri Lanka 🇱🇰</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /* Hero header */
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  heroDecor: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -60,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logo: {
    fontSize: 44,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  version: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.68)',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.82)',
  },
  /* Sections */
  section: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 14.5,
    lineHeight: 23,
  },
  /* Feature cards */
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  /* Region list */
  regionList: {
    gap: 10,
  },
  regionItem: {
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  /* Contact */
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 4,
  },
  contactIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 14.5,
    marginLeft: 0,
  },
  /* Footer */
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  copyright: {
    fontSize: 13,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
