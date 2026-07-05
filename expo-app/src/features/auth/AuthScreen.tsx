import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { AuthPanel } from '@/features/auth/AuthPanel';
import { colors } from '@/theme/colors';

type Props = {
  configMissing?: boolean;
  loading?: boolean;
};

export function AuthScreen({ configMissing = false, loading = false }: Props) {
  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.icon}>
          <Ionicons name="library-outline" color={colors.accent} size={30} />
        </View>
        <Text style={styles.eyebrow}>Book Keeper</Text>
        <Text style={styles.title}>Your private library, organized with AI.</Text>
        <Text style={styles.body}>
          Sign in to sync your catalog, scans, notes, reading history, loans, and AI enrichment results securely with Supabase.
        </Text>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Checking session...</Text>
        </View>
      ) : (
        <AuthPanel configMissing={configMissing} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    width: 52
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 20
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800'
  }
});
