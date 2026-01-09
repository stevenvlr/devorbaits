// Gestion des variables Pop-up avec Supabase uniquement
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface Couleur {
  name: string
  type: 'fluo' | 'pastel'
  value?: string
}

export interface PopupVariableItem {
  value: string
  metadata?: any
}

/**
 * Charger les variables d'une catégorie depuis Supabase
 */
export async function loadPopupVariablesFromSupabase(category: string): Promise<string[] | Couleur[]> {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/popup-variables-supabase.ts:13',message:'loadPopupVariablesFromSupabase entry',data:{category,isSupabaseConfigured:isSupabaseConfigured()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
  }
  // #endregion
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/popup-variables-supabase.ts:25',message:'querying popup_variables table',data:{category},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
    }
    // #endregion
    const { data, error } = await supabase
      .from('popup_variables')
      .select('value, metadata')
      .eq('category', category)
      .order('value', { ascending: true })

    if (error) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/popup-variables-supabase.ts:33',message:'popup_variables query error',data:{category,errorCode:error.code,errorMessage:error.message,errorDetails:error.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
      }
      // #endregion
      console.error('Erreur lors du chargement des variables:', error)
      return []
    }

    if (!data) return []

    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/popup-variables-supabase.ts:42',message:'popup_variables query success',data:{category,itemsCount:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
    }
    // #endregion

    // Si c'est une catégorie de couleurs, retourner des objets Couleur
    if (category.includes('couleurs')) {
      return data.map(item => ({
        name: item.value,
        type: item.metadata?.type || (category.includes('fluo') ? 'fluo' : 'pastel'),
        value: item.metadata?.value
      })) as Couleur[]
    }

    // Sinon, retourner un tableau de strings
    return data.map(item => item.value)
  } catch (error: any) {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/popup-variables-supabase.ts:56',message:'loadPopupVariablesFromSupabase catch error',data:{category,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
    }
    // #endregion
    console.error('Erreur lors du chargement des variables:', error)
    return []
  }
}

/**
 * Charge les variables d'une catégorie depuis Supabase (valeur + metadata)
 * Utile quand on veut stocker des données additionnelles (ex: image) dans metadata.
 */
export async function loadPopupVariableItemsFromSupabase(category: string): Promise<PopupVariableItem[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('popup_variables')
      .select('value, metadata')
      .eq('category', category)
      .order('value', { ascending: true })

    if (error || !data) {
      console.error('Erreur lors du chargement des variables (items):', error)
      return []
    }

    return data.map((row: any) => ({
      value: row.value,
      metadata: row.metadata || undefined
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des variables (items):', error)
    return []
  }
}

/**
 * Sauvegarder les variables d'une catégorie dans Supabase
 */
export async function savePopupVariablesToSupabase(
  category: string,
  values: string[] | Couleur[]
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
    const items = values.map(value => {
      if (typeof value === 'string') {
        return {
          category,
          value,
          metadata: null
        }
      } else {
        // C'est un objet Couleur
        return {
          category,
          value: value.name,
          metadata: {
            type: value.type,
            value: value.value
          }
        }
      }
    })

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

/**
 * Sauvegarde une liste d'items (value + metadata) pour une catégorie.
 * Le contenu de metadata est stocké tel quel dans la colonne JSONB.
 */
export async function savePopupVariableItemsToSupabase(
  category: string,
  items: PopupVariableItem[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error: deleteError } = await supabase
      .from('popup_variables')
      .delete()
      .eq('category', category)

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciennes variables (items):', deleteError)
      // Continuer quand même pour tenter d'insérer
    }

    if (items.length === 0) return true

    const rows = items.map(item => ({
      category,
      value: item.value,
      metadata: item.metadata ?? null
    }))

    const { error: insertError } = await supabase
      .from('popup_variables')
      .insert(rows)

    if (insertError) {
      console.error('Erreur lors de l\'insertion des variables (items):', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des variables (items):', error)
    return false
  }
}
