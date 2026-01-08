// Fonction utilitaire pour créer automatiquement le stock lors de l'ajout de variables
import { loadProducts, addProduct, getProductsByCategory, updateProduct } from './products-manager'
import { updateStock, loadStock } from './stock-manager'
import type { Product, ProductVariant } from './products-manager'
import { loadPopupDuoFormes } from './popup-variables-manager'
import { loadFlashBoostFormats, loadSprayPlusFormats } from './flash-spray-variables-manager'

/**
 * Crée le stock pour tous les produits Pop-up Duo qui utilisent une saveur spécifique
 * Si le produit n'existe pas, il est créé automatiquement avec toutes les formes disponibles
 */
export async function createStockForPopupDuoSaveur(saveur: string): Promise<{ created: number; errors: number }> {
  console.log(`🔍 Recherche des produits Pop-up Duo avec la saveur "${saveur}"...`)
  const products = await loadProducts()
  console.log(`📦 Total de produits chargés: ${products.length}`)
  
  const productName = `Pop-up Duo ${saveur}`
  let popupDuoProduct = products.find(p => 
    p.category.toLowerCase() === 'pop-up duo' && 
    p.name.toLowerCase() === productName.toLowerCase()
  )
  
  // Si le produit n'existe pas, le créer avec toutes les formes disponibles
  if (!popupDuoProduct) {
    console.log(`📦 Produit "${productName}" n'existe pas, création en cours...`)
    try {
      const formes = await loadPopupDuoFormes()
      console.log(`📋 Formes disponibles: ${formes.length}`, formes)
      
      if (formes.length === 0) {
        console.warn(`⚠️ Aucune forme disponible pour créer le produit "${productName}"`)
        return { created: 0, errors: 0 }
      }
      
      const formesPrixReduit = ['10mm', '16mm', 'Dumbels 12/16mm', 'Cocoon 10/8mm']
      const variants: ProductVariant[] = formes.map(forme => ({
        id: `variant-${forme}`,
        label: forme,
        price: formesPrixReduit.includes(forme) ? 7.99 : 8.99,
        available: true,
        forme: forme,
        saveur: saveur
      }))
      
      popupDuoProduct = await addProduct({
        name: productName,
        category: 'pop-up duo',
        price: Math.min(...variants.map(v => v.price)),
        description: `Pop-up Duo ${saveur}. Appât flottant efficace pour la pêche au blanc.`,
        available: true,
        variants: variants
      })
      
      console.log(`✅ Produit "${productName}" créé avec ${variants.length} variante(s)`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création du produit "${productName}":`, error)
      return { created: 0, errors: 1 }
    }
  } else {
    console.log(`✅ Produit "${productName}" existe déjà (ID: ${popupDuoProduct.id})`)
  }
  
  let created = 0
  let errors = 0
  
  if (popupDuoProduct && popupDuoProduct.variants && popupDuoProduct.variants.length > 0) {
    console.log(`📋 ${popupDuoProduct.variants.length} variante(s) à traiter`)
    
    for (const variant of popupDuoProduct.variants) {
      // Vérifier si la variante utilise cette saveur
      if (variant.saveur === saveur) {
        try {
          const allStock = await loadStock('general')
          const stockKey = `${popupDuoProduct.id}-${variant.id}`
          
          if (!allStock[stockKey]) {
            console.log(`💾 Création du stock pour la variante "${variant.label}"...`)
            await updateStock(popupDuoProduct.id, 0, variant.id, 'general')
            created++
            console.log(`✅ Stock créé pour Pop-up Duo "${popupDuoProduct.name}" - variante "${variant.label}"`)
          } else {
            console.log(`ℹ️ Stock déjà existant pour la variante "${variant.label}"`)
          }
        } catch (error) {
          errors++
          console.error(`❌ Erreur lors de la création du stock pour ${popupDuoProduct.name} - ${variant.label}:`, error)
        }
      }
    }
  } else {
    console.warn(`⚠️ Produit "${productName}" n'a pas de variantes`)
  }
  
  console.log(`📊 Résumé: ${created} créé(s), ${errors} erreur(s)`)
  return { created, errors }
}

/**
 * Crée le stock pour toutes les variantes Pop-up Duo qui utilisent une forme spécifique
 * Pour tous les produits Pop-up Duo existants, ajoute cette forme comme nouvelle variante si elle n'existe pas
 */
export async function createStockForPopupDuoForme(forme: string): Promise<{ created: number; errors: number }> {
  console.log(`🔍 Recherche des variantes Pop-up Duo avec la forme "${forme}"...`)
  const products = await loadProducts()
  const popupDuoProducts = products.filter(p => p.category.toLowerCase() === 'pop-up duo')
  
  console.log(`📋 Produits Pop-up Duo trouvés: ${popupDuoProducts.length}`)
  
  let created = 0
  let errors = 0
  
  for (const product of popupDuoProducts) {
    console.log(`🔎 Traitement du produit "${product.name}" (ID: ${product.id})`)
    
    // Vérifier si une variante avec cette forme existe déjà
    const existingVariant = product.variants?.find(v => v.forme === forme)
    
    if (existingVariant) {
      // La variante existe, créer le stock si nécessaire
      try {
        const allStock = await loadStock('general')
        const stockKey = `${product.id}-${existingVariant.id}`
        
        if (!allStock[stockKey]) {
          console.log(`💾 Création du stock pour la variante "${existingVariant.label}"...`)
          await updateStock(product.id, 0, existingVariant.id, 'general')
          created++
          console.log(`✅ Stock créé pour Pop-up Duo "${product.name}" - variante "${existingVariant.label}"`)
        } else {
          console.log(`ℹ️ Stock déjà existant pour la variante "${existingVariant.label}"`)
        }
      } catch (error) {
        errors++
        console.error(`❌ Erreur lors de la création du stock pour ${product.name} - ${existingVariant.label}:`, error)
      }
    } else {
      // La variante n'existe pas, l'ajouter au produit
      console.log(`📦 Ajout de la variante "${forme}" au produit "${product.name}"...`)
      try {
        const { updateProduct } = await import('./products-manager')
        const formesPrixReduit = ['10mm', '16mm', 'Dumbels 12/16mm', 'Cocoon 10/8mm']
        const newVariant: ProductVariant = {
          id: `variant-${forme}`,
          label: forme,
          price: formesPrixReduit.includes(forme) ? 7.99 : 8.99,
          available: true,
          forme: forme,
          saveur: product.name.replace('Pop-up Duo ', '').trim() // Extraire la saveur du nom du produit
        }
        
        const updatedVariants = [...(product.variants || []), newVariant]
        await updateProduct(product.id, { ...product, variants: updatedVariants })
        
        // Créer le stock pour la nouvelle variante
        await updateStock(product.id, 0, newVariant.id, 'general')
        created++
        console.log(`✅ Variante "${forme}" ajoutée et stock créé pour "${product.name}"`)
      } catch (error) {
        errors++
        console.error(`❌ Erreur lors de l'ajout de la variante "${forme}" au produit "${product.name}":`, error)
      }
    }
  }
  
  console.log(`📊 Résumé: ${created} créé(s), ${errors} erreur(s)`)
  return { created, errors }
}

/**
 * Crée le stock pour toutes les variantes Bar à Pop-up qui utilisent un arôme spécifique
 */
export async function createStockForBarPopupArome(arome: string): Promise<{ created: number; errors: number }> {
  const products = await loadProducts()
  const barPopupProducts = products.filter(p => p.category.toLowerCase() === 'bar à pop-up')
  
  let created = 0
  let errors = 0
  
  for (const product of barPopupProducts) {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        // Vérifier si la variante utilise cet arôme
        if (variant.arome === arome) {
          try {
            const allStock = await loadStock('general')
            const stockKey = `${product.id}-${variant.id}`
            
            if (!allStock[stockKey]) {
              await updateStock(product.id, 0, variant.id, 'general')
              created++
              console.log(`✅ Stock créé pour Bar à Pop-up "${product.name}" - variante "${variant.label}"`)
            }
          } catch (error) {
            errors++
            console.error(`❌ Erreur lors de la création du stock pour ${product.name} - ${variant.label}:`, error)
          }
        }
      }
    }
  }
  
  return { created, errors }
}

