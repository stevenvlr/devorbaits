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
  montant: number
  reference: string
  email: string
  texteLibre?: string
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
  // Formater la date au format Monetico (YYYYMMDDHHmmss)
  const now = new Date()
  const date = now.toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
    .slice(0, 14)
  
  // Formater le montant (ex: 25.50EUR)
  const montant = `${orderData.montant.toFixed(2)}EUR`
  
  // Préparer le texte libre avec les infos de commande
  const texteLibre = JSON.stringify({
    retraitMode: orderData.retraitMode,
    rdvDate: orderData.rdvDate,
    rdvTimeSlot: orderData.rdvTimeSlot,
    livraisonAddress: orderData.livraisonAddress,
  })
  
  const params: Record<string, string> = {
    TPE: MONETICO_CONFIG.TPE,
    date: date,
    montant: montant,
    reference: orderData.reference,
    url_retour: MONETICO_CONFIG.URL_RETOUR,
    url_retour_ok: MONETICO_CONFIG.URL_RETOUR,
    url_retour_err: MONETICO_CONFIG.URL_RETOUR_ERR,
    lgue: 'FR',
    mail: orderData.email,
    texte_libre: texteLibre.substring(0, 32000), // Limite Monetico
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
    // Générer la signature côté serveur pour la sécurité
    const response = await fetch('/api/monetico/signature', {
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

    const { MAC } = await response.json()
    if (!MAC) {
      throw new Error('Signature MAC non reçue')
    }
    params.MAC = MAC
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
  
  // Créer un formulaire dynamique
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  form.style.display = 'none'
  
  // Ajouter tous les paramètres comme champs cachés
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = value
    form.appendChild(input)
  })
  
  // Ajouter le formulaire au DOM et le soumettre
  document.body.appendChild(form)
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

