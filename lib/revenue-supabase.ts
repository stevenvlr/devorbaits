// Gestion des revenus et commandes avec Supabase ou localStorage
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface Order {
  id: string
  user_id?: string
  reference: string
  monetico_reference?: string
  total: number
  status: 'pending' | 'preparing' | 'shipped' | 'completed' | 'cancelled'
  payment_method?: string
  created_at: string
  shipping_tracking_number?: string
  shipping_label_url?: string
  shipping_cost?: number
  invoice_url?: string
  invoice_number?: string
  billing_address?: any
  items?: OrderItem[] // Les items sont maintenant stockés directement dans orders
  comment?: string // Commentaire de commande (optionnel, max 500 caractères)
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  created_at: string
  // Informations de variante pour affichage
  arome?: string
  taille?: string
  couleur?: string
  diametre?: string
  conditionnement?: string
  forme?: string
  saveur?: string
  produit?: string // Nom du produit pour référence
}

/**
 * Crée une commande
 */
export async function createOrder(
  userId: string | undefined,
  reference: string,
  total: number,
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[],
  paymentMethod?: string,
  shippingCost?: number,
  comment?: string,
  moneticoReference?: string
): Promise<Order> {
  // Pour Supabase, on ne fournit pas l'ID (il sera généré automatiquement)
  // Pour localStorage, on génère un ID
  const orderIdForLocalStorage = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        // Préparer les items au format JSON pour stockage dans orders.items
        const itemsForJson = items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          created_at: new Date().toISOString(),
          // Inclure les informations de variante
          arome: item.arome,
          taille: item.taille,
          couleur: item.couleur,
          diametre: item.diametre,
          conditionnement: item.conditionnement,
          forme: item.forme,
          saveur: item.saveur,
          produit: item.produit
        }))

        const orderDataToInsertBase = {
          user_id: userId,
          reference,
          total,
          status: 'pending' as const,
          payment_method: paymentMethod,
          items: itemsForJson, // Stocker les items directement dans orders
          // Ne pas inclure 'id' ni 'created_at' - Supabase les génère automatiquement
        }

        // Ajouter shipping_cost et comment si fournis (et valides)
        let orderDataToInsert: any = orderDataToInsertBase
        if (moneticoReference && typeof moneticoReference === 'string') {
          orderDataToInsert = { ...orderDataToInsert, monetico_reference: moneticoReference }
        }
        if (typeof shippingCost === 'number' && Number.isFinite(shippingCost)) {
          orderDataToInsert = { ...orderDataToInsert, shipping_cost: shippingCost }
        }
        if (comment && typeof comment === 'string' && comment.trim().length > 0) {
          // Sécuriser le commentaire : trim, limiter à 500 caractères, éviter HTML/script
          const sanitizedComment = comment.trim().substring(0, 500)
          orderDataToInsert = { ...orderDataToInsert, comment: sanitizedComment }
        }

        console.log(`📦 Création de la commande ${reference} avec ${itemsForJson.length} item(s)`)
        console.log('Items à insérer:', itemsForJson)

        // Tenter insertion avec shipping_cost (si supporté), sinon fallback sans (si colonne absente)
        let { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert(orderDataToInsert as any)
          .select()
          .single()

        if (
          orderError &&
          typeof orderError.message === 'string' &&
          (orderError.message.toLowerCase().includes('shipping_cost') ||
           orderError.message.toLowerCase().includes('comment') ||
           orderError.message.toLowerCase().includes('monetico_reference')) &&
          orderError.message.toLowerCase().includes('does not exist')
        ) {
          console.warn('⚠️ Colonne shipping_cost, comment ou monetico_reference absente dans orders, retry sans ces colonnes')
          const retry = await supabase
            .from('orders')
            .insert(orderDataToInsertBase as any)
            .select()
            .single()
          orderData = retry.data as any
          orderError = retry.error as any
        }

        if (orderError) {
          console.error('Erreur Supabase création commande:', orderError)
          // Si l'erreur indique que la table n'existe pas ou un problème de connexion
          if (orderError.message.includes('relation') || orderError.message.includes('does not exist')) {
            throw new Error('Table "orders" non trouvée dans Supabase. Vérifiez que vous avez exécuté les scripts SQL.')
          }
          if (orderError.message.includes('JWT') || orderError.message.includes('API key')) {
            throw new Error('Clé API Supabase invalide. Vérifiez NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local')
          }
          throw new Error(orderError.message || 'Erreur lors de la création de la commande dans Supabase')
        }

        if (!orderData) {
          throw new Error('Aucune donnée retournée lors de la création de la commande')
        }

        console.log(`✅ Commande ${reference} créée avec succès avec ${itemsForJson.length} item(s)`)

        return orderData
      } catch (error: any) {
        // Si c'est déjà une erreur formatée, la relancer
        if (error.message && error.message.includes('Table') || error.message.includes('Clé API')) {
          throw error
        }
        // Sinon, wrapper l'erreur
        throw new Error(`Erreur Supabase: ${error.message || 'Erreur inconnue'}`)
      }
    } else {
      console.warn('Supabase configuré mais client non disponible, utilisation du fallback localStorage')
    }
  } else {
    console.warn('Supabase non configuré, utilisation du fallback localStorage')
  }

  // Fallback localStorage
  if (typeof window === 'undefined') {
    throw new Error('Non disponible côté serveur')
  }

  // Pour localStorage, créer un objet order avec l'ID généré et les items
  const orderItems: OrderItem[] = items.map((item, index) => ({
    ...item,
    id: `item_${Date.now()}_${index}`,
    order_id: orderIdForLocalStorage,
    created_at: new Date().toISOString()
  }))

  const orderWithItems: Order = {
    id: orderIdForLocalStorage,
    user_id: userId,
    reference,
    monetico_reference: moneticoReference,
    total,
    shipping_cost: typeof shippingCost === 'number' && Number.isFinite(shippingCost) ? shippingCost : undefined,
    status: 'pending',
    payment_method: paymentMethod,
    created_at: new Date().toISOString(),
    items: orderItems,
    comment: comment && typeof comment === 'string' && comment.trim().length > 0 
      ? comment.trim().substring(0, 500) 
      : undefined
  }

  const orders = JSON.parse(localStorage.getItem('orders') || '[]')
  orders.push(orderWithItems)
  localStorage.setItem('orders', JSON.stringify(orders))

  return orderWithItems
}

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      // IMPORTANT:
      // Ne pas faire un update direct, sinon les emails/factures ne sont pas déclenchés.
      // On passe par l'API admin qui gère:
      // - génération facture + email préparation
      // - email expédié
      // - anti-doublon
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token || null

      const res = await fetch('/api/admin/orders/set-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ orderId, status }),
      })

      if (!res.ok) {
        let msg = `Erreur API set-status (${res.status})`
        try {
          const j: any = await res.json()
          msg = j?.error || msg
        } catch {
          // ignore
        }
        throw new Error(msg)
      }
    }
  } else {
    if (typeof window === 'undefined') return
    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    const orderIndex = orders.findIndex((o: Order) => o.id === orderId)
    if (orderIndex !== -1) {
      orders[orderIndex].status = status
      localStorage.setItem('orders', JSON.stringify(orders))
    }
  }
}

