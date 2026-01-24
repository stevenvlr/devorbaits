// Gestion du paiement Monetico

// Configuration Monetico
// Ces valeurs doivent être dans .env.local
const MONETICO_CONFIG = {
  TPE: process.env.NEXT_PUBLIC_MONETICO_TPE || '',
  SOCIETE: process.env.NEXT_PUBLIC_MONETICO_SOCIETE || '',
  URL_RETOUR: process.env.NEXT_PUBLIC_MONETICO_URL_RETOUR || '',
  URL_RETOUR_ERR: process.env.NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR || '',
  // URL de l'API Monetico
  URL_PAIEMENT: process.env.NEXT_PUBLIC_MONETICO_URL || 'https://paiement.monetico.fr/paiement.cgi',
}

// Interface pour les données de commande
export interface MoneticoOrderData {
  montant: string // Montant au format "95.25EUR" (euros avec devise)
  reference: string
  email: string
  retraitMode?: string
  rdvDate?: string
  rdvTimeSlot?: string
  livraisonAddress?: {
    adresse: string
    codePostal: string
    ville: string
    telephone?: string
  }
  promoCode?: string
  discount?: number
}

// Préparer les données pour Monetico
export function prepareMoneticoPayment(orderData: MoneticoOrderData) {
  // Formater la date au format Monetico (JJ/MM/AAAA:HH:MM:SS)
  const now = new Date()
  const jour = String(now.getDate()).padStart(2, '0')
  const mois = String(now.getMonth() + 1).padStart(2, '0')
  const annee = now.getFullYear()
  const heures = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const secondes = String(now.getSeconds()).padStart(2, '0')
  const date = `${jour}/${mois}/${annee}:${heures}:${minutes}:${secondes}`
  
  // Le montant est déjà au format "95.25EUR" (string)
  const montant = orderData.montant
  
  // Construire les paramètres dans l'ordre requis par Monetico
  const params: Record<string, string> = {
    TPE: MONETICO_CONFIG.TPE,
    date: date,
    montant: montant,
    reference: orderData.reference,
    version: '3.0', // Version obligatoire
    lgue: 'FR',
    societe: MONETICO_CONFIG.SOCIETE || '', // Peut être vide mais doit être présent
    mail: orderData.email,
    url_retour: MONETICO_CONFIG.URL_RETOUR,
    url_retour_ok: MONETICO_CONFIG.URL_RETOUR,
    url_retour_err: MONETICO_CONFIG.URL_RETOUR_ERR,
  }
  
  return {
    params,
    url: MONETICO_CONFIG.URL_PAIEMENT,
  }
}

// Créer et soumettre le formulaire Monetico
export async function submitMoneticoPayment(orderData: MoneticoOrderData) {
  const { params, url } = prepareMoneticoPayment(orderData)
  
  try {
    // Log pour débogage - Afficher TOUS les paramètres Monetico
    console.log('Monetico - Préparation paiement (TOUS les paramètres):', {
      TPE: params.TPE,
      date: params.date,
      montant: params.montant,
      reference: params.reference,
      version: params.version,
      lgue: params.lgue,
      societe: params.societe || '(vide)',
      mail: params.mail,
      url_retour: params.url_retour,
      url_retour_ok: params.url_retour_ok,
      url_retour_err: params.url_retour_err,
      url_paiement: url,
    })
    
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    console.log('[MONETICO CALL]', requestId, '/api/monetico/signature/')
    console.log('Monetico - Appel API signature...')

    // Générer la signature côté serveur pour la sécurité
    const response = await fetch('/api/monetico/signature/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('Erreur API signature:', errorData)
      throw new Error(errorData.error || 'Erreur lors de la génération de la signature')
    }

    const data = await response.json()
    console.log('Monetico - Réponse API signature:', {
      hasMAC: !!data.MAC,
      macLength: data.MAC?.length,
      macPreview: data.MAC ? data.MAC.substring(0, 20) + '...' : 'aucun',
    })
    
    const { MAC } = data
    if (!MAC) {
      throw new Error('Signature MAC non reçue')
    }
    params.MAC = MAC
    console.log('Monetico - MAC ajouté aux paramètres')
  } catch (error: any) {
    console.error('Erreur génération signature:', error)
    
    // En mode développement, afficher plus d'informations
    const errorMessage = error?.message || 'Erreur inconnue lors de la génération de la signature'
    
    // Vérifier si c'est un problème de configuration
    if (errorMessage.includes('Clé secrète Monetico non configurée')) {
      alert('⚠️ Configuration Monetico incomplète.\n\nVeuillez configurer MONETICO_CLE_SECRETE dans votre fichier .env.local\n\nPour tester sans paiement réel, activez le mode test avec NEXT_PUBLIC_TEST_PAYMENT=true')
      return
    }
    
    // En cas d'erreur, continuer sans signature (ne fonctionnera pas en production)
    alert(`Erreur de configuration Monetico: ${errorMessage}\n\nVeuillez vérifier votre configuration ou utiliser le mode test.`)
    return
  }
  
  // Log temporaire avant génération du formulaire
  // Ordre attendu Monetico: TPE, date, lgue, mail, montant, reference, societe, url_retour, url_retour_err, url_retour_ok, version
  const macOrder = [
    'TPE',
    'date',
    'lgue',
    'mail',
    'montant',
    'reference',
    'societe',
    'url_retour',
    'url_retour_err',
    'url_retour_ok',
    'version',
  ]
  const macString = macOrder.map((key) => `${key}=${(params as Record<string, string>)[key] ?? ''}`).join('*')
  console.log('[MONETICO macString]', macString)

  // Créer un formulaire dynamique
  console.log('Monetico - Création du formulaire...')
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  form.style.display = 'none'
  
  // Ajouter tous les paramètres comme champs cachés
  const formFields: string[] = []
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = value
    form.appendChild(input)
    formFields.push(`${key}=${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`)
  })
  
  console.log('Monetico - Formulaire créé avec les champs:', {
    action: url,
    method: 'POST',
    fieldsCount: formFields.length,
    fields: formFields,
  })
  
  // Ajouter le formulaire au DOM et le soumettre
  document.body.appendChild(form)
  console.log('[MONETICO FORM KEYS]', Object.keys(params))
  console.log('[MONETICO REF]', params.reference)
  console.log('Monetico - Soumission du formulaire vers Monetico...')
  form.submit()
}

