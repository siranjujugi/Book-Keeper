import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { colors } from '@/theme/colors';

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isbn, setIsbn] = useState<string | null>(null);

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
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={(result) => {
          if (result.data !== isbn) {
            setIsbn(result.data);
          }
        }}
      >
        <View style={styles.scanOverlay}>
          <Text style={styles.scanTitle}>Align the ISBN barcode</Text>
          <View style={styles.scanFrame} />
        </View>
      </CameraView>

      <View style={styles.bottomSheet}>
        <Section title="Detected ISBN">
          <Text style={styles.isbn}>{isbn ?? 'Waiting for barcode...'}</Text>
          <Pressable style={[styles.primaryButton, !isbn && styles.disabled]} disabled={!isbn}>
            <Ionicons name="sparkles-outline" color={colors.surface} size={18} />
            <Text style={styles.primaryButtonText}>Enrich with AI</Text>
          </Pressable>
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
  disabled: {
    opacity: 0.5
  }
});
