// Gestionnaire des variables pour Pop-up Duo et Bar à Pop-up
// Supabase uniquement
import { isSupabaseConfigured } from './supabase'
import { 
  loadPopupVariable,
  savePopupVariable,
  loadPopupCouleurs,
  savePopupCouleurs
} from './popup-variables-manager-supabase'

// ============================================
// UTILITAIRES DE VALIDATION
// ============================================

/**
 * Valide un code couleur hexadécimal
 */
function isValidHexColor(color: string | undefined): boolean {
  if (!color) return false
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

/**
 * Normalise un code couleur hexadécimal
 */
function normalizeHexColor(color: string | undefined): string {
  if (!color) return '#FFFFFF'
  const trimmed = color.trim()
  if (isValidHexColor(trimmed)) {
    return trimmed.toUpperCase()
  }
  return '#FFFFFF'
}

/**
 * Valide qu'une chaîne n'est pas vide après trim
 */
function isValidString(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Valide qu'un tableau n'est pas vide
 */
function isValidArray<T>(arr: T[] | null | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0
}

export interface Couleur {
  name: string
  type: 'fluo' | 'pastel'
  value?: string // Code couleur hex (optionnel)
}

const POPUP_DUO_SAVEURS_KEY = 'popup-duo-saveurs'
const POPUP_DUO_FORMES_KEY = 'popup-duo-formes'
const BAR_POPUP_AROMES_KEY = 'bar-popup-aromes'
const BAR_POPUP_COULEURS_FLUO_KEY = 'bar-popup-couleurs-fluo'
const BAR_POPUP_COULEURS_PASTEL_KEY = 'bar-popup-couleurs-pastel'
const BAR_POPUP_TAILLES_FLUO_KEY = 'bar-popup-tailles-fluo'
const BAR_POPUP_TAILLES_PASTEL_KEY = 'bar-popup-tailles-pastel'

// Valeurs par défaut (définies localement pour éviter les dépendances circulaires)
const DEFAULT_SAVEURS = [
  'Mûre cassis',
  'Acid banane ananas',
  'Thon pêche',
  'Maïs crème',
  'Mangue bergamote'
]

const DEFAULT_FORMES = [
  '10mm',
  '16mm',
  'Dumbels 12/16mm',
  'Cocoon 10/8mm',
  'Cocoon 15/12mm',
  'Snail shell',
  'Crub 18x13mm',
  'Maïs 14x10mm'
]

const DEFAULT_AROMES = [
  'Méga Tutti',
  'Red devil',
  'Pêche',
  'Thon',
  'Monster crab',
  'Scopex',
  'Fraise',
  'Krill',
  'Ananas',
  'Banane',
  'neutre'
]

const DEFAULT_COULEURS_FLUO: Couleur[] = [
  { name: 'Jaune fluo', value: '#FFFF00', type: 'fluo' },
  { name: 'Blanc', value: '#FFFFFF', type: 'fluo' },
  { name: 'Rose fluo', value: '#FF1493', type: 'fluo' },
  { name: 'Vert fluo', value: '#00FF00', type: 'fluo' },
  { name: 'Violet', value: '#A855F7', type: 'fluo' },
  { name: 'Orange fluo', value: '#FF6600', type: 'fluo' },
  { name: 'Bleu fluo', value: '#00BFFF', type: 'fluo' },
]

const DEFAULT_COULEURS_PASTEL: Couleur[] = [
  { name: 'Rose pastel', value: '#FFB6C1', type: 'pastel' },
  { name: 'Jaune pastel', value: '#FFEB3B', type: 'pastel' },
  { name: 'Orange pastel', value: '#FF9800', type: 'pastel' },
]

const DEFAULT_TAILLES_FLUO = ['10mm', '12mm', 'Dumbells 12/15', '15mm', '20mm']
const DEFAULT_TAILLES_PASTEL = ['12mm', '15mm']

// ============================================
// POP-UP DUO - SAVEURS
// ============================================

export async function loadPopupDuoSaveurs(): Promise<string[]> {
  try {
    const result = await loadPopupVariable('popup-duo-saveurs', DEFAULT_SAVEURS)
    return Array.isArray(result) ? result : DEFAULT_SAVEURS
  } catch (error) {
    console.error('Erreur lors du chargement des saveurs Pop-up Duo:', error)
    return DEFAULT_SAVEURS
  }
}

// Version synchrone (retourne les valeurs par défaut)
export function loadPopupDuoSaveursSync(): string[] {
  return DEFAULT_SAVEURS
}

export async function savePopupDuoSaveurs(saveurs: string[]): Promise<{ success: boolean; error?: string }> {
  if (!isValidArray(saveurs)) {
    return { success: false, error: 'La liste des saveurs ne peut pas être vide' }
  }
  
  try {
    await savePopupVariable('popup-duo-saveurs', saveurs)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('popup-duo-saveurs-updated'))
    }
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde des saveurs Pop-up Duo:', error)
    return { success: false, error: errorMessage }
  }
}

