// Utilitaire pour exporter les produits au format CSV PrestaShop

import { Product, ProductVariant, loadProducts } from './products-manager'
import { loadStock, getAvailableStock } from './stock-manager'

// Mapping des catégories Next.js vers PrestaShop
const CATEGORY_MAPPING: Record<string, string> = {
  'bouillettes': 'Bouillettes',
  'équilibrées': 'Équilibrées',
  'équilibrés': 'Équilibrées',
  'huiles': 'Huiles et liquides',
  'farines': 'Farines',
  'pop-up duo': 'Pop-up Duo',
  'popups': 'Pop-up Duo',
  'bar à pop-up': 'Les Personnalisables',
  'flash boost': 'Les Personnalisables',
  'spray plus': 'Les Personnalisables',
  'boosters': 'Les Personnalisables',
  'stick mix': 'Les Personnalisables',
  'bird food': 'Les Personnalisables',
  'robin red': 'Huiles et liquides',
  'amicale-blanc': "L'amicale des pêcheurs au blanc"
}

/**
 * Convertit une image base64 en blob pour téléchargement
 */
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Télécharge une image base64 en fichier
 */
function downloadImage(base64: string, filename: string): void {
  const blob = base64ToBlob(base64)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Échappe les valeurs CSV (gère les guillemets et virgules)
 */
function escapeCSV(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Génère une référence unique pour un produit
 */
function generateReference(product: Product, variant?: ProductVariant): string {
  const base = product.name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)
  if (variant) {
    const variantPart = variant.label.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 10)
    return `${base}-${variantPart}`
  }
  return base
}

/**
 * Convertit un produit en ligne CSV PrestaShop
 */
function productToCSVRow(product: Product, variant?: ProductVariant, stock?: number): string[] {
  const name = variant ? `${product.name} - ${variant.label}` : product.name
  const reference = generateReference(product, variant)
  const price = variant ? variant.price : product.price
  const category = CATEGORY_MAPPING[product.category.toLowerCase()] || product.category
  const description = product.description || ''
  const gamme = product.gamme || ''
  const format = product.format || ''
  
  // Construire la description complète
  let fullDescription = description
  if (gamme) fullDescription += `\n\nGamme: ${gamme}`
  if (format) fullDescription += `\nFormat: ${format}`
  if (variant) {
    if (variant.diametre) fullDescription += `\nDiamètre: ${variant.diametre}`
    if (variant.conditionnement) fullDescription += `\nConditionnement: ${variant.conditionnement}`
    if (variant.taille) fullDescription += `\nTaille: ${variant.taille}`
    if (variant.couleur) fullDescription += `\nCouleur: ${variant.couleur}`
    if (variant.arome) fullDescription += `\nArôme: ${variant.arome}`
    if (variant.saveur) fullDescription += `\nSaveur: ${variant.saveur}`
    if (variant.forme) fullDescription += `\nForme: ${variant.forme}`
  }
  
  // Stock
  const stockValue = stock !== undefined ? stock : (product.available ? 999 : 0)
  
  // Images (on note juste le chemin, les images seront téléchargées séparément)
  const imagePath = variant 
    ? `images/${reference}.jpg`
    : `images/${reference}.jpg`
  
  return [
    escapeCSV(name),                    // Name
    escapeCSV(reference),               // Reference
    escapeCSV(price.toFixed(2)),        // Price (tax excl.)
    escapeCSV(category),                // Category
    escapeCSV(fullDescription),          // Description
    escapeCSV(imagePath),                // Image URL
    escapeCSV(stockValue),               // Quantity
    escapeCSV(product.available ? 1 : 0), // Active (1 = oui, 0 = non)
    escapeCSV(gamme),                   // Meta title (gamme)
    escapeCSV('')                       // Meta description
  ]
}

/**
 * Exporte tous les produits au format CSV PrestaShop
 */
