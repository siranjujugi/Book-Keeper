import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  compact?: boolean;
};

const logoSource = require('../../public/favicon.png');

export function AppBrand({ compact = false }: Props) {
  return (
    <View style={styles.root} accessibilityRole="header" accessibilityLabel="Book Keeper">
      <LogoMark size={compact ? 44 : 54} />
      <View style={styles.copy}>
        <Text style={styles.name}>Book Keeper</Text>
        {!compact ? <Text style={styles.tagline}>Read to live</Text> : null}
      </View>
    </View>
  );
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.mark, { height: size, width: size, borderRadius: Math.round(size * 0.2) }]}>
      <Image source={logoSource} resizeMode="contain" style={styles.markImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    minHeight: 54
  },
  mark: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 1,
    overflow: 'hidden'
  },
  markImage: {
    height: '100%',
    width: '100%'
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
