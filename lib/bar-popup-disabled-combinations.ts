// Gestion des combinaisons taille/couleur désactivées pour le bar à pop-up
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface DisabledCombination {
  id: string
  couleur_name: string
  taille: string
  created_at?: string
  updated_at?: string
}

/**
 * Charge toutes les combinaisons désactivées depuis Supabase
 */
export async function loadDisabledCombinations(): Promise<DisabledCombination[]> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré, impossible de charger les combinaisons désactivées')
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.warn('⚠️ Impossible de créer le client Supabase')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('bar_popup_disabled_combinations')
      .select('*')
      .order('couleur_name', { ascending: true })
      .order('taille', { ascending: true })

    if (error) {
      console.error('❌ Erreur lors du chargement des combinaisons désactivées:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((row: any) => ({
      id: row.id,
      couleur_name: row.couleur_name,
      taille: row.taille,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  } catch (error: any) {
    console.error('❌ Erreur lors du chargement des combinaisons désactivées:', error)
    return []
  }
}

/**
 * Vérifie si une combinaison taille/couleur est désactivée
 */
export async function isCombinationDisabled(couleurName: string, taille: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('bar_popup_disabled_combinations')
      .select('id')
      .eq('couleur_name', couleurName)
      .eq('taille', taille)
      .limit(1)

    if (error) {
      console.error('❌ Erreur lors de la vérification de la combinaison:', error)
      return false
    }

    return data && data.length > 0
  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification de la combinaison:', error)
    return false
  }
}

/**
 * Charge toutes les combinaisons désactivées et retourne un Set pour un accès rapide
 */
export async function loadDisabledCombinationsSet(): Promise<Set<string>> {
  const combinations = await loadDisabledCombinations()
  const set = new Set<string>()
  combinations.forEach(combo => {
    set.add(`${combo.couleur_name}|${combo.taille}`)
  })
  return set
}

/**
 * Ajoute une combinaison désactivée
 */
export async function addDisabledCombination(couleurName: string, taille: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible d\'ajouter la combinaison désactivée.')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('❌ Impossible de créer le client Supabase')
    return false
  }

  try {
    const { error } = await supabase
      .from('bar_popup_disabled_combinations')
      .insert({
        couleur_name: couleurName.trim(),
        taille: taille.trim()
      })

    if (error) {
      // Si c'est une erreur de contrainte unique, la combinaison existe déjà
      if (error.code === '23505') {
        console.warn(`⚠️ La combinaison "${couleurName}" / "${taille}" existe déjà`)
        return false
      }
      
      console.error('❌ Erreur lors de l\'ajout de la combinaison désactivée:', error)
      return false
    }

    console.log(`✅ Combinaison désactivée "${couleurName}" / "${taille}" ajoutée`)
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'ajout de la combinaison désactivée:', error)
    return false
  }
}

/**
 * Supprime une combinaison désactivée
 */
export async function removeDisabledCombination(couleurName: string, taille: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de supprimer la combinaison désactivée.')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('❌ Impossible de créer le client Supabase')
    return false
  }

  try {
    const { error } = await supabase
      .from('bar_popup_disabled_combinations')
      .delete()
      .eq('couleur_name', couleurName.trim())
      .eq('taille', taille.trim())

    if (error) {
      console.error('❌ Erreur lors de la suppression de la combinaison désactivée:', error)
      return false
    }

    console.log(`✅ Combinaison désactivée "${couleurName}" / "${taille}" supprimée`)
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression de la combinaison désactivée:', error)
    return false
  }
}

/**
 * Supprime une combinaison désactivée par ID
 */
export async function removeDisabledCombinationById(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de supprimer la combinaison désactivée.')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('❌ Impossible de créer le client Supabase')
    return false
  }

  try {
    const { error } = await supabase
      .from('bar_popup_disabled_combinations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur lors de la suppression de la combinaison désactivée:', error)
      return false
    }

    console.log(`✅ Combinaison désactivée (ID: ${id}) supprimée`)
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression de la combinaison désactivée:', error)
    return false
  }
}
