import { Stack } from 'expo-router';

export default function MarketLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Market Price Predictor' }} />
      <Stack.Screen name="predict-form" options={{ title: 'Price Prediction Form' }} />
      <Stack.Screen name="result" options={{ title: 'Price Prediction' }} />
    </Stack>
  );
}
