// ============================================
// Antigravity Backend — Supabase Client
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/** Admin client with service role key — bypasses RLS */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/** Create a user-scoped client from a JWT — respects RLS */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
