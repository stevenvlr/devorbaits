import { NextRequest, NextResponse } from 'next/server'
import { createOrderAction } from '@/app/actions/create-order'
import { sendNewOrderNotification } from '@/lib/telegram-notifications'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

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

/** Payload pour créer la commande côté serveur (évite perte si l'utilisateur ferme l'onglet) */
export type PayPalOrderPayload = {
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

function normalizePickupPoint(
  p: PayPalOrderPayload['pickupPoint']
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

// Cette route capture un paiement PayPal après approbation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, expectedTotal, expectedItemTotal, expectedShippingTotal, orderPayload } = body as {
      orderId?: string
      expectedTotal?: unknown
      expectedItemTotal?: unknown
      expectedShippingTotal?: unknown
      orderPayload?: PayPalOrderPayload
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID de commande requis' },
        { status: 400 }
      )
    }

    // Récupérer les clés PayPal depuis les variables d'environnement
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'PayPal non configuré' },
        { status: 500 }
      )
    }

    // Déterminer l'URL de base
    const baseUrl = process.env.NEXT_PUBLIC_PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'
    const accessTokenUrl = `${baseUrl}/v1/oauth2/token`
    // API Orders v2
    const captureUrl = `${baseUrl}/v2/checkout/orders/${orderId}/capture`
    const getOrderUrl = `${baseUrl}/v2/checkout/orders/${orderId}`

    console.log('🔍 Capture PayPal - Order ID:', orderId, 'Base URL:', baseUrl)

    // Obtenir un token d'accès (compatible Edge Runtime)
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
      console.error('❌ Erreur authentification PayPal:', errorText)
      return NextResponse.json(
        { error: 'Erreur lors de l\'authentification PayPal' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error('❌ Token d\'accès PayPal non reçu')
      return NextResponse.json(
        { error: 'Token d\'accès PayPal non reçu' },
        { status: 500 }
      )
    }

    // Capturer le paiement
    const captureResponse = await fetch(captureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text()
      console.error('❌ Erreur capture PayPal:', errorText)
      return NextResponse.json(
        { 
          error: 'Erreur lors de la capture du paiement PayPal',
          details: errorText 
        },
        { status: 500 }
      )
    }

    const captureData = await captureResponse.json()
    
    console.log('✅ Capture PayPal - Statut:', captureData.status)
    console.log('✅ Capture PayPal - Données:', JSON.stringify(captureData, null, 2))

    // Récupérer la commande complète (pour amount.breakdown.shipping)
    let orderDetails: any = null
    try {
      const detailsResponse = await fetch(getOrderUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      if (detailsResponse.ok) {
        orderDetails = await detailsResponse.json()
      } else {
        const errorText = await detailsResponse.text()
        console.warn('⚠️ Impossible de récupérer les détails de la commande PayPal:', errorText)
      }
    } catch (detailsError) {
      console.warn('⚠️ Erreur lors de la récupération des détails PayPal:', detailsError)
    }

    // Validation/log: comparer ce qu'on attend vs ce que PayPal a en breakdown
    const paypalTotal = parseMoney(orderDetails?.purchase_units?.[0]?.amount?.value)
    const paypalItemTotal = parseMoney(orderDetails?.purchase_units?.[0]?.amount?.breakdown?.item_total?.value)
    const paypalShippingTotal = parseMoney(orderDetails?.purchase_units?.[0]?.amount?.breakdown?.shipping?.value)

    const expectedTotalNum = parseMoney(expectedTotal)
    const expectedItemTotalNum = parseMoney(expectedItemTotal)
    const expectedShippingNum = parseMoney(expectedShippingTotal)

    const mismatches: Record<string, any> = {}
    if (expectedTotalNum != null && paypalTotal != null && Math.abs(round2(expectedTotalNum) - round2(paypalTotal)) > 0.01) {
      mismatches.total = { expected: round2(expectedTotalNum), paypal: round2(paypalTotal) }
    }
    if (expectedItemTotalNum != null && paypalItemTotal != null && Math.abs(round2(expectedItemTotalNum) - round2(paypalItemTotal)) > 0.01) {
      mismatches.itemTotal = { expected: round2(expectedItemTotalNum), paypal: round2(paypalItemTotal) }
    }
    if (expectedShippingNum != null && paypalShippingTotal != null && Math.abs(round2(expectedShippingNum) - round2(paypalShippingTotal)) > 0.01) {
      mismatches.shipping = { expected: round2(expectedShippingNum), paypal: round2(paypalShippingTotal) }
    }

    const hasMismatch = Object.keys(mismatches).length > 0
    if (hasMismatch) {
      console.error('❌ PayPal capture-order: mismatch montants', {
        orderId,
        mismatches,
        expected: {
          total: expectedTotalNum,
          itemTotal: expectedItemTotalNum,
          shippingTotal: expectedShippingNum,
        },
        paypal: {
          total: paypalTotal,
          itemTotal: paypalItemTotal,
          shippingTotal: paypalShippingTotal,
        },
      })
    }

    // Vérifier le statut - PayPal peut retourner COMPLETED ou d'autres statuts valides
    const isCompleted = captureData.status === 'COMPLETED'
    const hasCapture = captureData.purchase_units?.[0]?.payments?.captures?.[0]
    const captureStatus = hasCapture?.status

    // Le paiement est considéré comme réussi si :
    // 1. Le statut de la commande est COMPLETED, OU
    // 2. Il y a une capture avec le statut COMPLETED
    const isSuccess = isCompleted || captureStatus === 'COMPLETED'

    if (!isSuccess) {
      console.warn('⚠️ Capture PayPal - Statut non complet:', {
        orderStatus: captureData.status,
        captureStatus: captureStatus,
        fullData: captureData
      })
    }

    // Créer la commande depuis payment_intent (idempotence) ou fallback body orderPayload
    let createdOrder: { id: string; reference: string; [k: string]: unknown } | null = null
    const orderTotal = paypalTotal != null ? round2(paypalTotal) : 0

    if (isSuccess) {
      const supabase = createSupabaseAdmin()
      const { data: intent } = await supabase
        .from('payment_intents')
        .select('id, order_id, payload, status')
        .eq('paypal_order_id', orderId)
        .maybeSingle()

      const payload = (intent?.payload as PayPalOrderPayload | null) ?? orderPayload ?? null

      // Idempotence : intent déjà traité → retourner la commande existante
      if (intent?.order_id) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, reference')
          .eq('id', intent.order_id)
          .single()
        if (existingOrder) {
          createdOrder = existingOrder as { id: string; reference: string; [k: string]: unknown }
          console.log('[ORDER_CREATE] Idempotence: commande déjà créée', intent.order_id)
        }
      }
      // Intent présent sans order_id : créer la commande depuis le payload
      else if (intent && payload?.reference && Array.isArray(payload.items) && payload.items.length > 0) {
        const totalForOrder = orderTotal || round2(payload.total ?? 0)
        try {
          const result = await createOrderAction({
            userId: payload.userId ?? undefined,
            reference: payload.reference,
            total: totalForOrder,
            items: payload.items,
            paymentMethod: 'paypal',
            shippingCost: typeof payload.shippingCost === 'number' ? payload.shippingCost : undefined,
            comment: payload.comment?.trim() || undefined,
            retraitModeForLog: payload.retraitMode ?? null,
            deliveryType: payload.deliveryType,
            pickupPoint: normalizePickupPoint(payload.pickupPoint),
          })
          if (result.ok) {
            createdOrder = result.order
            await supabase
              .from('payment_intents')
              .update({
                status: 'captured',
                order_id: result.order.id,
                processed_at: new Date().toISOString(),
                last_error: null,
              })
              .eq('id', intent.id)
            console.log('[ORDER_CREATE] Commande créée depuis intent (PayPal):', result.order?.id, result.order?.reference)
            try {
              await sendNewOrderNotification({
                reference: payload.reference,
                total: totalForOrder,
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
              console.warn('⚠️ Notification Telegram (capture-order):', telegramErr)
            }
          } else {
            await supabase
              .from('payment_intents')
              .update({
                status: 'failed',
                last_error: result.error,
                processed_at: new Date().toISOString(),
              })
              .eq('id', intent.id)
            console.error('[ORDER_CREATE] Échec création commande après capture PayPal:', result.error)
            return NextResponse.json(
              {
                success: true,
                order: orderDetails || captureData,
                capture: captureData,
                paymentId: hasCapture?.id || captureData.id,
                orderCreated: false,
                orderError: result.error,
              },
              { status: 200 }
            )
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
          console.error('[ORDER_CREATE] Exception création commande après capture PayPal:', orderErr)
          return NextResponse.json(
            {
              success: true,
              order: orderDetails || captureData,
              paymentId: hasCapture?.id || captureData.id,
              orderCreated: false,
              orderError: msg,
            },
            { status: 200 }
          )
        }
      }
      // Pas d'intent : fallback sur orderPayload du body (ancien flux)
      else if (orderPayload?.reference && Array.isArray(orderPayload.items) && orderPayload.items.length > 0) {
        const totalForOrder = orderTotal || round2(orderPayload.total ?? 0)
        try {
          const result = await createOrderAction({
            userId: orderPayload.userId ?? undefined,
            reference: orderPayload.reference,
            total: totalForOrder,
            items: orderPayload.items,
            paymentMethod: 'paypal',
            shippingCost: typeof orderPayload.shippingCost === 'number' ? orderPayload.shippingCost : undefined,
            comment: orderPayload.comment?.trim() || undefined,
            retraitModeForLog: orderPayload.retraitMode ?? null,
            deliveryType: orderPayload.deliveryType,
            pickupPoint: normalizePickupPoint(orderPayload.pickupPoint),
          })
          if (result.ok) {
            createdOrder = result.order
            console.log('[ORDER_CREATE] Commande créée depuis body (fallback):', result.order?.id)
            try {
              await sendNewOrderNotification({
                reference: orderPayload.reference,
                total: totalForOrder,
                itemCount: orderPayload.items.length,
                customerName: orderPayload.customerName,
                customerEmail: orderPayload.customerEmail,
                shippingCost: orderPayload.shippingCost,
                retraitMode: orderPayload.retraitMode,
                items: orderPayload.items.map((i) => ({
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
              console.warn('⚠️ Notification Telegram (capture-order):', telegramErr)
            }
          } else {
            return NextResponse.json(
              {
                success: true,
                order: orderDetails || captureData,
                capture: captureData,
                paymentId: hasCapture?.id || captureData.id,
                orderCreated: false,
                orderError: result.error,
              },
              { status: 200 }
            )
          }
        } catch (orderErr: unknown) {
          const msg = orderErr instanceof Error ? orderErr.message : String(orderErr)
          return NextResponse.json(
            {
              success: true,
              order: orderDetails || captureData,
              paymentId: hasCapture?.id || captureData.id,
              orderCreated: false,
              orderError: msg,
            },
            { status: 200 }
          )
        }
      }
    }

    return NextResponse.json({
      success: isSuccess,
      order: createdOrder ?? (orderDetails || captureData),
      createdOrder: createdOrder ?? undefined,
      capture: captureData,
      paymentId: hasCapture?.id || captureData.id,
      amount: hasCapture?.amount?.value || captureData.purchase_units?.[0]?.amount?.value,
      status: captureData.status,
      captureStatus: captureStatus,
      amountMismatch: hasMismatch,
      mismatchDetails: hasMismatch ? mismatches : null,
    })
  } catch (error: unknown) {
    console.error('❌ Erreur capture PayPal (catch):', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur lors de la capture du paiement PayPal',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
