// Gestionnaire centralisé pour récupérer tous les arômes et saveurs du site
import { loadFlashBoostAromes, loadSprayPlusAromes } from './flash-spray-variables-manager'
import { loadPopupDuoSaveurs } from './popup-variables-manager'
import { loadBarPopupAromes } from './popup-variables-manager'

/**
 * Récupère tous les arômes et saveurs disponibles sur le site
 * Combine les arômes de Flash Boost, Spray Plus, Pop-up Duo et Bar Pop-up
 * @returns Un tableau unique de tous les arômes/saveurs (sans doublons)
 */
export async function getAllAromesAndSaveurs(): Promise<string[]> {
  try {
    // Charger tous les arômes/saveurs en parallèle
    const [flashBoostAromes, sprayPlusAromes, popupDuoSaveurs, barPopupAromes] = await Promise.all([
      loadFlashBoostAromes().catch(() => []),
      loadSprayPlusAromes().catch(() => []),
      loadPopupDuoSaveurs().catch(() => []),
      loadBarPopupAromes().catch(() => [])
    ])

    // Combiner tous les tableaux
    const allAromes = [
      ...(Array.isArray(flashBoostAromes) ? flashBoostAromes : []),
      ...(Array.isArray(sprayPlusAromes) ? sprayPlusAromes : []),
      ...(Array.isArray(popupDuoSaveurs) ? popupDuoSaveurs : []),
      ...(Array.isArray(barPopupAromes) ? barPopupAromes : [])
    ]

    // Supprimer les doublons (insensible à la casse) et trier
    const uniqueAromes = Array.from(
      new Map(
        allAromes
          .filter(arome => arome && typeof arome === 'string' && arome.trim().length > 0)
          .map(arome => [arome.toLowerCase().trim(), arome.trim()])
      ).values()
    ).sort()

    return uniqueAromes
  } catch (error) {
    console.error('Erreur lors du chargement de tous les arômes et saveurs:', error)
    return []
  }
}

/**
 * Version synchrone (retourne un tableau vide, utilisez getAllAromesAndSaveurs() à la place)
 * @deprecated Utilisez getAllAromesAndSaveurs() qui est asynchrone
 */
export function getAllAromesAndSaveursSync(): string[] {
  console.warn('⚠️ getAllAromesAndSaveursSync() est déprécié. Utilisez getAllAromesAndSaveurs() à la place.')
  return []
}






