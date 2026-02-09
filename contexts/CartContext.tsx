'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { reserveStock as reserveStockAmicale, releaseStock as releaseStockAmicale } from '@/lib/amicale-blanc-stock'
import { reserveStock, releaseStock, getAvailableStock } from '@/lib/stock-manager'
import { getBouilletteId } from '@/lib/price-utils'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { applyGlobalPromotion } from '@/lib/global-promotion-manager'

const supabase = getSupabaseClient()
if (!supabase) {
  // Supabase pas prêt/configuré → on ne sync pas le panier
}



export interface PromoCharacteristics {
  arome?: string
  taille?: string
  couleur?: string
}

interface CartItem {
  id: string
  produit: string
  diametre?: string
  taille?: string
  arome?: string
  couleur?: string
  conditionnement?: string
  format?: string
  type?: string
  quantite: number
  prix: number
  prixOriginal?: number
  category?: string
  gamme?: string
  pointRetrait?: string
  productId?: string
  variantId?: string
  isGratuit?: boolean
  promoId?: string
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>
  removeFromCart: (id: string) => void
  clearCart: () => void
  confirmOrder: () => void
  updatePromoItem: (id: string, updates: Partial<CartItem>) => void
  addPromoItem: (productType: 'Pop-up Duo' | 'Pop-up personnalisé', characteristics: PromoCharacteristics) => void
  shouldShowPromoModal: (productType: 'Pop-up Duo' | 'Pop-up personnalisé') => boolean
  cartCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function normalizeConditionnementFromText(text: string): string | undefined {
  const raw = (text || '').toLowerCase()
  const kg = raw.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilos)\b/)
  if (kg) return `${kg[1].replace(',', '.')}kg`
  const g = raw.match(/(\d+)\s*(g|gr|gramme|grammes)\b/)
  if (g) return `${g[1]}g`
  return undefined
}

function extractDiametreFromText(text: string): string | undefined {
  const raw = (text || '').toLowerCase()
  const mm = raw.match(/(\d+)\s*mm\b/)
  if (mm) return mm[1]
  const fromVariantId = raw.match(/\bvariant-(\d+)-/)
  if (fromVariantId) return fromVariantId[1]
  return undefined
}

