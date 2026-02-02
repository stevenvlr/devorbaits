/**
 * Brouillon d’expédition : validation destinataire / point relais et création ou mise à jour du draft (server-only).
 * Utilise SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js'
import { getRecipientForOrder } from './recipient-supabase'
import { buildParcels, type Parcel } from './parcels'

// ----- Types minimaux -----

export type Recipient = {
  full_name: string
  email: string
  phone?: string
  address1?: string
  address2?: string
  zip?: string
  city?: string
  state?: string
  country_code?: string
}

export type PickupPoint = {
  id: string
  network: string
  name: string
  address1: string
  address2?: string
  zip: string
  city: string
  country_code: string
}

type DeliveryType = 'home' | 'relay'

/** Commande telle que lue pour le draft (colonnes utilisées) */
type OrderForDraft = {
  id: string
  user_id?: string | null
  billing_address?: unknown
  total_weight_g?: number | null
  delivery_type?: DeliveryType | null
  pickup_point?: PickupPoint | null
}

/** Brouillon stocké dans shipping_drafts */
type ShippingDraftRow = {
  order_id: string
  status: string
  total_weight_g: number
  recipient: Recipient
  parcels: Parcel[]
  country_code: string
  delivery_type: DeliveryType
  pickup_point: PickupPoint | null
}

// ----- Helpers -----

function getSupabaseService(): ReturnType<typeof createClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Configuration Supabase manquante (URL ou SUPABASE_SERVICE_ROLE_KEY)')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

function safeStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  return String(v).trim()
}

/** Liste les champs manquants sur un objet (valeurs vides ou absentes) */
function missingFields(obj: Record<string, unknown>, required: string[]): string[] {
  return required.filter((key) => {
    const v = obj[key]
    return v == null || (typeof v === 'string' && !v.trim())
  })
}

// ----- Validation -----

/**
 * Valide le destinataire selon le type de livraison.
 * Exige : full_name, email, phone, country_code.
 * Si delivery_type === 'home' exige en plus : address1, zip, city.
 */
export function validateRecipient(
  recipient: Recipient | null | undefined,
  delivery_type: DeliveryType
): void {
  if (!recipient || typeof recipient !== 'object') {
    throw new Error('Destinataire manquant')
  }

  const baseRequired: (keyof Recipient)[] = ['full_name', 'email', 'phone', 'country_code']
  const missing = missingFields(recipient as Record<string, unknown>, baseRequired as string[])
  if (missing.length) {
    throw new Error(`Champs destinataire manquants : ${missing.join(', ')}`)
  }

  if (delivery_type === 'home') {
    const homeRequired: (keyof Recipient)[] = ['address1', 'zip', 'city']
    const homeMissing = missingFields(recipient as Record<string, unknown>, homeRequired as string[])
    if (homeMissing.length) {
      throw new Error(`Livraison à domicile : champs manquants : ${homeMissing.join(', ')}`)
    }
  }
}

/**
 * Valide le point relais.
 * Exige : id, network, name, address1, zip, city, country_code.
 */
export function validatePickupPoint(pickup_point: PickupPoint | null | undefined): void {
  if (!pickup_point || typeof pickup_point !== 'object') {
    throw new Error('Point relais manquant')
  }

  const required: (keyof PickupPoint)[] = ['id', 'network', 'name', 'address1', 'zip', 'city', 'country_code']
  const missing = missingFields(pickup_point as Record<string, unknown>, required as string[])
  if (missing.length) {
    throw new Error(`Champs point relais manquants : ${missing.join(', ')}`)
  }
}

// ----- Création / mise à jour du draft -----

/** Récupère country_code depuis billing_address ou fallback FR */
function ensureCountryCode(
  recipient: Recipient,
  billingAddress: unknown
): { recipient: Recipient; country_code: string } {
  let country_code = safeStr(recipient.country_code)
  if (country_code) {
    return { recipient, country_code }
  }
  const ba = billingAddress as Record<string, unknown> | null | undefined
  if (ba && (typeof ba === 'object')) {
    country_code = safeStr(ba.country_code ?? ba.country)
  }
  if (!country_code) {
    console.warn('[createOrUpdateShippingDraft] country_code absent sur le profil et billing_address, fallback FR')
    country_code = 'FR'
  }
  return {
    recipient: { ...recipient, country_code },
    country_code,
  }
}