export async function addPopupDuoSaveur(saveur: string): Promise<{ success: boolean; message: string }> {
  if (!isValidString(saveur)) {
    return { success: false, message: 'Le nom de la saveur ne peut pas être vide' }
  }
  
  const trimmed = saveur.trim()
  
  try {
    const saveurs = await loadPopupDuoSaveurs()
    
    if (!Array.isArray(saveurs)) {
      return { success: false, message: 'Erreur lors du chargement des saveurs existantes' }
    }
    
    if (saveurs.includes(trimmed)) {
      return { success: false, message: 'Cette saveur existe déjà' }
    }
    
    const updatedSaveurs = [...saveurs, trimmed]
    const saveResult = await savePopupDuoSaveurs(updatedSaveurs)
    
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Erreur lors de la sauvegarde' }
    }
    
    // Synchroniser automatiquement avec Flash Boost et Spray Plus
    try {
      const { addFlashBoostArome, addSprayPlusArome } = await import('./flash-spray-variables-manager')
      const syncResults = await Promise.allSettled([
        addFlashBoostArome(trimmed),
        addSprayPlusArome(trimmed)
      ])
      
      const syncErrors = syncResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason?.message || 'Erreur inconnue')
      
      if (syncErrors.length > 0) {
        console.warn(`⚠️ Erreurs lors de la synchronisation avec Flash Boost/Spray Plus:`, syncErrors)
      } else {
        console.log(`✅ Saveur "${trimmed}" synchronisée avec Flash Boost et Spray Plus`)
      }
    } catch (error: any) {
      console.warn(`⚠️ Erreur lors de la synchronisation avec Flash Boost/Spray Plus:`, error?.message || error)
    }
    
    return { success: true, message: 'Saveur ajoutée avec succès' }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue'
    console.error('Erreur lors de l\'ajout de la saveur:', error)
    return { success: false, message: `Erreur: ${errorMessage}` }
  }
}

export async function removePopupDuoSaveur(saveur: string): Promise<boolean> {
  if (!isValidString(saveur)) {
    return false
  }
  
  try {
    const saveurs = await loadPopupDuoSaveurs()
    
    if (!Array.isArray(saveurs)) {
      console.error('Erreur: les saveurs chargées ne sont pas un tableau valide')
      return false
    }
    
    const filtered = saveurs.filter(s => s !== saveur)
  
    if (filtered.length === saveurs.length) {
      return false
    }
  
    const saveResult = await savePopupDuoSaveurs(filtered)
    return saveResult.success
  } catch (error) {
    console.error('Erreur lors de la suppression de la saveur:', error)
    return false
  }
}

export function onPopupDuoSaveursUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('popup-duo-saveurs-updated', handler)
  return () => window.removeEventListener('popup-duo-saveurs-updated', handler)
}

// ============================================
// POP-UP DUO - FORMES
// ============================================

export async function loadPopupDuoFormes(): Promise<string[]> {
  try {
    const result = await loadPopupVariable('popup-duo-formes', DEFAULT_FORMES)
    return Array.isArray(result) ? result : DEFAULT_FORMES
  } catch (error) {
    console.error('Erreur lors du chargement des formes Pop-up Duo:', error)
    return DEFAULT_FORMES
  }
}

