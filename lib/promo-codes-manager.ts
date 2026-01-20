// Gestion des codes promo avec restrictions par utilisateur, produit, catégorie, gamme d'appât et conditionnement
import { loadPromoCodesFromSupabase, savePromoCodeToSupabase, deletePromoCodeFromSupabase } from './promo-codes-supabase'
import { isSupabaseConfigured } from './supabase'
import {
  getPromoCodeUsageCountFromSupabase,
  hasUserUsedPromoCodeInSupabase,
  recordPromoCodeUsageToSupabase
} from './promo-codes-supabase'

export interface PromoCode {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPurchase?: number
  maxUses?: number
  usedCount?: number
  validFrom?: string
  validUntil?: string
  active: boolean
  allowedUserIds?: string[] // IDs des utilisateurs autorisés (null = tous)
  allowedProductIds?: string[] // IDs des produits autorisés (null = tous)
  allowedCategories?: string[] // Catégories autorisées (null = toutes)
  allowedGammes?: string[] // Gammes autorisées (null = toutes)
  allowedConditionnements?: string[] // Conditionnements autorisés (ex: ['1kg'])
  unlimitedPerUser?: boolean // Si true, le code peut être utilisé plusieurs fois par le même utilisateur (pour les sponsors)
  description?: string
  createdAt: number
  updatedAt: number
}

export interface PromoCodeValidation {
  valid: boolean
  discount?: number
  error?: string
  appliedItems?: Array<{ itemId: string; discount: number }>
}

const STORAGE_KEY = 'site-promo-codes'
const USAGE_STORAGE_KEY = 'site-promo-codes-usage'

// ===== FONCTIONS DE BASE =====

export async function loadPromoCodes(): Promise<PromoCode[]> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de charger les codes promo.')
    return []
  }
  
  try {
    const codes = await loadPromoCodesFromSupabase()
    return codes
  } catch (error) {
    console.error('❌ Erreur lors du chargement depuis Supabase:', error)
    return []
  }
}

// Version synchrone pour compatibilité (retourne un tableau vide)
export function loadPromoCodesSync(): PromoCode[] {
  console.warn('⚠️ loadPromoCodesSync() est déprécié. Utilisez loadPromoCodes() qui charge depuis Supabase.')
  return []
}

export function savePromoCodes(codes: PromoCode[]): void {
  // Cette fonction n'est plus nécessaire car chaque code est géré individuellement
  // On garde la fonction pour compatibilité mais elle ne fait rien
  console.warn('⚠️ savePromoCodes() est déprécié. Utilisez addPromoCode(), updatePromoCode() et deletePromoCode() à la place.')
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('promo-codes-updated'))
  }
}

export async function addPromoCode(code: PromoCode): Promise<{ success: boolean; message: string }> {
  const newCode: PromoCode = {
    ...code,
    id: code.id || `promo-${Date.now()}-${Math.random()}`,
    createdAt: code.createdAt || Date.now(),
    updatedAt: Date.now()
  }

  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase non configuré. Impossible d\'ajouter le code promo.' }
  }
  
  try {
    // Vérifier si le code existe déjà dans Supabase
    const existingCodes = await loadPromoCodesFromSupabase()
    if (existingCodes.some(c => c.code.toLowerCase() === code.code.toLowerCase())) {
      return { success: false, message: 'Ce code promo existe déjà' }
    }

    const result = await savePromoCodeToSupabase(newCode)
    if (result.success) {
      // Émettre l'événement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('promo-codes-updated'))
      }
      return { success: true, message: 'Code promo ajouté avec succès' }
    } else {
      return { success: false, message: 'Erreur lors de l\'ajout du code promo' }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout dans Supabase:', error)
    return { success: false, message: 'Erreur lors de l\'ajout du code promo' }
  }
}

