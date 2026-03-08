import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import api from '../../../config/api';
import { GrowthStageMLResponse } from '../../../types';

const STAGE_ICONS: Record<string, string> = {
  a: '🌱',
  b: '🌿',
  c: '🌸',
  d: '🍈',
};

const STAGE_COLORS: Record<string, { bg: string; bgDark: string; text: string; textDark: string; border: string }> = {
  a: { bg: '#E8F5E9', bgDark: '#1A3A1A', text: '#2E7D32', textDark: '#66BB6A', border: '#4CAF50' },
  b: { bg: '#E3F2FD', bgDark: '#1A2A3A', text: '#1565C0', textDark: '#64B5F6', border: '#2196F3' },
  c: { bg: '#FFF3E0', bgDark: '#3A2A1A', text: '#E65100', textDark: '#FFA726', border: '#FF9800' },
  d: { bg: '#FCE4EC', bgDark: '#3A1A2A', text: '#880E4F', textDark: '#F48FB1', border: '#E91E63' },
};

export default function StageCheckScreen() {
  const { currentTheme, t, language } = useTheme();
  const colors = Colors[currentTheme];
  const isDark = currentTheme === 'dark';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const analyzeStage = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please take or select a photo first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'plant.jpg',
      } as any);
      formData.append('language', language);

      const response = await api.post<GrowthStageMLResponse>('/growth/stage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });

      router.push({
        pathname: '/growth/stage-result',
        params: { result: JSON.stringify(response.data), imageUri },
      });
    } catch (error: any) {
      console.error('Stage check error:', error);
      const msg =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to analyze growth stage. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>🌿 {t('growthStageCheck')}</Text>
          <Text style={[styles.subtitle, { color: colors.placeholder }]}>
            Take a clear photo of your papaya plant to detect its current growth stage and get personalised care guidance.
          </Text>
        </View>

        {/* Stage Overview Cards */}
        <View style={styles.stagesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 {t('growthStages')}</Text>
          <View style={styles.stageGrid}>
            {(['a', 'b', 'c', 'd'] as const).map((stage) => {
              const sc = STAGE_COLORS[stage];
              return (
                <View
                  key={stage}
                  style={[
                    styles.stageCard,
                    {
                      backgroundColor: isDark ? sc.bgDark : sc.bg,
                      borderLeftColor: sc.border,
                    },
                  ]}
                >
                  <Text style={styles.stageIcon}>{STAGE_ICONS[stage]}</Text>
                  <Text style={[styles.stageLabel, { color: isDark ? sc.textDark : sc.text }]}>
                    Stage {stage.toUpperCase()}
                  </Text>
                  <Text style={[styles.stageDesc, { color: isDark ? sc.textDark : sc.text }]}>
                    {t(('stage' + stage.toUpperCase() + 'Desc') as any)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Photo Instructions */}
        <View
          style={[
            styles.instructionBox,
            {
              backgroundColor: isDark ? '#1E2A3A' : '#EFF6FF',
              borderColor: colors.info,
            },
          ]}
        >
          <Text style={[styles.instructionTitle, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
            📸 {t('howToTakePhoto')}
          </Text>
          {[
            t('photoTip1'),
            t('photoTip2'),
            t('photoTip3'),
            t('photoTip4'),
            t('photoTip5'),
            t('photoTip6'),
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipBullet, { backgroundColor: colors.info }]}>
                <Text style={styles.tipBulletText}>{i + 1}</Text>
              </View>
              <Text style={[styles.tipText, { color: isDark ? '#93C5FD' : '#1E3A5F' }]}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Image Preview */}
        {imageUri ? (
          <View
            style={[
              styles.imageContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity
              style={[styles.changePhotoBtn, { backgroundColor: colors.primary }]}
              onPress={pickFromCamera}
            >
              <Text style={styles.changePhotoBtnText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickButtonsRow}>
            <TouchableOpacity
              style={[styles.pickButton, { backgroundColor: isDark ? '#1A2A3A' : '#E3F2FD', borderColor: colors.info }]}
              onPress={pickFromCamera}
            >
              <Text style={styles.pickButtonIcon}>📷</Text>
              <Text style={[styles.pickButtonLabel, { color: isDark ? '#64B5F6' : '#1565C0' }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickButton, { backgroundColor: isDark ? '#1A3A2A' : '#E8F5E9', borderColor: colors.success }]}
              onPress={pickFromGallery}
            >
              <Text style={styles.pickButtonIcon}>🖼️</Text>
              <Text style={[styles.pickButtonLabel, { color: isDark ? '#66BB6A' : '#2E7D32' }]}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analyze Button */}
        {imageUri && (
          <PrimaryButton
            title={loading ? 'Analyzing...' : t('analyzeStage')}
            onPress={analyzeStage}
            loading={loading}
            style={styles.analyzeBtn}
          />
        )}

        {/* Gallery option if camera already used */}
        {imageUri && (
          <PrimaryButton
            title="🖼️ Choose Different Photo"
            onPress={pickFromGallery}
            variant="secondary"
            style={styles.galleryBtn}
          />
        )}

        <PrimaryButton
          title={t('cancel')}
          onPress={() => router.back()}
          variant="outline"
          style={styles.cancelBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  stagesSection: {
    marginBottom: 20,
  },
  stageGrid: {
    gap: 8,
  },
  stageCard: {
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stageIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '700',
    width: 68,
    marginTop: 2,
  },
  stageDesc: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  instructionBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipBulletText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  pickButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  pickButtonIcon: {
    fontSize: 32,
  },
  pickButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  changePhotoBtn: {
    margin: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  changePhotoBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  analyzeBtn: {
    marginBottom: 12,
  },
  galleryBtn: {
    marginBottom: 12,
  },
  cancelBtn: {
    marginBottom: 24,
  },
});
