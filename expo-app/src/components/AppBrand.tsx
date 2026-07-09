import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  compact?: boolean;
};

export function AppBrand({ compact = false }: Props) {
  return (
    <View style={styles.root} accessibilityRole="header" accessibilityLabel="Book Keeper">
      <LogoMark size={compact ? 34 : 40} />
      <View style={styles.copy}>
        <Text style={styles.name}>Book Keeper</Text>
        {!compact ? <Text style={styles.tagline}>read To live</Text> : null}
      </View>
    </View>
  );
}

export function LogoMark({ size = 40 }: { size?: number }) {
  const pageWidth = Math.round(size * 0.31);
  const pageHeight = Math.round(size * 0.48);

  return (
    <View style={[styles.mark, { height: size, width: size, borderRadius: Math.round(size * 0.2) }]}>
      <View
        style={[
          styles.page,
          styles.leftPage,
          {
            height: pageHeight,
            width: pageWidth,
            borderRadius: Math.max(4, Math.round(size * 0.08)),
            left: Math.round(size * 0.18),
            top: Math.round(size * 0.28)
          }
        ]}
      />
      <View
        style={[
          styles.page,
          styles.rightPage,
          {
            height: pageHeight,
            width: pageWidth,
            borderRadius: Math.max(4, Math.round(size * 0.08)),
            right: Math.round(size * 0.18),
            top: Math.round(size * 0.28)
          }
        ]}
      />
      <View
        style={[
          styles.spine,
          {
            height: Math.round(size * 0.48),
            left: Math.round(size * 0.48),
            top: Math.round(size * 0.3)
          }
        ]}
      />
      <View
        style={[
          styles.accent,
          {
            height: Math.round(size * 0.17),
            right: Math.round(size * 0.05),
            top: Math.round(size * 0.06),
            width: Math.round(size * 0.17)
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    minHeight: 40
  },
  mark: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden'
  },
  page: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
    borderWidth: 2,
    position: 'absolute'
  },
  leftPage: {
    transform: [{ rotate: '-8deg' }]
  },
  rightPage: {
    transform: [{ rotate: '8deg' }]
  },
  spine: {
    backgroundColor: colors.accentDark,
    borderRadius: 99,
    position: 'absolute',
    width: 3
  },
  accent: {
    backgroundColor: colors.surface,
    borderColor: colors.gold,
    borderRadius: 2,
    borderWidth: 1.5,
    position: 'absolute'
  },
  copy: {
    gap: 1
  },
  name: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  tagline: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800'
  }
});
