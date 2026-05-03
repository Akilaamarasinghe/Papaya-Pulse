import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, Platform, ActionSheetIOS } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Dropdown } from '../../components/shared/Dropdown';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import api from '../../config/api';
import { CustomerQualityResponse } from '../../types';

const cityOptions = [
  { label: 'Galle', value: 'Galle' },
  { label: 'Matara', value: 'Matara' },
  { label: 'Hambanthota', value: 'Hambanthota' },
];

export default function CustomerInputScreen() { 
  const { user } = useAuth();
  const { t, language } = useTheme();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [city, setCity] = useState<string>(user?.district || 'Galle');

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('permissionRequired') || 'Permission Required', t('galleryPermission') || 'Gallery permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('permissionRequired') || 'Permission Required', t('cameraPermission') || 'Camera permission is required');
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

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('cancel') || 'Cancel',
            t('chooseFromGallery') || 'Choose from Gallery',
            t('openCamera') || 'Open Camera',
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) openGallery();
          else if (buttonIndex === 2) openCamera();
        }
      );
    } else {
      // Android
      Alert.alert(
        t('papayaPhotoLabel') || 'Select Photo',
        undefined,
        [
          { text: t('chooseFromGallery') || 'Choose from Gallery', onPress: openGallery },
          { text: t('openCamera') || 'Open Camera', onPress: openCamera },
          { text: t('cancel') || 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const submitGrading = async () => {
    if (!imageUri) {
      Alert.alert(t('error'), t('pleaseTakePhoto') || 'Please take a photo of the papaya');
      return;
    }

    if (!city || !city.trim()) {
      Alert.alert(t('error'), t('pleaseEnterCity') || 'Please enter a city or district');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Handle file differently for web and mobile
      if (Platform.OS === 'web') {
        // For web, fetch the image as blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'papaya.jpg');
      } else {
        // For mobile, use the native format
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'papaya.jpg',
        } as any);
      }
      
      formData.append('city', city.trim());
      formData.append('lang', language);

      const response = await api.post<CustomerQualityResponse>(
        '/quality/customer',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      router.push({
        pathname: '/quality/customer-result' as any,
        params: {
          data: JSON.stringify(response.data),
        },
      });
    } catch (error: any) {
      console.error('Quality check error:', error);
      const errorData = error?.response?.data || {};
      const errorMessage = String(errorData?.message || errorData?.error || '').toLowerCase();
      const isNotPapaya = errorData?.is_papaya === false || errorMessage.includes('not a papaya');

      if (isNotPapaya) {
        router.push({
          pathname: '/quality/customer-result' as any,
          params: {
            data: JSON.stringify({
              is_papaya: false,
              message: errorData?.message || 'Not a papaya',
              papaya_probability: errorData?.papaya_prob || errorData?.papaya_probability,
              not_papaya_probability: errorData?.not_papaya_prob || errorData?.not_papaya_probability,
              city: city.trim(),
            }),
          },
        });
      } else {
        Alert.alert(t('error'), errorData?.error || 'Failed to check papaya quality. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t('customerQualityCheck')}</Text>
        <Text style={styles.subtitle}>{t('qualityCheckDesc')}</Text>
      </View>

      <View style={styles.instructionBox}>
        <Text style={styles.instructionTitle}>{t('photoInstructionsTitle')}</Text>
        <Text style={styles.instructionText}>
          {'• '}{t('showFullPapaya')}{'\n'}
          {'• '}{t('ensureGoodLightingHint')}{'\n'}
          {'• '}{t('captureFromClearAngle')}{'\n'}
          {'• '}{t('includeWholePapayaInFrame')}
        </Text>
      </View>

      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>{t('papayaPhotoLabel')}</Text>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      <PrimaryButton
        title={imageUri ? t('retake') : t('choosePhotoFullPapaya')}
        onPress={pickImage}
        variant="secondary"
        style={styles.button}
      />

      <Dropdown
        label={t('cityDistrict')}
        value={city}
        options={cityOptions}
        onChange={setCity}
        placeholder={t('selectCity')}
      />

      <PrimaryButton
        title={t('checkQualityTastePrediction')}
        onPress={submitGrading}
        loading={loading}
        disabled={!imageUri}
        style={styles.button}
      />

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
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  instructionBox: {
    backgroundColor: '#E6F4FE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 1500,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  button: {
    marginBottom: 16,
  },
});
