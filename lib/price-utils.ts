import { encodeGamme } from './constants'
import { applyGlobalPromotion, type GlobalPromotion } from './global-promotion-manager'

export function getPrixPersonnalise(
  prixPersonnalises: Record<string, number>,
  productId: string,
  prixParDefaut: number,
  promotion?: GlobalPromotion | null,
  productCategory?: string,
  productGamme?: string
): number {
  const prix = prixPersonnalises[productId] ?? prixParDefaut
  
  // Appliquer la promotion globale si elle existe
  if (promotion) {
    return applyGlobalPromotion(prix, promotion, productCategory, productGamme)
  }
  
  return prix
}

// Fonctions pour générer les IDs (même format que dans amicale-blanc-config.ts)
export function getBouilletteId(gamme: string, diametre: string, conditionnement: string): string {
  return `bouillette-${encodeGamme(gamme)}-${diametre}mm-${conditionnement}`
}

export function getEquilibreId(gamme: string, taille: string): string {
  return `equilibre-${encodeGamme(gamme)}-${taille}`
}

export function getPopUpDuoId(saveur: string, forme: string): string {
  return `popup-duo-${saveur.toLowerCase().replace(/\s+/g, '-')}-${forme.toLowerCase().replace(/\s+/g, '-')}`
}

export function getBarPopupId(couleur: string, taille: string, arome: string): string {
  return `bar-popup-${couleur.toLowerCase().replace(/\s+/g, '-')}-${taille.toLowerCase().replace(/\s+/g, '-')}-${arome.toLowerCase().replace(/\s+/g, '-')}`
}

export function getFlashBoostId(gamme: string): string {
  return `flash-boost-${encodeGamme(gamme)}`
}

export function getSprayPlusId(gamme: string): string {
  return `spray-plus-${encodeGamme(gamme)}`
}

export function getBoosterId(gamme: string): string {
  return `booster-${encodeGamme(gamme)}`
}

export function getStickMixId(gamme: string): string {
  return `stick-mix-${encodeGamme(gamme)}`
}
















