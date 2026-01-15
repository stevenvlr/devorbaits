// Gestion des tarifs d'expédition personnalisés
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface ShippingPrice {
  id: string
  name: string
  type: 'fixed' | 'margin_percent' | 'margin_fixed' | 'weight_ranges'
  shipping_type?: 'home' | 'relay' // 'home' = livraison à domicile, 'relay' = point relais
  fixed_price?: number
  margin_percent?: number
  margin_fixed?: number
  weight_ranges?: Array<{ min: number; max: number | null; price: number }>
  active: boolean
  min_weight?: number
  max_weight?: number | null
  min_order_value?: number
  free_shipping_threshold?: number
  created_at?: string
  updated_at?: string
}

/**
 * Récupère le tarif d'expédition actif
 * @param shippingType - Type d'envoi: 'home' pour livraison à domicile, 'relay' pour point relais
 */
export async function getActiveShippingPrice(shippingType: 'home' | 'relay' = 'home'): Promise<ShippingPrice | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('shipping_prices')
      .select('*')
      .eq('active', true)
      .eq('shipping_type', shippingType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Si aucun tarif spécifique n'est trouvé, essayer de récupérer un tarif sans type (rétrocompatibilité)
      if (shippingType === 'home') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('shipping_prices')
          .select('*')
          .eq('active', true)
          .is('shipping_type', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (!fallbackError && fallbackData) {
          return fallbackData
        }
      }
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération du tarif:', error)
    return null
  }
}

/**
 * Calcule le prix d'expédition final en appliquant les tarifs personnalisés
 * @param basePrice - Prix de base
 * @param weight - Poids du colis
 * @param orderValue - Valeur de la commande
 * @param shippingType - Type d'envoi: 'home' pour livraison à domicile, 'relay' pour point relais
 */
export async function calculateFinalShippingPrice(
  basePrice: number,
  weight: number,
  orderValue: number = 0,
  shippingType: 'home' | 'relay' = 'home'
): Promise<number> {
  const shippingPrice = await getActiveShippingPrice(shippingType)

  if (!shippingPrice) {
    // Pas de tarif personnalisé, utiliser le prix de base
    return basePrice
  }

  // Vérifier la livraison gratuite
  if (shippingPrice.free_shipping_threshold && orderValue >= shippingPrice.free_shipping_threshold) {
    return 0
  }

  // Vérifier le prix minimum de commande
  if (shippingPrice.min_order_value && orderValue < shippingPrice.min_order_value) {
    return basePrice // Utiliser le prix de base si le minimum n'est pas atteint
  }

  // Vérifier les limites de poids
  if (shippingPrice.min_weight && weight < shippingPrice.min_weight) {
    return basePrice
  }
  if (shippingPrice.max_weight && weight > shippingPrice.max_weight) {
    return basePrice
  }

  // Appliquer le tarif selon le type
  switch (shippingPrice.type) {
    case 'fixed':
      return shippingPrice.fixed_price || basePrice

    case 'margin_percent':
      if (shippingPrice.margin_percent) {
        return basePrice * (1 + shippingPrice.margin_percent / 100)
      }
      return basePrice

    case 'margin_fixed':
      if (shippingPrice.margin_fixed) {
        return basePrice + shippingPrice.margin_fixed
      }
      return basePrice

    case 'weight_ranges':
      if (shippingPrice.weight_ranges && Array.isArray(shippingPrice.weight_ranges)) {
        // Trouver la tranche de poids correspondante
        for (const range of shippingPrice.weight_ranges) {
          if (weight >= range.min && (range.max === null || weight <= range.max)) {
            return range.price
          }
        }
      }
      // Si aucune tranche ne correspond, utiliser le prix de base
      return basePrice

    default:
      return basePrice
  }
}

/**
 * Récupère tous les tarifs (pour l'interface admin)
 */
export async function getAllShippingPrices(): Promise<ShippingPrice[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('shipping_prices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des tarifs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur lors de la récupération des tarifs:', error)
    return []
  }
}

/**
 * Sauvegarde un tarif (création ou mise à jour)
 */
export async function saveShippingPrice(price: Partial<ShippingPrice>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Nettoyer l'objet : supprimer les champs undefined et préparer les données
    const cleanPrice: any = {
      name: price.name,
      type: price.type,
      active: price.active !== undefined ? price.active : true,
    }

    // Ajouter les champs optionnels seulement s'ils sont définis
    if (price.shipping_type !== undefined) cleanPrice.shipping_type = price.shipping_type
    if (price.fixed_price !== undefined) cleanPrice.fixed_price = price.fixed_price
    if (price.margin_percent !== undefined) cleanPrice.margin_percent = price.margin_percent
    if (price.margin_fixed !== undefined) cleanPrice.margin_fixed = price.margin_fixed
    if (price.weight_ranges !== undefined) cleanPrice.weight_ranges = price.weight_ranges
    if (price.min_weight !== undefined) cleanPrice.min_weight = price.min_weight
    if (price.max_weight !== undefined) cleanPrice.max_weight = price.max_weight
    if (price.min_order_value !== undefined) cleanPrice.min_order_value = price.min_order_value
    if (price.free_shipping_threshold !== undefined) cleanPrice.free_shipping_threshold = price.free_shipping_threshold

    if (price.id) {
      // Mise à jour
      cleanPrice.updated_at = new Date().toISOString()
      
      const { error } = await supabase
        .from('shipping_prices')
        .update(cleanPrice)
        .eq('id', price.id)

      if (error) {
        console.error('Erreur lors de la mise à jour du tarif:', error)
        console.error('Détails:', error.message, error.details, error.hint)
        console.error('Code erreur:', error.code)
        
        // Message d'erreur plus explicite
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          console.error('⚠️ Erreur de permissions RLS. Vérifiez que vous êtes connecté en tant qu\'admin.')
        }
        return false
      }
    } else {
      // Création - Supabase génère automatiquement l'ID (UUID)
      // Ne pas inclure l'ID, Supabase le génère avec uuid_generate_v4()
      delete cleanPrice.id
      // created_at et updated_at sont gérés automatiquement par Supabase
      // mais on peut les définir si nécessaire

      const { error } = await supabase
        .from('shipping_prices')
        .insert([cleanPrice])
        .select()

      if (error) {
        console.error('Erreur lors de la création du tarif:', error)
        console.error('Détails:', error.message, error.details, error.hint)
        console.error('Code erreur:', error.code)
        console.error('Données envoyées:', cleanPrice)
        
        // Message d'erreur plus explicite
        if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
          console.error('⚠️ Erreur de permissions RLS. Vérifiez que vous êtes connecté en tant qu\'admin.')
        } else if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.error('⚠️ La table shipping_prices n\'existe pas. Exécutez le script SQL supabase-add-shipping-prices-table.sql')
        }
        return false
      }
    }

    return true
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde du tarif:', error)
    console.error('Erreur complète:', error.message, error.stack)
    return false
  }
}

/**
 * Supprime un tarif
 */
export async function deleteShippingPrice(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('shipping_prices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression du tarif:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la suppression du tarif:', error)
    return false
  }
}



