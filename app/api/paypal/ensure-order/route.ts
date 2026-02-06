import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createOrderAction } from '@/app/actions/create-order'
import { sendNewOrderNotification } from '@/lib/telegram-notifications'

export const runtime = 'edge'

function parseMoney(input: unknown): number | null {
  const n =
    typeof input === 'number'
      ? input
      : typeof input === 'string'
        ? Number(input.replace(',', '.'))
        : Number(input)
  return Number.isFinite(n) ? n : null
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function normalizePickupPoint(
  p: {
    id: string
    network?: string
    name?: string
    address1: string
    address2?: string
    zip: string
    city: string
    country_code: string
  } | null
): import('@/lib/revenue-supabase').OrderPickupPoint | null {
  if (!p) return null
  return {
    id: p.id,
    network: p.network ?? '',
    name: p.name ?? '',
    address1: p.address1,
    address2: p.address2,
    zip: p.zip,
    city: p.city,
    country_code: p.country_code,
  }
}

/**
 * Route ensure-order : vérifie côté PayPal si un paiement est complété et crée la commande si nécessaire.
 * Utilisée par /payment/success comme secours si onApprove n'a pas été appelé.
 * Idempotence garantie : vérifie order_id avant création.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400 })
    }

    console.log('[PAYPAL_ENSURE] orderId=%s', orderId)

    // Récupérer les credentials PayPal
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'PayPal non configuré' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'
    const accessTokenUrl = `${baseUrl}/v1/oauth2/token`
    const getOrderUrl = `${baseUrl}/v2/checkout/orders/${orderId}`

    // Obtenir un token d'accès
    const credentials = btoa(`${clientId}:${clientSecret}`)
    const tokenResponse = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[PAYPAL_ENSURE] Erreur authentification PayPal:', errorText)
      return NextResponse.json({ error: 'Erreur authentification PayPal' }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.json({ error: 'Token d\'accès PayPal non reçu' }, { status: 500 })
    }

    // Récupérer la commande PayPal
    const orderResponse = await fetch(getOrderUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('[PAYPAL_ENSURE] Erreur récupération order PayPal:', errorText)
      return NextResponse.json({ error: 'Erreur récupération order PayPal' }, { status: 500 })
    }

    const orderData = await orderResponse.json()

    // Vérifier si le paiement est complété
    const status = orderData.status
    const hasCapture = orderData.purchase_units?.[0]?.payments?.captures?.[0]
    const captureStatus = hasCapture?.status
    const isPaid = status === 'COMPLETED' || captureStatus === 'COMPLETED'

    if (!isPaid) {
      console.log('[PAYPAL_ENSURE] orderId=%s status=%s captureStatus=%s (pas encore payé)', orderId, status, captureStatus)
      return NextResponse.json({
        paid: false,
        status,
        captureStatus,
        orderCreated: false,
      }, { status: 200 })
    }

    // Paiement complété, vérifier payment_intents
    const supabase = createSupabaseAdmin()
    const { data: intent } = await supabase
      .from('payment_intents')
      .select('id, order_id, payload, status')
      .eq('paypal_order_id', orderId)
      .maybeSingle()

    if (!intent) {
      console.warn('[PAYPAL_ENSURE] orderId=%s intent non trouvé', orderId)
      return NextResponse.json({
        paid: true,
        orderCreated: false,
        error: 'intent non trouvé',
      }, { status: 200 })
    }

    // Idempotence : si order_id déjà rempli, retourner OK
    if (intent.order_id) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, reference')
        .eq('id', intent.order_id)
        .single()

      if (existingOrder) {
        console.log('[PAYPAL_ENSURE] orderId=%s intentId=%s orderId=%s (déjà créé, idempotence)', orderId, intent.id, intent.order_id)
        return NextResponse.json({
          paid: true,
          orderCreated: false,
          alreadyExists: true,
          orderId: existingOrder.id,
          orderReference: existingOrder.reference,
        }, { status: 200 })
      }
    }

    // Charger le payload depuis l'intent
    const payload = intent.payload as {
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
    } | null

    if (!payload?.reference || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({
        paid: true,
        orderCreated: false,
        error: 'payload invalide',
      }, { status: 200 })
    }

    // Calculer le montant depuis PayPal
    const paypalTotal = parseMoney(orderData.purchase_units?.[0]?.amount?.value)
    const orderTotal = paypalTotal != null ? round2(paypalTotal) : round2(payload.total ?? 0)

    // Créer la commande
    try {
      const result = await createOrderAction({
        userId: payload.userId ?? undefined,
        reference: payload.reference,
        total: orderTotal,
        items: payload.items,
        paymentMethod: 'paypal',
        shippingCost: typeof payload.shippingCost === 'number' ? payload.shippingCost : undefined,
        comment: payload.comment?.trim() || undefined,
        retraitModeForLog: payload.retraitMode ?? null,
        deliveryType: payload.deliveryType,
        pickupPoint: normalizePickupPoint(payload.pickupPoint),
      })

      if (result.ok) {
        // Mettre à jour payment_intents
        await supabase
          .from('payment_intents')
          .update({
            status: 'captured',
            order_id: result.order.id,
            processed_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', intent.id)

        console.log('[PAYPAL_ENSURE] orderId=%s intentId=%s orderCreated=true orderId=%s', orderId, intent.id, result.order.id)

        // Envoyer notification Telegram
        try {
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
          console.warn('[PAYPAL_ENSURE] Notification Telegram échouée:', telegramErr)
        }

        return NextResponse.json({
          paid: true,
          orderCreated: true,
          orderId: result.order.id,
          orderReference: payload.reference,
        }, { status: 200 })
      } else {
        await supabase
          .from('payment_intents')
          .update({
            status: 'failed',
            last_error: result.error,
            processed_at: new Date().toISOString(),
          })
          .eq('id', intent.id)

        console.error('[PAYPAL_ENSURE] orderId=%s intentId=%s orderCreated=false error=%s', orderId, intent.id, result.error)
        return NextResponse.json({
          paid: true,
          orderCreated: false,
          error: result.error,
        }, { status: 200 })
      }
    } catch (orderErr: unknown) {
      const msg = orderErr instanceof Error ? orderErr.message : String(orderErr)
      await supabase
        .from('payment_intents')
        .update({
          status: 'failed',
          last_error: msg,
          processed_at: new Date().toISOString(),
        })
        .eq('id', intent.id)

      console.error('[PAYPAL_ENSURE] orderId=%s intentId=%s orderCreated=false exception=%s', orderId, intent.id, msg)
      return NextResponse.json({
        paid: true,
        orderCreated: false,
        error: msg,
      }, { status: 200 })
    }
  } catch (error: unknown) {
    console.error('[PAYPAL_ENSURE] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur ensure-order' },
      { status: 500 }
    )
  }
}
