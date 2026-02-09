'use server'

/**
 * Server Action : création de commande avec log serveur (diagnostic relay / pickup_point).
 * Utilisée par payment/success (Monetico) et checkout (PayPal, test).
 * Logs visibles dans Cloudflare Pages Functions / serveur uniquement.
 */
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import type { OrderPickupPoint, OrderDeliveryType, OrderItem } from '@/lib/revenue-supabase'
import { createShippingDraftForOrder } from '@/lib/create-shipping-draft-for-order'

type OrderItemInput = Omit<OrderItem, 'id' | 'order_id' | 'created_at'>

export type CreateOrderActionParams = {
  userId: string | undefined
  reference: string
  total: number
  items: OrderItemInput[]
  paymentMethod?: string
  shippingCost?: number
  comment?: string
  moneticoReference?: string
  /** Valeur brute pour le log (ex: 'chronopost-relais', 'livraison') — pas de donnée sensible */
  retraitModeForLog?: string | null
  deliveryType: OrderDeliveryType
  pickupPoint: OrderPickupPoint | null
}

export type CreateOrderActionResult =
  | { ok: true; order: { id: string; reference: string; [k: string]: unknown } }
  | { ok: false; error: string }

export async function createOrderAction(params: CreateOrderActionParams): Promise<CreateOrderActionResult> {
  const {
    userId,
    reference,
    total,
    items,
    paymentMethod,
    shippingCost,
    comment,
    moneticoReference,
    retraitModeForLog,
    deliveryType,
    pickupPoint,
  } = params

  // Validation : relay exige un pickup_point valide
  if (deliveryType === 'relay') {
    if (
      pickupPoint == null ||
      typeof pickupPoint !== 'object' ||
      !String(pickupPoint.id ?? '').trim() ||
      !String(pickupPoint.address1 ?? '').trim() ||
      !String(pickupPoint.zip ?? '').trim() ||
      !String(pickupPoint.city ?? '').trim() ||
      !String(pickupPoint.country_code ?? '').trim()
    ) {
      return {
        ok: false,
        error: 'pickup_point obligatoire lorsque delivery_type est relay (id, address1, zip, city, country_code requis)',
      }
    }
  }

  // Log serveur (Cloudflare Pages Functions) — pas de données sensibles
  const pickupPointLog =
    pickupPoint == null || typeof pickupPoint !== 'object'
      ? null
      : { keys: Object.keys(pickupPoint) }
  console.log('[ORDER_CREATE]', {
    retraitMode: retraitModeForLog ?? '(absent)',
    deliveryType,
    pickupPoint: pickupPointLog,
    reference: reference?.slice(0, 12) + (reference?.length > 12 ? '…' : ''),
  })

  const delivery_type = deliveryType
  const pickup_point = deliveryType === 'relay' ? pickupPoint : null

  const itemsForJson = items.map((item, index) => ({
    id: `item-${Date.now()}-${index}`,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    price: item.price,
    created_at: new Date().toISOString(),
    arome: item.arome,
    taille: item.taille,
    couleur: item.couleur,
    diametre: item.diametre,
    conditionnement: item.conditionnement,
    forme: item.forme,
    saveur: item.saveur,
    produit: item.produit,
  }))

  const orderDataToInsertBase: Record<string, unknown> = {
    user_id: userId,
    reference,
    total,
    status: 'pending',
    payment_method: paymentMethod,
    items: itemsForJson,
    delivery_type,
    pickup_point: pickup_point ?? null,
  }
  if (moneticoReference && typeof moneticoReference === 'string') {
    orderDataToInsertBase.monetico_reference = moneticoReference
  }
  if (typeof shippingCost === 'number' && Number.isFinite(shippingCost)) {
    orderDataToInsertBase.shipping_cost = shippingCost
  }
  if (comment && typeof comment === 'string' && comment.trim().length > 0) {
    orderDataToInsertBase.comment = comment.trim().substring(0, 500)
  }

  try {
    const supabase = createSupabaseAdmin()
    const { data: orderData, error } = await supabase
      .from('orders')
      .insert(orderDataToInsertBase as any)
      .select()
      .single()

    if (error) {
      console.error('[ORDER_CREATE] Erreur insert:', error.message)
      return { ok: false, error: error.message ?? 'Erreur création commande' }
    }
    if (!orderData) {
      return { ok: false, error: 'Aucune donnée retournée' }
    }
    const orderId = (orderData as { id?: string }).id
    if (orderId) {
      createShippingDraftForOrder(orderId).catch((e) =>
        console.error('[ORDER_CREATE] createShippingDraftForOrder', orderId, e)
      )
    }
    return { ok: true, order: orderData as { id: string; reference: string; [k: string]: unknown } }
  } catch (e: any) {
    const msg = e?.message ?? String(e)
    console.error('[ORDER_CREATE] Exception:', msg)
    return { ok: false, error: msg }
  }
}
