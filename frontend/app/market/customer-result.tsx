import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { CustomerMarketResponse } from '../../types';

/* ── Ripeness colour helper ── */
function ripenessColour(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('unripe')) return '#4CAF50';
  if (l.includes('half')) return '#FFC107';
  if (l.includes('market') || l.includes('ready')) return '#FF9800';
  if (l.includes('over')) return '#F44336';
  return '#9E9E9E';
}

/* ── Colour ratio bar ── */
function ColourRatioBar({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${Math.round(value * 100)}%`, backgroundColor: colour }]} />
      </View>
      <Text style={barStyles.pct}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 60, fontSize: 13, color: '#555' },
  track: { flex: 1, height: 10, backgroundColor: '#eee', borderRadius: 5, marginHorizontal: 8, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  pct: { width: 36, fontSize: 13, color: '#333', textAlign: 'right' },
});

/* ── Main screen ── */
export default function CustomerResultScreen() {
  const { language } = useTheme();
  const params = useLocalSearchParams();
  const data: CustomerMarketResponse | null = params.data
    ? JSON.parse(params.data as string)
    : null;

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {language === 'si' ? 'දත්ත නොමැත' : 'No data available'}
          </Text>
          <PrimaryButton
            title={language === 'si' ? 'ආපසු යන්න' : 'Go Back'}
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { analysis, final_market_advice } = data;
  const {
    location,
    month,
    rainfall_mm,
    ripeness,
    confidence_percent,
    color_ratios,
    price_table,
    seller_price,
  } = analysis;

  const ripenColour = ripenessColour(ripeness);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ── Ripeness Card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            🍈 {language === 'si' ? 'ශීර්ෂත්ව විශ්ලේෂණය' : 'Ripeness Analysis'}
          </Text>

          <View style={[styles.ripenessBadge, { backgroundColor: ripenColour + '22', borderColor: ripenColour }]}>
            <Text style={[styles.ripenessLabel, { color: ripenColour }]}>{ripeness}</Text>
            <Text style={styles.confidence}>
              {language === 'si' ? 'විශ්වාසය' : 'Confidence'}: {confidence_percent.toFixed(1)}%
            </Text>
          </View>

          {/* Colour ratios */}
          <Text style={styles.subTitle}>
            {language === 'si' ? 'වර්ණ නිදර්ශනය' : 'Colour Breakdown'}
          </Text>
          <ColourRatioBar label={language === 'si' ? 'කොළ' : 'Green'} value={color_ratios.green} colour="#4CAF50" />
          <ColourRatioBar label={language === 'si' ? 'කහ' : 'Yellow'} value={color_ratios.yellow} colour="#FFC107" />
          <ColourRatioBar label={language === 'si' ? 'තැඹිලි' : 'Orange'} value={color_ratios.orange} colour="#FF9800" />
        </View>

        {/* ── Weather Info Card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            🌦️ {language === 'si' ? 'කාලගුණ සාරාංශය' : 'Weather Summary'}
          </Text>
          <View style={styles.weatherRow}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherValue}>{location}</Text>
              <Text style={styles.weatherMeta}>{language === 'si' ? 'ස්ථානය' : 'Location'}</Text>
            </View>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherValue}>{rainfall_mm.toFixed(1)} mm</Text>
              <Text style={styles.weatherMeta}>{language === 'si' ? 'වර්ෂාපතනය (දින 7)' : '7-day Rainfall'}</Text>
            </View>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherValue}>{month}</Text>
              <Text style={styles.weatherMeta}>{language === 'si' ? 'මාසය' : 'Month'}</Text>
            </View>
          </View>
        </View>

        {/* ── Price Table Card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            💰 {language === 'si' ? 'අනුමාන මිල (LKR/kg)' : 'Estimated Price (LKR/kg)'}
          </Text>

          {price_table.map((row) => (
            <View key={row.variety} style={styles.priceRow}>
              <View style={styles.priceLeft}>
                <Text style={styles.varietyName}>{row.variety.replace('_', ' ')}</Text>
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.priceValue}>Rs. {row.price_lkr_per_kg.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {seller_price != null && (
            <View style={styles.sellerPriceBox}>
              <Text style={styles.sellerPriceLabel}>
                {language === 'si' ? 'අලෙවිකරු ඉල්ලන මිල:' : 'Seller Asking Price:'}
              </Text>
              <Text style={styles.sellerPriceValue}>Rs. {Number(seller_price).toFixed(2)}/kg</Text>
            </View>
          )}
        </View>

        {/* ── Market Advice Card ── */}
        <View style={[styles.card, styles.adviceCard]}>
          <Text style={styles.sectionTitle}>
            🧠 {language === 'si' ? 'වෙළඳපල උපදේශය' : 'Market Advice'}
          </Text>
          <Text style={styles.adviceText}>{final_market_advice}</Text>
        </View>

        <PrimaryButton
          title={language === 'si' ? 'නිම කරන්න' : 'Done'}
          onPress={() => router.back()}
          style={styles.doneButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 14,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 4,
  },
  ripenessBadge: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  ripenessLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
  },
  /* Weather */
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherItem: {
    alignItems: 'center',
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  weatherMeta: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  /* Price table */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLeft: {},
  priceRight: {},
  varietyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  sellerPriceBox: {
    marginTop: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerPriceLabel: {
    fontSize: 14,
    color: '#555',
  },
  sellerPriceValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E65100',
  },
  /* Advice */
  adviceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  adviceText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  doneButton: {
    marginTop: 4,
  },
});
