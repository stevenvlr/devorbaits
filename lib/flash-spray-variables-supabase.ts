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
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/flash-spray-variables-supabase.ts:16',message:'loadFlashSprayVariablesFromSupabase entry',data:{category,isSupabaseConfigured:isSupabaseConfigured()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
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
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/flash-spray-variables-supabase.ts:30',message:'querying popup_variables for flash/spray',data:{category},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
    }
    // #endregion
    const { data, error } = await supabase
      .from('popup_variables')
      .select('value')
      .eq('category', category)
      .order('value', { ascending: true })

    if (error) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/flash-spray-variables-supabase.ts:40',message:'flash/spray query error',data:{category,errorCode:error.code,errorMessage:error.message,errorDetails:error.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
      }
      // #endregion
      console.error('Erreur lors du chargement des variables:', error)
      return []
    }

    if (!data) return []

    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/flash-spray-variables-supabase.ts:50',message:'flash/spray query success',data:{category,itemsCount:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
    }
    // #endregion
    return data.map(item => item.value)
  } catch (error: any) {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/flash-spray-variables-supabase.ts:57',message:'loadFlashSprayVariablesFromSupabase catch error',data:{category,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
    }
    // #endregion
    console.error('Erreur lors du chargement des variables:', error)
    return []
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
