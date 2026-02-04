'use server'

/**
 * Server Actions pour l’admin expédition (sans secret côté client).
 * Mêmes validations que les routes /api/admin/shipping/* ; logique mock réutilisée.
 */
import { createSupabaseAdmin } from '@/lib/supabase/admin'

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

function validateDraft(draft: { delivery_type: unknown; pickup_point: unknown } | null): { ok: false; error: string; code: 'NOT_FOUND' | 'BAD_REQUEST' } | { ok: true; deliveryType: DeliveryType } {
  if (!draft) {
    return { ok: false, error: 'Brouillon d’expédition introuvable pour cette commande', code: 'NOT_FOUND' }
  }
  const deliveryType = draft.delivery_type as DeliveryType | null
  if (deliveryType !== 'home' && deliveryType !== 'relay') {
    return { ok: false, error: 'delivery_type invalide (attendu: home ou relay)', code: 'BAD_REQUEST' }
  }
  if (deliveryType === 'relay') {
    if (draft.pickup_point == null || typeof draft.pickup_point !== 'object') {
      return { ok: false, error: 'Relay requires pickup_point', code: 'BAD_REQUEST' }
    }
  }
  return { ok: true, deliveryType }
}

export type GetOffersResult =
  | { ok: true; orderId: string; deliveryType: string; offers: { offer_code: string; label: string; price?: number }[] }
  | { ok: false; error: string; code: 'NOT_FOUND' | 'BAD_REQUEST' }

export async function getOffersAction(orderId: string): Promise<GetOffersResult> {
  const id = typeof orderId === 'string' ? orderId.trim() : ''
  if (!id) {
    return { ok: false, error: 'orderId manquant', code: 'BAD_REQUEST' }
  }

  const supabase = createSupabaseAdmin()
  const { data: draft, error: draftError } = await (supabase as any)
    .from('shipping_drafts')
    .select('order_id, delivery_type, pickup_point')
    .eq('order_id', id)
    .maybeSingle()

  if (draftError) {
    console.error('[getOffersAction]', draftError.message)
    return { ok: false, error: draftError.message ?? 'Erreur lecture draft', code: 'BAD_REQUEST' }
  }

  const validation = validateDraft(draft)
  if (!validation.ok) return validation

  const offers = validation.deliveryType === 'relay' ? MOCK_OFFERS_RELAY : MOCK_OFFERS_HOME
  return { ok: true, orderId: id, deliveryType: validation.deliveryType, offers }
}

export type CreateLabelResult =
  | { ok: true; orderId: string; offerCode: string; trackingNumber: string; labelUrl: string; warning?: string; dbError?: string }
  | { ok: false; error: string; code?: 'NOT_FOUND' | 'BAD_REQUEST' }

export async function createLabelAction(orderId: string, offerCode: string): Promise<CreateLabelResult> {
  const id = typeof orderId === 'string' ? orderId.trim() : ''
  const code = typeof offerCode === 'string' ? offerCode.trim() : ''
  if (!id) return { ok: false, error: 'orderId manquant', code: 'BAD_REQUEST' }
  if (!code) return { ok: false, error: 'offerCode manquant', code: 'BAD_REQUEST' }

  const supabase = createSupabaseAdmin()
  const { data: draft, error: draftError } = await (supabase as any)
    .from('shipping_drafts')
    .select('order_id, delivery_type, pickup_point')
    .eq('order_id', id)
    .maybeSingle()

  if (draftError) {
    console.error('[createLabelAction]', draftError.message)
    return { ok: false, error: draftError.message ?? 'Erreur lecture draft', code: 'BAD_REQUEST' }
  }

  const validation = validateDraft(draft)
  if (!validation.ok) return validation

  const trackingNumber = `MOCK-${Date.now()}-${id.slice(0, 8)}`
  const labelUrl = 'https://example.com/label/' + trackingNumber

  let warning: string | undefined
  let dbError: string | undefined

  const updatePayload: Record<string, unknown> = {
    shipping_tracking_number: trackingNumber,
    shipping_label_url: labelUrl,
    shipping_offer_code: code,
    shipped_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)

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
    const fallbackPayload: Record<string, unknown> = {
      shipping_tracking_number: trackingNumber,
      shipping_label_url: labelUrl,
    }
    const { error: fallbackError } = await supabase
      .from('orders')
      .update(fallbackPayload)
      .eq('id', id)
    if (!fallbackError) {
      warning = 'Étiquette enregistrée (tracking + URL) ; colonnes optionnelles (shipping_offer_code, shipped_at) absentes.'
      dbError = undefined
    }
  }

  return {
    ok: true,
    orderId: id,
    offerCode: code,
    trackingNumber,
    labelUrl,
    ...(warning && { warning }),
    ...(dbError && { dbError }),
  }
}
