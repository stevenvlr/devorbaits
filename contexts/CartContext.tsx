'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { reserveStock as reserveStockAmicale, releaseStock as releaseStockAmicale } from '@/lib/amicale-blanc-stock'
import { reserveStock, releaseStock, getAvailableStock } from '@/lib/stock-manager'
import { getBouilletteId } from '@/lib/price-utils'

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

export function CartProvider({ children }: { children: ReactNode }) {
  // #region agent log
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CartContext.tsx:47',message:'CartProvider render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
  }, []);
  // #endregion
  const [cartItems, setCartItems] = useState<CartItem[]>([])

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
    const popupDuoTotal = paidItems
      .filter(item => item.produit === 'Pop-up Duo')
      .reduce((sum, item) => sum + item.quantite, 0)
    
    const barPopupTotal = paidItems
      .filter(item => item.produit === 'Pop-up personnalisé')
      .reduce((sum, item) => sum + item.quantite, 0)

    // Calculer combien d'articles gratuits doivent être présents
    const popupDuoGratuits = Math.floor(popupDuoTotal / 4)
    const barPopupGratuits = Math.floor(barPopupTotal / 4)

    // Compter les articles gratuits existants par catégorie
    const existingPopupDuoGratuits = promoItems.filter(item => item.produit === 'Pop-up Duo').length
    const existingBarPopupGratuits = promoItems.filter(item => item.produit === 'Pop-up personnalisé').length

    // Filtrer les articles gratuits pour ne garder que ceux nécessaires
    const finalPromoItems: CartItem[] = []
    
    // Articles gratuits pour Pop-up Duo
    if (popupDuoTotal >= 4 && popupDuoGratuits > 0) {
      const existingPopupDuo = promoItems.filter(item => item.produit === 'Pop-up Duo')
      finalPromoItems.push(...existingPopupDuo.slice(0, popupDuoGratuits))
    }

    // Articles gratuits pour Bar à Pop-up
    if (barPopupTotal >= 4 && barPopupGratuits > 0) {
      const existingBarPopup = promoItems.filter(item => item.produit === 'Pop-up personnalisé')
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
      const eligibleItems = prev.filter(item => !item.isGratuit && item.produit === productType)
      const total = eligibleItems.reduce((sum, item) => sum + item.quantite, 0)
      const neededGratuits = Math.floor(total / 4)
      const existingGratuits = prev.filter(item => item.isGratuit && item.produit === productType).length

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
    const eligibleItems = cartItems.filter(item => !item.isGratuit && item.produit === productType)
    const total = eligibleItems.reduce((sum, item) => sum + item.quantite, 0)
    const neededGratuits = Math.floor(total / 4)
    const existingGratuits = cartItems.filter(item => item.isGratuit && item.produit === productType).length
    
    // Afficher le modal si on a 4 articles ou plus et qu'il manque des articles gratuits
    return total >= 4 && neededGratuits > existingGratuits
  }

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    // Ne pas permettre l'ajout d'articles gratuits directement
    if (item.isGratuit) {
      return
    }
    // Générer un productId pour les produits amicale-blanc
    let productId = item.productId
    if (!productId && item.pointRetrait === 'amicale-blanc' && item.arome && item.diametre && item.conditionnement) {
      productId = getBouilletteId(item.arome, item.diametre, item.conditionnement)
    }
    
    // Si c'est un produit amicale-blanc, réserver le stock (système amicale-blanc)
    if (productId && item.pointRetrait === 'amicale-blanc') {
      const stockReserved = reserveStockAmicale(productId, item.quantite)
      if (!stockReserved) {
        alert(`Stock insuffisant pour ${item.produit}. Stock disponible insuffisant.`)
        return
      }
    }
    
    // Si c'est un produit avec productId (livraison), vérifier le stock (système général)
    if (productId && !item.pointRetrait) {
      // Vérifier le stock disponible (version asynchrone)
      const availableStock = await getAvailableStock(productId, item.variantId)
      
      // Si le stock est défini (>= 0) et insuffisant (mais pas à zéro)
      if (availableStock > 0 && availableStock < item.quantite) {
        alert(`Stock insuffisant pour ${item.produit}. Stock disponible : ${availableStock}`)
        return
      }
      
      // Si le stock est à zéro, afficher un message sur le délai de livraison mais permettre l'ajout
      if (availableStock === 0) {
        const confirmed = confirm(
          `⚠️ Stock épuisé pour ${item.produit}\n\n` +
          `Le délai de livraison sera de 8 à 10 jours ouvrés.\n\n` +
          `Souhaitez-vous quand même ajouter ce produit au panier ?`
        )
        if (!confirmed) {
          return
        }
      } else if (availableStock > 0) {
        // Si le stock est disponible, réserver normalement
        const stockReserved = await reserveStock(productId, item.quantite, item.variantId)
        if (!stockReserved) {
          alert(`Erreur lors de la réservation du stock pour ${item.produit}.`)
          return
        }
      }
      // Si availableStock < 0 (illimité), on continue sans réserver
    }
    
    const id = `${item.produit}-${Date.now()}-${Math.random()}`
    setCartItems(prev => {
      const newItems = [...prev, { ...item, id, productId }]
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
  const total = cartItems.reduce((sum, item) => {
    if (item.isGratuit) {
      return sum
    }
    return sum + (item.prix * item.quantite)
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
