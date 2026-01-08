// Configuration des produits disponibles à "L'amicale des pêcheurs au blanc"
// Ce fichier sera mis à jour par l'interface admin

import { 
  GAMMES_BOUILLETTES, 
  DIAMETRES_BOUILLETTES, 
  CONDITIONNEMENTS, 
  encodeGamme,
  TAILLES_EQUILIBRES,
  SAVEURS_POPUP_DUO,
  FORMES_POPUP_DUO,
  COULEURS_FLUO,
  COULEURS_PASTEL,
  TAILLES_FLUO,
  TAILLES_PASTEL,
  AROMES
} from './constants'

export interface ProduitDisponible {
  id: string
  nom: string
  categorie: string
  gamme?: string
  diametre?: string
  conditionnement?: string
  taille?: string
  saveur?: string
  forme?: string
  couleur?: string
  arome?: string
  type?: string
  lien: string
}

// 1. BOUILLETTES (gamme × diamètre × conditionnement)
const bouillettes: ProduitDisponible[] = GAMMES_BOUILLETTES.flatMap(gamme =>
  DIAMETRES_BOUILLETTES.flatMap(diametre =>
    CONDITIONNEMENTS.map(conditionnement => ({
      id: `bouillette-${encodeGamme(gamme)}-${diametre}mm-${conditionnement}`,
      nom: `Bouillettes ${gamme} ${diametre}mm ${conditionnement}`,
      categorie: 'Bouillettes',
      gamme: gamme,
      diametre: diametre,
      conditionnement: conditionnement,
      lien: `/gammes/${encodeGamme(gamme)}`
    }))
  )
)

// 2. ÉQUILIBRÉES (gamme × taille)
const equilibrees: ProduitDisponible[] = GAMMES_BOUILLETTES.flatMap(gamme =>
  TAILLES_EQUILIBRES.map(taille => ({
    id: `equilibre-${encodeGamme(gamme)}-${taille}`,
    nom: `Équilibrée ${gamme} ${taille}`,
    categorie: 'Équilibrées',
    gamme: gamme,
    taille: taille,
    lien: `/gammes/${encodeGamme(gamme)}`
  }))
)

// 3. POP-UP DUO (saveur × forme)
const popupDuo: ProduitDisponible[] = SAVEURS_POPUP_DUO.flatMap(saveur =>
  FORMES_POPUP_DUO.map(forme => ({
    id: `popup-duo-${saveur.toLowerCase().replace(/\s+/g, '-')}-${forme.toLowerCase().replace(/\s+/g, '-')}`,
    nom: `Pop-up Duo ${saveur} ${forme}`,
    categorie: 'Pop-up Duo',
    saveur: saveur,
    forme: forme,
    lien: '/categories/popups'
  }))
)

// 4. BAR À POP-UP (couleur × taille × arôme)
const barPopup: ProduitDisponible[] = [...COULEURS_FLUO, ...COULEURS_PASTEL].flatMap(couleur => {
  const taillesDisponibles = couleur.type === 'fluo' ? TAILLES_FLUO : TAILLES_PASTEL
  return taillesDisponibles.flatMap(taille =>
    AROMES.map(arome => ({
      id: `bar-popup-${couleur.name.toLowerCase().replace(/\s+/g, '-')}-${taille.toLowerCase().replace(/\s+/g, '-')}-${arome.toLowerCase().replace(/\s+/g, '-')}`,
      nom: `Bar à Pop-up ${couleur.name} ${taille} ${arome}`,
      categorie: 'Bar à Pop-up',
      couleur: couleur.name,
      taille: taille,
      arome: arome,
      lien: '/bar-popup'
    }))
  )
})

// 5. FLASH BOOST (gamme)
const flashBoost: ProduitDisponible[] = GAMMES_BOUILLETTES.map(gamme => ({
  id: `flash-boost-${encodeGamme(gamme)}`,
  nom: `Flash boost ${gamme}`,
  categorie: 'Flash boost',
  gamme: gamme,
  lien: '/categories/personnalisables/flash-boost'
}))

// 6. SPRAY PLUS (gamme)
const sprayPlus: ProduitDisponible[] = GAMMES_BOUILLETTES.map(gamme => ({
  id: `spray-plus-${encodeGamme(gamme)}`,
  nom: `Spray plus ${gamme}`,
  categorie: 'Spray plus',
  gamme: gamme,
  lien: '/categories/personnalisables/spray-plus'
}))

// 7. BOOSTERS (gamme)
const boosters: ProduitDisponible[] = GAMMES_BOUILLETTES.map(gamme => ({
  id: `booster-${encodeGamme(gamme)}`,
  nom: `Booster ${gamme}`,
  categorie: 'Boosters',
  gamme: gamme,
  type: 'Booster liquide',
  lien: `/gammes/${encodeGamme(gamme)}`
}))

