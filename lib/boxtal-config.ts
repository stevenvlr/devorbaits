// Gestion de la configuration Boxtal depuis Supabase
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface BoxtalConfig {
  id: string
  api_key: string
  api_secret: string
  verification_key?: string
  environment: 'test' | 'production'
  shipping_offer_code?: string
  from_first_name?: string
  from_last_name?: string
  from_email?: string
  from_phone?: string
  from_street?: string
  from_city?: string
  from_postal_code?: string
  from_country?: string
  created_at?: string
  updated_at?: string
}

/**
 * Récupère la configuration Boxtal depuis Supabase
 */
export async function getBoxtalConfig(): Promise<BoxtalConfig | null> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return null
  }

  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('boxtal_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération de la config Boxtal:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération de la config Boxtal:', error)
    return null
  }
}

/**
 * Sauvegarde la configuration Boxtal dans Supabase
 */
export async function saveBoxtalConfig(config: Partial<BoxtalConfig>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Vérifier s'il existe déjà une configuration
    const { data: existing } = await supabase
      .from('boxtal_config')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Mettre à jour la configuration existante
      const { error } = await supabase
        .from('boxtal_config')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Erreur lors de la mise à jour de la config Boxtal:', error)
        return false
      }
    } else {
      // Créer une nouvelle configuration
      const { error } = await supabase
        .from('boxtal_config')
        .insert([{
          ...config,
          environment: config.environment || 'test'
        }])

      if (error) {
        console.error('Erreur lors de la création de la config Boxtal:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la config Boxtal:', error)
    return false
  }
}




