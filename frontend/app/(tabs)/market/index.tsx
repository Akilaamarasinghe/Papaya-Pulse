import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { Card } from '../../../components/shared/Card';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { Dropdown } from '../../../components/shared/Dropdown';
import api from '../../../config/api';
import { District, PapayaVariety, QualityGrade, CultivationMethod, MarketPriceRequest, MarketPriceResponse } from '../../../types';

export default function MarketIndexScreen() {
  const { user } = useAuth();
  const { t, language, currentTheme, setLanguage } = useTheme();
  const colors = Colors[currentTheme];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    district: user?.district || 'Galle' as District,
    variety: 'RedLady' as PapayaVariety,
    cultivation_method: 'Organic' as CultivationMethod,
    quality_grade: 'A' as QualityGrade,
    total_harvest_count: '',
    avg_weight_per_fruit: '',
    expected_selling_date: '',
  });

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
            ? ['#1A2A3A', '#0F172A']
            : ['#60A5FA', '#3B82F6']
        }
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor} />
        <View style={styles.heroAvatarBox}>
          <Text style={styles.heroEmoji}>💰</Text>
        </View>
        <Text style={styles.heroTitle}>
          {language === 'si' ? 'වෙළඳපල මිල පුරෝකථනය' : 'Market Price Prediction'}
        </Text>
        <Text style={styles.heroDesc}>
          {language === 'si'
            ? 'පුරෝකථනය සඳහා ප්‍රවර්ගය තෝරන්න'
            : 'Select a category for prediction'}
        </Text>
      </LinearGradient>

      {user?.role === 'farmer' && (
        <>
          <Card
            title={language === 'si' ? 'ශ්‍රේෂ්ඨ ගුණාත්මක පැපොල්' : 'Best Quality Papayas'}
            icon="star-outline"
            description={
              language === 'si'
                ? 'ප්‍රිමියම් ගුණාත්මක පැපොල් සඳහා වෙළඳ මිල ගණනය'
                : 'Predict market price for premium quality papayas'
            }
            onPress={() => router.push('/market/predict-form?category=best' as any)}
          />
          <Card
            title={language === 'si' ? 'කර්මාන්ත ශාලා ප්‍රතිදානය' : 'Factory Outlet Papayas'}
            icon="business-outline"
            description={
              language === 'si'
                ? 'කර්මාන්ත සකස් කිරීම සඳහා මිල ගණනය'
                : 'Predict price for factory processing papayas'
            }
            onPress={() => router.push('/market/predict-form?category=factory' as any)}
          />
        </>
      )}

      {user?.role === 'customer' && (
        <Card
          title={language === 'si' ? 'පැපොල් ස්කෑන් කරන්න' : 'Scan Papaya for Market Price'}
          icon="camera-outline"
          description={
            language === 'si'
              ? 'ඉදුනු බව, මිල සහ වෙළඳ උපදෙස් ලබා ගන්න'
              : 'Take a photo to get ripeness, price estimate & market advice'
          }
          onPress={() => router.push('/market/customer-predict' as any)}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  restrictedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});

