// Adapter de codes promo Supabase avec fallback localStorage
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import type { PromoCode } from './promo-codes-manager'

/**
 * Charge tous les codes promo depuis Supabase
 */
export async function loadPromoCodesFromSupabase(): Promise<PromoCode[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Erreur lors du chargement des codes promo depuis Supabase:', error)
      return []
    }

    // Convertir les données Supabase en PromoCode
    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      discountType: row.discount_type as 'percentage' | 'fixed',
      discountValue: parseFloat(row.discount_value) || 0,
      minPurchase: row.min_purchase ? parseFloat(row.min_purchase) : undefined,
      maxUses: row.max_uses || undefined,
      validFrom: row.valid_from || undefined,
      validUntil: row.valid_until || undefined,
      active: row.active !== false,
      allowedUserIds: row.allowed_user_ids && Array.isArray(row.allowed_user_ids) ? row.allowed_user_ids : undefined,
      allowedProductIds: row.allowed_product_ids && Array.isArray(row.allowed_product_ids) ? row.allowed_product_ids : undefined,
      allowedCategories: row.allowed_categories && Array.isArray(row.allowed_categories) ? row.allowed_categories : undefined,
      allowedGammes: row.allowed_gammes && Array.isArray(row.allowed_gammes) ? row.allowed_gammes : undefined,
      allowedConditionnements: row.allowed_conditionnements && Array.isArray(row.allowed_conditionnements) ? row.allowed_conditionnements : undefined,
      description: row.description || undefined,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des codes promo depuis Supabase:', error)
    return []
  }
}

/**
 * Sauvegarde un code promo dans Supabase
 */
export async function savePromoCodeToSupabase(promoCode: PromoCode): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false }
  }

  try {
    // Si l'ID n'est pas un UUID valide, on le laisse null pour que Supabase le génère
    // ou on génère un UUID v4
    let promoCodeId = promoCode.id
    if (!promoCodeId || !promoCodeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Générer un UUID v4
      promoCodeId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const promoCodeToInsert: any = {
      code: promoCode.code,
      discount_type: promoCode.discountType,
      discount_value: promoCode.discountValue,
      min_purchase: promoCode.minPurchase || null,
      max_uses: promoCode.maxUses || null,
      valid_from: promoCode.validFrom || null,
      valid_until: promoCode.validUntil || null,
      active: promoCode.active !== false,
      allowed_user_ids: promoCode.allowedUserIds && promoCode.allowedUserIds.length > 0 ? promoCode.allowedUserIds : null,
      allowed_product_ids: promoCode.allowedProductIds && promoCode.allowedProductIds.length > 0 ? promoCode.allowedProductIds : null,
      allowed_categories: promoCode.allowedCategories && promoCode.allowedCategories.length > 0 ? promoCode.allowedCategories : null,
      allowed_gammes: promoCode.allowedGammes && promoCode.allowedGammes.length > 0 ? promoCode.allowedGammes : null,
      allowed_conditionnements: promoCode.allowedConditionnements && promoCode.allowedConditionnements.length > 0 ? promoCode.allowedConditionnements : null,
      description: promoCode.description || null
    }

    // Si on a un ID valide, l'inclure (pour UPDATE), sinon Supabase le génère (pour INSERT)
    if (promoCodeId && promoCodeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      promoCodeToInsert.id = promoCodeId
    }

    const upsertOptions: any = {
      onConflict: promoCodeToInsert.id ? 'id' : 'code'
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .upsert(promoCodeToInsert, upsertOptions)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la sauvegarde du code promo dans Supabase:', error)
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { success: false }
    }

    // Retourner l'ID généré par Supabase si c'était un INSERT
    if (data && data.id) {
      // Mettre à jour l'ID du code promo avec celui généré par Supabase
      promoCode.id = data.id
      return { success: true, id: data.id }
    }

    return { success: true, id: promoCode.id }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du code promo dans Supabase:', error)
    return { success: false }
  }
}

/**
 * Supprime un code promo de Supabase
 */
export async function deletePromoCodeFromSupabase(promoCodeId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', promoCodeId)

    if (error) {
      console.error('Erreur lors de la suppression du code promo dans Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la suppression du code promo dans Supabase:', error)
    return false
  }
}
