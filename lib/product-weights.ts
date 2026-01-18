/**
 * Configuration des poids des produits pour le calcul des frais d'expédition
 * Les poids sont récupérés depuis Supabase avec fallback sur les valeurs par défaut
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabase'

// Interface pour les poids des produits
export interface ProductWeight {
  id: string
  product_type: string
  conditionnement: string | null
  weight_kg: number
  description: string | null
  active: boolean
}

/**
 * Normalise un texte pour comparaison:
 * - minuscules
 * - suppression des accents
 * - espaces multiples réduits
 */
function normalizeText(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacritiques
    .replace(/\s+/g, ' ')
}

/**
 * Extrait un conditionnement depuis un texte libre.
 * Ex: "Sac 10 kilos" -> "10kg", "Farine 500 g" -> "500g", "2,5kg" -> "2.5kg"
 */
function extractConditionnementFromText(text: string): string | null {
  const raw = (text || '').toLowerCase()

  // Chercher d'abord un pattern kg/kilo/kilos
  const kg = raw.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilos)\b/)
  if (kg) {
    return normalizeConditionnement(`${kg[1]}kg`)
  }

  // Puis un pattern en grammes
  const g = raw.match(/(\d+)\s*(g|gr|gramme|grammes)\b/)
  if (g) {
    return normalizeConditionnement(`${g[1]}g`)
  }

  return null
}

// Cache des poids pour éviter trop de requêtes
let weightsCache: ProductWeight[] | null = null
let lastFetch = 0
const CACHE_DURATION = 60000 // 1 minute

// Poids des bouillettes par défaut selon le conditionnement (conditionnement + 10% emballage)
export const BOUILLETTE_WEIGHTS: Record<string, number> = {
  '1kg': 1.1,
  '2.5kg': 2.75,
  '5kg': 5.5,
  '10kg': 11,
}

// Poids des autres produits par défaut (en kg)
export const PRODUCT_WEIGHTS: Record<string, number> = {
  // Pop-ups et équilibrées
  'pop-up duo': 0.055,
  'popup duo': 0.055,
  'bar à pop-up': 0.075,
  'bar a pop-up': 0.075,
  'bar popup': 0.075,
  'pop-up personnalisé': 0.075,
  'equilibre': 0.110,
  'équilibre': 0.110,
  'équilibrée': 0.110,
  'equilibree': 0.110,
  
  // Sprays et boosts
  'flash boost': 0.150,
  'flash-boost': 0.150,
  'spray plus': 0.100,
  'spray-plus': 0.100,
  'spray+': 0.100,
  
  // Liquides
  'booster': 0.700,
  'booster liquide': 0.700,
  'huile': 0.700,
  'liquide': 0.700,
  
  // Stick mix et farines
  'stick mix': 1.1,
  'stick-mix': 1.1,
  'farine 1kg': 1.1,
  'farine 500g': 0.580,
  'bird food': 1.1,
  'robin red': 0.580,
}

/**
 * Récupère tous les poids depuis Supabase
 */
export async function getProductWeightsFromDB(): Promise<ProductWeight[]> {
  // Vérifier le cache
  if (weightsCache && Date.now() - lastFetch < CACHE_DURATION) {
    return weightsCache
  }

  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('product_weights')
      .select('*')
      .eq('active', true)
      .order('product_type', { ascending: true })

    if (error) {
      console.error('Erreur récupération poids:', error)
      return []
    }

    weightsCache = data || []
    lastFetch = Date.now()
    return weightsCache
  } catch (error) {
    console.error('Erreur récupération poids:', error)
    return []
  }
}

/**
 * Récupère tous les poids (pour l'admin)
 */
export async function getAllProductWeights(): Promise<ProductWeight[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('product_weights')
      .select('*')
      .order('product_type', { ascending: true })

    if (error) {
      console.error('Erreur récupération poids:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur récupération poids:', error)
    return []
  }
}

