import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppBrand } from '@/components/AppBrand';
import { handleAuthCallback } from '@/lib/auth';
import { colors } from '@/theme/colors';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : null;

    handleAuthCallback(currentUrl)
      .then(() => {
        router.replace('/(tabs)');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not complete sign-in.');
      });
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <AppBrand />
      </View>
      <View style={styles.panel}>
        {error ? (
          <>
            <Ionicons name="alert-circle-outline" color={colors.danger} size={34} />
            <Text style={styles.title}>Sign-in failed</Text>
            <Text style={styles.body}>{error}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.title}>Completing sign-in</Text>
            <Text style={styles.body}>You will be redirected to your library.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  brand: {
    left: 20,
    position: 'absolute',
    top: 20
  },
  panel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    maxWidth: 420,
    padding: 24,
    width: '100%'
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center'
  }
});
