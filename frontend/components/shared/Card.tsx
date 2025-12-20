import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

interface CardProps {
  title: string;
  icon: string;
  onPress: () => void;
  description?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, onPress, description }) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[styles.card, { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          shadowColor: colors.shadow,
        }]} 
        onPress={onPress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={currentTheme === 'dark' 
            ? ['rgba(255, 160, 107, 0.15)', 'rgba(255, 107, 53, 0.05)']
            : ['rgba(255, 107, 53, 0.1)', 'rgba(255, 160, 107, 0.05)']
          }
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon as any} size={48} color={colors.primary} />
        </LinearGradient>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {description && <Text style={[styles.description, { color: colors.placeholder }]}>{description}</Text>}
        </View>
        <View style={[styles.arrowContainer, { backgroundColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
