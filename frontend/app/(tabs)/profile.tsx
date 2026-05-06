import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { LabeledInput } from '../../components/shared/LabeledInput';
import api from '../../config/api';

export default function ProfileScreen() {
  const { user, signOut, reloadUser } = useAuth();
  const { currentTheme, t } = useTheme();
  const colors = Colors[currentTheme];
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePhoto || null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadProfilePhoto(result.assets[0].uri);
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    setLoading(true);
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // On web, fetch the image as a Blob so the browser sends a real file
        const fetchResponse = await fetch(uri);
        const blob = await fetchResponse.blob();
        formData.append('profilePhoto', blob, 'profile.jpg');
      } else {
        // On mobile (iOS / Android), React Native FormData accepts this object format
        formData.append('profilePhoto', {
          uri: uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }

      console.log('Uploading profile photo...');

      const response = await api.post('/users/upload-profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Prevent axios from serialising FormData
      });

      console.log('Upload response:', response.data);
      
      if (response.data.profilePhoto) {
        setProfileImage(response.data.profilePhoto);
        // Reload user data to update profile photo in context
        await reloadUser();
        Alert.alert(t('success'), t('uploadSuccess'));
      } else {
        throw new Error('No profile photo URL in response');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || t('uploadFailed');
      Alert.alert(t('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!name.trim()) {
      Alert.alert(t('error'), 'Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await api.put('/users/profile', { name });
      Alert.alert(t('success'), t('profileUpdated'));
      setEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert(t('error'), t('profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <ScreenContainer>
      {/* ── Gradient Profile Header ── */}
      <LinearGradient
        colors={
          currentTheme === 'dark'
            ? ['#1E2D45', '#0F172A']
            : ['#FF6B35', '#FF9A70']
        }
        style={styles.heroHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />

        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={52} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.heroName}>{user.name}</Text>
        <Text style={styles.heroEmail}>{user.email}</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>
            {user.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.infoSection}>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.infoIconBox, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
            <Ionicons name="location" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.placeholder }]}>{t('district')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.district}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.infoIconBox, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
            <Ionicons name="calendar" size={20} color={colors.info} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.placeholder }]}>{t('memberSince')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {editing ? (
        <View style={styles.editSection}>
          <LabeledInput
            label={t('name')}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
          <View style={styles.buttonRow}>
            <PrimaryButton
              title={t('saveProfile')}
              onPress={updateProfile}
              loading={loading}
              style={styles.halfButton}
            />
            <PrimaryButton
              title={t('cancelEdit')}
              onPress={() => {
                setEditing(false);
                setName(user.name);
              }}
              variant="outline"
              style={styles.halfButton}
            />
          </View>
        </View>
      ) : (
        <PrimaryButton
          title={t('editProfile')}
          onPress={() => setEditing(true)}
          variant="secondary"
          style={styles.button}
        />
      )}

      <PrimaryButton
        title={t('signOut')}
        onPress={signOut}
        variant="outline"
        style={styles.button}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  /* Hero header */
  heroHeader: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -40,
  },
  heroDecor2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  placeholderImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  heroEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 10,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '700',
  },
  /* Info section */
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 3,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  /* Edit section */
  editSection: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  button: {
    marginBottom: 12,
  },
});
