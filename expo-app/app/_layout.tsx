import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const [iconsReady, setIconsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fontLoad = Platform.OS === 'web'
      ? Font.loadAsync({ Ionicons: '/fonts/Ionicons.ttf' })
      : Ionicons.loadFont();

    fontLoad
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
