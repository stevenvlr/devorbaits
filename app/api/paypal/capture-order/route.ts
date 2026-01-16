import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Cette route capture un paiement PayPal après approbation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

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

    // Obtenir un token d'accès
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
      console.error('Erreur capture PayPal:', errorText)
      return NextResponse.json(
        { error: 'Erreur lors de la capture du paiement PayPal' },
        { status: 500 }
      )
    }

    const captureData = await captureResponse.json()

    return NextResponse.json({
      success: captureData.status === 'COMPLETED',
      order: captureData,
      paymentId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
      amount: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value,
    })
  } catch (error: any) {
    console.error('Erreur capture PayPal:', error)
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la capture du paiement PayPal' },
      { status: 500 }
    )
  }
}
