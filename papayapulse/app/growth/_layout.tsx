import { Stack } from 'expo-router';

export default function GrowthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Growth Stage & Harvest' }} />
      <Stack.Screen name="stage-check" options={{ title: 'Stage Check' }} />
      <Stack.Screen name="harvest-form" options={{ title: 'Harvest Prediction' }} />
      <Stack.Screen name="harvest-result" options={{ title: 'Results' }} />
    </Stack>
  );
}