export function loadPopupDuoFormesSync(): string[] {
  return DEFAULT_FORMES
}

export async function savePopupDuoFormes(formes: string[]): Promise<{ success: boolean; error?: string }> {
  if (!isValidArray(formes)) {
    return { success: false, error: 'La liste des formes ne peut pas être vide' }
  }
  
  try {
    await savePopupVariable('popup-duo-formes', formes)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('popup-duo-formes-updated'))
    }
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde des formes Pop-up Duo:', error)
    return { success: false, error: errorMessage }
  }
}

export async function addPopupDuoForme(forme: string): Promise<{ success: boolean; message: string }> {
  if (!isValidString(forme)) {
    return { success: false, message: 'Le nom de la forme ne peut pas être vide' }
  }
  
  const trimmed = forme.trim()
  
  try {
    const formes = await loadPopupDuoFormes()
    
    if (!Array.isArray(formes)) {
      return { success: false, message: 'Erreur lors du chargement des formes existantes' }
    }
    
    if (formes.includes(trimmed)) {
      return { success: false, message: 'Cette forme existe déjà' }
    }
    
    const updatedFormes = [...formes, trimmed]
    const saveResult = await savePopupDuoFormes(updatedFormes)
    
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Erreur lors de la sauvegarde' }
    }
    
    return { success: true, message: 'Forme ajoutée avec succès' }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue'
    console.error('Erreur lors de l\'ajout de la forme:', error)
    return { success: false, message: `Erreur: ${errorMessage}` }
  }
}

export async function removePopupDuoForme(forme: string): Promise<boolean> {
  if (!isValidString(forme)) {
    return false
  }
  
  try {
    const formes = await loadPopupDuoFormes()
    
    if (!Array.isArray(formes)) {
      console.error('Erreur: les formes chargées ne sont pas un tableau valide')
      return false
    }
    
    const filtered = formes.filter(f => f !== forme)
  
    if (filtered.length === formes.length) {
      return false
    }
  
    const saveResult = await savePopupDuoFormes(filtered)
    return saveResult.success
  } catch (error) {
    console.error('Erreur lors de la suppression de la forme:', error)
    return false
  }
}

export function onPopupDuoFormesUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('popup-duo-formes-updated', handler)
  return () => window.removeEventListener('popup-duo-formes-updated', handler)
}

// ============================================
// BAR À POP-UP - AROMES
// ============================================

export async function loadBarPopupAromes(): Promise<string[]> {
  try {
    const result = await loadPopupVariable('bar-popup-aromes', DEFAULT_AROMES)
    return Array.isArray(result) ? result : DEFAULT_AROMES
  } catch (error) {
    console.error('Erreur lors du chargement des arômes Bar Pop-up:', error)
    return DEFAULT_AROMES
  }
}

export function loadBarPopupAromesSync(): string[] {
  return DEFAULT_AROMES
}

export async function saveBarPopupAromes(aromes: string[]): Promise<{ success: boolean; error?: string }> {
  if (!isValidArray(aromes)) {
    return { success: false, error: 'La liste des arômes ne peut pas être vide' }
  }
  
  try {
    await savePopupVariable('bar-popup-aromes', aromes)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bar-popup-aromes-updated'))
    }
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde des arômes Bar Pop-up:', error)
    return { success: false, error: errorMessage }
  }
}

