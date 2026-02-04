/**
 * Types partagés pour la page admin shipping (sérialisables pour le client).
 */

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
}

export type InitialRow = {
  order: OrderRowForShipping
  draft: ShippingDraftForAdmin | null
}
