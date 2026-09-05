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

// Requests can hang forever when a Navigator LockManager lock gets stuck
// (known supabase-js issue). Sessions are not persisted here, so the lock
// is unnecessary — bypass it with a no-op.
const noOpLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn();

// Never let a network call hang the UI — abort requests after 30s so the
// data layer can fall back to local storage. Works around browsers that do not
// support AbortSignal.timeout by using an AbortController instead.
const fetchWithTimeout: typeof fetch = (input, init) => {
  if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
    return fetch(input, { ...init, signal: (AbortSignal as any).timeout(30000) });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        lock: noOpLock,
      },
      global: { fetch: fetchWithTimeout },
    })
  : createNoopClient();

if (!isSupabaseConfigured && process.env.NODE_ENV === 'development') {
  console.warn(
    'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY (or REACT_APP_SUPABASE_ANON_KEY) in your .env.local file.'
  );
}