export async function addBarPopupArome(arome: string): Promise<{ success: boolean; message: string }> {
  if (!isValidString(arome)) {
    return { success: false, message: 'Le nom de l\'arôme ne peut pas être vide' }
  }
  
  const trimmed = arome.trim()
  
  try {
    const aromes = await loadBarPopupAromes()
    
    if (!Array.isArray(aromes)) {
      return { success: false, message: 'Erreur lors du chargement des arômes existants' }
    }
    
    if (aromes.includes(trimmed)) {
      return { success: false, message: 'Cet arôme existe déjà' }
    }
    
    const updatedAromes = [...aromes, trimmed]
    const saveResult = await saveBarPopupAromes(updatedAromes)
    
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Erreur lors de la sauvegarde' }
    }
    
    // Synchroniser automatiquement avec Flash Boost et Spray Plus
    try {
      const { addFlashBoostArome, addSprayPlusArome } = await import('./flash-spray-variables-manager')
      const syncResults = await Promise.allSettled([
        addFlashBoostArome(trimmed),
        addSprayPlusArome(trimmed)
      ])
      
      const syncErrors = syncResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason?.message || 'Erreur inconnue')
      
      if (syncErrors.length > 0) {
        console.warn(`⚠️ Erreurs lors de la synchronisation avec Flash Boost/Spray Plus:`, syncErrors)
      } else {
        console.log(`✅ Arôme "${trimmed}" synchronisé avec Flash Boost et Spray Plus`)
      }
    } catch (error: any) {
      console.warn(`⚠️ Erreur lors de la synchronisation avec Flash Boost/Spray Plus:`, error?.message || error)
    }
    
    return { success: true, message: 'Arôme ajouté avec succès' }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue'
    console.error('Erreur lors de l\'ajout de l\'arôme:', error)
    return { success: false, message: `Erreur: ${errorMessage}` }
  }
}

export async function removeBarPopupArome(arome: string): Promise<boolean> {
  if (!isValidString(arome)) {
    return false
  }
  
  try {
    const aromes = await loadBarPopupAromes()
    
    if (!Array.isArray(aromes)) {
      console.error('Erreur: les arômes chargés ne sont pas un tableau valide')
      return false
    }
    
    const filtered = aromes.filter(a => a !== arome)
  
    if (filtered.length === aromes.length) {
      return false
    }
  
    const saveResult = await saveBarPopupAromes(filtered)
    return saveResult.success
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'arôme:', error)
    return false
  }
}

export function onBarPopupAromesUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('bar-popup-aromes-updated', handler)
  return () => window.removeEventListener('bar-popup-aromes-updated', handler)
}

// ============================================
// BAR À POP-UP - COULEURS FLUO
// ============================================

export async function loadBarPopupCouleursFluo(): Promise<Couleur[]> {
  try {
    const result = await loadPopupCouleurs('bar-popup-couleurs-fluo', DEFAULT_COULEURS_FLUO)
    if (Array.isArray(result) && result.length > 0) {
      // Valider et normaliser les couleurs
      return result.map(c => ({
        ...c,
        value: normalizeHexColor(c.value),
        type: c.type || 'fluo'
      }))
    }
    return DEFAULT_COULEURS_FLUO
  } catch (error) {
    console.error('Erreur lors du chargement des couleurs fluo Bar Pop-up:', error)
    return DEFAULT_COULEURS_FLUO
  }
}

export function loadBarPopupCouleursFluoSync(): Couleur[] {
  return DEFAULT_COULEURS_FLUO
}

export async function saveBarPopupCouleursFluo(couleurs: Couleur[]): Promise<{ success: boolean; error?: string }> {
  if (!isValidArray(couleurs)) {
    return { success: false, error: 'La liste des couleurs ne peut pas être vide' }
  }
  
  // Valider toutes les couleurs
  const invalidColors = couleurs.filter(c => !isValidString(c.name) || (c.value && !isValidHexColor(c.value)))
  if (invalidColors.length > 0) {
    return { success: false, error: 'Certaines couleurs ont un format invalide' }
  }
  
  // Normaliser les couleurs
  const normalizedCouleurs = couleurs.map(c => ({
    name: c.name.trim(),
    type: 'fluo' as const,
    value: normalizeHexColor(c.value)
  }))
  
  try {
    await savePopupCouleurs('bar-popup-couleurs-fluo', normalizedCouleurs)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bar-popup-couleurs-fluo-updated'))
    }
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde des couleurs fluo Bar Pop-up:', error)
    return { success: false, error: errorMessage }
  }
}

