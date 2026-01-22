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

/**
 * Construit le nom complet d'un produit avec toutes ses variantes et conditionnements
 * Utilisé pour les factures et notifications Telegram
 */
export function buildProductNameWithVariants(item: {
  produit?: string
  name?: string
  product_id?: string
  arome?: string
  taille?: string
  couleur?: string
  diametre?: string
  conditionnement?: string
  forme?: string
  saveur?: string
  gamme?: string
}): string {
  // Récupérer le nom de base
  const baseName = 
    (typeof item.produit === 'string' && item.produit.trim() !== ''
      ? item.produit.trim()
      : typeof item.name === 'string' && item.name.trim() !== ''
        ? item.name.trim()
        : typeof item.product_id === 'string' && item.product_id.trim() !== ''
          ? item.product_id.trim()
          : 'Article') || 'Article'

  // Normaliser le nom pour détecter le type de produit
  const normalizedName = baseName.toLowerCase()

  // Tableau pour construire les variantes
  const variantParts: string[] = []

  // Bar à Pop-up : couleur, taille, arôme, conditionnement (45g)
  if (normalizedName.includes('bar') && normalizedName.includes('pop')) {
    if (item.couleur) variantParts.push(item.couleur)
    if (item.taille && !variantParts.includes(item.taille)) variantParts.push(item.taille)
    if (item.arome && !variantParts.includes(item.arome)) variantParts.push(item.arome)
    // Conditionnement fixe pour Bar à Pop-up
    variantParts.push('45g')
  }
  // Pop-up Duo : saveur, forme, conditionnement (30g)
  else if (normalizedName.includes('pop') && normalizedName.includes('duo')) {
    if (item.saveur) variantParts.push(item.saveur)
    // Fallback pour les anciennes commandes
    if (!item.saveur && item.arome) variantParts.push(item.arome)
    if (item.forme) variantParts.push(item.forme)
    // Fallback pour les anciennes commandes
    if (!item.forme && item.taille) variantParts.push(item.taille)
    // Conditionnement fixe pour Pop-up Duo
    variantParts.push('30g')
  }
  // Bouillettes : diamètre, conditionnement (variable)
  else if (normalizedName.includes('bouillette')) {
    if (item.diametre) variantParts.push(item.diametre)
    // Le conditionnement est variable pour les bouillettes
    if (item.conditionnement) variantParts.push(item.conditionnement)
  }
  // Spray Plus : arôme, conditionnement (30ml)
  else if (normalizedName.includes('spray') && normalizedName.includes('plus')) {
    if (item.arome) variantParts.push(item.arome)
    // Conditionnement fixe pour Spray Plus
    variantParts.push('30ml')
  }
  // Flash Boost : arôme, conditionnement (100ml)
  else if (normalizedName.includes('flash') && normalizedName.includes('boost')) {
    if (item.arome) variantParts.push(item.arome)
    // Conditionnement fixe pour Flash Boost
    variantParts.push('100ml')
  }
  // Booster : gamme, conditionnement (500ml)
  else if (normalizedName.includes('booster')) {
    if (item.gamme) variantParts.push(item.gamme)
    // Conditionnement fixe pour Booster
    variantParts.push('500ml')
  }
  // Stick Mix : gamme, conditionnement (1kg)
  else if (normalizedName.includes('stick') && normalizedName.includes('mix')) {
    if (item.gamme) variantParts.push(item.gamme)
    // Conditionnement fixe pour Stick Mix
    variantParts.push('1kg')
  }
  // Équilibre : taille, conditionnement (80g)
  else if (normalizedName.includes('equilibre') || normalizedName.includes('équilibré')) {
    if (item.taille) variantParts.push(item.taille)
    // Conditionnement fixe pour Équilibre
    variantParts.push('80g')
  }
  // Huile : conditionnement (500ml)
  else if (normalizedName.includes('huile')) {
    // Conditionnement fixe pour Huile
    variantParts.push('500ml')
  }
  // Autres produits : utiliser le conditionnement s'il existe
  else {
    // Pour les autres produits, ajouter les variantes disponibles
    if (item.saveur) variantParts.push(item.saveur)
    if (item.arome && !variantParts.includes(item.arome)) variantParts.push(item.arome)
    if (item.forme) variantParts.push(item.forme)
    if (item.taille && !variantParts.includes(item.taille)) variantParts.push(item.taille)
    if (item.couleur && !variantParts.includes(item.couleur)) variantParts.push(item.couleur)
    if (item.diametre && !variantParts.includes(item.diametre)) variantParts.push(item.diametre)
    if (item.gamme && !variantParts.includes(item.gamme)) variantParts.push(item.gamme)
    // Ajouter le conditionnement s'il existe
    if (item.conditionnement) variantParts.push(item.conditionnement)
  }

  // Construire le nom final
  if (variantParts.length > 0) {
    return `${baseName} - ${variantParts.join(' - ')}`
  }

  return baseName
}
















