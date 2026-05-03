import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const DISEASES = [
  { name: 'Anthracnose', icon: '🍂', color: '#D32F2F', bg: '#FFEBEE', desc: 'Dark sunken lesions on leaves and fruits' },
  { name: 'Curl',        icon: '🌀', color: '#F57C00', bg: '#FFF3E0', desc: 'Leaf curling from viral infection' },
  { name: 'Mite Disease', icon: '🔬', color: '#7B1FA2', bg: '#F3E5F5', desc: 'Mite feeding damage on tissues' },
  { name: 'Mosaic Virus', icon: '🧬', color: '#0288D1', bg: '#E1F5FE', desc: 'Mosaic patterns on leaf surface' },
  { name: 'Healthy',     icon: '✅', color: '#388E3C', bg: '#E8F5E9', desc: 'No disease detected — normal leaf' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: 'camera', label: 'Take Photo' },
  { step: '2', icon: 'search', label: 'AI Analyzes' },
  { step: '3', icon: 'leaf',   label: 'Get Advice' },
];

export default function LeafIndexScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2D7A4F" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🌿</Text>
          <Text style={styles.heroTitle}>Leaf Disease{'\n'}Scanner</Text>
          <Text style={styles.heroSub}>
            AI-powered papaya leaf diagnostics with treatment advice for Southern Province farmers
          </Text>
        </View>

        {/* ── Primary Action ── */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => router.push('/leaf/scan' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.scanBtnInner}>
            <Ionicons name="camera" size={28} color="#fff" />
            <View style={styles.scanBtnText}>
              <Text style={styles.scanBtnTitle}>Scan a Leaf Now</Text>
              <Text style={styles.scanBtnSub}>Take or upload a photo for instant diagnosis</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        {/* ── Secondary Action ── */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/leaf/history' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="time-outline" size={22} color="#2D7A4F" />
          <Text style={styles.historyBtnText}>View Scan History</Text>
          <Ionicons name="chevron-forward" size={18} color="#2D7A4F" />
        </TouchableOpacity>

        {/* ── How it works ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsRow}>
            {HOW_IT_WORKS.map((item, i) => (
              <React.Fragment key={item.step}>
                <View style={styles.step}>
                  <View style={styles.stepCircle}>
                    <Ionicons name={item.icon as any} size={20} color="#2D7A4F" />
                  </View>
                  <Text style={styles.stepLabel}>{item.label}</Text>
                </View>
                {i < HOW_IT_WORKS.length - 1 && (
                  <View style={styles.stepArrow}>
                    <Ionicons name="arrow-forward" size={16} color="#B2DFDB" />
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Detectable Diseases ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detectable Conditions</Text>
          {DISEASES.map((d) => (
            <View key={d.name} style={[styles.diseaseCard, { backgroundColor: d.bg }]}>
              <Text style={styles.diseaseIcon}>{d.icon}</Text>
              <View style={styles.diseaseInfo}>
                <Text style={[styles.diseaseName, { color: d.color }]}>{d.name}</Text>
                <Text style={styles.diseaseDesc}>{d.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Tips ── */}
        <View style={[styles.section, styles.tipsCard]}>
          <Text style={[styles.sectionTitle, { color: '#2D7A4F' }]}>📷 Tips for Best Results</Text>
          {[
            'Use natural daylight when possible',
            'Fill the frame with the leaf',
            'Keep the camera steady and focused',
            'Capture the symptomatic area clearly',
          ].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2D7A4F' },
  scroll: { backgroundColor: '#F0F7F2' },

  /* Hero */
  hero: {
    backgroundColor: '#2D7A4F',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 56, marginBottom: 12 },
  heroTitle: {
    fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 38, marginBottom: 10,
  },
  heroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20,
  },

  /* Scan Button */
  scanBtn: {
    marginHorizontal: 20,
    marginTop: -18,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  scanBtnInner: {
    flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14,
  },
  scanBtnText: { flex: 1 },
  scanBtnTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scanBtnSub:  { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  /* History Button */
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#C8E6C9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  historyBtnText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#2D7A4F' },

  /* Sections */
  section: {
    marginHorizontal: 20, marginTop: 24,
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A2E1A', marginBottom: 14 },

  /* How it works */
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  step: { alignItems: 'center', width: 72 },
  stepCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#444', textAlign: 'center' },
  stepArrow: { flex: 1, alignItems: 'center', marginBottom: 20 },

  /* Disease cards */
  diseaseCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: 12, marginBottom: 10, gap: 12,
  },
  diseaseIcon: { fontSize: 28 },
  diseaseInfo: { flex: 1 },
  diseaseName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  diseaseDesc: { fontSize: 13, color: '#555', lineHeight: 18 },

  /* Tips */
  tipsCard: { borderWidth: 1.5, borderColor: '#C8E6C9' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
});