/**
 * Crée le stock pour toutes les variantes Bar à Pop-up qui utilisent une couleur spécifique
 */
export async function createStockForBarPopupCouleur(couleur: string): Promise<{ created: number; errors: number }> {
  const products = await loadProducts()
  const barPopupProducts = products.filter(p => 
    p.category.toLowerCase() === 'bar à pop-up' &&
    p.name.toLowerCase().includes(couleur.toLowerCase())
  )
  
  let created = 0
  let errors = 0
  
  for (const product of barPopupProducts) {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        // Vérifier si la variante utilise cette couleur
        if (variant.couleur === couleur) {
          try {
            const allStock = await loadStock('general')
            const stockKey = `${product.id}-${variant.id}`
            
            if (!allStock[stockKey]) {
              await updateStock(product.id, 0, variant.id, 'general')
              created++
              console.log(`✅ Stock créé pour Bar à Pop-up "${product.name}" - variante "${variant.label}"`)
            }
          } catch (error) {
            errors++
            console.error(`❌ Erreur lors de la création du stock pour ${product.name} - ${variant.label}:`, error)
          }
        }
      }
    }
  }
  
  return { created, errors }
}

/**
 * Crée le stock pour toutes les variantes Bar à Pop-up qui utilisent une taille spécifique
 */
