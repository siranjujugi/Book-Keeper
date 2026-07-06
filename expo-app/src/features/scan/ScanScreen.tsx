import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { addBookToLibrary } from '@/lib/bookRepository';
import { fetchBookMetadataByIsbn } from '@/lib/isbnService';
import { BookMetadata, BookStatus } from '@/lib/types';
import { colors } from '@/theme/colors';

function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, '').toUpperCase();
}

function isLikelyIsbn(value: string) {
  const cleaned = normalizeIsbn(value);
  return cleaned.length === 10 || (cleaned.length === 13 && cleaned.startsWith('97'));
}

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isbn, setIsbn] = useState<string | null>(null);
  const [manualIsbn, setManualIsbn] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<{ data: string; type: string } | null>(null);
  const [status, setStatus] = useState('Point the camera at the ISBN barcode, not the front cover.');
  const [metadata, setMetadata] = useState<BookMetadata | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookStatus, setBookStatus] = useState<BookStatus>('unread');
  const [locationLabel, setLocationLabel] = useState('');

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    const rawData = String(result.data ?? '');
    const type = String(result.type ?? 'unknown');
    const cleaned = normalizeIsbn(rawData);
    setLastScan({ data: rawData, type });

    if (isLikelyIsbn(cleaned)) {
      setIsbn(cleaned);
      setManualIsbn(cleaned);
      setMetadata(null);
      setStatus('ISBN detected. Fetch details to review before saving.');
      return;
    }

    setStatus(`Scanned ${type}, but it does not look like an ISBN. Try the 978/979 barcode on the back cover.`);
  }

  function useManualIsbn() {
    const cleaned = normalizeIsbn(manualIsbn);
    if (isLikelyIsbn(cleaned)) {
      setIsbn(cleaned);
      setMetadata(null);
      setStatus('Manual ISBN accepted.');
    } else {
      setStatus('Enter a 10-digit ISBN or a 13-digit ISBN starting with 978 or 979.');
    }
  }

  async function fetchDetails() {
    if (!isbn) return;
    setFetching(true);
    setStatus('Fetching book details from ISBN...');
    try {
      const details = await fetchBookMetadataByIsbn(isbn);
      setMetadata(details);
      setStatus('Book details found. Review and save to your library.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not fetch book details.');
    } finally {
      setFetching(false);
    }
  }

  async function saveBook() {
    if (!metadata) return;
    setSaving(true);
    setStatus('Saving book to your library...');
    try {
      await addBookToLibrary(metadata, { status: bookStatus, location_label: locationLabel });
      setStatus('Book added to your library.');
      router.replace('/(tabs)');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save book.');
    } finally {
      setSaving(false);
    }
  }

  if (!permission?.granted) {
    return (
      <Screen>
        <View style={styles.emptyCamera}>
          <Ionicons name="camera-outline" color={colors.accent} size={42} />
          <Text style={styles.title}>Scan books from your phone.</Text>
          <Text style={styles.body}>Camera access lets Book Keeper detect ISBN barcodes and send images for AI-assisted metadata capture.</Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Enable Camera</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <CameraView
        style={styles.camera}
        facing="back"
        autofocus="on"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
        onCameraReady={() => {
          setCameraReady(true);
          setCameraError(null);
          setStatus('Camera ready. Hold the barcode steady inside the frame.');
        }}
        onMountError={(event) => {
          setCameraError(event.message);
          setStatus('Camera failed to start.');
        }}
      >
        <View style={styles.scanOverlay}>
          <Text style={styles.scanTitle}>{cameraReady ? 'Align the ISBN barcode' : 'Starting camera...'}</Text>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Use the barcode that starts with 978 or 979.</Text>
        </View>
      </CameraView>

      <View style={styles.bottomSheet}>
        <Section title="Detected ISBN">
          <Text style={[styles.status, cameraError && styles.errorText]}>{cameraError ?? status}</Text>
          {lastScan ? (
            <Text style={styles.lastScan}>Last scan: {lastScan.data} ({lastScan.type})</Text>
          ) : null}
          <Text style={styles.isbn}>{isbn ?? 'Waiting for barcode...'}</Text>
          <View style={styles.manualRow}>
            <TextInput
              value={manualIsbn}
              onChangeText={setManualIsbn}
              placeholder="Enter ISBN manually"
              placeholderTextColor={colors.muted}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="characters"
              style={styles.manualInput}
            />
            <Pressable style={styles.secondaryButton} onPress={useManualIsbn}>
              <Text style={styles.secondaryButtonText}>Use</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.primaryButton, (!isbn || fetching) && styles.disabled]} disabled={!isbn || fetching} onPress={fetchDetails}>
            <Ionicons name="cloud-download-outline" color={colors.surface} size={18} />
            <Text style={styles.primaryButtonText}>{fetching ? 'Fetching...' : 'Fetch Book Details'}</Text>
          </Pressable>
          {metadata ? (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.cover}>
                  {metadata.cover_url ? <Image source={{ uri: metadata.cover_url }} style={styles.coverImage} /> : <Ionicons name="book-outline" color={colors.accent} size={28} />}
                </View>
                <View style={styles.reviewText}>
                  <Text style={styles.bookTitle}>{metadata.title}</Text>
                  {metadata.subtitle ? <Text style={styles.bookSubtitle}>{metadata.subtitle}</Text> : null}
                  <Text style={styles.bookMeta}>{metadata.authors.join(', ') || 'Unknown author'}</Text>
                  <Text style={styles.bookMeta}>{[metadata.publisher, metadata.published_year, metadata.language].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
              {metadata.description ? <Text numberOfLines={4} style={styles.description}>{metadata.description}</Text> : null}
              <View style={styles.statusChoice}>
                <Pressable style={[styles.choice, bookStatus === 'unread' && styles.choiceActive]} onPress={() => setBookStatus('unread')}>
                  <Text style={[styles.choiceText, bookStatus === 'unread' && styles.choiceTextActive]}>Not reading now</Text>
                </Pressable>
                <Pressable style={[styles.choice, bookStatus === 'reading' && styles.choiceActive]} onPress={() => setBookStatus('reading')}>
                  <Text style={[styles.choiceText, bookStatus === 'reading' && styles.choiceTextActive]}>Currently reading</Text>
                </Pressable>
              </View>
              <TextInput
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder="Shelf/location, optional"
                placeholderTextColor={colors.muted}
                style={styles.manualInput}
              />
              <Pressable style={[styles.primaryButton, saving && styles.disabled]} disabled={saving} onPress={saveBook}>
                <Ionicons name="add-circle-outline" color={colors.surface} size={18} />
                <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Add to Library'}</Text>
              </Pressable>
            </View>
          ) : null}
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCamera: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
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
  camera: {
    flex: 1
  },
  scanOverlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28
  },
  scanTitle: {
    backgroundColor: 'rgba(31, 41, 51, 0.74)',
    borderRadius: 8,
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 18,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  scanHint: {
    backgroundColor: 'rgba(31, 41, 51, 0.74)',
    borderRadius: 8,
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center'
  },
  scanFrame: {
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 3,
    height: 150,
    width: '100%'
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 20
  },
  isbn: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  status: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  lastScan: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800'
  },
  errorText: {
    color: colors.danger
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8
  },
  manualInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12
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
  reviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 12
  },
  cover: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    height: 88,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 60
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  reviewText: {
    flex: 1,
    gap: 4
  },
  bookTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  bookSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  bookMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700'
  },
  description: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19
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
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  choiceActive: {
    backgroundColor: '#edf7f4',
    borderColor: colors.accent
  },
  choiceText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center'
  },
  choiceTextActive: {
    color: colors.accentDark
  }
});
