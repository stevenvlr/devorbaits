/**
 * Types partagés pour la page admin shipping (sérialisables pour le client).
 */

/** 4 modes de livraison (orders.delivery_type) */
export type OrderDeliveryType = 'relay' | 'home' | 'pickup_wavignies' | 'pickup_apb'

export type ShippingDraftForAdmin = {
  order_id: string
  status: string
  total_weight_g: number
  recipient: {
    full_name?: string
    email?: string
    phone?: string
    address1?: string
    address2?: string
    zip?: string
    city?: string
    country_code?: string
  }
  parcels: unknown[]
  country_code: string
  delivery_type: 'home' | 'relay'
  pickup_point: Record<string, unknown> | null
}

export type OrderRowForShipping = {
  id: string
  reference: string
  created_at: string
  user_email?: string | null
  user_name?: string | null
  /** Mode livraison (orders.delivery_type) — source de vérité pour retrait vs expédition */
  delivery_type?: string | null
  /** Point relais (orders.pickup_point) — pour détecter incohérence si non-null mais delivery_type != 'relay' */
  pickup_point?: unknown | null
}

export type InitialRow = {
  order: OrderRowForShipping
  draft: ShippingDraftForAdmin | null
}
