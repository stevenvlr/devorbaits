import { NextRequest, NextResponse } from 'next/server'

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

// Cette route capture un paiement PayPal après approbation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, expectedTotal, expectedItemTotal, expectedShippingTotal } = body

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

    return NextResponse.json({
      success: isSuccess,
      order: orderDetails || captureData,
      capture: captureData,
      paymentId: hasCapture?.id || captureData.id,
      amount: hasCapture?.amount?.value || captureData.purchase_units?.[0]?.amount?.value,
      status: captureData.status,
      captureStatus: captureStatus,
      amountMismatch: hasMismatch,
      mismatchDetails: hasMismatch ? mismatches : null,
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
