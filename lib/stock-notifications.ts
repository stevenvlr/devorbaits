// Système de notifications de rupture de stock

import { loadProducts } from './products-manager'
import { getAvailableStockSync } from './stock-manager'

export interface StockAlert {
  productId: string
  productName: string
  variantId?: string
  variantLabel?: string
  stock: number
  category: string
}

const STOCK_ALERTS_STORAGE_KEY = 'stock-alerts-seen'

/**
 * Vérifie tous les produits et retourne les alertes de rupture de stock
 */
export async function checkStockAlerts(): Promise<StockAlert[]> {
  const products = await loadProducts()
  const alerts: StockAlert[] = []

  products.forEach(product => {
    if (!product.available) return // Ignorer les produits indisponibles
    
    if (product.variants && product.variants.length > 0) {
      // Produit avec variantes
      product.variants.forEach(variant => {
        if (!variant.available) return
        
        const stock = getAvailableStockSync(product.id, variant.id)
        if (stock === 0) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantLabel: variant.label,
            stock: 0,
            category: product.category
          })
        }
      })
    } else {
      // Produit sans variantes
      const stock = getAvailableStockSync(product.id)
      if (stock === 0) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          stock: 0,
          category: product.category
        })
      }
    }
  })

  return alerts
}

/**
 * Marque une alerte comme vue
 */
export function markAlertAsSeen(alertId: string): void {
  if (typeof window === 'undefined') return
  try {
    const seen = loadSeenAlerts()
    seen.add(alertId)
    localStorage.setItem(STOCK_ALERTS_STORAGE_KEY, JSON.stringify(Array.from(seen)))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des alertes vues:', error)
  }
}

/**
 * Charge les alertes déjà vues
 */
function loadSeenAlerts(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const saved = localStorage.getItem(STOCK_ALERTS_STORAGE_KEY)
    if (saved) {
      return new Set(JSON.parse(saved))
    }
  } catch {
    // Ignorer les erreurs
  }
  return new Set()
}

/**
 * Génère un ID unique pour une alerte
 */
export function getAlertId(alert: StockAlert): string {
  if (alert.variantId) {
    return `${alert.productId}-${alert.variantId}`
  }
  return alert.productId
}

/**
 * Filtre les alertes pour ne garder que celles non vues
 */
export async function getUnseenAlerts(): Promise<StockAlert[]> {
  const allAlerts = await checkStockAlerts()
  const seen = loadSeenAlerts()
  
  return allAlerts.filter(alert => !seen.has(getAlertId(alert)))
}

/**
 * Réinitialise toutes les alertes vues
 */
export function resetSeenAlerts(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STOCK_ALERTS_STORAGE_KEY)
}
