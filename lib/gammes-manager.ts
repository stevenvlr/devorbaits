// Système de gestion dynamique des gammes - Supabase uniquement

import { 
  loadGammesNamesFromSupabase, 
  addGammeToSupabase, 
  deleteGammeFromSupabase,
  toggleGammeHidden,
  loadGammesFromSupabase,
  type GammeData
} from './gammes-supabase'

// Exporter GammeData pour utilisation dans les composants
export type { GammeData }
import { isSupabaseConfigured } from './supabase'

// Gammes par défaut (utilisées si Supabase n'est pas configuré)
const DEFAULT_GAMMES = [
  'Méga Tutti',
  'Krill Calamar',
  'Red Devil',
  'Robin Red Vers de vase',
  'Mure Cassis',
  'Thon Curry'
]

/**
 * Charge les gammes visibles pour les clients (exclut les gammes masquées)
 */
export async function loadGammes(): Promise<string[]> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré, retour des gammes par défaut')
    return DEFAULT_GAMMES
  }
  
  try {
    // Charger uniquement les gammes visibles (includeHidden = false)
    // Ne pas fusionner avec DEFAULT_GAMMES car Supabase est la source de vérité
    // Si une gamme est masquée dans Supabase, elle ne doit pas apparaître même si elle est dans DEFAULT_GAMMES
    const gammes = await loadGammesNamesFromSupabase(false)
    // S'assurer que gammes est un tableau
    const gammesArray = Array.isArray(gammes) ? gammes : []
    
    // Si aucune gamme n'est trouvée dans Supabase, utiliser les gammes par défaut comme fallback
    if (gammesArray.length === 0) {
      console.warn('⚠️ Aucune gamme visible trouvée dans Supabase, utilisation des gammes par défaut')
      return DEFAULT_GAMMES
    }
    
    return gammesArray.sort() // Trier pour un affichage cohérent
  } catch (error) {
    console.error('Erreur lors du chargement des gammes:', error)
    // En cas d'erreur, retourner les gammes par défaut comme fallback
    return DEFAULT_GAMMES
  }
}

/**
 * Charge toutes les gammes (y compris masquées) pour l'admin
 */
export async function loadGammesForAdmin(): Promise<GammeData[]> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase non configuré, retour des gammes par défaut')
    return DEFAULT_GAMMES.map(name => ({ name, hidden: false }))
  }
  
  try {
    // Charger toutes les gammes depuis Supabase (includeHidden = true)
    const gammesFromSupabase = await loadGammesFromSupabase(true)
    console.log('🔍 Gammes chargées depuis Supabase (admin):', gammesFromSupabase)
    
    // Créer un Map pour indexer les gammes de Supabase par nom
    const supabaseGammesMap = new Map<string, GammeData>()
    gammesFromSupabase.forEach(gamme => {
      supabaseGammesMap.set(gamme.name, gamme)
    })
    
    // Fusionner : les gammes de Supabase ont la priorité
    // Si une gamme par défaut n'existe pas dans Supabase, on l'ajoute avec hidden: false
    const allGammes: GammeData[] = []
    
    // D'abord, ajouter toutes les gammes de Supabase (elles ont la priorité)
    gammesFromSupabase.forEach(gamme => {
      allGammes.push(gamme)
    })
    
    // Ensuite, ajouter les gammes par défaut qui n'existent pas dans Supabase
    DEFAULT_GAMMES.forEach(name => {
      if (!supabaseGammesMap.has(name)) {
        allGammes.push({ name, hidden: false })
      }
    })
    
    const sorted = allGammes.sort((a, b) => a.name.localeCompare(b.name))
    console.log('✅ Gammes finales pour admin:', sorted)
    console.log('✅ Gammes masquées dans la liste finale:', sorted.filter(g => g.hidden))
    return sorted
  } catch (error) {
    console.error('Erreur lors du chargement des gammes pour admin:', error)
    return DEFAULT_GAMMES.map(name => ({ name, hidden: false }))
  }
}

// Version synchrone (retourne les gammes par défaut)
export function loadGammesSync(): string[] {
  return DEFAULT_GAMMES
}

export async function saveGammes(gammes: string[]): Promise<void> {
  // Cette fonction n'est plus nécessaire car chaque gamme est gérée individuellement
  // On garde la fonction pour compatibilité mais elle ne fait rien
  console.warn('⚠️ saveGammes() est déprécié. Utilisez addGamme() et removeGamme() à la place.')
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gammes-updated', { detail: gammes }))
  }
}

