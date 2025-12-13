import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.logoContainer, { backgroundColor: currentTheme === 'dark' ? '#2D1F1A' : '#FFF3E0' }]}>
          <Text style={styles.logo}>🥭</Text>
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>Papaya Pulse</Text>
        <Text style={[styles.version, { color: colors.placeholder }]}>{t('version')} 1.0.0</Text>
        <Text style={[styles.tagline, { color: colors.text }]}>{t('empoweringFarmers')}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('aboutPapayaPulse')}</Text>
        <Text style={[styles.description, { color: colors.placeholder }]}>
          {t('aboutDescription')}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('keyFeatures')}</Text>
        
        <View style={[styles.featureCard, { borderBottomColor: colors.border }]}>
          <Ionicons name="leaf" size={24} color={colors.primary} />
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{t('growthStageDetectionFeature')}</Text>
            <Text style={[styles.featureText, { color: colors.placeholder }]}>
              {t('growthStageFeatureDesc')}
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { borderBottomColor: colors.border }]}>
          <Ionicons name="star" size={24} color={colors.primary} />
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{t('qualityGrading')}</Text>
            <Text style={[styles.featureText, { color: colors.placeholder }]}>
              {t('qualityGradingDesc')}
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { borderBottomColor: colors.border }]}>
          <Ionicons name="trending-up" size={24} color={colors.primary} />
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{t('marketPricePrediction')}</Text>
            <Text style={[styles.featureText, { color: colors.placeholder }]}>
              {t('marketPricePredictionDesc')}
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { borderBottomColor: colors.border }]}>
          <Ionicons name="scan" size={24} color={colors.primary} />
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{t('diseaseDetection')}</Text>
            <Text style={[styles.featureText, { color: colors.placeholder }]}>
              {t('diseaseDetectionDesc')}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ourMission')}</Text>
        <Text style={[styles.description, { color: colors.placeholder }]}>
          {t('ourMissionText')}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
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

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contactUs')}</Text>
        <View style={[styles.contactCard, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="mail" size={20} color={colors.icon} />
          <Text style={[styles.contactText, { color: colors.text }]}>support@papayapulse.com</Text>
        </View>
        <View style={[styles.contactCard, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="call" size={20} color={colors.icon} />
          <Text style={[styles.contactText, { color: colors.text }]}>+94 11 234 5678</Text>
        </View>
        <View style={[styles.contactCard, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="globe" size={20} color={colors.icon} />
          <Text style={[styles.contactText, { color: colors.text }]}>www.papayapulse.com</Text>
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <Text style={[styles.copyright, { color: colors.placeholder }]}>© 2025 Papaya Pulse. All rights reserved.</Text>
        <Text style={[styles.footerText, { color: colors.text }]}>Made in Sri Lanka 🇱🇰</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  featureContent: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  regionList: {
    gap: 12,
  },
  regionItem: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 12,
    marginBottom: 20,
  },
  copyright: {
    fontSize: 14,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
  },
});
