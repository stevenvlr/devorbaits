import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

function parseMoney(input: unknown): number {
  if (typeof input === 'number') return input
  if (typeof input === 'string') return Number(input.replace(',', '.'))
  return Number(input)
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Unité de montant pour PayPal (currency_code + value string 2 décimales) */
export type PayPalUnitAmount = { currency_code: string; value: string }

/** Payload stocké dans payment_intents (même forme que capture-order). Pour PayPal, items doit avoir name + quantity + unit_amount. */
export type PayPalOrderPayload = {
  reference: string
  items: Array<{
    product_id: string
    variant_id?: string
    quantity: number
    price: number
    /** Nom affiché dans PayPal (obligatoire pour create-order) */
    name?: string
    /** Montant unitaire pour PayPal (obligatoire pour create-order) */
    unit_amount?: PayPalUnitAmount
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

const PAYPAL_ITEM_NAME_MAX = 127
const PAYPAL_ITEM_SKU_MAX = 127
const PAYPAL_ITEMS_MAX = 100

// Cette route crée une commande PayPal côté serveur et enregistre l'intent (payload) pour capture
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, itemTotal, shippingTotal, reference, currency = 'EUR', orderPayload } = body as {
      amount?: unknown
      itemTotal?: unknown
      shippingTotal?: unknown
      reference?: string
      currency?: string
      orderPayload?: PayPalOrderPayload
    }

    // Vérifier que les paramètres sont présents
    if (amount == null || itemTotal == null || shippingTotal == null || !reference) {
      return NextResponse.json(
        { error: 'Montants (amount, itemTotal, shippingTotal) et référence requis' },
        { status: 400 }
      )
    }

    // Exiger orderPayload avec items non vides pour afficher le détail dans PayPal
    if (!orderPayload || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      return NextResponse.json(
        {
          error:
            'Le panier est vide ou les détails de la commande sont incomplets. Veuillez actualiser la page et réessayer.',
        },
        { status: 400 }
      )
    }
    if (orderPayload.items.length > PAYPAL_ITEMS_MAX) {
      return NextResponse.json(
        { error: `Trop d'articles (max ${PAYPAL_ITEMS_MAX}). Réduisez le panier.` },
        { status: 400 }
      )
    }

    // Normaliser les montants (accepte number ou string, point ou virgule)
    const numericAmount = parseMoney(amount)
    const numericItemTotal = parseMoney(itemTotal)
    const numericShippingTotal = parseMoney(shippingTotal)

    if (
      !Number.isFinite(numericAmount) ||
      !Number.isFinite(numericItemTotal) ||
      !Number.isFinite(numericShippingTotal) ||
      numericAmount <= 0 ||
      numericItemTotal < 0 ||
      numericShippingTotal < 0
    ) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      )
    }

    const computedTotal = round2(numericItemTotal + numericShippingTotal)
    const expectedTotal = round2(numericAmount)

    // Validation serveur: amount doit être = item_total + shipping (arrondi 2 décimales)
    if (Math.abs(computedTotal - expectedTotal) > 0.01) {
      console.error('❌ PayPal create-order: montants incohérents', {
        reference,
        currency,
        amountProvided: expectedTotal,
        itemTotalProvided: round2(numericItemTotal),
        shippingTotalProvided: round2(numericShippingTotal),
        computedTotal,
      })
      return NextResponse.json(
        {
          error:
            'Montants incohérents: amount doit être égal à itemTotal + shippingTotal (arrondi 2 décimales)',
        },
        { status: 400 }
      )
    }

    // Construire les items PayPal (name, quantity, unit_amount, sku) et vérifier item_total
    const paypalItems: Array<{ name: string; quantity: string; unit_amount: { currency_code: string; value: string }; sku?: string }> = []
    let sumItemTotal = 0
    for (const it of orderPayload.items) {
      const qty = Math.max(1, Math.min(999999, Math.floor(Number(it.quantity)) || 1))
      const unitValue = it.unit_amount?.value != null
        ? parseMoney(it.unit_amount.value)
        : Number(it.price)
      const unitPrice = Number.isFinite(unitValue) ? round2(unitValue) : 0
      const valueStr = unitPrice.toFixed(2)
      const name =
        typeof it.name === 'string' && it.name.trim() !== ''
          ? it.name.trim().slice(0, PAYPAL_ITEM_NAME_MAX)
          : (it.produit && it.produit.trim() !== '' ? it.produit.trim() : 'Article').slice(0, PAYPAL_ITEM_NAME_MAX)
      const sku =
        typeof it.product_id === 'string' && it.product_id.trim() !== ''
          ? it.product_id.trim().slice(0, PAYPAL_ITEM_SKU_MAX)
          : undefined
      sumItemTotal += round2(unitPrice * qty)
      paypalItems.push({
        name,
        quantity: String(qty),
        unit_amount: { currency_code: currency, value: valueStr },
        ...(sku && { sku }),
      })
    }
    const computedItemTotal = round2(sumItemTotal)
    if (Math.abs(computedItemTotal - round2(numericItemTotal)) > 0.01) {
      console.error('❌ PayPal create-order: item_total incohérent avec items', {
        reference,
        fromItems: computedItemTotal,
        provided: round2(numericItemTotal),
      })
      return NextResponse.json(
        {
          error:
            'Le total des articles ne correspond pas. Veuillez actualiser la page et réessayer.',
        },
        { status: 400 }
      )
    }

    // Récupérer les clés PayPal depuis les variables d'environnement
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_SECRET

    if (!clientId || !clientSecret) {
      console.error('PayPal non configuré dans les variables d\'environnement')
      return NextResponse.json(
        { error: 'PayPal non configuré. Vérifiez NEXT_PUBLIC_PAYPAL_CLIENT_ID et PAYPAL_SECRET dans .env.local' },
        { status: 500 }
      )
    }

    // Déterminer l'URL de base (sandbox pour test, production pour live)
    const baseUrl = process.env.NEXT_PUBLIC_PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'
    const accessTokenUrl = `${baseUrl}/v1/oauth2/token`
    // API Orders v2
    const ordersUrl = `${baseUrl}/v2/checkout/orders`

    // Créer les credentials pour l'authentification Basic (compatible Edge Runtime)
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
      console.error('Erreur authentification PayPal:', errorText)
      return NextResponse.json(
        { error: 'Erreur lors de l\'authentification PayPal' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token d\'accès PayPal non reçu' },
        { status: 500 }
      )
    }

    // Créer la commande PayPal (items = détail produits affichés dans PayPal)
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          description: `Commande ${reference}`,
          items: paypalItems,
          amount: {
            currency_code: currency,
            value: computedTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: computedItemTotal.toFixed(2),
              },
              shipping: {
                currency_code: currency,
                value: round2(numericShippingTotal).toFixed(2),
              },
            },
          },
        },
      ],
      application_context: {
        brand_name: 'Boutique Pêche Carpe',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/success?payment_method=paypal`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/error?payment_method=paypal`,
      },
    }

    const orderResponse = await fetch(ordersUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': reference,
      },
      body: JSON.stringify(orderData),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('Erreur création commande PayPal:', errorText)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande PayPal' },
        { status: 500 }
      )
    }

    const order = await orderResponse.json()

    // Stocker l'intent avec le payload pour création de commande à la capture (indépendant du navigateur)
    let intentId: string | null = null
    if (orderPayload?.reference && Array.isArray(orderPayload.items) && orderPayload.items.length > 0) {
      try {
        const supabase = createSupabaseAdmin()
        const { data: intentRow, error: intentError } = await supabase.from('payment_intents').upsert(
          {
            provider: 'paypal',
            paypal_order_id: order.id,
            status: 'created',
            order_id: null,
            payload: orderPayload as unknown as Record<string, unknown>,
            last_error: null,
            processed_at: null,
          },
          { onConflict: 'paypal_order_id' }
        ).select('id').single()
        if (intentError) {
          console.error('[PAYPAL_CREATE_ORDER] paypal_order_id=%s intentSaved=false error=%s', order.id, intentError.message)
        } else {
          intentId = intentRow?.id ?? null
          console.log('[PAYPAL_CREATE_ORDER] paypal_order_id=%s intentId=%s', order.id, intentId ?? '(none)')
        }
      } catch (e) {
        console.error('[PAYPAL_CREATE_ORDER] paypal_order_id=%s intentSaved=false exception=%s', order.id, e instanceof Error ? e.message : String(e))
      }
    } else {
      console.log('[PAYPAL_CREATE_ORDER] paypal_order_id=%s intentSkipped=noPayload', order.id)
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
    })
  } catch (error: unknown) {
    console.error('Erreur création commande PayPal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création de la commande PayPal' },
      { status: 500 }
    )
  }
}
