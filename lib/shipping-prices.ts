// Gestion des tarifs d'expédition personnalisés
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface ShippingPrice {
  id: string
  name: string
  type: 'fixed' | 'margin_percent' | 'margin_fixed' | 'weight_ranges' | 'boxtal_only'
  shipping_type?: 'home' | 'relay' // 'home' = livraison à domicile, 'relay' = point relais
  country?: 'FR' | 'BE' | 'ALL' // Code pays: FR (France), BE (Belgique), ALL (Tous les pays)
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
 * @param country - Code pays: 'FR' (France), 'BE' (Belgique). Si non fourni, cherche d'abord un tarif 'ALL', puis 'FR'
 */
export async function getActiveShippingPrice(shippingType: 'home' | 'relay' = 'home', country?: 'FR' | 'BE'): Promise<ShippingPrice | null> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré')
    return null
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.warn('⚠️ Client Supabase non disponible')
    return null
  }

  try {
    const targetCountry = country || 'FR' // Par défaut France si non spécifié
    console.log(`🔍 Recherche d'un tarif actif pour le type "${shippingType}" et pays "${targetCountry}"`)
    
    // 1. Chercher un tarif spécifique au pays (si la colonne country existe)
    try {
      const { data: dataSpecific, error: errorSpecific } = await supabase
        .from('shipping_prices')
        .select('*')
        .eq('active', true)
        .eq('shipping_type', shippingType)
        .or(`country.eq.${targetCountry},country.eq.ALL,country.is.null`)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10) // Récupérer plusieurs pour pouvoir prioriser
      
      // Si pas d'erreur et qu'on a des données, les utiliser
      if (!errorSpecific && dataSpecific && dataSpecific.length > 0) {
        // Prioriser le tarif spécifique au pays, puis ALL, puis null
        const prioritized = dataSpecific.sort((a, b) => {
          const aCountry = a.country || 'FR'
          const bCountry = b.country || 'FR'
          if (aCountry === targetCountry) return -1
          if (bCountry === targetCountry) return 1
          if (aCountry === 'ALL') return -1
          if (bCountry === 'ALL') return 1
          return 0
        })[0]
        console.log(`✅ Tarif ${shippingType} trouvé pour ${targetCountry}:`, prioritized)
        return prioritized
      }
    } catch (countryError: any) {
      // Si la colonne country n'existe pas, continuer avec la recherche normale
      console.log('⚠️ Colonne country possiblement absente, recherche sans filtre pays')
    }
    
    // 2. Fallback : chercher sans filtre country (rétrocompatibilité)
    const { data, error } = await supabase
      .from('shipping_prices')
      .select('*')
      .eq('active', true)
      .eq('shipping_type', shippingType)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Erreur lors de la récupération du tarif:', error)
      console.error('Détails de l\'erreur:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Fallback 0 : si la colonne shipping_type n'existe pas encore (schéma pas à jour),
      // on tente de récupérer le dernier tarif actif sans filtrer par shipping_type.
      const maybeMissingColumn =
        typeof error.message === 'string' &&
        (error.message.includes('shipping_type') || error.message.includes('column') || error.message.includes('does not exist'))

      if (maybeMissingColumn) {
        console.log('🔄 Colonne shipping_type possiblement absente, fallback sans filtre shipping_type')
        const { data: fallbackAny, error: fallbackAnyError } = await supabase
          .from('shipping_prices')
          .select('*')
          .eq('active', true)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)

        if (fallbackAnyError) {
          console.error('❌ Erreur lors du fallback sans shipping_type:', fallbackAnyError)
          return null
        }
        if (fallbackAny && fallbackAny.length > 0) {
          console.log('✅ Tarif actif (fallback sans shipping_type) trouvé:', fallbackAny[0])
          return fallbackAny[0]
        }
      }

      // Fallback 1 : tarif sans type (rétrocompatibilité)
      console.log('🔄 Tentative de récupération d\'un tarif sans type (rétrocompatibilité)')
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('shipping_prices')
        .select('*')
        .eq('active', true)
        .is('shipping_type', null)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (fallbackError) {
        console.error('❌ Erreur lors de la récupération du tarif fallback:', fallbackError)
        return null
      }

      if (fallbackData && fallbackData.length > 0) {
        console.log('✅ Tarif fallback trouvé:', fallbackData[0])
        return fallbackData[0]
      }

      return null
    }

    if (data && data.length > 0) {
      console.log(`✅ Tarif ${shippingType} trouvé:`, data[0])
      console.log(`   - Nom: ${data[0].name}`)
      console.log(`   - Type: ${data[0].type}`)
      console.log(`   - Shipping Type: ${data[0].shipping_type}`)
      console.log(`   - Actif: ${data[0].active}`)
      return data[0]
    } else {
      console.log(`⚠️ Aucun tarif trouvé avec shipping_type="${shippingType}" et active=true`)
      
      // Debug : Vérifier tous les tarifs actifs pour voir ce qui existe
      const { data: allActivePrices, error: allActiveError } = await supabase
        .from('shipping_prices')
        .select('id, name, shipping_type, active, type')
        .eq('active', true)
      
      if (allActiveError) {
        console.error('❌ Erreur lors de la récupération de tous les tarifs actifs:', allActiveError)
      } else if (allActivePrices && allActivePrices.length > 0) {
        console.log(`📋 ${allActivePrices.length} tarif(s) actif(s) trouvé(s) dans la base:`)
        allActivePrices.forEach((p: any) => {
          console.log(`   - ${p.name} (shipping_type: ${p.shipping_type || 'null'}, type: ${p.type}, actif: ${p.active})`)
        })
        
        // Vérifier spécifiquement les tarifs 'relay'
        const relayPrices = allActivePrices.filter((p: any) => p.shipping_type === 'relay')
        if (relayPrices.length > 0) {
          console.log(`✅ ${relayPrices.length} tarif(s) "relay" trouvé(s):`, relayPrices)
        } else {
          console.log(`⚠️ Aucun tarif avec shipping_type="relay" trouvé parmi les tarifs actifs`)
        }
      } else {
        console.log(`⚠️ Aucun tarif actif trouvé dans la base de données`)
      }
      
      // Debug supplémentaire : vérifier TOUS les tarifs (actifs et inactifs)
      const { data: allPrices } = await supabase
        .from('shipping_prices')
        .select('id, name, shipping_type, active, type')
        .order('created_at', { ascending: false })
      
      if (allPrices && allPrices.length > 0) {
        console.log(`📋 Total de ${allPrices.length} tarif(s) dans la base (actifs et inactifs):`)
        allPrices.forEach((p: any) => {
          console.log(`   - ${p.name} (shipping_type: ${p.shipping_type || 'null'}, type: ${p.type}, actif: ${p.active})`)
        })
      }
    }

    // Si aucun tarif avec le type spécifique n'est trouvé, essayer les fallbacks
    console.log(`🔄 Aucun tarif "${shippingType}" trouvé, recherche d'un tarif de secours`)
    
    // Fallback 1 : Chercher un tarif sans type (rétrocompatibilité)
    const { data: fallbackData1, error: fallbackError1 } = await supabase
      .from('shipping_prices')
      .select('*')
      .eq('active', true)
      .is('shipping_type', null)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (!fallbackError1 && fallbackData1 && fallbackData1.length > 0) {
      console.log('✅ Tarif fallback (sans type) trouvé:', fallbackData1[0])
      return fallbackData1[0]
    }
    
    // Fallback 2 : Pour 'relay', essayer de trouver un tarif 'home' comme alternative
    if (shippingType === 'relay') {
      console.log('🔄 Tentative de récupération d\'un tarif "home" comme alternative pour "relay"')
      const { data: fallbackData2, error: fallbackError2 } = await supabase
        .from('shipping_prices')
        .select('*')
        .eq('active', true)
        .eq('shipping_type', 'home')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (!fallbackError2 && fallbackData2 && fallbackData2.length > 0) {
        console.log('✅ Tarif "home" utilisé comme alternative pour "relay":', fallbackData2[0])
        return fallbackData2[0]
      }
    }
    
    // Fallback 3 : Pour 'home', essayer de trouver un tarif 'relay' comme alternative
    if (shippingType === 'home') {
      console.log('🔄 Tentative de récupération d\'un tarif "relay" comme alternative pour "home"')
      const { data: fallbackData3, error: fallbackError3 } = await supabase
        .from('shipping_prices')
        .select('*')
        .eq('active', true)
        .eq('shipping_type', 'relay')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (!fallbackError3 && fallbackData3 && fallbackData3.length > 0) {
        console.log('✅ Tarif "relay" utilisé comme alternative pour "home":', fallbackData3[0])
        return fallbackData3[0]
      }
    }

    console.warn(`⚠️ Aucun tarif actif trouvé pour le type "${shippingType}" (ni fallback)`)
    return null
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du tarif:', error)
    return null
  }
}

