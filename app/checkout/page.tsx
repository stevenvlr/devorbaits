'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Truck, Calendar, Package, CheckCircle2, AlertCircle, CreditCard, Clock, Info, X, Ticket, Wallet } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { TOUS_LES_PRODUITS } from '@/lib/amicale-blanc-config'
import { getBouilletteId } from '@/lib/price-utils'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { applyGlobalPromotion } from '@/lib/global-promotion-manager'
import { validatePromoCode, recordPromoCodeUsageAsync, getPromoCodeByCode, type PromoCodeValidation } from '@/lib/promo-codes-manager'
import { getProductsByCategory, getProductById } from '@/lib/products-manager'
import {
  getNextAvailableDates,
  getAvailableTimeSlots,
  createAppointment,
  isAvailableDay,
  getDayName,
  AVAILABLE_TIME_SLOTS,
  MAX_BOOKINGS_PER_SLOT
} from '@/lib/appointments-manager'
import { submitMoneticoPayment, generateOrderReference } from '@/lib/monetico'
import { createOrder, updateOrderStatus } from '@/lib/revenue-supabase'
import { getActiveShippingPrice, getSponsorShippingPrice } from '@/lib/shipping-prices'
import { updateUserProfile } from '@/lib/auth-supabase'
import PayPalButton from '@/components/PayPalButton'
import { calculateCartWeightAsync } from '@/lib/product-weights'
import BoxtalRelayMap, { type BoxtalParcelPoint } from '@/components/BoxtalRelayMap'
import type { ChronopostRelaisPoint } from '@/components/ChronopostRelaisWidget'
import { sendNewOrderNotification } from '@/lib/telegram-notifications'

