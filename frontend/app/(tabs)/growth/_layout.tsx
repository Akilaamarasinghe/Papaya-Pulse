import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { Colors } from '../../../constants/theme';

export default function GrowthLayout() {
  const { currentTheme, language } = useTheme();
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
      <Stack.Screen name="stage-check" options={{ title: language === 'si' ? 'අදියර පරීක්ෂාව' : 'Stage Check' }} />
      <Stack.Screen name="stage-result" options={{ title: language === 'si' ? 'වර්ධන අදියර ප්‍රතිඵලය' : 'Growth Stage Result' }} />
      <Stack.Screen name="stage-history" options={{ title: language === 'si' ? 'අදියර ඉතිහාසය' : 'Stage Scan History' }} />
      <Stack.Screen name="harvest-form" options={{ title: language === 'si' ? 'අස්වැන්න පුරෝකථනය' : 'Harvest Prediction' }} />
      <Stack.Screen name="harvest-result" options={{ title: language === 'si' ? 'ප්‍රතිඵල' : 'Results' }} />
      <Stack.Screen name="harvest-history" options={{ title: language === 'si' ? 'අස්වැන්න ඉතිහාසය' : 'Harvest History' }} />
    </Stack>
  );
}
