import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { LabeledInput } from '../../components/shared/LabeledInput';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { Dropdown } from '../../components/shared/Dropdown';
import api from '../../config/api';
import { District, CustomerMarketResponse } from '../../types';

export default function CustomerPredictScreen() {
  const { user } = useAuth();
  const { language } = useTheme();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [city, setCity] = useState<District>(user?.district || 'Galle');
  const [sellerPrice, setSellerPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const districtOptions = [
    { label: 'Hambanthota', value: 'Hambanthota' as District },
    { label: 'Matara', value: 'Matara' as District },
    { label: 'Galle', value: 'Galle' as District },
  ];

  /* ── Image picker ── */
  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
      return;
    }

    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        language === 'si' ? 'අවසරය අවශ්‍යය' : 'Permission Required',
        language === 'si'
          ? 'කැමරා අවසරය අවශ්‍ය වේ'
          : 'Camera permission is required to take a photo'
      );
      return;
    }

    Alert.alert(
      language === 'si' ? 'ඡායාරූප උපදෙස්' : 'Photo Instructions',
      language === 'si'
        ? 'සම්පූර්ණ පැපොල් ඵලය පෙනෙන පරිදි, හොඳ ආලෝකයකින් ඡායාරූප ගන්න.'
        : 'Take a clear photo showing the FULL papaya with good lighting.',
      [
        {
          text: language === 'si' ? 'හරි' : 'OK, Got it',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled) setImageUri(result.assets[0].uri);
          },
        },
      ]
    );
  };

  /* ── Submit ── */
  const submit = async () => {
    if (!imageUri) {
      Alert.alert(
        language === 'si' ? 'දෝෂයකි' : 'Error',
        language === 'si' ? 'කරුණාකර ඡායාරූපයක් ගන්න' : 'Please take a photo of the papaya'
      );
      return;
    }
    if (!city) {
      Alert.alert(
        language === 'si' ? 'දෝෂයකි' : 'Error',
        language === 'si' ? 'කරුණාකර දිස්ත්‍රික්කය තෝරන්න' : 'Please select a district'
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        formData.append('file', blob, 'papaya.jpg');
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'papaya.jpg',
        } as any);
      }

      formData.append('city', city);
      if (sellerPrice.trim()) {
        formData.append('seller_price', sellerPrice.trim());
      }

      const response = await api.post<CustomerMarketResponse>(
        '/market/customer-predict',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      router.push({
        pathname: '/market/customer-result' as any,
        params: { data: JSON.stringify(response.data) },
      });
    } catch (error: any) {
      console.error('Customer market predict error:', error);
      const msg =
        error?.response?.data?.error ||
        (language === 'si'
          ? 'විශ්ලේෂණය අසාර්ථක විය. නැවත උත්සාහ කරන්න.'
          : 'Failed to analyse papaya. Please try again.');
      Alert.alert(language === 'si' ? 'දෝෂයකි' : 'Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'si' ? 'පැපොල් ස්කෑන් කරන්න' : 'Scan Papaya'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'si'
            ? 'ශීර්ෂත්වය, මිල සහ වෙළඳපල උපදෙස් ලබා ගන්න'
            : 'Get ripeness, price estimate & market advice'}
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionTitle}>
          📸 {language === 'si' ? 'ඡායාරූප උපදෙස්:' : 'Photo Instructions:'}
        </Text>
        <Text style={styles.instructionText}>
          {language === 'si'
            ? `• සම්පූර්ණ පැපොල් ඵලය පෙනෙන ලෙස ගන්න\n• හොඳ ආලෝකය සහිතව\n• ඵලය කාමරයේ ගෙල් කරන්න\n• පසුබිම සරල කරන්න`
            : `• Show the FULL papaya (entire fruit visible)\n• Ensure good lighting\n• Keep the fruit in centre\n• Use a plain background`}
        </Text>
      </View>

      {/* Image preview */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>
            {language === 'si' ? 'ඡායාරූපය' : 'Papaya Photo'}
          </Text>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>
      )}

      <PrimaryButton
        title={
          imageUri
            ? (language === 'si' ? 'නැවත ගන්න' : 'Retake Photo')
            : Platform.OS === 'web'
            ? (language === 'si' ? 'ඡායාරූපය තෝරන්න' : 'Choose Photo')
            : (language === 'si' ? 'ඡායාරූප ගන්න' : 'Take Photo')
        }
        onPress={pickImage}
        variant="secondary"
        style={styles.photoButton}
      />

      {/* District */}
      <Dropdown
        label={language === 'si' ? 'දිස්ත්‍රික්කය' : 'District'}
        value={city}
        options={districtOptions}
        onChange={(val) => setCity(val as District)}
      />

      {/* Optional seller price */}
      <LabeledInput
        label={
          language === 'si'
            ? 'අලෙවිකරු ඉල්ලන මිල (LKR/kg) – විකල්ප'
            : 'Seller Asking Price (LKR/kg) – Optional'
        }
        value={sellerPrice}
        onChangeText={setSellerPrice}
        placeholder={language === 'si' ? 'උදා: 80' : 'e.g. 80'}
        keyboardType="decimal-pad"
      />

      <PrimaryButton
        title={
          loading
            ? (language === 'si' ? 'විශ්ලේෂණය කරමින්...' : 'Analysing...')
            : (language === 'si' ? 'විශ්ලේෂණය ආරම්භ කරන්න' : 'Analyse Papaya')
        }
        onPress={submit}
        loading={loading}
        style={styles.submitButton}
      />

      <PrimaryButton
        title={language === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
        onPress={() => router.back()}
        variant="outline"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
  },
  instructionBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  imageContainer: {
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  photoButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 12,
  },
});
