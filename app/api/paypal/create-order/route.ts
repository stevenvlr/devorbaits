import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

function parseMoney(input: unknown): number {
  if (typeof input === 'number') return input
  if (typeof input === 'string') return Number(input.replace(',', '.'))
  return Number(input)
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// Cette route crée une commande PayPal côté serveur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, itemTotal, shippingTotal, reference, currency = 'EUR', paymentType } = body

    // Vérifier que les paramètres sont présents
    if (amount == null || itemTotal == null || shippingTotal == null || !reference) {
      return NextResponse.json(
        { error: 'Montants (amount, itemTotal, shippingTotal) et référence requis' },
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

    // Configuration selon le type de paiement
    const isGuestCheckout = paymentType === 'paypal-guest'
    
    // Créer la commande PayPal
    const orderData: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          description: `Commande ${reference}`,
          amount: {
            currency_code: currency,
            value: computedTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: round2(numericItemTotal).toFixed(2),
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
        landing_page: isGuestCheckout ? 'BILLING' : 'NO_PREFERENCE', // BILLING pour guest checkout
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/success?payment_method=paypal`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/error?payment_method=paypal`,
        payment_method: isGuestCheckout ? {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        } : undefined,
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

    return NextResponse.json({
      id: order.id,
      status: order.status,
    })
  } catch (error: any) {
    console.error('Erreur création commande PayPal:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création de la commande PayPal' },
      { status: 500 }
    )
  }
}
