// Configuration et client Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

// IMPORTANT :
// On référence DIRECTEMENT process.env.NEXT_PUBLIC_* pour que Next.js injecte les valeurs au build.
// Si on passe par un objet (ex: const env = process.env), Next peut ne pas remplacer les valeurs,
// et on obtient "Supabase non configuré" en production.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Vérifie si Supabase est configuré (variables d'environnement présentes)
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

/**
 * Obtient le client Supabase (singleton)
 * Retourne null si Supabase n'est pas configuré
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  // Créer le client une seule fois (singleton)
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  }

  return supabaseClient
}