export async function addBarPopupCouleurFluo(couleur: string, value?: string): Promise<{ success: boolean; message: string }> {
  if (!isValidString(couleur)) {
    return { success: false, message: 'Le nom de la couleur ne peut pas être vide' }
  }
  
  const trimmed = couleur.trim()
  
  // Valider la couleur hex si fournie
  if (value && !isValidHexColor(value)) {
    return { success: false, message: 'Le code couleur hexadécimal est invalide' }
  }
  
  // Normaliser seulement après validation
  const normalizedValue = normalizeHexColor(value)
  
  try {
    const couleurs = await loadBarPopupCouleursFluo()
    
    if (!Array.isArray(couleurs)) {
      return { success: false, message: 'Erreur lors du chargement des couleurs existantes' }
    }
    
    if (couleurs.find(c => c.name === trimmed)) {
      return { success: false, message: 'Cette couleur existe déjà' }
    }
    
    const updatedCouleurs = [...couleurs, { name: trimmed, type: 'fluo' as const, value: normalizedValue }]
    const saveResult = await saveBarPopupCouleursFluo(updatedCouleurs)
    
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Erreur lors de la sauvegarde' }
    }
    
    return { success: true, message: 'Couleur fluo ajoutée avec succès' }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue'
    console.error('Erreur lors de l\'ajout de la couleur fluo:', error)
    return { success: false, message: `Erreur: ${errorMessage}` }
  }
}

export async function removeBarPopupCouleurFluo(couleur: string): Promise<boolean> {
  if (!isValidString(couleur)) {
    return false
  }
  
  try {
    const couleurs = await loadBarPopupCouleursFluo()
    
    if (!Array.isArray(couleurs)) {
      console.error('Erreur: les couleurs chargées ne sont pas un tableau valide')
      return false
    }
    
    const filtered = couleurs.filter(c => c.name !== couleur)
  
    if (filtered.length === couleurs.length) {
      return false
    }
  
    const saveResult = await saveBarPopupCouleursFluo(filtered)
    return saveResult.success
  } catch (error) {
    console.error('Erreur lors de la suppression de la couleur fluo:', error)
    return false
  }
}

export function onBarPopupCouleursFluoUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('bar-popup-couleurs-fluo-updated', handler)
  return () => window.removeEventListener('bar-popup-couleurs-fluo-updated', handler)
}

// ============================================
// BAR À POP-UP - COULEURS PASTEL
// ============================================

export async function loadBarPopupCouleursPastel(): Promise<Couleur[]> {
  try {
    const result = await loadPopupCouleurs('bar-popup-couleurs-pastel', DEFAULT_COULEURS_PASTEL)
    if (Array.isArray(result) && result.length > 0) {
      // Valider et normaliser les couleurs
      return result.map(c => ({
        ...c,
        value: normalizeHexColor(c.value),
        type: c.type || 'pastel'
      }))
    }
    return DEFAULT_COULEURS_PASTEL
  } catch (error) {
    console.error('Erreur lors du chargement des couleurs pastel Bar Pop-up:', error)
    return DEFAULT_COULEURS_PASTEL
  }
}

export function loadBarPopupCouleursPastelSync(): Couleur[] {
  return DEFAULT_COULEURS_PASTEL
}

export async function saveBarPopupCouleursPastel(couleurs: Couleur[]): Promise<{ success: boolean; error?: string }> {
  if (!isValidArray(couleurs)) {
    return { success: false, error: 'La liste des couleurs ne peut pas être vide' }
  }
  
  // Valider toutes les couleurs
  const invalidColors = couleurs.filter(c => !isValidString(c.name) || (c.value && !isValidHexColor(c.value)))
  if (invalidColors.length > 0) {
    return { success: false, error: 'Certaines couleurs ont un format invalide' }
  }
  
  // Normaliser les couleurs
  const normalizedCouleurs = couleurs.map(c => ({
    name: c.name.trim(),
    type: 'pastel' as const,
    value: normalizeHexColor(c.value)
  }))
  
  try {
    await savePopupCouleurs('bar-popup-couleurs-pastel', normalizedCouleurs)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bar-popup-couleurs-pastel-updated'))
    }
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde des couleurs pastel Bar Pop-up:', error)
    return { success: false, error: errorMessage }
  }
}

