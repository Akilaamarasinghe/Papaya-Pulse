import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function LeafLayout() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: '#34D399',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.text },
        headerShadowVisible: false,
        headerBackTitle: '',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Leaf' }} />
      <Stack.Screen name="result" options={{ title: 'Diagnosis Result' }} />
      <Stack.Screen name="history" options={{ title: 'Scan History' }} />
    </Stack>
  );
}
