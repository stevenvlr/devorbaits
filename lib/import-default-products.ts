// Script d'import des produits par défaut dans le gestionnaire de produits

import { addProduct, loadProducts, loadProductsSync, updateProduct, type Product, type ProductVariant } from './products-manager'
import { 
  GAMMES_BOUILLETTES, 
  DIAMETRES_BOUILLETTES, 
  CONDITIONNEMENTS, 
  TAILLES_EQUILIBRES,
  SAVEURS_POPUP_DUO,
  FORMES_POPUP_DUO,
  COULEURS_FLUO,
  COULEURS_PASTEL,
  TAILLES_FLUO,
  TAILLES_PASTEL,
  AROMES
} from './constants'

// Produits par défaut à importer
const PRODUITS_HUILES_DEFAUT = [
  { name: 'Liquide de krill', gamme: 'Krill Calamar', prix: 11.99, format: '500 ml' },
  { name: 'Huile de poisson sauvage', gamme: 'Krill Calamar', prix: 11.99, format: '500 ml' },
  { name: 'Liqueur de maïs', gamme: 'Méga Tutti', prix: 9.99, format: '500 ml' },
  { name: 'Huile de chènevis', gamme: 'Méga Tutti', prix: 11.99, format: '500 ml' },
  { name: 'Huile de red devil', gamme: 'Red Devil', prix: 10.99, format: '500 ml' },
  { name: 'Liquide de vers de vase', gamme: 'Robin Red Vers de vase', prix: 11.99, format: '500 ml' },
  { name: 'Liquide de robin red', gamme: 'Robin Red Vers de vase', prix: 10.99, format: '500 ml' },
  { name: 'Huile de saumon', gamme: 'Robin Red Vers de vase', prix: 9.99, format: '500 ml' },
  { name: 'Huile de chènevis', gamme: 'Mure Cassis', prix: 11.99, format: '500 ml' },
]

const PRODUITS_FARINES = [
  { name: 'Farine de krill', gamme: 'Krill Calamar', prix: 12.99, format: '1 kg' },
  { name: 'Farine de calamar', gamme: 'Krill Calamar', prix: 12.99, format: '1 kg' },
  { name: 'Farine de paprika', gamme: 'Red Devil', prix: 11.99, format: '1 kg' },
  { name: 'Farine de Chili', gamme: 'Red Devil', prix: 10.99, format: '500 g' },
  { name: 'Farine thon', gamme: 'Thon Curry', prix: 11.99, format: '1 kg' },
  { name: 'Farine de curry', gamme: 'Thon Curry', prix: 11.99, format: '1 kg' },
]

const PRODUITS_BIRD_FOOD = [
  { name: 'Bird food au fruit', gamme: 'Méga Tutti', prix: 10.99, format: '1 kg' },
  { name: 'Bird food au fruits', gamme: 'Mure Cassis', prix: 10.99, format: '1 kg' },
]

const PRODUITS_ROBIN_RED = [
  { name: 'Robin red hait\'s Europe', gamme: 'Robin Red Vers de vase', prix: 10.99, format: '500 gr' },
]

/**
 * Génère une description courte selon le type de produit
 */
