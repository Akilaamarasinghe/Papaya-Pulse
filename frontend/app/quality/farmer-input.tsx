import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { LabeledInput } from '../../components/shared/LabeledInput';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { Dropdown } from '../../components/shared/Dropdown';
import api from '../../config/api';
import { District, PapayaVariety, MaturityLevel, FarmerQualityRequest, FarmerQualityResponse } from '../../types';

export default function FarmerInputScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    district: user?.district || 'Galle' as District,
    variety: 'RedLady' as PapayaVariety,
    maturity: 'mature' as MaturityLevel,
    temperature: '',
    days_since_picked: '',
  });

  const districtOptions = [
    { label: 'Hambanthota', value: 'Hambanthota' as District },
    { label: 'Matara', value: 'Matara' as District },
    { label: 'Galle', value: 'Galle' as District },
  ];

  const varietyOptions = [
    { label: 'Red Lady', value: 'RedLady' as PapayaVariety },
    { label: 'Tenim', value: 'Tenim' as PapayaVariety },
    { label: 'Solo', value: 'Solo' as PapayaVariety },
  ];

  const maturityOptions = [
    { label: 'Unmature', value: 'unmature' as MaturityLevel },
    { label: 'Half-Mature', value: 'half-mature' as MaturityLevel },
    { label: 'Mature', value: 'mature' as MaturityLevel },
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera permission is required');
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

  const submitGrading = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please take a photo of damaged areas');
      return;
    }

    if (!formData.temperature || !formData.days_since_picked) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const temperature = parseFloat(formData.temperature);
    const daysSincePicked = parseInt(formData.days_since_picked);

    if (isNaN(temperature) || isNaN(daysSincePicked)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'papaya.jpg',
      } as any);
      formDataToSend.append('farmer_id', user?.uid || '');
      formDataToSend.append('district', formData.district);
      formDataToSend.append('variety', formData.variety);
      formDataToSend.append('maturity', formData.maturity);
      formDataToSend.append('temperature', temperature.toString());
      formDataToSend.append('days_since_picked', daysSincePicked.toString());

      const response = await api.post<FarmerQualityResponse>(
        '/quality/farmer',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      router.push({
        pathname: '/quality/farmer-result' as any,
        params: {
          data: JSON.stringify(response.data),
        },
      });
    } catch (error: any) {
      console.error('Quality grading error:', error);
      Alert.alert('Error', 'Failed to grade papaya quality. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Farmer Quality Grading</Text>
        <Text style={styles.subtitle}>Enter papaya details for grading</Text>
      </View>

      <Dropdown
        label="District"
        value={formData.district}
        options={districtOptions}
        onChange={(value) => setFormData({ ...formData, district: value })}
      />

      <Dropdown
        label="Variety"
        value={formData.variety}
        options={varietyOptions}
        onChange={(value) => setFormData({ ...formData, variety: value })}
      />

      <Dropdown
        label="Maturity Level"
        value={formData.maturity}
        options={maturityOptions}
        onChange={(value) => setFormData({ ...formData, maturity: value })}
      />

      <LabeledInput
        label="Temperature (°C)"
        value={formData.temperature}
        onChangeText={(text) => setFormData({ ...formData, temperature: text })}
        placeholder="e.g., 26"
        keyboardType="decimal-pad"
      />

      <LabeledInput
        label="Days Since Picked"
        value={formData.days_since_picked}
        onChangeText={(text) => setFormData({ ...formData, days_since_picked: text })}
        placeholder="e.g., 2"
        keyboardType="numeric"
      />

      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Damaged Areas Photo</Text>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      <PrimaryButton
        title={imageUri ? 'Retake Photo' : 'Take Photo of Damaged Areas'}
        onPress={pickImage}
        variant="secondary"
        style={styles.button}
      />

      <PrimaryButton
        title="Submit for Grading"
        onPress={submitGrading}
        loading={loading}
        disabled={!imageUri}
        style={styles.button}
      />

      <PrimaryButton
        title="Cancel"
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
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  button: {
    marginBottom: 16,
  },
});