/**
 * Sauvegarde un poids (création ou mise à jour)
 */
export async function saveProductWeight(weight: Partial<ProductWeight>): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    if (weight.id) {
      // Mise à jour
      const { error } = await supabase
        .from('product_weights')
        .update({
          product_type: weight.product_type,
          conditionnement: weight.conditionnement || null,
          weight_kg: weight.weight_kg,
          description: weight.description,
          active: weight.active
        })
        .eq('id', weight.id)

      if (error) {
        console.error('Erreur mise à jour poids:', error)
        return false
      }
    } else {
      // Création
      const { error } = await supabase
        .from('product_weights')
        .insert([{
          product_type: weight.product_type,
          conditionnement: weight.conditionnement || null,
          weight_kg: weight.weight_kg,
          description: weight.description,
          active: weight.active !== false
        }])

      if (error) {
        console.error('Erreur création poids:', error)
        return false
      }
    }

    // Invalider le cache
    weightsCache = null
    return true
  } catch (error) {
    console.error('Erreur sauvegarde poids:', error)
    return false
  }
}

/**
 * Supprime un poids
 */
export async function deleteProductWeight(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('product_weights')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur suppression poids:', error)
      return false
    }

    // Invalider le cache
    weightsCache = null
    return true
  } catch (error) {
    console.error('Erreur suppression poids:', error)
    return false
  }
}

/**
 * Normalise un conditionnement pour la comparaison (10kg, 10 kg, 10KG -> 10kg)
 */
function normalizeConditionnement(cond: string | null): string {
  if (!cond) return ''
  
  // Nettoyer le conditionnement : minuscules, supprimer espaces
  const cleaned = cond.toLowerCase().replace(/\s+/g, '')

  // Formats stricts (les plus fiables)
  const kgMatch = cleaned.match(/^(\d+(?:[.,]\d+)?)kg$/)
  if (kgMatch) {
    return `${kgMatch[1].replace(',', '.')}kg`
  }
  const gMatch = cleaned.match(/^(\d+)g$/)
  if (gMatch) {
    return `${gMatch[1]}g`
  }

  // Fallbacks tolérants (ex: "2,5" sans kg, "500" sans g)
  if (cleaned.includes('2.5') || cleaned.includes('2,5')) return '2.5kg'
  if (/\b10\b/.test(cleaned) || cleaned === '10') return '10kg'
  if (/\b5\b/.test(cleaned) || cleaned === '5') return '5kg'
  if (/\b1\b/.test(cleaned) || cleaned === '1') return '1kg'
  if (cleaned.includes('500')) return '500g'

  return cleaned
}

/**
 * Trouve le poids d'un produit depuis la DB ou les valeurs par défaut
 */
