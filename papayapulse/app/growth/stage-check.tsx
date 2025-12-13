import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import api from '../../config/api';
import { GrowthStageResponse } from '../../types';

export default function StageCheckScreen() {
  const { currentTheme, t } = useTheme();
  const colors = Colors[currentTheme];
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const analyzeStage = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please take a photo first');
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

      const response = await api.post<GrowthStageResponse>('/growth/stage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Show results in an alert (you could navigate to a result screen instead)
      const { stage, advice } = response.data;
      Alert.alert(
        `Growth Stage: ${stage}`,
        advice.join('\n\n'),
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Stage check error:', error);
      Alert.alert('Error', 'Failed to analyze growth stage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('growthStageCheck')}</Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>{t('takePhoto')}</Text>
      </View>

      <View style={[styles.stageInfoBox, { 
        backgroundColor: currentTheme === 'dark' ? '#1A2A3A' : '#E3F2FD',
        borderLeftColor: colors.primary,
      }]}>
        <Text style={[styles.stageInfoTitle, { color: currentTheme === 'dark' ? '#64B5F6' : '#1976D2' }]}>🌱 {t('growthStages')}</Text>
        <Text style={[styles.stageText, { color: currentTheme === 'dark' ? '#90CAF9' : '#0D47A1' }]}>• <Text style={{ fontWeight: 'bold' }}>Stage A:</Text> {t('stageADesc')}</Text>
        <Text style={[styles.stageText, { color: currentTheme === 'dark' ? '#90CAF9' : '#0D47A1' }]}>• <Text style={{ fontWeight: 'bold' }}>Stage B:</Text> {t('stageBDesc')}</Text>
        <Text style={[styles.stageText, { color: currentTheme === 'dark' ? '#90CAF9' : '#0D47A1' }]}>• <Text style={{ fontWeight: 'bold' }}>Stage C:</Text> {t('stageCDesc')}</Text>
        <Text style={[styles.stageText, { color: currentTheme === 'dark' ? '#90CAF9' : '#0D47A1' }]}>• <Text style={{ fontWeight: 'bold' }}>Stage D:</Text> {t('stageDDesc')}</Text>
      </View>

      <View style={[styles.instructionBox, { 
        backgroundColor: currentTheme === 'dark' ? '#1A3A1A' : '#E8F5E9',
        borderLeftColor: colors.success,
      }]}>
        <Text style={[styles.instructionTitle, { color: currentTheme === 'dark' ? '#66BB6A' : '#2E7D32' }]}>📸 {t('photoInstructions')}</Text>
        <Text style={[styles.instructionText, { color: currentTheme === 'dark' ? '#81C784' : '#1B5E20' }]}>• {t('instruction1')}</Text>
        <Text style={[styles.instructionText, { color: currentTheme === 'dark' ? '#81C784' : '#1B5E20' }]}>• {t('instruction2')}</Text>
        <Text style={[styles.instructionText, { color: currentTheme === 'dark' ? '#81C784' : '#1B5E20' }]}>• {t('instruction3')}</Text>
        <Text style={[styles.instructionText, { color: currentTheme === 'dark' ? '#81C784' : '#1B5E20' }]}>• {t('instruction4')}</Text>
        <Text style={[styles.instructionText, { color: currentTheme === 'dark' ? '#81C784' : '#1B5E20' }]}>• {t('instruction5')}</Text>
      </View>

      {imageUri && (
        <View style={[styles.imageContainer, { backgroundColor: colors.card }]}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      <PrimaryButton
        title={imageUri ? t('retake') : t('openCameraTakePhoto')}
        onPress={pickImage}
        variant="secondary"
        style={styles.button}
      />

      {imageUri && (
        <PrimaryButton
          title={t('analyzeStage')}
          onPress={analyzeStage}
          loading={loading}
          style={styles.button}
        />
      )}

      <PrimaryButton
        title={t('cancel')}
        onPress={() => router.back()}
        variant="outline"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  stageInfoBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  stageInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stageText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  instructionBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  imageContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  button: {
    marginBottom: 16,
  },
});
