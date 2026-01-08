// Intégration Boxtal API v3 - Automatique et facile à utiliser
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { getBoxtalConfig, type BoxtalConfig } from './boxtal-config'

interface ShippingAddress {
  name: string
  street: string
  city: string
  zipCode: string
  country: string
  phone?: string
  email?: string
}

/**
 * Récupère les clés API Boxtal depuis Supabase ou les variables d'environnement (fallback)
 */
async function getBoxtalCredentials(): Promise<{ apiKey: string; apiSecret: string; environment: string } | null> {
  // D'abord, essayer de récupérer depuis Supabase
  const config = await getBoxtalConfig()
  
  if (config && config.api_key && config.api_secret) {
    return {
      apiKey: config.api_key.trim(),
      apiSecret: config.api_secret.trim(),
      environment: config.environment || 'test'
    }
  }

  // Fallback sur les variables d'environnement (SERVEUR UNIQUEMENT - pas NEXT_PUBLIC_)
  // ⚠️ IMPORTANT : Ne jamais utiliser NEXT_PUBLIC_ pour les clés secrètes !
  // Les variables NEXT_PUBLIC_ sont exposées côté client (navigateur)
  const apiKey = process.env.BOXTAL_API_KEY
  const apiSecret = process.env.BOXTAL_API_SECRET
  const environment = process.env.BOXTAL_ENV || process.env.NEXT_PUBLIC_BOXTAL_ENV || 'test'

  if (!apiKey || !apiSecret) {
    return null
  }

  return {
    apiKey: apiKey.trim(),
    apiSecret: apiSecret.trim(),
    environment
  }
}

/**
 * Prépare l'adresse expéditeur (votre entreprise)
 * Récupère depuis Supabase ou utilise les variables d'environnement
 */
async function getFromAddress() {
  const config = await getBoxtalConfig()
  
  return {
    name: `${config?.from_first_name || process.env.BOXTAL_FROM_FIRST_NAME || "Votre"} ${config?.from_last_name || process.env.BOXTAL_FROM_LAST_NAME || "Entreprise"}`,
    street: config?.from_street || process.env.BOXTAL_FROM_STREET || "4 boulevard des Capucines",
    city: config?.from_city || process.env.BOXTAL_FROM_CITY || "Paris",
    zipCode: config?.from_postal_code || process.env.BOXTAL_FROM_POSTAL_CODE || "75009",
    country: config?.from_country || process.env.BOXTAL_FROM_COUNTRY || "FR",
    phone: config?.from_phone || process.env.BOXTAL_FROM_PHONE || "+33612345678",
    email: config?.from_email || process.env.BOXTAL_FROM_EMAIL || "contact@example.com"
  }
}

/**
 * Prépare l'adresse destinataire depuis le profil utilisateur
 */
function prepareToAddress(profile: any): ShippingAddress {
  return {
    name: `${profile.nom || ''} ${profile.prenom || ''}`.trim() || profile.email || 'Client',
    street: profile.adresse || '',
    city: profile.ville || '',
    zipCode: profile.code_postal || '',
    country: profile.pays || 'FR',
    phone: profile.telephone || '',
    email: profile.email || ''
  }
}

/**
 * Obtient un token Bearer pour l'API v3 de Boxtal
 * Utilise Basic Auth pour obtenir le token
 */
