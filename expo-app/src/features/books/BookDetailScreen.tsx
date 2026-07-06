import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { deleteBook, getBook, updateBookMetadata, updateBookStatus } from '@/lib/bookRepository';
import { Book, BookStatus } from '@/lib/types';
import { colors } from '@/theme/colors';

const statusOptions: { value: BookStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'unread', label: 'Unread', icon: 'book-outline' },
  { value: 'reading', label: 'Reading', icon: 'reader-outline' },
  { value: 'completed', label: 'Read', icon: 'checkmark-circle-outline' },
  { value: 'loaned', label: 'Loaned', icon: 'person-outline' }
];

type EditForm = {
  title: string;
  subtitle: string;
  authors: string;
  isbn_13: string;
  isbn_10: string;
  publisher: string;
  published_year: string;
  language: string;
  page_count: string;
  description: string;
  cover_url: string;
  location_label: string;
  rating: string;
  tags: string;
};

function formFromBook(book: Book): EditForm {
  return {
    title: book.title ?? '',
    subtitle: book.subtitle ?? '',
    authors: book.authors?.join('; ') ?? '',
    isbn_13: book.isbn_13 ?? '',
    isbn_10: book.isbn_10 ?? '',
    publisher: book.publisher ?? '',
    published_year: book.published_year ? String(book.published_year) : '',
    language: book.language ?? '',
    page_count: book.page_count ? String(book.page_count) : '',
    description: book.description ?? '',
    cover_url: book.cover_url ?? '',
    location_label: book.location_label ?? '',
    rating: book.rating ? String(book.rating) : '',
    tags: book.tags?.join('; ') ?? ''
  };
}

function splitList(value: string) {
  return value.split(';').map((item) => item.trim()).filter(Boolean);
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) throw new Error(`"${value}" is not a valid number.`);
  return parsed;
}

function parseOptionalRating(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) throw new Error('Rating must be between 0 and 5.');
  return parsed;
}

