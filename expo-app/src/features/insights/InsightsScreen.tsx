import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { MetricCard } from '@/components/MetricCard';
import { getLibraryStats } from '@/lib/bookRepository';
import { LibraryStats } from '@/lib/types';
import { colors } from '@/theme/colors';

export function InsightsScreen() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLibraryStats().then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>Insights</Text>
        <Text style={styles.title}>A cleaner view of your reading life.</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {stats ? (
        <>
          <View style={styles.metrics}>
            <MetricCard label="Total" value={stats.totalBooks} />
            <MetricCard label="Completed" value={stats.completed} tone="blue" />
          </View>
          <View style={styles.metrics}>
            <MetricCard label="Reading" value={stats.reading} tone="gold" />
            <MetricCard label="Loaned" value={stats.loaned} />
          </View>
        </>
      ) : null}

      <Section title="AI Insight Pipeline">
        {['Duplicate detection', 'Missing metadata', 'Shelf coverage', 'Reading momentum', 'Language balance'].map((item) => (
          <View key={item} style={styles.row}>
            <Text style={styles.rowText}>{item}</Text>
            <Text style={styles.pending}>Planned</Text>
          </View>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
    marginTop: 6
  },
  metrics: {
    flexDirection: 'row',
    gap: 10
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14
  },
  rowText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
  pending: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  }
});