export async function exportToPrestaShopCSV(): Promise<void> {
  const products = await loadProducts()
  const allStock = await loadStock()
  
  // En-têtes CSV PrestaShop
  const headers = [
    'Name',
    'Reference',
    'Price (tax excl.)',
    'Category',
    'Description',
    'Image URL',
    'Quantity',
    'Active',
    'Meta title',
    'Meta description'
  ]
  
  // Générer les lignes CSV
  const rows: string[][] = [headers]
  
  for (const product of products) {
    // Si le produit a des variantes, créer une ligne par variante
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        const stockKey = `${product.id}-${variant.id}`
        const stockItem = allStock[stockKey]
        const stock = stockItem ? stockItem.stock : await getAvailableStock(product.id, variant.id)
        // Si stock = -1 (illimité), mettre 999 pour PrestaShop
        const stockValue = stock === -1 ? 999 : stock
        rows.push(productToCSVRow(product, variant, stockValue))
      }
    } else {
      // Produit sans variantes
      const stockItem = allStock[product.id]
      const stock = stockItem ? stockItem.stock : await getAvailableStock(product.id)
      // Si stock = -1 (illimité), mettre 999 pour PrestaShop
      const stockValue = stock === -1 ? 999 : stock
      rows.push(productToCSVRow(product, undefined, stockValue))
    }
  }
  
  // Convertir en CSV
  const csvContent = rows.map(row => row.join(',')).join('\n')
  
  // Ajouter BOM pour Excel (UTF-8)
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csvContent
  
  // Télécharger le fichier
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export-prestashop-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  console.log(`✅ Export CSV terminé : ${rows.length - 1} produits exportés`)
}

/**
 * Exporte toutes les images des produits
 * Crée un dossier ZIP avec toutes les images
 */
export async function exportProductImages(): Promise<void> {
  const products = await loadProducts()
  const images: { base64: string; filename: string }[] = []
  
  products.forEach(product => {
    // Récupérer les images du produit
    const productImages = product.images || (product.image ? [product.image] : [])
    
    productImages.forEach((img, index) => {
      const reference = generateReference(product)
      const filename = index === 0 
        ? `${reference}.jpg`
        : `${reference}-${index + 1}.jpg`
      
      images.push({
        base64: img,
        filename
      })
    })
    
    // Si le produit a des variantes, on peut aussi exporter leurs images
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant, vIndex) => {
        const variantRef = generateReference(product, variant)
        if (productImages.length > 0) {
          images.push({
            base64: productImages[0], // Utiliser la première image du produit
            filename: `${variantRef}.jpg`
          })
        }
      })
    }
  })
  
  // Télécharger chaque image individuellement
  // Note: Pour créer un ZIP, il faudrait une bibliothèque comme JSZip
  console.log(`📸 ${images.length} images à télécharger`)
  
  // Télécharger les images une par une (avec un délai pour éviter de surcharger)
  for (let i = 0; i < images.length; i++) {
    setTimeout(() => {
      downloadImage(images[i].base64, images[i].filename)
    }, i * 200) // 200ms entre chaque téléchargement
  }
  
  alert(`Téléchargement de ${images.length} images en cours...`)
}

/**
 * Exporte un rapport détaillé (JSON) pour référence
 */
export async function exportDetailedReport(): Promise<void> {
  const products = await loadProducts()
  const allStock = await loadStock()

  const productReports: any[] = []

  for (const product of products) {
    const stockItem = allStock[product.id]
    const productStock = stockItem ? stockItem.stock : await getAvailableStock(product.id)

    const variants: any[] = []
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        const variantStockKey = `${product.id}-${variant.id}`
        const variantStockItem = allStock[variantStockKey]
        const variantStock = variantStockItem ? variantStockItem.stock : await getAvailableStock(product.id, variant.id)
        variants.push({
          ...variant,
          stock: variantStock === -1 ? 'illimité' : variantStock
        })
      }
    }

    productReports.push({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      gamme: product.gamme,
      format: product.format,
      description: product.description,
      available: product.available,
      stock: productStock === -1 ? 'illimité' : productStock,
      variants,
      imageCount: (product.images?.length || (product.image ? 1 : 0))
    })
  }

  const report = {
    exportDate: new Date().toISOString(),
    totalProducts: products.length,
    products: productReports
  }
  
  const jsonContent = JSON.stringify(report, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rapport-produits-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  console.log('✅ Rapport détaillé exporté')
}

