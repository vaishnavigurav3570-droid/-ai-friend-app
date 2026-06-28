// ============================================
// Antigravity — Supabase Client (Mobile)
// ============================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qczgamskzpqzmdxiapty.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjemdhbXNrenBxem1keGlhcHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTgxMjIsImV4cCI6MjA5Nzg3NDEyMn0.HIc15R6WTfUChi8107gcsz-42kvrRFpZoWzsIk1yPmw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Get current access token for API calls */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

/** Sign in with email/password */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Sign up with email/password */
export async function signUp(email: string, password: string, displayName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
}

/** Sign out */
export async function signOut() {
  return supabase.auth.signOut();
}
