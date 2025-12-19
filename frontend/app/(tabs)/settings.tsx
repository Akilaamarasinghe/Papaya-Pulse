import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Ionicons name="settings" size={40} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('appearance')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>{t('theme')}</Text>
          <View style={styles.optionsRow}>
            {themeModes.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === mode.key ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setThemeMode(mode.key)}
              >
                <Ionicons
                  name={mode.icon as any}
                  size={24}
                  color={themeMode === mode.key ? '#FFFFFF' : colors.icon}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color: themeMode === mode.key ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {t(`${mode.key}Mode`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('language')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.key}
              style={[
                styles.languageOption,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: lang.key === 'en' ? 1 : 0,
                },
              ]}
              onPress={() => setLanguage(lang.key)}
            >
              <Text style={[styles.languageLabel, { color: colors.text }]}>
                {lang.label}
              </Text>
              {language === lang.key && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Papaya Pulse
            </Text>
            <Text style={[styles.infoSubtitle, { color: colors.placeholder }]}>
              {t('version')} 1.0.0
            </Text>
          </View>
        </View>
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
    paddingVertical: 30,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
