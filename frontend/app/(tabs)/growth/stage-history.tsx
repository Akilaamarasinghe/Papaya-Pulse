import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GrowthStageHistory } from '../../../types';

const STAGE_HISTORY_KEY = 'growth_stage_history';

const STAGE_ICONS: Record<string, string> = { a: '🌱', b: '🌿', c: '🌸', d: '🍈' };
const STAGE_LABELS: Record<string, string> = {
  a: 'Seedling',
  b: 'Juvenile',
  c: 'Pre-Fruiting',
  d: 'Fruiting',
};
const STAGE_COLORS: Record<string, { text: string; bg: string }> = {
  a: { text: '#2E7D32', bg: '#E8F5E9' },
  b: { text: '#1565C0', bg: '#E3F2FD' },
  c: { text: '#E65100', bg: '#FFF3E0' },
  d: { text: '#880E4F', bg: '#FCE4EC' },
};

const fmtDate = (ts: string) => {
  const d = new Date(ts);
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

const pct = (v?: number) =>
  typeof v === 'number' && !Number.isNaN(v) ? `${(v * 100).toFixed(1)}%` : '—';

export default function StageHistoryScreen() {
  const [history, setHistory] = useState<GrowthStageHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STAGE_HISTORY_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory();
    }, [loadHistory])
  );

  const confirmClear = () =>
    Alert.alert('Clear History', 'Delete all growth stage scan history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STAGE_HISTORY_KEY);
          setHistory([]);
        },
      },
    ]);

  const deleteItem = (id: string) =>
    Alert.alert('Delete Entry', 'Remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = history.filter((h) => h.id !== id);
          setHistory(updated);
          await AsyncStorage.setItem(STAGE_HISTORY_KEY, JSON.stringify(updated));
        },
      },
    ]);

  const renderItem = ({ item }: { item: GrowthStageHistory }) => {
    const grade = item.result?.grade_prediction;
    const stageCode = grade?.grade?.toLowerCase() ?? '';
    const sc = STAGE_COLORS[stageCode];
    const icon = STAGE_ICONS[stageCode] ?? '🌿';
    const label = STAGE_LABELS[stageCode] ?? 'Unknown';
    const isPapaya = item.result?.is_papaya;

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.82}
        onPress={() =>
          router.push({
            pathname: '/growth/stage-result',
            params: {
              result: JSON.stringify(item.result),
              imageUri: item.imageUri ?? '',
            },
          })
        }
        onLongPress={() => deleteItem(item.id)}
      >
        {/* Thumbnail */}
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={s.thumb} />
        ) : (
          <View style={s.thumbPlaceholder}>
            <Text style={s.thumbEmoji}>{icon}</Text>
          </View>
        )}

        <View style={s.cardBody}>
          {/* Stage tag or Not Papaya */}
          {isPapaya === false ? (
            <View style={[s.tag, { backgroundColor: '#ECEFF1' }]}>
              <Text style={[s.tagText, { color: '#607D8B' }]}>Not a Papaya</Text>
            </View>
          ) : stageCode ? (
            <View style={s.tagRow}>
              <Text style={s.tagIcon}>{icon}</Text>
              <View style={[s.tag, { backgroundColor: sc?.bg ?? '#F5F5F5' }]}>
                <Text style={[s.tagText, { color: sc?.text ?? '#555' }]}>
                  Stage {stageCode.toUpperCase()} — {label}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[s.tag, { backgroundColor: '#F5F5F5' }]}>
              <Text style={[s.tagText, { color: '#888' }]}>Result unavailable</Text>
            </View>
          )}

          {/* Confidence */}
          {grade && (
            <Text style={s.conf}>
              Confidence:{' '}
              <Text style={s.confVal}>{pct(grade.confidence)}</Text>
            </Text>
          )}

          {/* Stage name from guidance */}
          {item.result?.growth_guidance?.current_stage?.name ? (
            <Text style={s.stageName} numberOfLines={1}>
              {item.result.growth_guidance.current_stage.name}
            </Text>
          ) : null}

          <Text style={s.date}>{fmtDate(item.timestamp)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#BDBDBD" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#34D399" />
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#2D7A4F" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Stage Scan History</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Text style={{ fontSize: 36 }}>🌿</Text>
          </View>
          <Text style={s.emptyTitle}>No Scans Yet</Text>
          <Text style={s.emptyDesc}>
            After you scan a papaya plant for growth stage, results will appear here.
          </Text>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/growth/stage-check')}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={s.actionBtnText}>Scan a Plant</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2D7A4F" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Stage Scan History</Text>
        <TouchableOpacity onPress={confirmClear} style={s.clearBtn}>
          <Ionicons name="trash-outline" size={19} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <Text style={s.listCount}>
            {history.length} scan{history.length !== 1 ? 's' : ''} · Long press to delete
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E1A' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  clearBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  emptyIcon: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1A2E1A' },
  emptyDesc:  { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2D7A4F', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  list: { padding: 16, paddingBottom: 32 },
  listCount: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 14 },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, padding: 14,
    marginBottom: 12, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  thumb: { width: 76, height: 76, borderRadius: 12, resizeMode: 'cover' },
  thumbPlaceholder: {
    width: 76, height: 76, borderRadius: 12, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbEmoji: { fontSize: 30 },
  cardBody: { flex: 1, justifyContent: 'center', gap: 5 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagIcon: { fontSize: 16 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  tagText: { fontSize: 13, fontWeight: '700' },

  conf:     { fontSize: 13, color: '#555' },
  confVal:  { fontWeight: '700', color: '#2D7A4F' },
  stageName:{ fontSize: 13, color: '#444' },
  date:     { fontSize: 12, color: '#999', marginTop: 2 },
});
