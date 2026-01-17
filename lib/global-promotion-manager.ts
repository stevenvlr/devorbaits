// Gestion de la promotion globale
import { 
  loadGlobalPromotionFromSupabase, 
  loadAllGlobalPromotionsFromSupabase,
  saveGlobalPromotionToSupabase,
  deleteGlobalPromotionFromSupabase,
  type GlobalPromotion 
} from './global-promotion-supabase'
import { isSupabaseConfigured } from './supabase'

// Ré-export du type pour les imports côté UI
export type { GlobalPromotion } from './global-promotion-supabase'

/**
 * Charge la promotion globale active
 */
export async function loadGlobalPromotion(): Promise<GlobalPromotion | null> {
  if (!isSupabaseConfigured()) {
    return null
  }
  
  try {
    return await loadGlobalPromotionFromSupabase()
  } catch (error) {
    console.error('Erreur lors du chargement de la promotion globale:', error)
    return null
  }
}

/**
 * Charge toutes les promotions (pour l'admin)
 */
export async function loadAllGlobalPromotions(): Promise<GlobalPromotion[]> {
  if (!isSupabaseConfigured()) {
    return []
  }
  
  try {
    return await loadAllGlobalPromotionsFromSupabase()
  } catch (error) {
    console.error('Erreur lors du chargement des promotions:', error)
    return []
  }
}

/**
 * Sauvegarde une promotion globale
 */
export async function saveGlobalPromotion(promotion: GlobalPromotion): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase non configuré' }
  }
  
  try {
    const result = await saveGlobalPromotionToSupabase(promotion)
    if (result.success) {
      // Émettre un événement pour mettre à jour les composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('global-promotion-updated'))
      }
      return { success: true, message: 'Promotion sauvegardée avec succès' }
    } else {
      return { success: false, message: 'Erreur lors de la sauvegarde' }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la promotion:', error)
    return { success: false, message: 'Erreur lors de la sauvegarde' }
  }
}

/**
 * Supprime une promotion globale
 */
export async function deleteGlobalPromotion(promotionId: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase non configuré' }
  }
  
  try {
    const deleted = await deleteGlobalPromotionFromSupabase(promotionId)
    if (deleted) {
      // Émettre un événement pour mettre à jour les composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('global-promotion-updated'))
      }
      return { success: true, message: 'Promotion supprimée avec succès' }
    } else {
      return { success: false, message: 'Erreur lors de la suppression' }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error)
    return { success: false, message: 'Erreur lors de la suppression' }
  }
}

/**
 * Vérifie si un produit est éligible à la promotion
 */
export function isProductEligibleForPromotion(
  promotion: GlobalPromotion | null,
  productCategory?: string,
  productGamme?: string
): boolean {
  if (!promotion || !promotion.active) {
    return false
  }

  // Si la promotion s'applique à tout le site
  if (promotion.applyToAll) {
    return true
  }

  // Si applyToAll est false, il faut au moins un filtre qui correspond
  let categoryMatch = true
  let gammeMatch = true

  // Vérifier les catégories
  if (promotion.allowedCategories && promotion.allowedCategories.length > 0) {
    categoryMatch = !!productCategory && promotion.allowedCategories.some(cat => 
      productCategory.toLowerCase() === cat.toLowerCase()
    )
  } else {
    // Si aucune catégorie n'est spécifiée et qu'on n'applique pas à tout, on ignore ce filtre
    categoryMatch = true
  }

  // Vérifier les gammes
  if (promotion.allowedGammes && promotion.allowedGammes.length > 0) {
    gammeMatch = !!productGamme && promotion.allowedGammes.some(g => 
      productGamme.toLowerCase() === g.toLowerCase()
    )
  } else {
    // Si aucune gamme n'est spécifiée et qu'on n'applique pas à tout, on ignore ce filtre
    gammeMatch = true
  }

  // Si des filtres sont définis, au moins un doit correspondre
  const hasCategoryFilter = promotion.allowedCategories && promotion.allowedCategories.length > 0
  const hasGammeFilter = promotion.allowedGammes && promotion.allowedGammes.length > 0

  if (hasCategoryFilter && hasGammeFilter) {
    // Si les deux filtres sont définis, au moins un doit correspondre (OU logique)
    return categoryMatch || gammeMatch
  } else if (hasCategoryFilter) {
    return categoryMatch
  } else if (hasGammeFilter) {
    return gammeMatch
  }

  // Si aucun filtre n'est défini et applyToAll est false, ne pas appliquer la promotion
  return false
}

/**
 * Calcule le prix avec la promotion appliquée
 */
export function applyGlobalPromotion(
  price: number,
  promotion: GlobalPromotion | null,
  productCategory?: string,
  productGamme?: string
): number {
  if (!isProductEligibleForPromotion(promotion, productCategory, productGamme)) {
    return price
  }

  if (!promotion || promotion.discountPercentage <= 0) {
    return price
  }

  const discount = (price * promotion.discountPercentage) / 100
  return Math.max(0, price - discount)
}

/**
 * Écoute les mises à jour de la promotion
 */
export function onGlobalPromotionUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = () => callback()
  window.addEventListener('global-promotion-updated', handler)
  return () => window.removeEventListener('global-promotion-updated', handler)
}
