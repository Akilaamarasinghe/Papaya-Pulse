import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export default function Index() {
  useEffect(() => {
    checkInitialRoute();
  }, []);

  const checkInitialRoute = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      
      if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking initial route:', error);
      // Default to login if there's an error
      router.replace('/login');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FE' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}
