// Analytics (page views) avec Supabase
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  const key = 'analytics_session_id'
  let sessionId = localStorage.getItem(key)
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(key, sessionId)
  }
  return sessionId
}

export async function trackPageView(pagePath: string, userId?: string | null): Promise<void> {
  if (!pagePath) return
  if (!isSupabaseConfigured()) return

  const supabase = getSupabaseClient()
  if (!supabase) return

  try {
    const sessionId = getOrCreateSessionId()

    // La table page_views accepte l'insert (RLS) selon le schema
    const { error } = await supabase.from('page_views').insert({
      page_path: pagePath,
      user_id: userId || null,
      session_id: sessionId
    })

    if (error) {
      // Ne pas casser le site si les analytics échouent
      console.warn('⚠️ Impossible d’enregistrer la visite:', error.message)
    }
  } catch (e: any) {
    console.warn('⚠️ Erreur tracking visite:', e?.message || e)
  }
}

export async function getPageViewsCount(params?: { startDate?: string; endDate?: string }): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const supabase = getSupabaseClient()
  if (!supabase) return 0

  try {
    let query = supabase.from('page_views').select('id', { count: 'exact', head: true })

    if (params?.startDate) {
      query = query.gte('created_at', params.startDate)
    }
    if (params?.endDate) {
      query = query.lte('created_at', params.endDate)
    }

    const { count, error } = await query
    if (error) {
      console.warn('⚠️ Impossible de lire les visites:', error.message)
      return 0
    }
    return count || 0
  } catch (e: any) {
    console.warn('⚠️ Erreur lecture visites:', e?.message || e)
    return 0
  }
}

/**
 * Compte les visites uniques sur une période.
 * Ici, une "visite" = une session (session_id) unique.
 *
 * Note: on récupère les session_id (paginés) puis on déduplique en JS.
 * C’est simple et compatible avec Supabase/PostgREST sans fonction SQL côté serveur.
 */
export async function getUniqueVisitsCount(params?: { startDate?: string; endDate?: string }): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const supabase = getSupabaseClient()
  if (!supabase) return 0

  const uniqueSessions = new Set<string>()
  const pageSize = 10_000

  try {
    for (let from = 0; ; from += pageSize) {
      let query = supabase
        .from('page_views')
        .select('session_id')
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1)

      if (params?.startDate) {
        query = query.gte('created_at', params.startDate)
      }
      if (params?.endDate) {
        query = query.lte('created_at', params.endDate)
      }

      const { data, error } = await query
      if (error) {
        console.warn('⚠️ Impossible de lire les visites uniques:', error.message)
        return 0
      }

      if (!data || data.length === 0) break
      for (const row of data as Array<{ session_id: string }>) {
        if (row?.session_id) uniqueSessions.add(row.session_id)
      }

      if (data.length < pageSize) break
    }

    return uniqueSessions.size
  } catch (e: any) {
    console.warn('⚠️ Erreur lecture visites uniques:', e?.message || e)
    return 0
  }
}

