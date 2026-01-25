'use client'

import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { useState, useEffect } from 'react'
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
  cardOnly?: boolean // Si true, afficher uniquement le formulaire de carte
  paylaterOnly?: boolean // Si true, afficher uniquement PayPal 4x
}

// Composant interne pour détecter le chargement du script
function PayPalButtonContent({
  amount,
  itemTotal,
  shippingTotal,
  reference,
  onSuccess,
  onError,
  disabled,
  onBeforePayment,
  cardOnly,
  paylaterOnly,
  isProcessing,
  setIsProcessing,
}: PayPalButtonProps & { isProcessing: boolean; setIsProcessing: (val: boolean) => void }) {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer()

  useEffect(() => {
    if (isRejected) {
      console.error('❌ PayPal script failed to load')
    } else if (isResolved) {
      console.log('✅ PayPal script loaded successfully', { cardOnly, paylaterOnly })
    }
  }, [isResolved, isRejected, cardOnly, paylaterOnly])

  if (isRejected) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
        <p className="text-sm text-red-400">
          Erreur de chargement PayPal. Veuillez rafraîchir la page.
        </p>
      </div>
    )
  }

  if (!isResolved) {
    return (
      <div className="bg-gray-500/10 border border-gray-500/50 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Chargement du bouton PayPal...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={disabled || isProcessing ? 'opacity-50' : 'opacity-100'}
      style={{ 
        position: 'relative', 
        zIndex: 10, 
        minHeight: '55px',
        pointerEvents: disabled || isProcessing ? 'none' : 'auto',
        isolation: 'isolate',
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <PayPalButtons
        disabled={disabled || isProcessing}
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
          color: cardOnly ? 'blue' : paylaterOnly ? 'gold' : 'gold',
          shape: 'rect',
          label: cardOnly ? 'checkout' : 'paypal',
          tagline: false,
          height: 50,
        }}
      />
    </div>
  )
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
  cardOnly = false,
  paylaterOnly = false,
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

  // Configuration différente selon le type de paiement
  // IMPORTANT: PayPal nécessite toujours PayPal activé pour fonctionner
  // Pour cardOnly et paylaterOnly, on active aussi PayPal mais on utilise le label pour forcer l'affichage
  const scriptOptions = cardOnly
    ? {
        clientId: clientId,
        currency: 'EUR',
        intent: 'capture',
        'enable-funding': 'card', // Activer carte
        'disable-funding': 'paylater,venmo,credit', // Désactiver 4x et autres (PayPal reste disponible)
        ...(isTestMode && { 'data-client-token': undefined }),
      }
    : paylaterOnly
    ? {
        clientId: clientId,
        currency: 'EUR',
        intent: 'capture',
        'enable-funding': 'paylater', // Activer 4x
        'disable-funding': 'venmo,credit', // Désactiver autres (PayPal et card restent disponibles)
        ...(isTestMode && { 'data-client-token': undefined }),
      }
    : {
        clientId: clientId,
        currency: 'EUR',
        intent: 'capture',
        'enable-funding': 'paypal', // Activer PayPal
        'disable-funding': 'venmo,credit', // Désactiver autres (card et paylater restent disponibles)
        ...(isTestMode && { 'data-client-token': undefined }),
      }

  return (
    <PayPalScriptProvider options={scriptOptions}>
      <PayPalButtonContent
        amount={amount}
        itemTotal={itemTotal}
        shippingTotal={shippingTotal}
        reference={reference}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
        onBeforePayment={onBeforePayment}
        cardOnly={cardOnly}
        paylaterOnly={paylaterOnly}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />
    </PayPalScriptProvider>
  )
}
