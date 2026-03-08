import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';
import { ScreenContainer } from '../components/shared/ScreenContainer';
import { LabeledInput } from '../components/shared/LabeledInput';
import { PrimaryButton } from '../components/shared/PrimaryButton';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { currentTheme, t } = useTheme();
  const colors = Colors[currentTheme];
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={
            currentTheme === 'dark'
              ? ['#1E2D45', '#0F172A']
              : ['#FF6B35', '#FF9A70']
          }
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroAvatarBox}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>Papaya Pulse</Text>
          <Text style={styles.heroSubtitle}>{t('welcome')}</Text>
          <Text style={styles.heroDesc}>Sign in to continue</Text>
        </LinearGradient>
      </Animated.View>

      <LabeledInput
        label={t('email')}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <LabeledInput
        label={t('password')}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
        autoCapitalize="none"
      />

      <PrimaryButton
        title={t('login')}
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
      />

      <PrimaryButton
        title="Don't have an account? Sign Up"
        onPress={() => router.replace('/signup' as any)}
        variant="outline"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    marginBottom: 32,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -50,
  },
  heroDecor2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -25,
  },
  heroAvatarBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImg: {
    width: 100,
    height: 100,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});
