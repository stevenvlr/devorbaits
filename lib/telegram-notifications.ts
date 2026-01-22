/**
 * Notifications Telegram pour les nouvelles commandes
 */

import { buildProductNameWithVariants } from './price-utils'

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '8403689427:AAHIaMeqQDfEugboMn3EhO8xtESy2g3W8rg'
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '8279833370'

interface OrderNotificationData {
  reference: string
  total: number
  itemCount: number
  customerName?: string
  customerEmail?: string
  shippingCost?: number
  retraitMode?: string
  items?: Array<{
    produit?: string
    name?: string
    product_id?: string
    quantity: number
    price: number
    arome?: string
    taille?: string
    couleur?: string
    diametre?: string
    conditionnement?: string
    forme?: string
    saveur?: string
    gamme?: string
  }>
}

/**
 * Envoie une notification Telegram pour une nouvelle commande
 */
export async function sendNewOrderNotification(order: OrderNotificationData): Promise<boolean> {
  try {
    // Construire le message
    let message = `🛒 <b>Nouvelle commande !</b>\n\n`
    message += `📋 Référence: <code>${order.reference}</code>\n`
    
    if (order.customerName) {
      message += `👤 Client: ${order.customerName}\n`
    }
    if (order.customerEmail) {
      message += `📧 Email: ${order.customerEmail}\n`
    }
    
    message += `\n`
    
    // Mode de retrait
    if (order.retraitMode) {
      const modeLabels: Record<string, string> = {
        'livraison': '🚚 Livraison à domicile',
        'chronopost-relais': '📍 Point relais Chronopost',
        'wavignies-rdv': '📅 Retrait RDV Wavignies',
        'amicale-blanc': '🎣 Amicale des pêcheurs'
      }
      message += `${modeLabels[order.retraitMode] || order.retraitMode}\n`
    }
    
    // Articles
    if (order.items && order.items.length > 0) {
      message += `\n📦 <b>Articles (${order.itemCount}):</b>\n`
      order.items.slice(0, 10).forEach(item => {
        // Utiliser la fonction utilitaire pour construire le nom complet avec variantes
        const fullName = buildProductNameWithVariants(item)
        message += `  • ${item.quantity}x ${fullName} - ${item.price.toFixed(2)}€\n`
      })
      if (order.items.length > 10) {
        message += `  ... et ${order.items.length - 10} autre(s)\n`
      }
    } else {
      message += `📦 ${order.itemCount} article(s)\n`
    }
    
    message += `\n`
    
    // Frais de port
    if (order.shippingCost !== undefined && order.shippingCost > 0) {
      message += `🚚 Frais de port: ${order.shippingCost.toFixed(2)}€\n`
    }
    
    // Total
    message += `💰 <b>Total: ${order.total.toFixed(2)}€</b>\n`
    
    // Envoyer via l'API Telegram
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    })
    
    const result = await response.json()
    
    if (result.ok) {
      console.log('✅ Notification Telegram envoyée avec succès')
      return true
    } else {
      console.error('❌ Erreur Telegram:', result.description)
      return false
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification Telegram:', error)
    return false
  }
}

/**
 * Teste la connexion Telegram
 */
export async function testTelegramConnection(): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: '✅ Test de connexion Devorbaits réussi !',
        parse_mode: 'HTML'
      })
    })
    
    const result = await response.json()
    return result.ok === true
  } catch (error) {
    console.error('Erreur test Telegram:', error)
    return false
  }
}