export async function createStockForBarPopupTaille(taille: string): Promise<{ created: number; errors: number }> {
  const products = await loadProducts()
  const barPopupProducts = products.filter(p => p.category.toLowerCase() === 'bar à pop-up')
  
  let created = 0
  let errors = 0
  
  for (const product of barPopupProducts) {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        // Vérifier si la variante utilise cette taille
        if (variant.taille === taille) {
          try {
            const allStock = await loadStock('general')
            const stockKey = `${product.id}-${variant.id}`
            
            if (!allStock[stockKey]) {
              await updateStock(product.id, 0, variant.id, 'general')
              created++
              console.log(`✅ Stock créé pour Bar à Pop-up "${product.name}" - variante "${variant.label}"`)
            }
          } catch (error) {
            errors++
            console.error(`❌ Erreur lors de la création du stock pour ${product.name} - ${variant.label}:`, error)
          }
        }
      }
    }
  }
  
  return { created, errors }
}

/**
 * Crée le stock pour toutes les variantes Flash Boost qui utilisent un arôme spécifique
 * Si le produit n'existe pas, il est créé automatiquement avec toutes les variantes (arôme + formats)
 */
export async function createStockForFlashBoostArome(arome: string): Promise<{ created: number; errors: number }> {
  console.log(`🔍 Recherche des produits Flash Boost avec l'arôme "${arome}"...`)
  const products = await loadProducts()
  
  const productName = `Flash boost ${arome}`
  let flashBoostProduct = products.find(p => 
    p.category.toLowerCase() === 'flash boost' && 
    p.name.toLowerCase() === productName.toLowerCase()
  )
  
  // Si le produit n'existe pas, le créer avec toutes les variantes (arôme + formats)
  if (!flashBoostProduct) {
    console.log(`📦 Produit "${productName}" n'existe pas, création en cours...`)
    try {
      const formats = await loadFlashBoostFormats()
      console.log(`📋 Formats disponibles: ${formats.length}`, formats)
      
      if (formats.length === 0) {
        console.warn(`⚠️ Aucun format disponible pour créer le produit "${productName}"`)
        return { created: 0, errors: 0 }
      }
      
      // Créer les variantes avec arôme + format
      const variants: ProductVariant[] = formats.map(format => ({
        id: `variant-${arome}-${format}`,
        label: `${arome} - ${format}`,
        price: 10.99,
        available: true,
        arome: arome,
        format: format
      }))
      
      flashBoostProduct = await addProduct({
        name: productName,
        category: 'flash boost',
        price: 10.99,
        gamme: arome,
        description: `Flash boost ${arome}. Stimulant puissant pour activer l'appétit des poissons.`,
        available: true,
        variants: variants
      })
      
      console.log(`✅ Produit "${productName}" créé avec ${variants.length} variante(s)`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création du produit "${productName}":`, error)
      return { created: 0, errors: 1 }
    }
  } else {
    console.log(`✅ Produit "${productName}" existe déjà (ID: ${flashBoostProduct.id})`)
    
    // Vérifier si une variante avec cet arôme existe, sinon l'ajouter
    const formats = await loadFlashBoostFormats()
    const existingVariants = flashBoostProduct.variants || []
    
    for (const format of formats) {
      const variantExists = existingVariants.some(v => 
        v.arome === arome && v.format === format
      )
      
      if (!variantExists) {
        console.log(`📦 Ajout de la variante "${arome} - ${format}" au produit "${productName}"...`)
        try {
          const newVariant: ProductVariant = {
            id: `variant-${arome}-${format}`,
            label: `${arome} - ${format}`,
            price: 10.99,
            available: true,
            arome: arome,
            format: format
          }
          
          const updatedVariants = [...existingVariants, newVariant]
          await updateProduct(flashBoostProduct.id, { ...flashBoostProduct, variants: updatedVariants })
          flashBoostProduct.variants = updatedVariants
          console.log(`✅ Variante "${arome} - ${format}" ajoutée`)
        } catch (error) {
          console.error(`❌ Erreur lors de l'ajout de la variante:`, error)
        }
      }
    }
  }
  
  let created = 0
  let errors = 0
  
  if (flashBoostProduct) {
    // Créer le stock pour toutes les variantes qui utilisent cet arôme
    if (flashBoostProduct.variants && flashBoostProduct.variants.length > 0) {
      for (const variant of flashBoostProduct.variants) {
        if (variant.arome === arome) {
          try {
            const allStock = await loadStock('general')
            const stockKey = `${flashBoostProduct.id}-${variant.id}`
            
            if (!allStock[stockKey]) {
              console.log(`💾 Création du stock pour la variante "${variant.label}"...`)
              await updateStock(flashBoostProduct.id, 0, variant.id, 'general')
              created++
              console.log(`✅ Stock créé pour Flash Boost "${flashBoostProduct.name}" - variante "${variant.label}"`)
            } else {
              console.log(`ℹ️ Stock déjà existant pour la variante "${variant.label}"`)
            }
          } catch (error) {
            errors++
            console.error(`❌ Erreur lors de la création du stock pour ${flashBoostProduct.name} - ${variant.label}:`, error)
          }
        }
      }
    } else {
      // Si le produit n'a pas de variantes, créer le stock pour le produit lui-même
      try {
        const allStock = await loadStock('general')
        const stockKey = flashBoostProduct.id
        
        if (!allStock[stockKey]) {
          await updateStock(flashBoostProduct.id, 0, undefined, 'general')
          created++
          console.log(`✅ Stock créé pour Flash Boost "${flashBoostProduct.name}" (sans variantes)`)
        }
      } catch (error) {
        errors++
        console.error(`❌ Erreur lors de la création du stock pour ${flashBoostProduct.name}:`, error)
      }
    }
  }
  
  console.log(`📊 Résumé: ${created} créé(s), ${errors} erreur(s)`)
  return { created, errors }
}

