import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase, supabaseReady } from '@/lib/supabase';

const authCallbackPath = 'auth/callback';

export function getAuthRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/${authCallbackPath}`;
  }

  return Linking.createURL(authCallbackPath);
}

export async function handleAuthCallback(url: string | null) {
  if (!url || !supabaseReady) {
    return;
  }

  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : undefined;

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseReady);

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    Linking.getInitialURL().then(handleAuthCallback);

    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthCallback(url);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      urlSubscription.remove();
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, supabaseReady };
}

export async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: Platform.OS !== 'web'
    }
  });

  if (error) {
    throw error;
  }

  if (Platform.OS !== 'web' && data.url) {
    await Linking.openURL(data.url);
  }
}

export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl()
    }
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}
