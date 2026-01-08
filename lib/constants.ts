// Gammes de bouillettes
export const GAMMES_BOUILLETTES = [
  'Méga Tutti',
  'Krill Calamar',
  'Red Devil',
  'Robin Red Vers de vase',
  'Mure Cassis',
  'Thon Curry'
]

// Fonctions pour encoder/décoder les noms de gamme dans les URLs
export const encodeGamme = (gamme: string): string => {
  return gamme.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a')
}

export const decodeGamme = (encoded: string): string => {
  // Trouver la gamme correspondante dans les gammes par défaut
  const found = GAMMES_BOUILLETTES.find(g => 
    encodeGamme(g) === encoded
  )
  if (found) return found
  
  // Sinon, essayer de charger depuis localStorage (côté client uniquement)
  if (typeof window !== 'undefined') {
    try {
      // Charger depuis les gammes personnalisées
      const saved = localStorage.getItem('site-gammes')
      if (saved) {
        const customGammes = JSON.parse(saved)
        const allGammes = [...GAMMES_BOUILLETTES, ...customGammes]
        const foundCustom = allGammes.find(g => 
          encodeGamme(g) === encoded
        )
        if (foundCustom) return foundCustom
      }
      
      // Charger aussi depuis les produits (pour trouver toutes les gammes utilisées)
      const productsSaved = localStorage.getItem('site-products-manager')
      if (productsSaved) {
        const products = JSON.parse(productsSaved)
        const uniqueGammes = new Set<string>()
        products.forEach((product: any) => {
          if (product.gamme) {
            uniqueGammes.add(product.gamme)
          }
        })
        
        const foundInProducts = Array.from(uniqueGammes).find(g => 
          encodeGamme(g) === encoded
        )
        if (foundInProducts) return foundInProducts
      }
    } catch (e) {
      // Ignorer les erreurs
    }
  }
  
  // En dernier recours, retourner l'URL décodée telle quelle (sans capitalisation)
  // pour éviter les erreurs d'hydratation - on garde la casse originale de l'URL
  return encoded.replace(/-/g, ' ')
}

// Arômes disponibles pour Flash boost, Spray plus et Bar à pop-up
export const AROMES = [
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

// Diamètres pour bouillettes
export const DIAMETRES_BOUILLETTES = ['10', '16', '20']

// Conditionnements
export const CONDITIONNEMENTS = ['1kg', '2.5kg', '5kg', '10kg']

// Couleurs pour pop-ups
// Couleurs fluo disponibles en 10mm, 12mm, dumbells 12/15, 15mm, 20mm
export const COULEURS_FLUO = [
  { name: 'Jaune fluo', value: '#FFFF00', type: 'fluo' },
  { name: 'Blanc', value: '#FFFFFF', type: 'fluo' },
  { name: 'Rose fluo', value: '#FF1493', type: 'fluo' },
  { name: 'Vert fluo', value: '#00FF00', type: 'fluo' },
  { name: 'Violet', value: '#A855F7', type: 'fluo' },
  { name: 'Orange fluo', value: '#FF6600', type: 'fluo' },
  { name: 'Bleu fluo', value: '#00BFFF', type: 'fluo' },
]

// Couleurs pastel disponibles en 12mm et 15mm
export const COULEURS_PASTEL = [
  { name: 'Rose pastel', value: '#FFB6C1', type: 'pastel' },
  { name: 'Jaune pastel', value: '#FFEB3B', type: 'pastel' },
  { name: 'Orange pastel', value: '#FF9800', type: 'pastel' },
]

// Toutes les couleurs pop-up (pour compatibilité)
export const COULEURS_POPUP = [...COULEURS_FLUO, ...COULEURS_PASTEL]

// Tailles disponibles pour les couleurs fluo
export const TAILLES_FLUO = ['10mm', '12mm', 'Dumbells 12/15', '15mm', '20mm']

// Tailles disponibles pour les couleurs pastel
export const TAILLES_PASTEL = ['12mm', '15mm']

// Tailles pour pop-ups
export const TAILLES_POPUP = [
  '8mm',
  '10mm',
  '12mm',
  '14mm',
  '16mm',
  '18mm',
  '20mm'
]

// Tailles pour équilibrées
export const TAILLES_EQUILIBRES = ['10mm', '16mm', '20mm', 'Dumbels 12/16']

// Types de boosters
export const TYPES_BOOSTERS = ['Booster liquide']

// Saveurs pour Pop-up Duo
export const SAVEURS_POPUP_DUO = [
  'Mûre cassis',
  'Acid banane ananas',
  'Thon pêche',
  'Maïs crème',
  'Mangue bergamote'
]

// Formes pour Pop-up Duo
export const FORMES_POPUP_DUO = [
  '10mm',
  '16mm',
  'Dumbels 12/16mm',
  'Cocoon 10/8mm',
  'Cocoon 15/12mm',
  'Snail shell',
  'Crub 18x13mm',
  'Maïs 14x10mm'
]