/**
 * Met à jour le numéro de suivi d'une commande
 */
export async function updateOrderTrackingNumber(orderId: string, trackingNumber: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase
        .from('orders')
        .update({ shipping_tracking_number: trackingNumber.trim() || null })
        .eq('id', orderId)
      
      if (error) {
        console.error('Erreur lors de la mise à jour du numéro de suivi:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    }
  } else {
    if (typeof window === 'undefined') return { success: false, error: 'Non disponible côté serveur' }
    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    const orderIndex = orders.findIndex((o: Order) => o.id === orderId)
    if (orderIndex !== -1) {
      orders[orderIndex].shipping_tracking_number = trackingNumber.trim() || undefined
      localStorage.setItem('orders', JSON.stringify(orders))
      return { success: true }
    }
    return { success: false, error: 'Commande non trouvée' }
  }
  return { success: false, error: 'Supabase non configuré' }
}

/**
 * Obtient les revenus par mois pour l'année en cours
 */
export async function getMonthlyRevenue(year?: number): Promise<{ month: string; revenue: number; count: number }[]> {
  const currentYear = year || new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 1).toISOString()
  const endDate = new Date(currentYear + 1, 0, 1).toISOString()

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    const { data } = await supabase
      .from('orders')
      .select('total, created_at, status')
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .order('created_at', { ascending: true })

    if (!data) return []

    const monthly: { [key: string]: { revenue: number; count: number } } = {}
    data.forEach((order) => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthly[monthKey]) {
        monthly[monthKey] = { revenue: 0, count: 0 }
      }
      monthly[monthKey].revenue += parseFloat(order.total.toString())
      monthly[monthKey].count += 1
    })

    return Object.entries(monthly)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  // Fallback localStorage
  if (typeof window === 'undefined') return []
  const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    .filter((o: Order) => 
      o.status === 'completed' &&
      new Date(o.created_at) >= new Date(startDate) &&
      new Date(o.created_at) < new Date(endDate)
    )

  const monthly: { [key: string]: { revenue: number; count: number } } = {}
  orders.forEach((order: Order) => {
    const date = new Date(order.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthly[monthKey]) {
      monthly[monthKey] = { revenue: 0, count: 0 }
    }
    monthly[monthKey].revenue += order.total
    monthly[monthKey].count += 1
  })

  return Object.entries(monthly)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Obtient le revenu total de l'année
 */
export async function getYearlyRevenue(year?: number): Promise<number> {
  const monthly = await getMonthlyRevenue(year)
  return monthly.reduce((sum, month) => sum + month.revenue, 0)
}

