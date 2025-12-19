import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { LabeledInput } from '../../components/shared/LabeledInput';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import api from '../../config/api';
import { CustomerQualityResponse } from '../../types';

export default function CustomerInputScreen() {
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [weight, setWeight] = useState('');

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
      Alert.alert('Error', 'Please take a photo of the papaya');
      return;
    }

    if (!weight) {
      Alert.alert('Error', 'Please enter the weight');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'papaya.jpg',
      } as any);
      formData.append('weight', weightNum.toString());

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
      Alert.alert('Error', 'Failed to check papaya quality. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Quality Check</Text>
        <Text style={styles.subtitle}>Check papaya quality before buying</Text>
      </View>

      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Papaya Photo</Text>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      <PrimaryButton
        title={imageUri ? 'Retake Photo' : 'Take Photo of Papaya'}
        onPress={pickImage}
        variant="secondary"
        style={styles.button}
      />

      <LabeledInput
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        placeholder="e.g., 1.5"
        keyboardType="decimal-pad"
      />

      <PrimaryButton
        title="Check Quality"
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
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  button: {
    marginBottom: 16,
  },
});
