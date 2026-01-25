'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useState } from 'react'
import { getPayPalClientId, isPayPalConfigured } from '@/lib/paypal'

interface PayPalButtonProps {
  amount: number
  itemTotal: number
  shippingTotal: number
  reference: string
  onSuccess: (orderId: string, paymentId: string) => void
  onError: (error: string) => void
  disabled?: boolean
  onBeforePayment?: () => void
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
        'enable-funding': 'card', // Uniquement paiement par carte (pas PayPal)
        'disable-funding': 'paylater', // Désactiver paylater
        ...(isTestMode && { 'data-client-token': undefined }),
      }}
    >
      <div className={disabled || isProcessing ? 'opacity-50 pointer-events-none' : ''}>
        <PayPalButtons
          disabled={disabled || isProcessing}
          fundingSource="card" // Forcer l'affichage direct du formulaire de carte
          createOrder={async () => {
            try {
              setIsProcessing(true)
              // Appeler onBeforePayment si fourni
              if (onBeforePayment) {
                onBeforePayment()
              }
              const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  amount,
                  itemTotal,
                  shippingTotal,
                  reference,
                  currency: 'EUR',
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
                }),
              })

              const captureData = await response.json()
              
              console.log('📦 Capture PayPal - Réponse:', captureData)

              if (!response.ok) {
                console.error('❌ Erreur capture PayPal - Response not OK:', captureData)
                throw new Error(captureData.error || 'Erreur lors de la capture du paiement')
              }
              
              // Vérifier si la capture a réussi
              if (captureData.success) {
                console.log('✅ Capture PayPal réussie - Payment ID:', captureData.paymentId)
                onSuccess(data.orderID, captureData.paymentId || data.orderID)
              } else {
                // Même si success est false, vérifier si le paiement existe
                const hasPayment = captureData.paymentId || captureData.order?.purchase_units?.[0]?.payments?.captures?.[0]
                
                if (hasPayment) {
                  console.warn('⚠️ Capture PayPal - Success false mais paiement existe:', captureData)
                  // Essayer quand même de continuer si le paiement existe
                  onSuccess(data.orderID, captureData.paymentId || data.orderID)
                } else {
                  console.error('❌ Capture PayPal - Aucun paiement trouvé:', captureData)
                  throw new Error('Le paiement n\'a pas pu être capturé. Statut: ' + (captureData.status || 'inconnu'))
                }
              }
            } catch (error: any) {
              console.error('❌ Erreur capture PayPal:', error)
              onError(error?.message || 'Erreur lors de la capture du paiement PayPal')
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
