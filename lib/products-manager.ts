// Système de gestion centralisé des produits - Version optimisée avec support de plusieurs images
// Support Supabase avec fallback localStorage

import { 
  loadProductsFromSupabase, 
  saveProductToSupabase, 
  saveAllProductsToSupabase,
  deleteProductFromSupabase 
} from './products-supabase'
import { isSupabaseConfigured } from './supabase'

export interface ProductVariant {
  id: string
  label: string // Ex: "10mm - 1kg", "16mm"
  price: number
  available: boolean
  // Propriétés optionnelles selon le type
  diametre?: string
  conditionnement?: string
  format?: string
  taille?: string
  couleur?: string
  arome?: string
  saveur?: string
  forme?: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number // Prix unique (ou prix de base si variantes)
  description?: string
  image?: string // base64 - Gardé pour compatibilité avec l'ancien système
  images?: string[] // Nouveau : tableau d'images (base64) - Priorité sur image
  gamme?: string
  format?: string
  available: boolean
  variants?: ProductVariant[] // Si défini, le produit a des variantes
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'site-products-manager'

// ===== FONCTIONS DE BASE =====

export async function loadProducts(): Promise<Product[]> {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:47',message:'loadProducts entry',data:{isSupabaseConfigured:isSupabaseConfigured()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C'})}).catch(()=>{});
  }
  // #endregion
  
  // Utiliser uniquement Supabase - plus de fallback localStorage
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de charger les produits.')
    return []
  }
  
  try {
    const products = await loadProductsFromSupabase()
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:51',message:'loadProductsFromSupabase result',data:{productsCount:products.length,productsLength:products.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C'})}).catch(()=>{});
    }
    // #endregion
    
    // Migration : convertir image en images si nécessaire
    return products.map(product => {
      if (product.image && !product.images) {
        return {
          ...product,
          images: [product.image]
        }
      }
      return product
    })
  } catch (error) {
    console.error('❌ Erreur lors du chargement depuis Supabase:', error)
    return []
  }

}

// Version synchrone pour compatibilité (retourne un tableau vide, utilisez loadProducts() à la place)
export function loadProductsSync(): Product[] {
  console.warn('⚠️ loadProductsSync() est déprécié. Utilisez loadProducts() qui charge depuis Supabase.')
  return []
}

export async function saveProducts(products: Product[]): Promise<void> {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:112',message:'saveProducts entry',data:{productsCount:products.length,isSupabaseConfigured:isSupabaseConfigured()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }
  // #endregion
  
  // Utiliser uniquement Supabase - plus de fallback localStorage
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de sauvegarder les produits.')
    throw new Error('Supabase non configuré')
  }
  
  try {
    const success = await saveAllProductsToSupabase(products)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:116',message:'saveAllProductsToSupabase result',data:{success,productsCount:products.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    
    if (!success) {
      throw new Error('Échec de la sauvegarde dans Supabase')
    }
    
    // Émettre l'événement pour notifier les composants
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('products-updated', { detail: products }))
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde dans Supabase:', error)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:118',message:'saveProducts supabase error',data:{errorMessage:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    throw error
  }
}

// ===== CRUD SIMPLIFIÉ =====

