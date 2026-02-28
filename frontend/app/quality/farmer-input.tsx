import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { LabeledInput } from '../../components/shared/LabeledInput';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { Dropdown } from '../../components/shared/Dropdown';
import api from '../../config/api';
import { District, PapayaVariety, MaturityLevel, QualityCategory, FarmerQualityRequest, FarmerQualityResponse } from '../../types';

export default function FarmerInputScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const category = (params.category as string) || 'best'; // 'best' or 'factory'
  const qualityCategory: QualityCategory = category === 'best' ? 'Best Quality' : 'factory outlet';
  
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    district: '' as District,
    variety: '' as PapayaVariety,
    maturity: '' as MaturityLevel,
    quality_category: qualityCategory,
    days_since_picked: '',
  });

  const districtOptions = [
    { label: 'Hambanthota', value: 'Hambanthota' as District },
    { label: 'Matara', value: 'Matara' as District },
    { label: 'Galle', value: 'Galle' as District },
  ];

  const varietyOptions = [
    { label: 'Red Lady', value: 'RedLady' as PapayaVariety },
    { label: 'Tainung', value: 'Tenim' as PapayaVariety },
    
  ];

  const maturityOptions = [
    { label: 'Unmature', value: 'unmature' as MaturityLevel },
    { label: 'Half-Mature', value: 'half-mature' as MaturityLevel },
    { label: 'Mature', value: 'mature' as MaturityLevel },
  ];

  const pickImage = async () => {
    // For web platform, use file input directly
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

    // For mobile: Both best quality and factory outlet allow camera and gallery
    Alert.alert(
      'Select Image',
      'Choose how to add your papaya image',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
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
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
              Alert.alert('Permission Required', 'Gallery permission is required');
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
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const submitGrading = async () => {
    const photoType = category === 'best' ? 'papaya color' : 'damaged areas';
    
    if (!imageUri) {
      Alert.alert('Error', `Please take a photo of ${photoType}`);
      return;
    }

    // For best quality, validate all fields
    if (category === 'best') {
      if (!formData.district) {
        Alert.alert('Error', 'Please select a district');
        return;
      }
      
      if (!formData.variety) {
        Alert.alert('Error', 'Please select a papaya variety');
        return;
      }
      
      if (!formData.maturity) {
        Alert.alert('Error', 'Please select maturity level');
        return;
      }
      
      if (!formData.days_since_picked) {
        Alert.alert('Error', 'Please fill in days since picked');
        return;
      }

      const daysSincePicked = parseInt(formData.days_since_picked);
      if (isNaN(daysSincePicked) || daysSincePicked < 1 || daysSincePicked > 7) {
        Alert.alert('Error', 'Days since picked must be between 1 and 7 for freshness');
        return;
      }
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Handle file differently for web and mobile
      if (Platform.OS === 'web') {
        console.log('Web platform - Processing image:', imageUri);
        try {
          // For web, check if it's already a blob URL or needs to be fetched
          let blob: Blob;
          
          if (imageUri.startsWith('blob:')) {
            // If it's a blob URL, fetch it
            const response = await fetch(imageUri);
            console.log('Fetch blob response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status}`);
            }
            
            blob = await response.blob();
          } else if (imageUri.startsWith('data:')) {
            // If it's a data URL, convert to blob
            const response = await fetch(imageUri);
            blob = await response.blob();
          } else {
            // Otherwise, fetch as normal URL
            const response = await fetch(imageUri);
            console.log('Fetch response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status}`);
            }
            
            blob = await response.blob();
          }
          
          console.log('Blob created, size:', blob.size, 'type:', blob.type);
          
          // Ensure the blob has a proper type
          const imageBlob = blob.type.startsWith('image/') 
            ? blob 
            : new Blob([blob], { type: 'image/jpeg' });
          
          formDataToSend.append('file', imageBlob, 'papaya.jpg');
          console.log('File appended to FormData');
        } catch (fetchError) {
          console.error('Error processing image for web:', fetchError);
          Alert.alert('Error', 'Failed to process the selected image. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        // For mobile, use the native format
        formDataToSend.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'papaya.jpg',
        } as any);
      }
      
      formDataToSend.append('farmer_id', user?.uid || '');
      formDataToSend.append('quality_category', formData.quality_category);

      // For best quality, include all fields
      if (category === 'best') {
        formDataToSend.append('district', formData.district);
        formDataToSend.append('variety', formData.variety);
        formDataToSend.append('maturity', formData.maturity);
        formDataToSend.append('days_since_picked', formData.days_since_picked);
        console.log('Best Quality - Form data:', {
          district: formData.district,
          variety: formData.variety,
          maturity: formData.maturity,
          days_since_picked: formData.days_since_picked,
        });
      }

      console.log('Sending request to /quality/farmer...');
      
      const response = await api.post<FarmerQualityResponse>(
        '/quality/farmer',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('\n===== API RESPONSE RECEIVED =====');
      console.log('Full Response:', JSON.stringify(response.data, null, 2));
      console.log('response.data.prediction:', response.data.prediction);
      console.log('response.data.predicted_grade:', response.data.predicted_grade);
      console.log('Category:', category);
      console.log('Quality Category:', formData.quality_category);
      console.log('==================================\n');

      router.push({
        pathname: '/quality/farmer-result' as any,
        params: {
          data: JSON.stringify(response.data),
          category: category,
        },
      });
    } catch (error: any) {
      console.error('Quality grading error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      if (Platform.OS === 'web') {
        console.error('Full error object:', JSON.stringify(error, null, 2));
      }
      
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to grade papaya quality. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoLabel = () => {
    if (category === 'best') {
      return 'Papaya Color Photo';
    } else {
      return 'Damaged Areas Photo';
    }
  };

  const getPhotoInstruction = () => {
    if (category === 'best') {
      return 'Take a clear photo showing the papaya color';
    } else {
      return 'Take or choose a photo showing the papaya (damaged areas visible)';
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>
          {category === 'best' ? 'Best Quality' : 'Factory Outlet'} Grading
        </Text>
        <Text style={styles.subtitle}>
          {category === 'best' 
            ? 'Enter papaya details for premium grading' 
            : 'Upload papaya image for factory outlet grading'}
        </Text>
      </View>

      {/* Show input fields only for Best Quality */}
      {category === 'best' && (
        <>
          <Dropdown
            label="District"
            value={formData.district || null}
            options={districtOptions}
            onChange={(value) => setFormData({ ...formData, district: value })}
            placeholder="Select District"
          />

          <Dropdown
            label="Variety"
            value={formData.variety || null}
            options={varietyOptions}
            onChange={(value) => setFormData({ ...formData, variety: value })}
            placeholder="Select Variety"
          />

          <Dropdown
            label="Maturity Level"
            value={formData.maturity || null}
            options={maturityOptions}
            onChange={(value) => setFormData({ ...formData, maturity: value })}
            placeholder="Select Maturity Level"
          />

          <LabeledInput
            label="Days Since Picked (1-7 for freshness)"
            value={formData.days_since_picked}
            onChangeText={(text) => setFormData({ ...formData, days_since_picked: text })}
            placeholder="e.g., 2"
            keyboardType="numeric"
          />
        </>
      )}

      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>{getPhotoLabel()}</Text>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>{getPhotoInstruction()}</Text>
      </View>

      <PrimaryButton
        title={imageUri ? 'Change Photo' : (Platform.OS === 'web' ? 'Choose Photo' : (category === 'factory' ? 'Add Photo' : 'Take Photo'))}
        onPress={pickImage}
        variant="secondary"
        style={styles.button}
      />

      <PrimaryButton
        title="Generate Grade"
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
  instructionBox: {
    backgroundColor: '#E6F4FE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  imageContainer: {
    marginBottom: 30,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 900,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  button: {
    marginBottom: 16,
  },
});
