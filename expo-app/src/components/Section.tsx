import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type Props = PropsWithChildren<{
  title: string;
  action?: string;
}>;

export function Section({ title, action, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {action ? <Text style={styles.action}>{action}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800'
  },
  action: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800'
  }
});
