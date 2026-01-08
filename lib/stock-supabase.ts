// Gestion du stock avec Supabase uniquement
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface StockItem {
  productId: string
  variantId?: string
  stock: number
  reserved: number
  location?: string
}

/**
 * Charger tout le stock depuis Supabase
 */
export async function loadStockFromSupabase(location: string = 'general'): Promise<Record<string, StockItem>> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return {}
  }

  const supabase = getSupabaseClient()
  if (!supabase) return {}

  try {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .eq('location', location)

    if (error) {
      console.error('Erreur lors du chargement du stock:', error)
      return {}
    }

    if (!data) return {}

    // Convertir en format Record<string, StockItem>
    const stock: Record<string, StockItem> = {}
    data.forEach(item => {
      const key = item.variant_id ? `${item.product_id}-${item.variant_id}` : item.product_id
      stock[key] = {
        productId: item.product_id,
        variantId: item.variant_id || undefined,
        stock: item.quantity || 0,
        reserved: item.reserved || 0,
        location: item.location || location
      }
    })

    return stock
  } catch (error) {
    console.error('Erreur lors du chargement du stock:', error)
    return {}
  }
}

/**
 * Sauvegarder le stock dans Supabase
 */
export async function saveStockToSupabase(
  productId: string,
  variantId: string | undefined,
  quantity: number,
  reserved: number,
  location: string = 'general'
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Vérifier d'abord que la table existe
    const { error: testError } = await supabase
      .from('stock')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur d\'accès à la table stock:', testError)
      console.error('💡 Vérifiez que la table "stock" existe dans Supabase et que les politiques RLS sont correctement configurées')
      return false
    }

    // Préparer les données à insérer/mettre à jour
    const stockData: any = {
      product_id: productId,
      variant_id: variantId || null,
      location,
      quantity: Math.max(0, quantity),
      reserved: Math.max(0, reserved),
      updated_at: new Date().toISOString()
    }
    
    console.log('💾 Tentative de sauvegarde du stock:', {
      productId,
      variantId,
      location,
      quantity,
      reserved,
      stockData
    })
    
    const { data, error } = await supabase
      .from('stock')
      .upsert(stockData, {
        onConflict: 'product_id,variant_id,location'
      })

    if (error) {
      console.error('❌ Erreur lors de la sauvegarde du stock:', error)
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        productId,
        variantId,
        location
      })
      
      // Vérifier si c'est une erreur de contrainte unique
      if (error.code === '23505') {
        console.error('💡 Erreur de contrainte unique. Vérifiez que la combinaison (product_id, variant_id, location) est unique.')
      }
      
      // Vérifier si c'est une erreur de permissions RLS
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.error('💡 Erreur de permissions RLS. Vérifiez que les politiques RLS permettent l\'insertion/update sur la table stock.')
      }
      
      return false
    }

    return true
  } catch (error: any) {
    console.error('❌ Erreur exception lors de la sauvegarde du stock:', error)
    console.error('Détails:', {
      message: error?.message,
      stack: error?.stack,
      productId,
      variantId,
      location
    })
    return false
  }
}

/**
 * Sauvegarder tout le stock
 */
export async function saveAllStockToSupabase(stock: Record<string, StockItem>, location: string = 'general'): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Convertir en format Supabase
    const stockItems = Object.values(stock).map(item => ({
      product_id: item.productId,
      variant_id: item.variantId || null,
      location: item.location || location,
      quantity: Math.max(0, item.stock),
      reserved: Math.max(0, item.reserved),
      updated_at: new Date().toISOString()
    }))

    // Supprimer les anciens stocks pour cette location
    const { error: deleteError } = await supabase
      .from('stock')
      .delete()
      .eq('location', location)

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciens stocks:', deleteError)
    }

    // Insérer les nouveaux stocks
    if (stockItems.length > 0) {
      const { error: insertError } = await supabase
        .from('stock')
        .insert(stockItems)

      if (insertError) {
        console.error('Erreur lors de l\'insertion du stock:', insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du stock:', error)
    return false
  }
}


