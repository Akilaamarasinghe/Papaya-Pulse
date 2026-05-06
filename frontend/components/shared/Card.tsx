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

const ICON_CONFIG: Record<string, { gradient: [string, string]; bg: string }> = {
  leaf:  { gradient: ['#34D399', '#10B981'], bg: 'rgba(52,211,153,0.14)' },
  star:  { gradient: ['#FBBF24', '#F59E0B'], bg: 'rgba(251,191,36,0.14)' },
  cash:  { gradient: ['#60A5FA', '#3B82F6'], bg: 'rgba(96,165,250,0.14)' },
  scan:  { gradient: ['#F472B6', '#EC4899'], bg: 'rgba(244,114,182,0.14)' },
};

export const Card: React.FC<CardProps> = ({ title, icon, onPress, description }) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const cfg = ICON_CONFIG[icon] ?? {
    gradient: [colors.primary, colors.primaryDark] as [string, string],
    bg: `${colors.primary}22`,
  };

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        {/* Left gradient accent bar */}
        <LinearGradient
          colors={cfg.gradient}
          style={styles.accentBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: cfg.bg }]}>
          <Ionicons name={icon as any} size={26} color={cfg.gradient[0]} />
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {description && (
            <Text
              style={[styles.description, { color: colors.placeholder }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        {/* Arrow */}
        <View
          style={[
            styles.arrowBtn,
            {
              backgroundColor:
                currentTheme === 'dark'
                  ? 'rgba(255,255,255,0.07)'
                  : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    paddingVertical: 18,
    paddingRight: 16,
    paddingLeft: 0,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 16,
  },
  iconBubble: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