async function getBoxtalToken(credentials: { apiKey: string; apiSecret: string; environment: string }): Promise<string | null> {
  try {
    // Déterminer l'URL selon l'environnement pour l'API v3
    const baseUrl = credentials.environment === 'production' 
      ? 'https://api.boxtal.com' 
      : 'https://api.boxtal.build'
    
    // Créer l'authentification Basic
    const basicAuth = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64')
    
    // Obtenir le token via l'endpoint d'authentification de l'API v3
    const response = await fetch(`${baseUrl}/iam/account-app/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any = { message: 'Erreur inconnue' }
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      console.error('Erreur lors de l\'obtention du token Boxtal v3:', errorData)
      return null
    }
    
    const tokenData = await response.json()
    // Le token est dans accessToken pour l'API v3
    return tokenData.accessToken || null
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token Boxtal v3:', error)
    return null
  }
}

/**
 * Crée automatiquement une expédition Boxtal pour une commande
 * Utilise l'API v3 de Boxtal
 */
export async function createBoxtalShipmentAuto(orderId: string, pickupPointCode?: string): Promise<{
  success: boolean
  message: string
  trackingNumber?: string
  labelUrl?: string
}> {
  // Récupérer la commande depuis Supabase
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase non configuré' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, message: 'Erreur de connexion' }
  }

  // Récupérer les credentials
  const credentials = await getBoxtalCredentials()
  if (!credentials) {
    return { 
      success: false, 
      message: 'Clés API Boxtal non configurées. Allez dans Administration > Configuration Boxtal pour les configurer.' 
    }
  }
  
  // Vérifier que les clés ne sont pas vides
  if (!credentials.apiKey || !credentials.apiSecret || credentials.apiKey.trim() === '' || credentials.apiSecret.trim() === '') {
    return { 
      success: false, 
      message: 'Clés API Boxtal invalides (vides). Vérifiez votre configuration dans Administration > Configuration Boxtal.' 
    }
  }

  // Récupérer la commande avec les items et le profil utilisateur
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { success: false, message: 'Commande non trouvée' }
  }

  // Récupérer les items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (!items || items.length === 0) {
    return { success: false, message: 'Aucun article dans la commande' }
  }

  // Récupérer le profil utilisateur
  if (!order.user_id) {
    return { success: false, message: 'Utilisateur non trouvé' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', order.user_id)
    .single()

  if (!profile) {
    return { success: false, message: 'Profil utilisateur non trouvé' }
  }

  // Vérifier que l'adresse est complète
  if (!profile.adresse || !profile.code_postal || !profile.ville) {
    return { 
      success: false, 
      message: 'Adresse de livraison incomplète. Vérifiez le profil du client dans "Mon compte".' 
    }
  }

  // Calculer le poids automatiquement (poids variable selon la quantité)
  // Poids moyen par article : 0.4kg
  const totalWeight = Math.max(
    items.reduce((sum, item) => sum + (item.quantity * 0.4), 0),
    0.5 // Minimum 0.5kg
  )

  // Récupérer la configuration pour le code d'offre
  const config = await getBoxtalConfig()
  const shippingOfferCode = config?.shipping_offer_code || process.env.BOXTAL_SHIPPING_OFFER_CODE || "MONR-CpourToi"

  // Déterminer l'URL selon l'environnement pour l'API v3
  const baseUrl = credentials.environment === 'production' 
    ? 'https://api.boxtal.com' 
    : 'https://api.boxtal.build'

  // Calculer les dimensions selon le poids
  let length = 30
  let width = 20
  let height = 15
  
  if (totalWeight > 5) {
    length = 40
    width = 30
    height = 25
  } else if (totalWeight > 2) {
    length = 35
    width = 25
    height = 20
  }

  // Récupérer l'adresse expéditeur
  const fromAddress = await getFromAddress()
  const toAddress = prepareToAddress(profile)

  // Obtenir le token Bearer pour l'API v3
  const token = await getBoxtalToken(credentials)
  if (!token) {
    return { 
      success: false, 
      message: 'Impossible d\'obtenir le token d\'authentification Boxtal. Vérifiez vos clés API.' 
    }
  }

  // Séparer le nom en prénom et nom pour le format API v3
  const fromNameParts = fromAddress.name.split(' ')
  const fromFirstName = fromNameParts[0] || 'Votre'
  const fromLastName = fromNameParts.slice(1).join(' ') || 'Entreprise'
  
  const toNameParts = toAddress.name.split(' ')
  const toFirstName = toNameParts[0] || 'Client'
  const toLastName = toNameParts.slice(1).join(' ') || ''

  // Préparer la commande d'expédition selon le format API v3
  const shippingOrder = {
    shipment: {
      fromAddress: {
        type: "BUSINESS",
        contact: {
          firstName: fromFirstName,
          lastName: fromLastName,
          email: fromAddress.email,
          phone: fromAddress.phone
        },
        location: {
          street: fromAddress.street,
          city: fromAddress.city,
          postalCode: fromAddress.zipCode,
          countryIsoCode: fromAddress.country
        }
      },
      toAddress: {
        type: "RESIDENTIAL",
        contact: {
          firstName: toFirstName,
          lastName: toLastName,
          email: toAddress.email,
          phone: toAddress.phone
        },
        location: {
          street: toAddress.street,
          city: toAddress.city,
          postalCode: toAddress.zipCode,
          countryIsoCode: toAddress.country
        }
      },
      packages: [{
        weight: totalWeight,
        length,
        width,
        height,
        value: {
          value: order.total || 0,
          currency: "EUR"
        }
      }]
    },
    shippingOfferCode: shippingOfferCode,
    labelType: "PDF_A4"
  }

  // Ajouter pickupPointCode si fourni (pour les points relais)
  if (pickupPointCode) {
    ;(shippingOrder as any).shipment.pickupPointCode = pickupPointCode
  }

  try {
    // Créer la commande d'expédition via l'API v3
    const response = await fetch(`${baseUrl}/shipping/v3.1/shipping-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shippingOrder)
    })

    if (!response.ok) {
      // Lire la réponse même en cas d'erreur
      let errorData: any = { message: 'Erreur inconnue' }
      try {
        const responseText = await response.text()
        if (responseText) {
          errorData = JSON.parse(responseText)
        }
      } catch {
        // Si ce n'est pas du JSON, garder le message par défaut
      }
      
      console.error('Erreur Boxtal API v3:', errorData)
      console.error('Status:', response.status, response.statusText)
      console.error('URL:', `${baseUrl}/shipping/v3.1/shipping-order`)
      console.error('Environment:', credentials.environment)
      
      let errorMessage = "Impossible de créer l'expédition. Vérifiez votre configuration."
      
      // Gestion spécifique de l'erreur Unauthorized (401)
      if (response.status === 401 || response.status === 403) {
        errorMessage = `Erreur d'authentification (${response.status} ${response.statusText})`
        
        // Ajouter les détails de l'erreur si disponibles (notamment pour ZuulException)
        if (errorData.message || errorData.error || errorData.exception) {
          const detail = errorData.message || errorData.error || errorData.exception
          errorMessage += `: ${detail}`
        }
        
        errorMessage += `\n\nVérifiez que :
- Vos clés API Boxtal sont correctes dans la configuration (/admin/boxtal-config)
- L'environnement (test/production) correspond à vos clés API
- Les clés ne contiennent pas d'espaces avant ou après
- Vous utilisez les clés de l'API v3 (pas v1)
- Votre application Boxtal a les permissions nécessaires pour créer des commandes
- Votre compte Boxtal est actif`
      } else if (errorData.error) {
        errorMessage = errorData.error
      } else if (errorData.message) {
        errorMessage = errorData.message
      }

      return { 
        success: false, 
        message: `Erreur Boxtal: ${errorMessage}` 
      }
    }

    const boxtalData = await response.json()

    // Extraire les informations de suivi et d'étiquette (format API v3)
    const orderContent = boxtalData.content || boxtalData
    const trackingNumber = orderContent.trackingNumber || orderContent.tracking?.number || orderContent.tracking_number
    const labelUrl = orderContent.labelUrl || orderContent.label?.url || orderContent.label_url
    const shippingCost = orderContent.deliveryPriceExclTax?.value || orderContent.price?.value || orderContent.shippingCost || 0
    const orderId = orderContent.id || boxtalData.id

    // Sauvegarder les infos dans la commande
    const updateData: any = {
      shipping_tracking_number: trackingNumber,
      shipping_label_url: labelUrl,
      shipping_cost: shippingCost,
      shipping_address: toAddress,
      boxtal_created: true
    }
    
    if (orderId) {
      updateData.boxtal_order_id = orderId
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('Erreur lors de la sauvegarde:', updateError)
      return { 
        success: false, 
        message: 'Expédition créée mais erreur lors de la sauvegarde des informations' 
      }
    }

    return {
      success: true,
      message: 'Expédition créée avec succès !',
      trackingNumber: trackingNumber || undefined,
      labelUrl: labelUrl || undefined
    }
  } catch (error: any) {
    console.error('Erreur Boxtal:', error)
    return { 
      success: false, 
      message: `Erreur: ${error.message || 'Impossible de contacter Boxtal. Vérifiez votre connexion internet.'}` 
    }
  }
}