function getProductDescription(name: string, category: string, gamme?: string): string {
  const categoryLower = category.toLowerCase()
  
  if (categoryLower === 'bouillettes') {
    return `Bouillettes artisanales de la gamme ${gamme || 'premium'}. Qualité française, saveurs authentiques pour une pêche réussie.`
  }
  
  if (categoryLower === 'équilibrées' || categoryLower === 'équilibrés') {
    return `Appâts équilibrés ${gamme ? `de la gamme ${gamme}` : 'premium'}. Parfaits pour tous types de pêche, texture et saveur optimisées.`
  }
  
  if (categoryLower === 'huiles') {
    if (name.toLowerCase().includes('krill')) {
      return 'Huile de krill riche en protéines. Attire efficacement les poissons avec son arôme puissant et naturel.'
    }
    if (name.toLowerCase().includes('poisson sauvage')) {
      return 'Huile de poisson sauvage premium. Arôme intense et naturel pour maximiser vos prises.'
    }
    if (name.toLowerCase().includes('maïs')) {
      return 'Liqueur de maïs sucrée. Attire les poissons blancs avec son parfum doux et enivrant.'
    }
    if (name.toLowerCase().includes('chènevis')) {
      return 'Huile de chènevis naturelle. Arôme discret et efficace pour une pêche en douceur.'
    }
    if (name.toLowerCase().includes('red devil')) {
      return 'Huile Red Devil aux saveurs épicées. Attire les poissons avec son arôme puissant et caractéristique.'
    }
    if (name.toLowerCase().includes('vers de vase')) {
      return 'Liquide de vers de vase concentré. Arôme naturel très attractif pour les poissons carnassiers.'
    }
    if (name.toLowerCase().includes('robin red')) {
      return 'Liquide Robin Red authentique. Saveur unique et reconnue pour une pêche efficace.'
    }
    if (name.toLowerCase().includes('saumon')) {
      return 'Huile de saumon premium. Riche en oméga-3, arôme puissant et naturel.'
    }
    return `Huile ${gamme ? `de la gamme ${gamme}` : 'premium'}. Qualité française pour optimiser vos sessions de pêche.`
  }
  
  if (categoryLower === 'farines') {
    if (name.toLowerCase().includes('krill')) {
      return 'Farine de krill riche en protéines. Parfaite pour enrichir vos amorces et appâts.'
    }
    if (name.toLowerCase().includes('calamar')) {
      return 'Farine de calamar séchée. Texture fine et arôme puissant pour vos préparations.'
    }
    if (name.toLowerCase().includes('paprika')) {
      return 'Farine de paprika colorante. Donne une teinte rouge naturelle à vos appâts.'
    }
    if (name.toLowerCase().includes('chili')) {
      return 'Farine de chili épicée. Ajoute du piquant à vos préparations pour attirer les poissons.'
    }
    if (name.toLowerCase().includes('thon')) {
      return 'Farine de thon séchée. Riche en protéines et arôme puissant pour vos amorces.'
    }
    if (name.toLowerCase().includes('curry')) {
      return 'Farine de curry parfumée. Saveur épicée et exotique pour vos appâts.'
    }
    return `Farine ${gamme ? `de la gamme ${gamme}` : 'premium'}. Qualité française pour vos préparations.`
  }
  
  if (categoryLower === 'bird food') {
    return `Bird food aux fruits ${gamme ? `de la gamme ${gamme}` : 'premium'}. Mélange nutritif et attractif pour les poissons.`
  }
  
  if (categoryLower === 'robin red') {
    return 'Robin Red authentique. Produit de référence pour la pêche, qualité européenne.'
  }
  
  if (categoryLower === 'pop-up duo') {
    return `Pop-up Duo ${gamme ? `de la gamme ${gamme}` : 'premium'}. Appât flottant efficace pour la pêche au blanc.`
  }
  
  if (categoryLower === 'bar à pop-up') {
    return `Bar à Pop-up ${gamme ? `de la gamme ${gamme}` : 'premium'}. Appât pratique et efficace pour tous types de pêche.`
  }
  
  if (categoryLower === 'flash boost') {
    return `Flash boost ${gamme ? `de la gamme ${gamme}` : 'premium'}. Stimulant puissant pour activer l\'appétit des poissons.`
  }
  
  if (categoryLower === 'spray plus') {
    return `Spray plus ${gamme ? `de la gamme ${gamme}` : 'premium'}. Vaporisateur d\'arômes concentrés pour renforcer vos appâts.`
  }
  
  if (categoryLower === 'boosters') {
    return `Booster ${gamme ? `de la gamme ${gamme}` : 'premium'}. Complément nutritionnel pour enrichir vos amorces.`
  }
  
  if (categoryLower === 'stick mix') {
    return `Stick mix ${gamme ? `de la gamme ${gamme}` : 'premium'}. Mélange prêt à l'emploi pour une pêche efficace.`
  }
  
  return `Produit ${gamme ? `de la gamme ${gamme}` : 'premium'}. Qualité française pour optimiser vos sessions de pêche.`
}

