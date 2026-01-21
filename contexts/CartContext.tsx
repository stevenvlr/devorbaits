'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { reserveStock as reserveStockAmicale, releaseStock as releaseStockAmicale } from '@/lib/amicale-blanc-stock'
import { reserveStock, releaseStock, getAvailableStock } from '@/lib/stock-manager'
import { getBouilletteId } from '@/lib/price-utils'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { applyGlobalPromotion } from '@/lib/global-promotion-manager'

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
  prixOriginal?: number // Prix original avant promotion (pour recalculer si promotion activée après)
  category?: string // Catégorie du produit (pour appliquer la promotion)
  gamme?: string // Gamme du produit (pour appliquer la promotion)
  pointRetrait?: string
  productId?: string // ID du produit pour la gestion du stock
  variantId?: string // ID de la variante pour la gestion du stock
  isGratuit?: boolean // Indique si l'article est un article gratuit
  promoId?: string // ID pour identifier les articles de la même promotion
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
  // Cas fréquent: id de variante "variant-16-5kg"
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

  // Fonction pour vérifier si un produit est éligible à la promotion 4+1
  const isEligibleForPromo = (produit: string): boolean => {
    return produit === 'Pop-up Duo' || produit === 'Pop-up personnalisé'
  }

  // Fonction pour gérer les articles gratuits de la promotion 4+1
  // NE PAS créer automatiquement - seulement conserver ceux qui existent déjà
  // PRÉSERVER L'ORDRE ORIGINAL des articles dans le panier
  const managePromoItems = (items: CartItem[]): CartItem[] => {
    // Séparer les articles payants et gratuits en préservant l'ordre
    const paidItems: CartItem[] = []
    const promoItems: CartItem[] = []

    items.forEach(item => {
      if (item.isGratuit) {
        promoItems.push(item)
      } else {
        paidItems.push(item)
      }
    })

    // Calculer le total des quantités pour chaque catégorie éligible (seulement les articles payants)
    // Utiliser startsWith pour matcher les noms de produits dynamiques (ex: "Pop-up Duo Mûre cassis")
    const popupDuoTotal = paidItems
      .filter(item => item.produit.startsWith('Pop-up Duo'))
      .reduce((sum, item) => sum + item.quantite, 0)
    
    const barPopupTotal = paidItems
      .filter(item => item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé')
      .reduce((sum, item) => sum + item.quantite, 0)

    // Calculer combien d'articles gratuits doivent être présents
    const popupDuoGratuits = Math.floor(popupDuoTotal / 4)
    const barPopupGratuits = Math.floor(barPopupTotal / 4)

    // Compter les articles gratuits existants par catégorie
    const existingPopupDuoGratuits = promoItems.filter(item => item.produit.startsWith('Pop-up Duo')).length
    const existingBarPopupGratuits = promoItems.filter(item => item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé').length

    // Filtrer les articles gratuits pour ne garder que ceux nécessaires
    const finalPromoItems: CartItem[] = []
    
    // Articles gratuits pour Pop-up Duo
    if (popupDuoTotal >= 4 && popupDuoGratuits > 0) {
      const existingPopupDuo = promoItems.filter(item => item.produit.startsWith('Pop-up Duo'))
      finalPromoItems.push(...existingPopupDuo.slice(0, popupDuoGratuits))
    }

    // Articles gratuits pour Bar à Pop-up
    if (barPopupTotal >= 4 && barPopupGratuits > 0) {
      const existingBarPopup = promoItems.filter(item => item.produit.startsWith('Bar à Pop-up') || item.produit === 'Pop-up personnalisé')
      finalPromoItems.push(...existingBarPopup.slice(0, barPopupGratuits))
    }

    // Retourner les articles payants dans leur ordre original + les articles gratuits nécessaires
    // Les articles gratuits sont ajoutés à la fin pour ne pas perturber l'ordre des articles payants
    return [...paidItems, ...finalPromoItems]
  }

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
      // Utiliser startsWith pour matcher les noms de produits dynamiques
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
          promoId: productType === 'Pop-up Duo' ? 'popup-duo-4+1' : 'bar-popup-4+1'
        }
        return managePromoItems([...prev, newPromoItem])
      }
      return prev
    })
  }

  const shouldShowPromoModal = (productType: 'Pop-up Duo' | 'Pop-up personnalisé'): boolean => {
    // Utiliser startsWith pour matcher les noms de produits dynamiques
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
    
    // Afficher le modal si on a 4 articles ou plus et qu'il manque des articles gratuits
    return total >= 4 && neededGratuits > existingGratuits
  }

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    // Ne pas permettre l'ajout d'articles gratuits directement
    if (item.isGratuit) {
      console.log('[CartContext] Tentative d\'ajout d\'article gratuit directement - ignoré')
      return
    }
    
    console.log('[CartContext] addToCart appelé avec:', {
      produit: item.produit,
      quantite: item.quantite,
      prix: item.prix,
      productId: item.productId,
      variantId: item.variantId,
      pointRetrait: item.pointRetrait
    })
    
    // Générer un productId pour les produits amicale-blanc
    let productId = item.productId
    if (!productId && item.pointRetrait === 'amicale-blanc' && item.arome && item.diametre && item.conditionnement) {
      productId = getBouilletteId(item.arome, item.diametre, item.conditionnement)
      console.log('[CartContext] ProductId généré pour amicale-blanc:', productId)
    }
    
    // Si c'est un produit amicale-blanc, réserver le stock (système amicale-blanc)
    if (productId && item.pointRetrait === 'amicale-blanc') {
      const stockReserved = reserveStockAmicale(productId, item.quantite)
      if (!stockReserved) {
        console.error('[CartContext] Stock insuffisant pour amicale-blanc:', item.produit)
        alert(`Stock insuffisant pour ${item.produit}. Stock disponible insuffisant.`)
        return
      }
      console.log('[CartContext] Stock réservé pour amicale-blanc:', productId)
    }
    
    // Pas de vérification de stock pour les produits en livraison
    // On permet l'ajout au panier sans limite de quantité
    if (productId && !item.pointRetrait) {
      console.log('[CartContext] Ajout au panier sans vérification de stock pour:', item.produit, 'quantité:', item.quantite)
    }
    
    // Normaliser certains champs variants (diamètre / conditionnement) pour le checkout + calcul poids
    // Important: certains items arrivent sans `conditionnement` (ex: variante stockée via label/format/variantId)
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
      variantId: normalizedItem.variantId
    })
    
    setCartItems(prev => {
      const newItems = [...prev, { ...normalizedItem, id, productId }]
      console.log('[CartContext] Nouveau nombre d\'articles dans le panier:', newItems.length)
      return managePromoItems(newItems)
    })
  }

  const removeFromCart = (id: string) => {
    const item = cartItems.find(i => i.id === id)
    if (item && item.productId && !item.isGratuit) {
      if (item.pointRetrait === 'amicale-blanc') {
        // Libérer le stock réservé (système amicale-blanc)
        releaseStockAmicale(item.productId, item.quantite)
      } else {
        // Libérer le stock réservé (système général)
        releaseStock(item.productId, item.quantite, item.variantId)
      }
    }
    setCartItems(prev => {
      const filtered = prev.filter(item => item.id !== id)
      return managePromoItems(filtered)
    })
  }

  const clearCart = () => {
    // Libérer tous les stocks réservés
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
    // Cette fonction sera appelée lors de la confirmation de commande
    // Le stock sera déduit dans la page de commande
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantite, 0)
  // Le total exclut les articles gratuits
  // Recalculer le prix avec la promotion globale si elle est active
  const total = cartItems.reduce((sum, item) => {
    if (item.isGratuit) {
      return sum
    }
    
    // Si on a une promotion active
    let prixFinal = item.prix
    if (promotion && promotion.active) {
      // Si on a le prix original, l'utiliser (meilleur cas)
      const prixBase = item.prixOriginal !== undefined ? item.prixOriginal : item.prix
      
      // Si la promotion s'applique à tout le site, l'appliquer même sans category/gamme
      if (promotion.applyToAll) {
        prixFinal = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
      } else if (item.category || item.gamme) {
        // Si on a category ou gamme, vérifier l'éligibilité
        prixFinal = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
      }
      // Sinon, pas de promotion (pas de category/gamme et pas applyToAll)
    }
    
    return sum + (prixFinal * item.quantite)
  }, 0)

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, confirmOrder, updatePromoItem, addPromoItem, shouldShowPromoModal, cartCount, total }}>
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