/**
 * Calcule le prix d'expédition final en appliquant les tarifs personnalisés
 * @param basePrice - Prix de base
 * @param weight - Poids du colis
 * @param orderValue - Valeur de la commande
 * @param shippingType - Type d'envoi: 'home' pour livraison à domicile, 'relay' pour point relais
 * @param country - Code pays: 'FR' (France), 'BE' (Belgique)
 */
export async function calculateFinalShippingPrice(
  basePrice: number,
  weight: number,
  orderValue: number = 0,
  shippingType: 'home' | 'relay' = 'home',
  country?: 'FR' | 'BE'
): Promise<number> {
  const shippingPrice = await getActiveShippingPrice(shippingType, country)

  if (!shippingPrice) {
    // Pas de tarif personnalisé, utiliser le prix de base
    return basePrice
  }

  // Livraison gratuite si commande >= seuil
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
    
    case 'boxtal_only':
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
      active: price.active !== undefined ? price.active : true
    }
    
    // Définir shipping_type : utiliser la valeur fournie, ou 'home' par défaut seulement si vraiment non défini
    // Important : ne pas utiliser || car 'relay' est truthy, mais on veut préserver null/undefined si vraiment non défini
    if (price.shipping_type !== undefined && price.shipping_type !== null) {
      cleanPrice.shipping_type = price.shipping_type
    } else {
      // Valeur par défaut uniquement si vraiment non défini
      cleanPrice.shipping_type = 'home'
    }
    
    console.log('💾 Sauvegarde tarif avec shipping_type:', cleanPrice.shipping_type, '(valeur originale:', price.shipping_type, ')')
    if (price.fixed_price !== undefined) cleanPrice.fixed_price = price.fixed_price
    if (price.margin_percent !== undefined) cleanPrice.margin_percent = price.margin_percent
    if (price.margin_fixed !== undefined) cleanPrice.margin_fixed = price.margin_fixed
    if (price.weight_ranges !== undefined) cleanPrice.weight_ranges = price.weight_ranges
    if (price.min_weight !== undefined) cleanPrice.min_weight = price.min_weight
    if (price.max_weight !== undefined) cleanPrice.max_weight = price.max_weight
    if (price.min_order_value !== undefined) cleanPrice.min_order_value = price.min_order_value
    if (price.free_shipping_threshold !== undefined) cleanPrice.free_shipping_threshold = price.free_shipping_threshold

    // Important: éviter plusieurs tarifs "active=true" pour un même shipping_type
    // (sinon le checkout peut prendre un autre tarif actif que celui que tu viens de modifier).
    if (cleanPrice.active === true && cleanPrice.shipping_type) {
      const nowIso = new Date().toISOString()

      const deactivate = async (filter: (q: any) => any) => {
        let q = supabase
          .from('shipping_prices')
          .update({ active: false, updated_at: nowIso })
        q = filter(q)
        if (price.id) {
          q = q.neq('id', price.id)
        }
        const { error: deactivateError } = await q
        if (deactivateError) {
          console.warn('⚠️ Impossible de désactiver les autres tarifs actifs:', deactivateError)
        }
      }

      if (cleanPrice.shipping_type === 'home') {
        // Désactiver les autres "home"
        await deactivate((q: any) => q.eq('active', true).eq('shipping_type', 'home'))
        // Désactiver aussi les anciens tarifs sans type (rétrocompatibilité)
        await deactivate((q: any) => q.eq('active', true).is('shipping_type', null))
      } else {
        await deactivate((q: any) => q.eq('active', true).eq('shipping_type', cleanPrice.shipping_type))
      }
    }

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

