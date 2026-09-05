// Creates the two application users in Supabase Auth and mirrors them into
// public.profiles. Run with:  node scripts/create-users.js
// Uses the service/secret key from .env — never expose this key to the client.
import 'dotenv/config'

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env')
  process.exit(1)
}

// Change these credentials before running in production.
const USERS = [
  {
    username: 'admin',
    email: 'admin@sipstation.com',
    password: 'Admin@2026',
    full_name: 'CEO / Administrator',
    role: 'owner', // CEO — full access
  },
  {
    username: 'manager',
    email: 'manager@sipstation.com',
    password: 'Manager@2026',
    full_name: 'Store Manager',
    role: 'manager', // manager — covers barista + cashier operations
  },
]

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  'Content-Type': 'application/json',
}

async function createAuthUser(u) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: u.email,
      password: u.password,
      email_confirm: true,
      app_metadata: { role: u.role, username: u.username },
      user_metadata: { full_name: u.full_name },
    }),
  })
  const body = await res.json()
  if (!res.ok) {
    // User may already exist — look them up and just fix the role claim.
    if (res.status === 422 || /already/i.test(body.msg ?? body.message ?? '')) {
      const list = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers }).then(r => r.json())
      const existing = (list.users ?? []).find(x => x.email === u.email)
      if (existing) {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ app_metadata: { ...existing.app_metadata, role: u.role, username: u.username } }),
        })
        return existing
      }
    }
    throw new Error(`createUser ${u.email}: ${res.status} ${JSON.stringify(body)}`)
  }
  return body
}

async function upsertProfile(u, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id,
      username: u.username,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
    }),
  })
  if (!res.ok) throw new Error(`upsertProfile ${u.email}: ${res.status} ${await res.text()}`)
}

for (const u of USERS) {
  const user = await createAuthUser(u)
  await upsertProfile(u, user.id)
  console.log(`${u.role.padEnd(7)} ${u.username} (${u.email}) -> ${user.id}`)
}
console.log('Done.')
