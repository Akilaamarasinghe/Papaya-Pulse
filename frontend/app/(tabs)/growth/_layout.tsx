import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';

export default function GrowthLayout() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.text },
        headerShadowVisible: false,
        headerBackTitle: '',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="stage-check" options={{ title: 'Stage Check' }} />
      <Stack.Screen name="stage-result" options={{ title: 'Growth Stage Result' }} />
      <Stack.Screen name="stage-history" options={{ title: 'Stage Scan History', headerShown: false }} />
      <Stack.Screen name="harvest-form" options={{ title: 'Harvest Prediction' }} />
      <Stack.Screen name="harvest-result" options={{ title: 'Results' }} />
      <Stack.Screen name="harvest-history" options={{ title: 'Harvest History', headerShown: false }} />
    </Stack>
  );
}
