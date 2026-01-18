// Adapter de codes promo Supabase avec fallback localStorage
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import type { PromoCode } from './promo-codes-manager'

const PROMO_CODES_SELECT =
  'id,code,discount_type,discount_value,min_purchase,max_uses,used_count,valid_from,valid_until,active,allowed_user_ids,allowed_product_ids,allowed_categories,allowed_gammes,allowed_conditionnements,description,created_at,updated_at'

// Cache en mémoire (admin seulement, mais évite des rechargements inutiles)
let promoCodesCache: PromoCode[] | null = null
let promoCodesCacheFetchedAt = 0
const PROMO_CODES_CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

function invalidatePromoCodesCache() {
  promoCodesCache = null
  promoCodesCacheFetchedAt = 0
}

/**
 * Charge tous les codes promo depuis Supabase
 */
export async function loadPromoCodesFromSupabase(): Promise<PromoCode[]> {
  if (promoCodesCache && Date.now() - promoCodesCacheFetchedAt < PROMO_CODES_CACHE_TTL_MS) {
    return promoCodesCache
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
      .from('promo_codes')
      .select(PROMO_CODES_SELECT)
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Erreur lors du chargement des codes promo depuis Supabase:', error)
      return []
    }

    // Convertir les données Supabase en PromoCode
    const promoCodes = data.map((row: any) => ({
      id: row.id,
      code: row.code,
      discountType: row.discount_type as 'percentage' | 'fixed',
      discountValue: parseFloat(row.discount_value) || 0,
      minPurchase: row.min_purchase ? parseFloat(row.min_purchase) : undefined,
      maxUses: row.max_uses || undefined,
      usedCount: typeof row.used_count === 'number' ? row.used_count : (row.used_count ? parseInt(row.used_count, 10) : 0),
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

    promoCodesCache = promoCodes
    promoCodesCacheFetchedAt = Date.now()
    return promoCodes
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
      invalidatePromoCodesCache()
      return { success: true, id: data.id }
    }

    invalidatePromoCodesCache()
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

    invalidatePromoCodesCache()
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression du code promo dans Supabase:', error)
    return false
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export async function getPromoCodeUsageCountFromSupabase(promoCodeId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const supabase = getSupabaseClient()
  if (!supabase) return 0

  const { count, error } = await supabase
    .from('promo_code_usage')
    .select('id', { count: 'exact', head: true })
    .eq('promo_code_id', promoCodeId)

  if (error) {
    console.error('Erreur lors du comptage promo_code_usage:', error)
    return 0
  }

  return count || 0
}

export async function hasUserUsedPromoCodeInSupabase(promoCodeId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data, error } = await supabase
    .from('promo_code_usage')
    .select('id')
    .eq('promo_code_id', promoCodeId)
    .eq('user_id', userId)
    .limit(1)

  if (error) {
    console.error('Erreur lors de la vérification promo_code_usage:', error)
    return false
  }

  return Array.isArray(data) && data.length > 0
}

export async function recordPromoCodeUsageToSupabase(params: {
  promoCodeId: string
  userId: string
  orderId?: string | null
  discountAmount: number
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase non configuré' }
  const supabase = getSupabaseClient()
  if (!supabase) return { success: false, error: 'Client Supabase indisponible' }

  const orderId =
    typeof params.orderId === 'string' && isUuid(params.orderId) ? params.orderId : null

  const { error } = await supabase.from('promo_code_usage').insert({
    promo_code_id: params.promoCodeId,
    user_id: params.userId,
    order_id: orderId,
    discount_amount: params.discountAmount
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
