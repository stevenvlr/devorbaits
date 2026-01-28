// Gestion des moyens de paiement avec Supabase
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface PaymentMethod {
  id: string
  method: 'paypal' | 'card'
  enabled: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Charger tous les moyens de paiement depuis Supabase
 */
export async function loadPaymentMethods(): Promise<PaymentMethod[]> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('method', { ascending: true })

    if (error) {
      console.error('Erreur lors du chargement des moyens de paiement:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      method: row.method as 'paypal' | 'card',
      enabled: row.enabled ?? true,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  } catch (error: any) {
    console.error('Erreur lors du chargement des moyens de paiement:', error)
    return []
  }
}

/**
 * Vérifier si un moyen de paiement est activé
 */
export async function isPaymentMethodEnabled(method: 'paypal' | 'card'): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Par défaut, activé si Supabase n'est pas configuré
    return true
  }

  const supabase = getSupabaseClient()
  if (!supabase) return true

  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('enabled')
      .eq('method', method)
      .single()

    if (error || !data) {
      console.warn(`⚠️ Impossible de vérifier le statut de ${method}, considéré comme activé par défaut`)
      return true
    }

    return data.enabled ?? true
  } catch (error: any) {
    console.error(`Erreur lors de la vérification de ${method}:`, error)
    return true
  }
}

/**
 * Mettre à jour l'état d'un moyen de paiement
 */
export async function updatePaymentMethodEnabled(
  method: 'paypal' | 'card',
  enabled: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré')
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('payment_methods')
      .upsert({
        method,
        enabled,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'method'
      })

    if (error) {
      console.error('Erreur lors de la mise à jour du moyen de paiement:', error)
      return false
    }

    console.log(`✅ Moyen de paiement "${method}" mis à jour (enabled: ${enabled})`)
    return true
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du moyen de paiement:', error)
    return false
  }
}

/**
 * Charger les états des moyens de paiement (pour le checkout côté client)
 * Retourne un objet avec les états
 */
export async function loadPaymentMethodsStatus(): Promise<{ paypal: boolean; card: boolean }> {
  const methods = await loadPaymentMethods()
  const status: { paypal: boolean; card: boolean } = {
    paypal: true, // Par défaut activé
    card: true    // Par défaut activé
  }

  methods.forEach(method => {
    if (method.method === 'paypal') {
      status.paypal = method.enabled
    } else if (method.method === 'card') {
      status.card = method.enabled
    }
  })

  return status
}
