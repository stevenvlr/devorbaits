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
 * Trouve le poids d'un produit depuis la DB ou les valeurs par défaut
 */
async function findWeightFromDB(productType: string, conditionnement?: string): Promise<number | null> {
  const weights = await getProductWeightsFromDB()
  
  // Chercher une correspondance exacte
  const exactMatch = weights.find(w => {
    const typeMatch = w.product_type.toLowerCase() === productType.toLowerCase()
    if (!typeMatch) return false
    
    // Si le produit a un conditionnement, vérifier qu'il correspond
    if (conditionnement && w.conditionnement) {
      return w.conditionnement.toLowerCase() === conditionnement.toLowerCase()
    }
    
    // Si pas de conditionnement spécifié, prendre celui sans conditionnement
    return !w.conditionnement
  })
  
  if (exactMatch) {
    return exactMatch.weight_kg
  }
  
  // Chercher une correspondance partielle sur le type
  const partialMatch = weights.find(w => 
    productType.toLowerCase().includes(w.product_type.toLowerCase()) ||
    w.product_type.toLowerCase().includes(productType.toLowerCase())
  )
  
  if (partialMatch) {
    return partialMatch.weight_kg
  }
  
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
  const productName = (item.produit || item.name || item.title || item.categorie || item.category || '').toLowerCase()
  const conditionnement = (item.conditionnement || '').toLowerCase().replace(/\s+/g, '') // Supprimer les espaces
  const quantity = item.quantite || item.quantity || 1
  
  console.log(`🔍 Calcul poids: produit="${productName}", conditionnement="${conditionnement}", qty=${quantity}`)
  
  // 1. Bouillettes - utiliser le conditionnement
  if (productName.includes('bouillette') || productName.includes('boilies')) {
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
  if (productName.includes('farine')) {
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
}): Promise<number> {
  const productName = (item.produit || item.categorie || item.category || '').toLowerCase()
  const conditionnement = (item.conditionnement || '').toLowerCase()
  const quantity = item.quantite || item.quantity || 1
  
  // Essayer de trouver dans la DB d'abord
  const dbWeight = await findWeightFromDB(productName, conditionnement)
  if (dbWeight !== null) {
    return dbWeight * quantity
  }
  
  // Sinon utiliser la fonction synchrone avec les valeurs par défaut
  return getProductWeight(item)
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
}>): Promise<number> {
  const weights = await Promise.all(
    cartItems.map(item => getProductWeightAsync(item))
  )
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  
  // Minimum 0.5kg pour l'expédition
  return Math.max(totalWeight, 0.5)
}
