// Gestion des variables Flash Boost et Spray Plus avec Supabase uniquement
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface FlashSprayVariable {
  category: 'flash-boost-aromes' | 'flash-boost-formats' | 'spray-plus-aromes' | 'spray-plus-formats'
  value: string
  metadata?: {
    price?: number
    description?: string
  }
}

/**
 * Charger les variables d'une catégorie depuis Supabase
 */
export async function loadFlashSprayVariablesFromSupabase(
  category: 'flash-boost-aromes' | 'flash-boost-formats' | 'spray-plus-aromes' | 'spray-plus-formats'
): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('popup_variables')
      .select('value')
      .eq('category', category)
      .order('value', { ascending: true })

    if (error) {
      console.error('Erreur lors du chargement des variables:', error)
      return []
    }

    if (!data) return []
    return data.map(item => item.value)
  } catch (error: any) {
    console.error('Erreur lors du chargement des variables:', error)
    return []
  }
}

/**
 * Sauvegarder les variables d'une catégorie dans Supabase
 */
/**
 * Charger l'image d'un type de produit (flash-boost ou spray-plus)
 */
export async function loadFlashSprayImageFromSupabase(
  type: 'flash-boost' | 'spray-plus'
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const category = `${type}-image`
    const { data, error } = await supabase
      .from('popup_variables')
      .select('value')
      .eq('category', category)
      .single()

    if (error || !data) {
      return null
    }

    return data.value || null
  } catch (error) {
    console.error(`Erreur lors du chargement de l'image ${type}:`, error)
    return null
  }
}

/**
 * Sauvegarder l'image d'un type de produit (flash-boost ou spray-plus)
 */
export async function saveFlashSprayImageToSupabase(
  type: 'flash-boost' | 'spray-plus',
  imageUrl: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const category = `${type}-image`
    
    // Vérifier d'abord si une entrée existe
    const { data: existing } = await supabase
      .from('popup_variables')
      .select('id')
      .eq('category', category)
      .maybeSingle()

    if (existing) {
      // Mettre à jour l'entrée existante
      const { error: updateError } = await supabase
        .from('popup_variables')
        .update({ value: imageUrl })
        .eq('category', category)

      if (updateError) {
        console.error(`❌ Erreur UPDATE image ${type}:`, updateError.message, updateError.details, updateError.hint)
        return false
      }
    } else {
      // Créer une nouvelle entrée
      const { error: insertError } = await supabase
        .from('popup_variables')
        .insert({
          category,
          value: imageUrl,
          metadata: null
        })

      if (insertError) {
        console.error(`❌ Erreur INSERT image ${type}:`, insertError.message, insertError.details, insertError.hint)
        return false
      }
    }

    console.log(`✅ Image ${type} sauvegardée avec succès`)
    return true
  } catch (error: any) {
    console.error(`❌ Erreur lors de la sauvegarde de l'image ${type}:`, error?.message || error)
    return false
  }
}

/**
 * Sauvegarder les variables d'une catégorie dans Supabase
 */
export async function saveFlashSprayVariablesToSupabase(
  category: 'flash-boost-aromes' | 'flash-boost-formats' | 'spray-plus-aromes' | 'spray-plus-formats',
  values: string[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Supprimer les anciennes valeurs pour cette catégorie
    const { error: deleteError } = await supabase
      .from('popup_variables')
      .delete()
      .eq('category', category)

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciennes variables:', deleteError)
    }

    // Insérer les nouvelles valeurs
    const items = values.map(value => ({
      category,
      value,
      metadata: null
    }))

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from('popup_variables')
        .insert(items)

      if (insertError) {
        console.error('Erreur lors de l\'insertion des variables:', insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des variables:', error)
    return false
  }
}
