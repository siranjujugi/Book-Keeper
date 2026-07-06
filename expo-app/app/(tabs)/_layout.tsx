import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { useSession } from '@/lib/auth';
import { colors } from '@/theme/colors';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  const { session, loading, supabaseReady } = useSession();

  if (!supabaseReady || loading || !session) {
    return <AuthScreen configMissing={!supabaseReady} loading={loading} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' }
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Library', tabBarIcon: tabIcon('library-outline') }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: tabIcon('scan-outline') }} />
      <Tabs.Screen name="import" options={{ title: 'Import', tabBarIcon: tabIcon('cloud-upload-outline') }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistant', tabBarIcon: tabIcon('sparkles-outline') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: tabIcon('stats-chart-outline') }} />
    </Tabs>
  );
}
