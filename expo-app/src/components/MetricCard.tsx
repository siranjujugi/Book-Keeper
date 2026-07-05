import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  label: string;
  value: string | number;
  tone?: 'green' | 'gold' | 'blue';
};

export function MetricCard({ label, value, tone = 'green' }: Props) {
  return (
    <View style={[styles.card, styles[tone]]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 92,
    padding: 14
  },
  green: {
    backgroundColor: '#edf7f4',
    borderColor: '#c7e4dc'
  },
  gold: {
    backgroundColor: '#fff5df',
    borderColor: '#ead3a3'
  },
  blue: {
    backgroundColor: '#eef4ff',
    borderColor: '#cbd9f2'
  },
  value: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900'
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6
  }
});