/**
 * Crée automatiquement tous les produits Flash boost et Spray plus manquants
 * pour toutes les saveurs Pop-up Duo existantes
 */
export async function createMissingFlashBoostAndSprayPlus(): Promise<{
  flashBoost: { created: number; errors: number; details: string[] }
  sprayPlus: { created: number; errors: number; details: string[] }
}> {
  console.log('🚀 Démarrage de la création des produits Flash boost et Spray plus manquants...')
  
  // Charger toutes les saveurs Pop-up Duo
  const { loadPopupDuoSaveurs } = await import('./popup-variables-manager')
  const saveurs = await loadPopupDuoSaveurs()
  
  console.log(`📋 Saveurs Pop-up Duo trouvées: ${saveurs.length}`, saveurs)
  
  const flashBoostResults = {
    created: 0,
    errors: 0,
    details: [] as string[]
  }
  
  const sprayPlusResults = {
    created: 0,
    errors: 0,
    details: [] as string[]
  }
  
  // Traiter chaque saveur
  for (const saveur of saveurs) {
    console.log(`\n🔍 Traitement de la saveur: "${saveur}"`)
    
    // Créer Flash boost pour cette saveur
    try {
      const flashBoostResult = await createStockForFlashBoostArome(saveur)
      flashBoostResults.created += flashBoostResult.created
      flashBoostResults.errors += flashBoostResult.errors
      
      if (flashBoostResult.created > 0) {
        flashBoostResults.details.push(`✅ Flash boost "${saveur}": ${flashBoostResult.created} variante(s) créée(s)`)
      } else if (flashBoostResult.errors > 0) {
        flashBoostResults.details.push(`❌ Flash boost "${saveur}": ${flashBoostResult.errors} erreur(s)`)
      } else {
        flashBoostResults.details.push(`ℹ️ Flash boost "${saveur}": déjà existant`)
      }
    } catch (error: any) {
      flashBoostResults.errors++
      flashBoostResults.details.push(`❌ Flash boost "${saveur}": ${error?.message || 'Erreur inconnue'}`)
      console.error(`❌ Erreur lors de la création de Flash boost pour "${saveur}":`, error)
    }
    
    // Créer Spray plus pour cette saveur
    try {
      const sprayPlusResult = await createStockForSprayPlusArome(saveur)
      sprayPlusResults.created += sprayPlusResult.created
      sprayPlusResults.errors += sprayPlusResult.errors
      
      if (sprayPlusResult.created > 0) {
        sprayPlusResults.details.push(`✅ Spray plus "${saveur}": ${sprayPlusResult.created} variante(s) créée(s)`)
      } else if (sprayPlusResult.errors > 0) {
        sprayPlusResults.details.push(`❌ Spray plus "${saveur}": ${sprayPlusResult.errors} erreur(s)`)
      } else {
        sprayPlusResults.details.push(`ℹ️ Spray plus "${saveur}": déjà existant`)
      }
    } catch (error: any) {
      sprayPlusResults.errors++
      sprayPlusResults.details.push(`❌ Spray plus "${saveur}": ${error?.message || 'Erreur inconnue'}`)
      console.error(`❌ Erreur lors de la création de Spray plus pour "${saveur}":`, error)
    }
  }
  
  console.log('\n📊 Résumé final:')
  console.log(`Flash boost: ${flashBoostResults.created} créé(s), ${flashBoostResults.errors} erreur(s)`)
  console.log(`Spray plus: ${sprayPlusResults.created} créé(s), ${sprayPlusResults.errors} erreur(s)`)
  
  return {
    flashBoost: flashBoostResults,
    sprayPlus: sprayPlusResults
  }
}

