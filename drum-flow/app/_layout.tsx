import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { View, ActivityIndicator } from 'react-native';
import { runMigrations } from '../src/storage/migrations';
import { seedDatabase } from '../src/storage/seed';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#50fa7b',
    secondary: '#ff79c6',
    tertiary: '#bd93f9',
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceVariant: '#0f3460',
  },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await runMigrations();
      await seedDatabase();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#50fa7b" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="metronome/[id]" options={{ headerShown: true, title: '练习' }} />
        <Stack.Screen name="exercise/[id]" options={{ headerShown: true, title: '练习详情' }} />
      </Stack>
    </PaperProvider>
  );
}
