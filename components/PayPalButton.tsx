'use client'

import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer, PayPalCardFieldsProvider, PayPalCardFieldsForm, usePayPalCardFields } from '@paypal/react-paypal-js'
import { useState, useEffect, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isRejected) {
      console.error('❌ PayPal script failed to load')
    } else if (isResolved) {
      console.log('✅ PayPal script loaded successfully', { cardOnly, paylaterOnly })
      
      // Masquer les boutons secondaires et le texte "Optimisé par PayPal"
      if (containerRef.current) {
        const hideSecondaryElements = () => {
          // Masquer tous les boutons sauf le premier
          const buttons = containerRef.current?.querySelectorAll('[data-funding-source], button, [role="button"]')
          if (buttons && buttons.length > 1) {
            Array.from(buttons).forEach((btn, index) => {
              if (index > 0) {
                (btn as HTMLElement).style.display = 'none'
              }
            })
          }
          
          // Masquer le texte "Optimisé par PayPal"
          const allElements = containerRef.current?.querySelectorAll('*')
          allElements?.forEach(el => {
            const text = el.textContent
            if (text && (text.includes('Optimisé par PayPal') || text.includes('Powered by PayPal'))) {
              (el as HTMLElement).style.display = 'none'
            }
          })
        }
        
        // Exécuter immédiatement
        hideSecondaryElements()
        
        // Observer les changements dans le DOM
        const observer = new MutationObserver(() => {
          hideSecondaryElements()
        })
        
        observer.observe(containerRef.current, { 
          childList: true, 
          subtree: true,
          attributes: true
        })
        
        // Nettoyer après 10 secondes
        setTimeout(() => observer.disconnect(), 10000)
      }
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

  // Si cardOnly, on ne devrait pas arriver ici car PayPalCardFieldsProvider gère ça différemment
  // Cette condition est pour les cas où cardOnly est false mais on est dans un contexte CardFields
  if (cardOnly) {
    // Si on est dans un PayPalCardFieldsProvider, utiliser usePayPalCardFields
    // Sinon, attendre que le script soit résolu
    return (
      <div className="space-y-4">
        <PayPalCardFieldsForm />
      </div>
    )
  }

  // Pour les autres cas (PayPal standard et 4x), utiliser PayPalButtons
  return (
    <>
      <style>{`
        [data-paypal-button-container] [data-funding-source]:not(:first-child),
        [data-paypal-button-container] button:not(:first-child),
        [data-paypal-button-container] [role="button"]:not(:first-child) {
          display: none !important;
        }
        [data-paypal-button-container] *[class*="paypal-button-label"],
        [data-paypal-button-container] *[class*="paypal-button-text"] {
          display: none !important;
        }
      `}</style>
      <div 
        ref={containerRef}
        data-paypal-button-container
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
          layout: 'horizontal', // Horizontal pour éviter l'empilement vertical
          color: cardOnly ? 'blue' : paylaterOnly ? 'gold' : 'gold',
          shape: 'rect',
          label: cardOnly ? 'checkout' : 'paypal',
          tagline: false,
          height: 50,
        }}
      />
      </div>
    </>
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
  // IMPORTANT: Pour cardOnly, utiliser 'card-fields' dans components pour activer CardFields
  const scriptOptions = cardOnly
    ? {
        clientId: clientId,
        currency: 'EUR',
        intent: 'capture',
        components: 'card-fields', // Activer CardFields pour afficher directement les champs
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

  // Pour cardOnly, utiliser PayPalCardFieldsProvider au lieu de PayPalScriptProvider
  if (cardOnly) {
    return (
      <PayPalScriptProvider options={scriptOptions}>
        <PayPalCardFieldsProvider
          style={{
            input: {
              'font-size': '16px',
              color: '#ffffff',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '12px',
            },
          }}
          createOrder={async () => {
            try {
              setIsProcessing(true)
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
              console.log('🔄 Capture PayPal Card - Order ID:', data.orderID)
              
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
              
              console.log('📦 Capture PayPal Card - Réponse:', captureData)

              if (!response.ok) {
                console.error('❌ Erreur capture PayPal Card - Response not OK:', captureData)
                throw new Error(captureData.error || 'Erreur lors de la capture du paiement')
              }
              
              if (captureData.success) {
                console.log('✅ Capture PayPal Card réussie - Payment ID:', captureData.paymentId)
                onSuccess(data.orderID, captureData.paymentId || data.orderID)
              } else {
                const hasPayment = captureData.paymentId || captureData.order?.purchase_units?.[0]?.payments?.captures?.[0]
                
                if (hasPayment) {
                  console.warn('⚠️ Capture PayPal Card - Success false mais paiement existe:', captureData)
                  onSuccess(data.orderID, captureData.paymentId || data.orderID)
                } else {
                  console.error('❌ Capture PayPal Card - Aucun paiement trouvé:', captureData)
                  throw new Error('Le paiement n\'a pas pu être capturé. Statut: ' + (captureData.status || 'inconnu'))
                }
              }
            } catch (error: any) {
              console.error('❌ Erreur capture PayPal Card:', error)
              onError(error?.message || 'Erreur lors de la capture du paiement PayPal')
            } finally {
              setIsProcessing(false)
            }
          }}
          onError={(err: unknown) => {
            console.error('Erreur PayPal Card:', err)
            onError('Une erreur est survenue lors du paiement par carte')
            setIsProcessing(false)
          }}
        >
          <CardFieldsContent
            amount={amount}
            itemTotal={itemTotal}
            shippingTotal={shippingTotal}
            reference={reference}
            onSuccess={onSuccess}
            onError={onError}
            disabled={disabled}
            onBeforePayment={onBeforePayment}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </PayPalCardFieldsProvider>
      </PayPalScriptProvider>
    )
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