/**
 * Vérifie si un produit existe déjà (par nom et catégorie)
 */
function productExists(name: string, category: string): boolean {
  const products = loadProductsSync()
  return products.some(p => 
    p.name.toLowerCase() === name.toLowerCase() && 
    p.category.toLowerCase() === category.toLowerCase()
  )
}

/**
 * Importe tous les produits par défaut dans le gestionnaire
 * @returns Résultat de l'import avec nombre de succès et erreurs
 */
export async function importDefaultProducts(): Promise<{ success: number; skipped: number; errors: string[] }> {
  const errors: string[] = []
  let successCount = 0
  let skippedCount = 0

    // Importer les huiles
    for (const produit of PRODUITS_HUILES_DEFAUT) {
      try {
        if (productExists(produit.name, 'huiles')) {
          skippedCount++
          continue
        }
        await addProduct({
        name: produit.name,
        category: 'huiles',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'huiles', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  // Importer les farines
  for (const produit of PRODUITS_FARINES) {
    try {
      if (productExists(produit.name, 'farines')) {
        skippedCount++
        continue
      }
      await addProduct({
        name: produit.name,
        category: 'farines',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'farines', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  // Importer les bird food
  for (const produit of PRODUITS_BIRD_FOOD) {
    try {
      if (productExists(produit.name, 'bird food')) {
        skippedCount++
        continue
      }
      await addProduct({
        name: produit.name,
        category: 'bird food',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'bird food', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  // Importer les robin red
  for (const produit of PRODUITS_ROBIN_RED) {
    try {
      if (productExists(produit.name, 'robin red')) {
        skippedCount++
        continue
      }
      await addProduct({
        name: produit.name,
        category: 'robin red',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'robin red', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  return { success: successCount, skipped: skippedCount, errors }
}

/**
 * Calcule le prix d'une bouillette selon diamètre, conditionnement et gamme
 */
function calculateBouillettePrice(diametre: string, conditionnement: string, gamme: string): number {
  const is10mm = diametre === '10'
  const isRobinRed = gamme === 'Robin Red Vers de vase'
  const isMureCassis = gamme === 'Mure Cassis'
  let basePrice = 0
  
  if (conditionnement === '1kg') {
    basePrice = is10mm ? 11.99 : 9.99
  } else if (conditionnement === '2.5kg') {
    basePrice = is10mm ? 28.99 : 23.99
  } else if (conditionnement === '5kg') {
    basePrice = is10mm ? 56.99 : 46.99
  } else if (conditionnement === '10kg') {
    basePrice = is10mm ? 109.99 : 89.99
  } else {
    basePrice = 9.99
  }
  
  return (isRobinRed || isMureCassis) ? basePrice + 2 : basePrice
}

/**
 * Importe tous les produits de l'amicale des pêcheurs au blanc avec variantes regroupées
 */
export async function importAmicaleBlancProducts(): Promise<{ success: number; skipped: number; errors: string[] }> {
  const errors: string[] = []
  let successCount = 0
  let skippedCount = 0

  // 1. BOUILLETTES - Regrouper par gamme avec toutes les variantes
  for (const gamme of GAMMES_BOUILLETTES) {
    try {
      const productName = `Bouillettes ${gamme}`
      if (productExists(productName, 'bouillettes')) {
        skippedCount++
        continue
      }

      // Créer toutes les variantes (diamètre × conditionnement)
      const variants: ProductVariant[] = []
      for (const diametre of DIAMETRES_BOUILLETTES) {
        for (const conditionnement of CONDITIONNEMENTS) {
          const price = calculateBouillettePrice(diametre, conditionnement, gamme)
          variants.push({
            id: `variant-${diametre}-${conditionnement}`,
            label: `${diametre}mm - ${conditionnement}`,
            price: price,
            available: true,
            diametre: diametre,
            conditionnement: conditionnement
          })
        }
      }

      if (variants.length === 0) {
        errors.push(`Aucune variante pour Bouillettes ${gamme}`)
        continue
      }

      await addProduct({
        name: productName,
        category: 'bouillettes',
        price: Math.min(...variants.map(v => v.price)), // Prix minimum comme prix de base
        gamme: gamme,
        description: getProductDescription(productName, 'bouillettes', gamme),
        available: true,
        variants: variants
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Bouillettes ${gamme}: ${error}`)
    }
  }

  // 2. ÉQUILIBRÉES - Regrouper par gamme avec toutes les variantes
  for (const gamme of GAMMES_BOUILLETTES) {
    try {
      const productName = `Équilibrée ${gamme}`
      if (productExists(productName, 'équilibrées')) {
        skippedCount++
        continue
      }

      // Créer toutes les variantes (taille)
      const variants: ProductVariant[] = TAILLES_EQUILIBRES.map(taille => ({
        id: `variant-${taille}`,
        label: taille,
        price: 8.99,
        available: true,
        taille: taille
      }))

      if (variants.length === 0) {
        errors.push(`Aucune variante pour Équilibrée ${gamme}`)
        continue
      }

      await addProduct({
        name: productName,
        category: 'équilibrées',
        price: 8.99,
        gamme: gamme,
        description: getProductDescription(productName, 'équilibrées', gamme),
        available: true,
        variants: variants
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Équilibrée ${gamme}: ${error}`)
    }
  }

  // 3. POP-UP DUO - Regrouper par saveur avec toutes les formes
  for (const saveur of SAVEURS_POPUP_DUO) {
    try {
      const productName = `Pop-up Duo ${saveur}`
      if (productExists(productName, 'pop-up duo')) {
        skippedCount++
        continue
      }

      // Créer toutes les variantes (forme)
      const formesPrixReduit = ['10mm', '16mm', 'Dumbels 12/16mm', 'Cocoon 10/8mm']
      const variants: ProductVariant[] = FORMES_POPUP_DUO.map(forme => ({
        id: `variant-${forme}`,
        label: forme,
        price: formesPrixReduit.includes(forme) ? 7.99 : 8.99,
        available: true,
        forme: forme,
        saveur: saveur
      }))

      if (variants.length === 0) {
        errors.push(`Aucune variante pour Pop-up Duo ${saveur}`)
        continue
      }

      await addProduct({
        name: productName,
        category: 'pop-up duo',
        price: Math.min(...variants.map(v => v.price)), // Prix minimum
        description: getProductDescription(productName, 'pop-up duo', saveur),
        available: true,
        variants: variants
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Pop-up Duo ${saveur}: ${error}`)
    }
  }

  // 4. BAR À POP-UP - Regrouper par couleur avec toutes les tailles et arômes
  const toutesCouleurs = [...COULEURS_FLUO, ...COULEURS_PASTEL]
  for (const couleur of toutesCouleurs) {
    try {
      const productName = `Bar à Pop-up ${couleur.name}`
      if (productExists(productName, 'bar à pop-up')) {
        skippedCount++
        continue
      }

      const taillesDisponibles = couleur.type === 'fluo' ? TAILLES_FLUO : TAILLES_PASTEL
      const variants: ProductVariant[] = []
      
      for (const taille of taillesDisponibles) {
        for (const arome of AROMES) {
          variants.push({
            id: `variant-${taille}-${arome}`,
            label: `${taille} - ${arome}`,
            price: 6.99,
            available: true,
            taille: taille,
            arome: arome,
            couleur: couleur.name
          })
        }
      }

      if (variants.length === 0) {
        errors.push(`Aucune variante pour Bar à Pop-up ${couleur.name}`)
        continue
      }

      await addProduct({
        name: productName,
        category: 'bar à pop-up',
        price: 6.99,
        description: getProductDescription(productName, 'bar à pop-up', couleur.name),
        available: true,
        variants: variants
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Bar à Pop-up ${couleur.name}: ${error}`)
    }
  }

  // 5. FLASH BOOST - Un produit par gamme
  for (const gamme of GAMMES_BOUILLETTES) {
    try {
      const productName = `Flash boost ${gamme}`
      if (productExists(productName, 'flash boost')) {
        skippedCount++
        continue
      }

      await addProduct({
        name: productName,
        category: 'flash boost',
        price: 10.99,
        gamme: gamme,
        description: getProductDescription(productName, 'flash boost', gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Flash boost ${gamme}: ${error}`)
    }
  }

  // 6. SPRAY PLUS - Un produit par gamme
  for (const gamme of GAMMES_BOUILLETTES) {
    try {
      const productName = `Spray plus ${gamme}`
      if (productExists(productName, 'spray plus')) {
        skippedCount++
        continue
      }

      await addProduct({
        name: productName,
        category: 'spray plus',
        price: 5.99,
        gamme: gamme,
        description: getProductDescription(productName, 'spray plus', gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Spray plus ${gamme}: ${error}`)
    }
  }

  // 7. BOOSTERS - Un produit par gamme
  for (const gamme of GAMMES_BOUILLETTES) {
    try {
      const productName = `Booster ${gamme}`
      if (productExists(productName, 'boosters')) {
        skippedCount++
        continue
      }

      await addProduct({
        name: productName,
        category: 'boosters',
        price: 14.99,
        gamme: gamme,
        description: getProductDescription(productName, 'boosters', gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Booster ${gamme}: ${error}`)
    }
  }

  // 8. STICK MIX - Un produit par gamme
  for (const gamme of GAMMES_BOUILLETTES) {
    try {
      const productName = `Stick mix ${gamme}`
      if (productExists(productName, 'stick mix')) {
        skippedCount++
        continue
      }

      await addProduct({
        name: productName,
        category: 'stick mix',
        price: 8.99,
        gamme: gamme,
        format: '1kg',
        description: getProductDescription(productName, 'stick mix', gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour Stick mix ${gamme}: ${error}`)
    }
  }

  // 9. FARINES - Importer les farines avec leurs gammes
  for (const produit of PRODUITS_FARINES) {
    try {
      if (productExists(produit.name, 'farines')) {
        skippedCount++
        continue
      }
      await addProduct({
        name: produit.name,
        category: 'farines',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'farines', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  // 10. HUILES ET LIQUIDES - Importer les huiles et liquides avec leurs gammes
  for (const produit of PRODUITS_HUILES_DEFAUT) {
    try {
      if (productExists(produit.name, 'huiles')) {
        skippedCount++
        continue
      }
      await addProduct({
        name: produit.name,
        category: 'huiles',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'huiles', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  // 11. BIRD FOOD - Importer les bird food avec leurs gammes
  for (const produit of PRODUITS_BIRD_FOOD) {
    try {
      if (productExists(produit.name, 'bird food')) {
        skippedCount++
        continue
      }
      await addProduct({
        name: produit.name,
        category: 'bird food',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'bird food', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  // 12. ROBIN RED - Importer les robin red avec leurs gammes
  for (const produit of PRODUITS_ROBIN_RED) {
    try {
      if (productExists(produit.name, 'robin red')) {
        skippedCount++
        continue
      }
      await addProduct({
        name: produit.name,
        category: 'robin red',
        price: produit.prix,
        gamme: produit.gamme,
        format: produit.format,
        description: getProductDescription(produit.name, 'robin red', produit.gamme),
        available: true
      })
      successCount++
    } catch (error) {
      errors.push(`Erreur pour ${produit.name}: ${error}`)
    }
  }

  return { success: successCount, skipped: skippedCount, errors }
}

/**
 * Ajoute des descriptions aux produits existants qui n'en ont pas
 */
export async function addDescriptionsToExistingProducts(): Promise<{ updated: number; errors: string[] }> {
  const products = await loadProducts()
  const errors: string[] = []
  let updatedCount = 0

  for (const product of products) {
    // Si le produit n'a pas de description, en ajouter une
    if (!product.description || product.description.trim() === '') {
      try {
        const description = getProductDescription(product.name, product.category, product.gamme)
        await updateProduct(product.id, { description })
        updatedCount++
      } catch (error) {
        errors.push(`Erreur pour ${product.name}: ${error}`)
      }
    }
  }

  return { updated: updatedCount, errors }
}
