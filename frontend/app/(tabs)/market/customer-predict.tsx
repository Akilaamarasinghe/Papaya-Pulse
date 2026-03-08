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
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { ScreenContainer } from '../../../components/shared/ScreenContainer';
import { LabeledInput } from '../../../components/shared/LabeledInput';
import { PrimaryButton } from '../../../components/shared/PrimaryButton';
import { Dropdown } from '../../../components/shared/Dropdown';
import api from '../../../config/api';
import { District, CustomerMarketResponse } from '../../../types';

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

  /* ΓöÇΓöÇ Image picker ΓöÇΓöÇ */
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
        language === 'si' ? 'α╢àα╖Çα╖âα╢╗α╢║ α╢àα╖Çα╖üα╖èΓÇìα╢║α╢║' : 'Permission Required',
        language === 'si'
          ? 'α╢Üα╖Éα╢╕α╢╗α╖Å α╢àα╖Çα╖âα╢╗α╢║ α╢àα╖Çα╖üα╖èΓÇìα╢║ α╖Çα╖Ü'
          : 'Camera permission is required to take a photo'
      );
      return;
    }

    Alert.alert(
      language === 'si' ? 'α╢íα╖Åα╢║α╖Åα╢╗α╖ûα╢┤ α╢ïα╢┤α╢»α╖Öα╖âα╖è' : 'Photo Instructions',
      language === 'si'
        ? 'α╖âα╢╕α╖èα╢┤α╖ûα╢╗α╖èα╢½ α╢┤α╖Éα╢┤α╖£α╢╜α╖è α╢╡α╢╜α╢║ α╢┤α╖Öα╢▒α╖Öα╢▒ α╢┤α╢╗α╖Æα╢»α╖Æ, α╖äα╖£α╢│ α╢åα╢╜α╖¥α╢Üα╢║α╢Üα╖Æα╢▒α╖è α╢íα╖Åα╢║α╖Åα╢╗α╖ûα╢┤ α╢£α╢▒α╖èα╢▒.'
        : 'Take a clear photo showing the FULL papaya with good lighting.',
      [
        {
          text: language === 'si' ? 'α╖äα╢╗α╖Æ' : 'OK, Got it',
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

  /* ΓöÇΓöÇ Submit ΓöÇΓöÇ */
  const submit = async () => {
    if (!imageUri) {
      Alert.alert(
        language === 'si' ? 'α╢»α╖¥α╖éα╢║α╢Üα╖Æ' : 'Error',
        language === 'si' ? 'α╢Üα╢╗α╖öα╢½α╖Åα╢Üα╢╗ α╢íα╖Åα╢║α╖Åα╢╗α╖ûα╢┤α╢║α╢Üα╖è α╢£α╢▒α╖èα╢▒' : 'Please take a photo of the papaya'
      );
      return;
    }
    if (!city) {
      Alert.alert(
        language === 'si' ? 'α╢»α╖¥α╖éα╢║α╢Üα╖Æ' : 'Error',
        language === 'si' ? 'α╢Üα╢╗α╖öα╢½α╖Åα╢Üα╢╗ α╢»α╖Æα╖âα╖èα╢¡α╖èΓÇìα╢╗α╖Æα╢Üα╖èα╢Üα╢║ α╢¡α╖¥α╢╗α╢▒α╖èα╢▒' : 'Please select a district'
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
      formData.append('language', language);

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
          ? 'α╖Çα╖Æα╖üα╖èα╢╜α╖Üα╖éα╢½α╢║ α╢àα╖âα╖Åα╢╗α╖èα╢«α╢Ü α╖Çα╖Æα╢║. α╢▒α╖Éα╖Çα╢¡ α╢ïα╢¡α╖èα╖âα╖Åα╖ä α╢Üα╢╗α╢▒α╖èα╢▒.'
          : 'Failed to analyse papaya. Please try again.');
      Alert.alert(language === 'si' ? 'α╢»α╖¥α╖éα╢║α╢Üα╖Æ' : 'Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'si' ? 'α╢┤α╖Éα╢┤α╖£α╢╜α╖è α╖âα╖èα╢Üα╖æα╢▒α╖è α╢Üα╢╗α╢▒α╖èα╢▒' : 'Scan Papaya'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'si'
            ? 'α╖üα╖ôα╢╗α╖èα╖éα╢¡α╖èα╖Çα╢║, α╢╕α╖Æα╢╜ α╖âα╖ä α╖Çα╖Öα╖àα╢│α╢┤α╢╜ α╢ïα╢┤α╢»α╖Öα╖âα╖è α╢╜α╢╢α╖Å α╢£α╢▒α╖èα╢▒'
            : 'Get ripeness, price estimate & market advice'}
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionTitle}>
          ≡ƒô╕ {language === 'si' ? 'α╢íα╖Åα╢║α╖Åα╢╗α╖ûα╢┤ α╢ïα╢┤α╢»α╖Öα╖âα╖è:' : 'Photo Instructions:'}
        </Text>
        <Text style={styles.instructionText}>
          {language === 'si'
            ? `ΓÇó α╖âα╢╕α╖èα╢┤α╖ûα╢╗α╖èα╢½ α╢┤α╖Éα╢┤α╖£α╢╜α╖è α╢╡α╢╜α╢║ α╢┤α╖Öα╢▒α╖Öα╢▒ α╢╜α╖Öα╖â α╢£α╢▒α╖èα╢▒\nΓÇó α╖äα╖£α╢│ α╢åα╢╜α╖¥α╢Üα╢║ α╖âα╖äα╖Æα╢¡α╖Ç\nΓÇó α╢╡α╢╜α╢║ α╢Üα╖Åα╢╕α╢╗α╢║α╖Ü α╢£α╖Öα╢╜α╖è α╢Üα╢╗α╢▒α╖èα╢▒\nΓÇó α╢┤α╖âα╖öα╢╢α╖Æα╢╕ α╖âα╢╗α╢╜ α╢Üα╢╗α╢▒α╖èα╢▒`
            : `ΓÇó Show the FULL papaya (entire fruit visible)\nΓÇó Ensure good lighting\nΓÇó Keep the fruit in centre\nΓÇó Use a plain background`}
        </Text>
      </View>

      {/* Image preview */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>
            {language === 'si' ? 'α╢íα╖Åα╢║α╖Åα╢╗α╖ûα╢┤α╢║' : 'Papaya Photo'}
          </Text>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>
      )}

      <PrimaryButton
        title={
          imageUri
            ? (language === 'si' ? 'α╢▒α╖Éα╖Çα╢¡ α╢£α╢▒α╖èα╢▒' : 'Retake Photo')
            : Platform.OS === 'web'
            ? (language === 'si' ? 'α╢íα╖Åα╢║α╖Åα╢╗α╖ûα╢┤α╢║ α╢¡α╖¥α╢╗α╢▒α╖èα╢▒' : 'Choose Photo')
            : (language === 'si' ? 'α╢íα╖Åα╢║α╖Åα╢╗α╖ûα╢┤ α╢£α╢▒α╖èα╢▒' : 'Take Photo')
        }
        onPress={pickImage}
        variant="secondary"
        style={styles.photoButton}
      />

      {/* District */}
      <Dropdown
        label={language === 'si' ? 'α╢»α╖Æα╖âα╖èα╢¡α╖èΓÇìα╢╗α╖Æα╢Üα╖èα╢Üα╢║' : 'District'}
        value={city}
        options={districtOptions}
        onChange={(val) => setCity(val as District)}
      />

      {/* Optional seller price */}
      <LabeledInput
        label={
          language === 'si'
            ? 'α╢àα╢╜α╖Öα╖Çα╖Æα╢Üα╢╗α╖ö α╢ëα╢╜α╖èα╢╜α╢▒ α╢╕α╖Æα╢╜ (LKR/kg) ΓÇô α╖Çα╖Æα╢Üα╢╜α╖èα╢┤'
            : 'Seller Asking Price (LKR/kg) ΓÇô Optional'
        }
        value={sellerPrice}
        onChangeText={setSellerPrice}
        placeholder={language === 'si' ? 'α╢ïα╢»α╖Å: 80' : 'e.g. 80'}
        keyboardType="decimal-pad"
      />

      <PrimaryButton
        title={
          loading
            ? (language === 'si' ? 'α╖Çα╖Æα╖üα╖èα╢╜α╖Üα╖éα╢½α╢║ α╢Üα╢╗α╢╕α╖Æα╢▒α╖è...' : 'Analysing...')
            : (language === 'si' ? 'α╖Çα╖Æα╖üα╖èα╢╜α╖Üα╖éα╢½α╢║ α╢åα╢╗α╢╕α╖èα╢╖ α╢Üα╢╗α╢▒α╖èα╢▒' : 'Analyse Papaya')
        }
        onPress={submit}
        loading={loading}
        style={styles.submitButton}
      />

      <PrimaryButton
        title={language === 'si' ? 'α╢àα╖Çα╢╜α╢éα╢£α╖ö α╢Üα╢╗α╢▒α╖èα╢▒' : 'Cancel'}
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