// ============================================
// TARIFS SPONSORS GLOBAUX
// ============================================

export interface SponsorShippingRate {
  id: string
  min_weight: number
  max_weight: number | null
  price: number
}

/**
 * Récupère les tarifs sponsors globaux
 */
export async function getSponsorShippingRates(): Promise<SponsorShippingRate[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('sponsor_shipping_rates')
      .select('*')
      .order('min_weight', { ascending: true })

    if (error) {
      console.error('Erreur récupération tarifs sponsors:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur récupération tarifs sponsors:', error)
    return []
  }
}

/**
 * Calcule le prix d'expédition pour un sponsor selon le poids
 */
export async function getSponsorShippingPrice(weight: number): Promise<number | null> {
  console.log('🎁 getSponsorShippingPrice - Poids:', weight, 'kg')
  const rates = await getSponsorShippingRates()
  
  console.log('🎁 Tarifs sponsors récupérés:', rates.length, 'tranches')
  
  if (rates.length === 0) {
    console.log('⚠️ Aucun tarif sponsor configuré')
    return null
  }

  for (const rate of rates) {
    console.log(`🎁 Vérification tranche: ${rate.min_weight}-${rate.max_weight ?? '∞'}kg = ${rate.price}€`)
    if (weight >= rate.min_weight && (rate.max_weight === null || weight <= rate.max_weight)) {
      console.log(`✅ Tarif sponsor trouvé: ${rate.price}€`)
      return rate.price
    }
  }

  console.log('⚠️ Aucune tranche ne correspond au poids')
  return null
}

/**
 * Sauvegarde les tarifs sponsors (remplace tous les tarifs existants)
 */
export async function saveSponsorShippingRates(rates: Array<{ min_weight: number; max_weight: number | null; price: number }>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Supprimer tous les tarifs existants
    const { error: deleteError } = await supabase
      .from('sponsor_shipping_rates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Trick pour supprimer tout

    if (deleteError) {
      console.error('Erreur suppression tarifs sponsors:', deleteError)
    }

    // Insérer les nouveaux tarifs
    if (rates.length > 0) {
      const { error: insertError } = await supabase
        .from('sponsor_shipping_rates')
        .insert(rates.map(r => ({
          min_weight: r.min_weight,
          max_weight: r.max_weight,
          price: r.price
        })))

      if (insertError) {
        console.error('Erreur insertion tarifs sponsors:', insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Erreur sauvegarde tarifs sponsors:', error)
    return false
  }
}
