import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const [iconsReady, setIconsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    Ionicons.loadFont()
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setIconsReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!iconsReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
