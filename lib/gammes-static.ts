// Fichier pour générer les gammes statiques pour le build
// Ce fichier sera utilisé par generateStaticParams() pour pré-générer toutes les pages

import { GAMMES_BOUILLETTES } from './constants'

// Cette fonction sera appelée au build pour obtenir toutes les gammes
// Pour un export statique, on ne peut pas accéder à localStorage côté serveur
// Donc on utilise les gammes par défaut + un fichier JSON si disponible
export function getAllGammesForBuild(): string[] {
  const gammes = new Set<string>(GAMMES_BOUILLETTES)
  
  if (typeof window === 'undefined') {
    // Côté serveur (build time) - on ne peut pas accéder à localStorage
    // Essayer de charger depuis un fichier JSON (créé par un script avant le build)
    try {
      const fs = require('fs')
      const path = require('path')
      const gammesFile = path.join(process.cwd(), 'data', 'gammes.json')
      if (fs.existsSync(gammesFile)) {
        const data = JSON.parse(fs.readFileSync(gammesFile, 'utf8'))
        data.forEach((gamme: string) => gammes.add(gamme))
      }
    } catch (e) {
      // Fichier non trouvé, on utilise seulement les gammes par défaut
    }
  } else {
    // Côté client (dev mode) - on peut accéder à localStorage
    try {
      // Charger depuis localStorage (gammes personnalisées)
      const saved = localStorage.getItem('site-gammes')
      if (saved) {
        const customGammes = JSON.parse(saved)
        customGammes.forEach((gamme: string) => gammes.add(gamme))
      }
      
      // Charger depuis les produits (toutes les gammes utilisées)
      const { loadProducts } = require('./products-manager')
      const products = loadProducts()
      products.forEach((product: any) => {
        if (product.gamme) {
          gammes.add(product.gamme)
        }
      })
    } catch (e) {
      // Erreur, on utilise seulement les gammes par défaut
      console.warn('Erreur lors du chargement des gammes:', e)
    }
  }
  
  return Array.from(gammes)
}

