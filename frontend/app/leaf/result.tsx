import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import {
  LeafDiseaseResponse, LeafRecommendResponse, LeafWeatherRisk, DayRisk,
  GrowthStage,
} from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────

const pct = (v?: number) =>
  typeof v === 'number' && !Number.isNaN(v) ? `${(v * 100).toFixed(1)}%` : '—';

const fmtStage = (s?: string | null) =>
  s ? s.replace(/[_-]/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase()) : null;

const diseaseToML: Record<string, string> = {
  Anthracnose:    'anthracnose',
  Curl:           'curl',
  'Mite disease': 'mite_disease',
  'Mosaic virus': 'mosaic',
};

// ─── UI helpers ───────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  mild:     '#388E3C',
  moderate: '#F57C00',
  severe:   '#D32F2F',
  unknown:  '#9E9E9E',
};
const SEV_BG: Record<string, string> = {
  mild:     '#E8F5E9',
  moderate: '#FFF3E0',
  severe:   '#FFEBEE',
  unknown:  '#F5F5F5',
};
const RISK_COLOR: Record<string, string> = {
  LOW:      '#388E3C',
  MEDIUM:   '#F57C00',
  HIGH:     '#D32F2F',
  CRITICAL: '#6A1B9A',
};
const RISK_BG: Record<string, string> = {
  LOW:      '#E8F5E9',
  MEDIUM:   '#FFF8E1',
  HIGH:     '#FFEBEE',
  CRITICAL: '#F3E5F5',
};
const RISK_BORDER: Record<string, string> = {
  LOW:      '#A5D6A7',
  MEDIUM:   '#FFE082',
  HIGH:     '#EF9A9A',
  CRITICAL: '#CE93D8',
};
const ALERT_BAR_COLOR: Record<string, string> = {
  GREEN:  '#2E7D32',
  YELLOW: '#F9A825',
  ORANGE: '#E65100',
  RED:    '#6A1B9A',
};
const DAY_RISK_DOT: Record<string, string> = {
  LOW:      '#43A047',
  MEDIUM:   '#FB8C00',
  HIGH:     '#E53935',
  CRITICAL: '#8E24AA',
};

// ─── Sub-components ───────────────────────────────────────────────────────

function InfoChip({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[chip.wrap, { backgroundColor: bg }]}>
      <Text style={chip.label}>{label}</Text>
      <Text style={[chip.value, { color }]}>{value}</Text>
    </View>
  );
}
const chip = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8 },
  label: { fontSize: 12, color: '#666', marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800' },
});

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={sec.card}>
      <View style={sec.header}>
        <Ionicons name={icon as any} size={20} color="#2D7A4F" />
        <Text style={sec.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
const sec = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title:  { fontSize: 16, fontWeight: '700', color: '#1A2E1A' },
});

// ─── Day Forecast Card ────────────────────────────────────────────────────

