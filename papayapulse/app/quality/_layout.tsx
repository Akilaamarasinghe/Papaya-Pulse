import { Stack } from 'expo-router';

export default function QualityLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Quality Grader' }} />
      <Stack.Screen name="farmer-input" options={{ title: 'Farmer Grading' }} />
      <Stack.Screen name="farmer-result" options={{ title: 'Grade Result' }} />
      <Stack.Screen name="customer-input" options={{ title: 'Customer Check' }} />
      <Stack.Screen name="customer-result" options={{ title: 'Quality Result' }} />
    </Stack>
  );
}