export async function addBarPopupCouleurPastel(couleur: string, value?: string): Promise<{ success: boolean; message: string }> {
  if (!isValidString(couleur)) {
    return { success: false, message: 'Le nom de la couleur ne peut pas être vide' }
  }
  
  const trimmed = couleur.trim()
  
  // Valider la couleur hex si fournie
  if (value && !isValidHexColor(value)) {
    return { success: false, message: 'Le code couleur hexadécimal est invalide' }
  }
  
  // Normaliser seulement après validation
  const normalizedValue = normalizeHexColor(value)
  
  try {
    const couleurs = await loadBarPopupCouleursPastel()
    
    if (!Array.isArray(couleurs)) {
      return { success: false, message: 'Erreur lors du chargement des couleurs existantes' }
    }
    
    if (couleurs.find(c => c.name === trimmed)) {
      return { success: false, message: 'Cette couleur existe déjà' }
    }
    
    const updatedCouleurs = [...couleurs, { name: trimmed, type: 'pastel' as const, value: normalizedValue }]
    const saveResult = await saveBarPopupCouleursPastel(updatedCouleurs)
    
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Erreur lors de la sauvegarde' }
    }
    
    return { success: true, message: 'Couleur pastel ajoutée avec succès' }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue'
    console.error('Erreur lors de l\'ajout de la couleur pastel:', error)
    return { success: false, message: `Erreur: ${errorMessage}` }
  }
}

export async function removeBarPopupCouleurPastel(couleur: string): Promise<boolean> {
  if (!isValidString(couleur)) {
    return false
  }
  
  try {
    const couleurs = await loadBarPopupCouleursPastel()
    
    if (!Array.isArray(couleurs)) {
      console.error('Erreur: les couleurs chargées ne sont pas un tableau valide')
      return false
    }
    
    const filtered = couleurs.filter(c => c.name !== couleur)
  
    if (filtered.length === couleurs.length) {
      return false
    }
  
    const saveResult = await saveBarPopupCouleursPastel(filtered)
    return saveResult.success
  } catch (error) {
    console.error('Erreur lors de la suppression de la couleur pastel:', error)
    return false
  }
}

export function onBarPopupCouleursPastelUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('bar-popup-couleurs-pastel-updated', handler)
  return () => window.removeEventListener('bar-popup-couleurs-pastel-updated', handler)
}

// ============================================
// BAR À POP-UP - TAILLES FLUO
// ============================================

export async function loadBarPopupTaillesFluo(): Promise<string[]> {
  try {
    const result = await loadPopupVariable('bar-popup-tailles-fluo', DEFAULT_TAILLES_FLUO)
    return Array.isArray(result) ? result : DEFAULT_TAILLES_FLUO
  } catch (error) {
    console.error('Erreur lors du chargement des tailles fluo Bar Pop-up:', error)
    return DEFAULT_TAILLES_FLUO
  }
}

export function loadBarPopupTaillesFluoSync(): string[] {
  return DEFAULT_TAILLES_FLUO
}

export async function saveBarPopupTaillesFluo(tailles: string[]): Promise<{ success: boolean; error?: string }> {
  if (!isValidArray(tailles)) {
    return { success: false, error: 'La liste des tailles ne peut pas être vide' }
  }
  
  try {
    await savePopupVariable('bar-popup-tailles-fluo', tailles)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bar-popup-tailles-fluo-updated'))
    }
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde des tailles fluo Bar Pop-up:', error)
    return { success: false, error: errorMessage }
  }
}

export async function addBarPopupTailleFluo(taille: string): Promise<{ success: boolean; message: string }> {
  if (!isValidString(taille)) {
    return { success: false, message: 'Le nom de la taille ne peut pas être vide' }
  }
  
  const trimmed = taille.trim()
  
  try {
    const tailles = await loadBarPopupTaillesFluo()
    
    if (!Array.isArray(tailles)) {
      return { success: false, message: 'Erreur lors du chargement des tailles existantes' }
    }
    
    if (tailles.includes(trimmed)) {
      return { success: false, message: 'Cette taille existe déjà' }
    }
    
    const updatedTailles = [...tailles, trimmed]
    const saveResult = await saveBarPopupTaillesFluo(updatedTailles)
    
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Erreur lors de la sauvegarde' }
    }
    
    return { success: true, message: 'Taille fluo ajoutée avec succès' }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue'
    console.error('Erreur lors de l\'ajout de la taille fluo:', error)
    return { success: false, message: `Erreur: ${errorMessage}` }
  }
}

