// Supabase-backed authentication + role-based access control.
// Roles: 'owner' (CEO/admin — full access) and 'manager' (operations:
// covers cashier/POS and barista/inventory duties). The authoritative role
// is the app_metadata.role JWT claim set server-side; profiles.role is
// only a display mirror.
import { supabase, isSupabaseConfigured } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export type Role = 'owner' | 'manager';

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: Role;
  photo_path?: string | null;
}

// Views only the owner (CEO) may access. Managers get everything else.
const OWNER_ONLY_VIEWS = ['payroll', 'staff'] as const;

export function canAccess(role: Role, view: string): boolean {
  if (role === 'owner') return true;
  return !(OWNER_ONLY_VIEWS as readonly string[]).includes(view);
}

export function allowedViews(role: Role): string[] {
  const all = [
    'dashboard', 'pos', 'products', 'inventory', 'ingredients', 'recipes',
    'suppliers', 'stock-transactions', 'sales', 'attendance', 'schedule',
    'payroll', 'expenses', 'staff',
  ];
  return all.filter((v) => canAccess(role, v));
}

function roleFrom(user: User): Role | null {
  const role = user.app_metadata?.role;
  return role === 'owner' || role === 'manager' ? role : null;
}

async function toAuthUser(user: User): Promise<AuthUser> {
  const role = roleFrom(user);
  if (!role) {
    await supabase.auth.signOut();
    throw new Error('This account has no assigned role. Contact the administrator.');
  }

  // Mirror display info from public.profiles when available.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    throw new Error('This account has been deactivated.');
  }

  return {
    id: user.id,
    username: profile?.username ?? user.app_metadata?.username ?? user.email ?? '',
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? '',
    email: user.email ?? '',
    role,
  };
}

// Login accepts a username or an email. Usernames resolve to the
// @sipstation.com domain used by the seed script.
export async function signIn(usernameOrEmail: string, password: string): Promise<AuthUser> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Check your .env.local variables.');
  }
  const login = usernameOrEmail.trim();
  const email = login.includes('@') ? login : `${login}@sipstation.com`;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    // Generic message — never reveal which credential was wrong.
    console.warn('[auth] sign-in failed:', error?.message, '| tried email:', email);
    throw new Error('Invalid username or password');
  }
  return toAuthUser(data.user);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    try {
      return await toAuthUser(session.user);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export function onAuthChange(callback: (user: AuthUser | null) => void) {
  if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe() {} } } };
  return supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
    if (!session?.user) return callback(null);
    try {
      callback(await toAuthUser(session.user));
    } catch {
      callback(null);
    }
  });
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}
