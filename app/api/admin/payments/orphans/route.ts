import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

async function ensureAdmin(request: NextRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const expectedKey = process.env.EMAIL_INTERNAL_KEY
  const providedKey = request.headers.get('x-internal-key')
  const internalKeyOk = !!expectedKey && !!providedKey && providedKey === expectedKey

  if (internalKeyOk) return { ok: true }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return { ok: false, status: 401, error: 'Unauthorized' }

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData?.user?.id) return { ok: false, status: 401, error: 'Unauthorized' }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  if (profileError || (profile as { role?: string })?.role !== 'admin') {
    return { ok: false, status: 403, error: 'Forbidden' }
  }
  return { ok: true }
}

/**
 * GET /api/admin/payments/orphans
 * Liste les payment_intents orphelins : captured sans order_id, ou failed.
 */
export async function GET(request: NextRequest) {
  const auth = await ensureAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  const [capturedNull, failed] = await Promise.all([
    supabase
      .from('payment_intents')
      .select('id, created_at, provider, paypal_order_id, status, order_id, payload, last_error, processed_at')
      .eq('status', 'captured')
      .is('order_id', null)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('payment_intents')
      .select('id, created_at, provider, paypal_order_id, status, order_id, payload, last_error, processed_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (capturedNull.error) {
    console.error('[GET /api/admin/payments/orphans]', capturedNull.error.message)
    return NextResponse.json({ error: capturedNull.error.message }, { status: 500 })
  }
  if (failed.error) {
    console.error('[GET /api/admin/payments/orphans]', failed.error.message)
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  const byId = new Map<string, (typeof capturedNull.data)[0]>()
  for (const row of capturedNull.data ?? []) {
    byId.set(row.id, row)
  }
  for (const row of failed.data ?? []) {
    byId.set(row.id, row)
  }
  const intents = Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return NextResponse.json({ intents })
}
