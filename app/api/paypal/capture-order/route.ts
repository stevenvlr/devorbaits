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

    return NextResponse.json({
      success: isSuccess,
      order: captureData,
      paymentId: hasCapture?.id || captureData.id,
      amount: hasCapture?.amount?.value || captureData.purchase_units?.[0]?.amount?.value,
      status: captureData.status,
      captureStatus: captureStatus,
    })
  } catch (error: any) {
    console.error('❌ Erreur capture PayPal (catch):', error)
    return NextResponse.json(
      { 
        error: error?.message || 'Erreur lors de la capture du paiement PayPal',
        details: error?.stack 
      },
      { status: 500 }
    )
  }
}