type RetraitMode = 'livraison' | 'amicale-blanc' | 'wavignies-rdv' | 'chronopost-relais'
type PaymentMethod = 'card' | 'paypal' 

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, total, clearCart } = useCart()
  const { promotion } = useGlobalPromotion()
  const { isAuthenticated, user } = useAuth()
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
  
  // Fonction pour valider le code postal (4 chiffres pour BE, 5 pour FR)
  const isValidPostalCode = (code: string): boolean => {
    if (!code) return false
    const cleanCode = code.replace(/\D/g, '')
    return cleanCode.length === 4 || cleanCode.length === 5
  }
  
  // Fonction pour détecter le pays selon le code postal
  const detectCountryFromPostalCode = (postalCode: string): 'FR' | 'BE' => {
    const cleanCode = postalCode.replace(/\D/g, '')
    if (cleanCode.length === 4) {
      return 'BE'
    }
    return 'FR'
  }
  
  // Fonction pour calculer le nombre de colis selon le pays et le poids
  const calculateNumberOfPackages = (weight: number, country: 'FR' | 'BE'): number => {
    if (country === 'BE') {
      // Règles pour la Belgique : 18 kg par colis
      if (weight <= 18) return 1
      if (weight > 18 && weight <= 36) return 2
      if (weight > 36 && weight <= 54) return 3
      return 0 // > 54 kg : bloqué
    } else {
      // Règles pour la France : 28 kg pour 2 colis
      if (weight > 28 && weight <= 50) return 2
      return 1
    }
  }
  
  // Fonction pour obtenir le prix avec promotion pour un item
  const getItemPrice = (item: typeof cartItems[0]) => {
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
      
      // Sinon, pas de promotion (pas de category/gamme et pas applyToAll)
    }
    
    // Sinon, utiliser le prix stocké
    return item.prix
  }
  
  // Calculer le total avec promotion
  const totalWithPromotion = cartItems.reduce((sum, item) => {
    if (item.isGratuit) return sum
    return sum + (getItemPrice(item) * item.quantite)
  }, 0)
  
  // Mode test de paiement (pour tester les expéditions sans passer par Monetico)
  const TEST_PAYMENT_MODE = process.env.NEXT_PUBLIC_TEST_PAYMENT === 'true'
  
  const [retraitMode, setRetraitMode] = useState<RetraitMode>('livraison')
  const [separerAmicale, setSeparerAmicale] = useState(false)
  const [livraisonAddress, setLivraisonAddress] = useState({
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    pays: 'FR' as 'FR' | 'BE'
  })
  const [rdvDate, setRdvDate] = useState('')
  const [rdvTimeSlot, setRdvTimeSlot] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<Array<{ timeSlot: string; available: boolean; bookedCount: number }>>([])
  const [promoCode, setPromoCode] = useState('')
  const [promoValidation, setPromoValidation] = useState<PromoCodeValidation | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [sponsorShippingDiscount, setSponsorShippingDiscount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal')
  const [orderReference, setOrderReference] = useState<string>('')
  const [paypalReference] = useState<string>(() => generateOrderReference())
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [chronopostRelaisPoint, setChronopostRelaisPoint] = useState<ChronopostRelaisPoint | null>(null)
  const [boxtalParcelPoint, setBoxtalParcelPoint] = useState<BoxtalParcelPoint | null>(null)
  const [orderComment, setOrderComment] = useState('')
  const [totalWeight, setTotalWeight] = useState<number>(0)

  // Rediriger si non connecté
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/account/register?redirect=/checkout')
    }
  }, [isAuthenticated, router])

  // Charger l'adresse de l'utilisateur
  useEffect(() => {
    if (user) {
      const codePostal = user.codePostal || ''
      const detectedPays = codePostal ? detectCountryFromPostalCode(codePostal) : 'FR'
      setLivraisonAddress({
        adresse: user.adresse || '',
        codePostal: codePostal,
        ville: user.ville || '',
        telephone: user.telephone || '',
        pays: detectedPays
      })
    }
  }, [user])

  // Auto-détecter le pays quand le code postal change
  useEffect(() => {
    if (livraisonAddress.codePostal) {
      const detectedPays = detectCountryFromPostalCode(livraisonAddress.codePostal)
      if (detectedPays !== livraisonAddress.pays) {
        setLivraisonAddress({ ...livraisonAddress, pays: detectedPays })
      }
    }
  }, [livraisonAddress.codePostal])

  // Charger les dates disponibles pour Wavignies
  useEffect(() => {
    if (retraitMode === 'wavignies-rdv') {
      const dates = getNextAvailableDates(20)
      // Filtrer pour s'assurer que seuls les mardis et jeudis sont inclus
      const filteredDates = dates.filter(date => {
        const dayName = getDayName(date)
        return dayName === 'Mardi' || dayName === 'Jeudi'
      })
      setAvailableDates(filteredDates)
    } else {
      setAvailableDates([])
    }
  }, [retraitMode])

  // Charger les créneaux disponibles quand une date est sélectionnée
  useEffect(() => {
    if (retraitMode === 'wavignies-rdv' && rdvDate) {
      const slots = getAvailableTimeSlots(rdvDate)
      setTimeSlots(slots)
      // Réinitialiser le créneau si la date change
      setRdvTimeSlot('')
    } else {
      setTimeSlots([])
    }
  }, [retraitMode, rdvDate])

  // Calculer le poids total du panier depuis la base de données
  useEffect(() => {
    const calculateWeight = async () => {
      console.log('🛒 Calcul du poids du panier - Articles:', cartItems.map(item => ({
        produit: item.produit,
        conditionnement: item.conditionnement,
        quantite: item.quantite
      })))
      const weight = await calculateCartWeightAsync(cartItems)
      console.log('🛒 Poids total du panier calculé:', weight.toFixed(2), 'kg')
      setTotalWeight(weight)
    }
    calculateWeight()
  }, [cartItems])

  // Gérer le mode de livraison selon le poids
  // 0-18 kg: Point relais uniquement
  // 18.01-28 kg: Domicile uniquement
  // 28.01-38 kg: Point relais (2 colis)
  // 38.01-50 kg: Domicile (2 colis)
  // >50 kg: Nous contacter (blocage)
  useEffect(() => {
    // Forcer le mode selon le poids ET le pays
    // Belgique : toujours point relais uniquement
    if (livraisonAddress.pays === 'BE') {
      if (retraitMode === 'livraison') {
        console.log(`⚠️ Belgique - Forçage Chronopost Relais`)
        setRetraitMode('chronopost-relais')
      }
      return
    }
    
    // France : règles selon le poids
    if (totalWeight <= 18) {
      // 0-18 kg: Point relais uniquement
      if (retraitMode === 'livraison') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg <= 18kg - Forçage Chronopost Relais`)
        setRetraitMode('chronopost-relais')
      }
    } else if (totalWeight > 18 && totalWeight <= 28) {
      // 18.01-28 kg: Domicile uniquement
      if (retraitMode === 'chronopost-relais') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 18.01-28kg - Forçage Livraison domicile`)
        setRetraitMode('livraison')
      }
    } else if (totalWeight > 28 && totalWeight <= 38) {
      // 28.01-38 kg: Point relais (2 colis)
      if (retraitMode === 'livraison') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 28.01-38kg - Forçage Chronopost Relais (2 colis)`)
        setRetraitMode('chronopost-relais')
      }
    } else if (totalWeight > 38 && totalWeight <= 50) {
      // 38.01-50 kg: Domicile (2 colis)
      if (retraitMode === 'chronopost-relais') {
        console.log(`⚠️ Poids ${totalWeight.toFixed(2)}kg entre 38.01-50kg - Forçage Livraison domicile (2 colis)`)
        setRetraitMode('livraison')
      }
    }
    // >50 kg: pas de forçage, mais blocage affiché ailleurs
  }, [totalWeight, retraitMode, livraisonAddress.pays])

  // Calculer le prix d'expédition basé sur les tarifs configurés
  useEffect(() => {
    const calculateShippingCost = async () => {
      // Pour la livraison à domicile, on a besoin de l'adresse complète
      // Pour les points relais, on a besoin du code postal OU du pays sélectionné manuellement
      const hasRequiredData = retraitMode === 'livraison' 
        ? (livraisonAddress.adresse && livraisonAddress.codePostal && livraisonAddress.ville)
        : (livraisonAddress.codePostal || livraisonAddress.pays)
      
      if ((retraitMode === 'livraison' || retraitMode === 'chronopost-relais') && hasRequiredData) {
        
        // Utiliser le poids total calculé depuis la base de données
        // (déjà calculé dans le useEffect précédent)
        
        // Déterminer le pays pour calculer le nombre de colis
        let country: 'FR' | 'BE' = livraisonAddress.pays || 'FR'
        if (!country && livraisonAddress.codePostal) {
          country = detectCountryFromPostalCode(livraisonAddress.codePostal)
        }
        
        // Calculer le nombre de colis selon le pays
        let numberOfPackages = 1
        let weightForPricing = totalWeight
        
        if (country === 'BE') {
          // Règles pour la Belgique : 18 kg par colis
          if (totalWeight <= 18) {
            numberOfPackages = 1
            weightForPricing = totalWeight
          } else if (totalWeight > 18 && totalWeight <= 36) {
            numberOfPackages = 2
            weightForPricing = totalWeight / 2
          } else if (totalWeight > 36 && totalWeight <= 54) {
            numberOfPackages = 3
            weightForPricing = totalWeight / 3
          } else {
            // > 54 kg : bloqué (affiché ailleurs)
            numberOfPackages = 0
            weightForPricing = totalWeight
          }
        } else {
          // Règles pour la France : 28 kg pour 2 colis
          if (totalWeight > 28 && totalWeight <= 50) {
            numberOfPackages = 2
            weightForPricing = totalWeight / 2
          } else {
            numberOfPackages = 1
            weightForPricing = totalWeight
          }
        }
        
        const isDoubleShipment = numberOfPackages >= 2
        
        // Log pour debug
        console.log('🛒 Calcul expédition - Articles:', cartItems.length, 
          'Quantité totale:', cartItems.reduce((sum, item) => sum + item.quantite, 0),
          'Poids total RÉEL (depuis DB):', totalWeight.toFixed(2), 'kg',
          `(${numberOfPackages} colis de ${weightForPricing.toFixed(2)}kg chacun)`,
          'Pays:', country)

        // Calculer la valeur totale avec promotion
        const totalValue = cartItems.reduce(
          (sum, item) => {
            if (item.isGratuit) return sum
            
            let itemPrice = item.prix
            if (promotion && promotion.active) {
              const prixBase = item.prixOriginal !== undefined ? item.prixOriginal : item.prix
              if (promotion.applyToAll) {
                itemPrice = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
              } else if (item.category || item.gamme) {
                itemPrice = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
              }
            }
            
            return sum + (itemPrice * item.quantite)
          },
          0
        )

        try {
          // Déterminer le type d'envoi selon le mode de retrait
          const shippingType = retraitMode === 'livraison' ? 'home' : 'relay'
          
          // Le pays a déjà été déterminé plus haut
          console.log('🌍 Pays utilisé pour calcul:', country, 'code postal:', livraisonAddress.codePostal, 'pays sélectionné:', livraisonAddress.pays)
          
          // Récupérer le tarif actif selon le type d'envoi et le pays
          const shippingPrice = await getActiveShippingPrice(shippingType, country)
          
          if (shippingPrice) {
            console.log('📦 Tarif trouvé:', shippingPrice.name, 'Type:', shippingPrice.type)

            // Livraison gratuite si seuil atteint
            if (shippingPrice.free_shipping_threshold && totalValue >= shippingPrice.free_shipping_threshold) {
              console.log('🎁 Livraison gratuite: seuil atteint', shippingPrice.free_shipping_threshold, '€')
              setShippingCost(0)
              return
            }
            
            // Vérifier le prix minimum de commande
            if (shippingPrice.min_order_value && totalValue < shippingPrice.min_order_value) {
              console.log('⚠️ Commande inférieure au minimum requis:', shippingPrice.min_order_value, '€')
              // Utiliser un prix par défaut si le minimum n'est pas atteint
              const defaultPrice = weightForPricing <= 1 ? 10 : weightForPricing <= 5 ? 15 : 20
              setShippingCost(numberOfPackages > 1 ? defaultPrice * numberOfPackages : defaultPrice)
              return
            }
            
            // Vérifier les limites de poids (utiliser weightForPricing pour le calcul)
            if (shippingPrice.min_weight && weightForPricing < shippingPrice.min_weight) {
              console.log('⚠️ Poids inférieur au minimum:', shippingPrice.min_weight, 'kg')
              const defaultPrice = weightForPricing <= 1 ? 10 : weightForPricing <= 5 ? 15 : 20
              setShippingCost(numberOfPackages > 1 ? defaultPrice * numberOfPackages : defaultPrice)
              return
            }
            if (shippingPrice.max_weight && weightForPricing > shippingPrice.max_weight) {
              console.log('⚠️ Poids supérieur au maximum:', shippingPrice.max_weight, 'kg')
              const defaultPrice = weightForPricing <= 1 ? 10 : weightForPricing <= 5 ? 15 : 20
              setShippingCost(numberOfPackages > 1 ? defaultPrice * numberOfPackages : defaultPrice)
              return
            }
            
            // Calculer le prix selon le type de tarif (utiliser weightForPricing)
            let finalPrice = 0
            
            if (shippingPrice.type === 'fixed' && shippingPrice.fixed_price !== undefined) {
              finalPrice = shippingPrice.fixed_price
              console.log('💰 Prix fixe:', finalPrice, '€')
            } else if (shippingPrice.type === 'weight_ranges' && shippingPrice.weight_ranges) {
              // Trouver la tranche de poids correspondante (utiliser weightForPricing)
              let found = false
              for (const range of shippingPrice.weight_ranges) {
                if (weightForPricing >= range.min && (range.max === null || weightForPricing <= range.max)) {
                  finalPrice = range.price
                  found = true
                  console.log('📊 Tranche trouvée:', range.min, '-', range.max || '∞', 'kg →', finalPrice, '€')
                  break
                }
              }
              // Si aucune tranche ne correspond, utiliser un prix par défaut
              if (!found) {
                console.warn('⚠️ Aucune tranche de poids ne correspond, utilisation prix par défaut')
                finalPrice = weightForPricing <= 1 ? 10 : weightForPricing <= 5 ? 15 : 20
              }
            } else if (shippingPrice.type === 'margin_percent' && shippingPrice.margin_percent !== undefined) {
              // Pour les marges en pourcentage, on a besoin d'un prix de base
              // Utiliser un prix de base par défaut basé sur le poids
              const basePrice = weightForPricing <= 1 ? 10 : weightForPricing <= 5 ? 15 : 20
              finalPrice = basePrice * (1 + shippingPrice.margin_percent / 100)
              console.log('📈 Marge %:', shippingPrice.margin_percent, '% sur', basePrice, '€ =', finalPrice, '€')
            } else if (shippingPrice.type === 'margin_fixed' && shippingPrice.margin_fixed !== undefined) {
              // Pour les marges fixes, on a besoin d'un prix de base
              const basePrice = weightForPricing <= 1 ? 10 : weightForPricing <= 5 ? 15 : 20
              finalPrice = basePrice + shippingPrice.margin_fixed
              console.log('➕ Marge fixe:', shippingPrice.margin_fixed, '€ sur', basePrice, '€ =', finalPrice, '€')
            } else {
              // Type non reconnu, utiliser un prix par défaut
              console.warn('⚠️ Type de tarif non reconnu:', shippingPrice.type)
              finalPrice = weightForPricing <= 1 ? 10 : weightForPricing <= 5 ? 15 : 20
            }
            
            // Doubler le prix si 2 colis
            if (isDoubleShipment) {
              console.log('📦📦 Double expédition: prix unitaire', finalPrice, '€ x 2 =', finalPrice * 2, '€')
              finalPrice = finalPrice * 2
            }
            
            // Appliquer le prix calculé
            let rounded = Math.round(finalPrice * 100) / 100
            
            // Appliquer le tarif sponsor si applicable (remplace le tarif normal)
            console.log('🎁 Vérification sponsor - user:', user?.email, 'isSponsored:', user?.isSponsored)
            if (user?.isSponsored === true) {
              console.log('🎁 Utilisateur sponsor détecté, récupération du tarif pour poids:', weightForPricing, 'kg')
              const sponsorPrice = await getSponsorShippingPrice(weightForPricing)
              console.log('🎁 Tarif sponsor retourné:', sponsorPrice)
              if (sponsorPrice !== null && sponsorPrice >= 0) {
                const normalPrice = rounded
                // Multiplier aussi le tarif sponsor par le nombre de colis
                rounded = numberOfPackages > 1 ? sponsorPrice * numberOfPackages : sponsorPrice
                const discount = Math.max(0, normalPrice - rounded)
                console.log(`🎁 Tarif sponsor appliqué: ${rounded}€ (économie: ${discount.toFixed(2)}€)`)
                setSponsorShippingDiscount(discount)
              } else {
                console.log('⚠️ Pas de tarif sponsor trouvé pour ce poids')
                setSponsorShippingDiscount(0)
              }
            } else {
              console.log('ℹ️ Utilisateur non sponsor ou isSponsored non défini')
              setSponsorShippingDiscount(0)
            }
            
            setShippingCost(rounded)
            console.log('✅ Prix d\'expédition final:', rounded, '€ (poids:', totalWeight.toFixed(2), 'kg, valeur:', totalValue.toFixed(2), '€)')
          } else {
            // Pas de tarif configuré, utiliser un prix par défaut simple
            const defaultPrice = totalWeight <= 1 ? 10 : totalWeight <= 5 ? 15 : 20
            setShippingCost(defaultPrice)
            console.log('⚠️ Aucun tarif configuré, utilisation prix par défaut:', defaultPrice, '€')
          }
        } catch (error) {
          console.error('❌ Erreur lors du calcul du prix d\'expédition:', error)
          // En cas d'erreur, utiliser un prix par défaut
          const defaultPrice = totalWeight <= 1 ? 10 : totalWeight <= 5 ? 15 : 20
          setShippingCost(defaultPrice)
        }
      } else {
        // Réinitialiser le prix si l'adresse n'est pas complète ou si ce n'est pas une livraison
        setShippingCost(0)
      }
    }

    calculateShippingCost()
  }, [retraitMode, livraisonAddress, cartItems, totalWeight, promotion, user])

  // Vérifier si un produit est disponible à l'amicale
  const isAvailableAtAmicale = (item: typeof cartItems[0]): boolean => {
    // Si le produit a déjà pointRetrait === 'amicale-blanc', il est disponible
    if (item.pointRetrait === 'amicale-blanc') {
      return true
    }

    const produitsDisponibles = JSON.parse(localStorage.getItem('amicale-blanc-produits') || '[]')
    
    // Pour les bouillettes
    if (item.arome && item.diametre && item.conditionnement) {
      const productId = getBouilletteId(item.arome, item.diametre, item.conditionnement)
      return produitsDisponibles.includes(productId)
    }

    // Pour les autres produits, vérifier dans TOUS_LES_PRODUITS
    const produit = TOUS_LES_PRODUITS.find(p => {
      if (item.produit === 'Bouillette' && item.arome && item.diametre && item.conditionnement) {
        return p.gamme === item.arome && p.diametre === item.diametre && p.conditionnement === item.conditionnement
      }
      // Pop-up Duo
      if (item.produit === 'Pop-up Duo' && item.arome && item.taille) {
        return p.categorie === 'Pop-up Duo' && p.saveur === item.arome && p.forme === item.taille
      }
      // Bar à Pop-up
      if (item.produit === 'Pop-up personnalisé' && item.couleur && item.taille && item.arome) {
        return p.categorie === 'Bar à Pop-up' && p.couleur === item.couleur && p.taille === item.taille && p.arome === item.arome
      }
      return false
    })

    return produit ? produitsDisponibles.includes(produit.id) : false
  }

  // Séparer les produits disponibles à l'amicale
  const produitsDisponiblesAmicale = cartItems.filter(item => isAvailableAtAmicale(item))
  const produitsAutres = cartItems.filter(item => !isAvailableAtAmicale(item))

  // Fonction pour valider le code promo
  const handleValidatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Veuillez entrer un code promo')
      setPromoValidation(null)
      return
    }

    // Préparer les items du panier avec leurs informations (catégorie, gamme, conditionnement)
    const cartItemsForPromo = await Promise.all(
      cartItems
        .filter(item => !item.isGratuit) // Exclure les articles gratuits
        .map(async (item) => {
          // Récupérer les infos du produit si disponible
          let category: string | undefined
          let gamme: string | undefined
          
          if (item.productId) {
            const product = await getProductById(item.productId)
            if (product) {
              category = product.category
              gamme = product.gamme
            }
          }

          // Pour les bouillettes, la catégorie est "bouillettes"
          if (item.produit === 'Bouillette' || item.produit.includes('Bouillette')) {
            category = 'bouillettes'
          }

          // Pour les huiles et liquides
          if (item.produit.toLowerCase().includes('huile') || item.produit.toLowerCase().includes('liquide')) {
            category = 'huiles'
          }

          return {
            id: item.id,
            productId: item.productId,
            category,
            gamme: gamme || item.arome, // Utiliser arome comme fallback pour gamme
            conditionnement: item.conditionnement,
            prix: item.prix,
            quantite: item.quantite
          }
        })
    )

    const validation = await validatePromoCode(
      promoCode.trim(),
      user?.id || null,
      cartItemsForPromo,
      totalWithPromotion // Utiliser le total avec promotion pour la validation du code promo
    )

    if (validation.valid) {
      setPromoValidation(validation)
      setPromoError(null)
    } else {
      setPromoValidation(null)
      setPromoError(validation.error || 'Code promo invalide')
    }
  }

  // Calculer le total avec réduction (utiliser totalWithPromotion au lieu de total)
  const totalWithDiscount = promoValidation && promoValidation.discount
    ? Math.max(0, totalWithPromotion - promoValidation.discount)
    : totalWithPromotion

    // Calculer le prix d'expédition (gratuit pour retrait, prix configuré pour livraison)
  // shippingCost = -1 signifie erreur d'estimation
  const shippingError = (retraitMode === 'livraison' || retraitMode === 'chronopost-relais') && shippingCost === -1
  const calculatedShippingCost = (retraitMode === 'livraison' || retraitMode === 'chronopost-relais')
    ? (shippingCost > 0 ? shippingCost : 0) // Prix configuré (0 si pas encore calculé ou erreur)
    : 0 // Gratuit pour retrait

  // Totaux PayPal (arrondis à 2 décimales) : total = item_total + shipping
  const paypalItemTotal = round2(totalWithDiscount)
  const paypalShippingTotal = round2(calculatedShippingCost)
  const paypalTotal = round2(paypalItemTotal + paypalShippingTotal)

  // Total final avec expédition
  const finalTotal = paypalTotal

  // Vérifier si le formulaire est valide pour le paiement
  const isFormValid = () => {
    // Bloquer si le poids dépasse 50 kg
    if (totalWeight > 50) {
      return false
    }
    
    // Les CGV doivent toujours être acceptées
    if (!cgvAccepted) {
      return false
    }
    
    if (retraitMode === 'livraison') {
      // Bloquer si le prix n'est pas encore calculé (> 0 requis)
      if (shippingCost <= 0) {
        return false
      }
      return livraisonAddress.adresse && livraisonAddress.codePostal && livraisonAddress.ville
    }
    if (retraitMode === 'chronopost-relais') {
      // Mode test : permettre le paiement même sans point relais sélectionné
      // Mode test pour valider le formulaire
      const MODE_TEST = true // Mettre à false quand l'API est configurée
      
      if (MODE_TEST) {
        // En mode test, on accepte même sans point relais sélectionné
        // Vérifier juste le code postal pour le calcul du prix (4 ou 5 chiffres)
        if (!isValidPostalCode(livraisonAddress.codePostal)) {
          return false
        }
        return true
      }
      
      // Mode production : vérifier qu'un point relais est sélectionné
      // Accepter soit chronopostRelaisPoint soit boxtalParcelPoint
      if (!chronopostRelaisPoint && !boxtalParcelPoint) {
        return false
      }
      if (!isValidPostalCode(livraisonAddress.codePostal)) {
        return false
      }
      // Le prix d'expédition peut être 0 (gratuit) ou > 0
      return true
    }
    if (retraitMode === 'wavignies-rdv') {
      return rdvDate && rdvTimeSlot && isAvailableDay(rdvDate)
    }
    if (retraitMode === 'amicale-blanc') {
      return true
    }
    return false
  }

  const handleSubmit = async () => {
    // Valider les champs requis selon le mode de retrait
    if (retraitMode === 'livraison' && (!livraisonAddress.adresse || !livraisonAddress.codePostal || !livraisonAddress.ville)) {
      alert('Veuillez remplir l\'adresse de livraison')
      return
    }


    if (retraitMode === 'wavignies-rdv') {
      if (!rdvDate || !rdvTimeSlot) {
        alert('Veuillez sélectionner une date et un créneau pour le retrait à Wavignies')
        return
      }

      // Vérifier que c'est un mardi ou jeudi
      if (!isAvailableDay(rdvDate)) {
        alert('Les rendez-vous sont disponibles uniquement le mardi et le jeudi')
        return
      }

      // Créer le rendez-vous
      if (!user) {
        alert('Erreur: utilisateur non connecté')
        return
      }

      const result = createAppointment(
        rdvDate,
        rdvTimeSlot,
        user.id || user.email,
        user.nom || user.email,
        user.email,
        livraisonAddress.telephone
      )

      if (!result.success) {
        alert(result.message)
        return
      }
    }

    // Préparer la commande pour Monetico
    if (!user) {
      alert('Erreur: utilisateur non connecté')
      return
    }

    // Générer une référence de commande unique
    const orderReference = generateOrderReference()

    // Préparer les données de commande
    const orderData = {
      montant: finalTotal, // Utiliser le total final avec expédition
      reference: orderReference,
      email: user.email,
      retraitMode,
      rdvDate: retraitMode === 'wavignies-rdv' ? rdvDate : undefined,
      rdvTimeSlot: retraitMode === 'wavignies-rdv' ? rdvTimeSlot : undefined,
      livraisonAddress: retraitMode === 'livraison' ? livraisonAddress : undefined,
      chronopostRelaisPoint: retraitMode === 'chronopost-relais' ? chronopostRelaisPoint : undefined,
      promoCode: promoValidation && promoValidation.valid ? promoCode : undefined,
      discount: promoValidation && promoValidation.valid ? promoValidation.discount : undefined,
      comment: orderComment.trim() || undefined,
    }

    // Sauvegarder temporairement la commande avant paiement
    const pendingOrder = {
      reference: orderReference,
      cartItems,
      total: finalTotal, // Sauvegarder le total final avec expédition
      originalTotal: total,
      shippingCost: calculatedShippingCost,
      promoCode: promoValidation && promoValidation.valid ? promoCode : null,
      discount: promoValidation && promoValidation.valid ? promoValidation.discount : null,
      retraitMode,
      rdvDate: retraitMode === 'wavignies-rdv' ? rdvDate : null,
      rdvTimeSlot: retraitMode === 'wavignies-rdv' ? rdvTimeSlot : null,
      livraisonAddress: retraitMode === 'livraison' ? livraisonAddress : null,
      chronopostRelaisPoint: retraitMode === 'chronopost-relais' ? chronopostRelaisPoint : null,
      boxtalParcelPoint: retraitMode === 'chronopost-relais' ? boxtalParcelPoint : null,
      customerPhone: (livraisonAddress.telephone || user.telephone || '').trim() || null,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(`pending-order-${orderReference}`, JSON.stringify(pendingOrder))

    // Mode test : créer directement la commande sans passer par Monetico
    if (TEST_PAYMENT_MODE) {
      try {
        // Créer les items de commande avec toutes les informations de variante
        const orderItems = cartItems.map((item) => ({
          product_id: item.productId || item.produit || `product-${item.id}`,
          variant_id: item.variantId || undefined,
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

        // Créer la commande directement (avec le total incluant l'expédition)
        const commentValue = orderComment.trim() || undefined
        // Appel conditionnel pour éviter les problèmes de typage TypeScript
        const order = commentValue 
          ? await createOrder(
              user?.id || '',
              orderReference,
              finalTotal,
              orderItems,
              'test',
              calculatedShippingCost,
              commentValue
            )
          : await createOrder(
              user?.id || '',
              orderReference,
              finalTotal,
              orderItems,
              'test',
              calculatedShippingCost
            )

        // Enregistrer l'utilisation du code promo APRÈS création de la commande
        if (promoValidation && promoValidation.valid && promoCode && order?.id && user?.id) {
          const promoCodeObj = await getPromoCodeByCode(promoCode)
          if (promoCodeObj) {
            await recordPromoCodeUsageAsync(
              promoCodeObj.id,
              user.id,
              order.id,
              promoValidation.discount || 0
            )
          }
        }

        // La commande est créée avec le statut 'pending' (en attente) par défaut
        // Le statut sera changé manuellement depuis l'admin

        // Sauvegarder l'adresse de livraison dans la commande et le profil utilisateur
        if (retraitMode === 'livraison' && order.id) {
          // Sauvegarder l'adresse dans le profil utilisateur
          if (user?.id && livraisonAddress.adresse && livraisonAddress.codePostal && livraisonAddress.ville) {
            try {
              await updateUserProfile(user.id, {
                adresse: livraisonAddress.adresse,
                codePostal: livraisonAddress.codePostal,
                ville: livraisonAddress.ville,
                telephone: livraisonAddress.telephone || user.telephone
              })
              console.log('✅ Adresse sauvegardée dans le profil')
            } catch (profileError) {
              console.warn('⚠️ Erreur lors de la sauvegarde de l\'adresse:', profileError)
            }
          }
          
          // Sauvegarder l'adresse dans la commande
          try {
            const { getSupabaseClient } = await import('@/lib/supabase')
            const supabase = getSupabaseClient()
            if (supabase) {
              await supabase
                .from('orders')
                .update({
                  shipping_address: {
                    adresse: livraisonAddress.adresse,
                    codePostal: livraisonAddress.codePostal,
                    ville: livraisonAddress.ville,
                    telephone: livraisonAddress.telephone
                  }
                })
                .eq('id', order.id)
              console.log('✅ Adresse de livraison sauvegardée dans la commande')
            }
          } catch (addressError) {
            console.warn('⚠️ Erreur lors de la sauvegarde de l\'adresse dans la commande:', addressError)
          }
        }

        // Sauvegarder le point relais dans la commande (Boxtal ou Chronopost)
        if (retraitMode === 'chronopost-relais' && order.id) {
          try {
            const { getSupabaseClient } = await import('@/lib/supabase')
            const supabase = getSupabaseClient()
            if (supabase) {
              // Priorité à boxtalParcelPoint, sinon chronopostRelaisPoint
              if (boxtalParcelPoint) {
                const pointAddress = boxtalParcelPoint.address || {} as any
                const rawData = (boxtalParcelPoint as any).rawData || boxtalParcelPoint
                
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
                      identifiant: boxtalParcelPoint.code || '',
                      nom: boxtalParcelPoint.name || '',
                      adresseComplete: fullAddress,
                      adresse: street,
                      codePostal: postalCode,
                      ville: city,
                      pays: pointAddress.country || pointAddress.countryCode || 'FR',
                      coordonnees: boxtalParcelPoint.coordinates || {},
                      network: boxtalParcelPoint.network || '',
                      telephone: (livraisonAddress.telephone || user?.telephone || '').trim() || undefined,
                      codePostalRecherche: livraisonAddress.codePostal || '',
                      villeRecherche: livraisonAddress.ville || '',
                      pointRelais: boxtalParcelPoint
                    }
                  })
                  .eq('id', order.id)
                console.log('✅ Point relais Boxtal sauvegardé dans la commande')
              } else if (chronopostRelaisPoint) {
                await supabase
                  .from('orders')
                  .update({
                    shipping_address: {
                      type: 'chronopost-relais',
                      identifiant: chronopostRelaisPoint.identifiant,
                      nom: chronopostRelaisPoint.nom,
                      adresse: chronopostRelaisPoint.adresse,
                      codePostal: chronopostRelaisPoint.codePostal,
                      ville: chronopostRelaisPoint.ville,
                      horaires: chronopostRelaisPoint.horaires,
                      coordonnees: chronopostRelaisPoint.coordonnees,
                      telephone: (livraisonAddress.telephone || user?.telephone || '').trim() || undefined,
                    }
                  })
                  .eq('id', order.id)
                console.log('✅ Point relais Chronopost sauvegardé dans la commande')
              }
            }
          } catch (relaisError) {
            console.warn('⚠️ Erreur lors de la sauvegarde du point relais:', relaisError)
          }
        }

        // Sauvegarder les informations de retrait à Wavignies (incl. téléphone)
        if (retraitMode === 'wavignies-rdv' && order.id && rdvDate && rdvTimeSlot) {
          try {
            const { getSupabaseClient } = await import('@/lib/supabase')
            const supabase = getSupabaseClient()
            if (supabase) {
              await supabase
                .from('orders')
                .update({
                  shipping_address: {
                    type: 'wavignies-rdv',
                    rdvDate: rdvDate,
                    rdvTimeSlot: rdvTimeSlot,
                    adresse: 'Retrait sur rendez-vous à Wavignies (60130)',
                    ville: 'Wavignies',
                    codePostal: '60130',
                    telephone: (livraisonAddress.telephone || user?.telephone || '').trim() || undefined,
                  }
                })
                .eq('id', order.id)
              console.log('✅ Informations de retrait Wavignies sauvegardées dans la commande')
            }
          } catch (wavigniesError) {
            console.warn('⚠️ Erreur lors de la sauvegarde du retrait Wavignies:', wavigniesError)
          }
        }

        // Supprimer la commande en attente
        localStorage.removeItem(`pending-order-${orderReference}`)
        
        // Envoyer notification Telegram
        try {
          await sendNewOrderNotification({
            reference: orderReference,
            total: finalTotal,
            itemCount: cartItems.length,
            customerName: user?.nom || user?.email,
            customerEmail: user?.email,
            shippingCost: calculatedShippingCost,
            retraitMode: retraitMode,
            items: cartItems.map(item => ({
              produit: item.produit,
              quantity: item.quantite,
              price: item.prix
            }))
          })
        } catch (telegramError) {
          console.warn('⚠️ Erreur notification Telegram:', telegramError)
        }

        // Vider le panier
        clearCart()

        // Rediriger vers la page de succès
        router.push(`/payment/success?reference=${orderReference}&montant=${finalTotal.toFixed(2)}&test=true`)
        return
      } catch (error: any) {
        console.error('Erreur lors de la création de la commande test:', error)
        
        // Message d'erreur plus détaillé
        let errorMessage = 'Erreur lors de la création de la commande test.'
        
        if (error?.message) {
          errorMessage = error.message
          
          // Vérifier si c'est un problème de configuration Supabase
          if (error.message.includes('Supabase non configuré') || 
              error.message.includes('NEXT_PUBLIC_SUPABASE')) {
            errorMessage = 'Supabase n\'est pas configuré. Vérifiez votre fichier .env.local et redémarrez le serveur.\n\nAssurez-vous d\'avoir :\n- NEXT_PUBLIC_SUPABASE_URL\n- NEXT_PUBLIC_SUPABASE_ANON_KEY'
          }
        }
        
        alert(errorMessage)
        return
      }
    }

    // Paiement par carte bleue (Monetico)
    try {
      await submitMoneticoPayment(orderData)
    } catch (error) {
      console.error('Erreur lors de la redirection vers Monetico:', error)
      alert('Erreur lors de la redirection vers le paiement. Veuillez réessayer.')
    }
  }


  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au panier
          </Link>
        </div>

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Livraison et retrait</h1>
          <p className="text-lg text-gray-400">Choisissez comment vous souhaitez recevoir votre commande</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale - Liste des produits et choix de retrait */}
          <div className="lg:col-span-2 space-y-6">
            {/* Liste des produits */}
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Vos produits</h2>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const availableAtAmicale = isAvailableAtAmicale(item)
                  // Trouver la réduction du code promo pour cet article
                  const promoItemDiscount = promoValidation?.appliedItems?.find(ai => ai.itemId === item.id)?.discount || 0
                  
                  return (
                    <div key={item.id} className="flex items-start justify-between p-4 bg-noir-900/50 rounded-lg border border-noir-700">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{item.produit}</h3>
                        <div className="text-sm text-gray-400 space-y-1">
                          {item.diametre && <p>Diamètre: {item.diametre}mm</p>}
                          {(item.conditionnement || item.format) && (
                            <p>Conditionnement: {item.conditionnement || item.format}</p>
                          )}
                          {item.taille && <p>Taille: {item.taille}</p>}
                          {item.arome && <p>Arôme: {item.arome}</p>}
                          {item.couleur && <p>Couleur: {item.couleur}</p>}
                          <p>Quantité: {item.quantite}</p>
                          {item.isGratuit && (
                            <span className="inline-block px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded mt-1">
                              OFFERT
                            </span>
                          )}
                          {availableAtAmicale && (
                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded mt-1 ml-2">
                              Disponible à l'amicale
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {item.isGratuit ? (
                          <p className="text-xl font-bold text-yellow-500">GRATUIT</p>
                        ) : (
                          <div>
                            {(() => {
                              const prixAvecPromo = getItemPrice(item)
                              const prixOriginal = item.prixOriginal !== undefined ? item.prixOriginal : item.prix
                              const hasPromotion = promotion && promotion.active && prixAvecPromo < prixOriginal
                              const prixApresPromoGlobale = prixAvecPromo * item.quantite
                              const prixFinal = prixApresPromoGlobale - promoItemDiscount
                              
                              return (
                                <div>
                                  {/* Prix original barré si promo globale */}
                                  {hasPromotion && (
                                    <p className="text-sm text-gray-500 line-through">
                                      {(prixOriginal * item.quantite).toFixed(2)} €
                                    </p>
                                  )}
                                  {/* Prix après promo globale, barré si code promo appliqué */}
                                  {promoItemDiscount > 0 ? (
                                    <>
                                      <p className="text-sm text-gray-400 line-through">
                                        {prixApresPromoGlobale.toFixed(2)} €
                                      </p>
                                      <p className="text-xl font-bold text-yellow-500">
                                        {prixFinal.toFixed(2)} €
                                      </p>
                                      <p className="text-xs text-green-400 mt-1">
                                        -{promoItemDiscount.toFixed(2)} € (code promo)
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-xl font-bold text-yellow-500">
                                      {prixApresPromoGlobale.toFixed(2)} €
                                    </p>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Choix du mode de retrait global */}
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Mode de retrait</h2>
              
              {/* Message informatif selon le poids */}
              {(() => {
                const country = livraisonAddress.pays || 'FR'
                const maxWeight = country === 'BE' ? 54 : 50
                const numberOfPackages = calculateNumberOfPackages(totalWeight, country)
                
                // Blocage total selon le pays
                if ((country === 'BE' && totalWeight > 54) || (country === 'FR' && totalWeight > 50)) {
                  return (
                    <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-300">
                          <p className="font-semibold mb-1">Commande trop lourde ({totalWeight.toFixed(1)} kg)</p>
                          <p className="mb-3">Les commandes de plus de {maxWeight} kg nécessitent un devis personnalisé. Contactez-nous :</p>
                          <div className="flex flex-wrap gap-2">
                            <a href="mailto:contact@devorbaits.com" className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-xs">
                              <span>📧</span> contact@devorbaits.com
                            </a>
                            <a href="tel:+33761288512" className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-xs">
                              <span>📞</span> 07 61 28 85 12
                            </a>
                            <a href="https://www.facebook.com/profile.php?id=100055390522858" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-xs">
                              <span>📘</span> Facebook
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                // Messages pour multi-colis selon le pays
                if (numberOfPackages > 1) {
                  const modeText = country === 'BE' ? 'en point relais' : (totalWeight > 38 ? 'à domicile' : 'en point relais')
                  return (
                    <div className="mb-4 bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Package className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-300">
                          <p className="font-semibold mb-1">Expédition en {numberOfPackages} colis ({totalWeight.toFixed(1)} kg)</p>
                          <p>Votre commande sera expédiée en <strong>{numberOfPackages} colis {modeText}</strong>. Les frais de port sont calculés en conséquence.</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                // 18.01-28 kg : Domicile uniquement
                if (totalWeight > 18 && totalWeight <= 28) {
                  return (
                    <div className="mb-4 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Truck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                          <p className="font-semibold mb-1">Livraison à domicile uniquement ({totalWeight.toFixed(1)} kg)</p>
                          <p>Les colis entre 18 et 28 kg sont livrés exclusivement <strong>à domicile</strong>.</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                // 0-18 kg : Point relais uniquement
                if (totalWeight > 0 && totalWeight <= 18) {
                  return (
                    <div className="mb-4 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                          <p className="font-semibold mb-1">Point relais uniquement ({totalWeight.toFixed(1)} kg)</p>
                          <p>Les colis de moins de 18 kg sont livrés exclusivement en <strong>point relais Chronopost</strong>.</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
              
              {/* Masquer les options si > limite selon le pays */}
              {(() => {
                const country = livraisonAddress.pays || 'FR'
                const maxWeight = country === 'BE' ? 54 : 50
                return totalWeight <= maxWeight
              })() && (
              <div className="space-y-3">
                {/* Option Livraison à domicile */}
                {(() => {
                  const country = livraisonAddress.pays || 'FR'
                  // Domicile disponible : 18.01-28 kg OU 38.01-50 kg (uniquement pour la France)
                  const isAvailable = country !== 'BE' && ((totalWeight > 18 && totalWeight <= 28) || (totalWeight > 38 && totalWeight <= 50))
                  const isDisabled = !isAvailable
                  const numberOfPackages = calculateNumberOfPackages(totalWeight, country)
                  const isMultiColis = numberOfPackages > 1
                  
                  return (
                    <label className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-noir-900/50'
                    }`}
                      style={{
                        borderColor: retraitMode === 'livraison' && !isDisabled ? '#EAB308' : '#374151',
                        backgroundColor: retraitMode === 'livraison' && !isDisabled ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                      }}>
                      <input
                        type="radio"
                        name="retrait-mode"
                        value="livraison"
                        checked={retraitMode === 'livraison'}
                        onChange={(e) => {
                          if (!isDisabled) {
                            setRetraitMode(e.target.value as RetraitMode)
                          }
                        }}
                        disabled={isDisabled}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="w-5 h-5 text-yellow-500" />
                          <span className="font-semibold text-lg">Livraison à domicile</span>
                          {isMultiColis && !isDisabled && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                              {numberOfPackages} colis
                            </span>
                          )}
                          {isDisabled && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                              Non disponible
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {isDisabled 
                            ? 'Disponible pour les colis de 18 à 28 kg ou de 38 à 50 kg'
                            : isMultiColis 
                              ? `Expédition en ${numberOfPackages} colis à votre adresse`
                              : 'Livraison de toute la commande à votre adresse'
                          }
                        </p>
                      </div>
                    </label>
                  )
                })()}

                {/* Option Chronopost Relais */}
                {(() => {
                  const country = livraisonAddress.pays || 'FR'
                  // Relais disponible : 0-18 kg OU 28.01-38 kg (ou toujours pour la Belgique)
                  const isAvailable = country === 'BE' || (totalWeight <= 18) || (totalWeight > 28 && totalWeight <= 38)
                  const isDisabled = !isAvailable
                  const numberOfPackages = calculateNumberOfPackages(totalWeight, country)
                  const isMultiColis = numberOfPackages > 1
                  
                  return (
                    <label className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-noir-900/50'
                    }`}
                      style={{
                        borderColor: retraitMode === 'chronopost-relais' && !isDisabled ? '#EAB308' : '#374151',
                        backgroundColor: retraitMode === 'chronopost-relais' && !isDisabled ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                      }}>
                      <input
                        type="radio"
                        name="retrait-mode"
                        value="chronopost-relais"
                        checked={retraitMode === 'chronopost-relais'}
                        onChange={(e) => {
                          if (!isDisabled) {
                            setRetraitMode(e.target.value as RetraitMode)
                          }
                        }}
                        disabled={isDisabled}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-5 h-5 text-yellow-500" />
                          <span className="font-semibold text-lg">Chronopost Relais</span>
                          {isMultiColis && !isDisabled && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                              {numberOfPackages} colis
                            </span>
                          )}
                          {isDisabled && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                              Non disponible
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {isDisabled 
                            ? 'Disponible pour les colis de moins de 18 kg ou de 28 à 38 kg'
                            : isMultiColis
                              ? `Expédition en ${numberOfPackages} colis en point relais`
                              : 'Retrait dans un point relais Chronopost près de chez vous'
                          }
                        </p>
                      </div>
                    </label>
                  )
                })()}

                {/* Option Amicale des pêcheurs */}
                {produitsDisponiblesAmicale.length > 0 && (
                  <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-noir-900/50"
                    style={{
                      borderColor: retraitMode === 'amicale-blanc' ? '#EAB308' : '#374151',
                      backgroundColor: retraitMode === 'amicale-blanc' ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                    }}>
                    <input
                      type="radio"
                      name="retrait-mode"
                      value="amicale-blanc"
                      checked={retraitMode === 'amicale-blanc'}
                      onChange={(e) => setRetraitMode(e.target.value as RetraitMode)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-lg">Retrait à L'amicale des pêcheurs au blanc</span>
                      </div>
                      <p className="text-sm text-gray-400">Retrait gratuit sur place ({produitsDisponiblesAmicale.length} produit(s) disponible(s))</p>
                    </div>
                  </label>
                )}

              </div>
              )}
              {/* Fin du bloc conditionnel pour poids <= 50 kg */}

              {/* Option Wavignies sur RDV - Toujours disponible */}
              <div className={`${totalWeight <= 50 ? 'mt-3' : ''}`}>
                <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-noir-900/50"
                  style={{
                    borderColor: retraitMode === 'wavignies-rdv' ? '#EAB308' : '#374151',
                    backgroundColor: retraitMode === 'wavignies-rdv' ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                  }}>
                  <input
                    type="radio"
                    name="retrait-mode"
                    value="wavignies-rdv"
                    checked={retraitMode === 'wavignies-rdv'}
                    onChange={(e) => setRetraitMode(e.target.value as RetraitMode)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-lg">Retrait sur RDV à Wavignies (60130)</span>
                    </div>
                    <p className="text-sm text-gray-400">Retrait gratuit sur rendez-vous</p>
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* Colonne latérale - Résumé et informations */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 space-y-6">
              <h2 className="text-2xl font-bold mb-4">Résumé</h2>

              {/* Code promo */}
              <div className="space-y-3 border-b border-noir-700 pb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-yellow-500" />
                  Code promo
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase())
                      setPromoError(null)
                      setPromoValidation(null)
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleValidatePromoCode()
                      }
                    }}
                    placeholder="Entrez votre code"
                    className="flex-1 px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  />
                  <button
                    onClick={handleValidatePromoCode}
                    className="px-4 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
                {promoError && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {promoError}
                  </p>
                )}
                {promoValidation && promoValidation.valid && (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Code promo appliqué ! Réduction de {promoValidation.discount?.toFixed(2)}€
                    </p>
                  </div>
                )}
              </div>

              {/* Résumé des produits */}
              <div className="space-y-3 border-b border-noir-700 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Nombre de produits:</span>
                  <span className="text-white font-semibold">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sous-total:</span>
                  <span className="text-white">{totalWithPromotion.toFixed(2)} €</span>
                </div>
                {promoValidation && promoValidation.valid && promoValidation.discount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      Réduction{promoCode.trim() ? ` (${promoCode.trim()})` : ''}:
                    </span>
                    <span className="text-green-400">-{promoValidation.discount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {retraitMode === 'livraison' || retraitMode === 'chronopost-relais' ? 'Expédition:' : 'Retrait:'}
                  </span>
                  <span className="text-white">
                    {retraitMode === 'livraison' || retraitMode === 'chronopost-relais' ? (
                      calculatedShippingCost > 0 ? (
                        `${calculatedShippingCost.toFixed(2)} €`
                      ) : livraisonAddress.adresse && livraisonAddress.codePostal && livraisonAddress.ville ? (
                        <span className="text-yellow-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Calcul en cours...
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Remplissez l'adresse</span>
                      )
                    ) : (
                      'Gratuit'
                    )}
                  </span>
                </div>
                {/* Affichage réduction sponsor sur l'expédition */}
                {sponsorShippingDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400 flex items-center gap-1">
                      <Ticket className="w-3 h-3" />
                      Tarif sponsor:
                    </span>
                    <span className="text-green-400">-{sponsorShippingDiscount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-lg pt-2 border-t border-noir-700">
                  <span className="text-gray-400 font-semibold">Total:</span>
                  <span className="text-yellow-500 font-bold">{finalTotal.toFixed(2)} €</span>
                </div>
              </div>

              {/* Point relais Boxtal sélectionné */}
              {retraitMode === 'chronopost-relais' && boxtalParcelPoint && (
                <div className="space-y-3 border-t border-noir-700 pt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-yellow-500" />
                    Point relais sélectionné
                  </h3>
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                    <p className="text-sm text-yellow-300 font-semibold mb-2">
                      {boxtalParcelPoint.name}
                    </p>
                    {boxtalParcelPoint.address?.street && (
                      <p className="text-xs text-gray-300">
                        {boxtalParcelPoint.address.street}
                      </p>
                    )}
                    {(boxtalParcelPoint.address?.postalCode || boxtalParcelPoint.address?.city) && (
                      <p className="text-xs text-gray-300">
                        {boxtalParcelPoint.address?.postalCode} {boxtalParcelPoint.address?.city}
                      </p>
                    )}
                    {boxtalParcelPoint.code && (
                      <p className="text-xs text-gray-400 mt-2">
                        Code: {boxtalParcelPoint.code}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Séparation des produits disponibles à l'amicale */}
              {produitsDisponiblesAmicale.length > 0 && retraitMode === 'livraison' && (
                <div className="space-y-4 border-t border-noir-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-500" />
                      Produits disponibles à l'amicale
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={separerAmicale}
                        onChange={(e) => setSeparerAmicale(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-noir-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                    </label>
                  </div>
                  
                  {separerAmicale && (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                      <p className="text-sm text-green-400 mb-3">
                        <strong>{produitsDisponiblesAmicale.length} produit(s)</strong> seront retirés à l'amicale des pêcheurs au blanc
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {produitsDisponiblesAmicale.map((item) => (
                          <div key={item.id} className="text-xs text-gray-300 bg-noir-900/50 rounded p-2">
                            <p className="font-semibold">{item.produit}</p>
                            {item.arome && <p>Arôme: {item.arome}</p>}
                            {item.taille && <p>Taille: {item.taille}</p>}
                            <p>Quantité: {item.quantite}</p>
                          </div>
                        ))}
                      </div>
                      {produitsAutres.length > 0 && (
                        <p className="text-sm text-gray-400 mt-3">
                          Les {produitsAutres.length} autre(s) produit(s) seront livrés à votre adresse
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Adresse de livraison */}
              {retraitMode === 'livraison' && (
                <div className="space-y-4 border-t border-noir-700 pt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-yellow-500" />
                    Adresse de livraison
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Adresse"
                      value={livraisonAddress.adresse}
                      onChange={(e) => setLivraisonAddress({ ...livraisonAddress, adresse: e.target.value })}
                      className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-sm placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Code postal (4 ou 5 chiffres)"
                        value={livraisonAddress.codePostal}
                        onChange={(e) => {
                          // Accepter jusqu'à 5 chiffres (France) ou 4 chiffres (Belgique)
                          const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 5)
                          // Auto-détecter le pays selon le code postal
                          const detectedPays = cleanValue ? detectCountryFromPostalCode(cleanValue) : 'FR'
                          setLivraisonAddress({ ...livraisonAddress, codePostal: cleanValue, pays: detectedPays })
                        }}
                        className="w-full border border-noir-700 rounded-lg px-4 py-2 text-sm placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none"
                        style={{ color: '#000000', backgroundColor: '#ffffff' }}
                        maxLength={5}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Ville"
                        value={livraisonAddress.ville}
                        onChange={(e) => setLivraisonAddress({ ...livraisonAddress, ville: e.target.value })}
                        className="w-full border border-noir-700 rounded-lg px-4 py-2 text-sm placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none"
                        style={{ color: '#000000', backgroundColor: '#ffffff' }}
                        required
                      />
                    </div>
                    <select
                      value={livraisonAddress.pays || 'FR'}
                      onChange={(e) => setLivraisonAddress({ ...livraisonAddress, pays: e.target.value as 'FR' | 'BE' })}
                      className="w-full border border-noir-700 rounded-lg px-4 py-2 text-sm placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      required
                    >
                      <option value="FR">🇫🇷 France</option>
                      <option value="BE">🇧🇪 Belgique</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={livraisonAddress.telephone}
                      onChange={(e) => setLivraisonAddress({ ...livraisonAddress, telephone: e.target.value })}
                      className="w-full border border-noir-700 rounded-lg px-4 py-2 text-sm placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
              )}

              {/* Sélection point relais Boxtal */}
              {retraitMode === 'chronopost-relais' && (
                <div className="space-y-4 border-t border-noir-700 pt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-yellow-500" />
                    Point relais Boxtal
                  </h3>
                  
                  {/* Code postal et pays pour calculer les tarifs */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Code postal (4 ou 5 chiffres)"
                      value={livraisonAddress.codePostal}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 5)
                        const detectedPays = cleanValue ? detectCountryFromPostalCode(cleanValue) : 'FR'
                        setLivraisonAddress({ ...livraisonAddress, codePostal: cleanValue, pays: detectedPays })
                      }}
                      className="w-full border border-noir-700 rounded-lg px-4 py-2 text-sm placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      maxLength={5}
                    />
                    <select
                      value={livraisonAddress.pays || 'FR'}
                      onChange={(e) => setLivraisonAddress({ ...livraisonAddress, pays: e.target.value as 'FR' | 'BE' })}
                      className="w-full border border-noir-700 rounded-lg px-4 py-2 text-sm placeholder:text-gray-500 focus:border-yellow-500 focus:outline-none"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    >
                      <option value="FR">🇫🇷 France</option>
                      <option value="BE">🇧🇪 Belgique</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-400">
                    Indiquez votre code postal et pays pour calculer les frais de port
                  </p>
                  
                  <div 
                    style={{ 
                      position: 'relative', 
                      zIndex: 1, 
                      isolation: 'isolate',
                      contain: 'layout style paint',
                      maxHeight: '450px',
                      overflow: 'hidden'
                    }}
                  >
                    <BoxtalRelayMap
                      active={retraitMode === 'chronopost-relais'}
                      onSelect={(parcelPoint) => {
                        setBoxtalParcelPoint(parcelPoint)
                        console.log('Point relais Boxtal sélectionné:', parcelPoint)
                      }}
                      initialCity={livraisonAddress.ville}
                      initialPostalCode={livraisonAddress.codePostal}
                    />
                  </div>
                </div>
              )}

              {/* RDV Wavignies */}
              {retraitMode === 'wavignies-rdv' && (
                <div className="space-y-4 border-t border-noir-700 pt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                    Rendez-vous à Wavignies (60130)
                  </h3>
                  
                  {/* Info */}
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-300">
                        <p className="font-semibold mb-1">Disponible uniquement :</p>
                        <p>• Mardi et Jeudi</p>
                        <p>• Créneaux : 15h-16h, 17h-18h, 18h-19h</p>
                        <p className="mt-2 text-yellow-400">
                          Besoin d'un autre créneau ? Contactez-nous
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sélection de la date */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-300">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Choisissez votre date <span className="text-red-400">*</span>
                    </label>
                    {availableDates.length === 0 ? (
                      <div className="bg-gray-500/10 border border-gray-500/50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-400">Aucune date disponible pour le moment</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {availableDates
                          .filter(date => {
                            const dayName = getDayName(date)
                            return dayName === 'Mardi' || dayName === 'Jeudi'
                          })
                          .map((date) => {
                            const dayName = getDayName(date)
                            const isMardi = dayName === 'Mardi'
                            const isJeudi = dayName === 'Jeudi'
                            const isSelected = rdvDate === date
                            
                            // Parser la date localement pour l'affichage
                            const [year, month, day] = date.split('-').map(Number)
                            const dateObj = new Date(year, month - 1, day)
                            
                            return (
                              <button
                                key={date}
                                type="button"
                                onClick={() => setRdvDate(date)}
                                className={`p-3 rounded-xl border-2 transition-all text-center ${
                                  isSelected
                                    ? 'border-yellow-500 bg-yellow-500/20 ring-2 ring-yellow-500/50'
                                    : 'border-noir-700 bg-noir-900 hover:border-yellow-500/50 hover:bg-noir-800'
                                }`}
                              >
                                <div className={`text-xs font-semibold mb-1 ${
                                  isMardi ? 'text-blue-400' : isJeudi ? 'text-purple-400' : 'text-gray-400'
                                }`}>
                                  {dayName}
                                </div>
                                <div className="text-sm font-bold text-white">
                                  {dateObj.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {year}
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    )}
                    {!rdvDate && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Veuillez sélectionner une date (Mardi ou Jeudi uniquement)
                      </p>
                    )}
                  </div>

                  {/* Sélection du créneau */}
                  {rdvDate ? (
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-300">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Choisissez votre créneau horaire <span className="text-red-400">*</span>
                      </label>
                      {timeSlots.length === 0 ? (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                          <p className="text-sm text-red-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Cette date n'est pas disponible (doit être un mardi ou jeudi)
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-3">
                            {timeSlots.map((slot) => {
                              const isSelected = rdvTimeSlot === slot.timeSlot
                              const placesLeft = MAX_BOOKINGS_PER_SLOT - slot.bookedCount
                              
                              return (
                                <button
                                  key={slot.timeSlot}
                                  type="button"
                                  onClick={() => setRdvTimeSlot(slot.timeSlot)}
                                  disabled={!slot.available}
                                  className={`relative p-4 rounded-xl border-2 transition-all ${
                                    isSelected
                                      ? 'border-yellow-500 bg-yellow-500/20 ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20'
                                      : slot.available
                                      ? 'border-noir-700 bg-noir-900 hover:border-yellow-500/50 hover:bg-noir-800 hover:shadow-lg'
                                      : 'border-red-500/50 bg-red-500/10 opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        isSelected
                                          ? 'bg-yellow-500/30 border-2 border-yellow-500'
                                          : slot.available
                                          ? 'bg-noir-800 border border-noir-600'
                                          : 'bg-red-500/20 border border-red-500/50'
                                      }`}>
                                        <Clock className={`w-6 h-6 ${
                                          isSelected ? 'text-yellow-500' : slot.available ? 'text-gray-400' : 'text-red-400'
                                        }`} />
                                      </div>
                                      <div className="text-left">
                                        <div className="font-bold text-lg text-white">{slot.timeSlot}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                          {slot.available 
                                            ? `${placesLeft} place${placesLeft > 1 ? 's' : ''} disponible${placesLeft > 1 ? 's' : ''}`
                                            : 'Complet'
                                          }
                                        </div>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="flex-shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-yellow-500" />
                                      </div>
                                    )}
                                    {!slot.available && !isSelected && (
                                      <div className="flex-shrink-0">
                                        <X className="w-5 h-5 text-red-400" />
                                      </div>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          {!rdvTimeSlot && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Veuillez sélectionner un créneau horaire
                            </p>
                          )}
                          {rdvTimeSlot && (
                            <div className="mt-4 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/50 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-green-300 mb-1">Créneau réservé</p>
                                  <p className="text-sm text-white">
                                    <strong className="text-yellow-400">{rdvTimeSlot}</strong> le{' '}
                                    <strong>{getDayName(rdvDate)} {new Date(rdvDate).toLocaleDateString('fr-FR', { 
                                      day: 'numeric', 
                                      month: 'long',
                                      year: 'numeric'
                                    })}</strong>
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/50 rounded-xl p-6 text-center">
                      <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Sélectionnez d'abord une date pour voir les créneaux disponibles</p>
                    </div>
                  )}

                  {/* Message pour autres créneaux */}
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                    <p className="text-xs text-yellow-300">
                      <strong>Autre créneau souhaité ?</strong> Contactez-nous pour convenir d'un rendez-vous personnalisé.
                    </p>
                  </div>
                </div>
              )}

              {/* Message de validation pour Wavignies */}
              {retraitMode === 'wavignies-rdv' && (!rdvDate || !rdvTimeSlot) && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-sm text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Veuillez sélectionner une date et un créneau avant de continuer</span>
                  </p>
                </div>
              )}

              {/* Commentaire de commande */}
              <div className="space-y-3 border-t border-noir-700 pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="w-5 h-5 text-yellow-500" />
                  Commentaire (optionnel)
                </h3>
                <textarea
                  value={orderComment}
                  onChange={(e) => {
                    const value = e.target.value.trimStart()
                    if (value.length <= 500) {
                      setOrderComment(value)
                    }
                  }}
                  placeholder="Ajoutez un commentaire pour votre commande (max 500 caractères)"
                  rows={4}
                  maxLength={500}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 text-right">
                  {orderComment.length}/500 caractères
                </p>
              </div>

              {/* Acceptation des CGV */}
              <div className="space-y-3 border-t border-noir-700 pt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={cgvAccepted}
                      onChange={(e) => setCgvAccepted(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-noir-600 bg-noir-900 text-yellow-500 focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    J'accepte les{' '}
                    <Link 
                      href="/cgv" 
                      target="_blank"
                      className="text-yellow-500 hover:text-yellow-400 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Conditions Générales de Vente
                    </Link>
                    {' '}et la{' '}
                    <Link 
                      href="/confidentialite" 
                      target="_blank"
                      className="text-yellow-500 hover:text-yellow-400 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Politique de Confidentialité
                    </Link>
                    {' '}<span className="text-red-400">*</span>
                  </span>
                </label>
                {!cgvAccepted && (
                  <p className="text-xs text-gray-500 ml-8">
                    Vous devez accepter les CGV pour continuer
                  </p>
                )}
              </div>

              {/* Choix du mode de paiement */}
              <div className="space-y-4 border-t border-noir-700 pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-yellow-500" />
                  Mode de paiement
                </h3>
                <div className="space-y-3">
                  {/* Option PayPal */}
                  <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-noir-900/50"
                    style={{
                      borderColor: paymentMethod === 'paypal' ? '#EAB308' : '#374151',
                      backgroundColor: paymentMethod === 'paypal' ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                    }}>
                    <input
                      type="radio"
                      name="payment-method"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0070BA">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.643h6.676c2.227 0 3.905.536 4.988 1.593 1.064 1.04 1.42 2.497 1.057 4.329-.026.127-.053.254-.082.381-.633 3.1-2.76 4.935-5.814 5.013H9.865a.77.77 0 0 0-.758.643l-.885 5.602a.641.641 0 0 1-.633.54z"/>
                        </svg>
                        <span className="font-semibold text-lg">PayPal</span>
                      </div>
                      <p className="text-sm text-gray-400">Paiement sécurisé via PayPal • Paiement en 4 fois disponible</p>
                    </div>
                  </label>

                  {/* Option Carte bleue */}
                  <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-noir-900/50"
                    style={{
                      borderColor: paymentMethod === 'card' ? '#EAB308' : '#374151',
                      backgroundColor: paymentMethod === 'card' ? 'rgba(234, 179, 8, 0.1)' : 'transparent'
                    }}>
                    <input
                      type="radio"
                      name="payment-method"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-lg">Carte bleue</span>
                      </div>
                      <p className="text-sm text-gray-400">Paiement sécurisé par Monetico</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bouton de paiement */}
              <div 
                className="mt-6" 
                style={{ 
                  position: 'relative', 
                  zIndex: 10000,
                  isolation: 'isolate',
                  pointerEvents: 'auto'
                }}
              >
                {paymentMethod === 'paypal' ? (
                  <div>
                    <PayPalButton
                      amount={paypalTotal}
                      itemTotal={paypalItemTotal}
                      shippingTotal={paypalShippingTotal}
                      reference={orderReference || paypalReference}
                      disabled={!isFormValid()}
                      onBeforePayment={() => {
                        // Générer la référence si pas encore fait
                        if (!orderReference) {
                          setOrderReference(paypalReference)
                        }
                      }}
                      onSuccess={async (orderId, paymentId) => {
                        try {
                          // Créer la commande après paiement PayPal réussi
                          const orderItems = cartItems.map((item) => ({
                            product_id: item.productId || item.produit || `product-${item.id}`,
                            variant_id: item.variantId || undefined,
                            quantity: item.quantite,
                            price: getItemPrice(item), // Utiliser le prix avec promotion
                            arome: item.arome,
                            taille: item.taille,
                            couleur: item.couleur,
                            diametre: item.diametre,
                            conditionnement: item.conditionnement,
                            produit: item.produit
                          }))

                          const currentRef = orderReference || paypalReference
                          const commentValue = orderComment.trim() || undefined
                          
                          // Appel conditionnel pour éviter les problèmes de typage TypeScript
                          const order = commentValue
                            ? await createOrder(
                                user?.id || '',
                                currentRef,
                                finalTotal,
                                orderItems,
                                'paypal',
                                calculatedShippingCost,
                                commentValue
                              )
                            : await createOrder(
                                user?.id || '',
                                currentRef,
                                finalTotal,
                                orderItems,
                                'paypal',
                                calculatedShippingCost
                              )

                          if (order.id) {
                            // Enregistrer l'utilisation du code promo APRÈS création de la commande
                            if (promoValidation && promoValidation.valid && promoCode && user?.id) {
                              const promoCodeObj = await getPromoCodeByCode(promoCode)
                              if (promoCodeObj) {
                                await recordPromoCodeUsageAsync(
                                  promoCodeObj.id,
                                  user.id,
                                  order.id,
                                  promoValidation.discount || 0
                                )
                              }
                            }

                            // La commande reste en "pending" (en attente) par défaut
                            // Le statut sera changé manuellement depuis l'admin
                            
                            // Créer le rendez-vous pour Wavignies si nécessaire
                            if (retraitMode === 'wavignies-rdv' && rdvDate && rdvTimeSlot && user) {
                              try {
                                const { createAppointment } = await import('@/lib/appointments-manager')
                                const appointmentResult = createAppointment(
                                  rdvDate,
                                  rdvTimeSlot,
                                  user.id || user.email,
                                  user.nom || user.email,
                                  user.email,
                                  livraisonAddress.telephone,
                                  order.id // Lier le rendez-vous à la commande
                                )
                                
                                if (appointmentResult.success) {
                                  console.log('✅ Rendez-vous créé pour Wavignies')
                                } else {
                                  console.warn('⚠️ Erreur création rendez-vous:', appointmentResult.message)
                                }
                              } catch (appointmentError) {
                                console.warn('⚠️ Erreur lors de la création du rendez-vous:', appointmentError)
                              }
                            }
                            
                            // Sauvegarder l'adresse de livraison dans la commande
                            if (retraitMode === 'livraison' && order.id) {
                              try {
                                const { getSupabaseClient } = await import('@/lib/supabase')
                                const supabase = getSupabaseClient()
                                if (supabase && livraisonAddress.adresse && livraisonAddress.codePostal && livraisonAddress.ville) {
                                  await supabase
                                    .from('orders')
                                    .update({
                                      shipping_address: {
                                        adresse: livraisonAddress.adresse,
                                        codePostal: livraisonAddress.codePostal,
                                        ville: livraisonAddress.ville,
                                        telephone: livraisonAddress.telephone
                                      }
                                    })
                                    .eq('id', order.id)
                                  console.log('✅ Adresse de livraison sauvegardée dans la commande')
                                }
                              } catch (addressError) {
                                console.warn('⚠️ Erreur lors de la sauvegarde de l\'adresse:', addressError)
                              }
                            }

                            // Sauvegarder le point relais dans la commande (Boxtal ou Chronopost)
                            if (retraitMode === 'chronopost-relais' && order.id) {
                              try {
                                const { getSupabaseClient } = await import('@/lib/supabase')
                                const supabase = getSupabaseClient()
                                if (supabase) {
                                  if (boxtalParcelPoint) {
                                    const pointAddress = boxtalParcelPoint.address || {} as any
                                    const rawData = (boxtalParcelPoint as any).rawData || boxtalParcelPoint
                                    
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
                                          identifiant: boxtalParcelPoint.code || '',
                                          nom: boxtalParcelPoint.name || '',
                                          adresseComplete: fullAddress,
                                          adresse: street,
                                          codePostal: postalCode,
                                          ville: city,
                                          pays: pointAddress.country || pointAddress.countryCode || 'FR',
                                          coordonnees: boxtalParcelPoint.coordinates || {},
                                          network: boxtalParcelPoint.network || '',
                                          telephone: (livraisonAddress.telephone || user?.telephone || '').trim() || undefined,
                                          codePostalRecherche: livraisonAddress.codePostal || '',
                                          villeRecherche: livraisonAddress.ville || '',
                                          pointRelais: boxtalParcelPoint
                                        }
                                      })
                                      .eq('id', order.id)
                                    console.log('✅ Point relais Boxtal sauvegardé dans la commande (PayPal)')
                                  } else if (chronopostRelaisPoint) {
                                    await supabase
                                      .from('orders')
                                      .update({
                                        shipping_address: {
                                          type: 'chronopost-relais',
                                          identifiant: chronopostRelaisPoint.identifiant,
                                          nom: chronopostRelaisPoint.nom,
                                          adresse: chronopostRelaisPoint.adresse,
                                          codePostal: chronopostRelaisPoint.codePostal,
                                          ville: chronopostRelaisPoint.ville,
                                          horaires: chronopostRelaisPoint.horaires,
                                          coordonnees: chronopostRelaisPoint.coordonnees,
                                          telephone: (livraisonAddress.telephone || user?.telephone || '').trim() || undefined,
                                        }
                                      })
                                      .eq('id', order.id)
                                    console.log('✅ Point relais Chronopost sauvegardé dans la commande (PayPal)')
                                  }
                                }
                              } catch (relaisError) {
                                console.warn('⚠️ Erreur lors de la sauvegarde du point relais:', relaisError)
                              }
                            }

                            // Sauvegarder les informations de retrait à Wavignies
                            if (retraitMode === 'wavignies-rdv' && order.id && rdvDate && rdvTimeSlot) {
                              try {
                                const { getSupabaseClient } = await import('@/lib/supabase')
                                const supabase = getSupabaseClient()
                                if (supabase) {
                                  await supabase
                                    .from('orders')
                                    .update({
                                      shipping_address: {
                                        type: 'wavignies-rdv',
                                        rdvDate: rdvDate,
                                        rdvTimeSlot: rdvTimeSlot,
                                        adresse: 'Retrait sur rendez-vous à Wavignies (60130)',
                                        ville: 'Wavignies',
                                        codePostal: '60130',
                                        telephone: (livraisonAddress.telephone || user?.telephone || '').trim() || undefined,
                                      }
                                    })
                                    .eq('id', order.id)
                                  console.log('✅ Informations de retrait Wavignies sauvegardées dans la commande (PayPal)')
                                }
                              } catch (wavigniesError) {
                                console.warn('⚠️ Erreur lors de la sauvegarde du retrait Wavignies:', wavigniesError)
                              }
                            }

                            // Générer automatiquement la facture et envoyer l'email (PayPal)
                            try {
                              const invoiceResponse = await fetch('/api/auto-invoice', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: order.id }),
                              })
                              const invoiceResult = await invoiceResponse.json()
                              if (invoiceResult.ok) {
                                console.log('✅ Facture générée et email envoyé automatiquement (PayPal)')
                              } else {
                                console.warn('⚠️ Erreur génération facture automatique:', invoiceResult.error)
                              }
                            } catch (invoiceError) {
                              console.warn('⚠️ Erreur appel API auto-invoice (PayPal):', invoiceError)
                            }
                            
                            // Envoyer notification Telegram
                            try {
                              await sendNewOrderNotification({
                                reference: currentRef,
                                total: finalTotal,
                                itemCount: cartItems.length,
                                customerName: user?.nom || user?.email,
                                customerEmail: user?.email,
                                shippingCost: calculatedShippingCost,
                                retraitMode: retraitMode,
                                items: cartItems.map(item => ({
                                  produit: item.produit,
                                  quantity: item.quantite,
                                  price: item.prix,
                                  arome: item.arome,
                                  taille: item.taille,
                                  couleur: item.couleur,
                                  diametre: item.diametre,
                                  conditionnement: item.conditionnement,
                                  forme: item.format,
                                  saveur: item.arome, // Pour Pop-up Duo
                                  gamme: item.gamme,
                                }))
                              })
                            } catch (telegramError) {
                              console.warn('⚠️ Erreur notification Telegram:', telegramError)
                            }
                          }

                          clearCart()
                          router.push(`/payment/success?reference=${currentRef}&montant=${finalTotal.toFixed(2)}&payment_method=paypal`)
                        } catch (error) {
                          console.error('Erreur création commande:', error)
                          alert('Paiement réussi mais erreur lors de la création de la commande. Contactez le support.')
                        }
                      }}
                      onError={(error) => {
                        alert(`Erreur PayPal: ${error}`)
                      }}
                    />
                    {!isFormValid() && (
                      <p className="text-sm text-gray-400 text-center mt-2">
                        {!cgvAccepted
                          ? 'Veuillez accepter les CGV'
                          : retraitMode === 'wavignies-rdv' && (!rdvDate || !rdvTimeSlot)
                          ? 'Veuillez sélectionner un créneau'
                          : 'Veuillez compléter les informations requises'}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={!isFormValid()}
                      style={{ 
                        position: 'relative', 
                        zIndex: 10000,
                        pointerEvents: 'auto'
                      }}
                      className={`w-full font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg ${
                        isFormValid()
                          ? 'bg-yellow-500 text-noir-950 hover:bg-yellow-400 cursor-pointer'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      {!cgvAccepted
                        ? 'Acceptez les CGV'
                        : retraitMode === 'wavignies-rdv' && (!rdvDate || !rdvTimeSlot)
                        ? 'Sélectionnez un créneau'
                        : 'Paiement par carte'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
