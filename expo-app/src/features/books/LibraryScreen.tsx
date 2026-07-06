import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { MetricCard } from '@/components/MetricCard';
import { signOut, useSession } from '@/lib/auth';
import { listBooks } from '@/lib/bookRepository';
import { Book } from '@/lib/types';
import { colors } from '@/theme/colors';

export function LibraryScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSession();

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return books;
    return books.filter((book) => {
      const searchable = [book.title, book.subtitle, book.language, book.location_label, ...(book.authors ?? []), ...(book.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [books, query]);

  const stats = {
    total: books.length,
    reading: books.filter((book) => book.status === 'reading').length,
    unread: books.filter((book) => book.status === 'unread').length
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View>
          <Text style={styles.eyebrow}>Personal Library</Text>
          <Text style={styles.title}>Know every book you own.</Text>
        </View>
        <Pressable style={styles.aiButton} onPress={() => router.push('/(tabs)/assistant')}>
          <Ionicons name="sparkles-outline" color={colors.surface} size={18} />
          <Text style={styles.aiButtonText}>Ask AI</Text>
        </Pressable>
      </View>

      <Pressable style={styles.syncBadge} onPress={signOut}>
        <Ionicons name="cloud-done-outline" color={colors.accent} size={18} />
        <Text style={styles.syncBadgeText}>Synced as {session?.user.email ?? 'authenticated user'} · Sign out</Text>
      </Pressable>

      <View style={styles.metrics}>
        <MetricCard label="Books" value={stats.total} />
        <MetricCard label="Reading" value={stats.reading} tone="gold" />
        <MetricCard label="Unread" value={stats.unread} tone="blue" />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" color={colors.muted} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search title, author, language, shelf, tag"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <Section title="Collection" action={`${filteredBooks.length} shown`}>
        {loading ? <ActivityIndicator color={colors.accent} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && filteredBooks.map((book) => <BookRow key={book.id} book={book} />)}
      </Section>
    </Screen>
  );
}

function BookRow({ book }: { book: Book }) {
  return (
    <Pressable style={styles.bookRow} onPress={() => router.push(`/(tabs)/${book.id}`)}>
      <View style={styles.cover}>
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={styles.coverImage} />
        ) : (
          <Ionicons name="book-outline" color={colors.accent} size={28} />
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text numberOfLines={1} style={styles.bookTitle}>{book.title}</Text>
        <Text numberOfLines={1} style={styles.bookMeta}>{book.authors?.join(', ') || 'Unknown author'}</Text>
        <View style={styles.badges}>
          {book.language ? <Text style={styles.badge}>{book.language}</Text> : null}
          {book.location_label ? <Text style={styles.badge}>{book.location_label}</Text> : null}
          <Text style={styles.status}>{book.status}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" color={colors.muted} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between'
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
    lineHeight: 38,
    marginTop: 6,
    maxWidth: 270
  },
  aiButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  aiButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '900'
  },
  metrics: {
    flexDirection: 'row',
    gap: 10
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 48
  },
  syncBadge: {
    alignItems: 'center',
    backgroundColor: '#edf7f4',
    borderColor: '#c7e4dc',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12
  },
  syncBadgeText: {
    color: colors.accentDark,
    flex: 1,
    fontSize: 13,
    fontWeight: '800'
  },
  error: {
    color: colors.danger,
    fontWeight: '700'
  },
  bookRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  cover: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 46
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  bookInfo: {
    flex: 1,
    gap: 5
  },
  bookTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  bookMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  status: {
    backgroundColor: '#e3f1ed',
    borderRadius: 6,
    color: colors.accentDark,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 4,
    textTransform: 'uppercase'
  }
});
