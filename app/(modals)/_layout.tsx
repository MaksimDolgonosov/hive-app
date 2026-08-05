import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'fullScreenModal' }}>
      <Stack.Screen name="camera" />
      <Stack.Screen name="preview" options={{ presentation: 'card' }} />
    </Stack>
  );
}
