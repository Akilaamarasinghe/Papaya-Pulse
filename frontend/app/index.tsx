import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for Firebase to restore auth state

    checkInitialRoute();
  }, [loading, user]);

  const checkInitialRoute = async () => {
    try {
      // If already logged in, go straight to the app
      if (user) {
        router.replace('/(tabs)');
        return;
      }

      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);

      if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking initial route:', error);
      router.replace('/login');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FE' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}
