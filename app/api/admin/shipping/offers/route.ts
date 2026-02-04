/**
 * GET /api/admin/shipping/offers?orderId=...
 * Retourne les offres transporteurs (MOCK) pour une commande.
 * Non utilisé par l’UI admin ; gardé pour intégration future / usage interne (ex. Boxtal).
 * Protégé par X-Internal-Secret.
 * Si delivery_type === 'relay', pickup_point DOIT être non-null (sinon 400).
 */
import { NextRequest, NextResponse } from 'next/server'
import { assertInternalSecret } from '@/lib/internal-secret'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type DeliveryType = 'home' | 'relay'

const MOCK_OFFERS_HOME: { offer_code: string; label: string; price?: number }[] = [
  { offer_code: 'chronopost_home', label: 'Chronopost Domicile', price: 9.99 },
  { offer_code: 'colissimo_home', label: 'Colissimo Domicile', price: 6.99 },
  { offer_code: 'dpd_home', label: 'DPD Domicile', price: 7.49 },
]
const MOCK_OFFERS_RELAY: { offer_code: string; label: string; price?: number }[] = [
  { offer_code: 'chronopost_relay', label: 'Chronopost Relay', price: 5.99 },
  { offer_code: 'mondial_relay', label: 'Mondial Relay', price: 4.99 },
]

export async function GET(request: NextRequest) {
  try {
    await assertInternalSecret()
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number }
    return NextResponse.json(
      { error: e.message ?? 'Non autorisé' },
      { status: e.statusCode ?? 401 }
    )
  }

  const orderId = request.nextUrl.searchParams.get('orderId')?.trim() ?? ''
  if (!orderId) {
    return NextResponse.json({ error: 'orderId manquant' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data: draft, error: draftError } = await (supabase as any)
    .from('shipping_drafts')
    .select('order_id, delivery_type, pickup_point')
    .eq('order_id', orderId)
    .maybeSingle()

  if (draftError) {
    console.error('[GET /api/admin/shipping/offers]', draftError.message)
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

  const offers = deliveryType === 'relay' ? MOCK_OFFERS_RELAY : MOCK_OFFERS_HOME
  return NextResponse.json({
    orderId,
    deliveryType,
    offers,
  })
}
