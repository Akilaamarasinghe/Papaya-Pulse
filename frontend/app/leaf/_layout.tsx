import { Stack } from 'expo-router';

export default function LeafLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2D7A4F' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F0F7F2' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Leaf Disease Scanner', headerShown: false }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Leaf' }} />
      <Stack.Screen name="result" options={{ title: 'Diagnosis Result' }} />
      <Stack.Screen name="history" options={{ title: 'Scan History' }} />
    </Stack>
  );
}
