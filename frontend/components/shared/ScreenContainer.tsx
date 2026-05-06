import React from 'react';
import { ScrollView, StyleSheet, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ children, style }) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const insets = useSafeAreaInsets();

  const scrollView = (
    <ScrollView
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      {Platform.OS === 'android' ? (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior="height"
          keyboardVerticalOffset={20}
        >
          {scrollView}
        </KeyboardAvoidingView>
      ) : (
        scrollView
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
});