export async function addGamme(gamme: string): Promise<{ success: boolean; message: string }> {
  if (!gamme || gamme.trim() === '') {
    return { success: false, message: 'Le nom de la gamme ne peut pas être vide' }
  }
  
  const trimmedGamme = gamme.trim()
  
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase non configuré. Impossible d\'ajouter la gamme.' }
  }
  
  try {
    // Vérifier si la gamme existe déjà (vérifier toutes les gammes, y compris masquées)
    const existingGammes = await loadGammesNamesFromSupabase(true)
    if (existingGammes.includes(trimmedGamme)) {
      return { success: false, message: 'Cette gamme existe déjà' }
    }
    
    const success = await addGammeToSupabase(trimmedGamme)
    if (success) {
      // Émettre l'événement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gammes-updated'))
      }
      return { success: true, message: 'Gamme ajoutée avec succès' }
    } else {
      return { success: false, message: 'Erreur lors de l\'ajout de la gamme' }
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la gamme:', error)
    return { success: false, message: 'Erreur lors de l\'ajout de la gamme' }
  }
}

export async function removeGamme(gamme: string): Promise<boolean> {
  // Utiliser uniquement Supabase
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de supprimer la gamme.')
    return false
  }
  
  try {
    const success = await deleteGammeFromSupabase(gamme)
    if (success) {
      // Émettre l'événement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gammes-updated'))
      }
    }
    return success
  } catch (error) {
    console.error('Erreur lors de la suppression de la gamme:', error)
    return false
  }
}

/**
 * Bascule le statut hidden d'une gamme
 */
export async function toggleGammeVisibility(gamme: string, hidden: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase non configuré. Impossible de modifier le statut de la gamme.')
    return false
  }
  
  try {
    const success = await toggleGammeHidden(gamme, hidden)
    if (success) {
      // Émettre l'événement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gammes-updated'))
      }
    }
    return success
  } catch (error) {
    console.error('Erreur lors de la modification du statut de la gamme:', error)
    return false
  }
}

export function onGammesUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = () => callback()
  window.addEventListener('gammes-updated', handler)
  return () => window.removeEventListener('gammes-updated', handler)
}

// ============================================
// GESTION DES IMAGES DE GAMMES
// ============================================

const GAMMES_IMAGES_STORAGE_KEY = 'site-gammes-images'

export interface GammeImage {
  gamme: string
  image: string // base64 ou URL Supabase
}

/**
 * Charge toutes les images de gammes
 */
export function loadGammesImages(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem(GAMMES_IMAGES_STORAGE_KEY)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gammes-manager.ts:112',message:'loadGammesImages',data:{hasSaved:!!saved,savedLength:saved?.length||0,storageKey:GAMMES_IMAGES_STORAGE_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (saved) {
      const parsed = JSON.parse(saved)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gammes-manager.ts:116',message:'parsed gamme images',data:{parsedKeys:Object.keys(parsed),parsedCount:Object.keys(parsed).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return parsed
    }
    return {}
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gammes-manager.ts:121',message:'loadGammesImages error',data:{errorMessage:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return {}
  }
}

/**
 * Sauvegarde toutes les images de gammes
 */
function saveGammesImages(images: Record<string, string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GAMMES_IMAGES_STORAGE_KEY, JSON.stringify(images))
    window.dispatchEvent(new CustomEvent('gammes-images-updated'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des images de gammes:', error)
  }
}

/**
 * Obtient l'image d'une gamme
 */
export function getGammeImage(gamme: string): string | null {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gammes-manager.ts:138',message:'getGammeImage entry',data:{gamme:gamme,gammeLength:gamme.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
  }
  // #endregion
  
  const images = loadGammesImages()
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gammes-manager.ts:141',message:'loaded gamme images',data:{totalImages:Object.keys(images).length,imageKeys:Object.keys(images),requestedGamme:gamme,hasGammeImage:gamme in images},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }
  // #endregion
  
  const result = images[gamme] || null
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gammes-manager.ts:145',message:'getGammeImage result',data:{gamme:gamme,resultFound:!!result,resultType:typeof result,resultLength:result?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
  }
  // #endregion
  return result
}

/**
 * Définit l'image d'une gamme
 */
export function setGammeImage(gamme: string, image: string): void {
  const images = loadGammesImages()
  images[gamme] = image
  saveGammesImages(images)
}

/**
 * Supprime l'image d'une gamme
 */
export function removeGammeImage(gamme: string): void {
  const images = loadGammesImages()
  delete images[gamme]
  saveGammesImages(images)
}

/**
 * Écoute les mises à jour des images de gammes
 */
export function onGammesImagesUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handler = () => callback()
  window.addEventListener('gammes-images-updated', handler)
  return () => window.removeEventListener('gammes-images-updated', handler)
}
