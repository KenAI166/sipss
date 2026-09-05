import { Hono } from 'hono'
import { withSupabase } from '@supabase/server/adapters/hono'

// Ported from api/attendance.php — backed by the `attendance` table in Supabase
// Postgres (see server/schema.sql). All routes require a user JWT; ctx.supabase
// is RLS-scoped to that user.

const attendance = new Hono()
attendance.use('*', withSupabase({ auth: 'user' }))

const today = () => new Date().toISOString().slice(0, 10)
const nowTime = () => new Date().toTimeString().slice(0, 8)

function roleOf(ctx) {
  return ctx.userClaims?.app_metadata?.role ?? ctx.userClaims?.user_metadata?.role ?? 'staff'
}

// POST /attendance/time-in
attendance.post('/time-in', async (c) => {
  const { supabase, userClaims } = c.var.supabaseContext
  const userId = userClaims.sub

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today())
    .maybeSingle()

  if (existing) {
    return c.json({ success: false, message: 'You have already timed in today' }, 409)
  }

  const { error } = await supabase.from('attendance').insert({
    user_id: userId,
    date: today(),
    time_in: nowTime(),
    status: 'pending',
  })

  if (error) return c.json({ success: false, message: `Time in failed: ${error.message}` }, 500)
  return c.json({ success: true, message: 'Time in recorded' })
})

// POST /attendance/time-out
attendance.post('/time-out', async (c) => {
  const { supabase, userClaims } = c.var.supabaseContext
  const userId = userClaims.sub

  const { data: record } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today())
    .maybeSingle()

  if (!record) return c.json({ success: false, message: 'You have not timed in today' }, 400)
  if (record.time_out) {
    return c.json({ success: false, message: 'You have already timed out today' }, 409)
  }

  const timeOut = nowTime()
  const [ih, im, is] = record.time_in.split(':').map(Number)
  const [oh, om, os] = timeOut.split(':').map(Number)
  const totalHours = Math.round((((oh * 3600 + om * 60 + os) - (ih * 3600 + im * 60 + is)) / 3600) * 100) / 100

  const { error } = await supabase
    .from('attendance')
    .update({ time_out: timeOut, total_hours: totalHours, updated_at: new Date().toISOString() })
    .eq('id', record.id)

  if (error) return c.json({ success: false, message: `Time out failed: ${error.message}` }, 500)
  return c.json({ success: true, message: 'Time out recorded', total_hours: totalHours })
})

// GET /attendance?user_id=&date_from=&date_to=&page=&limit=
attendance.get('/', async (c) => {
  const { supabase, userClaims } = c.var.supabaseContext
  const isManager = ['owner', 'manager'].includes(roleOf(c.var.supabaseContext))

  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Number(c.req.query('limit') ?? 20))
  const from = (page - 1) * limit

  let query = supabase.from('attendance').select('*', { count: 'exact' })

  const userId = c.req.query('user_id')
  if (isManager && userId) query = query.eq('user_id', userId)
  if (!isManager) query = query.eq('user_id', userClaims.sub)

  const dateFrom = c.req.query('date_from')
  const dateTo = c.req.query('date_to')
  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)

  const { data, count, error } = await query
    .order('date', { ascending: false })
    .order('time_in', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({
    success: true,
    attendance: data,
    pagination: {
      total: count,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  })
})

// POST /attendance/status  { attendance_id, status }  — owner/manager only
attendance.post('/status', async (c) => {
  const ctx = c.var.supabaseContext
  const { supabase } = ctx
  if (!['owner', 'manager'].includes(roleOf(ctx))) {
    return c.json({ success: false, message: 'Insufficient permissions' }, 403)
  }

  const { attendance_id, status } = await c.req.json()
  if (!attendance_id || !['pending', 'approved', 'rejected'].includes(status)) {
    return c.json({ success: false, message: 'Invalid attendance_id or status' }, 400)
  }

  const { error } = await supabase
    .from('attendance')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', attendance_id)

  if (error) return c.json({ success: false, message: `Update failed: ${error.message}` }, 500)
  return c.json({ success: true })
})

// GET /attendance/summary?user_id=&period=week|month|year
attendance.get('/summary', async (c) => {
  const { supabase, userClaims } = c.var.supabaseContext
  const ctx = c.var.supabaseContext
  const isManager = ['owner', 'manager'].includes(roleOf(ctx))

  let userId = c.req.query('user_id') ?? userClaims.sub
  if (!isManager) userId = userClaims.sub

  const days = { week: 7, month: 30, year: 365 }[c.req.query('period') ?? 'month'] ?? 30
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('attendance')
    .select('total_hours')
    .eq('user_id', userId)
    .gte('date', since)

  if (error) return c.json({ success: false, message: error.message }, 500)

  const totalDays = data.length
  const totalHours = data.reduce((s, r) => s + (Number(r.total_hours) || 0), 0)
  return c.json({
    success: true,
    summary: {
      total_days: totalDays,
      total_hours: totalHours,
      avg_hours: totalDays ? Math.round((totalHours / totalDays) * 100) / 100 : 0,
    },
  })
})

export default attendance
