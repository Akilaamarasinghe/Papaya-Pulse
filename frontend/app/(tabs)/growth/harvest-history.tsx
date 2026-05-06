import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { HarvestPredictionHistory } from '../../../types';

const HARVEST_HISTORY_KEY = 'harvest_prediction_history';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_NAMES_SI = [
  'ජන', 'පෙබ', 'මාර්', 'අප්‍රේ', 'මැයි', 'ජුනි',
  'ජූලි', 'අගෝ', 'සැප්', 'ඔක්', 'නොවැ', 'දෙසැ',
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

const harvestMonth = (daysRemaining: number, isSi: boolean): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysRemaining);
  const names = isSi ? MONTH_NAMES_SI : MONTH_NAMES;
  return `${names[d.getMonth()]} ${d.getFullYear()}`;
};

export default function HarvestHistoryScreen() {
  const { currentTheme, t, language } = useTheme();
  const colors = Colors[currentTheme];
  const isDark = currentTheme === 'dark';
  const isSi = language === 'si';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  const navigation = useNavigation();
  const [history, setHistory] = useState<HarvestPredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    if (history.length > 0) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={confirmClear} style={{ padding: 8 }}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, history.length, colors.error]);

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
    Alert.alert(
      isSi ? 'ඉතිහාසය මකන්න' : 'Clear History',
      isSi ? 'සියලුම අස්වැන්න පුරෝකථන ඉතිහාසය මකන්නද?' : 'Delete all harvest prediction history?',
      [
        { text: isSi ? 'අවලංගු' : 'Cancel', style: 'cancel' },
        {
          text: isSi ? 'සියල්ල මකන්න' : 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(HARVEST_HISTORY_KEY);
            setHistory([]);
          },
        },
      ]
    );

  const deleteItem = (id: string) =>
    Alert.alert(
      isSi ? 'ඇතුළත් කිරීම මකන්න' : 'Delete Entry',
      isSi ? 'මෙම වාර්තාව ඉවත් කරන්නද?' : 'Remove this record?',
      [
        { text: isSi ? 'අවලංගු' : 'Cancel', style: 'cancel' },
        {
          text: isSi ? 'මකන්න' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = history.filter((h) => h.id !== id);
            setHistory(updated);
            await AsyncStorage.setItem(HARVEST_HISTORY_KEY, JSON.stringify(updated));
          },
        },
      ]
    );

  const renderItem = ({ item }: { item: HarvestPredictionHistory }) => {
    const { predictions } = item.result;
    const monthEst = harvestMonth(predictions.harvest_days_remaining, isSi);
    const accentColor = isDark ? '#34D399' : '#10B981';

    return (
      <TouchableOpacity
        style={[
          s.card,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: isDark ? colors.border : '#D1FAE5',
          },
        ]}
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
        <View style={[s.accent, { backgroundColor: accentColor }]} />

        <View style={s.cardBody}>
          {/* Top row: district + date */}
          <View style={s.cardTop}>
            <View style={[s.districtBadge, { backgroundColor: isDark ? '#0D3D2E' : '#D1FAE5' }]}>
              <Ionicons name="location-outline" size={13} color={accentColor} />
              <Text style={[s.districtText, { color: isDark ? '#34D399' : '#065F46', fontSize: isSmall ? 12 : 13 }]}>
                {capitalize(item.input.district)}
              </Text>
            </View>
            <Text style={[s.date, { color: isDark ? '#6B7280' : '#999' }]}>{fmtDate(item.timestamp)}</Text>
          </View>

          {/* Main harvest info */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: isDark ? '#34D399' : '#065F46', fontSize: isSmall ? 17 : 20 }]}>
                {predictions.yield_per_tree.toFixed(1)}
                <Text style={[s.statUnit, { color: isDark ? '#9CA3AF' : '#555' }]}> kg</Text>
              </Text>
              <Text style={[s.statLabel, { color: isDark ? '#6B7280' : '#888' }]}>
                {isSi ? 'අස්වැන්න / ගස' : 'Yield / tree'}
              </Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: isDark ? '#34D399' : '#065F46', fontSize: isSmall ? 17 : 20 }]}>
                {predictions.harvest_days_remaining}
                <Text style={[s.statUnit, { color: isDark ? '#9CA3AF' : '#555' }]}> {isSi ? 'දි' : 'd'}</Text>
              </Text>
              <Text style={[s.statLabel, { color: isDark ? '#6B7280' : '#888' }]}>
                {isSi ? 'ඉතිරි දින' : 'Days left'}
              </Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: isDark ? '#34D399' : '#065F46', fontSize: isSmall ? 13 : 15 }]}>{monthEst}</Text>
              <Text style={[s.statLabel, { color: isDark ? '#6B7280' : '#888' }]}>
                {isSi ? 'අස්වනු මාසය' : 'Harvest month'}
              </Text>
            </View>
          </View>

          {/* Input summary */}
          <View style={s.inputRow}>
            <Text style={[s.inputChip, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#D1D5DB' : '#374151' }]}>
              {item.input.trees_count} {isSi ? 'ගස්' : 'trees'}
            </Text>
            <Text style={[s.inputChip, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#D1D5DB' : '#374151' }]}>
              {capitalize(item.input.soil_type)}
            </Text>
            <Text style={[s.inputChip, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6', color: isDark ? '#D1D5DB' : '#374151' }]}>
              {capitalize(item.input.watering_method)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={isDark ? '#4B5563' : '#BDBDBD'} style={{ alignSelf: 'center', marginRight: 8 }} />
      </TouchableOpacity>
    );
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={[s.safe, { backgroundColor: isDark ? colors.background : '#F0FAF6' }]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={isDark ? '#34D399' : '#10B981'} />
        </View>
      </View>
    );
  }

  // ── Empty State ──
  if (history.length === 0) {
    return (
      <View
        style={[s.safe, { backgroundColor: isDark ? colors.background : '#F0FAF6' }]}
      >
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: isDark ? '#0D3D2E' : '#D1FAE5' }]}>
            <Text style={{ fontSize: isSmall ? 28 : 36 }}>📅</Text>
          </View>
          <Text style={[s.emptyTitle, { color: isDark ? colors.text : '#064E3B' }]}>
            {isSi ? 'තවම පුරෝකථන නැත' : 'No Predictions Yet'}
          </Text>
          <Text style={[s.emptyDesc, { color: isDark ? '#9CA3AF' : '#666' }]}>
            {isSi
              ? 'ඔබ ක්‍රියාත්මක කරන අස්වැන්න පුරෝකථන අනාගත යොමුව සඳහා මෙහි දිස්වේ.'
              : 'Harvest predictions you run will appear here for future reference.'}
          </Text>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: isDark ? '#065F46' : '#10B981' }]}
            onPress={() => router.push('/growth/harvest-form')}
          >
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={s.actionBtnText}>
              {isSi ? 'අස්වැන්න පුරෝකථනය' : 'Predict Harvest'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── List ──
  return (
    <View
      style={[s.safe, { backgroundColor: isDark ? colors.background : '#F0FAF6' }]}
    >
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 32 }]}
        ListHeaderComponent={
          <Text style={[s.listCount, { color: isDark ? '#6B7280' : '#888' }]}>
            {history.length} {isSi ? 'පුරෝකථන' : `prediction${history.length !== 1 ? 's' : ''}`} · {isSi ? 'මකන්න දිගු ඔබන්න' : 'Long press to delete'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 14 },

  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13, marginTop: 6,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  list: { padding: 16 },
  listCount: { fontSize: 13, fontWeight: '500', marginBottom: 12 },

  card: {
    flexDirection: 'row', borderRadius: 16, padding: 0,
    marginBottom: 12, overflow: 'hidden', borderWidth: 1,
  },
  accent: { width: 5 },
  cardBody: { flex: 1, padding: 12, gap: 10 },

  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  districtBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  districtText: { fontWeight: '700' },
  date: { fontSize: 12 },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontWeight: '800' },
  statUnit: { fontSize: 12, fontWeight: '500' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 36 },

  inputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  inputChip: {
    fontSize: 12,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
});
