// Gestion du paiement PayPal

// Configuration PayPal
const PAYPAL_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  // Le secret est utilisé côté serveur uniquement
  baseUrl: process.env.NEXT_PUBLIC_PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com', // Mode test par défaut
}

// Interface pour les données de commande PayPal
export interface PayPalOrderData {
  montant: number
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
  pickupPoint?: any
  promoCode?: string
  discount?: number
}

// Vérifier si PayPal est configuré
export function isPayPalConfigured(): boolean {
  return !!PAYPAL_CONFIG.clientId
}

// Obtenir le client ID PayPal
export function getPayPalClientId(): string {
  return PAYPAL_CONFIG.clientId
}

// Vérifier si on est en mode test (sandbox)
export function isPayPalTestMode(): boolean {
  return PAYPAL_CONFIG.baseUrl.includes('sandbox')
}
