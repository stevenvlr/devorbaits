import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createOrderAction } from '@/app/actions/create-order'
import { sendNewOrderNotification } from '@/lib/telegram-notifications'

export const runtime = 'edge'

type PayPalOrderPayload = {
  reference: string
  items: Array<{
    product_id: string
    variant_id?: string
    quantity: number
    price: number
    arome?: string
    taille?: string
    couleur?: string
    diametre?: string
    conditionnement?: string
    produit?: string
  }>
  total: number
  shippingCost?: number
  deliveryType: 'relay' | 'home' | 'pickup_wavignies' | 'pickup_apb'
  pickupPoint: {
    id: string
    network?: string
    name?: string
    address1: string
    address2?: string
    zip: string
    city: string
    country_code: string
  } | null
  userId?: string
  retraitMode?: string
  comment?: string
  customerName?: string
  customerEmail?: string
}

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
 * POST /api/admin/payments/replay
 * Body: { intentId: string } | { paypal_order_id: string }
 * Rejoue la création de commande depuis le payload de l'intent. Idempotent : si order_id déjà rempli, ne recrée pas.
 */
export async function POST(request: NextRequest) {
  const auth = await ensureAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
  }

  let body: { intentId?: string; paypal_order_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const intentId = typeof body?.intentId === 'string' ? body.intentId.trim() : ''
  const paypalOrderId = typeof body?.paypal_order_id === 'string' ? body.paypal_order_id.trim() : ''
  if (!intentId && !paypalOrderId) {
    return NextResponse.json(
      { error: 'Champ "intentId" ou "paypal_order_id" obligatoire' },
      { status: 400 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  const q = supabase
    .from('payment_intents')
    .select('id, order_id, payload, paypal_order_id, status')
  if (intentId) {
    q.eq('id', intentId)
  } else {
    q.eq('paypal_order_id', paypalOrderId)
  }
  const { data: intent, error: fetchError } = await q.maybeSingle()

  if (fetchError || !intent) {
    return NextResponse.json(
      { error: fetchError?.message || 'Intent introuvable' },
      { status: 404 }
    )
  }

  if (intent.order_id) {
    return NextResponse.json({
      ok: true,
      message: 'Commande déjà créée (idempotence)',
      orderId: intent.order_id,
    })
  }

  const payload = intent.payload as PayPalOrderPayload | null
  if (!payload?.reference || !Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json(
      { error: 'Payload invalide ou vide' },
      { status: 400 }
    )
  }

  const pickupPoint = payload.pickupPoint
    ? {
        id: payload.pickupPoint.id,
        network: payload.pickupPoint.network ?? '',
        name: payload.pickupPoint.name ?? '',
        address1: payload.pickupPoint.address1,
        address2: payload.pickupPoint.address2,
        zip: payload.pickupPoint.zip,
        city: payload.pickupPoint.city,
        country_code: payload.pickupPoint.country_code,
      }
    : null

  const result = await createOrderAction({
    userId: payload.userId ?? undefined,
    reference: payload.reference,
    total: payload.total ?? 0,
    items: payload.items,
    paymentMethod: 'paypal',
    shippingCost: typeof payload.shippingCost === 'number' ? payload.shippingCost : undefined,
    comment: payload.comment?.trim() || undefined,
    retraitModeForLog: payload.retraitMode ?? null,
    deliveryType: payload.deliveryType,
    pickupPoint,
  })

  if (!result.ok) {
    await supabase
      .from('payment_intents')
      .update({
        status: 'failed',
        last_error: result.error,
        processed_at: new Date().toISOString(),
      })
      .eq('id', intent.id)
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  await supabase
    .from('payment_intents')
    .update({
      status: 'captured',
      order_id: result.order.id,
      processed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', intent.id)

  try {
    const orderTotal = typeof result.order.total === 'number' ? result.order.total : payload.total ?? 0
    await sendNewOrderNotification({
      reference: payload.reference,
      total: orderTotal,
      itemCount: payload.items.length,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      shippingCost: payload.shippingCost,
      retraitMode: payload.retraitMode,
      items: payload.items.map((i) => ({
        produit: i.produit,
        quantity: i.quantity,
        price: i.price,
        arome: i.arome,
        taille: i.taille,
        couleur: i.couleur,
        diametre: i.diametre,
        conditionnement: i.conditionnement,
      })),
    })
  } catch (telegramErr) {
    console.warn('⚠️ Notification Telegram (replay):', telegramErr)
  }

  return NextResponse.json({
    ok: true,
    orderId: result.order.id,
    reference: result.order.reference,
  })
}