function shouldTreatAsBouillette(item: Omit<CartItem, 'id'>): boolean {
  const category = (item.category || '').toLowerCase()
  const produit = (item.produit || '').toLowerCase()
  return category.includes('bouillette') || produit.includes('bouillette')
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const { promotion } = useGlobalPromotion()

  // ⚠️ IMPORTANT : évite d’écraser le panier en base au tout début
  const isLoadedFromDb = useRef(false)
  const saveTimer = useRef<any>(null)

  // Fonction pour vérifier si un produit est éligible à la promotion 4+1
  const isEligibleForPromo = (produit: string): boolean => {
    return produit === 'Pop-up Duo' || produit === 'Pop-up personnalisé'
  }

  // Fonction pour gérer les articles gratuits de la promotion 4+1
  // NE PAS créer automatiquement - seulement conserver ceux qui existent déjà
  // PRÉSERVER L'ORDRE ORIGINAL des articles dans le panier
  const managePromoItems = (items: CartItem[]): CartItem[] => {
    const paidItems: CartItem[] = []
    const promoItems: CartItem[] = []

    items.forEach(item => {
      if (item.isGratuit) promoItems.push(item)
      else paidItems.push(item)
    })

    const popupDuoTotal = paidItems
      .filter(item => item.produit.startsWith('Pop-up Duo'))
      .reduce((sum, item) => sum + item.quantite, 0)

    const barPopupTotal = paidItems
      .filter(item => item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé')
      .reduce((sum, item) => sum + item.quantite, 0)

    const popupDuoGratuits = Math.floor(popupDuoTotal / 4)
    const barPopupGratuits = Math.floor(barPopupTotal / 4)

    const finalPromoItems: CartItem[] = []

    if (popupDuoTotal >= 4 && popupDuoGratuits > 0) {
      const existingPopupDuo = promoItems.filter(item => item.produit.startsWith('Pop-up Duo'))
      finalPromoItems.push(...existingPopupDuo.slice(0, popupDuoGratuits))
    }

    if (barPopupTotal >= 4 && barPopupGratuits > 0) {
      const existingBarPopup = promoItems.filter(
        item => item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé'
      )
      finalPromoItems.push(...existingBarPopup.slice(0, barPopupGratuits))
    }

    return [...paidItems, ...finalPromoItems]
  }

  // ✅ 1) Charger le panier depuis Supabase au démarrage (si le client est connecté)
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = if (!supabase) return
        await supabase.auth.getUser()
        
        const userId = data?.user?.id
        if (!userId) return

        const { data: row, error } = await supabase
          .from('carts')
          .select('items')
          .eq('user_id', userId)
          .single()

        // Si pas de panier encore, Supabase peut renvoyer une erreur "no rows"
        // On ignore, le panier restera vide.
        if (error) {
          // tu peux laisser silencieux, ou logguer :
          // console.log('[CartContext] Aucun panier en base (normal si nouveau client).')
          isLoadedFromDb.current = true
          return
        }

        if (row?.items && Array.isArray(row.items)) {
          setCartItems(managePromoItems(row.items as CartItem[]))
        }
      } finally {
        isLoadedFromDb.current = true
      }
    })()
  }, [])

  // ✅ 2) Sauvegarder le panier dans Supabase à chaque changement (auto, avec petite attente)
  useEffect(() => {
    if (!isLoadedFromDb.current) return

    if (saveTimer.current) clearTimeout(saveTimer.current)

    saveTimer.current = setTimeout(async () => {
      const { data } = if (!supabase) return
      await supabase.auth.getUser()
      
      const userId = data?.user?.id
      if (!userId) return

      await supabase.from('carts').upsert({
        user_id: userId,
        items: cartItems,
        updated_at: new Date().toISOString(),
      })
    }, 700)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [cartItems])

  const updatePromoItem = (id: string, updates: Partial<CartItem>) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id && item.isGratuit) {
          return { ...item, ...updates }
        }
        return item
      })
      return managePromoItems(updated)
    })
  }

  const addPromoItem = (productType: 'Pop-up Duo' | 'Pop-up personnalisé', characteristics: PromoCharacteristics) => {
    setCartItems(prev => {
      const isPopupDuo = productType === 'Pop-up Duo'
      const eligibleItems = prev.filter(item => {
        if (item.isGratuit) return false
        if (isPopupDuo) return item.produit.startsWith('Pop-up Duo')
        return item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé'
      })
      const total = eligibleItems.reduce((sum, item) => sum + item.quantite, 0)
      const neededGratuits = Math.floor(total / 4)
      const existingGratuits = prev.filter(item => {
        if (!item.isGratuit) return false
        if (isPopupDuo) return item.produit.startsWith('Pop-up Duo')
        return item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé'
      }).length

      if (neededGratuits > existingGratuits) {
        const newPromoItem: CartItem = {
          id: `promo-${productType === 'Pop-up Duo' ? 'popup-duo' : 'bar-popup'}-${Date.now()}-${Math.random()}`,
          produit: productType,
          arome: characteristics.arome,
          taille: characteristics.taille,
          couleur: characteristics.couleur,
          quantite: 1,
          prix: 0,
          isGratuit: true,
          promoId: productType === 'Pop-up Duo' ? 'popup-duo-4+1' : 'bar-popup-4+1',
        }
        return managePromoItems([...prev, newPromoItem])
      }
      return prev
    })
  }

  const shouldShowPromoModal = (productType: 'Pop-up Duo' | 'Pop-up personnalisé'): boolean => {
    const isPopupDuo = productType === 'Pop-up Duo'
    const eligibleItems = cartItems.filter(item => {
      if (item.isGratuit) return false
      if (isPopupDuo) return item.produit.startsWith('Pop-up Duo')
      return item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé'
    })
    const total = eligibleItems.reduce((sum, item) => sum + item.quantite, 0)
    const neededGratuits = Math.floor(total / 4)
    const existingGratuits = cartItems.filter(item => {
      if (!item.isGratuit) return false
      if (isPopupDuo) return item.produit.startsWith('Pop-up Duo')
      return item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé'
    }).length

    return total >= 4 && neededGratuits > existingGratuits
  }

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    if (item.isGratuit) {
      console.log("[CartContext] Tentative d'ajout d'article gratuit directement - ignoré")
      return
    }

    console.log('[CartContext] addToCart appelé avec:', {
      produit: item.produit,
      quantite: item.quantite,
      prix: item.prix,
      productId: item.productId,
      variantId: item.variantId,
      pointRetrait: item.pointRetrait,
    })

    let productId = item.productId
    if (!productId && item.pointRetrait === 'amicale-blanc' && item.arome && item.diametre && item.conditionnement) {
      productId = getBouilletteId(item.arome, item.diametre, item.conditionnement)
      console.log('[CartContext] ProductId généré pour amicale-blanc:', productId)
    }

    if (productId && item.pointRetrait === 'amicale-blanc') {
      const stockReserved = reserveStockAmicale(productId, item.quantite)
      if (!stockReserved) {
        console.error('[CartContext] Stock insuffisant pour amicale-blanc:', item.produit)
        alert(`Stock insuffisant pour ${item.produit}. Stock disponible insuffisant.`)
        return
      }
      console.log('[CartContext] Stock réservé pour amicale-blanc:', productId)
    }

    if (productId && !item.pointRetrait) {
      try {
        const availableStock = await getAvailableStock(productId, item.variantId)
        console.log('[CartContext] Stock disponible pour', productId, ':', availableStock)

        if (availableStock >= 0 && item.quantite > availableStock) {
          alert(
            `📦 Information délai de livraison\n\n` +
              `La quantité demandée (${item.quantite}) dépasse le stock disponible (${availableStock}).\n\n` +
              `Le délai de livraison sera de 8 à 10 jours ouvrés.`
          )
        }
      } catch (error) {
        console.error('[CartContext] Erreur lors de la vérification du stock:', error)
      }
      console.log('[CartContext] Ajout au panier:', item.produit, 'quantité:', item.quantite)
    }

    const variantText = `${item.variantId || ''} ${item.format || ''} ${item.produit || ''}`
    const derivedDiametre = item.diametre || extractDiametreFromText(variantText)
    const derivedConditionnement =
      item.conditionnement ||
      (shouldTreatAsBouillette(item) ? normalizeConditionnementFromText(variantText) : undefined)

    const normalizedItem: Omit<CartItem, 'id'> = {
      ...item,
      diametre: derivedDiametre,
      conditionnement: derivedConditionnement || item.conditionnement,
    }

    const id = `${normalizedItem.produit}-${Date.now()}-${Math.random()}`
    console.log('[CartContext] Article ajouté au panier:', {
      id,
      produit: normalizedItem.produit,
      quantite: normalizedItem.quantite,
      prix: normalizedItem.prix,
      productId,
      variantId: normalizedItem.variantId,
    })

    setCartItems(prev => {
      const newItems = [...prev, { ...normalizedItem, id, productId }]
      console.log("[CartContext] Nouveau nombre d'articles dans le panier:", newItems.length)
      return managePromoItems(newItems)
    })
  }

  const removeFromCart = (id: string) => {
    const item = cartItems.find(i => i.id === id)
    if (item && item.productId && !item.isGratuit) {
      if (item.pointRetrait === 'amicale-blanc') {
        releaseStockAmicale(item.productId, item.quantite)
      } else {
        releaseStock(item.productId, item.quantite, item.variantId)
      }
    }
    setCartItems(prev => {
      const filtered = prev.filter(item => item.id !== id)
      return managePromoItems(filtered)
    })
  }

  const clearCart = () => {
    cartItems.forEach(item => {
      if (item.productId) {
        if (item.pointRetrait === 'amicale-blanc') {
          releaseStockAmicale(item.productId, item.quantite)
        } else {
          releaseStock(item.productId, item.quantite, item.variantId)
        }
      }
    })
    setCartItems([])
  }

  const confirmOrder = () => {
    // stock déduit dans la page de commande
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantite, 0)

  const total = cartItems.reduce((sum, item) => {
    if (item.isGratuit) return sum

    let prixFinal = item.prix
    if (promotion && promotion.active) {
      const prixBase = item.prixOriginal !== undefined ? item.prixOriginal : item.prix

      if (promotion.applyToAll) {
        prixFinal = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
      } else if (item.category || item.gamme) {
        prixFinal = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
      }
    }

    return sum + prixFinal * item.quantite
  }, 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        confirmOrder,
        updatePromoItem,
        addPromoItem,
        shouldShowPromoModal,
        cartCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
