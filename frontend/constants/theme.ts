/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const primaryColor = '#FF6B35'; // Papaya orange
const tintColorLight = '#FF6B35';
const tintColorDark = '#FFA06B';

export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#F8F9FE',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    primary: '#FF6B35',
    primaryLight: '#FFB199',
    primaryDark: '#E85A24',
    secondary: '#00D9C0',
    secondaryLight: '#5FFBEA',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    card: '#FFFFFF',
    cardHover: '#F9FAFB',
    border: '#E5E7EB',
    inputBackground: '#FFFFFF',
    inputBorder: '#D1D5DB',
    placeholder: '#9CA3AF',
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradientStart: '#FF6B35',
    gradientEnd: '#FFA06B',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#F9FAFB',
    background: '#0F172A',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    primary: '#FFA06B',
    primaryLight: '#FFCDB3',
    primaryDark: '#FF8447',
    secondary: '#00D9C0',
    secondaryLight: '#5FFBEA',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    card: '#1E293B',
    cardHover: '#334155',
    border: '#334155',
    inputBackground: '#1E293B',
    inputBorder: '#475569',
    placeholder: '#6B7280',
    shadow: 'rgba(0, 0, 0, 0.3)',
    gradientStart: '#FFA06B',
    gradientEnd: '#FFD4B3',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
