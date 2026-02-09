import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'edge'

function parseMoney(input: unknown): number {
  if (typeof input === 'number') return input
  if (typeof input === 'string') return Number(input.replace(',', '.'))
  return Number(input)
}

function toCents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100)
}
function centsToStr(cents: number): string {
  return (cents / 100).toFixed(2)
}

export type PayPalUnitAmount = { currency_code: string; value: string }

export type PayPalOrderPayload = {
  reference: string
  items: Array<{
    product_id: string
    variant_id?: string
    quantity: number
    price: number
    name?: string
    unit_amount?: PayPalUnitAmount
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, currency = 'EUR', orderPayload } = body as {
      reference?: string
      currency?: string
      orderPayload?: PayPalOrderPayload
    }

    if (!reference) {
      return NextResponse.json({ error: 'Référence requise' }, { status: 400 })
    }

    if (!orderPayload || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      return NextResponse.json(
        { error: 'Panier vide ou détails commande incomplets. Actualise et réessaie.' },
        { status: 400 }
      )
    }
    if (orderPayload.items.length > PAYPAL_ITEMS_MAX) {
      return NextResponse.json({ error: `Trop d'articles (max ${PAYPAL_ITEMS_MAX}).` }, { status: 400 })
    }

    // ✅ On NE fait plus confiance à amount/itemTotal/shippingTotal du front.
    const shippingCents = toCents(parseMoney(orderPayload.shippingCost ?? 0))
    const finalTotalCents = toCents(parseMoney(orderPayload.total))

    if (!Number.isFinite(shippingCents) || shippingCents < 0 || !Number.isFinite(finalTotalCents) || finalTotalCents <= 0) {
      return NextResponse.json({ error: 'Montants invalides (total/shipping).' }, { status: 400 })
    }

    // Construire items PayPal + somme item_total en centimes
    const paypalItems: Array<{
      name: string
      quantity: string
      unit_amount: { currency_code: string; value: string }
      sku?: string
    }> = []

    let itemTotalCents = 0

    for (const it of orderPayload.items) {
      const qty = Math.max(1, Math.min(999999, Math.floor(Number(it.quantity)) || 1))

      const isFree = (it as any).isGratuit === true || parseMoney(it.price) === 0

      // ✅ on ignore unit_amount pour éviter les écarts
      const unitValue = isFree ? 0 : parseMoney(it.price)
      const unitCents = toCents(Number.isFinite(unitValue) ? unitValue : 0)
            

      // Somme item_total
      itemTotalCents += unitCents * qty

      const name =
        (typeof it.name === 'string' && it.name.trim() !== ''
          ? it.name.trim()
          : (it.produit && it.produit.trim() !== '' ? it.produit.trim() : 'Article')
        ).slice(0, PAYPAL_ITEM_NAME_MAX)

      const sku =
        typeof it.product_id === 'string' && it.product_id.trim() !== ''
          ? it.product_id.trim().slice(0, PAYPAL_ITEM_SKU_MAX)
          : undefined

      paypalItems.push({
        name,
        quantity: String(qty),
        unit_amount: { currency_code: currency, value: centsToStr(unitCents) },
        ...(sku && { sku }),
      })
    }

    // ✅ Gestion promo / code promo : discount = (items + shipping) - total_final
    const preDiscountCents = itemTotalCents + shippingCents
    const discountCents = Math.max(0, preDiscountCents - finalTotalCents)

    // Si total_final > items+shipping => incohérent (sauf si tu gères taxes ailleurs)
    if (finalTotalCents - preDiscountCents > 1) {
      return NextResponse.json(
        { error: 'Total incohérent: total > items + shipping.' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'PayPal non configuré (env manquantes).' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'
    const credentials = btoa(`${clientId}:${clientSecret}`)

    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('PayPal auth error:', errorText)
      return NextResponse.json({ error: 'Erreur authentification PayPal' }, { status: 500 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    if (!accessToken) return NextResponse.json({ error: 'Token PayPal manquant' }, { status: 500 })

    const orderData: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          description: `Commande ${reference}`,
          items: paypalItems,
          amount: {
            currency_code: currency,
            value: centsToStr(finalTotalCents),
            breakdown: {
              item_total: { currency_code: currency, value: centsToStr(itemTotalCents) },
              shipping: { currency_code: currency, value: centsToStr(shippingCents) },
              ...(discountCents > 0
                ? { discount: { currency_code: currency, value: centsToStr(discountCents) } }
                : {}),
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

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': reference,
      },
      body: JSON.stringify(orderData),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('PayPal create order error:', errorText)
      return NextResponse.json({ error: 'Erreur création commande PayPal' }, { status: 500 })
    }

    const order = await orderResponse.json()

    // Stocker l'intent (inchangé)
    let intentId: string | null = null
    try {
      const supabase = createSupabaseAdmin()
      const { data: intentRow, error: intentError } = await supabase
        .from('payment_intents')
        .upsert(
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
        )
        .select('id')
        .single()

      if (intentError) {
        console.error('[PAYPAL_CREATE_ORDER] intentSaved=false error=%s', intentError.message)
      } else {
        intentId = intentRow?.id ?? null
      }
    } catch (e) {
      console.error('[PAYPAL_CREATE_ORDER] intentSaved=false exception=%s', e instanceof Error ? e.message : String(e))
    }

    return NextResponse.json({ id: order.id, status: order.status })
  } catch (error: unknown) {
    console.error('Erreur création commande PayPal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur création commande PayPal' },
      { status: 500 }
    )
  }
}
