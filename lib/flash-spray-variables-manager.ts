// Gestionnaire des variables pour Flash Boost et Spray Plus - Supabase uniquement

import { 
  loadFlashSprayVariablesFromSupabase, 
  saveFlashSprayVariablesToSupabase 
} from './flash-spray-variables-supabase'
import { GAMMES_BOUILLETTES } from './constants'

// Valeurs par défaut
const DEFAULT_FLASH_BOOST_AROMES = GAMMES_BOUILLETTES
const DEFAULT_FLASH_BOOST_FORMATS = ['100 ml']
const DEFAULT_SPRAY_PLUS_AROMES = GAMMES_BOUILLETTES
const DEFAULT_SPRAY_PLUS_FORMATS = ['30 ml']

// Fonction helper pour synchroniser les arômes entre Flash Boost et Spray Plus
async function syncAromeToOther(arome: string, target: 'flash-boost' | 'spray-plus'): Promise<void> {
  try {
    if (target === 'flash-boost') {
      const { addFlashBoostArome } = await import('./flash-spray-variables-manager')
      await addFlashBoostArome(arome, true).catch(() => {})
    } else {
      const { addSprayPlusArome } = await import('./flash-spray-variables-manager')
      await addSprayPlusArome(arome, true).catch(() => {})
    }
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la synchronisation:`, error)
  }
}

// ============================================
// FLASH BOOST - AROMES
// ============================================

export async function loadFlashBoostAromes(): Promise<string[]> {
  try {
    const aromes = await loadFlashSprayVariablesFromSupabase('flash-boost-aromes')
    return aromes.length > 0 ? aromes : DEFAULT_FLASH_BOOST_AROMES
  } catch (error) {
    console.error('Erreur lors du chargement des arômes Flash Boost:', error)
    return DEFAULT_FLASH_BOOST_AROMES
  }
}

export function loadFlashBoostAromesSync(): string[] {
  return DEFAULT_FLASH_BOOST_AROMES
}

export async function saveFlashBoostAromes(aromes: string[]): Promise<void> {
  await saveFlashSprayVariablesToSupabase('flash-boost-aromes', aromes)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flash-boost-aromes-updated'))
  }
}

export async function addFlashBoostArome(arome: string, skipSync = false): Promise<{ success: boolean; message: string }> {
  if (!arome || arome.trim() === '') {
    return { success: false, message: 'Le nom de l\'arôme ne peut pas être vide' }
  }
  
  const trimmed = arome.trim()
  const aromes = await loadFlashBoostAromes()
  
  if (aromes.includes(trimmed)) {
    return { success: false, message: 'Cet arôme existe déjà' }
  }
  
  aromes.push(trimmed)
  await saveFlashBoostAromes(aromes)
  
  // Synchroniser automatiquement avec Spray Plus (si pas déjà en cours de synchronisation)
  if (!skipSync) {
    await syncAromeToOther(trimmed, 'spray-plus')
    console.log(`✅ Arôme "${trimmed}" synchronisé avec Spray Plus`)
  }
  
  return { success: true, message: 'Arôme Flash Boost ajouté avec succès' }
}

export async function removeFlashBoostArome(arome: string): Promise<boolean> {
  const aromes = await loadFlashBoostAromes()
  const filtered = aromes.filter(a => a !== arome)
  
  if (filtered.length === aromes.length) {
    return false
  }
  
  await saveFlashBoostAromes(filtered)
  return true
}

export function onFlashBoostAromesUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('flash-boost-aromes-updated', handler)
  return () => window.removeEventListener('flash-boost-aromes-updated', handler)
}

// ============================================
// FLASH BOOST - FORMATS
// ============================================

export async function loadFlashBoostFormats(): Promise<string[]> {
  try {
    const formats = await loadFlashSprayVariablesFromSupabase('flash-boost-formats')
    return formats.length > 0 ? formats : DEFAULT_FLASH_BOOST_FORMATS
  } catch (error) {
    console.error('Erreur lors du chargement des formats Flash Boost:', error)
    return DEFAULT_FLASH_BOOST_FORMATS
  }
}

export function loadFlashBoostFormatsSync(): string[] {
  return DEFAULT_FLASH_BOOST_FORMATS
}

export async function saveFlashBoostFormats(formats: string[]): Promise<void> {
  await saveFlashSprayVariablesToSupabase('flash-boost-formats', formats)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flash-boost-formats-updated'))
  }
}

export async function addFlashBoostFormat(format: string): Promise<{ success: boolean; message: string }> {
  if (!format || format.trim() === '') {
    return { success: false, message: 'Le nom du format ne peut pas être vide' }
  }
  
  const trimmed = format.trim()
  const formats = await loadFlashBoostFormats()
  
  if (formats.includes(trimmed)) {
    return { success: false, message: 'Ce format existe déjà' }
  }
  
  formats.push(trimmed)
  await saveFlashBoostFormats(formats)
  return { success: true, message: 'Format Flash Boost ajouté avec succès' }
}

export async function removeFlashBoostFormat(format: string): Promise<boolean> {
  const formats = await loadFlashBoostFormats()
  const filtered = formats.filter(f => f !== format)
  
  if (filtered.length === formats.length) {
    return false
  }
  
  await saveFlashBoostFormats(filtered)
  return true
}

export function onFlashBoostFormatsUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('flash-boost-formats-updated', handler)
  return () => window.removeEventListener('flash-boost-formats-updated', handler)
}

// ============================================
// SPRAY PLUS - AROMES
// ============================================

export async function loadSprayPlusAromes(): Promise<string[]> {
  try {
    const aromes = await loadFlashSprayVariablesFromSupabase('spray-plus-aromes')
    // Filtrer "neutre" de la liste
    const filteredAromes = aromes.filter(arome => arome.toLowerCase() !== 'neutre')
    return filteredAromes.length > 0 ? filteredAromes : DEFAULT_SPRAY_PLUS_AROMES.filter(arome => arome.toLowerCase() !== 'neutre')
  } catch (error) {
    console.error('Erreur lors du chargement des arômes Spray Plus:', error)
    return DEFAULT_SPRAY_PLUS_AROMES.filter(arome => arome.toLowerCase() !== 'neutre')
  }
}

export function loadSprayPlusAromesSync(): string[] {
  return DEFAULT_SPRAY_PLUS_AROMES
}

export async function saveSprayPlusAromes(aromes: string[]): Promise<void> {
  await saveFlashSprayVariablesToSupabase('spray-plus-aromes', aromes)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spray-plus-aromes-updated'))
  }
}

export async function addSprayPlusArome(arome: string, skipSync = false): Promise<{ success: boolean; message: string }> {
  if (!arome || arome.trim() === '') {
    return { success: false, message: 'Le nom de l\'arôme ne peut pas être vide' }
  }
  
  const trimmed = arome.trim()
  
  // Bloquer l'ajout de "neutre" pour Spray Plus
  if (trimmed.toLowerCase() === 'neutre') {
    return { success: false, message: 'L\'arôme "neutre" n\'est pas autorisé pour Spray Plus' }
  }
  
  const aromes = await loadSprayPlusAromes()
  
  if (aromes.includes(trimmed)) {
    return { success: false, message: 'Cet arôme existe déjà' }
  }
  
  aromes.push(trimmed)
  await saveSprayPlusAromes(aromes)
  
  // Synchroniser automatiquement avec Flash Boost (si pas déjà en cours de synchronisation)
  if (!skipSync) {
    await syncAromeToOther(trimmed, 'flash-boost')
    console.log(`✅ Arôme "${trimmed}" synchronisé avec Flash Boost`)
  }
  
  return { success: true, message: 'Arôme Spray Plus ajouté avec succès' }
}

export async function removeSprayPlusArome(arome: string): Promise<boolean> {
  const aromes = await loadSprayPlusAromes()
  const filtered = aromes.filter(a => a !== arome)
  
  if (filtered.length === aromes.length) {
    return false
  }
  
  await saveSprayPlusAromes(filtered)
  return true
}

export function onSprayPlusAromesUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('spray-plus-aromes-updated', handler)
  return () => window.removeEventListener('spray-plus-aromes-updated', handler)
}

// ============================================
// SPRAY PLUS - FORMATS
// ============================================

export async function loadSprayPlusFormats(): Promise<string[]> {
  try {
    const formats = await loadFlashSprayVariablesFromSupabase('spray-plus-formats')
    return formats.length > 0 ? formats : DEFAULT_SPRAY_PLUS_FORMATS
  } catch (error) {
    console.error('Erreur lors du chargement des formats Spray Plus:', error)
    return DEFAULT_SPRAY_PLUS_FORMATS
  }
}

export function loadSprayPlusFormatsSync(): string[] {
  return DEFAULT_SPRAY_PLUS_FORMATS
}

export async function saveSprayPlusFormats(formats: string[]): Promise<void> {
  await saveFlashSprayVariablesToSupabase('spray-plus-formats', formats)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spray-plus-formats-updated'))
  }
}

export async function addSprayPlusFormat(format: string): Promise<{ success: boolean; message: string }> {
  if (!format || format.trim() === '') {
    return { success: false, message: 'Le nom du format ne peut pas être vide' }
  }
  
  const trimmed = format.trim()
  const formats = await loadSprayPlusFormats()
  
  if (formats.includes(trimmed)) {
    return { success: false, message: 'Ce format existe déjà' }
  }
  
  formats.push(trimmed)
  await saveSprayPlusFormats(formats)
  return { success: true, message: 'Format Spray Plus ajouté avec succès' }
}

export async function removeSprayPlusFormat(format: string): Promise<boolean> {
  const formats = await loadSprayPlusFormats()
  const filtered = formats.filter(f => f !== format)
  
  if (filtered.length === formats.length) {
    return false
  }
  
  await saveSprayPlusFormats(filtered)
  return true
}

export function onSprayPlusFormatsUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('spray-plus-formats-updated', handler)
  return () => window.removeEventListener('spray-plus-formats-updated', handler)
}

