// Fonctions d'accès Supabase pour popup-variables-manager
import {
  loadPopupVariablesFromSupabase,
  savePopupVariablesToSupabase,
  loadPopupVariableItemsFromSupabase,
  savePopupVariableItemsToSupabase
} from './popup-variables-supabase'
import type { Couleur, PopupVariableItem } from './popup-variables-supabase'

/**
 * Charger une variable popup depuis Supabase
 */
export async function loadPopupVariable(category: string, defaultValue: string[]): Promise<string[]> {
  try {
    const result = await loadPopupVariablesFromSupabase(category)
    if (Array.isArray(result) && result.length > 0) {
      // Vérifier si c'est un tableau de strings
      if (typeof result[0] === 'string') {
        return result as string[]
      }
    }
    return defaultValue
  } catch (error) {
    console.error(`Erreur lors du chargement de la variable ${category}:`, error)
    return defaultValue
  }
}

/**
 * Sauvegarder une variable popup dans Supabase
 */
export async function savePopupVariable(category: string, values: string[]): Promise<void> {
  const success = await savePopupVariablesToSupabase(category, values)
  if (!success) {
    throw new Error(`Échec de la sauvegarde de la variable ${category}`)
  }
}

/**
 * Charger des couleurs popup depuis Supabase
 */
export async function loadPopupCouleurs(category: string, defaultValue: Couleur[]): Promise<Couleur[]> {
  try {
    const result = await loadPopupVariablesFromSupabase(category)
    if (Array.isArray(result) && result.length > 0) {
      // Vérifier si c'est un tableau de Couleur
      if (typeof result[0] === 'object' && result[0] !== null && 'name' in result[0]) {
        return result as Couleur[]
      }
    }
    return defaultValue
  } catch (error) {
    console.error(`Erreur lors du chargement des couleurs ${category}:`, error)
    return defaultValue
  }
}

/**
 * Sauvegarder des couleurs popup dans Supabase
 */
export async function savePopupCouleurs(category: string, couleurs: Couleur[]): Promise<void> {
  const success = await savePopupVariablesToSupabase(category, couleurs)
  if (!success) {
    throw new Error(`Échec de la sauvegarde des couleurs ${category}`)
  }
}

/**
 * Charger une variable popup (items) depuis Supabase
 */
export async function loadPopupItems(category: string): Promise<PopupVariableItem[]> {
  return await loadPopupVariableItemsFromSupabase(category)
}

/**
 * Sauvegarder une variable popup (items) dans Supabase
 */
export async function savePopupItems(category: string, items: PopupVariableItem[]): Promise<void> {
  const success = await savePopupVariableItemsToSupabase(category, items)
  if (!success) {
    throw new Error(`Échec de la sauvegarde des items ${category}`)
  }
}

/**
 * Charger un objet Record<string, string> depuis Supabase
 * Les données sont stockées comme un JSON stringifié dans une seule entrée
 */
export async function loadPopupRecord(category: string): Promise<Record<string, string>> {
  try {
    const result = await loadPopupVariablesFromSupabase(category)
    if (Array.isArray(result) && result.length > 0) {
      // Le premier élément est le JSON stringifié
      if (typeof result[0] === 'string') {
        try {
          const parsed = JSON.parse(result[0])
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed as Record<string, string>
          }
        } catch {
          // Pas un JSON valide
        }
      }
    }
    return {}
  } catch (error) {
    console.error(`Erreur lors du chargement du record ${category}:`, error)
    return {}
  }
}

/**
 * Sauvegarder un objet Record<string, string> dans Supabase
 * Les données sont stockées comme un JSON stringifié dans une seule entrée
 */
export async function savePopupRecord(category: string, record: Record<string, string>): Promise<void> {
  const jsonString = JSON.stringify(record)
  const success = await savePopupVariablesToSupabase(category, [jsonString])
  if (!success) {
    throw new Error(`Échec de la sauvegarde du record ${category}`)
  }
}
