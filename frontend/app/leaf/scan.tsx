import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import api from '../../config/api';
import { LeafDiseaseResponse, LeafPredictionHistory } from '../../types';

const HISTORY_KEY = 'leaf_disease_history';

export default function LeafScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const savePredictionToHistory = async (prediction: LeafDiseaseResponse, imageUri: string) => {
    try {
      const historyItem: LeafPredictionHistory = {
        ...prediction,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageUri,
      };

      const existingHistory = await AsyncStorage.getItem(HISTORY_KEY);
      const history: LeafPredictionHistory[] = existingHistory 
        ? JSON.parse(existingHistory) 
        : [];
      
      history.unshift(historyItem);
      
      // Keep only last 50 predictions
      const limitedHistory = history.slice(0, 50);
      
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const analyzeDisease = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please take a photo first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'leaf.jpg');
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'leaf.jpg',
        } as any);
      }

      const response = await api.post<LeafDiseaseResponse>('/leaf/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Save to history
      await savePredictionToHistory(response.data, imageUri);

      // Navigate to result
      router.push({
        pathname: '/leaf/result' as any,
        params: {
          data: JSON.stringify(response.data),
        },
      });
    } catch (error: any) {
      console.error('Disease analysis error:', error);
      Alert.alert('Error', 'Failed to analyze leaf disease. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Leaf</Text>
        <Text style={styles.subtitle}>Take a photo of the papaya leaf</Text>
      </View>

      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      <PrimaryButton
        title={imageUri ? 'Retake Photo' : 'Open Camera & Take Photo'}
        onPress={pickImage}
        variant="secondary"
        style={styles.button}
      />

      <PrimaryButton
        title="Upload Existing Photo"
        onPress={pickFromGallery}
        variant="secondary"
        style={styles.button}
      />

      {imageUri && (
        <PrimaryButton
          title="Analyze Disease"
          onPress={analyzeDisease}
          loading={loading}
          style={styles.button}
        />
      )}

      <PrimaryButton
        title="Cancel"
        onPress={() => router.back()}
        variant="outline"
      />

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>📷 Tips for Best Results</Text>
        <Text style={styles.tipText}>• Use good lighting</Text>
        <Text style={styles.tipText}>• Focus on diseased area</Text>
        <Text style={styles.tipText}>• Keep leaf flat and clear</Text>
        <Text style={styles.tipText}>• Avoid shadows</Text>
      </View>
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
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  button: {
    marginBottom: 16,
  },
  tipBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});
