// Gestion des gammes dans Supabase
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface GammeData {
  name: string
  hidden: boolean
}

/**
 * Charge toutes les gammes depuis Supabase (avec statut hidden)
 * @param includeHidden Si true, inclut aussi les gammes masquées (pour l'admin)
 */
export async function loadGammesFromSupabase(includeHidden: boolean = false): Promise<GammeData[]> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré, impossible de charger les gammes')
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.warn('⚠️ Impossible de créer le client Supabase')
    return []
  }

  try {
    let query = supabase
      .from('gammes')
      .select('name, hidden')
      .order('name', { ascending: true })

    // Si on ne veut pas les gammes masquées, filtrer
    // On inclut les gammes avec hidden = false ou hidden = NULL (pour compatibilité)
    if (!includeHidden) {
      query = query.or('hidden.is.null,hidden.eq.false')
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur lors du chargement des gammes depuis Supabase:', error)
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Aucune gamme trouvée dans Supabase')
      return []
    }

    // Retourner les données avec le statut hidden
    const gammes = data.map((row: any) => ({
      name: row.name,
      hidden: row.hidden || false
    })).filter((gamme: GammeData) => gamme.name && gamme.name.trim() !== '')
    
    console.log(`✅ ${gammes.length} gamme(s) chargée(s) depuis Supabase`)
    return gammes
  } catch (error: any) {
    console.error('❌ Erreur lors du chargement des gammes depuis Supabase:', error)
    return []
  }
}

/**
 * Charge uniquement les noms des gammes (pour compatibilité)
 */
export async function loadGammesNamesFromSupabase(includeHidden: boolean = false): Promise<string[]> {
  const gammes = await loadGammesFromSupabase(includeHidden)
  return gammes.map(g => g.name)
}

/**
 * Ajoute une gamme dans Supabase
 */
export async function addGammeToSupabase(gamme: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible d\'ajouter la gamme.')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('❌ Impossible de créer le client Supabase')
    return false
  }

  try {
    // Vérifier d'abord que la table existe
    const { error: testError } = await supabase
      .from('gammes')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur d\'accès à la table gammes:', testError)
      console.error('💡 Vérifiez que la table "gammes" existe dans Supabase et que les politiques RLS sont correctement configurées')
      return false
    }

    const { error } = await supabase
      .from('gammes')
      .insert({
        name: gamme.trim(),
        hidden: false // Par défaut, visible
      })

    if (error) {
      // Si c'est une erreur de contrainte unique, la gamme existe déjà
      if (error.code === '23505') {
        console.warn(`⚠️ La gamme "${gamme}" existe déjà dans Supabase`)
        return false
      }
      
      console.error('❌ Erreur lors de l\'ajout de la gamme dans Supabase:', error)
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }

    console.log(`✅ Gamme "${gamme}" ajoutée dans Supabase`)
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'ajout de la gamme dans Supabase:', error)
    return false
  }
}

/**
 * Supprime une gamme de Supabase
 */
export async function deleteGammeFromSupabase(gamme: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de supprimer la gamme.')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('❌ Impossible de créer le client Supabase')
    return false
  }

  try {
    const { error } = await supabase
      .from('gammes')
      .delete()
      .eq('name', gamme.trim())

    if (error) {
      console.error('❌ Erreur lors de la suppression de la gamme dans Supabase:', error)
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }

    console.log(`✅ Gamme "${gamme}" supprimée de Supabase`)
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression de la gamme dans Supabase:', error)
    return false
  }
}

/**
 * Bascule le statut hidden d'une gamme
 */
export async function toggleGammeHidden(gamme: string, hidden: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de modifier le statut de la gamme.')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('❌ Impossible de créer le client Supabase')
    return false
  }

  try {
    const { error } = await supabase
      .from('gammes')
      .update({ hidden })
      .eq('name', gamme.trim())

    if (error) {
      console.error('❌ Erreur lors de la mise à jour du statut de la gamme dans Supabase:', error)
      console.error('Détails:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }

    console.log(`✅ Statut de la gamme "${gamme}" mis à jour (hidden: ${hidden})`)
    return true
  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour du statut de la gamme dans Supabase:', error)
    return false
  }
}
