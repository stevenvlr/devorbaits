// Fonctions d'accès Supabase pour popup-variables-manager
import { loadPopupVariablesFromSupabase, savePopupVariablesToSupabase } from './popup-variables-supabase'
import type { Couleur } from './popup-variables-supabase'

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

