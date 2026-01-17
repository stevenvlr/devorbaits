// Configuration et client Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getPublicEnv(): Record<string, string | undefined> {
  // Next.js remplace les variables NEXT_PUBLIC_* au build.
  // Selon l'environnement (Cloudflare/Pages), `process` peut être absent : on garde un fallback sûr.
  const env =
    (typeof process !== 'undefined' ? process.env : undefined) ??
    (typeof globalThis !== 'undefined' ? (globalThis as any).process?.env : undefined)

  return (env || {}) as Record<string, string | undefined>
}

/**
 * Vérifie si Supabase est configuré (variables d'environnement présentes)
 */
export function isSupabaseConfigured(): boolean {
  const env = getPublicEnv()
  return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
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
    const env = getPublicEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}