/**
 * Récupère une commande par référence avec ses items
 */
export async function getOrderByReference(reference: string): Promise<(Order & { items: OrderItem[] }) | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) return null

    // Récupérer la commande avec ses items (stockés dans orders.items)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', reference)
      .single()

    if (orderError || !order) return null

    // Convertir les items JSONB en tableau d'OrderItem
    let items: OrderItem[] = []
    if (order.items) {
      if (Array.isArray(order.items)) {
        items = order.items.map((item: any) => ({
          id: item.id || `item-${order.id}-${item.product_id}`,
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          created_at: item.created_at || order.created_at,
          arome: item.arome,
          taille: item.taille,
          couleur: item.couleur,
          diametre: item.diametre,
          conditionnement: item.conditionnement,
          forme: item.forme,
          saveur: item.saveur,
          produit: item.produit
        }))
      }
    }

    return {
      ...order,
      items: items
    }
  }

  // Fallback localStorage
  if (typeof window === 'undefined') return null
  
  const orders = JSON.parse(localStorage.getItem('orders') || '[]')
  const order = orders.find((o: Order) => o.reference === reference)
  
  if (!order) return null

  // Pour localStorage, les items sont déjà dans order.items
  return {
    ...order,
    items: order.items || []
  }
}

/**
 * Récupère les commandes d'un utilisateur
 */
export async function getUserOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    // Récupérer les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersError || !orders) return []

    // Convertir les items JSONB en tableau d'OrderItem
    const ordersWithItems = orders.map((order: any) => {
      let items: OrderItem[] = []
      if (order.items) {
        if (Array.isArray(order.items)) {
          items = order.items.map((item: any) => ({
            id: item.id || `item-${order.id}-${item.product_id}`,
            order_id: order.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
            created_at: item.created_at || order.created_at,
            arome: item.arome,
            taille: item.taille,
            couleur: item.couleur,
            diametre: item.diametre,
            conditionnement: item.conditionnement,
            forme: item.forme,
            saveur: item.saveur,
            produit: item.produit
          }))
        }
      }
      
      return {
        ...order,
        items: items
      }
    })

    return ordersWithItems
  }

  // Fallback localStorage
  if (typeof window === 'undefined') return []
  
  const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    .filter((o: Order) => o.user_id === userId)
    .sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Pour localStorage, les items sont déjà dans order.items
  return orders.map((order: Order) => ({
    ...order,
    items: order.items || []
  }))
}

/**
 * Récupère toutes les commandes (pour l'admin)
 */
export async function getAllOrders(): Promise<(Order & { items: OrderItem[]; user_email?: string; user_name?: string })[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (!supabase) return []

    // Récupérer les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError || !orders) return []

    // Récupérer les profils pour chaque commande et convertir les items JSONB
    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        // Les items sont maintenant stockés directement dans orders.items (JSONB)
        let items: OrderItem[] = []
        if (order.items) {
          // Convertir le JSONB en tableau d'OrderItem
          if (Array.isArray(order.items)) {
            items = order.items.map((item: any) => ({
              id: item.id || `item-${order.id}-${item.product_id}`,
              order_id: order.id,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
              price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
              created_at: item.created_at || order.created_at,
              arome: item.arome,
              taille: item.taille,
              couleur: item.couleur,
              diametre: item.diametre,
              conditionnement: item.conditionnement,
              forme: item.forme,
              saveur: item.saveur,
              produit: item.produit
            }))
          }
        }
        
        if (!items || items.length === 0) {
          console.warn(`⚠️ Aucun item trouvé pour la commande ${order.reference} (ID: ${order.id})`)
        } else {
          console.log(`✅ ${items.length} item(s) trouvé(s) pour la commande ${order.reference}`)
        }

        // Récupérer le profil utilisateur si user_id existe
        let user_email: string | undefined
        let user_name: string | undefined
        let user_phone: string | undefined

        if (order.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, nom, prenom, telephone')
            .eq('id', order.user_id)
            .single()

          if (profile) {
            user_email = profile.email || undefined
            user_name = profile.nom || profile.prenom 
              ? `${profile.nom || ''} ${profile.prenom || ''}`.trim() 
              : undefined
            user_phone = profile.telephone || undefined
          }
        }

        return {
          ...order,
          items: items || [],
          user_email,
          user_name,
          user_phone,
          shipping_tracking_number: order.shipping_tracking_number,
          shipping_label_url: order.shipping_label_url,
          shipping_cost: order.shipping_cost ? parseFloat(order.shipping_cost.toString()) : undefined,
          shipping_address: order.shipping_address || undefined,
          comment: order.comment || undefined
        }
      })
    )

    return ordersWithItems
  }

  // Fallback localStorage
  if (typeof window === 'undefined') return []
  
  const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    .sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Pour localStorage, les items sont déjà dans order.items
  return orders.map((order: Order) => ({
    ...order,
    items: order.items || []
  }))
}
