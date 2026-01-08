// Gestion des gammes dans Supabase
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

/**
 * Charge toutes les gammes depuis Supabase
 */
export async function loadGammesFromSupabase(): Promise<string[]> {
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
    const { data, error } = await supabase
      .from('gammes')
      .select('name')
      .order('name', { ascending: true })

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

    // Extraire les noms des gammes
    const gammes = data.map((row: any) => row.name).filter((name: string) => name && name.trim() !== '')
    
    console.log(`✅ ${gammes.length} gamme(s) chargée(s) depuis Supabase`)
    return gammes
  } catch (error: any) {
    console.error('❌ Erreur lors du chargement des gammes depuis Supabase:', error)
    return []
  }
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
        name: gamme.trim()
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
