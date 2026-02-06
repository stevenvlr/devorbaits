'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package, Home, Info } from 'lucide-react'
import { parseMoneticoReturn } from '@/lib/monetico'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { updateOrderStatus, getOrderByReference, type OrderItem, type OrderPickupPoint } from '@/lib/revenue-supabase'
import { createOrderAction } from '@/app/actions/create-order'
import { buildOrderPickupPointFromBoxtal, buildOrderPickupPointFromChronopost } from '@/lib/order-pickup-point'
import { loadProducts } from '@/lib/products-manager'
import { getPromoCodeByCode, recordPromoCodeUsageAsync } from '@/lib/promo-codes-manager'
import { sendNewOrderNotification } from '@/lib/telegram-notifications'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { applyGlobalPromotion } from '@/lib/global-promotion-manager'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart, cartItems } = useCart()
  const { user } = useAuth()
  const { promotion } = useGlobalPromotion()
  const [orderReference, setOrderReference] = useState<string>('')
  const [montant, setMontant] = useState<string>('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orderComment, setOrderComment] = useState<string | null>(null)

  // Fonction pour obtenir le prix avec promotion pour un item
  const getItemPrice = (item: any) => {
    if (item.isGratuit) return 0
    
    // Si on a une promotion active
    if (promotion && promotion.active) {
      // Si on a le prix original, l'utiliser (meilleur cas)
      const prixBase = item.prixOriginal !== undefined ? item.prixOriginal : item.prix
      
      // Si la promotion s'applique à tout le site, l'appliquer même sans category/gamme
      if (promotion.applyToAll) {
        return applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
      }
      
      // Si on a category ou gamme, vérifier l'éligibilité
      if (item.category || item.gamme) {
        return applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
      }
    }
    
    // Sinon, utiliser le prix stocké
    return item.prix
  }

  useEffect(() => {
    const processPayment = async () => {
      // Vérifier le mode de paiement
      const params = new URLSearchParams(searchParams.toString())
      const paymentMethod = params.get('payment_method')
      const isPayPal = paymentMethod === 'paypal'
      
      // Pour PayPal, on a déjà la référence et le montant dans les paramètres
      if (isPayPal) {
        const reference = params.get('reference') || ''
        const montant = params.get('montant') || ''
        const orderId = params.get('order_id') || ''
        
        if (reference) {
          setOrderReference(reference)
          setMontant(montant)
          
          // Charger les produits pour obtenir les noms
          const allProducts = await loadProducts()
          setProducts(allProducts)
          
          try {
            // 1. Essayer de récupérer la commande créée
            let createdOrder = await getOrderByReference(reference)
            
            // 2. Si pas trouvée ET qu'on a orderId PayPal, appeler ensure-order (secours)
            if (!createdOrder && orderId) {
              console.log('[PAYMENT_SUCCESS] Commande non trouvée, appel ensure-order pour orderId=%s', orderId)
              try {
                const ensureResponse = await fetch(`/api/paypal/ensure-order?orderId=${encodeURIComponent(orderId)}`)
                const ensureData = await ensureResponse.json()
                
                if (ensureData.orderCreated && ensureData.orderId) {
                  console.log('[PAYMENT_SUCCESS] Commande créée via ensure-order: %s', ensureData.orderId)
                  // Réessayer de récupérer la commande
                  await new Promise(resolve => setTimeout(resolve, 500))
                  createdOrder = await getOrderByReference(reference)
                } else if (ensureData.alreadyExists && ensureData.orderId) {
                  console.log('[PAYMENT_SUCCESS] Commande déjà existante: %s', ensureData.orderId)
                  createdOrder = await getOrderByReference(reference)
                } else if (ensureData.paid && !ensureData.orderCreated) {
                  console.warn('[PAYMENT_SUCCESS] Paiement confirmé mais commande non créée: %s', ensureData.error || 'erreur inconnue')
                } else if (!ensureData.paid) {
                  console.log('[PAYMENT_SUCCESS] Paiement non encore complété')
                }
              } catch (ensureError) {
                console.error('[PAYMENT_SUCCESS] Erreur ensure-order:', ensureError)
              }
            }
            
            // 3. Si toujours pas trouvée, réessayer après un court délai
            if (!createdOrder) {
              await new Promise(resolve => setTimeout(resolve, 1000))
              createdOrder = await getOrderByReference(reference)
            }
            
            // 4. Si commande trouvée, afficher
            if (createdOrder) {
              setOrderItems(createdOrder.items)
              setOrderComment(createdOrder.comment || null)
            } else {
              // 5. Fallback : utiliser les données du panier en attente si disponibles
              const pendingOrderKey = `pending-order-${reference}`
              const pendingOrderData = localStorage.getItem(pendingOrderKey)
              
              if (pendingOrderData) {
                try {
                  const pendingOrder = JSON.parse(pendingOrderData)
                  if (pendingOrder.cartItems) {
                    const itemsFromCart = pendingOrder.cartItems.map((item: any, index: number) => ({
                      id: `temp-${index}`,
                      order_id: 'temp',
                      product_id: item.productId || item.produit,
                      variant_id: item.variantId,
                      quantity: item.quantite,
                      price: item.prix,
                      created_at: new Date().toISOString()
                    }))
                    setOrderItems(itemsFromCart)
                  }
                  localStorage.removeItem(pendingOrderKey)
                } catch (e) {
                  console.error('[PAYMENT_SUCCESS] Erreur parsing pendingOrder:', e)
                }
              }
            }
            
            // Supprimer la commande en attente
            const pendingOrderKey = `pending-order-${reference}`
            localStorage.removeItem(pendingOrderKey)
            
            // Vider le panier
            clearCart()
            setLoading(false)
          } catch (error) {
            console.error('[PAYMENT_SUCCESS] Erreur lors du traitement du paiement PayPal:', error)
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
        return
      }
      
      // Parser les paramètres de retour Monetico
      const returnData = parseMoneticoReturn(params)
      
      if (returnData.success) {
        const moneticoReference = returnData.reference || ''
        setOrderReference(moneticoReference)
        setMontant(returnData.montant || '')

        // Récupérer la commande en attente (clé Monetico)
        const pendingOrderKey = `pending-order-${moneticoReference}`
        const pendingOrderData = localStorage.getItem(pendingOrderKey)

        if (pendingOrderData && moneticoReference) {
          try {
            const pendingOrder = JSON.parse(pendingOrderData)
            const total = parseFloat(returnData.montant || '0')
            const internalReference = pendingOrder?.reference || moneticoReference
            setOrderReference(internalReference)
            
            // Créer les items de commande avec toutes les informations de variante
            const orderItems = pendingOrder.cartItems.map((item: any) => ({
              product_id: item.productId || item.produit,
              variant_id: item.variantId,
              quantity: item.quantite,
              price: getItemPrice(item), // Utiliser le prix avec promotion
              // Inclure les informations de variante pour l'affichage
              arome: item.arome,
              taille: item.taille,
              couleur: item.couleur,
              diametre: item.diametre,
              conditionnement: item.conditionnement,
              produit: item.produit
            }))

            // Mapping retraitMode → delivery_type (point relais => relay + pickup_point obligatoire)
            const retraitModeRaw = pendingOrder?.retraitMode != null ? String(pendingOrder.retraitMode).trim() : ''
            const hasRelayPoint = !!(pendingOrder?.chronopostRelaisPoint || pendingOrder?.boxtalParcelPoint)
            let moneticoDeliveryType: 'relay' | 'home' | 'pickup_wavignies' | 'pickup_apb' =
              retraitModeRaw === 'chronopost-relais' ? 'relay'
              : retraitModeRaw === 'livraison' ? 'home'
              : retraitModeRaw === 'wavignies-rdv' ? 'pickup_wavignies'
              : retraitModeRaw === 'amicale-blanc' ? 'pickup_apb'
              : hasRelayPoint ? 'relay'
              : 'home'
            let moneticoPickupPoint: OrderPickupPoint | null = null
            if (moneticoDeliveryType === 'relay') {
              if (pendingOrder?.boxtalParcelPoint) {
                moneticoPickupPoint = buildOrderPickupPointFromBoxtal(pendingOrder.boxtalParcelPoint)
              } else if (pendingOrder?.chronopostRelaisPoint) {
                moneticoPickupPoint = buildOrderPickupPointFromChronopost(pendingOrder.chronopostRelaisPoint)
              }
            }
            if (moneticoDeliveryType === 'relay' && !moneticoPickupPoint) {
              console.error('[payment/success] Relay sans pickup_point — retraitMode:', retraitModeRaw, 'hasRelayPoint:', hasRelayPoint)
              setLoading(false)
              return
            }

            const result = await createOrderAction({
              userId: user?.id,
              reference: internalReference,
              total,
              items: orderItems,
              paymentMethod: 'monetico',
              shippingCost: typeof pendingOrder?.shippingCost === 'number' ? pendingOrder.shippingCost : undefined,
              moneticoReference,
              retraitModeForLog: retraitModeRaw || (pendingOrder?.retraitMode ?? null),
              deliveryType: moneticoDeliveryType,
              pickupPoint: moneticoPickupPoint,
            })
            if (!result.ok) {
              console.error('[payment/success] createOrderAction:', result.error)
              setLoading(false)
              return
            }
            const order = result.order

            // Enregistrer l'utilisation du code promo APRÈS création de la commande
            if (order?.id && user?.id && pendingOrder?.promoCode && pendingOrder?.discount != null) {
              const discountAmount =
                typeof pendingOrder.discount === 'number'
                  ? pendingOrder.discount
                  : parseFloat(String(pendingOrder.discount))

              if (Number.isFinite(discountAmount) && discountAmount > 0) {
                const promoCodeObj = await getPromoCodeByCode(pendingOrder.promoCode)
                if (promoCodeObj) {
                  await recordPromoCodeUsageAsync(
                    promoCodeObj.id,
                    user.id,
                    order.id,
                    discountAmount
                  )
                }
              }
            }
            
            const phoneFromPending =
              (pendingOrder?.customerPhone ||
                pendingOrder?.livraisonAddress?.telephone ||
                user?.telephone ||
                '') as string

            // Sauvegarder l'adresse / infos de retrait dans la commande (selon le mode)
            if (order.id && pendingOrder.livraisonAddress && pendingOrder.retraitMode === 'livraison') {
              try {
                const { getSupabaseClient } = await import('@/lib/supabase')
                const supabase = getSupabaseClient()
                if (supabase && pendingOrder.livraisonAddress.adresse && pendingOrder.livraisonAddress.codePostal && pendingOrder.livraisonAddress.ville) {
                  await supabase
                    .from('orders')
                    .update({
                      shipping_address: {
                        adresse: pendingOrder.livraisonAddress.adresse,
                        codePostal: pendingOrder.livraisonAddress.codePostal,
                        ville: pendingOrder.livraisonAddress.ville,
                        telephone: phoneFromPending?.trim() || pendingOrder.livraisonAddress.telephone
                      }
                    })
                    .eq('id', order.id)
                  console.log('✅ Adresse de livraison sauvegardée dans la commande')
                }
              } catch (addressError) {
                console.warn('⚠️ Erreur lors de la sauvegarde de l\'adresse dans la commande:', addressError)
              }
            }

            // Point relais (Chronopost / Boxtal) - Monetico
            if (order.id && pendingOrder.retraitMode === 'chronopost-relais') {
              try {
                const { getSupabaseClient } = await import('@/lib/supabase')
                const supabase = getSupabaseClient()
                if (supabase) {
                  if (pendingOrder.boxtalParcelPoint) {
                    const p = pendingOrder.boxtalParcelPoint
                    const pointAddress = p.address || {}
                    const rawData = (p as any).rawData || p

                    const postalCode =
                      pointAddress.postalCode ||
                      pointAddress.postal_code ||
                      pointAddress.zipCode ||
                      rawData.address?.postalCode ||
                      rawData.postalCode ||
                      ''

                    const city =
                      pointAddress.city ||
                      pointAddress.ville ||
                      rawData.address?.city ||
                      rawData.city ||
                      ''

                    const street =
                      pointAddress.street ||
                      pointAddress.address ||
                      rawData.address?.street ||
                      rawData.street ||
                      ''

                    const fullAddress = [street, postalCode, city].filter(Boolean).join(', ')

                    await supabase
                      .from('orders')
                      .update({
                        shipping_address: {
                          type: 'boxtal-relais',
                          identifiant: p.code || '',
                          nom: p.name || '',
                          adresseComplete: fullAddress,
                          adresse: street,
                          codePostal: postalCode,
                          ville: city,
                          pays: pointAddress.country || pointAddress.countryCode || 'FR',
                          coordonnees: p.coordinates || {},
                          network: p.network || '',
                          telephone: phoneFromPending?.trim() || undefined,
                          pointRelais: p
                        }
                      })
                      .eq('id', order.id)
                    console.log('✅ Point relais Boxtal sauvegardé dans la commande (Monetico)')
                  } else if (pendingOrder.chronopostRelaisPoint) {
                    const p = pendingOrder.chronopostRelaisPoint
                    await supabase
                      .from('orders')
                      .update({
                        shipping_address: {
                          type: 'chronopost-relais',
                          identifiant: p.identifiant,
                          nom: p.nom,
                          adresse: p.adresse,
                          codePostal: p.codePostal,
                          ville: p.ville,
                          horaires: p.horaires,
                          coordonnees: p.coordonnees,
                          telephone: phoneFromPending?.trim() || undefined,
                        }
                      })
                      .eq('id', order.id)
                    console.log('✅ Point relais Chronopost sauvegardé dans la commande (Monetico)')
                  }
                }
              } catch (relaisError) {
                console.warn('⚠️ Erreur lors de la sauvegarde du point relais (Monetico):', relaisError)
              }
            }

            // Wavignies RDV - Monetico
            if (order.id && pendingOrder.retraitMode === 'wavignies-rdv' && pendingOrder.rdvDate && pendingOrder.rdvTimeSlot) {
              try {
                const { getSupabaseClient } = await import('@/lib/supabase')
                const supabase = getSupabaseClient()
                if (supabase) {
                  await supabase
                    .from('orders')
                    .update({
                      shipping_address: {
                        type: 'wavignies-rdv',
                        rdvDate: pendingOrder.rdvDate,
                        rdvTimeSlot: pendingOrder.rdvTimeSlot,
                        adresse: 'Retrait sur rendez-vous à Wavignies (60130)',
                        ville: 'Wavignies',
                        codePostal: '60130',
                        telephone: phoneFromPending?.trim() || undefined,
                      }
                    })
                    .eq('id', order.id)
                  console.log('✅ Informations de retrait Wavignies sauvegardées dans la commande (Monetico)')
                }
              } catch (wavigniesError) {
                console.warn('⚠️ Erreur lors de la sauvegarde du retrait Wavignies (Monetico):', wavigniesError)
              }
            }
            
            // La commande est créée avec le statut 'pending' (en attente) par défaut
            // Le statut sera changé manuellement depuis l'admin
            
            // Générer automatiquement la facture et envoyer l'email
            if (order?.id) {
              try {
                const invoiceResponse = await fetch('/api/auto-invoice', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: order.id }),
                })
                const invoiceResult = await invoiceResponse.json()
                if (invoiceResult.ok) {
                  console.log('✅ Facture générée et email envoyé automatiquement (Monetico)')
                } else {
                  console.warn('⚠️ Erreur génération facture automatique:', invoiceResult.error)
                }
              } catch (invoiceError) {
                console.warn('⚠️ Erreur appel API auto-invoice (Monetico):', invoiceError)
              }
              
              // Envoyer notification Telegram
              try {
                await sendNewOrderNotification({
                  reference: internalReference,
                  total: total,
                  itemCount: orderItems.length,
                  customerName: user?.nom || user?.email,
                  customerEmail: user?.email,
                  shippingCost: pendingOrder?.shippingCost,
                  retraitMode: pendingOrder?.retraitMode,
                  items: orderItems.map((item: any) => ({
                    produit: item.produit,
                    quantity: item.quantity,
                    price: item.price,
                    arome: item.arome,
                    taille: item.taille,
                    couleur: item.couleur,
                    diametre: item.diametre,
                    conditionnement: item.conditionnement,
                    forme: item.forme,
                    saveur: item.saveur || item.arome, // Pour Pop-up Duo
                    gamme: item.gamme,
                  }))
                })
              } catch (telegramError) {
                console.warn('⚠️ Erreur notification Telegram:', telegramError)
              }
            }
            
            // Charger les produits pour obtenir les noms
            const allProducts = await loadProducts()
            setProducts(allProducts)
            
            // Récupérer la commande créée avec ses items
            // Si la commande n'est pas trouvée immédiatement, utiliser les données du panier en attente
            let createdOrder = await getOrderByReference(internalReference)
            
            // Si la commande n'est pas trouvée, réessayer après un court délai (pour Supabase)
            if (!createdOrder) {
              await new Promise(resolve => setTimeout(resolve, 500))
              createdOrder = await getOrderByReference(internalReference)
            }
            
            // Si toujours pas trouvée, utiliser les données du panier en attente
            if (createdOrder) {
              setOrderItems(createdOrder.items)
            } else if (pendingOrder.cartItems) {
              // Convertir les items du panier en format OrderItem pour l'affichage
              const itemsFromCart = pendingOrder.cartItems.map((item: any, index: number) => ({
                id: `temp-${index}`,
                order_id: 'temp',
                product_id: item.productId || item.produit,
                variant_id: item.variantId,
                quantity: item.quantite,
                price: item.prix,
                created_at: new Date().toISOString()
              }))
              setOrderItems(itemsFromCart)
            }
            
            // Supprimer la commande en attente
            localStorage.removeItem(pendingOrderKey)
            if (pendingOrder?.reference) {
              localStorage.removeItem(`pending-order-${pendingOrder.reference}`)
            }
            
            setLoading(false)
          } catch (error) {
            console.error('Erreur lors de la création de la commande:', error)
          }
        }
        
        // Vider le panier après un paiement réussi
        clearCart()
        setLoading(false)
      } else {
        // Si le paiement n'a pas réussi, rediriger vers la page d'erreur
        router.push('/payment/error')
      }
    }
    
    processPayment()
  }, [searchParams, router, clearCart, user, cartItems])

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-noir-800/50 border border-green-500/50 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Paiement réussi !</h1>
            <p className="text-gray-400">
              Votre commande a été validée avec succès
            </p>
          </div>

          {orderReference && (
            <div className="bg-noir-900/50 rounded-lg p-6 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Référence de commande :</span>
                <span className="font-semibold text-white">{orderReference}</span>
              </div>
              {montant && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Montant payé :</span>
                  <span className="font-semibold text-green-400">{montant}€</span>
                </div>
              )}
              
              {/* Affichage des articles commandés */}
              {!loading && orderItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-noir-700">
                  <p className="text-sm text-gray-400 mb-2">Articles commandés :</p>
                  <ul className="space-y-2">
                    {orderItems.map((item) => {
                      // Utiliser le nom du produit sauvegardé si disponible
                      const baseName = (item as any).produit || products.find(p => p.id === item.product_id)?.name || item.product_id
                      
                      // Construire les détails de variante à partir des informations sauvegardées
                      const variantParts: string[] = []
                      
                      // Pour Pop-up Duo : saveur (arome) et forme (taille)
                      if ((item as any).saveur) variantParts.push((item as any).saveur)
                      if ((item as any).forme) variantParts.push((item as any).forme)
                      // Fallback pour les anciennes commandes
                      if (!(item as any).saveur && (item as any).arome) variantParts.push((item as any).arome)
                      if (!(item as any).forme && (item as any).taille) variantParts.push((item as any).taille)
                      
                      // Pour Bar à Pop-up : couleur, taille, arôme
                      if ((item as any).couleur) variantParts.push((item as any).couleur)
                      if ((item as any).taille && !variantParts.includes((item as any).taille)) variantParts.push((item as any).taille)
                      if ((item as any).arome && !variantParts.includes((item as any).arome)) variantParts.push((item as any).arome)
                      
                      // Pour les bouillettes : diamètre, conditionnement, arôme
                      if ((item as any).diametre) variantParts.push((item as any).diametre)
                      if ((item as any).conditionnement) variantParts.push((item as any).conditionnement)
                      
                      // Si on n'a pas trouvé d'informations sauvegardées, essayer depuis les variantes
                      if (variantParts.length === 0 && item.variant_id) {
                        const product = products.find(p => p.id === item.product_id)
                        if (product?.variants) {
                          const variant = product.variants.find((v: any) => v.id === item.variant_id)
                          if (variant) {
                            if (variant.label) {
                              variantParts.push(variant.label)
                            } else {
                              if (variant.conditionnement) variantParts.push(variant.conditionnement)
                            }
                          }
                        }
                      }
                      
                      const productName = variantParts.length > 0 
                        ? `${baseName} - ${variantParts.join(' - ')}`
                        : baseName
                      
                      return (
                        <li key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-white">
                            {productName} × {item.quantity}
                          </span>
                          <span className="text-yellow-500 font-medium">
                            {(item.price * item.quantity).toFixed(2)}€
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Commentaire de commande */}
              {orderComment && (
                <div className="mt-4 pt-4 border-t border-noir-700">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      <p className="text-sm font-medium text-blue-400">Votre commentaire</p>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{orderComment}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300">
              Un email de confirmation vous a été envoyé avec les détails de votre commande.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Retour à l'accueil
            </Link>
            <Link
              href="/account/orders"
              className="px-6 py-3 bg-noir-700 text-white font-semibold rounded-lg hover:bg-noir-600 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Mes commandes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}