export async function addPromoCodesBulk(
  codes: PromoCode[]
): Promise<{ success: boolean; created: number; failed: number; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      created: 0,
      failed: codes.length,
      errors: ['Supabase non configuré. Impossible de créer des codes en masse.']
    }
  }

  const errors: string[] = []
  let created = 0
  let failed = 0

  for (const c of codes) {
    const toCreate: PromoCode = {
      ...c,
      id: c.id || '',
      code: (c.code || '').trim().toUpperCase(),
      createdAt: c.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    if (!toCreate.code) {
      failed += 1
      errors.push('Code vide ignoré')
      continue
    }

    const res = await savePromoCodeToSupabase(toCreate)
    if (res.success) {
      created += 1
    } else {
      failed += 1
      errors.push(`Échec création du code ${toCreate.code}`)
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('promo-codes-updated'))
  }

  return {
    success: failed === 0,
    created,
    failed,
    errors
  }
}

export async function updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<{ success: boolean; message: string }> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase non configuré. Impossible de mettre à jour le code promo.' }
  }
  
  try {
    const codes = await loadPromoCodesFromSupabase()
    const index = codes.findIndex(c => c.id === id)
    
    if (index === -1) {
      return { success: false, message: 'Code promo non trouvé' }
    }
    
    // Vérifier si le nouveau code existe déjà (si on change le code)
    if (updates.code && updates.code.trim()) {
      const newCode = updates.code.toLowerCase()
      if (newCode !== codes[index].code.toLowerCase()) {
        if (codes.some(c => c.id !== id && c.code.toLowerCase() === newCode)) {
          return { success: false, message: 'Ce code promo existe déjà' }
        }
      }
    }
    
    const updatedCode: PromoCode = {
      ...codes[index],
      ...updates,
      updatedAt: Date.now()
    }
    
    const result = await savePromoCodeToSupabase(updatedCode)
    if (result.success) {
      // Émettre l'événement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('promo-codes-updated'))
      }
      return { success: true, message: 'Code promo mis à jour avec succès' }
    } else {
      return { success: false, message: 'Erreur lors de la mise à jour du code promo' }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour dans Supabase:', error)
    return { success: false, message: 'Erreur lors de la mise à jour du code promo' }
  }
}

export async function deletePromoCode(id: string): Promise<boolean> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de supprimer le code promo.')
    return false
  }
  
  try {
    const deleted = await deletePromoCodeFromSupabase(id)
    if (deleted) {
      // Émettre l'événement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('promo-codes-updated'))
      }
    }
    return deleted
  } catch (error) {
    console.error('❌ Erreur lors de la suppression dans Supabase:', error)
    return false
  }
}

export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  // Essayer Supabase d'abord
  if (isSupabaseConfigured()) {
    try {
      const codes = await loadPromoCodesFromSupabase()
      const found = codes.find(c => c.code.toLowerCase() === code.toLowerCase())
      if (found) {
        return found
      }
    } catch (error) {
      console.error('Erreur lors de la recherche dans Supabase, fallback localStorage:', error)
    }
  }

  // Fallback localStorage
  const codes = loadPromoCodesSync()
  return codes.find(c => c.code.toLowerCase() === code.toLowerCase()) || null
}

// Version synchrone pour compatibilité
export function getPromoCodeByCodeSync(code: string): PromoCode | null {
  const codes = loadPromoCodesSync()
  return codes.find(c => c.code.toLowerCase() === code.toLowerCase()) || null
}

// ===== VALIDATION ET APPLICATION =====

export interface CartItemForPromo {
  id: string
  productId?: string
  category?: string
  gamme?: string
  conditionnement?: string
  prix: number
  quantite: number
}

export async function getPromoCodeUsageCountAsync(promoCodeId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    return await getPromoCodeUsageCountFromSupabase(promoCodeId)
  }
  return getPromoCodeUsageCount(promoCodeId)
}

export async function hasUserUsedPromoCode(promoCodeId: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    return await hasUserUsedPromoCodeInSupabase(promoCodeId, userId)
  }
  // Fallback localStorage
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '[]')
    return usage.some((u: any) => u.promoCodeId === promoCodeId && u.userId === userId)
  } catch {
    return false
  }
}

export async function recordPromoCodeUsageAsync(
  promoCodeId: string,
  userId: string,
  orderId: string | null,
  discountAmount: number
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    return await recordPromoCodeUsageToSupabase({ promoCodeId, userId, orderId, discountAmount })
  }

  // Fallback localStorage
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '[]')
    usage.push({
      promoCodeId,
      userId,
      orderId,
      discountAmount,
      usedAt: new Date().toISOString()
    })
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erreur localStorage' }
  }
}

