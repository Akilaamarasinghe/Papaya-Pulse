import { Stack } from 'expo-router';

export default function LeafLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Leaf Disease Scanner' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Leaf' }} />
      <Stack.Screen name="result" options={{ title: 'Scan Result' }} />
      <Stack.Screen name="history" options={{ title: 'Scan History' }} />
    </Stack>
  );
}
