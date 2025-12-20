import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = 'hasSeenOnboarding';

interface OnboardingSlide {
  id: number;
  title: string;
  titleSi: string;
  description: string;
  descriptionSi: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: readonly [string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to Papaya Pulse',
    titleSi: 'Papaya Pulse වෙත සාදරයෙන් පිළිගනිමු',
    description: 'AI-powered platform for papaya farmers and customers in Sri Lanka',
    descriptionSi: 'ශ්‍රී ලංකාවේ පැපොල් ගොවීන් සහ ගනුදෙනුකරුවන් සඳහා AI තාක්ෂණයෙන් යුත් වේදිකාව',
    icon: 'leaf',
    color: '#10B981',
    gradient: ['#10B981', '#34D399'],
  },
  {
    id: 2,
    title: 'Growth Stage Detection',
    titleSi: 'වර්ධන අවධිය හඳුනා ගැනීම',
    description: 'Identify papaya growth stages and predict harvest time with AI',
    descriptionSi: 'AI මගින් පැපොල් වර්ධන අවධි හඳුනාගෙන අස්වනු කාලය පුරෝකථනය කරන්න',
    icon: 'camera',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#60A5FA'],
  },
  {
    id: 3,
    title: 'Quality Grading',
    titleSi: 'ගුණාත්මක ශ්‍රේණිගත කිරීම',
    description: 'Assess papaya quality and get accurate grading for best prices',
    descriptionSi: 'පැපොල් ගුණාත්මකභාවය තක්සේරු කර හොඳම මිල සඳහා නිවැරදි ශ්‍රේණිගත කිරීම ලබා ගන්න',
    icon: 'star',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#FBBF24'],
  },
  {
    id: 4,
    title: 'Market Price Prediction',
    titleSi: 'වෙළඳපල මිල පුරෝකථනය',
    description: 'Get smart pricing recommendations based on quality and market trends',
    descriptionSi: 'ගුණාත්මකභාවය සහ වෙළඳපල ප්‍රවණතා මත පදනම් වූ ස්මාර්ට් මිල නිර්දේශ ලබා ගන්න',
    icon: 'trending-up',
    color: '#FF6B35',
    gradient: ['#FF6B35', '#FFA06B'],
  },
  {
    id: 5,
    title: 'Disease Detection',
    titleSi: 'රෝග හඳුනා ගැනීම',
    description: 'Early identification of leaf diseases with treatment recommendations',
    descriptionSi: 'ප්‍රතිකාර නිර්දේශ සමඟ කොළ රෝග ඉක්මනින් හඳුනා ගැනීම',
    icon: 'medical',
    color: '#EF4444',
    gradient: ['#EF4444', '#F87171'],
  },
];

export default function OnboardingScreen() {
  const { currentTheme, language } = useTheme();
  const colors = Colors[currentTheme];
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetAnimation();
    } else {
      completeOnboarding();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetAnimation();
    }
  };

  const resetAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const skip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/login' as any);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/login' as any);
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <LinearGradient
      colors={currentSlide.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <Ionicons name={currentSlide.icon} size={80} color="#FFFFFF" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {language === 'si' ? currentSlide.titleSi : currentSlide.title}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {language === 'si' ? currentSlide.descriptionSi : currentSlide.description}
        </Text>
      </Animated.View>

      {/* Pagination */}
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          return (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
                { backgroundColor: index === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)' },
              ]}
            />
          );
        })}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={goToPrev}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={goToNext}
        >
          {currentIndex === slides.length - 1 ? (
            <Text style={styles.getStartedText}>Get Started</Text>
          ) : (
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 12,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  getStartedText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
});
