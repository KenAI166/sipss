import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey =
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

function createNoopClient(): SupabaseClient {
  return new Proxy({} as any, {
    get: () => {
      throw new Error('Supabase is not configured. Check your .env.local variables.');
    },
  }) as SupabaseClient;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createNoopClient();

if (!isSupabaseConfigured && process.env.NODE_ENV === 'development') {
  console.warn(
    'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY (or REACT_APP_SUPABASE_ANON_KEY) in your .env.local file.'
  );
}
