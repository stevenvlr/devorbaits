// Adapter de produits Supabase avec fallback localStorage
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import type { Product, ProductVariant } from './products-manager'

// Cache en mémoire pour réduire les appels PostgREST répétés
let productsCache: Product[] | null = null
let productsCacheFetchedAt = 0
const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Cache persistant navigateur (localStorage) pour réduire les appels même après refresh
const PRODUCTS_LOCAL_CACHE_KEY = 'supabase_products_cache_v1'
const PRODUCTS_LOCAL_CACHE_TTL_MS = 25 * 60 * 1000 // 25 minutes

function invalidateProductsCache() {
  productsCache = null
  productsCacheFetchedAt = 0
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(PRODUCTS_LOCAL_CACHE_KEY)
    } catch {
      // ignore
    }
  }
}

/**
 * Charge tous les produits depuis Supabase
 */
export async function loadProductsFromSupabase(): Promise<Product[]> {
  // Cache persistant navigateur (utile pour les visiteurs + refresh)
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(PRODUCTS_LOCAL_CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { fetchedAt: number; data: Product[] } | null
        if (
          parsed &&
          typeof parsed.fetchedAt === 'number' &&
          Array.isArray(parsed.data) &&
          Date.now() - parsed.fetchedAt < PRODUCTS_LOCAL_CACHE_TTL_MS
        ) {
          // Hydrater aussi le cache mémoire pour accélérer les appels suivants
          productsCache = parsed.data
          productsCacheFetchedAt = parsed.fetchedAt
          return parsed.data
        }
      }
    } catch {
      // ignore (localStorage bloqué / JSON invalide)
    }
  }

  // Cache (utile surtout quand plusieurs pages/components chargent les produits)
  if (productsCache && Date.now() - productsCacheFetchedAt < PRODUCTS_CACHE_TTL_MS) {
    return productsCache
  }

  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,category,price,description,image,images,gamme,format,available,variants,created_at,updated_at')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Erreur lors du chargement des produits depuis Supabase:', error)
      return []
    }

    // Convertir les données Supabase en Product
    const products = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: parseFloat(row.price) || 0,
      description: row.description || undefined,
      image: row.image || undefined,
      images: row.images && Array.isArray(row.images) ? row.images : undefined,
      gamme: row.gamme || undefined,
      format: row.format || undefined,
      available: row.available !== false,
      variants: row.variants ? (typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    productsCache = products
    productsCacheFetchedAt = Date.now()

    // Écrire dans le cache persistant navigateur
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          PRODUCTS_LOCAL_CACHE_KEY,
          JSON.stringify({ fetchedAt: productsCacheFetchedAt, data: products })
        )
      } catch {
        // ignore (quota / localStorage bloqué)
      }
    }

    return products
  } catch (error) {
    console.error('Erreur lors du chargement des produits depuis Supabase:', error)
    return []
  }
}

/**
 * Sauvegarde un produit dans Supabase
 */
export async function saveProductToSupabase(product: Product): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('products')
      .upsert({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description || null,
        image: product.image || null,
        images: product.images && product.images.length > 0 ? product.images : null,
        gamme: product.gamme || null,
        format: product.format || null,
        available: product.available !== false,
        variants: product.variants || null, // Supabase gère JSONB directement
        created_at: product.createdAt,
        updated_at: product.updatedAt
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error('❌ Erreur lors de la sauvegarde du produit dans Supabase:', error)
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }

    console.log(`✅ Produit "${product.name}" sauvegardé dans Supabase`)
    invalidateProductsCache()
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de la sauvegarde du produit dans Supabase:', error)
    return false
  }
}

/**
 * Sauvegarde tous les produits dans Supabase
 */
export async function saveAllProductsToSupabase(products: Product[]): Promise<boolean> {
  if (!isSupabaseConfigured() || products.length === 0) {
    console.error('❌ Supabase non configuré ou aucun produit à sauvegarder')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('❌ Impossible de créer le client Supabase')
    return false
  }

  try {
    // Vérifier d'abord que la table existe
    const { error: testError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur d\'accès à la table products:', testError)
      console.error('💡 Vérifiez que la table "products" existe dans Supabase et que les politiques RLS sont correctement configurées')
      return false
    }

    // Diviser en lots de 50 pour éviter les timeouts
    const batchSize = 50
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      const productsToInsert = batch.map(product => {
        // Nettoyer les données avant insertion
        const cleanProduct: any = {
          id: product.id,
          name: product.name,
          category: product.category,
          price: Number(product.price) || 0,
          description: product.description || null,
          image: product.image || null,
          images: product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images : null,
          gamme: product.gamme || null,
          format: product.format || null,
          available: product.available !== false,
          created_at: Number(product.createdAt) || Date.now(),
          updated_at: Number(product.updatedAt) || Date.now()
        }

        // Gérer les variants (JSONB)
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          cleanProduct.variants = product.variants
        } else {
          cleanProduct.variants = null
        }

        return cleanProduct
      })

      const { error } = await supabase
        .from('products')
        .upsert(productsToInsert, {
          onConflict: 'id'
        })

      if (error) {
        console.error(`❌ Erreur lors de la sauvegarde du lot ${Math.floor(i / batchSize) + 1}:`, error)
        console.error('Détails:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        errorCount += batch.length
      } else {
        successCount += batch.length
        console.log(`✅ Lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}: ${batch.length} produit(s) sauvegardé(s)`)
      }
    }

    if (errorCount > 0) {
      console.error(`❌ ${errorCount} produit(s) n'ont pas pu être sauvegardés`)
      return false
    }

    console.log(`✅ ${successCount} produit(s) sauvegardé(s) dans Supabase`)
    invalidateProductsCache()
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de la sauvegarde des produits dans Supabase:', error)
    console.error('Erreur complète:', error)
    return false
  }
}

/**
 * Supprime un produit de Supabase
 */
export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Erreur lors de la suppression du produit dans Supabase:', error)
      return false
    }

    invalidateProductsCache()
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression du produit dans Supabase:', error)
    return false
  }
}

/**
 * Migre les produits depuis localStorage vers Supabase
 */
export async function migrateProductsToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, count: 0, error: 'Supabase non configuré' }
  }

  if (typeof window === 'undefined') {
    return { success: false, count: 0, error: 'Window non disponible' }
  }

  try {
    // Charger tous les produits (depuis Supabase ou localStorage via loadProducts)
    const { loadProducts } = await import('./products-manager')
    const products = await loadProducts()
    
    if (products.length === 0) {
      return { success: false, count: 0, error: 'Aucun produit à migrer' }
    }

    // Sauvegarder dans Supabase
    console.log(`🔄 Migration de ${products.length} produit(s) vers Supabase...`)
    const success = await saveAllProductsToSupabase(products)
    
    if (success) {
      // Marquer comme migré
      localStorage.setItem('migrated_products', 'true')
      console.log(`✅ Migration réussie : ${products.length} produit(s) migré(s)`)
      return { success: true, count: products.length }
    } else {
      const errorMsg = 'Erreur lors de la sauvegarde dans Supabase.\n\nVérifiez :\n1. Que la table "products" existe dans Supabase\n2. Que les politiques RLS permettent l\'insertion\n3. La console du navigateur (F12) pour plus de détails'
      console.error('❌ Migration échouée')
      return { success: false, count: 0, error: errorMsg }
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la migration:', error)
    return { success: false, count: 0, error: error.message || 'Erreur inconnue' }
  }
}
