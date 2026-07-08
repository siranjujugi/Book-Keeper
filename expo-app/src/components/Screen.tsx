import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { AppBrand } from '@/components/AppBrand';
import { colors } from '@/theme/colors';

type Props = PropsWithChildren<{
  scroll?: boolean;
  showBrand?: boolean;
  style?: ViewStyle;
}>;

export function Screen({ children, scroll = true, showBrand = true, style }: Props) {
  if (!scroll) {
    return (
      <SafeAreaView style={[styles.root, style]}>
        {showBrand ? (
          <SafeAreaView style={styles.fixedHeader}>
            <AppBrand compact />
          </SafeAreaView>
        ) : null}
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, style]}>
        {showBrand ? <AppBrand /> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20,
    gap: 16
  },
  fixedHeader: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12
  }
});