// 8. STICK MIX (gamme)
const stickMix: ProduitDisponible[] = GAMMES_BOUILLETTES.map(gamme => ({
  id: `stick-mix-${encodeGamme(gamme)}`,
  nom: `Stick mix ${gamme} 1kg`,
  categorie: 'Stick mix',
  gamme: gamme,
  conditionnement: '1kg',
  lien: `/gammes/${encodeGamme(gamme)}`
}))

// 9. PRODUITS SPÉCIFIQUES (huiles, liquides, farines, etc.)
const produitsSpecifiques: ProduitDisponible[] = [
  // Krill Calamar
  { id: 'liquide-krill-500ml', nom: 'Liquide de krill 500ml', categorie: 'Huiles', gamme: 'Krill Calamar', lien: '/gammes/krill-calamar' },
  { id: 'huile-poisson-sauvage-500ml', nom: 'Huile de poisson sauvage 500ml', categorie: 'Huiles', gamme: 'Krill Calamar', lien: '/gammes/krill-calamar' },
  { id: 'farine-krill-1kg', nom: 'Farine de krill 1kg', categorie: 'Farines', gamme: 'Krill Calamar', lien: '/gammes/krill-calamar' },
  { id: 'farine-calamar-1kg', nom: 'Farine de calamar 1kg', categorie: 'Farines', gamme: 'Krill Calamar', lien: '/gammes/krill-calamar' },
  
  // Méga Tutti
  { id: 'liqueur-mais-500ml', nom: 'Liqueur de maïs 500ml', categorie: 'Huiles', gamme: 'Méga Tutti', lien: '/gammes/mega-tutti' },
  { id: 'huile-chenevix-mega-500ml', nom: 'Huile de chènevis 500ml', categorie: 'Huiles', gamme: 'Méga Tutti', lien: '/gammes/mega-tutti' },
  { id: 'bird-food-fruit-1kg', nom: 'Bird food au fruit 1kg', categorie: 'Bird food', gamme: 'Méga Tutti', lien: '/gammes/mega-tutti' },
  
  // Red Devil
  { id: 'huile-red-devil-500ml', nom: 'Huile de red devil 500ml', categorie: 'Huiles', gamme: 'Red Devil', lien: '/gammes/red-devil' },
  { id: 'farine-paprika-1kg', nom: 'Farine de paprika 1kg', categorie: 'Farines', gamme: 'Red Devil', lien: '/gammes/red-devil' },
  { id: 'farine-chili-500g', nom: 'Farine de Chili 500g', categorie: 'Farines', gamme: 'Red Devil', lien: '/gammes/red-devil' },
  
  // Robin Red Vers de vase
  { id: 'liquide-vers-vase-500ml', nom: 'Liquide de vers de vase 500ml', categorie: 'Huiles', gamme: 'Robin Red Vers de vase', lien: '/gammes/robin-red-vers-de-vase' },
  { id: 'liquide-robin-red-500ml', nom: 'Liquide de robin red 500ml', categorie: 'Huiles', gamme: 'Robin Red Vers de vase', lien: '/gammes/robin-red-vers-de-vase' },
  { id: 'huile-saumon-500ml', nom: 'Huile de saumon 500ml', categorie: 'Huiles', gamme: 'Robin Red Vers de vase', lien: '/gammes/robin-red-vers-de-vase' },
  { id: 'robin-red-hait-europe-500gr', nom: 'Robin red hait\'s Europe 500gr', categorie: 'Robin Red', gamme: 'Robin Red Vers de vase', lien: '/gammes/robin-red-vers-de-vase' },
  
  // Mure Cassis
  { id: 'huile-chenevix-mure-500ml', nom: 'Huile de chènevis 500ml', categorie: 'Huiles', gamme: 'Mure Cassis', lien: '/gammes/mure-cassis' },
  { id: 'bird-food-fruit-mure-1kg', nom: 'Bird food au fruits 1kg', categorie: 'Bird food', gamme: 'Mure Cassis', lien: '/gammes/mure-cassis' },
  
  // Thon Curry
  { id: 'farine-thon-1kg', nom: 'Farine thon 1kg', categorie: 'Farines', gamme: 'Thon Curry', lien: '/gammes/thon-curry' },
  { id: 'farine-curry-1kg', nom: 'Farine de curry 1kg', categorie: 'Farines', gamme: 'Thon Curry', lien: '/gammes/thon-curry' },
]

// TOUS LES PRODUITS
export const TOUS_LES_PRODUITS: ProduitDisponible[] = [
  ...bouillettes,
  ...equilibrees,
  ...popupDuo,
  ...barPopup,
  ...flashBoost,
  ...sprayPlus,
  ...boosters,
  ...stickMix,
  ...produitsSpecifiques
]

// Produits disponibles par défaut (sera modifié par l'admin via localStorage)
export const PRODUITS_DISPONIBLES_AMICALE_BLANC_DEFAULT: string[] = [
  `bouillette-${encodeGamme('Krill Calamar')}-16mm-1kg`,
  `bouillette-${encodeGamme('Méga Tutti')}-10mm-2.5kg`,
]

// Export pour compatibilité
export const TOUTES_LES_BOUILLETTES = bouillettes