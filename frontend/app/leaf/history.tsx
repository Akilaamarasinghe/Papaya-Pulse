import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LeafPredictionHistory } from '../../types';

const HISTORY_KEY = 'leaf_disease_history';

const pct = (v?: number) =>
  typeof v === 'number' && !Number.isNaN(v) ? `${(v * 100).toFixed(1)}%` : '—';

const fmtStage = (s?: string | null) =>
  s ? s.replace(/[_-]/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase()) : null;

const fmtDate = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const SEV_COLOR: Record<string, string> = {
  mild: '#388E3C', moderate: '#F57C00', severe: '#D32F2F', unknown: '#9E9E9E',
};

export default function LeafHistoryScreen() {
  const [history, setHistory] = useState<LeafPredictionHistory[]>([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const confirmClear = () =>
    Alert.alert('Clear History', 'Delete all scan history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(HISTORY_KEY);
          setHistory([]);
        },
      },
    ]);

  const renderItem = ({ item }: { item: LeafPredictionHistory }) => {
    const isNotLeaf = item.is_leaf === false || item.disease === 'NotPapaya';
    const isHealthy = item.disease === 'Healthy';
    const stage     = fmtStage(item.stage_label);

    const tagColor  = isNotLeaf ? '#607D8B' : isHealthy ? '#388E3C' : '#D32F2F';
    const tagBg     = isNotLeaf ? '#ECEFF1' : isHealthy ? '#E8F5E9' : '#FFEBEE';
    const tagLabel  = isNotLeaf ? 'Not Leaf' : isHealthy ? 'Healthy' : item.disease;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.82}
        onPress={() =>
          router.push({
            pathname: '/leaf/result' as any,
            params: { data: JSON.stringify(item) },
          })
        }
      >
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={s.thumb} />
        ) : (
          <View style={s.thumbPlaceholder}>
            <Ionicons name="leaf-outline" size={28} color="#A5D6A7" />
          </View>
        )}

        <View style={s.cardBody}>
          {/* Top row */}
          <View style={s.cardTop}>
            <View style={[s.tag, { backgroundColor: tagBg }]}>
              <Text style={[s.tagText, { color: tagColor }]}>{tagLabel}</Text>
            </View>
            {!isNotLeaf && !isHealthy && item.severity !== 'unknown' && (
              <View style={[s.sevTag, { borderColor: SEV_COLOR[item.severity] }]}>
                <Text style={[s.sevTagText, { color: SEV_COLOR[item.severity] }]}>
                  {item.severity.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Confidence */}
          <Text style={s.conf}>
            Confidence: <Text style={s.confVal}>{pct(item.disease_confidence)}</Text>
          </Text>

          {/* Stage */}
          {stage && !isNotLeaf && (
            <Text style={s.stage}>Stage: {stage}</Text>
          )}

          {/* Date */}
          <Text style={s.date}>{fmtDate(item.timestamp)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#BDBDBD" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.loadText}>Loading history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty ──
  if (history.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Ionicons name="leaf-outline" size={48} color="#A5D6A7" />
          </View>
          <Text style={s.emptyTitle}>No Scans Yet</Text>
          <Text style={s.emptyDesc}>
            Your scan history will appear here after you analyze your first papaya leaf.
          </Text>
          <TouchableOpacity style={s.scanBtn} onPress={() => router.push('/leaf/scan' as any)}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={s.scanBtnText}>Scan a Leaf</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── List ──
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View style={s.listHeader}>
            <Text style={s.listHeaderText}>{history.length} scan{history.length !== 1 ? 's' : ''} recorded</Text>
            <TouchableOpacity onPress={confirmClear} style={s.clearBtn}>
              <Ionicons name="trash-outline" size={16} color="#D32F2F" />
              <Text style={s.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#F0F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },

  loadText: { fontSize: 16, color: '#666' },

  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1A2E1A' },
  emptyDesc:  { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2D7A4F', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14,
    marginTop: 8,
  },
  scanBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  /* List */
  list:       { padding: 16, paddingBottom: 30 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  listHeaderText: { fontSize: 14, color: '#666', fontWeight: '500' },
  clearBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText:  { fontSize: 14, color: '#D32F2F', fontWeight: '600' },

  /* Card */
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18,
    padding: 14, marginBottom: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  thumb: { width: 76, height: 76, borderRadius: 12, resizeMode: 'cover' },
  thumbPlaceholder: {
    width: 76, height: 76, borderRadius: 12, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1, justifyContent: 'center', gap: 5 },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },

  tag:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 13, fontWeight: '700' },
  sevTag:  { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 3 },
  sevTagText: { fontSize: 11, fontWeight: '700' },

  conf:    { fontSize: 13, color: '#555' },
  confVal: { fontWeight: '700', color: '#2D7A4F' },
  stage:   { fontSize: 13, color: '#444' },
  date:    { fontSize: 12, color: '#999', marginTop: 2 },
});