// Vérifier les paramètres de retour Monetico
export function parseMoneticoReturn(searchParams: URLSearchParams) {
  const codeRetour = searchParams.get('code-retour')
  const reference = searchParams.get('reference')
  const montant = searchParams.get('montant')
  const date = searchParams.get('date')
  const MAC = searchParams.get('MAC')
  
  return {
    codeRetour,
    reference,
    montant,
    date,
    MAC,
    success: codeRetour === 'payetest' || codeRetour === 'paiement',
  }
}

// Générer une référence de commande unique
export function generateOrderReference(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 9).toUpperCase()
  return `CMD-${timestamp}-${random}`
}

// Générer une référence Monetico (A-Z0-9, 12 caractères)
export function generateMoneticoReference(): string {
  const base = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  const cleaned = base.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.length >= 12) return cleaned.slice(0, 12)
  return cleaned.padEnd(12, '0').slice(0, 12)
}

/**
 * Fonction client pour démarrer un paiement Monetico
 * Appelle l'API /api/monetico et soumet automatiquement le formulaire
 */
export async function startMoneticoPayment(data: {
  montant: string // Format: "20.99EUR"
  mail: string
}) {
  try {
    console.log('Monetico - Démarrage paiement avec:', data)

    // Appeler l'API pour générer les champs et le MAC
    const response = await fetch('/api/monetico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('Monetico - Erreur API:', errorData)
      
      // Afficher une erreur claire si societe est vide
      if (errorData.error && errorData.error.includes('MONETICO_SOCIETE')) {
        alert(`❌ Erreur de configuration Monetico:\n\n${errorData.error}\n\nVeuillez configurer MONETICO_SOCIETE dans Cloudflare Dashboard (Settings → Environment Variables) pour Preview et Production.`)
      } else {
        alert(`Erreur lors du paiement Monetico: ${errorData.error || 'Erreur inconnue'}`)
      }
      return
    }

    const { action, fields } = await response.json()

    // Vérifications de sécurité avant d'envoyer
    if (!fields.MAC || fields.MAC.length !== 40) {
      console.error('Monetico - MAC invalide:', fields.MAC)
      alert('Erreur: MAC invalide. Le paiement ne peut pas être effectué.')
      return
    }

    if (!fields.reference || fields.reference.length > 12 || !/^[A-Z0-9]+$/.test(fields.reference)) {
      console.error('Monetico - Référence invalide:', fields.reference)
      alert('Erreur: Référence invalide. Le paiement ne peut pas être effectué.')
      return
    }

    if (!fields.societe || fields.societe.trim() === '') {
      console.error('Monetico - societe est vide')
      alert('Erreur: societe est vide. Le paiement ne peut pas être effectué.')
      return
    }

    // Log des champs envoyés pour debug
    console.log('Monetico - FIELDS envoyés Monetico:', {
      action,
      TPE: fields.TPE,
      societe: fields.societe,
      version: fields.version,
      date: fields.date,
      montant: fields.montant,
      reference: fields.reference,
      lgue: fields.lgue,
      mail: fields.mail,
      MAC: fields.MAC.substring(0, 20) + '...',
      MACLength: fields.MAC.length,
      referenceLength: fields.reference.length,
      referenceValid: /^[A-Z0-9]{12}$/.test(fields.reference),
    })

    // Créer le formulaire
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = action
    form.style.display = 'none'

    // Ajouter tous les champs comme inputs cachés
    // IMPORTANT : Utiliser le nom exact du champ
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value)
      form.appendChild(input)
    })

    // Ajouter le formulaire au DOM et le soumettre
    document.body.appendChild(form)
    console.log('Monetico - Soumission du formulaire vers:', action)
    form.submit()
  } catch (error: any) {
    console.error('Monetico - Erreur:', error)
    alert(`Erreur lors du paiement Monetico: ${error.message}`)
  }
}

