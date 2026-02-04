/**
 * Client Supabase admin (service role) — usage serveur uniquement.
 * À utiliser uniquement dans Server Components, API Routes ou Server Actions.
 */
import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getEnvError(): string | null {
  if (!SUPABASE_URL || typeof SUPABASE_URL !== 'string' || !SUPABASE_URL.trim()) {
    return 'SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) manquant ou vide'
  }
  if (!SUPABASE_SERVICE_ROLE_KEY || typeof SUPABASE_SERVICE_ROLE_KEY !== 'string' || !SUPABASE_SERVICE_ROLE_KEY.trim()) {
    return 'SUPABASE_SERVICE_ROLE_KEY manquant ou vide'
  }
  return null
}

/**
 * Crée un client Supabase avec la clé service role (accès admin).
 * À n'utiliser que côté serveur (API routes, Server Components, Server Actions).
 * @throws Error si les variables d'environnement sont absentes
 */
export function createSupabaseAdmin(): SupabaseClient {
  const err = getEnvError()
  if (err) {
    throw new Error(`Configuration Supabase admin manquante: ${err}`)
  }
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}