async function findWeightFromDB(productType: string, conditionnement?: string): Promise<number | null> {
  const weights = await getProductWeightsFromDB()
  
  console.log(`  → findWeightFromDB: Recherche pour productType="${productType}", conditionnement="${conditionnement}"`)
  console.log(`  → Nombre d'entrées dans la DB: ${weights.length}`)
  
  if (weights.length === 0) {
    console.log(`  ⚠️ Aucune entrée dans la DB`)
    return null
  }
  
  // Afficher toutes les entrées de la DB pour debug
  console.log(`  → Entrées dans la DB:`)
  weights.forEach(w => {
    console.log(`    - ${w.product_type} | conditionnement: "${w.conditionnement || '(null)'}" | poids: ${w.weight_kg}kg | actif: ${w.active}`)
  })
  
  const normalizedProductType = normalizeText(productType)
  const normalizedCond = conditionnement ? normalizeConditionnement(conditionnement) : ''
  console.log(`  → Conditionnement normalisé: "${normalizedCond}"`)
  
  // Chercher une correspondance exacte
  const exactMatch = weights.find(w => {
    const typeMatch = normalizeText(w.product_type) === normalizedProductType
    if (!typeMatch) return false
    
    // Si le produit a un conditionnement, vérifier qu'il correspond
    if (normalizedCond && w.conditionnement) {
      const dbCond = normalizeConditionnement(w.conditionnement)
      const match = dbCond === normalizedCond
      console.log(`    → Comparaison exacte: "${w.product_type}" === "${productType}" && "${dbCond}" === "${normalizedCond}" → ${match}`)
      return match
    }
    
    // Si pas de conditionnement spécifié, prendre celui sans conditionnement
    if (!normalizedCond && !w.conditionnement) {
      console.log(`    → Correspondance sans conditionnement`)
      return true
    }
    
    return false
  })
  
  if (exactMatch) {
    console.log(`✅ Correspondance exacte trouvée: ${exactMatch.product_type} ${exactMatch.conditionnement || ''} = ${exactMatch.weight_kg}kg`)
    return exactMatch.weight_kg
  }
  
  // Chercher une correspondance partielle sur le type (sans conditionnement spécifique)
  const partialMatch = weights.find(w => {
    const wType = normalizeText(w.product_type)
    const typeMatch = normalizedProductType.includes(wType) || wType.includes(normalizedProductType)
    if (!typeMatch) return false
    
    // Si on cherche un conditionnement spécifique, il faut qu'il corresponde
    if (normalizedCond && w.conditionnement) {
      const dbCond = normalizeConditionnement(w.conditionnement)
      const match = dbCond === normalizedCond
      console.log(`    → Comparaison partielle: type match && "${dbCond}" === "${normalizedCond}" → ${match}`)
      return match
    }
    
    // Sinon, prendre le premier qui correspond au type
    if (!normalizedCond) {
      console.log(`    → Correspondance partielle sans conditionnement`)
      return true
    }
    
    return false
  })
  
  if (partialMatch) {
    console.log(`✅ Correspondance partielle trouvée: ${partialMatch.product_type} ${partialMatch.conditionnement || ''} = ${partialMatch.weight_kg}kg`)
    return partialMatch.weight_kg
  }
  
  console.log(`  ❌ Aucune correspondance trouvée`)
  return null
}

/**
 * Calcule le poids d'un article du panier
 */
export function getProductWeight(item: {
  produit?: string
  conditionnement?: string
  categorie?: string
  category?: string
  quantite?: number
  quantity?: number
  name?: string
  title?: string
}): number {
  const rawName = item.produit || item.name || item.title || ''
  const rawCategory = item.category || item.categorie || ''
  // Important: utiliser la category si elle existe (beaucoup plus stable que le nom commercial)
  const productName = normalizeText(rawCategory || rawName)
  const categoryName = normalizeText(rawCategory)
  // Si le conditionnement n'est pas fourni (produit sans variante), essayer de l'inférer depuis le nom
  const inferred = extractConditionnementFromText(rawName)
  const conditionnement = (item.conditionnement || inferred || '').toLowerCase().replace(/\s+/g, '') // Supprimer les espaces
  const quantity = item.quantite || item.quantity || 1
  
  console.log(`🔍 Calcul poids: produit="${productName}", conditionnement="${conditionnement}", qty=${quantity}`)
  
  // 1. Bouillettes - utiliser le conditionnement
  if (productName.includes('bouillette') || productName.includes('boilies') || categoryName.includes('bouillette')) {
    // Normaliser le conditionnement (1kg, 1 kg, 1KG, etc.)
    let normalizedCond = conditionnement
    if (conditionnement.includes('10')) normalizedCond = '10kg'
    else if (conditionnement.includes('5') && !conditionnement.includes('2.5')) normalizedCond = '5kg'
    else if (conditionnement.includes('2.5') || conditionnement.includes('2,5')) normalizedCond = '2.5kg'
    else if (conditionnement.includes('1')) normalizedCond = '1kg'
    
    const weight = BOUILLETTE_WEIGHTS[normalizedCond] || BOUILLETTE_WEIGHTS['1kg'] || 1.1
    console.log(`  → Bouillette détectée, conditionnement=${normalizedCond}, poids unitaire=${weight}kg`)
    return weight * quantity
  }
  
  // 2. Farines - vérifier le conditionnement
  if (productName.includes('farine') || categoryName.includes('farine')) {
    if (conditionnement.includes('500')) {
      console.log(`  → Farine 500g détectée`)
      return 0.580 * quantity
    }
    console.log(`  → Farine 1kg détectée`)
    return 1.1 * quantity // Par défaut 1kg
  }
  
  // 3. Autres produits - chercher par nom
  for (const [key, weight] of Object.entries(PRODUCT_WEIGHTS)) {
    if (productName.includes(key)) {
      console.log(`  → Produit "${key}" détecté, poids=${weight}kg`)
      return weight * quantity
    }
  }
  
  // 4. Fallback - poids par défaut de 0.5kg
  console.warn(`⚠️ Poids non trouvé pour "${productName}" (conditionnement: "${conditionnement}"), utilisation du poids par défaut (0.5kg)`)
  return 0.5 * quantity
}

