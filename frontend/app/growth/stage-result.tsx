import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { GrowthStageMLResponse } from '../../types';

// Stage color palette
const STAGE_PALETTE: Record<string, { bg: string; bgDark: string; accent: string; accentDark: string; border: string }> = {
  a: { bg: '#E8F5E9', bgDark: '#183018', accent: '#2E7D32', accentDark: '#66BB6A', border: '#4CAF50' },
  b: { bg: '#E3F2FD', bgDark: '#182030', accent: '#1565C0', accentDark: '#64B5F6', border: '#2196F3' },
  c: { bg: '#FFF3E0', bgDark: '#302018', accent: '#E65100', accentDark: '#FFA726', border: '#FF9800' },
  d: { bg: '#FCE4EC', bgDark: '#301828', accent: '#880E4F', accentDark: '#F48FB1', border: '#E91E63' },
};

const STAGE_ICONS: Record<string, string> = { a: '🌱', b: '🌿', c: '🌸', d: '🍈' };

function SectionCard({
  title,
  color,
  borderColor,
  children,
}: {
  title: string;
  color: string;
  borderColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { borderLeftColor: borderColor }]}>
      <Text style={[styles.sectionCardTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, labelColor, valueColor }: { label: string; value: string; labelColor: string; valueColor: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export default function StageResultScreen() {
  const { currentTheme, t, language } = useTheme();
  const isSinhala = language === 'si';
  const colors = Colors[currentTheme];
  const isDark = currentTheme === 'dark';
  const params = useLocalSearchParams<{ result: string; imageUri: string }>();

  let mlResult: GrowthStageMLResponse | null = null;
  try {
    mlResult = JSON.parse(params.result || '{}');
  } catch {
    mlResult = null;
  }

  const imageUri = params.imageUri;

  if (!mlResult) {
    return (
      <ScreenContainer>
        <Text style={{ color: colors.error, textAlign: 'center', marginTop: 40 }}>
          Unable to load result. Please try again.
        </Text>
        <PrimaryButton title="Go Back" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  // ── Not a papaya ──────────────────────────────────
  if (!mlResult.is_papaya) {
    const val = mlResult.papaya_validation;
    return (
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.topImage} />
          ) : null}

          <View
            style={[
              styles.notPapayaBanner,
              { backgroundColor: isDark ? '#3A1A1A' : '#FFEBEE', borderColor: colors.error },
            ]}
          >
            <Text style={styles.notPapayaIcon}>❌</Text>
            <Text style={[styles.notPapayaTitle, { color: colors.error }]}>{t('notPapaya')}</Text>
            <Text style={[styles.notPapayaDesc, { color: isDark ? '#EF9A9A' : '#B71C1C' }]}>
              {t('notPapayaDesc')}
            </Text>
          </View>

          {/* Validation detail */}
          <View
            style={[
              styles.sectionCard,
              { borderLeftColor: colors.error, backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
            ]}
          >
            <Text style={[styles.sectionCardTitle, { color: colors.error }]}>
              📊 {t('papayaValidation')}
            </Text>
            <View style={styles.confidenceRow}>
              <Text style={[styles.confidenceLabel, { color: colors.placeholder }]}>
                Non-Papaya
              </Text>
              <Text style={[styles.confidenceValue, { color: colors.error }]}>
                {val.probabilities['non_papaya'] ?? 0}%
              </Text>
            </View>
            <View style={styles.confidenceRow}>
              <Text style={[styles.confidenceLabel, { color: colors.placeholder }]}>Papaya</Text>
              <Text style={[styles.confidenceValue, { color: colors.success }]}>
                {val.probabilities['papaya'] ?? 0}% (needs ≥ {val.threshold_required}%)
              </Text>
            </View>
          </View>

          <PrimaryButton
            title={t('analyzeAnother')}
            onPress={() => router.replace('/growth/stage-check')}
            style={{ marginTop: 16, marginBottom: 12 }}
          />
          <PrimaryButton
            title={t('cancel')}
            onPress={() => router.push('/growth')}
            variant="outline"
            style={{ marginBottom: 24 }}
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Papaya detected ───────────────────────────────
  const grade = mlResult.grade_prediction;
  const guidance = mlResult.growth_guidance;
  const stageCode = grade?.grade?.toLowerCase() ?? 'a';

  // Helper: pick Sinhala field if available and language is Sinhala
  const si = <T,>(siVal: T | undefined, enVal: T): T =>
    isSinhala && siVal !== undefined ? siVal : enVal;
  const palette = STAGE_PALETTE[stageCode] ?? STAGE_PALETTE['a'];
  const stageIcon = STAGE_ICONS[stageCode] ?? '🌱';
  const accentColor = isDark ? palette.accentDark : palette.accent;
  const bgColor = isDark ? palette.bgDark : palette.bg;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Analysed Image */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.topImage} />
        ) : null}

        {/* ── Validation Badge ── */}
        <View
          style={[
            styles.validationBadge,
            { backgroundColor: isDark ? '#183018' : '#E8F5E9', borderColor: colors.success },
          ]}
        >
          <Text style={styles.validationIcon}>✅</Text>
          <View style={styles.validationText}>
            <Text style={[styles.validationTitle, { color: colors.success }]}>
              {t('validationPassed')}
            </Text>
            <Text style={[styles.validationSub, { color: isDark ? '#A5D6A7' : '#2E7D32' }]}>
              Papaya confidence: {mlResult.papaya_validation.confidence}%
            </Text>
          </View>
        </View>

        {/* ── Detected Stage Hero ── */}
        {grade && (
          <View style={[styles.stageHero, { backgroundColor: bgColor, borderColor: palette.border }]}>
            <Text style={styles.stageHeroIcon}>{stageIcon}</Text>
            <View style={styles.stageHeroText}>
              <Text style={[styles.stageHeroLabel, { color: accentColor }]}>
                {t('detectedStage')}
              </Text>
              <Text style={[styles.stageHeroName, { color: accentColor }]}>
                {si(guidance?.current_stage?.name_si, guidance?.current_stage?.name) ?? `Stage ${grade.grade.toUpperCase()}`}
              </Text>
              <View style={styles.confidencePill}>
                <Text style={[styles.confidencePillText, { backgroundColor: palette.border, color: '#fff' }]}>
                  {t('confidence')}: {grade.confidence}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Stage Probabilities ── */}
        {grade && (
          <SectionCard title="📊 Stage Probabilities" color={accentColor} borderColor={palette.border}>
            {Object.entries(grade.probabilities).map(([key, val]) => (
              <View key={key} style={styles.probRow}>
                <Text style={[styles.probLabel, { color: colors.text }]}>
                  {STAGE_ICONS[key] ?? ''} Stage {key.toUpperCase()}
                </Text>
                <View style={styles.probBarContainer}>
                  <View
                    style={[
                      styles.probBar,
                      {
                        width: `${Math.min(val, 100)}%`,
                        backgroundColor: key === stageCode ? palette.border : (isDark ? '#374151' : '#D1D5DB'),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.probValue, { color: colors.text }]}>{val}%</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── Stage Characteristics ── */}
        {guidance?.current_stage && (
          <SectionCard title={`🔍 ${t('stageCharacteristics')}`} color={accentColor} borderColor={palette.border}>
            <InfoRow
              label={`📏 ${t('height')}`}
              value={si(guidance.current_stage.height_si, guidance.current_stage.height)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
            <InfoRow
              label={`⏱ ${t('duration')}`}
              value={si(guidance.current_stage.duration_si, guidance.current_stage.duration)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
            <Text style={[styles.characteristicsText, { color: colors.text }]}>
              {si(guidance.current_stage.characteristics_si, guidance.current_stage.characteristics)}
            </Text>
          </SectionCard>
        )}

        {/* ── Care Instructions ── */}
        {guidance?.care_instructions && (
          <SectionCard title={`🌿 ${t('careInstructions')}`} color={accentColor} borderColor={palette.border}>
            <InfoRow
              label={`💧 ${t('watering')}`}
              value={si(guidance.care_instructions.watering_si, guidance.care_instructions.watering)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
            <InfoRow
              label={`🌾 ${t('fertilizer')}`}
              value={si(guidance.care_instructions.fertilizer_si, guidance.care_instructions.fertilizer)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
            <InfoRow
              label={`🪱 ${t('soilCare')}`}
              value={si(guidance.care_instructions.soil_si, guidance.care_instructions.soil)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
            <InfoRow
              label={`🛡️ ${t('protection')}`}
              value={si(guidance.care_instructions.protection_si, guidance.care_instructions.protection)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
          </SectionCard>
        )}

        {/* ── Transition Guide ── */}
        {guidance?.transition_guide && (
          <SectionCard title={`🚀 ${t('transitionGuide')}`} color={accentColor} borderColor={palette.border}>
            <InfoRow
              label={`🎯 ${t('nextStage')}`}
              value={si(guidance.transition_guide.next_stage_si, guidance.transition_guide.next_stage)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
            <InfoRow
              label={`👁 ${t('signsToWatch')}`}
              value={si(guidance.transition_guide.signs_to_watch_si, guidance.transition_guide.signs_to_watch)}
              labelColor={colors.placeholder}
              valueColor={colors.text}
            />
            <Text style={[styles.transitionFocus, { color: accentColor }]}>{t('transitionFocus')}</Text>
            <Text style={[styles.transitionFocusText, { color: colors.text }]}>
              {si(guidance.transition_guide.transition_focus_si, guidance.transition_guide.transition_focus)}
            </Text>
          </SectionCard>
        )}

        {/* ── Expert Guidance ── */}
        {guidance?.expert_guidance &&
          !guidance.expert_guidance.toLowerCase().includes('unable') && (
            <SectionCard title={`💡 ${t('expertGuidance')}`} color={isDark ? '#C084FC' : '#7E22CE'} borderColor={isDark ? '#9333EA' : '#7E22CE'}>
              <Text style={[styles.expertText, { color: colors.text }]}>{guidance.expert_guidance}</Text>
            </SectionCard>
          )}

        {/* Actions */}
        <PrimaryButton
          title={t('analyzeAnother')}
          onPress={() => router.replace('/growth/stage-check')}
          style={{ marginTop: 8, marginBottom: 12 }}
        />
        <PrimaryButton
          title={t('cancel')}
          onPress={() => router.push('/growth')}
          variant="outline"
          style={{ marginBottom: 32 }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  notPapayaBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  notPapayaIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  notPapayaTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  notPapayaDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  validationIcon: { fontSize: 24 },
  validationText: { flex: 1 },
  validationTitle: { fontSize: 14, fontWeight: '700' },
  validationSub: { fontSize: 12, marginTop: 2 },
  stageHero: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stageHeroIcon: { fontSize: 52 },
  stageHeroText: { flex: 1 },
  stageHeroLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  stageHeroName: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  confidencePill: { marginTop: 8 },
  confidencePillText: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  sectionCard: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  characteristicsText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  probLabel: {
    fontSize: 13,
    width: 80,
    fontWeight: '500',
  },
  probBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  probBar: {
    height: 8,
    borderRadius: 4,
  },
  probValue: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
    fontWeight: '600',
  },
  transitionFocus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  transitionFocusText: {
    fontSize: 13,
    lineHeight: 19,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  confidenceLabel: {
    fontSize: 13,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  expertText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
