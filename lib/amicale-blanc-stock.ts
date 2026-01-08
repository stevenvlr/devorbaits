// Gestion du stock pour l'amicale des pêcheurs au blanc - Supabase uniquement
// Utilise stock-manager.ts avec location='amicale-blanc'

import { 
  loadStock as loadStockBase, 
  saveStock as saveStockBase,
  getStock as getStockBase,
  updateStock as updateStockBase,
  reserveStock as reserveStockBase,
  releaseStock as releaseStockBase,
  confirmOrder as confirmOrderBase,
  getAvailableStock as getAvailableStockBase,
  type StockItem
} from './stock-manager'

const LOCATION = 'amicale-blanc'

// Réexporter le type
export type { StockItem }

// Charger tous les stocks pour l'amicale
export async function loadStock(): Promise<Record<string, StockItem>> {
  return await loadStockBase(LOCATION)
}

// Version synchrone (utilise le cache)
export function loadStockSync(): Record<string, StockItem> {
  const { loadStockSync: loadStockSyncBase } = require('./stock-manager')
  return loadStockSyncBase(LOCATION)
}

// Sauvegarder les stocks pour l'amicale
export async function saveStock(stock: Record<string, StockItem>): Promise<void> {
  await saveStockBase(stock, LOCATION)
}

// Obtenir le stock d'un produit
export async function getStock(productId: string): Promise<StockItem> {
  return await getStockBase(productId, undefined, LOCATION)
}

// Version synchrone
export function getStockSync(productId: string): StockItem {
  const { getStockSync: getStockSyncBase } = require('./stock-manager')
  return getStockSyncBase(productId, undefined, LOCATION)
}

// Mettre à jour le stock d'un produit
export async function updateStock(productId: string, stock: number): Promise<void> {
  await updateStockBase(productId, stock, undefined, LOCATION)
}

// Réserver du stock (lors de l'ajout au panier ou commande)
export async function reserveStock(productId: string, quantity: number): Promise<boolean> {
  return await reserveStockBase(productId, quantity, undefined, LOCATION)
}

// Libérer du stock réservé (si commande annulée)
export async function releaseStock(productId: string, quantity: number): Promise<void> {
  await releaseStockBase(productId, quantity, undefined, LOCATION)
}

// Confirmer la commande (déduire le stock réservé du stock total)
export async function confirmOrder(items: Array<{ productId: string; quantity: number }>): Promise<void> {
  await confirmOrderBase(items.map(item => ({ ...item, variantId: undefined })), LOCATION)
}

// Obtenir le stock disponible (stock total - réservé)
export async function getAvailableStock(productId: string): Promise<number> {
  return await getAvailableStockBase(productId, undefined, LOCATION)
}

// Version synchrone
export function getAvailableStockSync(productId: string): number {
  const { getAvailableStockSync: getAvailableStockSyncBase } = require('./stock-manager')
  return getAvailableStockSyncBase(productId, undefined, LOCATION)
}

// Écouter les mises à jour du stock
export function onStockUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  window.addEventListener('stock-updated', callback)
  return () => window.removeEventListener('stock-updated', callback)
}

