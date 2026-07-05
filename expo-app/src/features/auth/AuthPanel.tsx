import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendMagicLink } from '@/lib/auth';
import { colors } from '@/theme/colors';

type Props = {
  configMissing?: boolean;
};

export function AuthPanel({ configMissing = false }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (configMissing) {
      setStatus('Add EXPO_PUBLIC_SUPABASE_ANON_KEY to expo-app/.env first.');
      return;
    }
    if (!email.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      await sendMagicLink(email.trim());
      setStatus('Check your email for the login link.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send login link.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" color={colors.accent} size={22} />
        <Text style={styles.title}>{configMissing ? 'Supabase key required' : 'Sign in to sync your private library'}</Text>
      </View>
      <View style={styles.row}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
        />
        <Pressable style={styles.button} onPress={submit} disabled={sending}>
          <Text style={styles.buttonText}>{sending ? 'Sending' : 'Send Link'}</Text>
        </Pressable>
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  title: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900'
  },
  row: {
    flexDirection: 'row',
    gap: 8
  },
  input: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  buttonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  status: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  }
});
