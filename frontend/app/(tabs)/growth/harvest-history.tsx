import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HarvestPredictionHistory } from '../../../types';

const HARVEST_HISTORY_KEY = 'harvest_prediction_history';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const fmtDate = (ts: string) => {
  const d = new Date(ts);
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';

const harvestMonth = (daysRemaining: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysRemaining);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

export default function HarvestHistoryScreen() {
  const [history, setHistory] = useState<HarvestPredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HARVEST_HISTORY_KEY);
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
    Alert.alert('Clear History', 'Delete all harvest prediction history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(HARVEST_HISTORY_KEY);
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
          await AsyncStorage.setItem(HARVEST_HISTORY_KEY, JSON.stringify(updated));
        },
      },
    ]);

  const renderItem = ({ item }: { item: HarvestPredictionHistory }) => {
    const { predictions } = item.result;
    const monthEst = harvestMonth(predictions.harvest_days_remaining);

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.82}
        onLongPress={() => deleteItem(item.id)}
        onPress={() =>
          router.push({
            pathname: '/growth/harvest-result',
            params: { data: JSON.stringify(item.result) },
          })
        }
      >
        {/* Left accent strip */}
        <View style={s.accent} />

        <View style={s.cardBody}>
          {/* Top row: district + date */}
          <View style={s.cardTop}>
            <View style={s.districtBadge}>
              <Ionicons name="location-outline" size={13} color="#10B981" />
              <Text style={s.districtText}>{capitalize(item.input.district)}</Text>
            </View>
            <Text style={s.date}>{fmtDate(item.timestamp)}</Text>
          </View>

          {/* Main harvest info */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{predictions.yield_per_tree.toFixed(1)}<Text style={s.statUnit}> kg</Text></Text>
              <Text style={s.statLabel}>Yield / tree</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{predictions.harvest_days_remaining}<Text style={s.statUnit}> d</Text></Text>
              <Text style={s.statLabel}>Days left</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={[s.statValue, { fontSize: 15 }]}>{monthEst}</Text>
              <Text style={s.statLabel}>Harvest month</Text>
            </View>
          </View>

          {/* Input summary */}
          <View style={s.inputRow}>
            <Text style={s.inputChip}>{item.input.trees_count} trees</Text>
            <Text style={s.inputChip}>{capitalize(item.input.soil_type)}</Text>
            <Text style={s.inputChip}>{capitalize(item.input.watering_method)}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#BDBDBD" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#10B981" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Harvest History</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Text style={{ fontSize: 36 }}>📅</Text>
          </View>
          <Text style={s.emptyTitle}>No Predictions Yet</Text>
          <Text style={s.emptyDesc}>
            Harvest predictions you run will appear here for future reference.
          </Text>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/growth/harvest-form')}>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={s.actionBtnText}>Predict Harvest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#10B981" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Harvest History</Text>
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
            {history.length} prediction{history.length !== 1 ? 's' : ''} · Long press to delete
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0FAF6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#064E3B' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  clearBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  emptyIcon: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: '#D1FAE5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#064E3B' },
  emptyDesc:  { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#10B981', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  list:      { padding: 16, paddingBottom: 32 },
  listCount: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 14 },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, padding: 0,
    marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  accent: { width: 6, backgroundColor: '#10B981' },
  cardBody: { flex: 1, padding: 14, gap: 10 },

  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  districtBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  districtText: { fontSize: 13, fontWeight: '700', color: '#065F46' },
  date: { fontSize: 12, color: '#999' },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  statBox:  { flex: 1, alignItems: 'center' },
  statValue:{ fontSize: 20, fontWeight: '800', color: '#065F46' },
  statUnit: { fontSize: 12, fontWeight: '500', color: '#555' },
  statLabel:{ fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#E5E7EB' },

  inputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  inputChip: {
    fontSize: 12, color: '#374151', backgroundColor: '#F3F4F6',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
});