/**
 * Crée le stock pour toutes les variantes Flash Boost qui utilisent un format spécifique
 * Pour tous les produits Flash Boost existants, ajoute ce format comme nouvelle variante si nécessaire
 */
export async function createStockForFlashBoostFormat(format: string): Promise<{ created: number; errors: number }> {
  console.log(`🔍 Recherche des variantes Flash Boost avec le format "${format}"...`)
  const products = await loadProducts()
  const flashBoostProducts = products.filter(p => p.category.toLowerCase() === 'flash boost')
  
  console.log(`📋 Produits Flash Boost trouvés: ${flashBoostProducts.length}`)
  
  let created = 0
  let errors = 0
  
  // Charger tous les arômes disponibles
  const { loadFlashBoostAromes } = await import('./flash-spray-variables-manager')
  const aromes = await loadFlashBoostAromes()
  
  for (const product of flashBoostProducts) {
    console.log(`🔎 Traitement du produit "${product.name}" (ID: ${product.id})`)
    
    const existingVariants = product.variants || []
    const productArome = product.gamme || product.name.replace('Flash boost ', '').trim()
    
    // Vérifier si une variante avec ce format existe déjà
    const variantExists = existingVariants.some(v => v.format === format && v.arome === productArome)
    
    if (!variantExists) {
      // Ajouter la variante manquante
      console.log(`📦 Ajout de la variante "${productArome} - ${format}" au produit "${product.name}"...`)
      try {
        const newVariant: ProductVariant = {
          id: `variant-${productArome}-${format}`,
          label: `${productArome} - ${format}`,
          price: 10.99,
          available: true,
          arome: productArome,
          format: format
        }
        
        const updatedVariants = [...existingVariants, newVariant]
        await updateProduct(product.id, { ...product, variants: updatedVariants })
        product.variants = updatedVariants
        console.log(`✅ Variante "${productArome} - ${format}" ajoutée`)
      } catch (error) {
        errors++
        console.error(`❌ Erreur lors de l'ajout de la variante:`, error)
        continue
      }
    }
    
    // Créer le stock pour toutes les variantes qui utilisent ce format
    for (const variant of product.variants || []) {
      if (variant.format === format) {
        try {
          const allStock = await loadStock('general')
          const stockKey = `${product.id}-${variant.id}`
          
          if (!allStock[stockKey]) {
            console.log(`💾 Création du stock pour la variante "${variant.label}"...`)
            await updateStock(product.id, 0, variant.id, 'general')
            created++
            console.log(`✅ Stock créé pour Flash Boost "${product.name}" - variante "${variant.label}"`)
          } else {
            console.log(`ℹ️ Stock déjà existant pour la variante "${variant.label}"`)
          }
        } catch (error) {
          errors++
          console.error(`❌ Erreur lors de la création du stock pour ${product.name} - ${variant.label}:`, error)
        }
      }
    }
  }
  
  console.log(`📊 Résumé: ${created} créé(s), ${errors} erreur(s)`)
  return { created, errors }
}