/**
 * Calcule le poids d'un article en utilisant d'abord la DB puis les valeurs par défaut
 */
export async function getProductWeightAsync(item: {
  produit?: string
  conditionnement?: string
  categorie?: string
  category?: string
  quantite?: number
  quantity?: number
  name?: string
  title?: string
}): Promise<number> {
  const rawName = item.produit || item.name || item.title || ''
  const rawCategory = item.category || item.categorie || ''
  // Important: préférer la category (plus stable) au nom commercial
  const productName = normalizeText(rawCategory || rawName)
  const categoryName = normalizeText(rawCategory)
  const conditionnementOriginal = item.conditionnement || ''
  const inferred = extractConditionnementFromText(rawName) || extractConditionnementFromText(rawCategory)
  let conditionnement = (conditionnementOriginal || inferred || '').toLowerCase().replace(/\s+/g, '') // Supprimer les espaces
  const quantity = item.quantite || item.quantity || 1
  
  console.log(`🔍 getProductWeightAsync - produit="${productName}", conditionnement original="${conditionnementOriginal}", conditionnement nettoyé="${conditionnement}", qty=${quantity}`)
  
  // Normaliser le type de produit et le conditionnement pour la recherche en DB
  let productType = productName
  let normalizedConditionnement = conditionnement
  
  // 1. Bouillettes - normaliser le type et le conditionnement
  if (productName.includes('bouillette') || productName.includes('boilies') || categoryName.includes('bouillette')) {
    productType = 'bouillette'
    // Normaliser le conditionnement (1kg, 1 kg, 1KG, etc.)
    if (conditionnement.includes('10')) {
      normalizedConditionnement = '10kg'
    } else if (conditionnement.includes('5') && !conditionnement.includes('2.5') && !conditionnement.includes('2,5')) {
      normalizedConditionnement = '5kg'
    } else if (conditionnement.includes('2.5') || conditionnement.includes('2,5')) {
      normalizedConditionnement = '2.5kg'
    } else if (conditionnement.includes('1')) {
      normalizedConditionnement = '1kg'
    } else if (!conditionnement || conditionnement === '') {
      // Si on ne sait vraiment pas, on met 1kg par défaut
      normalizedConditionnement = '1kg'
    } else {
      // Garder le conditionnement tel quel si on ne peut pas le normaliser
      normalizedConditionnement = conditionnement
    }
    
    console.log(`  → Bouillette détectée: type="${productType}", conditionnement normalisé="${normalizedConditionnement}"`)
  }
  // 2. Farines
  else if (productName.includes('farine') || categoryName.includes('farine')) {
    productType = 'farine'
    if (conditionnement.includes('500')) {
      normalizedConditionnement = '500g'
    } else {
      normalizedConditionnement = '1kg'
    }
  }
  // 3. Autres catégories stables (éviter les soucis d'accents / pluriels)
  else if (categoryName.includes('equilibr')) {
    productType = 'equilibre'
    normalizedConditionnement = ''
  } else if (categoryName.includes('pop-up duo') || categoryName.includes('popup duo')) {
    productType = 'pop-up duo'
    normalizedConditionnement = ''
  } else if (categoryName.includes('bar a pop-up') || categoryName.includes('bar a pop up') || categoryName.includes('bar a popup') || categoryName.includes('bar a pop')) {
    productType = 'bar à pop-up'
    normalizedConditionnement = ''
  } else if (categoryName.includes('flash boost')) {
    productType = 'flash boost'
    normalizedConditionnement = ''
  } else if (categoryName.includes('spray plus') || categoryName.includes('spray+')) {
    productType = 'spray plus'
    normalizedConditionnement = ''
  } else if (categoryName.includes('stick mix')) {
    productType = 'stick mix'
    normalizedConditionnement = ''
  } else if (categoryName.includes('booster')) {
    productType = 'booster'
    normalizedConditionnement = ''
  } else if (categoryName.includes('huile')) {
    productType = 'huile'
    normalizedConditionnement = ''
  } else if (categoryName.includes('liquide')) {
    productType = 'liquide'
    normalizedConditionnement = ''
  } else if (categoryName.includes('bird food')) {
    productType = 'bird food'
    normalizedConditionnement = ''
  } else if (categoryName.includes('robin red')) {
    productType = 'robin red'
    normalizedConditionnement = ''
  }
  
  // Essayer de trouver dans la DB d'abord avec les valeurs normalisées
  console.log(`  → Recherche en DB: productType="${productType}", normalizedConditionnement="${normalizedConditionnement}"`)
  const dbWeight = await findWeightFromDB(productType, normalizedConditionnement || undefined)
  if (dbWeight !== null) {
    console.log(`✅ Poids trouvé en DB: ${dbWeight}kg pour ${productType} (${normalizedConditionnement}) x ${quantity} = ${dbWeight * quantity}kg`)
    return dbWeight * quantity
  }
  
  console.log(`⚠️ Poids non trouvé en DB pour ${productType} (${normalizedConditionnement}), utilisation des valeurs par défaut`)
  // Sinon utiliser la fonction synchrone avec les valeurs par défaut
  const fallbackWeight = getProductWeight(item)
  console.log(`  → Poids fallback: ${fallbackWeight}kg`)
  return fallbackWeight
}

