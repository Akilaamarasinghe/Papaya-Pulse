import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, Alert, Platform,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../config/api';
import { LeafDiseaseResponse, LeafPredictionHistory, GrowthStage } from '../../types';

const HISTORY_KEY = 'leaf_disease_history';

const GROWTH_STAGES: { key: GrowthStage; label: string; icon: string }[] = [
  { key: 'vegetative', label: 'Vegetative',  icon: '🌱' },
  { key: 'flowering',  label: 'Flowering',   icon: '🌸' },
  { key: 'fruiting',   label: 'Fruiting',    icon: '🍈' },
];

export default function LeafScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [growthStage, setGrowthStage] = useState<GrowthStage>('flowering');

  const pickFromCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images', allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to pick a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const saveToHistory = async (prediction: LeafDiseaseResponse, uri: string) => {
    try {
      const item: LeafPredictionHistory = {
        ...prediction, id: Date.now().toString(),
        timestamp: new Date().toISOString(), imageUri: uri,
      };
      const existing = await AsyncStorage.getItem(HISTORY_KEY);
      const list: LeafPredictionHistory[] = existing ? JSON.parse(existing) : [];
      list.unshift(item);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.error('History save error:', e);
    }
  };

  const analyze = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const res  = await fetch(imageUri);
        const blob = await res.blob();
        formData.append('file', blob, 'leaf.jpg');
      } else {
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'leaf.jpg' } as any);
      }
      const response = await api.post<LeafDiseaseResponse>('/leaf/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await saveToHistory(response.data, imageUri);
      router.push({
        pathname: '/leaf/result' as any,
        params: { data: JSON.stringify(response.data), growthStage },
      });
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert('Analysis Failed', 'Could not analyze the leaf. Please verify the ML service is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Image Preview ── */}
        <TouchableOpacity
          style={[styles.previewBox, imageUri && styles.previewBoxFilled]}
          onPress={pickFromCamera}
          activeOpacity={0.8}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="camera-outline" size={52} color="#4CAF50" />
              <Text style={styles.placeholderTitle}>Tap to Take a Photo</Text>
              <Text style={styles.placeholderSub}>Or use the buttons below</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Camera / Gallery Row ── */}
        <View style={styles.sourceRow}>
          <TouchableOpacity style={[styles.sourceBtn, { backgroundColor: '#E8F5E9' }]} onPress={pickFromCamera} activeOpacity={0.8}>
            <Ionicons name="camera" size={24} color="#2D7A4F" />
            <Text style={[styles.sourceBtnText, { color: '#2D7A4F' }]}>
              {imageUri ? 'Retake' : 'Camera'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sourceBtn, { backgroundColor: '#EDE7F6' }]} onPress={pickFromGallery} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={24} color="#6A1B9A" />
            <Text style={[styles.sourceBtnText, { color: '#6A1B9A' }]}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* ── Growth Stage Selector ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Plant Growth Stage</Text>
          <Text style={styles.cardHint}>Select your papaya plant{"'"} current stage for better advice</Text>
          <View style={styles.stageRow}>
            {GROWTH_STAGES.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.stageChip, growthStage === s.key && styles.stageChipActive]}
                onPress={() => setGrowthStage(s.key)}
              >
                <Text style={styles.stageIcon}>{s.icon}</Text>
                <Text style={[styles.stageLabel, growthStage === s.key && styles.stageLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Analyze Button ── */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
            onPress={analyze}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="search" size={22} color="#fff" />
            )}
            <Text style={styles.analyzeBtnText}>
              {loading ? 'Analyzing…' : 'Analyze Leaf Disease'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Cancel ── */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        {/* ── Photo Tips ── */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📷 Tips for Best Accuracy</Text>
          {[
            { icon: 'sunny-outline',    tip: 'Shoot in natural daylight' },
            { icon: 'expand-outline',   tip: 'Fill the frame with the leaf' },
            { icon: 'hand-left-outline',tip: 'Hold steady and focus clearly' },
            { icon: 'warning-outline',  tip: 'Capture the symptomatic area' },
          ].map((t) => (
            <View key={t.tip} style={styles.tipRow}>
              <Ionicons name={t.icon as any} size={18} color="#4CAF50" />
              <Text style={styles.tipText}>{t.tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F0F7F2' },
  scroll: { padding: 20 },

  /* Preview */
  previewBox: {
    height: 260, borderRadius: 20, borderWidth: 2, borderColor: '#A5D6A7',
    borderStyle: 'dashed', overflow: 'hidden', marginBottom: 16,
    backgroundColor: '#F9FBF9', justifyContent: 'center', alignItems: 'center',
  },
  previewBoxFilled: { borderStyle: 'solid', borderColor: '#2D7A4F' },
  previewImage:     { width: '100%', height: '100%', resizeMode: 'cover' },
  previewPlaceholder: { alignItems: 'center', gap: 8 },
  placeholderTitle: { fontSize: 16, fontWeight: '600', color: '#2D7A4F', marginTop: 4 },
  placeholderSub:   { fontSize: 13, color: '#888' },

  /* Source Row */
  sourceRow:    { flexDirection: 'row', gap: 12, marginBottom: 16 },
  sourceBtn:    {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  sourceBtnText: { fontSize: 16, fontWeight: '600' },

  /* Growth Stage Card */
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#1A2E1A', marginBottom: 4 },
  cardHint:  { fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 18 },
  stageRow:  { flexDirection: 'row', gap: 10 },
  stageChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#C8E6C9', backgroundColor: '#F9FBF9',
  },
  stageChipActive: { borderColor: '#2D7A4F', backgroundColor: '#E8F5E9' },
  stageIcon:  { fontSize: 22, marginBottom: 4 },
  stageLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  stageLabelActive: { color: '#2D7A4F' },

  /* Analyze */
  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#2D7A4F', borderRadius: 16, paddingVertical: 16,
    marginBottom: 12, shadowColor: '#2D7A4F',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  analyzeBtnDisabled: { backgroundColor: '#81C784' },
  analyzeBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  /* Cancel */
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 20 },
  cancelText: { fontSize: 16, color: '#888', fontWeight: '500' },

  /* Tips */
  tipsCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    borderWidth: 1.5, borderColor: '#DCEDC8',
  },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: '#2D7A4F', marginBottom: 12 },
  tipRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipText:   { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
});
