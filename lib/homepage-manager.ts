// Gestion globale (Supabase) + cache local
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

const STORAGE_KEY = 'site-homepage-image' // cache navigateur (fallback/perf)
const HOMEPAGE_IMAGE_CATEGORY = 'homepage-image' // stocké dans Supabase (table popup_variables)

let homepageImageCache: string | null | undefined = undefined // undefined = pas encore chargé
let homepageImageCacheFetchedAt = 0
const HOMEPAGE_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

async function loadHomepageImageFromSupabase(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('popup_variables')
      .select('value')
      .eq('category', HOMEPAGE_IMAGE_CATEGORY)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data.value || null
  } catch (e) {
    console.error('Erreur lors du chargement de la photo d’accueil (Supabase):', e)
    return null
  }
}

async function saveHomepageImageToSupabase(imageUrl: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // 1) Tenter UPDATE (si la ligne existe déjà)
    const { data: updated, error: updateError } = await supabase
      .from('popup_variables')
      .update({ value: imageUrl })
      .eq('category', HOMEPAGE_IMAGE_CATEGORY)
      .select('id')

    if (updateError) return false
    if (Array.isArray(updated) && updated.length > 0) return true

    // 2) Sinon INSERT
    const { error: insertError } = await supabase
      .from('popup_variables')
      .insert({ category: HOMEPAGE_IMAGE_CATEGORY, value: imageUrl, metadata: null })

    return !insertError
  } catch (e) {
    console.error('Erreur lors de la sauvegarde de la photo d’accueil (Supabase):', e)
    return false
  }
}

async function removeHomepageImageFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('popup_variables')
      .delete()
      .eq('category', HOMEPAGE_IMAGE_CATEGORY)
    return !error
  } catch (e) {
    console.error('Erreur lors de la suppression de la photo d’accueil (Supabase):', e)
    return false
  }
}

/**
 * Charge la photo d'accueil globale.
 * - Si Supabase est configuré : lit depuis Supabase (global) et met en cache
 * - Sinon : fallback sur localStorage (ancien mode)
 */
export async function loadHomepageImage(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (homepageImageCache !== undefined && Date.now() - homepageImageCacheFetchedAt < HOMEPAGE_CACHE_TTL_MS) {
    return homepageImageCache
  }

  // Mode global (recommandé)
  if (isSupabaseConfigured()) {
    const url = await loadHomepageImageFromSupabase()
    homepageImageCache = url
    homepageImageCacheFetchedAt = Date.now()
    try {
      if (url) localStorage.setItem(STORAGE_KEY, url)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore cache errors
    }
    return url
  }

  // Fallback local (ancien comportement)
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    homepageImageCache = saved || null
    homepageImageCacheFetchedAt = Date.now()
    return homepageImageCache
  } catch (error) {
    console.error("Erreur lors du chargement de l'image d'accueil:", error)
    return null
  }
}

/**
 * Sauvegarde la photo d'accueil (global dans Supabase si configuré).
 */
export async function saveHomepageImage(imageUrl: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // IMPORTANT: mode "global" → si Supabase n'est pas configuré, on ne peut pas considérer ça comme un succès
  let success = false
  if (isSupabaseConfigured()) {
    success = await saveHomepageImageToSupabase(imageUrl)
  } else {
    console.error('❌ Supabase non configuré: impossible de sauvegarder la photo d’accueil en global')
  }

  if (success) {
    homepageImageCache = imageUrl
    homepageImageCacheFetchedAt = Date.now()
  }

  try {
    localStorage.setItem(STORAGE_KEY, imageUrl)
  } catch {
    // ignore cache errors
  }

  window.dispatchEvent(new CustomEvent('homepage-image-updated'))
  return success
}

/**
 * Supprime la photo d'accueil personnalisée (retour au fichier par défaut).
 */
export async function removeHomepageImage(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  let success = false
  if (isSupabaseConfigured()) {
    success = await removeHomepageImageFromSupabase()
  } else {
    console.error('❌ Supabase non configuré: impossible de réinitialiser la photo d’accueil en global')
  }

  if (success) {
    homepageImageCache = null
    homepageImageCacheFetchedAt = Date.now()
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore cache errors
  }

  window.dispatchEvent(new CustomEvent('homepage-image-updated'))
  return success
}

export function onHomepageImageUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = () => callback()
  window.addEventListener('homepage-image-updated', handler)

  // Cache local : si le cache change dans un autre onglet, on re-render
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) callback()
  })

  return () => {
    window.removeEventListener('homepage-image-updated', handler)
  }
}