export function BookDetailScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<BookStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) return;

    getBook(bookId)
      .then(setBook)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    if (book && !editing) {
      setForm(formFromBook(book));
    }
  }, [book, editing]);

  async function onStatusChange(status: BookStatus) {
    if (!book || status === book.status || savingStatus) return;

    const previous = book;
    setSavingStatus(status);
    setError(null);
    setBook({ ...book, status });

    try {
      await updateBookStatus(book.id, status);
    } catch (err) {
      setBook(previous);
      setError(err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setSavingStatus(null);
    }
  }

  function updateForm(key: keyof EditForm, value: string) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function onStartEdit() {
    if (!book) return;
    setError(null);
    setForm(formFromBook(book));
    setEditing(true);
  }

  function onCancelEdit() {
    if (book) setForm(formFromBook(book));
    setEditing(false);
    setError(null);
  }

  async function onSaveMetadata() {
    if (!book || !form || savingMetadata) return;

    setSavingMetadata(true);
    setError(null);

    try {
      const updated = await updateBookMetadata(book.id, {
        title: form.title,
        subtitle: form.subtitle,
        authors: splitList(form.authors),
        isbn_13: form.isbn_13,
        isbn_10: form.isbn_10,
        publisher: form.publisher,
        published_year: parseOptionalInteger(form.published_year),
        language: form.language,
        page_count: parseOptionalInteger(form.page_count),
        description: form.description,
        cover_url: form.cover_url,
        location_label: form.location_label,
        rating: parseOptionalRating(form.rating),
        tags: splitList(form.tags)
      });
      setBook(updated);
      setForm(formFromBook(updated));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save book details.');
    } finally {
      setSavingMetadata(false);
    }
  }

  function onDeleteBook() {
    if (!book || deleting) return;

    Alert.alert(
      'Delete book?',
      `Remove "${book.title}" from your library? This also removes its notes, tags, loans, and reading logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setError(null);
            try {
              await deleteBook(book.id);
              router.replace('/(tabs)');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not delete book.');
              setDeleting(false);
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!book) {
    return (
      <Screen>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={colors.ink} size={20} />
          <Text style={styles.backText}>Library</Text>
        </Pressable>
        <Text style={styles.error}>{error ?? 'Book not found.'}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={colors.ink} size={20} />
          <Text style={styles.backText}>Library</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.cover}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.coverImage} />
            ) : (
              <Ionicons name="book-outline" color={colors.accent} size={44} />
            )}
          </View>
          <View style={styles.heroText}>
            <View style={styles.heroActions}>
              <Text style={styles.eyebrow}>{book.status}</Text>
              <Pressable style={styles.editButton} onPress={editing ? onCancelEdit : onStartEdit}>
                <Ionicons name={editing ? 'close-outline' : 'create-outline'} color={colors.accent} size={18} />
                <Text style={styles.editButtonText}>{editing ? 'Cancel' : 'Edit'}</Text>
              </Pressable>
            </View>
            {editing && form ? (
              <View style={styles.editStack}>
                <Field label="Title" value={form.title} onChangeText={(value) => updateForm('title', value)} />
                <Field label="Subtitle" value={form.subtitle} onChangeText={(value) => updateForm('subtitle', value)} />
                <Field label="Authors" value={form.authors} onChangeText={(value) => updateForm('authors', value)} helper="Separate multiple authors with semicolons." />
              </View>
            ) : (
              <>
                <Text style={styles.title}>{book.title}</Text>
                {book.subtitle ? <Text style={styles.subtitle}>{book.subtitle}</Text> : null}
                <Text style={styles.authors}>{book.authors?.join(', ') || 'Unknown author'}</Text>
              </>
            )}
          </View>
        </View>

        <Section title="Reading Status">
          <View style={styles.statusGrid}>
            {statusOptions.map((option) => {
              const active = book.status === option.value;
              const saving = savingStatus === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.statusButton, active && styles.statusButtonActive]}
                  onPress={() => onStatusChange(option.value)}
                  disabled={Boolean(savingStatus)}
                >
                  {saving ? (
                    <ActivityIndicator color={active ? colors.surface : colors.accent} />
                  ) : (
                    <Ionicons name={option.icon} color={active ? colors.surface : colors.accent} size={20} />
                  )}
                  <Text style={[styles.statusText, active && styles.statusTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Section>

        <Section title="Details">
          {editing && form ? (
            <View style={styles.editStack}>
              <View style={styles.fieldRow}>
                <Field label="ISBN-13" value={form.isbn_13} onChangeText={(value) => updateForm('isbn_13', value)} />
                <Field label="ISBN-10" value={form.isbn_10} onChangeText={(value) => updateForm('isbn_10', value)} />
              </View>
              <Field label="Publisher" value={form.publisher} onChangeText={(value) => updateForm('publisher', value)} />
              <View style={styles.fieldRow}>
                <Field label="Year" value={form.published_year} onChangeText={(value) => updateForm('published_year', value)} keyboardType="number-pad" />
                <Field label="Pages" value={form.page_count} onChangeText={(value) => updateForm('page_count', value)} keyboardType="number-pad" />
              </View>
              <View style={styles.fieldRow}>
                <Field label="Language" value={form.language} onChangeText={(value) => updateForm('language', value)} />
                <Field label="Rating" value={form.rating} onChangeText={(value) => updateForm('rating', value)} keyboardType="decimal-pad" />
              </View>
              <Field label="Shelf" value={form.location_label} onChangeText={(value) => updateForm('location_label', value)} />
              <Field label="Cover URL" value={form.cover_url} onChangeText={(value) => updateForm('cover_url', value)} />
            </View>
          ) : (
            <View style={styles.detailGrid}>
              <Detail label="ISBN-13" value={book.isbn_13} />
              <Detail label="ISBN-10" value={book.isbn_10} />
              <Detail label="Publisher" value={book.publisher} />
              <Detail label="Year" value={book.published_year ? String(book.published_year) : null} />
              <Detail label="Language" value={book.language} />
              <Detail label="Pages" value={book.page_count ? String(book.page_count) : null} />
              <Detail label="Shelf" value={book.location_label} />
              <Detail label="Rating" value={book.rating ? `${book.rating}/5` : null} />
            </View>
          )}
        </Section>

        {editing && form ? (
          <Section title="Tags">
            <Field label="Tags" value={form.tags} onChangeText={(value) => updateForm('tags', value)} helper="Separate multiple tags with semicolons." />
          </Section>
        ) : book.tags?.length ? (
          <Section title="Tags">
            <View style={styles.tags}>
              {book.tags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}
            </View>
          </Section>
        ) : null}

        {editing && form ? (
          <Section title="Notes">
            <Field label="Description" value={form.description} onChangeText={(value) => updateForm('description', value)} multiline />
            <View style={styles.saveRow}>
              <Pressable style={styles.secondaryButton} onPress={onCancelEdit} disabled={savingMetadata}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={onSaveMetadata} disabled={savingMetadata}>
                {savingMetadata ? <ActivityIndicator color={colors.surface} /> : <Ionicons name="save-outline" color={colors.surface} size={18} />}
                <Text style={styles.primaryButtonText}>Save Details</Text>
              </Pressable>
            </View>
          </Section>
        ) : book.description ? (
          <Section title="Notes">
            <Text style={styles.description}>{book.description}</Text>
          </Section>
        ) : null}

        {!editing ? (
          <Section title="Danger Zone">
            <Pressable style={styles.deleteButton} onPress={onDeleteBook} disabled={deleting}>
              {deleting ? <ActivityIndicator color={colors.danger} /> : <Ionicons name="trash-outline" color={colors.danger} size={18} />}
              <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Book'}</Text>
            </Pressable>
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not set'}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  helper,
  multiline,
  keyboardType
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helper?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.muted}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 24
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4
  },
  backText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  hero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16
  },
  cover: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 150,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 106
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  heroText: {
    flex: 1,
    gap: 7
  },
  heroActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f1ed',
    borderRadius: 6,
    color: colors.accentDark,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 4,
    textTransform: 'uppercase'
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 31
  },
  subtitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21
  },
  authors: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  editButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900'
  },
  editStack: {
    gap: 12
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10
  },
  field: {
    flex: 1,
    gap: 6
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  fieldInputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  fieldHelper: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statusButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12
  },
  statusButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  statusText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  statusTextActive: {
    color: colors.surface
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  detail: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    gap: 5,
    padding: 12
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  detailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  description: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21
  },
  saveRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end'
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderColor: '#ffd6d6',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900'
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800'
  }
});
