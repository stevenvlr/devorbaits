'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useState } from 'react'
import { getPayPalClientId, isPayPalConfigured } from '@/lib/paypal'
import type { PayPalOrderPayload } from '@/app/api/paypal/capture-order/route'

export type CreatedOrder = { id: string; reference: string; [k: string]: unknown }

interface PayPalButtonProps {
  amount: number
  itemTotal: number
  shippingTotal: number
  reference: string
  onSuccess: (orderId: string, paymentId: string, order?: CreatedOrder | null) => void
  onError: (error: string) => void
  disabled?: boolean
  onBeforePayment?: () => void
  /** Fourni par le checkout : permet de créer la commande côté serveur (évite perte si onglet fermé) */
  getOrderPayload?: () => Promise<PayPalOrderPayload | null>
}

export default function PayPalButton({
  amount,
  itemTotal,
  shippingTotal,
  reference,
  onSuccess,
  onError,
  disabled,
  onBeforePayment,
  getOrderPayload,
}: PayPalButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isPayPalConfigured()) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-sm text-red-400">
          PayPal n'est pas configuré. Vérifiez NEXT_PUBLIC_PAYPAL_CLIENT_ID dans .env.local
        </p>
      </div>
    )
  }

  const clientId = getPayPalClientId()
  const isTestMode = process.env.NEXT_PUBLIC_PAYPAL_BASE_URL?.includes('sandbox') || 
                     !process.env.NEXT_PUBLIC_PAYPAL_BASE_URL

  return (
    <PayPalScriptProvider
      options={{
        clientId: clientId,
        currency: 'EUR',
        intent: 'capture',
        'enable-funding': 'card,paylater', // Activer le paiement par carte et Pay Later (4x)
        ...(isTestMode && { 'data-client-token': undefined }),
      }}
    >
      <div className={disabled || isProcessing ? 'opacity-50 pointer-events-none' : ''}>
  <PayPalButtons
    disabled={disabled || isProcessing}
    createOrder={async () => {
      try {
        setIsProcessing(true)
        if (onBeforePayment) {
          onBeforePayment()
        }

        const orderPayload = getOrderPayload ? await getOrderPayload() : null
        console.log("DEBUG pickupPoint =", orderPayload?.pickupPoint)

        
        console.log("DEBUG orderPayload =", orderPayload)
        console.log("DEBUG orderPayload.pickupPoint =", orderPayload?.pickupPoint)

        
        // ✅ Remise en centimes (amount = total final)
        const toCents = (v: any) => Math.round(Number(v) * 100)

        const itemTotalCents = toCents(itemTotal)
        const shippingCents = toCents(shippingTotal)
        
        let finalCents = toCents(amount)
        
        // discount = (items + shipping) - final
        let discountCents = itemTotalCents + shippingCents - finalCents
        
        // ✅ si final est trop haut (arrondi), on force final à la somme et discount à 0
        if (discountCents < 0) {
          finalCents = itemTotalCents + shippingCents
          discountCents = 0
        } else {
          discountCents = Math.max(0, discountCents)
        }
        
        const amountNormalized = (finalCents / 100).toFixed(2)
        
        
        console.log("CHECK cents", { itemTotalCents, shippingCents, finalCents, discountCents, amountNormalized })

        const response = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountNormalized,
            itemTotal,
            shippingTotal,
            discountCents,
            reference,
            currency: 'EUR',
            ...(orderPayload && { orderPayload }),
          }),
          
        })


              if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erreur lors de la création de la commande PayPal')
              }

              const data = await response.json()
              return data.id
            } catch (error: any) {
              console.error('Erreur création commande PayPal:', error)
              onError(error?.message || 'Erreur lors de la création de la commande PayPal')
              throw error
            } finally {
              setIsProcessing(false)
            }
          }}
          onApprove={async (data: { orderID: string }) => {
            try {
              setIsProcessing(true)
              console.log('🔄 Capture PayPal - Order ID:', data.orderID)
              const orderPayload = getOrderPayload ? await getOrderPayload() : null
              

              const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: data.orderID,
                  expectedTotal: amount,
                  expectedItemTotal: itemTotal,
                  expectedShippingTotal: shippingTotal,
                  ...(orderPayload && { orderPayload }),
                }),
              })

              const captureData = await response.json()

              console.log('📦 Capture PayPal - Réponse:', captureData)

              if (!response.ok) {
                console.error('❌ Erreur capture PayPal - Response not OK:', captureData)
                // Fallback : essayer ensure-order si capture-order échoue
                try {
                  console.log('[PAYPAL_BUTTON] Tentative fallback ensure-order pour orderId=%s', data.orderID)
                  const ensureResponse = await fetch(`/api/paypal/ensure-order?orderId=${encodeURIComponent(data.orderID)}`)
                  const ensureData = await ensureResponse.json()
                  if (ensureData.orderCreated && ensureData.orderId) {
                    console.log('[PAYPAL_BUTTON] Commande créée via ensure-order (fallback): %s', ensureData.orderId)
                    onSuccess(data.orderID, ensureData.orderId, { id: ensureData.orderId, reference: ensureData.orderReference })
                    return
                  }
                } catch (ensureErr) {
                  console.error('[PAYPAL_BUTTON] Erreur ensure-order (fallback):', ensureErr)
                }
                throw new Error(captureData.error || 'Erreur lors de la capture du paiement')
              }

              const createdOrder = captureData.createdOrder ?? (captureData.order?.id ? captureData.order : null)

              if (captureData.success) {
                console.log('✅ Capture PayPal réussie - Payment ID:', captureData.paymentId)
                onSuccess(data.orderID, captureData.paymentId || data.orderID, createdOrder)
              } else {
                const hasPayment = captureData.paymentId || captureData.order?.purchase_units?.[0]?.payments?.captures?.[0]
                if (hasPayment) {
                  console.warn('⚠️ Capture PayPal - Success false mais paiement existe:', captureData)
                  onSuccess(data.orderID, captureData.paymentId || data.orderID, createdOrder)
                } else {
                  console.error('❌ Capture PayPal - Aucun paiement trouvé:', captureData)
                  throw new Error('Le paiement n\'a pas pu être capturé. Statut: ' + (captureData.status || 'inconnu'))
                }
              }
            } catch (error: unknown) {
              console.error('❌ Erreur capture PayPal:', error)
              onError(error instanceof Error ? error.message : 'Erreur lors de la capture du paiement PayPal')
            } finally {
              setIsProcessing(false)
            }
          }}
          onError={(err: unknown) => {
            console.error('Erreur PayPal:', err)
            onError('Une erreur est survenue lors du paiement PayPal')
            setIsProcessing(false)
          }}
          onCancel={() => {
            setIsProcessing(false)
          }}
          style={{
            layout: 'vertical',
            color: 'blue', // Couleur bleue pour carte (au lieu de gold pour PayPal)
            shape: 'rect',
            label: 'pay', // Afficher "Pay with Debit or Credit Card" directement
          }}
        />
      </div>
    </PayPalScriptProvider>
  )
}