export async function removeBarPopupTailleFluo(taille: string): Promise<boolean> {
  if (!isValidString(taille)) {
    return false
  }
  
  try {
    const tailles = await loadBarPopupTaillesFluo()
    
    if (!Array.isArray(tailles)) {
      console.error('Erreur: les tailles chargées ne sont pas un tableau valide')
      return false
    }
    
    const filtered = tailles.filter(t => t !== taille)
  
    if (filtered.length === tailles.length) {
      return false
    }
  
    const saveResult = await saveBarPopupTaillesFluo(filtered)
    return saveResult.success
  } catch (error) {
    console.error('Erreur lors de la suppression de la taille fluo:', error)
    return false
  }
}

export function onBarPopupTaillesFluoUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('bar-popup-tailles-fluo-updated', handler)
  return () => window.removeEventListener('bar-popup-tailles-fluo-updated', handler)
}

// ============================================
// BAR À POP-UP - TAILLES PASTEL
// ============================================

export async function loadBarPopupTaillesPastel(): Promise<string[]> {
  try {
    const result = await loadPopupVariable('bar-popup-tailles-pastel', DEFAULT_TAILLES_PASTEL)
    return Array.isArray(result) ? result : DEFAULT_TAILLES_PASTEL
  } catch (error) {
    console.error('Erreur lors du chargement des tailles pastel Bar Pop-up:', error)
    return DEFAULT_TAILLES_PASTEL
  }
}

export function loadBarPopupTaillesPastelSync(): string[] {
  return DEFAULT_TAILLES_PASTEL
}

export async function saveBarPopupTaillesPastel(tailles: string[]): Promise<{ success: boolean; error?: string }> {
  if (!isValidArray(tailles)) {
    return { success: false, error: 'La liste des tailles ne peut pas être vide' }
  }
  
  try {
    await savePopupVariable('bar-popup-tailles-pastel', tailles)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bar-popup-tailles-pastel-updated'))
    }
    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde des tailles pastel Bar Pop-up:', error)
    return { success: false, error: errorMessage }
  }
}

export async function addBarPopupTaillePastel(taille: string): Promise<{ success: boolean; message: string }> {
  if (!isValidString(taille)) {
    return { success: false, message: 'Le nom de la taille ne peut pas être vide' }
  }
  
  const trimmed = taille.trim()
  
  try {
    const tailles = await loadBarPopupTaillesPastel()
    
    if (!Array.isArray(tailles)) {
      return { success: false, message: 'Erreur lors du chargement des tailles existantes' }
    }
    
    if (tailles.includes(trimmed)) {
      return { success: false, message: 'Cette taille existe déjà' }
    }
    
    const updatedTailles = [...tailles, trimmed]
    const saveResult = await saveBarPopupTaillesPastel(updatedTailles)
    
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Erreur lors de la sauvegarde' }
    }
    
    return { success: true, message: 'Taille pastel ajoutée avec succès' }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue'
    console.error('Erreur lors de l\'ajout de la taille pastel:', error)
    return { success: false, message: `Erreur: ${errorMessage}` }
  }
}

export async function removeBarPopupTaillePastel(taille: string): Promise<boolean> {
  if (!isValidString(taille)) {
    return false
  }
  
  try {
    const tailles = await loadBarPopupTaillesPastel()
    
    if (!Array.isArray(tailles)) {
      console.error('Erreur: les tailles chargées ne sont pas un tableau valide')
      return false
    }
    
    const filtered = tailles.filter(t => t !== taille)
  
    if (filtered.length === tailles.length) {
      return false
    }
  
    const saveResult = await saveBarPopupTaillesPastel(filtered)
    return saveResult.success
  } catch (error) {
    console.error('Erreur lors de la suppression de la taille pastel:', error)
    return false
  }
}

export function onBarPopupTaillesPastelUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('bar-popup-tailles-pastel-updated', handler)
  return () => window.removeEventListener('bar-popup-tailles-pastel-updated', handler)
}
