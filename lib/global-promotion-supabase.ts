// Gestion de la promotion globale depuis Supabase
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface GlobalPromotion {
  id: string
  active: boolean
  discountPercentage: number
  applyToAll: boolean
  allowedCategories?: string[]
  allowedGammes?: string[]
  description?: string
  validFrom?: string
  validUntil?: string
  createdAt: number
  updatedAt: number
}

/**
 * Charge la promotion globale active depuis Supabase
 */
export async function loadGlobalPromotionFromSupabase(): Promise<GlobalPromotion | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('global_promotion')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Pas de promotion active, c'est normal
      return null
    }

    // Vérifier les dates de validité
    const now = new Date()
    
    // Pour valid_from : la promotion est valide si la date de début est passée ou aujourd'hui
    // On compare les dates sans l'heure pour inclure toute la journée
    if (data.valid_from) {
      const validFromDate = new Date(data.valid_from)
      // Mettre à minuit pour comparer seulement les dates
      const validFromMidnight = new Date(validFromDate.getFullYear(), validFromDate.getMonth(), validFromDate.getDate())
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (validFromMidnight > nowMidnight) {
        console.log('Promotion pas encore valide:', { validFrom: validFromMidnight, now: nowMidnight })
        return null // Promotion pas encore valide
      }
    }
    
    // Pour valid_until : la promotion est valide si la date de fin est dans le futur ou aujourd'hui
    // On compare les dates sans l'heure pour inclure toute la journée
    if (data.valid_until) {
      const validUntilDate = new Date(data.valid_until)
      // Mettre à minuit du jour suivant pour inclure toute la journée de fin
      const validUntilEndOfDay = new Date(validUntilDate.getFullYear(), validUntilDate.getMonth(), validUntilDate.getDate() + 1)
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      if (validUntilEndOfDay <= nowMidnight) {
        console.log('Promotion expirée:', { validUntil: validUntilEndOfDay, now: nowMidnight })
        return null // Promotion expirée
      }
    }

    // Convertir les données Supabase en GlobalPromotion
    return {
      id: data.id,
      active: data.active !== false,
      discountPercentage: parseFloat(data.discount_percentage) || 0,
      applyToAll: data.apply_to_all !== false,
      allowedCategories: data.allowed_categories && Array.isArray(data.allowed_categories) ? data.allowed_categories : undefined,
      allowedGammes: data.allowed_gammes && Array.isArray(data.allowed_gammes) ? data.allowed_gammes : undefined,
      description: data.description || undefined,
      validFrom: data.valid_from || undefined,
      validUntil: data.valid_until || undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now()
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la promotion globale depuis Supabase:', error)
    return null
  }
}

/**
 * Charge toutes les promotions (pour l'admin)
 */
export async function loadAllGlobalPromotionsFromSupabase(): Promise<GlobalPromotion[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('global_promotion')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Erreur lors du chargement des promotions depuis Supabase:', error)
      return []
    }

    return data.map((row: any) => ({
      id: row.id,
      active: row.active !== false,
      discountPercentage: parseFloat(row.discount_percentage) || 0,
      applyToAll: row.apply_to_all !== false,
      allowedCategories: row.allowed_categories && Array.isArray(row.allowed_categories) ? row.allowed_categories : undefined,
      allowedGammes: row.allowed_gammes && Array.isArray(row.allowed_gammes) ? row.allowed_gammes : undefined,
      description: row.description || undefined,
      validFrom: row.valid_from || undefined,
      validUntil: row.valid_until || undefined,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des promotions depuis Supabase:', error)
    return []
  }
}

/**
 * Sauvegarde une promotion globale dans Supabase
 */
export async function saveGlobalPromotionToSupabase(promotion: GlobalPromotion): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false }
  }

  try {
    // Si on active une promotion, désactiver toutes les autres
    if (promotion.active) {
      await supabase
        .from('global_promotion')
        .update({ active: false })
        .neq('id', promotion.id || '')
    }

    const promotionToInsert: any = {
      active: promotion.active !== false,
      discount_percentage: promotion.discountPercentage,
      apply_to_all: promotion.applyToAll !== false,
      allowed_categories: promotion.allowedCategories && promotion.allowedCategories.length > 0 ? promotion.allowedCategories : null,
      allowed_gammes: promotion.allowedGammes && promotion.allowedGammes.length > 0 ? promotion.allowedGammes : null,
      description: promotion.description || null,
      valid_from: promotion.validFrom || null,
      valid_until: promotion.validUntil || null
    }

    // Si on a un ID, faire un UPDATE, sinon un INSERT
    if (promotion.id) {
      promotionToInsert.id = promotion.id
      const { data, error } = await supabase
        .from('global_promotion')
        .update(promotionToInsert)
        .eq('id', promotion.id)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la mise à jour de la promotion dans Supabase:', error)
        return { success: false }
      }

      return { success: true, id: data.id }
    } else {
      const { data, error } = await supabase
        .from('global_promotion')
        .insert(promotionToInsert)
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la création de la promotion dans Supabase:', error)
        return { success: false }
      }

      return { success: true, id: data.id }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la promotion dans Supabase:', error)
    return { success: false }
  }
}

/**
 * Supprime une promotion globale de Supabase
 */
export async function deleteGlobalPromotionFromSupabase(promotionId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('global_promotion')
      .delete()
      .eq('id', promotionId)

    if (error) {
      console.error('Erreur lors de la suppression de la promotion dans Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion dans Supabase:', error)
    return false
  }
}
