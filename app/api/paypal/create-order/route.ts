import { NextRequest, NextResponse } from 'next/server'

// Cette route crée une commande PayPal côté serveur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, reference, currency = 'EUR' } = body

    // Vérifier que les paramètres sont présents
    if (!amount || !reference) {
      return NextResponse.json(
        { error: 'Montant et référence requis' },
        { status: 400 }
      )
    }

    // Normaliser le montant (accepte number ou string, point ou virgule)
    const numericAmount =
      typeof amount === 'string' ? Number(amount.replace(',', '.')) : Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
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

    // Créer les credentials pour l'authentification Basic
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

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

    // Créer la commande PayPal
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: reference,
          description: `Commande ${reference}`,
          amount: {
            currency_code: currency,
            value: numericAmount.toFixed(2),
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