/**
 * Crée le stock pour toutes les variantes Spray Plus qui utilisent un arôme spécifique
 * Si le produit n'existe pas, il est créé automatiquement avec toutes les variantes (arôme + formats)
 */
export async function createStockForSprayPlusArome(arome: string): Promise<{ created: number; errors: number }> {
  console.log(`🔍 Recherche des produits Spray Plus avec l'arôme "${arome}"...`)
  const products = await loadProducts()
  
  const productName = `Spray plus ${arome}`
  let sprayPlusProduct = products.find(p => 
    p.category.toLowerCase() === 'spray plus' && 
    p.name.toLowerCase() === productName.toLowerCase()
  )
  
  // Si le produit n'existe pas, le créer avec toutes les variantes (arôme + formats)
  if (!sprayPlusProduct) {
    console.log(`📦 Produit "${productName}" n'existe pas, création en cours...`)
    try {
      const formats = await loadSprayPlusFormats()
      console.log(`📋 Formats disponibles: ${formats.length}`, formats)
      
      if (formats.length === 0) {
        console.warn(`⚠️ Aucun format disponible pour créer le produit "${productName}"`)
        return { created: 0, errors: 0 }
      }
      
      // Créer les variantes avec arôme + format
      const variants: ProductVariant[] = formats.map(format => ({
        id: `variant-${arome}-${format}`,
        label: `${arome} - ${format}`,
        price: 5.99,
        available: true,
        arome: arome,
        format: format
      }))
      
      sprayPlusProduct = await addProduct({
        name: productName,
        category: 'spray plus',
        price: 5.99,
        gamme: arome,
        description: `Spray plus ${arome}. Vaporisateur d'arômes concentrés pour renforcer vos appâts.`,
        available: true,
        variants: variants
      })
      
      console.log(`✅ Produit "${productName}" créé avec ${variants.length} variante(s)`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création du produit "${productName}":`, error)
      return { created: 0, errors: 1 }
    }
  } else {
    console.log(`✅ Produit "${productName}" existe déjà (ID: ${sprayPlusProduct.id})`)
    
    // Vérifier si une variante avec cet arôme existe, sinon l'ajouter
    const formats = await loadSprayPlusFormats()
    const existingVariants = sprayPlusProduct.variants || []
    
    for (const format of formats) {
      const variantExists = existingVariants.some(v => 
        v.arome === arome && v.format === format
      )
      
      if (!variantExists) {
        console.log(`📦 Ajout de la variante "${arome} - ${format}" au produit "${productName}"...`)
        try {
          const newVariant: ProductVariant = {
            id: `variant-${arome}-${format}`,
            label: `${arome} - ${format}`,
            price: 5.99,
            available: true,
            arome: arome,
            format: format
          }
          
          const updatedVariants = [...existingVariants, newVariant]
          await updateProduct(sprayPlusProduct.id, { ...sprayPlusProduct, variants: updatedVariants })
          sprayPlusProduct.variants = updatedVariants
          console.log(`✅ Variante "${arome} - ${format}" ajoutée`)
        } catch (error) {
          console.error(`❌ Erreur lors de l'ajout de la variante:`, error)
        }
      }
    }
  }
  
  let created = 0
  let errors = 0
  
  if (sprayPlusProduct) {
    // Créer le stock pour toutes les variantes qui utilisent cet arôme
    if (sprayPlusProduct.variants && sprayPlusProduct.variants.length > 0) {
      for (const variant of sprayPlusProduct.variants) {
        if (variant.arome === arome) {
          try {
            const allStock = await loadStock('general')
            const stockKey = `${sprayPlusProduct.id}-${variant.id}`
            
            if (!allStock[stockKey]) {
              console.log(`💾 Création du stock pour la variante "${variant.label}"...`)
              await updateStock(sprayPlusProduct.id, 0, variant.id, 'general')
              created++
              console.log(`✅ Stock créé pour Spray Plus "${sprayPlusProduct.name}" - variante "${variant.label}"`)
            } else {
              console.log(`ℹ️ Stock déjà existant pour la variante "${variant.label}"`)
            }
          } catch (error) {
            errors++
            console.error(`❌ Erreur lors de la création du stock pour ${sprayPlusProduct.name} - ${variant.label}:`, error)
          }
        }
      }
    } else {
      // Si le produit n'a pas de variantes, créer le stock pour le produit lui-même
      try {
        const allStock = await loadStock('general')
        const stockKey = sprayPlusProduct.id
        
        if (!allStock[stockKey]) {
          await updateStock(sprayPlusProduct.id, 0, undefined, 'general')
          created++
          console.log(`✅ Stock créé pour Spray Plus "${sprayPlusProduct.name}" (sans variantes)`)
        }
      } catch (error) {
        errors++
        console.error(`❌ Erreur lors de la création du stock pour ${sprayPlusProduct.name}:`, error)
      }
    }
  }
  
  console.log(`📊 Résumé: ${created} créé(s), ${errors} erreur(s)`)
  return { created, errors }
}