/**
 * Calcule le poids total d'un panier
 */
export function calculateCartWeight(cartItems: Array<{
  produit?: string
  conditionnement?: string
  categorie?: string
  category?: string
  quantite?: number
  quantity?: number
}>): number {
  const totalWeight = cartItems.reduce((sum, item) => {
    return sum + getProductWeight(item)
  }, 0)
  
  // Minimum 0.5kg pour l'expédition
  return Math.max(totalWeight, 0.5)
}

/**
 * Calcule le poids total d'un panier (version async avec DB)
 */
export async function calculateCartWeightAsync(cartItems: Array<{
  produit?: string
  conditionnement?: string
  categorie?: string
  category?: string
  quantite?: number
  quantity?: number
  name?: string
  title?: string
}>): Promise<number> {
  console.log(`📦 calculateCartWeightAsync - ${cartItems.length} articles dans le panier`)
  
  const weights = await Promise.all(
    cartItems.map((item, index) => {
      console.log(`  → Article ${index + 1}:`, {
        produit: item.produit,
        conditionnement: item.conditionnement,
        quantite: item.quantite || item.quantity,
        category: item.category || item.categorie
      })
      return getProductWeightAsync(item)
    })
  )
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  
  console.log(`📦 Poids total calculé: ${totalWeight.toFixed(2)}kg (minimum: 0.5kg)`)
  
  // Minimum 0.5kg pour l'expédition
  return Math.max(totalWeight, 0.5)
}
