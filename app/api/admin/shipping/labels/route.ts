/**
 * POST /api/admin/shipping/labels
 * Body: { orderId, offerCode }
 * Non utilisé par l’UI admin ; gardé pour intégration future / usage interne (ex. Boxtal).
 * Crée une étiquette (MOCK) et optionnellement met à jour orders.
 * Protégé par X-Internal-Secret.
 * Si delivery_type === 'relay', pickup_point DOIT être non-null (sinon 400).
 */
import { NextRequest, NextResponse } from 'next/server'
import { assertInternalSecret } from '@/lib/internal-secret'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

type DeliveryType = 'home' | 'relay'

export async function POST(request: NextRequest) {
  try {
    await assertInternalSecret()
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number }
    return NextResponse.json(
      { error: e.message ?? 'Non autorisé' },
      { status: e.statusCode ?? 401 }
    )
  }

  let body: { orderId?: string; offerCode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : ''
  const offerCode = typeof body?.offerCode === 'string' ? body.offerCode.trim() : ''
  if (!orderId) {
    return NextResponse.json({ error: 'orderId manquant' }, { status: 400 })
  }
  if (!offerCode) {
    return NextResponse.json({ error: 'offerCode manquant' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data: draft, error: draftError } = await (supabase as any)
    .from('shipping_drafts')
    .select('order_id, delivery_type, pickup_point')
    .eq('order_id', orderId)
    .maybeSingle()

  if (draftError) {
    console.error('[POST /api/admin/shipping/labels]', draftError.message)
    return NextResponse.json(
      { error: draftError.message ?? 'Erreur lecture draft' },
      { status: 500 }
    )
  }

  if (!draft) {
    return NextResponse.json(
      { error: 'Brouillon d’expédition introuvable pour cette commande' },
      { status: 404 }
    )
  }

  const deliveryType = draft.delivery_type as DeliveryType | null
  if (deliveryType !== 'home' && deliveryType !== 'relay') {
    return NextResponse.json(
      { error: 'delivery_type invalide (attendu: home ou relay)' },
      { status: 400 }
    )
  }

  if (deliveryType === 'relay') {
    if (draft.pickup_point == null || typeof draft.pickup_point !== 'object') {
      return NextResponse.json(
        { error: 'Pour une livraison en point relais (relay), pickup_point est obligatoire et ne peut pas être vide.' },
        { status: 400 }
      )
    }
  }

  const trackingNumber = `MOCK-${Date.now()}-${orderId.slice(0, 8)}`
  const labelUrl = 'https://example.com/label/' + trackingNumber

  let warning: string | undefined
  let dbError: string | undefined

  const updatePayload: Record<string, unknown> = {
    shipping_tracking_number: trackingNumber,
    shipping_label_url: labelUrl,
    shipping_offer_code: offerCode,
    shipped_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)

  if (updateError) {
    const msg = updateError.message ?? ''
    const missingColumn = msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')
    if (missingColumn) {
      warning = 'Colonnes orders manquantes (ex: shipping_offer_code, shipped_at). Étiquette mock créée ; tracking/URL enregistrés si colonnes présentes.'
      dbError = msg
    } else {
      warning = 'Mise à jour commande échouée (étiquette mock créée).'
      dbError = msg
    }
    // Retry sans les colonnes optionnelles (seulement tracking + label_url qui existent souvent)
    const fallbackPayload: Record<string, unknown> = {
      shipping_tracking_number: trackingNumber,
      shipping_label_url: labelUrl,
    }
    const { error: fallbackError } = await supabase
      .from('orders')
      .update(fallbackPayload)
      .eq('id', orderId)
    if (!fallbackError) {
      warning = 'Étiquette enregistrée (tracking + URL) ; colonnes optionnelles (shipping_offer_code, shipped_at) absentes.'
      dbError = undefined
    }
  }

  return NextResponse.json({
    ok: true,
    orderId,
    offerCode,
    trackingNumber,
    labelUrl,
    ...(warning && { warning }),
    ...(dbError && { dbError }),
  })
}