/**
 * Valide un code promo pour un utilisateur et un panier donné
 */
export async function validatePromoCode(
  code: string,
  userId: string | null,
  cartItems: CartItemForPromo[],
  total: number
): Promise<PromoCodeValidation> {
  const promoCode = await getPromoCodeByCode(code)
  
  if (!promoCode) {
    return { valid: false, error: 'Code promo invalide' }
  }
  
  if (!promoCode.active) {
    return { valid: false, error: 'Ce code promo n\'est plus actif' }
  }
  
  // Vérifier les dates de validité
  const now = new Date()
  if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
    return { valid: false, error: 'Ce code promo n\'est pas encore valide' }
  }
  if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
    return { valid: false, error: 'Ce code promo a expiré' }
  }
  
  // Vérifier l'utilisateur autorisé
  if (promoCode.allowedUserIds && promoCode.allowedUserIds.length > 0) {
    if (!userId || !promoCode.allowedUserIds.includes(userId)) {
      return { valid: false, error: 'Ce code promo n\'est pas valable pour votre compte' }
    }
  }

  // Important: pour appliquer "1 fois par compte", il faut être connecté
  if (!userId) {
    return { valid: false, error: 'Vous devez être connecté pour utiliser un code promo' }
  }

  // Vérifier "1 utilisation par compte" (sauf si unlimitedPerUser est activé pour les sponsors)
  if (!promoCode.unlimitedPerUser) {
    const alreadyUsedByUser = await hasUserUsedPromoCode(promoCode.id, userId)
    if (alreadyUsedByUser) {
      return { valid: false, error: 'Vous avez déjà utilisé ce code promo avec votre compte' }
    }
  }
  
  // Vérifier le montant minimum
  if (promoCode.minPurchase && total < promoCode.minPurchase) {
    return { valid: false, error: `Montant minimum requis : ${promoCode.minPurchase}€` }
  }
  
  // Vérifier le nombre d'utilisations
  if (promoCode.maxUses) {
    // En mode Supabase, on s'appuie sur promo_codes.used_count (mis à jour via trigger)
    // car la table promo_code_usage est protégée par RLS (un client ne peut pas compter tous les users).
    const usageCount = isSupabaseConfigured()
      ? (promoCode.usedCount || 0)
      : await getPromoCodeUsageCountAsync(promoCode.id)
    if (usageCount >= promoCode.maxUses) {
      return { valid: false, error: 'Ce code promo a atteint sa limite d\'utilisations' }
    }
  }
  
  // Filtrer les articles éligibles
  // LOGIQUE SPÉCIALE POUR LES CONDITIONNEMENTS :
  // - Les conditionnements (1kg, 2.5kg, etc.) s'appliquent UNIQUEMENT aux bouillettes
  // - Les autres produits (huiles, popups, farines, etc.) ne sont PAS affectés par la restriction de conditionnement
  // - Si un conditionnement est sélectionné : 
  //   → Bouillettes : doivent avoir ce conditionnement
  //   → Autres produits : sont éligibles sans restriction
  
  const hasProductFilter = promoCode.allowedProductIds && promoCode.allowedProductIds.length > 0
  const hasCategoryFilter = promoCode.allowedCategories && promoCode.allowedCategories.length > 0
  const hasGammeFilter = promoCode.allowedGammes && promoCode.allowedGammes.length > 0
  const hasConditionnementFilter = promoCode.allowedConditionnements && promoCode.allowedConditionnements.length > 0
  
  // Fonction pour vérifier si un produit est une bouillette
  const isBouillette = (item: CartItemForPromo): boolean => {
    const category = item.category?.toLowerCase() || ''
    return category.includes('bouillette') || category.includes('boilies')
  }
  
  const eligibleItems = cartItems.filter(item => {
    // 1. Vérifier par ID produit (prioritaire - si défini, seuls ces produits sont éligibles)
    if (hasProductFilter) {
      if (!item.productId || !promoCode.allowedProductIds!.includes(item.productId)) {
        return false
      }
    }
    
    // 2. Vérifier par catégorie (si défini)
    if (hasCategoryFilter) {
      if (!item.category || !promoCode.allowedCategories!.some(cat => 
        item.category?.toLowerCase() === cat.toLowerCase()
      )) {
        return false
      }
    }
    
    // 3. Vérifier par gamme (si défini)
    if (hasGammeFilter) {
      if (!item.gamme || !promoCode.allowedGammes!.some(gamme => 
        item.gamme?.toLowerCase() === gamme.toLowerCase()
      )) {
        return false
      }
    }
    
    // 4. Vérifier par conditionnement (UNIQUEMENT pour les bouillettes)
    if (hasConditionnementFilter) {
      // Si c'est une bouillette, elle doit avoir le bon conditionnement
      if (isBouillette(item)) {
        if (!item.conditionnement || !promoCode.allowedConditionnements!.some(cond => 
          item.conditionnement?.toLowerCase() === cond.toLowerCase()
        )) {
          return false // Bouillette avec mauvais conditionnement → exclue
        }
      }
      // Si ce n'est PAS une bouillette, le conditionnement ne s'applique pas → éligible
    }
    
    return true
  })
  
  if (eligibleItems.length === 0) {
    return { valid: false, error: 'Ce code promo ne s\'applique pas aux articles de votre panier' }
  }
  
  // Calculer la réduction pour chaque article éligible
  const appliedItems = eligibleItems.map(item => {
    let discount = 0
    const itemTotal = item.prix * item.quantite
    
    if (promoCode.discountType === 'percentage') {
      discount = (itemTotal * promoCode.discountValue) / 100
    } else {
      discount = Math.min(promoCode.discountValue, itemTotal)
    }
    
    return {
      itemId: item.id,
      discount
    }
  })
  
  const totalDiscount = appliedItems.reduce((sum, item) => sum + item.discount, 0)
  
  return { 
    valid: true, 
    discount: totalDiscount,
    appliedItems
  }
}