/**
 * Obtient une estimation du prix d'expédition Boxtal
 * Utilise l'API v3 pour obtenir une estimation
 */
export async function getBoxtalShippingCost(
  toAddress: {
    street: string
    city: string
    postalCode: string
    country?: string
  },
  weight: number = 0.5,
  totalValue: number = 0
): Promise<{ success: boolean; cost: number; error?: string }> {
  const credentials = await getBoxtalCredentials()
  
  if (!credentials) {
    return { success: false, cost: 0, error: 'Clés API Boxtal non configurées' }
  }

  try {
    // Déterminer l'URL selon l'environnement pour l'API v3
    const baseUrl = credentials.environment === 'production' 
      ? 'https://api.boxtal.com' 
      : 'https://api.boxtal.build'

    // Obtenir le token Bearer pour l'API v3
    const token = await getBoxtalToken(credentials)
    if (!token) {
      return { 
        success: false, 
        cost: 0, 
        error: 'Impossible d\'obtenir le token d\'authentification Boxtal. Vérifiez vos clés API.' 
      }
    }

    // Récupérer la configuration pour le code d'offre
    const config = await getBoxtalConfig()
    const shippingOfferCode = config?.shipping_offer_code || process.env.BOXTAL_SHIPPING_OFFER_CODE || "MONR-CpourToi"

    // Récupérer l'adresse expéditeur
    const fromAddress = await getFromAddress()

    // Calculer les dimensions selon le poids
    let length = 30
    let width = 20
    let height = 15
    
    if (weight > 5) {
      length = 40
      width = 30
      height = 25
    } else if (weight > 2) {
      length = 35
      width = 25
      height = 20
    }

    // Préparer la demande d'estimation (format API v3)
    const estimateData = {
      shipment: {
        fromAddress: {
          location: {
            street: fromAddress.street,
            city: fromAddress.city,
            postalCode: fromAddress.zipCode,
            countryIsoCode: fromAddress.country
          }
        },
        toAddress: {
          location: {
            street: toAddress.street,
            city: toAddress.city,
            postalCode: toAddress.postalCode,
            countryIsoCode: toAddress.country || 'FR'
          }
        },
        packages: [{
          weight: Math.max(weight, 0.5),
          length,
          width,
          height,
          value: {
            value: totalValue || 10,
            currency: "EUR"
          }
        }]
      },
      shippingOfferCode: shippingOfferCode
    }

    // Log pour debug
    console.log('📦 Estimation Boxtal v3 - Poids:', weight, 'kg, Dimensions:', 
      estimateData.shipment.packages[0].length + 'x' + 
      estimateData.shipment.packages[0].width + 'x' + 
      estimateData.shipment.packages[0].height + 'cm')

    // Obtenir l'estimation via l'API v3
    const response = await fetch(`${baseUrl}/shipping/v3.1/shipping-order/estimate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(estimateData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
      console.error('Erreur estimation Boxtal v3:', errorData)
      return { 
        success: false, 
        cost: 0, 
        error: errorData.error || errorData.message || 'Erreur lors de l\'estimation' 
      }
    }

    const boxtalData = await response.json()

    // Extraire le prix d'expédition (format API v3)
    const estimateContent = boxtalData.content || boxtalData
    const shippingCost = estimateContent.deliveryPriceExclTax?.value || estimateContent.price?.value || estimateContent.cost || 0
    
    // Log pour debug
    console.log('💰 Prix Boxtal v3 calculé:', shippingCost, '€ pour', weight, 'kg')

    return {
      success: true,
      cost: shippingCost
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'estimation Boxtal v1:', error)
    return { 
      success: false, 
      cost: 0, 
      error: error.message || 'Erreur lors de l\'estimation' 
    }
  }
}

/**
 * Récupère le statut de suivi d'une expédition Boxtal via l'API v3
 */
export async function getBoxtalTrackingStatus(trackingNumber: string): Promise<any> {
  const credentials = await getBoxtalCredentials()
  
  if (!credentials) {
    return null
  }

  try {
    // Déterminer l'URL selon l'environnement pour l'API v3
    const baseUrl = credentials.environment === 'production' 
      ? 'https://api.boxtal.com' 
      : 'https://api.boxtal.build'

    // Obtenir le token Bearer pour l'API v3
    const token = await getBoxtalToken(credentials)
    if (!token) {
      return null
    }

    // Pour l'API v3, le suivi se fait via l'ID de la commande, pas le numéro de suivi
    // Si on a seulement le trackingNumber, on doit d'abord trouver l'orderId
    // Pour l'instant, on essaie avec le trackingNumber directement
    const response = await fetch(`${baseUrl}/shipping/v3.1/shipping-order/${trackingNumber}/tracking`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      return null
    }

    const trackingData = await response.json()
    return trackingData
  } catch (error) {
    console.error('Erreur lors du suivi Boxtal v3:', error)
    return null
  }
}

/**
 * Interface pour un point relais
 */
export interface PickupPoint {
  code: string
  name: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  distance?: number // Distance en km
  openingHours?: string
  network?: string // Ex: "MONR", "COLIS", etc.
}

/**
 * Recherche les points relais disponibles via l'API Boxtal v3
 */
export async function searchBoxtalPickupPoints(
  postalCode: string,
  city?: string,
  country: string = 'FR',
  radius: number = 10 // Rayon de recherche en km
): Promise<{ success: boolean; points: PickupPoint[]; error?: string }> {
  const credentials = await getBoxtalCredentials()
  
  if (!credentials) {
    return { success: false, points: [], error: 'Clés API Boxtal non configurées' }
  }

  try {
    // Déterminer l'URL selon l'environnement pour l'API v3
    const baseUrl = credentials.environment === 'production' 
      ? 'https://api.boxtal.com' 
      : 'https://api.boxtal.build'

    // Obtenir le token Bearer pour l'API v3
    const token = await getBoxtalToken(credentials)
    if (!token) {
      return { success: false, points: [], error: 'Impossible d\'obtenir le token d\'authentification' }
    }

    // Construire les paramètres de recherche
    const searchParams = new URLSearchParams({
      postalCode: postalCode,
      countryIsoCode: country,
      radius: radius.toString()
    })
    
    if (city) {
      searchParams.append('city', city)
    }

    // Rechercher les points relais via l'API v3
    // L'API Boxtal v3 utilise l'endpoint /repository/v3.1/pickup-points pour rechercher les points relais
    // Essayer plusieurs endpoints possibles
    const possibleEndpoints = [
      `${baseUrl}/repository/v3.1/pickup-points`,
      `${baseUrl}/shipping/v3.1/repository/pickup-points`,
      `${baseUrl}/shipping/v3.1/pickup-points`
    ]

    let response: Response | null = null
    let lastError: any = null

    for (const endpoint of possibleEndpoints) {
      try {
        response = await fetch(`${endpoint}?${searchParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          break // Endpoint trouvé, sortir de la boucle
        } else if (response.status !== 404) {
          // Si ce n'est pas une 404, c'est peut-être une autre erreur (401, 403, etc.)
          lastError = { status: response.status, endpoint }
          const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
          lastError.data = errorData
        }
      } catch (err) {
        lastError = { endpoint, error: err }
        continue
      }
    }

    if (!response || !response.ok) {
      const errorData = lastError?.data || { message: 'Endpoint non trouvé' }
      console.error('Erreur lors de la recherche de points relais:', {
        status: response?.status || 'N/A',
        endpoints: possibleEndpoints,
        lastError
      })
      
      let errorMessage = `Erreur ${response?.status || 404} lors de la recherche de points relais`
      if (response?.status === 404) {
        errorMessage = 'L\'endpoint de recherche de points relais n\'est pas disponible. Vérifiez la documentation Boxtal API v3.1 pour l\'endpoint correct.'
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
      
      return { 
        success: false, 
        points: [], 
        error: errorMessage
      }
    }

    const data = await response.json()
    
    // Transformer les données de l'API en format PickupPoint
    const points: PickupPoint[] = (data.content || data.pickupPoints || []).map((point: any) => ({
      code: point.code || point.pickupPointCode,
      name: point.name || point.label || '',
      address: {
        street: point.address?.street || point.location?.street || '',
        city: point.address?.city || point.location?.city || '',
        postalCode: point.address?.postalCode || point.location?.postalCode || postalCode,
        country: point.address?.countryIsoCode || point.location?.countryIsoCode || country
      },
      coordinates: point.coordinates ? {
        latitude: point.coordinates.latitude || point.latitude,
        longitude: point.coordinates.longitude || point.longitude
      } : undefined,
      distance: point.distance,
      openingHours: point.openingHours || point.hours,
      network: point.network || point.carrier
    }))

    return { success: true, points }
  } catch (error: any) {
    console.error('Erreur lors de la recherche de points relais:', error)
    return { 
      success: false, 
      points: [], 
      error: error.message || 'Erreur lors de la recherche de points relais' 
    }
  }
}
