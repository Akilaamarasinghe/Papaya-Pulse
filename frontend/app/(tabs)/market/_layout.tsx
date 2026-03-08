import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';

export default function MarketLayout() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.info,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.text },
        headerShadowVisible: false,
        headerBackTitle: '',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="predict-form" options={{ title: 'Price Prediction Form' }} />
      <Stack.Screen name="result" options={{ title: 'Price Prediction' }} />
      <Stack.Screen name="customer-predict" options={{ title: 'Scan Papaya' }} />
      <Stack.Screen name="customer-result" options={{ title: 'Market Analysis' }} />
    </Stack>
  );
}