/**
 * Enregistre l'utilisation d'un code promo
 */
export function recordPromoCodeUsage(promoCodeId: string, userId: string | null, orderId: string, discountAmount: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '[]')
    usage.push({
      promoCodeId,
      userId,
      orderId,
      discountAmount,
      usedAt: new Date().toISOString()
    })
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage))
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'utilisation:', error)
  }
}

/**
 * Compte le nombre d'utilisations d'un code promo
 */
export function getPromoCodeUsageCount(promoCodeId: string): number {
  if (typeof window === 'undefined') return 0
  
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '[]')
    return usage.filter((u: any) => u.promoCodeId === promoCodeId).length
  } catch {
    return 0
  }
}

/**
 * Obtient toutes les utilisations d'un code promo
 */
export function getPromoCodeUsage(promoCodeId: string): Array<{ userId: string | null; orderId: string; discountAmount: number; usedAt: string }> {
  if (typeof window === 'undefined') return []
  
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '[]')
    return usage.filter((u: any) => u.promoCodeId === promoCodeId)
  } catch {
    return []
  }
}

/**
 * Récupère tous les codes promo utilisés par un utilisateur
 */
export async function getUserPromoCodes(userId: string): Promise<Array<{ code: PromoCode; orderId: string; discountAmount: number; usedAt: string }>> {
  if (typeof window === 'undefined') return []
  
  try {
    const usage = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '[]')
    const userUsage = usage.filter((u: any) => u.userId === userId)
    
    const codes = await loadPromoCodes()
    return userUsage.map((u: any) => {
      const code = codes.find((c: PromoCode) => c.id === u.promoCodeId)
      return {
        code: code!,
        orderId: u.orderId,
        discountAmount: u.discountAmount,
        usedAt: u.usedAt
      }
    }).filter((item: any) => item.code) // Filtrer les codes qui n'existent plus
  } catch {
    return []
  }
}

// ===== ÉVÉNEMENTS =====

export function onPromoCodesUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = () => callback()
  window.addEventListener('promo-codes-updated', handler)
  return () => window.removeEventListener('promo-codes-updated', handler)
}
