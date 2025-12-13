import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
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
      
      // React Native FormData requires specific format
      formData.append('profilePhoto', {
        uri: uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      console.log('Uploading profile photo...');
      
      const response = await api.post('/users/upload-profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Don't let axios transform FormData
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile')}</Text>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={[styles.profileImage, { borderColor: colors.primary }]} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <Ionicons name="person" size={60} color={colors.icon} />
            </View>
          )}
          <View style={[styles.cameraIcon, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.userEmail, { color: colors.placeholder }]}>{user.email}</Text>
        <View style={[styles.badge, { backgroundColor: currentTheme === 'dark' ? '#1A3A1A' : '#E8F5E9' }]}>
          <Text style={[styles.badgeText, { color: currentTheme === 'dark' ? '#66BB6A' : '#2E7D32' }]}>
            {user.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="location" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.placeholder }]}>{t('district')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.district}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="calendar" size={24} color={colors.primary} />
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
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
