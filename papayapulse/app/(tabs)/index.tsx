import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { Card } from '../../components/shared/Card';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const { currentTheme, t } = useTheme();
  const colors = Colors[currentTheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

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
            ? ['rgba(255, 160, 107, 0.15)', 'rgba(255, 107, 53, 0.05)']
            : ['rgba(255, 107, 53, 0.08)', 'rgba(255, 160, 107, 0.02)']
          }
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <Text style={[styles.emoji]}>🌿</Text>
            <Text style={[styles.title, { color: colors.primary }]}>Papaya Pulse</Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {t('welcome')}, {user.name}!
            </Text>
            <View style={[styles.badge, { backgroundColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,107,53,0.1)' }]}>
              <Text style={[styles.role, { color: colors.primary }]}>
                {user.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'} • {user.district}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.modules}>
        <Card
          title={t('growthStage')}
          icon="leaf"
          description={t('growthStageDesc')}
          onPress={() => router.push('/growth' as any)}
        />

        <Card
          title={t('qualityCheck')}
          icon="star"
          description={t('qualityCheckDesc')}
          onPress={() => router.push('/quality' as any)}
        />

        {user.role === 'farmer' && (
          <Card
            title={t('marketPrice')}
            icon="cash"
            description={t('marketPriceDesc')}
            onPress={() => router.push('/market' as any)}
          />
        )}

        <Card
          title={t('leafDisease')}
          icon="scan"
          description={t('leafDiseaseDesc')}
          onPress={() => router.push('/leaf' as any)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    borderRadius: 24,
    marginBottom: 24,
    padding: 24,
  },
  header: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  role: {
    fontSize: 16,
    fontWeight: '600',
  },
  modules: {
    marginBottom: 24,
  },
});
