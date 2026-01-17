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
  // Utiliser uniquement Supabase - plus de fallback localStorage
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de charger les produits.')
    return []
  }
  
  try {
    const products = await loadProductsFromSupabase()
    
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
  // Utiliser uniquement Supabase - plus de fallback localStorage
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de sauvegarder les produits.')
    throw new Error('Supabase non configuré')
  }
  
  try {
    const success = await saveAllProductsToSupabase(products)
    
    if (!success) {
      throw new Error('Échec de la sauvegarde dans Supabase')
    }
    
    // Émettre l'événement pour notifier les composants
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('products-updated', { detail: products }))
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde dans Supabase:', error)
    throw error
  }
}

// ===== CRUD SIMPLIFIÉ =====

export async function addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
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
  // 1. Priorité : images du produit (vérifier qu'elles ne sont pas vides)
  if (product.images && product.images.length > 0) {
    const validImages = product.images.filter(img => img && img.trim().length > 0)
    if (validImages.length > 0) {
      return validImages
    }
  }
  
  // 2. Fallback : image unique du produit (vérifier qu'elle n'est pas vide)
  if (product.image && product.image.trim().length > 0) {
    return [product.image]
  }
  
  // 3. Fallback : image partagée par catégorie (Flash Boost / Spray Plus)
  const categoryLower = product.category.toLowerCase()
  if (typeof window !== 'undefined' && (categoryLower === 'flash boost' || categoryLower === 'spray plus')) {
    try {
      const flashSprayManager = require('./flash-spray-variables-manager')
      let categoryImage: string | null = null
      
      if (categoryLower === 'flash boost') {
        categoryImage = flashSprayManager.getFlashBoostImageSync()
      } else if (categoryLower === 'spray plus') {
        categoryImage = flashSprayManager.getSprayPlusImageSync()
      }
      
      if (categoryImage && categoryImage.trim().length > 0) {
        return [categoryImage]
      }
    } catch (e) {
      // Ignorer les erreurs d'import (peut arriver en SSR)
    }
  }
  
  // 4. Fallback : image de la gamme (si le produit a une gamme ET n'a pas d'image valide)
  if (product.gamme && typeof window !== 'undefined') {
    try {
      // Import dynamique pour éviter les dépendances circulaires
      const gammeManager = require('./gammes-manager')
      
      const gammeImage = gammeManager.getGammeImage(product.gamme)
      
      if (gammeImage && gammeImage.trim().length > 0) {
        return [gammeImage]
      }
           } catch (e) {
             // Ignorer les erreurs d'import (peut arriver en SSR)
           }
  } else {
  }
  
  return []
}

/**
 * Obtient la première image d'un produit
 */
export function getProductFirstImage(product: Product): string | null {
  const images = getProductImages(product)
  return images.length > 0 ? images[0] : null
}