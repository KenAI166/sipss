import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { withSupabase } from '@supabase/server/adapters/hono'
import attendance from './routes/attendance.js'

const app = new Hono()

// Enable CORS first so it applies to all routes, including /attendance.
// Set CORS_ORIGIN to your Vercel frontend URL for production; otherwise all origins are allowed.
app.use('*', cors({ origin: process.env.CORS_ORIGIN ?? '*' }))

app.route('/attendance', attendance)

// Public route — no auth
app.get('/health', (c) => c.json({ status: 'ok' }))

// User-authenticated route — requires a valid user JWT
// (Authorization: Bearer <access_token>)
app.get('/me', withSupabase({ auth: 'user' }), async (c) => {
  const { userClaims } = c.var.supabaseContext
  return c.json({ user: userClaims })
})

// Publishable-key route — validates the apikey header against the
// 'default' publishable key; client is anonymous (RLS still applies)
app.get('/catalog', withSupabase({ auth: 'publishable' }), async (c) => {
  const { supabase } = c.var.supabaseContext
  const { data, error } = await supabase.from('products').select()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// Admin route — requires the secret key in the apikey header;
// supabaseAdmin bypasses RLS
app.get('/admin/users', withSupabase({ auth: 'secret' }), async (c) => {
  const { supabaseAdmin } = c.var.supabaseContext
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`)
})
