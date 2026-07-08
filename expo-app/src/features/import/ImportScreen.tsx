import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { addBookToLibrary } from '@/lib/bookRepository';
import { fetchBookMetadataByIsbn } from '@/lib/isbnService';
import { ImportCandidate, parseImportText } from '@/lib/importParser';
import { BookStatus } from '@/lib/types';
import { colors } from '@/theme/colors';

type ImportResult = {
  isbn: string;
  status: 'added' | 'skipped' | 'failed';
  message: string;
};

const example = `isbn,location,status
9780593230251,Shelf A1,unread
9780135957059,Shelf A1,reading`;

export function ImportScreen() {
  const [input, setInput] = useState('');
  const [defaultStatus, setDefaultStatus] = useState<BookStatus>('unread');
  const [defaultLocation, setDefaultLocation] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ImportResult[]>([]);
  const stopRef = useRef(false);

  const parsed = useMemo(
    () => parseImportText(input, { status: defaultStatus, location_label: defaultLocation || null }),
    [defaultLocation, defaultStatus, input]
  );

  async function processCandidate(candidate: ImportCandidate): Promise<ImportResult> {
    try {
      const metadata = await fetchBookMetadataByIsbn(candidate.isbn);
      await addBookToLibrary(metadata, {
        status: candidate.status ?? defaultStatus,
        location_label: candidate.location_label ?? defaultLocation
      });
      return { isbn: candidate.isbn, status: 'added', message: metadata.title };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        isbn: candidate.isbn,
        status: message.includes('already in your library') ? 'skipped' : 'failed',
        message
      };
    }
  }

  async function startImport() {
    stopRef.current = false;
    setProcessing(true);
    setResults([]);
    setProgress({ done: 0, total: parsed.candidates.length });

    const nextResults: ImportResult[] = [];

    for (const candidate of parsed.candidates) {
      if (stopRef.current) break;
      const result = await processCandidate(candidate);
      nextResults.push(result);
      setResults([...nextResults]);
      setProgress({ done: nextResults.length, total: parsed.candidates.length });
    }

    setProcessing(false);
  }

  function stopImport() {
    stopRef.current = true;
  }

  const added = results.filter((result) => result.status === 'added').length;
  const skipped = results.filter((result) => result.status === 'skipped').length;
  const failed = results.filter((result) => result.status === 'failed').length;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Bulk Import</Text>
        <Text style={styles.title}>Paste ISBNs from a scanner app.</Text>
        <Text style={styles.body}>Use one ISBN per line, or CSV with columns: isbn, location, status.</Text>
      </View>

      <Section title="Defaults">
        <TextInput
          value={defaultLocation}
          onChangeText={setDefaultLocation}
          placeholder="Default shelf/location, optional"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <View style={styles.statusChoice}>
          {(['unread', 'reading', 'completed'] as BookStatus[]).map((status) => (
            <Pressable key={status} style={[styles.choice, defaultStatus === status && styles.choiceActive]} onPress={() => setDefaultStatus(status)}>
              <Text style={[styles.choiceText, defaultStatus === status && styles.choiceTextActive]}>
                {status === 'unread' ? 'Not reading' : status === 'reading' ? 'Reading' : 'Already read'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="ISBN Input" action={`${parsed.candidates.length} ready`}>
        <TextInput
          value={input}
          onChangeText={setInput}
          multiline
          placeholder={example}
          placeholderTextColor={colors.muted}
          style={styles.textArea}
          autoCapitalize="characters"
        />
        <View style={styles.summary}>
          <Text style={styles.summaryText}>Valid: {parsed.candidates.length}</Text>
          <Text style={styles.summaryText}>Duplicate lines: {parsed.duplicates.length}</Text>
          <Text style={styles.summaryText}>Rejected: {parsed.rejected.length}</Text>
        </View>
        {parsed.rejected.length > 0 ? (
          <Text style={styles.warning}>Some rows do not look like ISBN-10 or ISBN-13 values and will be skipped.</Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, (processing || parsed.candidates.length === 0) && styles.disabled]}
            disabled={processing || parsed.candidates.length === 0}
            onPress={startImport}
          >
            <Ionicons name="cloud-upload-outline" color={colors.surface} size={18} />
            <Text style={styles.primaryButtonText}>{processing ? 'Importing...' : 'Start Import'}</Text>
          </Pressable>
          {processing ? (
            <Pressable style={styles.secondaryButton} onPress={stopImport}>
              <Text style={styles.secondaryButtonText}>Stop</Text>
            </Pressable>
          ) : null}
        </View>
      </Section>

      <Section title="Progress" action={`${progress.done}/${progress.total}`}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }]} />
        </View>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>Added: {added}</Text>
          <Text style={styles.summaryText}>Skipped: {skipped}</Text>
          <Text style={styles.summaryText}>Failed: {failed}</Text>
        </View>
        {results.slice(-20).reverse().map((result) => (
          <View key={`${result.isbn}-${result.status}-${result.message}`} style={styles.resultRow}>
            <Text style={styles.resultIsbn}>{result.isbn}</Text>
            <Text style={[styles.resultStatus, result.status === 'failed' && styles.failed, result.status === 'skipped' && styles.skipped]}>
              {result.status}
            </Text>
            <Text numberOfLines={2} style={styles.resultMessage}>{result.message}</Text>
          </View>
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
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
    lineHeight: 36
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12
  },
  textArea: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    minHeight: 180,
    padding: 12,
    textAlignVertical: 'top'
  },
  statusChoice: {
    flexDirection: 'row',
    gap: 8
  },
  choice: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  choiceActive: {
    backgroundColor: '#edf7f4',
    borderColor: colors.accent
  },
  choiceText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center'
  },
  choiceTextActive: {
    color: colors.accentDark
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  summaryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  warning: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '900'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900'
  },
  disabled: {
    opacity: 0.5
  },
  progressBar: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden'
  },
  progressFill: {
    backgroundColor: colors.accent,
    height: '100%'
  },
  resultRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 10
  },
  resultIsbn: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900'
  },
  resultStatus: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  failed: {
    color: colors.danger
  },
  skipped: {
    color: colors.gold
  },
  resultMessage: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  }
});