/**
 * Crée le stock pour toutes les variantes Spray Plus qui utilisent un format spécifique
 * Pour tous les produits Spray Plus existants, ajoute ce format comme nouvelle variante si nécessaire
 */
export async function createStockForSprayPlusFormat(format: string): Promise<{ created: number; errors: number }> {
  console.log(`🔍 Recherche des variantes Spray Plus avec le format "${format}"...`)
  const products = await loadProducts()
  const sprayPlusProducts = products.filter(p => p.category.toLowerCase() === 'spray plus')
  
  console.log(`📋 Produits Spray Plus trouvés: ${sprayPlusProducts.length}`)
  
  let created = 0
  let errors = 0
  
  // Charger tous les arômes disponibles
  const { loadSprayPlusAromes } = await import('./flash-spray-variables-manager')
  const aromes = await loadSprayPlusAromes()
  
  for (const product of sprayPlusProducts) {
    console.log(`🔎 Traitement du produit "${product.name}" (ID: ${product.id})`)
    
    const existingVariants = product.variants || []
    const productArome = product.gamme || product.name.replace('Spray plus ', '').trim()
    
    // Vérifier si une variante avec ce format existe déjà
    const variantExists = existingVariants.some(v => v.format === format && v.arome === productArome)
    
    if (!variantExists) {
      // Ajouter la variante manquante
      console.log(`📦 Ajout de la variante "${productArome} - ${format}" au produit "${product.name}"...`)
      try {
        const newVariant: ProductVariant = {
          id: `variant-${productArome}-${format}`,
          label: `${productArome} - ${format}`,
          price: 5.99,
          available: true,
          arome: productArome,
          format: format
        }
        
        const updatedVariants = [...existingVariants, newVariant]
        await updateProduct(product.id, { ...product, variants: updatedVariants })
        product.variants = updatedVariants
        console.log(`✅ Variante "${productArome} - ${format}" ajoutée`)
      } catch (error) {
        errors++
        console.error(`❌ Erreur lors de l'ajout de la variante:`, error)
        continue
      }
    }
    
    // Créer le stock pour toutes les variantes qui utilisent ce format
    for (const variant of product.variants || []) {
      if (variant.format === format) {
        try {
          const allStock = await loadStock('general')
          const stockKey = `${product.id}-${variant.id}`
          
          if (!allStock[stockKey]) {
            console.log(`💾 Création du stock pour la variante "${variant.label}"...`)
            await updateStock(product.id, 0, variant.id, 'general')
            created++
            console.log(`✅ Stock créé pour Spray Plus "${product.name}" - variante "${variant.label}"`)
          } else {
            console.log(`ℹ️ Stock déjà existant pour la variante "${variant.label}"`)
          }
        } catch (error) {
          errors++
          console.error(`❌ Erreur lors de la création du stock pour ${product.name} - ${variant.label}:`, error)
        }
      }
    }
  }
  
  console.log(`📊 Résumé: ${created} créé(s), ${errors} erreur(s)`)
  return { created, errors }
}