/** Compare deux drafts (payload à écrire vs existant) pour idempotence */
function draftPayloadEquals(
  a: { recipient: Recipient; parcels: Parcel[]; delivery_type: DeliveryType; pickup_point: PickupPoint | null; total_weight_g: number },
  b: ShippingDraftRow | null
): boolean {
  if (!b) return false
  if (a.total_weight_g !== b.total_weight_g) return false
  if (a.delivery_type !== b.delivery_type) return false
  if (JSON.stringify(a.parcels) !== JSON.stringify(b.parcels)) return false
  if (JSON.stringify(a.recipient) !== JSON.stringify(b.recipient)) return false
  if (JSON.stringify(a.pickup_point) !== JSON.stringify(b.pickup_point)) return false
  return true
}

/**
 * Crée ou met à jour le brouillon d’expédition pour une commande.
 * - Charge la commande (id, user_id, billing_address, total_weight_g, delivery_type, pickup_point)
 * - Récupère le destinataire (getRecipientForOrder), assure country_code (fallback FR + warning si absent)
 * - Valide destinataire et, si relay, point relais
 * - Construit les colis (buildParcels) et upsert shipping_drafts
 * - Idempotent : ne met à jour que si recipient/parcels/delivery_type/pickup_point/weight ont changé
 */
export async function createOrUpdateShippingDraft(orderId: string): Promise<ShippingDraftRow> {
  const supabase = getSupabaseService()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, billing_address, total_weight_g, delivery_type, pickup_point')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('[createOrUpdateShippingDraft] Commande introuvable', orderId, orderError?.message)
    throw new Error(orderError?.message ?? `Commande introuvable : ${orderId}`)
  }

  const orderForDraft = order as unknown as OrderForDraft
  const total_weight_g = orderForDraft.total_weight_g
  if (total_weight_g == null || typeof total_weight_g !== 'number' || total_weight_g <= 0) {
    throw new Error(
      `total_weight_g manquant ou invalide pour la commande ${orderId}. Champs obligatoires : total_weight_g (nombre > 0).`
    )
  }

  const delivery_type: DeliveryType =
    orderForDraft.delivery_type === 'relay' || orderForDraft.delivery_type === 'home'
      ? orderForDraft.delivery_type
      : 'home'

  let recipient = await getRecipientForOrder(orderForDraft) as Recipient
  const { recipient: recipientWithCountry, country_code } = ensureCountryCode(
    recipient,
    orderForDraft.billing_address
  )
  recipient = recipientWithCountry

  validateRecipient(recipient, delivery_type)

  if (delivery_type === 'relay') {
    const pp = orderForDraft.pickup_point
    validatePickupPoint(pp)
  }

  const parcels = buildParcels(total_weight_g)
  const pickup_point: PickupPoint | null = delivery_type === 'relay' ? (orderForDraft.pickup_point ?? null) : null

  const payload: Omit<ShippingDraftRow, 'order_id'> & { order_id: string } = {
    order_id: orderId,
    status: 'draft',
    total_weight_g,
    recipient,
    parcels,
    country_code,
    delivery_type,
    pickup_point,
  }

  const { data: existing } = await supabase
    .from('shipping_drafts')
    .select('order_id, status, total_weight_g, recipient, parcels, country_code, delivery_type, pickup_point')
    .eq('order_id', orderId)
    .maybeSingle()

  const existingRow = existing as ShippingDraftRow | null
  if (draftPayloadEquals(payload, existingRow)) {
    console.info('[createOrUpdateShippingDraft] Draft inchangé, skip update', orderId)
    return payload as ShippingDraftRow
  }

  // Table shipping_drafts non présente dans les types générés Supabase
  const { data: upserted, error: upsertError } = await (supabase as any)
    .from('shipping_drafts')
    .upsert(payload, { onConflict: 'order_id' })
    .select()
    .single()

  if (upsertError) {
    console.error('[createOrUpdateShippingDraft] Erreur upsert', orderId, upsertError.message)
    throw new Error(upsertError.message)
  }

  console.info('[createOrUpdateShippingDraft] Draft créé ou mis à jour', orderId)
  return upserted as ShippingDraftRow
}

/*
 * Exemple d'appel (côté serveur uniquement, ex. API Route ou Server Action) :
 *
 *   const orderId = '...'
 *   const draft = await createOrUpdateShippingDraft(orderId)
 *   // draft.recipient, draft.parcels, draft.country_code, draft.delivery_type, draft.pickup_point
 */
