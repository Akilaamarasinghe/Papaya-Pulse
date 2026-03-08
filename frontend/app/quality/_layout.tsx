import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function QualityLayout() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: '#FBBF24',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.text },
        headerShadowVisible: false,
        headerBackTitle: '',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="farmer-input" options={{ title: 'Farmer Grading' }} />
      <Stack.Screen name="farmer-result" options={{ title: 'Grade Result' }} />
      <Stack.Screen name="customer-input" options={{ title: 'Customer Check' }} />
      <Stack.Screen name="customer-result" options={{ title: 'Quality Result' }} />
    </Stack>
  );
}
