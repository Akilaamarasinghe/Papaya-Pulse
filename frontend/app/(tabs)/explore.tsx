import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function ExploreScreen() {
  const { currentTheme, t, language } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('explore')}</Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>
          {language === 'si' ? 'Papaya Pulse විශේෂාංග සහ තොරතුරු' : 'Papaya Pulse Features & Information'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="leaf" size={32} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {language === 'si' ? 'වර්ධන අවධිය' : 'Growth Stage'}
        </Text>
        <Text style={[styles.cardText, { color: colors.placeholder }]}>
          {language === 'si' 
            ? 'AI බලයෙන් යුත් රූප විශ්ලේෂණය භාවිතයෙන් ඔබේ පැපොල් පැල වල වර්ධන අවධිය හඳුනා ගන්න.'
            : 'Identify the growth stage of your papaya plants using AI-powered image analysis.'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="star" size={32} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {language === 'si' ? 'ගුණාත්මක ශ්‍රේණිගත කිරීම' : 'Quality Grading'}
        </Text>
        <Text style={[styles.cardText, { color: colors.placeholder }]}>
          {language === 'si'
            ? 'ඔබේ පැපොල් ඵල වල ගුණාත්මකභාවය ස්වයංක්‍රීයව තක්සේරු කර වඩා හොඳ මිල ගණන් ලබා ගන්න.'
            : 'Automatically assess the quality of your papaya fruits for better pricing.'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="trending-up" size={32} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {language === 'si' ? 'වෙළඳපල මිල' : 'Market Prices'}
        </Text>
        <Text style={[styles.cardText, { color: colors.placeholder }]}>
          {language === 'si'
            ? 'ඔබේ ප්‍රදේශයේ නවතම වෙළඳපල මිල ගණන් සහ ප්‍රවණතා බලන්න.'
            : 'View the latest market prices and trends in your region.'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="medkit" size={32} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {language === 'si' ? 'රෝග හඳුනා ගැනීම' : 'Disease Detection'}
        </Text>
        <Text style={[styles.cardText, { color: colors.placeholder }]}>
          {language === 'si'
            ? 'කොළ රෝග ඉක්මනින් හඳුනාගෙන ප්‍රතිකාර නිර්දේශ ලබා ගන්න.'
            : 'Detect leaf diseases early and get treatment recommendations.'}
        </Text>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            {language === 'si' ? 'උපදෙස්' : 'Tip'}
          </Text>
          <Text style={[styles.infoText, { color: colors.placeholder }]}>
            {language === 'si'
              ? 'හොඳම ප්‍රතිඵල සඳහා දිවා ආලෝකයේ දී පැහැදිලි ඡායාරූප ගන්න.'
              : 'Take clear photos in daylight for best results.'}
          </Text>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
