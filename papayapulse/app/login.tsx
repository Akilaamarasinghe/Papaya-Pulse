import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
          colors={currentTheme === 'dark' 
            ? ['rgba(255, 160, 107, 0.2)', 'rgba(255, 107, 53, 0.05)']
            : ['rgba(255, 107, 53, 0.1)', 'rgba(255, 160, 107, 0.05)']
          }
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>🌿</Text>
            <Text style={[styles.title, { color: colors.primary }]}>Papaya Pulse</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>{t('welcome')}</Text>
            <Text style={[styles.description, { color: colors.placeholder }]}>Sign in to continue</Text>
          </View>
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
  headerGradient: {
    borderRadius: 24,
    marginBottom: 32,
    padding: 24,
  },
  header: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});
