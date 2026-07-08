import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { MetricCard } from '@/components/MetricCard';
import { getLibraryInsights } from '@/lib/bookRepository';
import { LibraryInsightItem, LibraryInsights } from '@/lib/types';
import { colors } from '@/theme/colors';

export function InsightsScreen() {
  const [insights, setInsights] = useState<LibraryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLibraryInsights()
      .then(setInsights)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = insights?.stats;

  return (
    <Screen>
      <View>
        <Text style={styles.eyebrow}>Insights</Text>
        <Text style={styles.title}>Your library at a glance.</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {stats ? (
        <>
          <View style={styles.metrics}>
            <MetricCard label="Total" value={stats.totalBooks} />
            <MetricCard label="Unread" value={stats.unread} tone="blue" />
          </View>
          <View style={styles.metrics}>
            <MetricCard label="Completed" value={stats.completed} tone="blue" />
            <MetricCard label="Reading" value={stats.reading} tone="gold" />
            <MetricCard label="Loaned" value={stats.loaned} />
          </View>
        </>
      ) : null}

      {insights ? (
        <>
          <Section title="Metadata Health">
            <HealthRow label="Missing author" count={insights.missing.author} total={stats?.totalBooks ?? 0} />
            <HealthRow label="Missing ISBN" count={insights.missing.isbn} total={stats?.totalBooks ?? 0} />
            <HealthRow label="Missing page count" count={insights.missing.pageCount} total={stats?.totalBooks ?? 0} />
            <HealthRow label="Missing cover" count={insights.missing.cover} total={stats?.totalBooks ?? 0} />
            <HealthRow label="Missing shelf" count={insights.missing.shelf} total={stats?.totalBooks ?? 0} />
          </Section>

          <Section title="Language Balance">
            <RankedList items={insights.languages} emptyText="No language metadata yet." />
          </Section>

          <Section title="Top Tags">
            <RankedList items={insights.topTags} emptyText="No tags yet." />
          </Section>

          <Section title="Top Authors">
            <RankedList items={insights.topAuthors} emptyText="No author metadata yet." />
          </Section>

          <Section title="Duplicate Watch">
            <DuplicateList title="ISBN duplicates" items={insights.duplicates.isbn} />
            <DuplicateList title="Title duplicates" items={insights.duplicates.title} />
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

function HealthRow({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total ? Math.round((count / total) * 100) : 0;
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowText}>{label}</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>
      </View>
      <Text style={[styles.countBadge, count === 0 && styles.countBadgeGood]}>{count}</Text>
    </View>
  );
}

function RankedList({ items, emptyText }: { items: LibraryInsightItem[]; emptyText: string }) {
  if (!items.length) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.label} style={styles.rankRow}>
          <View style={styles.rowMain}>
            <Text numberOfLines={1} style={styles.rowText}>{item.label}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round((item.count / max) * 100)}%` }]} />
            </View>
          </View>
          <Text style={styles.countBadge}>{item.count}</Text>
        </View>
      ))}
    </View>
  );
}

function DuplicateList({ title, items }: { title: string; items: LibraryInsightItem[] }) {
  return (
    <View style={styles.duplicateBlock}>
      <Text style={styles.duplicateTitle}>{title}</Text>
      {items.length ? (
        items.map((item) => (
          <View key={item.label} style={styles.duplicateRow}>
            <Text numberOfLines={1} style={styles.duplicateText}>{item.label}</Text>
            <Text style={styles.countBadge}>{item.count}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No duplicates detected.</Text>
      )}
    </View>
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
    gap: 12,
    justifyContent: 'space-between',
    padding: 14
  },
  rankRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 14
  },
  rowMain: {
    flex: 1,
    gap: 8
  },
  rowText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800'
  },
  bar: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 99,
    height: 8,
    overflow: 'hidden'
  },
  barFill: {
    backgroundColor: colors.accent,
    borderRadius: 99,
    height: '100%'
  },
  countBadge: {
    backgroundColor: '#fff5df',
    borderRadius: 6,
    color: colors.gold,
    fontSize: 12,
    fontWeight: '900',
    minWidth: 34,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 5,
    textAlign: 'center'
  },
  countBadgeGood: {
    backgroundColor: '#edf7f4',
    color: colors.accentDark
  },
  list: {
    gap: 10
  },
  duplicateBlock: {
    gap: 8
  },
  duplicateTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  duplicateRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 12
  },
  duplicateText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '800'
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800'
  }
});