export async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:134',message:'addProduct entry',data:{productName:data.name,category:data.category},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
  const newProduct: Product = {
    ...data,
    id: `product-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  // Sauvegarder directement dans Supabase si configuré
  if (isSupabaseConfigured()) {
    try {
      const { saveProductToSupabase } = await import('./products-supabase')
      const success = await saveProductToSupabase(newProduct)
      if (!success) {
        console.error('❌ Erreur lors de la sauvegarde du produit dans Supabase')
        // Continuer quand même pour sauvegarder dans localStorage
      } else {
        console.log('✅ Produit sauvegardé dans Supabase')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde dans Supabase:', error)
      // Continuer pour sauvegarder dans localStorage
    }
  }

  // Toujours sauvegarder dans localStorage (fallback + cache)
  const products = await loadProducts()
  products.push(newProduct)
  await saveProducts(products)
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:143',message:'addProduct after save',data:{productId:newProduct.id,totalProducts:products.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
  }
  // #endregion
  return newProduct
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
  const products = await loadProducts()
  const index = products.findIndex(p => p.id === id)
  if (index === -1) return null
  
  products[index] = {
    ...products[index],
    ...data,
    updatedAt: Date.now()
  }
  await saveProducts(products)
  return products[index]
}

export async function deleteProduct(id: string): Promise<boolean> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de supprimer le produit.')
    return false
  }
  
  try {
    const success = await deleteProductFromSupabase(id)
    if (success) {
      // Émettre l'événement pour notifier les composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('products-updated'))
      }
    }
    return success
  } catch (error) {
    console.error('❌ Erreur lors de la suppression dans Supabase:', error)
    return false
  }
}

// ===== REQUÊTES SIMPLIFIÉES =====

export async function getProductById(id: string): Promise<Product | null> {
  const products = await loadProducts()
  return products.find(p => p.id === id) || null
}

// Version synchrone pour compatibilité
export function getProductByIdSync(id: string): Product | null {
  return loadProductsSync().find(p => p.id === id) || null
}

export async function getProductsByCategory(category: string, includeUnavailable = false): Promise<Product[]> {
  const products = await loadProducts()
  const filtered = products.filter(p => {
    const categoryMatch = p.category.toLowerCase() === category.toLowerCase()
    if (!categoryMatch) return false
    if (includeUnavailable) return true
    return p.available === true
  })
  return filtered
}

// Version synchrone pour compatibilité
export function getProductsByCategorySync(category: string, includeUnavailable = false): Product[] {
  const products = loadProductsSync()
  const filtered = products.filter(p => {
    const categoryMatch = p.category.toLowerCase() === category.toLowerCase()
    if (!categoryMatch) return false
    if (includeUnavailable) return true
    return p.available === true
  })
  return filtered
}

export async function getProductsByGamme(gamme: string, includeUnavailable = false): Promise<Product[]> {
  const products = await loadProducts()
  if (!gamme) return []
  
  // Normaliser la gamme recherchée (trim + lowercase)
  const normalizedGamme = gamme.trim().toLowerCase()
  
  const filtered = products.filter(p => {
    if (!p.gamme) return false
    
    // Normaliser la gamme du produit pour la comparaison
    const productGamme = p.gamme.trim().toLowerCase()
    const gammeMatch = productGamme === normalizedGamme
    
    if (!gammeMatch) return false
    
    // Si on inclut les indisponibles, retourner tous les produits correspondants
    if (includeUnavailable) return true
    
    // Sinon, ne retourner que les produits disponibles
    return p.available === true
  })
  
  return filtered
}

export async function getAllProducts(includeUnavailable = false): Promise<Product[]> {
  const products = await loadProducts()
  if (includeUnavailable) return products
  return products.filter(p => p.available === true)
}

// Version synchrone pour compatibilité
export function getAllProductsSync(includeUnavailable = false): Product[] {
  const products = loadProductsSync()
  if (includeUnavailable) return products
  return products.filter(p => p.available === true)
}

// ===== ÉVÉNEMENTS =====

export function onProductsUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = () => callback()
  window.addEventListener('products-updated', handler)
  return () => window.removeEventListener('products-updated', handler)
}

// ===== UTILITAIRES =====

/**
 * Obtient les images d'un produit (priorité sur images[], fallback sur image, puis image de gamme)
 */
export function getProductImages(product: Product): string[] {
  // #region agent log
  if (typeof window !== 'undefined') {
    const imagesValid = product.images && product.images.length > 0 && product.images.filter(img => img && img.trim().length > 0).length > 0
    const imageValid = product.image && product.image.trim().length > 0
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:170',message:'getProductImages entry',data:{productId:product.id,productName:product.name,hasImages:!!product.images,imagesCount:product.images?.length||0,imagesValid:imagesValid,imagesArray:product.images,hasImage:!!product.image,imageValid:imageValid,imageValue:product.image?.substring(0,50)||'',productGamme:product.gamme},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A,B,C'})}).catch(()=>{});
  }
  // #endregion
  
  // 1. Priorité : images du produit (vérifier qu'elles ne sont pas vides)
  if (product.images && product.images.length > 0) {
    const validImages = product.images.filter(img => img && img.trim().length > 0)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:178',message:'checking product images',data:{imagesCount:product.images.length,validImagesCount:validImages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    if (validImages.length > 0) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:183',message:'returning valid product images',data:{validImagesCount:validImages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      return validImages
    }
  }
  
  // 2. Fallback : image unique du produit (vérifier qu'elle n'est pas vide)
  if (product.image && product.image.trim().length > 0) {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:191',message:'returning valid product image',data:{imageLength:product.image.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    return [product.image]
  }
  
  // 3. Fallback : image de la gamme (si le produit a une gamme ET n'a pas d'image valide)
  if (product.gamme && typeof window !== 'undefined') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:207',message:'attempting gamme image fallback',data:{productGamme:product.gamme,reason:'no valid product images'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B,C'})}).catch(()=>{});
    // #endregion
    
    try {
      // Import dynamique pour éviter les dépendances circulaires
      const gammeManager = require('./gammes-manager')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:186',message:'require successful',data:{hasGetGammeImage:typeof gammeManager.getGammeImage === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const gammeImage = gammeManager.getGammeImage(product.gamme)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:189',message:'getGammeImage result',data:{productGamme:product.gamme,gammeImageFound:!!gammeImage,gammeImageType:typeof gammeImage,gammeImageLength:gammeImage?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
      // #endregion
      
      if (gammeImage && gammeImage.trim().length > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:225',message:'returning valid gamme image',data:{gammeImageLength:gammeImage.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return [gammeImage]
      }
           } catch (e) {
             // #region agent log
             const error = e as Error
             fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:195',message:'require error',data:{errorMessage:String(e),errorName:error?.name,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
             // #endregion
             // Ignorer les erreurs d'import (peut arriver en SSR)
           }
  } else {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:199',message:'gamme fallback skipped',data:{hasGamme:!!product.gamme,isWindowDefined:typeof window !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
    }
    // #endregion
  }
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products-manager.ts:203',message:'returning empty array',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion
  return []
}

/**
 * Obtient la première image d'un produit
 */
export function getProductFirstImage(product: Product): string | null {
  const images = getProductImages(product)
  return images.length > 0 ? images[0] : null
}