function DayForecastCard({ day }: { day: DayRisk }) {
  const dot = DAY_RISK_DOT[day.day_risk] || '#888';
  const shortDate = day.date ? day.date.slice(5) : '';
  return (
    <View style={fc.card}>
      <Text style={fc.date}>{shortDate}</Text>
      <View style={[fc.dot, { backgroundColor: dot }]} />
      <Text style={fc.riskLabel}>{day.day_risk}</Text>
      <Text style={fc.stat}>🌡 {day.tmean.toFixed(1)}°C</Text>
      <Text style={fc.stat}>🌧 {day.rain_mm.toFixed(1)} mm</Text>
      <Text style={fc.stat}>💧 {day.humidity_est.toFixed(0)}%</Text>
    </View>
  );
}
const fc = StyleSheet.create({
  card:      { width: 88, borderRadius: 14, backgroundColor: '#F9F9FB', padding: 10,
               alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  date:      { fontSize: 12, fontWeight: '700', color: '#444', marginBottom: 6 },
  dot:       { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  riskLabel: { fontSize: 10, fontWeight: '800', color: '#333', marginBottom: 6 },
  stat:      { fontSize: 11, color: '#555', marginBottom: 2 },
});

// ─── Expandable block (generic) ────────────────────────────────────────────

function ExpandableBlock({
  icon, title, children, defaultOpen = false,
}: { icon: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <View style={eb.wrap}>
      <TouchableOpacity style={eb.header} onPress={() => setOpen(!open)}>
        <Ionicons name={icon as any} size={16} color="#2D7A4F" />
        <Text style={eb.title}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#888" />
      </TouchableOpacity>
      {open && <View style={eb.body}>{children}</View>}
    </View>
  );
}
const eb = StyleSheet.create({
  wrap:   { borderTopWidth: 1, borderTopColor: '#EFEFEF', paddingTop: 12, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:  { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  body:   { marginTop: 10 },
});

function ExpandableAdvice({ title, text, lang }: { title: string; text: string; lang: 'EN' | 'SI' }) {
  const [open, setOpen] = useState(lang === 'EN');
  return (
    <View style={adv.wrap}>
      <TouchableOpacity style={adv.toggle} onPress={() => setOpen(!open)}>
        <View style={[adv.langBadge, lang === 'SI' && { backgroundColor: '#EDE7F6' }]}>
          <Text style={[adv.langText, lang === 'SI' && { color: '#6A1B9A' }]}>{lang}</Text>
        </View>
        <Text style={adv.toggleTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
      </TouchableOpacity>
      {open && <Text style={adv.body}>{text}</Text>}
    </View>
  );
}
const adv = StyleSheet.create({
  wrap:        { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12, marginTop: 4 },
  toggle:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  langBadge:   { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  langText:    { fontSize: 12, fontWeight: '700', color: '#2D7A4F' },
  toggleTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  body:        { fontSize: 14, color: '#444', lineHeight: 22 },
});

// ─── Weather Risk Panel ────────────────────────────────────────────────────

function WeatherRiskPanel({ weatherRisk, disease }: { weatherRisk: LeafWeatherRisk; disease: string }) {
  const rl    = weatherRisk.risk_level;
  const color = RISK_COLOR[rl] || '#888';
  const bg    = RISK_BG[rl]    || '#F5F5F5';
  const bord  = RISK_BORDER[rl] || '#DDD';
  const barColor = ALERT_BAR_COLOR[weatherRisk.alert_color || 'YELLOW'] || '#F9A825';
  const score    = weatherRisk.risk_score != null ? `${(weatherRisk.risk_score * 100).toFixed(0)}%` : null;

  return (
    <Section title="Weather & Disease Risk" icon="thunderstorm-outline">
      {/* Coloured alert bar */}
      <View style={[s.alertBar, { backgroundColor: barColor }]} />

      {/* Risk level badge */}
      <View style={[s.riskBadge, { backgroundColor: bg, borderWidth: 1.5, borderColor: bord }]}>
        <View>
          <Text style={[s.riskBadgeText, { color }]}>{rl}</Text>
          {weatherRisk.risk_level_si ? (
            <Text style={s.riskBadgeSi}>{weatherRisk.risk_level_si}</Text>
          ) : null}
        </View>
        {score ? (
          <Text style={s.riskScore}>Model confidence\n{score}</Text>
        ) : null}
      </View>

      {/* Urgency message */}
      {weatherRisk.urgency_en ? (
        <View style={s.urgencyRow}>
          <Ionicons name="alert-circle-outline" size={18} color={color} style={s.urgencyIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[s.urgencyText, { color }]}>{weatherRisk.urgency_en}</Text>
            {weatherRisk.urgency_si ? (
              <Text style={[s.urgencyText, { color: '#4A148C', marginTop: 4 }]}>{weatherRisk.urgency_si}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Inspection frequency */}
      {weatherRisk.frequency ? (
        <Text style={s.frequencyText}>
          📋 {weatherRisk.frequency}
          {weatherRisk.frequency_si ? `  •  ${weatherRisk.frequency_si}` : ''}
        </Text>
      ) : null}

      {/* 7-day weather summary chips */}
      {weatherRisk.weather_summary && (
        <View style={s.wsRow}>
          <View style={s.wsChip}>
            <Text style={s.wsLabel}>Avg Temp</Text>
            <Text style={s.wsValue}>{weatherRisk.weather_summary.tmean_7d_avg_c}°C</Text>
          </View>
          <View style={s.wsChip}>
            <Text style={s.wsLabel}>Rain 7d</Text>
            <Text style={s.wsValue}>{weatherRisk.weather_summary.total_rain_7d_mm} mm</Text>
          </View>
          <View style={s.wsChip}>
            <Text style={s.wsLabel}>Max Temp</Text>
            <Text style={s.wsValue}>{weatherRisk.weather_summary.tmax_c}°C</Text>
          </View>
          <View style={s.wsChip}>
            <Text style={s.wsLabel}>Humidity</Text>
            <Text style={s.wsValue}>{weatherRisk.weather_summary.humidity_est_pct}%</Text>
          </View>
        </View>
      )}

      {/* 7-day daily forecast scroll */}
      {weatherRisk.daily_risk && weatherRisk.daily_risk.length > 0 && (
        <ExpandableBlock icon="calendar-outline" title="7-Day Forecast" defaultOpen>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weatherRisk.daily_risk.map((d, i) => (
              <DayForecastCard key={i} day={d} />
            ))}
          </ScrollView>
        </ExpandableBlock>
      )}

      {/* Future disease outlook */}
      {(weatherRisk.future_outlook_en || weatherRisk.future_outlook_si) && (
        <ExpandableBlock icon="trending-up-outline" title="What Could Happen (Next 7 Days)" defaultOpen>
          {weatherRisk.future_outlook_en ? (
            <Text style={s.bodyText}>{weatherRisk.future_outlook_en}</Text>
          ) : null}
          {weatherRisk.future_outlook_si ? (
            <Text style={s.bodyTextSi}>{weatherRisk.future_outlook_si}</Text>
          ) : null}
        </ExpandableBlock>
      )}

      {/* Disease × weather explanation */}
      {(weatherRisk.disease_explanation || weatherRisk.disease_explanation_si) && (
        <ExpandableBlock icon="information-circle-outline" title="Why Weather Matters for This Disease">
          {weatherRisk.disease_explanation ? (
            <Text style={s.bodyText}>{weatherRisk.disease_explanation}</Text>
          ) : null}
          {weatherRisk.disease_explanation_si ? (
            <Text style={s.bodyTextSi}>{weatherRisk.disease_explanation_si}</Text>
          ) : null}
        </ExpandableBlock>
      )}

      {/* XAI: why this risk level */}
      {(weatherRisk.why_this_risk_en || weatherRisk.why_this_risk_si) && (
        <ExpandableBlock icon="analytics-outline" title="Why This Risk Level? (Explainable AI)">
          {weatherRisk.why_this_risk_en ? (
            <Text style={s.bodyText}>{weatherRisk.why_this_risk_en}</Text>
          ) : null}
          {weatherRisk.why_this_risk_si ? (
            <Text style={s.bodyTextSi}>{weatherRisk.why_this_risk_si}</Text>
          ) : null}
          {weatherRisk.model_used ? (
            <Text style={s.modelTag}>Powered by: ML weather_risk_model ({weatherRisk.model_used})</Text>
          ) : null}
        </ExpandableBlock>
      )}
    </Section>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function LeafResultScreen() {
  const params   = useLocalSearchParams();
  const { user } = useAuth();
  const [recommend, setRecommend]   = useState<LeafRecommendResponse | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError]     = useState<string | null>(null);

  const data: LeafDiseaseResponse | null = params.data
    ? JSON.parse(params.data as string)
    : null;
  const growthStage = (params.growthStage as GrowthStage) || 'flowering';

  const isNotLeaf = data?.is_leaf === false || data?.disease === 'NotPapaya';
  const isHealthy = data?.disease === 'Healthy';
  const isDisease = data && !isNotLeaf && !isHealthy;

  // ── Fetch recommendation when a disease is detected ──
  useEffect(() => {
    if (!isDisease || !data) return;
    const mlDisease = diseaseToML[data.disease] || data.disease.toLowerCase();
    const district  = (user?.district || 'galle').toLowerCase();
    setRecLoading(true);
    setRecError(null);
    api
      .post<LeafRecommendResponse>('/leaf/recommend', {
        disease:           mlDisease,
        severity:          data.severity || 'moderate',
        growth_stage:      growthStage,
        soil_type:         'sandy_loam',
        district,
        include_ai_advice: true,
      })
      .then((r) => setRecommend(r.data))
      .catch((e) => {
        console.warn('Recommend err:', e);
        setRecError('Could not load treatment advice. The ML service may be offline.');
      })
      .finally(() => setRecLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.disease, data?.severity, growthStage, isDisease, user?.district]);

  // ── No data guard ──
  if (!data) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={52} color="#999" />
          <Text style={s.emptyText}>No diagnosis data available.</Text>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Status banner ──
  const bannerBg    = isNotLeaf ? '#607D8B' : isHealthy ? '#2E7D32' : '#C62828';
  const bannerLabel = isNotLeaf ? 'Not a Papaya Leaf' : isHealthy ? 'Healthy Leaf ✅' : data.disease;
  const bannerIcon: any  = isNotLeaf ? 'close-circle' : isHealthy ? 'checkmark-circle' : 'warning';

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Status Banner ── */}
        <View style={[s.banner, { backgroundColor: bannerBg }]}>
          <Ionicons name={bannerIcon} size={36} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={s.bannerLabel}>Diagnosis Result</Text>
          <Text style={s.bannerDisease}>{bannerLabel}</Text>
          {isDisease && (
            <Text style={s.bannerSub}>{data.disease} detected on papaya leaf</Text>
          )}
          {isNotLeaf && (
            <Text style={s.bannerSub}>Please retake with a papaya leaf in frame</Text>
          )}
        </View>

        <View style={s.body}>

          {/* ── Confidence Row ── */}
          <Section title="Detection Confidence" icon="analytics-outline">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <InfoChip
                label="Disease Model"
                value={pct(data.disease_confidence)}
                color="#2D7A4F" bg="#E8F5E9"
              />
              <InfoChip
                label="Leaf Check"
                value={pct(data.leaf_confidence)}
                color="#1565C0" bg="#E3F2FD"
              />
            </View>
            {!isDisease && (
              <Text style={s.hint}>
                {isNotLeaf
                  ? 'The AI did not detect a papaya leaf. Ensure the leaf fills the frame.'
                  : 'The leaf appears healthy. Continue regular care and monitoring.'}
              </Text>
            )}
          </Section>

          {/* ── Severity ── */}
          {isDisease && data.severity !== 'unknown' && (
            <Section title="Disease Severity" icon="pulse-outline">
              <View style={[s.sevBadge, { backgroundColor: SEV_BG[data.severity] }]}>
                <Text style={[s.sevText, { color: SEV_COLOR[data.severity] }]}>
                  {data.severity.toUpperCase()}
                </Text>
                <Text style={s.sevConf}>({pct(data.severity_confidence)} confidence)</Text>
              </View>
              {fmtStage(data.stage_label) && (
                <View style={s.stageRow}>
                  <Ionicons name="git-branch-outline" size={16} color="#555" />
                  <Text style={s.stageText}>
                    Stage:{' '}
                    <Text style={{ fontWeight: '700' }}>{fmtStage(data.stage_label)}</Text>
                    {data.stage_confidence ? `  (${pct(data.stage_confidence)})` : ''}
                  </Text>
                </View>
              )}
            </Section>
          )}

          {/* ── Treatment Recommendation ── */}
          {isDisease && (
            <Section title="Treatment Recommendation" icon="medkit-outline">
              {recLoading && (
                <View style={s.loadRow}>
                  <ActivityIndicator color="#2D7A4F" size="small" />
                  <Text style={s.loadText}>Loading personalised advice…</Text>
                </View>
              )}

              {recError && (
                <View style={s.errorBox}>
                  <Ionicons name="cloud-offline-outline" size={20} color="#D32F2F" />
                  <Text style={s.errorText}>{recError}</Text>
                </View>
              )}

              {recommend && !recLoading && (
                <>
                  <View style={s.recRow}>
                    <View style={s.recIconWrap}>
                      <Ionicons name="flask-outline" size={22} color="#2D7A4F" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.recLabel}>Fertilizer Action</Text>
                      <Text style={s.recValue}>
                        {recommend.fertilizer?.action?.replace(/_/g, ' ') || '—'}
                      </Text>
                    </View>
                  </View>

                  {recommend.fertilizer?.advice_en ? (
                    <View style={s.recRow}>
                      <View style={[s.recIconWrap, { backgroundColor: '#FFF3E0' }]}>
                        <Ionicons name="leaf-outline" size={22} color="#F57C00" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.recLabel}>Fertilizer Advice</Text>
                        <Text style={s.recValue}>{recommend.fertilizer.advice_en}</Text>
                        {recommend.fertilizer?.advice_si && (
                          <Text style={[s.recSub, { color: '#6A1B9A', marginTop: 2 }]}>{recommend.fertilizer.advice_si}</Text>
                        )}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </Section>
          )}

          {/* ── Weather & Disease Risk Forecast ── */}
          {isDisease && recommend?.weather_risk && (
            <WeatherRiskPanel weatherRisk={recommend.weather_risk} disease={recommend.disease} />
          )}

          {/* ── AI Advisory ── */}
          {isDisease && recommend?.ai_advice && (
            <Section title="AI Advisory" icon="chatbubble-ellipses-outline">
              {!recommend.ai_advice.ai_enriched && (
                <View style={s.aiBanner}>
                  <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
                  <Text style={s.aiBannerText}>Expert template-based advice</Text>
                </View>
              )}
              <ExpandableAdvice
                title="English Advice"
                text={recommend.ai_advice.advice_en}
                lang="EN"
              />
              {recommend.ai_advice.advice_si ? (
                <ExpandableAdvice
                  title="සිංහල උපදෙස්"
                  text={recommend.ai_advice.advice_si}
                  lang="SI"
                />
              ) : null}
              {recommend.ai_advice.urgent_action_en ? (
                <View style={s.urgentBox}>
                  <Ionicons name="flash" size={16} color="#B71C1C" />
                  <Text style={s.urgentText}>{recommend.ai_advice.urgent_action_en}</Text>
                </View>
              ) : null}
            </Section>
          )}

          {/* ── Model Details ── */}
          {data.model_metadata && (
            <Section title="Model Details" icon="hardware-chip-outline">
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <InfoChip
                  label="Version"
                  value={data.model_metadata.model_version || 'v1'}
                  color="#555" bg="#F5F5F5"
                />
                <InfoChip
                  label="Latency"
                  value={
                    data.model_metadata.inference_time_ms
                      ? `${data.model_metadata.inference_time_ms} ms`
                      : '—'
                  }
                  color="#555" bg="#F5F5F5"
                />
              </View>
            </Section>
          )}

          {/* ── Actions ── */}
          <View style={s.actions}>
            <TouchableOpacity
              style={s.primaryAction}
              onPress={() => router.replace('/leaf/scan' as any)}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={s.primaryActionText}>Scan Another Leaf</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryAction}
              onPress={() => router.push('/leaf/history' as any)}
            >
              <Ionicons name="time-outline" size={20} color="#2D7A4F" />
              <Text style={s.secondaryActionText}>View Scan History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.ghostAction} onPress={() => router.back()}>
              <Text style={s.ghostActionText}>Done</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F0F7F2' },
  scroll: { paddingBottom: 30 },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  emptyText:   { fontSize: 16, color: '#888', textAlign: 'center' },
  backBtn:     { backgroundColor: '#2D7A4F', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  /* Banner */
  banner:        { paddingTop: 36, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center' },
  bannerLabel:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase' },
  bannerDisease: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 4, marginBottom: 6 },
  bannerSub:     { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  body: { padding: 16, paddingTop: 20 },
  hint: { fontSize: 14, color: '#555', lineHeight: 20, marginTop: 12 },

  /* Severity */
  sevBadge: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  sevText:  { fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  sevConf:  { fontSize: 13, color: '#666', marginTop: 2 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  stageText:{ flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },

  /* Recommend */
  loadRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadText:    { fontSize: 14, color: '#666' },
  errorBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12 },
  errorText:   { flex: 1, fontSize: 13, color: '#D32F2F', lineHeight: 18 },
  recRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  recIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  recLabel:    { fontSize: 12, color: '#777', marginBottom: 3 },
  recValue:    { fontSize: 15, fontWeight: '700', color: '#1A2E1A' },
  recSub:      { fontSize: 13, color: '#555', marginTop: 2, lineHeight: 18 },

  /* AI */
  aiBanner:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10, marginBottom: 10 },
  aiBannerText: { flex: 1, fontSize: 13, color: '#1565C0' },

  /* Actions */
  actions: { gap: 12, marginTop: 6 },
  primaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#2D7A4F', borderRadius: 16, paddingVertical: 16,
    shadowColor: '#2D7A4F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 6,
  },
  primaryActionText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 14, borderWidth: 2, borderColor: '#2D7A4F',
    backgroundColor: '#fff',
  },
  secondaryActionText: { fontSize: 16, fontWeight: '600', color: '#2D7A4F' },
  ghostAction:         { alignItems: 'center', paddingVertical: 12 },
  ghostActionText: { fontSize: 16, color: '#888', fontWeight: '500' },

  /* Urgent action */
  urgentBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginTop: 10 },
  urgentText: { flex: 1, fontSize: 13, color: '#B71C1C', lineHeight: 19, fontWeight: '600' },

  /* Weather panel */
  alertBar:       { height: 6, borderRadius: 4, marginBottom: 14 },
  riskBadge:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    borderRadius: 12, padding: 12, marginBottom: 12 },
  riskBadgeText:  { fontSize: 20, fontWeight: '800' },
  riskBadgeSi:    { fontSize: 12, color: '#555', marginTop: 2 },
  riskScore:      { fontSize: 13, color: '#666' },
  urgencyRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                    backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, marginBottom: 8 },
  urgencyIcon:    { marginTop: 1 },
  urgencyText:    { flex: 1, fontSize: 13, color: '#444', lineHeight: 19 },
  frequencyText:  { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 12 },
  wsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  wsChip:         { backgroundColor: '#F0F7FF', borderRadius: 10, paddingHorizontal: 10,
                    paddingVertical: 6, minWidth: 80, alignItems: 'center' },
  wsLabel:        { fontSize: 10, color: '#888' },
  wsValue:        { fontSize: 13, fontWeight: '700', color: '#1A3A5C' },
  bodyText:       { fontSize: 13, color: '#444', lineHeight: 20 },
  bodyTextSi:     { fontSize: 13, color: '#4A148C', lineHeight: 20, marginTop: 6 },
  modelTag:       { fontSize: 11, color: '#aaa', fontStyle: 'italic', marginTop: 8, textAlign: 'right' },
});
