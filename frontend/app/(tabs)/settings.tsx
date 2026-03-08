import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function SettingsScreen() {
  const { themeMode, setThemeMode, language, setLanguage, currentTheme, t } = useTheme();
  const colors = Colors[currentTheme];

  const themeModes: Array<{ key: 'light' | 'dark' | 'system'; icon: string }> = [
    { key: 'light', icon: 'sunny' },
    { key: 'dark', icon: 'moon' },
    { key: 'system', icon: 'phone-portrait' },
  ];

  const languages: Array<{ key: 'en' | 'si'; label: string }> = [
    { key: 'en', label: 'English' },
    { key: 'si', label: 'සිංහල' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Gradient Header ── */}
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
        <View style={styles.headerDecor} />
        <View style={[styles.headerIconBox]}>
          <Ionicons name="settings" size={28} color="rgba(255,255,255,0.95)" />
        </View>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <Text style={styles.headerSub}>Customize your experience</Text>
      </LinearGradient>

      {/* ── Appearance Section ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>
          {t('appearance').toUpperCase()}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('theme')}</Text>
          </View>
          <View style={styles.themeRow}>
            {themeModes.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor:
                      themeMode === mode.key ? colors.primary : colors.inputBackground,
                    borderColor:
                      themeMode === mode.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setThemeMode(mode.key)}
              >
                <Ionicons
                  name={mode.icon as any}
                  size={18}
                  color={themeMode === mode.key ? '#FFFFFF' : colors.icon}
                />
                <Text
                  style={[
                    styles.themeChipText,
                    { color: themeMode === mode.key ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {t(`${mode.key}Mode`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Language Section ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>
          {t('language').toUpperCase()}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Ionicons name="language-outline" size={20} color={colors.info} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('language')}</Text>
          </View>
          {languages.map((lang, idx) => (
            <TouchableOpacity
              key={lang.key}
              style={[
                styles.langOption,
                {
                  borderTopColor: colors.border,
                  borderTopWidth: idx === 0 ? 1 : 0,
                  borderBottomColor: colors.border,
                  borderBottomWidth: idx === languages.length - 1 ? 0 : 1,
                  backgroundColor:
                    language === lang.key
                      ? currentTheme === 'dark'
                        ? 'rgba(255,160,107,0.08)'
                        : 'rgba(255,107,53,0.06)'
                      : 'transparent',
                },
              ]}
              onPress={() => setLanguage(lang.key)}
            >
              <Text style={[styles.langLabel, { color: colors.text }]}>{lang.label}</Text>
              {language === lang.key && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── App Info ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>
          ABOUT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.appInfoRow}>
            <Text style={styles.appEmoji}>🥭</Text>
            <View style={styles.appInfoText}>
              <Text style={[styles.appInfoTitle, { color: colors.text }]}>Papaya Pulse</Text>
              <Text style={[styles.appInfoVersion, { color: colors.placeholder }]}>
                {t('version')} 1.0.0 · Made in 🇱🇰
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomPad} />
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
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  headerDecor: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -50,
  },
  headerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  /* Sections */
  section: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  /* Theme chips */
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  themeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  /* Language */
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 2,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  /* App info */
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appEmoji: {
    fontSize: 38,
  },
  appInfoText: {
    flex: 1,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  appInfoVersion: {
    fontSize: 13,
  },
  bottomPad: {
    height: 24,
  },
});
