// Gestion du stock pour tous les produits (livraison et retrait) - Supabase uniquement

import { 
  loadStockFromSupabase, 
  saveStockToSupabase, 
  saveAllStockToSupabase 
} from './stock-supabase'
import { isSupabaseConfigured } from './supabase'

export interface StockItem {
  productId: string
  variantId?: string // ID de la variante (optionnel)
  stock: number // Stock disponible
  reserved: number // Stock réservé (en attente de commande)
  location?: string
}

// Cache en mémoire pour éviter trop de requêtes
let stockCache: Record<string, StockItem> = {}
let stockCacheLocation: string = 'general'
let stockCacheTime: number = 0
const CACHE_DURATION = 30000 // 30 secondes

// Générer une clé de stock unique
function getStockKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}-${variantId}` : productId
}

// Charger tous les stocks depuis Supabase
export async function loadStock(location: string = 'general'): Promise<Record<string, StockItem>> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de charger le stock.')
    return {}
  }

  // Vérifier le cache
  const now = Date.now()
  if (stockCacheLocation === location && (now - stockCacheTime) < CACHE_DURATION && Object.keys(stockCache).length > 0) {
    return stockCache
  }

  try {
    const stock = await loadStockFromSupabase(location)
    stockCache = stock
    stockCacheLocation = location
    stockCacheTime = now
    return stock
  } catch (error) {
    console.error('Erreur lors du chargement du stock:', error)
    return {}
  }
}

// Version synchrone (retourne le cache)
export function loadStockSync(location: string = 'general'): Record<string, StockItem> {
  if (stockCacheLocation === location && Object.keys(stockCache).length > 0) {
    return stockCache
  }
  return {}
}

// Sauvegarder les stocks dans Supabase
export async function saveStock(stock: Record<string, StockItem>, location: string = 'general'): Promise<void> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de sauvegarder le stock.')
    throw new Error('Supabase non configuré')
  }

  try {
    const success = await saveAllStockToSupabase(stock, location)
    if (success) {
      // Mettre à jour le cache
      stockCache = stock
      stockCacheLocation = location
      stockCacheTime = Date.now()
      
      // Émettre l'événement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stock-updated'))
      }
    } else {
      throw new Error('Échec de la sauvegarde du stock')
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du stock:', error)
    throw error
  }
}

// Obtenir le stock d'un produit (ou d'une variante)
export async function getStock(productId: string, variantId?: string, location: string = 'general'): Promise<StockItem> {
  const allStock = await loadStock(location)
  const key = getStockKey(productId, variantId)
  return allStock[key] || { productId, variantId, stock: 0, reserved: 0, location }
}

// Version synchrone (utilise le cache)
export function getStockSync(productId: string, variantId?: string, location: string = 'general'): StockItem {
  const allStock = loadStockSync(location)
  const key = getStockKey(productId, variantId)
  return allStock[key] || { productId, variantId, stock: 0, reserved: 0, location }
}

// Mettre à jour le stock d'un produit (ou d'une variante)
export async function updateStock(productId: string, stock: number, variantId?: string, location: string = 'general'): Promise<void> {
  // Utiliser directement saveStockToSupabase pour plus d'efficacité
  const { saveStockToSupabase } = await import('./stock-supabase')
  const allStock = await loadStock(location)
  const key = getStockKey(productId, variantId)
  const existingItem = allStock[key]
  
  const reserved = existingItem?.reserved || 0
  console.log(`💾 Sauvegarde du stock: ${productId}${variantId ? ` (variante: ${variantId})` : ''} - Stock: ${stock}, Réservé: ${reserved}`)
  
  const success = await saveStockToSupabase(productId, variantId, Math.max(0, stock), reserved, location)
  
  if (!success) {
    console.error(`❌ Échec de la sauvegarde du stock pour ${productId}${variantId ? ` (variante: ${variantId})` : ''}`)
    throw new Error(`Échec de la mise à jour du stock pour ${productId}${variantId ? ` (variante: ${variantId})` : ''}`)
  }
  
  console.log(`✅ Stock sauvegardé avec succès pour ${productId}${variantId ? ` (variante: ${variantId})` : ''}`)
  
  // Mettre à jour le cache local
  allStock[key] = {
    productId,
    variantId,
    stock: Math.max(0, stock),
    reserved,
    location
  }
  stockCache = allStock
  stockCacheLocation = location
  stockCacheTime = Date.now()
  
  // Émettre l'événement
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stock-updated'))
  }
}

// Réserver du stock (lors de l'ajout au panier ou commande)
export async function reserveStock(productId: string, quantity: number, variantId?: string, location: string = 'general'): Promise<boolean> {
  const allStock = await loadStock(location)
  const key = getStockKey(productId, variantId)
  const current = allStock[key]
  
  // Si le stock n'est pas défini, considérer comme illimité
  if (!current) {
    return true // Stock illimité, toujours disponible
  }
  
  const available = current.stock - current.reserved
  if (available < quantity) {
    return false // Stock insuffisant
  }
  
  allStock[key] = {
    ...current,
    reserved: current.reserved + quantity
  }
  await saveStock(allStock, location)
  return true
}

// Libérer du stock réservé (si commande annulée)
export async function releaseStock(productId: string, quantity: number, variantId?: string, location: string = 'general'): Promise<void> {
  const allStock = await loadStock(location)
  const key = getStockKey(productId, variantId)
  const current = allStock[key]
  if (!current) return
  
  allStock[key] = {
    ...current,
    reserved: Math.max(0, current.reserved - quantity)
  }
  await saveStock(allStock, location)
}

// Confirmer la commande (déduire le stock réservé du stock total)
export async function confirmOrder(items: Array<{ productId: string; quantity: number; variantId?: string }>, location: string = 'general'): Promise<void> {
  const allStock = await loadStock(location)
  
  items.forEach(({ productId, quantity, variantId }) => {
    const key = getStockKey(productId, variantId)
    const current = allStock[key]
    if (!current) return
    
    allStock[key] = {
      productId,
      variantId,
      stock: Math.max(0, current.stock - quantity),
      reserved: Math.max(0, current.reserved - quantity),
      location
    }
  })
  
  await saveStock(allStock, location)
}

// Obtenir le stock disponible (stock total - réservé)
// Retourne -1 si le stock n'est pas défini (illimité)
// Retourne 0 si le stock est à 0 (indisponible)
export async function getAvailableStock(productId: string, variantId?: string, location: string = 'general'): Promise<number> {
  const allStock = await loadStock(location)
  const key = getStockKey(productId, variantId)
  const item = allStock[key]
  
  // Si le stock n'a jamais été défini, considérer comme illimité
  if (!item) {
    return -1 // Stock illimité (non défini)
  }
  
  // Si le stock est défini à 0, le produit est indisponible
  return Math.max(0, item.stock - item.reserved)
}

// Version synchrone (utilise le cache)
export function getAvailableStockSync(productId: string, variantId?: string, location: string = 'general'): number {
  const allStock = loadStockSync(location)
  const key = getStockKey(productId, variantId)
  const item = allStock[key]
  
  if (!item) {
    return -1 // Stock illimité (non défini)
  }
  
  return Math.max(0, item.stock - item.reserved)
}

// Générer des stocks aléatoires pour tous les produits et leurs variantes
export async function generateRandomStocks(products: Array<{ id: string; variants?: Array<{ id: string }> }>, location: string = 'general'): Promise<void> {
  const allStock = await loadStock(location)
  
  products.forEach(product => {
    // Générer un stock aléatoire pour le produit (entre 0 et 50)
    const productStock = Math.floor(Math.random() * 51) // 0 à 50
    const productKey = getStockKey(product.id)
    allStock[productKey] = {
      productId: product.id,
      stock: productStock,
      reserved: 0,
      location
    }
    
    // Générer un stock aléatoire pour chaque variante (entre 0 et 30)
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        const variantStock = Math.floor(Math.random() * 31) // 0 à 30
        const variantKey = getStockKey(product.id, variant.id)
        allStock[variantKey] = {
          productId: product.id,
          variantId: variant.id,
          stock: variantStock,
          reserved: 0,
          location
        }
      })
    }
  })
  
  await saveStock(allStock, location)
}

// Écouter les mises à jour du stock
export function onStockUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  window.addEventListener('stock-updated', callback)
  return () => window.removeEventListener('stock-updated', callback)
}

