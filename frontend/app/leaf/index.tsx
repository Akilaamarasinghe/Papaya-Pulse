import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

const DISEASES = [
  { name: 'Anthracnose',  icon: '🍂', color: '#D32F2F', bg: '#FFEBEE', desc: 'Dark sunken lesions on leaves and fruits' },
  { name: 'Curl',         icon: '🌀', color: '#F57C00', bg: '#FFF3E0', desc: 'Leaf curling from viral infection' },
  { name: 'Mite Disease', icon: '🔬', color: '#7B1FA2', bg: '#F3E5F5', desc: 'Mite feeding damage on tissues' },
  { name: 'Mosaic Virus', icon: '🧬', color: '#0288D1', bg: '#E1F5FE', desc: 'Mosaic patterns on leaf surface' },
  { name: 'Healthy',      icon: '✅', color: '#388E3C', bg: '#E8F5E9', desc: 'No disease detected — normal leaf' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: 'camera',  label: 'Take Photo' },
  { step: '2', icon: 'search',  label: 'AI Analyzes' },
  { step: '3', icon: 'leaf',    label: 'Get Advice' },
];

export default function LeafIndexScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const isDark = currentTheme === 'dark';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#0F2A1A' : '#2D7A4F' }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { backgroundColor: colors.background }]}
      >
        {/* ── Gradient Hero ── */}
        <LinearGradient
          colors={isDark ? ['#0F2A1A', '#0F172A'] : ['#2D7A4F', '#34D399']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroDecor} />
          <View style={styles.heroAvatarBox}>
            <Text style={styles.heroEmoji}>🌿</Text>
          </View>
          <Text style={styles.heroTitle}>Leaf Disease{'\n'}Scanner</Text>
          <Text style={styles.heroSub}>
            AI-powered papaya leaf diagnostics with treatment advice for Southern Province farmers
          </Text>
        </LinearGradient>

        {/* ── Primary Action ── */}
        <TouchableOpacity
          style={[styles.scanBtn, { shadowColor: colors.primary }]}
          onPress={() => router.push('/leaf/scan' as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark ?? '#E85A24']}
            style={styles.scanBtnInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.scanIconBox}>
              <Ionicons name="camera" size={26} color="#fff" />
            </View>
            <View style={styles.scanBtnText}>
              <Text style={styles.scanBtnTitle}>Scan a Leaf Now</Text>
              <Text style={styles.scanBtnSub}>Take or upload a photo for instant diagnosis</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Secondary Action ── */}
        <TouchableOpacity
          style={[styles.historyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/leaf/history' as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.historyIconBox, { backgroundColor: 'rgba(52,211,153,0.14)' }]}>
            <Ionicons name="time-outline" size={20} color="#34D399" />
          </View>
          <Text style={[styles.historyBtnText, { color: colors.text }]}>View Scan History</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
        </TouchableOpacity>

        {/* ── How it works ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
          <View style={styles.stepsRow}>
            {HOW_IT_WORKS.map((item, i) => (
              <React.Fragment key={item.step}>
                <View style={styles.step}>
                  <View style={[styles.stepCircle, { backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : '#E8F5E9' }]}>
                    <Ionicons name={item.icon as any} size={20} color="#34D399" />
                  </View>
                  <Text style={[styles.stepLabel, { color: colors.placeholder }]}>{item.label}</Text>
                </View>
                {i < HOW_IT_WORKS.length - 1 && (
                  <View style={styles.stepArrow}>
                    <Ionicons name="arrow-forward" size={16} color={colors.border} />
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Detectable Diseases ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detectable Conditions</Text>
          {DISEASES.map((d) => (
            <View key={d.name} style={[styles.diseaseCard, { backgroundColor: isDark ? `${d.color}22` : d.bg }]}>
              <Text style={styles.diseaseIcon}>{d.icon}</Text>
              <View style={styles.diseaseInfo}>
                <Text style={[styles.diseaseName, { color: d.color }]}>{d.name}</Text>
                <Text style={[styles.diseaseDesc, { color: colors.placeholder }]}>{d.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Tips ── */}
        <View style={[styles.section, styles.tipsCard, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(52,211,153,0.3)' : '#C8E6C9' }]}>
          <Text style={[styles.sectionTitle, { color: '#34D399' }]}>📷 Tips for Best Results</Text>
          {[
            'Use natural daylight when possible',
            'Fill the frame with the leaf',
            'Keep the camera steady and focused',
            'Capture the symptomatic area clearly',
          ].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {},

  /* Hero */
  hero: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroDecor: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -55,
  },
  heroAvatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: {
    fontSize: 30, fontWeight: '800', color: '#fff',
    textAlign: 'center', lineHeight: 36, marginBottom: 10,
  },
  heroSub: {
    fontSize: 13.5, color: 'rgba(255,255,255,0.78)',
    textAlign: 'center', lineHeight: 20,
  },

  /* Scan Button */
  scanBtn: {
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  scanBtnInner: {
    flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14,
  },
  scanIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnText: { flex: 1 },
  scanBtnTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  scanBtnSub:   { fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 2 },

  /* History Button */
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 12,
    borderRadius: 16, padding: 14,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  historyIconBox: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  historyBtnText: { flex: 1, fontSize: 15, fontWeight: '600' },

  /* Sections */
  section: {
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 20, padding: 18, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },

  /* How it works */
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  step: { alignItems: 'center', width: 72 },
  stepCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  stepLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  stepArrow: { flex: 1, alignItems: 'center', marginBottom: 20 },

  /* Disease cards */
  diseaseCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 12, marginBottom: 10, gap: 12,
  },
  diseaseIcon: { fontSize: 26 },
  diseaseInfo: { flex: 1 },
  diseaseName: { fontSize: 14.5, fontWeight: '700', marginBottom: 2 },
  diseaseDesc: { fontSize: 12.5, lineHeight: 18 },

  /* Tips */
  tipsCard: { borderWidth: 1.5 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 20 },
});
