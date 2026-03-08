import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert, ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { GrowthStageHistory } from '../../../types';

const STAGE_HISTORY_KEY = 'growth_stage_history';

const STAGE_ICONS: Record<string, string> = { a: '🌱', b: '🌿', c: '🌸', d: '🍈' };
const STAGE_LABELS: Record<string, string> = {
  a: 'Seedling',
  b: 'Juvenile',
  c: 'Pre-Fruiting',
  d: 'Fruiting',
};
const STAGE_LABELS_SI: Record<string, string> = {
  a: 'පැල',
  b: 'තරුණ',
  c: 'පූර්ව ඵලදා',
  d: 'ඵලදා',
};
const STAGE_COLORS: Record<string, { text: string; bg: string; textDark: string; bgDark: string }> = {
  a: { text: '#2E7D32', bg: '#E8F5E9', textDark: '#66BB6A', bgDark: '#1B3A1B' },
  b: { text: '#1565C0', bg: '#E3F2FD', textDark: '#64B5F6', bgDark: '#152A3D' },
  c: { text: '#E65100', bg: '#FFF3E0', textDark: '#FFA726', bgDark: '#3D2A15' },
  d: { text: '#880E4F', bg: '#FCE4EC', textDark: '#F48FB1', bgDark: '#3D1528' },
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
  const { currentTheme, t, language } = useTheme();
  const colors = Colors[currentTheme];
  const isDark = currentTheme === 'dark';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  const navigation = useNavigation();
  const [history, setHistory] = useState<GrowthStageHistory[]>([]);
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
    Alert.alert(
      language === 'si' ? 'ඉතිහාසය මකන්න' : 'Clear History',
      language === 'si' ? 'සියලුම වර්ධන අදියර ස්කෑන් ඉතිහාසය මකන්නද?' : 'Delete all growth stage scan history?',
      [
        { text: language === 'si' ? 'අවලංගු' : 'Cancel', style: 'cancel' },
        {
          text: language === 'si' ? 'සියල්ල මකන්න' : 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(STAGE_HISTORY_KEY);
            setHistory([]);
          },
        },
      ]
    );

  const deleteItem = (id: string) =>
    Alert.alert(
      language === 'si' ? 'ඇතුළත් කිරීම මකන්න' : 'Delete Entry',
      language === 'si' ? 'මෙම වාර්තාව ඉවත් කරන්නද?' : 'Remove this record?',
      [
        { text: language === 'si' ? 'අවලංගු' : 'Cancel', style: 'cancel' },
        {
          text: language === 'si' ? 'මකන්න' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = history.filter((h) => h.id !== id);
            setHistory(updated);
            await AsyncStorage.setItem(STAGE_HISTORY_KEY, JSON.stringify(updated));
          },
        },
      ]
    );

  const renderItem = ({ item }: { item: GrowthStageHistory }) => {
    const grade = item.result?.grade_prediction;
    const stageCode = grade?.grade?.toLowerCase() ?? '';
    const sc = STAGE_COLORS[stageCode];
    const icon = STAGE_ICONS[stageCode] ?? '🌿';
    const label = language === 'si'
      ? (STAGE_LABELS_SI[stageCode] ?? 'නොදනී')
      : (STAGE_LABELS[stageCode] ?? 'Unknown');
    const isPapaya = item.result?.is_papaya;
    const thumbSize = isSmall ? 60 : 72;

    return (
      <TouchableOpacity
        style={[
          s.card,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E8F5E9',
          },
        ]}
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
          <Image source={{ uri: item.imageUri }} style={[s.thumb, { width: thumbSize, height: thumbSize }]} />
        ) : (
          <View style={[s.thumbPlaceholder, { width: thumbSize, height: thumbSize, backgroundColor: isDark ? sc?.bgDark ?? '#1B3A1B' : sc?.bg ?? '#E8F5E9' }]}>
            <Text style={{ fontSize: isSmall ? 24 : 30 }}>{icon}</Text>
          </View>
        )}

        <View style={s.cardBody}>
          {/* Stage tag or Not Papaya */}
          {isPapaya === false ? (
            <View style={[s.tag, { backgroundColor: isDark ? '#2A2A2A' : '#ECEFF1' }]}>
              <Text style={[s.tagText, { color: isDark ? '#90A4AE' : '#607D8B' }]}>
                {language === 'si' ? 'පැපොල් නොවේ' : 'Not a Papaya'}
              </Text>
            </View>
          ) : stageCode ? (
            <View style={s.tagRow}>
              <Text style={{ fontSize: isSmall ? 14 : 16 }}>{icon}</Text>
              <View style={[s.tag, { backgroundColor: isDark ? sc?.bgDark ?? '#1B3A1B' : sc?.bg ?? '#F5F5F5' }]}>
                <Text style={[s.tagText, { color: isDark ? sc?.textDark ?? '#aaa' : sc?.text ?? '#555', fontSize: isSmall ? 11 : 13 }]}>
                  Stage {stageCode.toUpperCase()} — {label}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[s.tag, { backgroundColor: isDark ? '#1E293B' : '#F5F5F5' }]}>
              <Text style={[s.tagText, { color: isDark ? '#6B7280' : '#888' }]}>
                {language === 'si' ? 'ප්‍රතිඵලය නැත' : 'Result unavailable'}
              </Text>
            </View>
          )}

          {/* Confidence */}
          {grade && (
            <View style={s.confRow}>
              <Ionicons name="analytics-outline" size={13} color={isDark ? '#34D399' : '#2D7A4F'} />
              <Text style={[s.conf, { color: isDark ? '#9CA3AF' : '#555' }]}>
                {language === 'si' ? 'විශ්වාසය' : 'Confidence'}:{' '}
                <Text style={[s.confVal, { color: isDark ? '#34D399' : '#2D7A4F' }]}>{pct(grade.confidence)}</Text>
              </Text>
            </View>
          )}

          {/* Stage name from guidance */}
          {item.result?.growth_guidance?.current_stage?.name ? (
            <Text style={[s.stageName, { color: isDark ? '#D1D5DB' : '#444' }]} numberOfLines={1}>
              {language === 'si' && item.result.growth_guidance.current_stage.name_si
                ? item.result.growth_guidance.current_stage.name_si
                : item.result.growth_guidance.current_stage.name}
            </Text>
          ) : null}

          <Text style={[s.date, { color: isDark ? '#6B7280' : '#999' }]}>{fmtDate(item.timestamp)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={isDark ? '#4B5563' : '#BDBDBD'} style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={[s.safe, { backgroundColor: isDark ? colors.background : '#F0F7F2' }]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      </View>
    );
  }

  // ── Empty State ──
  if (history.length === 0) {
    return (
      <View
        style={[s.safe, { backgroundColor: isDark ? colors.background : '#F0F7F2' }]}
      >
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: isDark ? '#1B3A1B' : '#E8F5E9' }]}>
            <Text style={{ fontSize: isSmall ? 28 : 36 }}>🌿</Text>
          </View>
          <Text style={[s.emptyTitle, { color: isDark ? colors.text : '#1A2E1A' }]}>
            {language === 'si' ? 'තවම ස්කෑන් නැත' : 'No Scans Yet'}
          </Text>
          <Text style={[s.emptyDesc, { color: isDark ? '#9CA3AF' : '#666' }]}>
            {language === 'si'
              ? 'ඔබ පැපොල් ශාකයක වර්ධන අදියර ස්කෑන් කළ පසු, ප්‍රතිඵල මෙහි දිස්වේ.'
              : 'After you scan a papaya plant for growth stage, results will appear here.'}
          </Text>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: isDark ? '#065F46' : '#2D7A4F' }]}
            onPress={() => router.push('/growth/stage-check')}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={s.actionBtnText}>
              {language === 'si' ? 'ශාකයක් ස්කෑන් කරන්න' : 'Scan a Plant'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── List ──
  return (
    <View
      style={[s.safe, { backgroundColor: isDark ? colors.background : '#F0F7F2' }]}
    >
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 32 }]}
        ListHeaderComponent={
          <Text style={[s.listCount, { color: isDark ? '#6B7280' : '#888' }]}>
            {history.length} {language === 'si' ? 'ස්කෑන්' : `scan${history.length !== 1 ? 's' : ''}`} · {language === 'si' ? 'මකන්න දිගු ඔබන්න' : 'Long press to delete'}
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
    flexDirection: 'row', borderRadius: 16, padding: 12,
    marginBottom: 12, gap: 12, borderWidth: 1,
  },
  thumb: { borderRadius: 12 },
  thumbPlaceholder: {
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1, justifyContent: 'center', gap: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  tagText: { fontSize: 13, fontWeight: '700' },

  confRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  conf: { fontSize: 13 },
  confVal: { fontWeight: '700' },
  stageName: { fontSize: 13 },
  date: { fontSize: 12, marginTop: 2 },
});
