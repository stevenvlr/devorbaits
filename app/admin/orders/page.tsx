'use client'

import { useState, useEffect } from 'react'
import { Package, CheckCircle, XCircle, Clock, Truck, Search, Filter, Download, Edit2, Save, X, MapPin, Info, Calendar } from 'lucide-react'
import { getAllOrders, updateOrderStatus, updateOrderTrackingNumber, type Order, type OrderItem } from '@/lib/revenue-supabase'
import { getProductById } from '@/lib/products-manager'

type OrderStatus = Order['status']

interface OrderWithDetails extends Order {
  items: OrderItem[]
  user_email?: string
  user_name?: string
  shipping_tracking_number?: string
  shipping_label_url?: string
  shipping_cost?: number
  comment?: string
  shipping_address?: {
    type?: 'chronopost-relais' | 'boxtal-relais' | 'livraison' | 'wavignies-rdv'
    adresse?: string
    codePostal?: string
    ville?: string
    telephone?: string
    pays?: string
    // Pour Chronopost Relais
    identifiant?: string
    nom?: string
    horaires?: string
    // Pour Boxtal Relais
    network?: string
    pointRelais?: {
      code?: string
      name?: string
      address?: {
        street?: string
        postalCode?: string
        city?: string
        country?: string
      }
      coordinates?: {
        latitude?: number
        longitude?: number
      }
      network?: string
    }
    coordonnees?: {
      latitude?: number
      longitude?: number
    }
    // Pour Wavignies RDV
    rdvDate?: string
    rdvTimeSlot?: string
  }
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: any; color: string }[] = [
  { value: 'pending', label: 'En attente', icon: Clock, color: 'text-yellow-500' },
  { value: 'preparing', label: 'En préparation', icon: Package, color: 'text-blue-500' },
  { value: 'shipped', label: 'Expédiée', icon: Truck, color: 'text-purple-500' },
  { value: 'completed', label: 'Terminée', icon: CheckCircle, color: 'text-green-500' },
  { value: 'cancelled', label: 'Annulée', icon: XCircle, color: 'text-red-500' }
]

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingTrackingNumber, setEditingTrackingNumber] = useState<string | null>(null)
  const [trackingNumberValue, setTrackingNumberValue] = useState<string>('')
  const [savingTracking, setSavingTracking] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const allOrders = await getAllOrders()
      // Log pour déboguer
      console.log('Commandes chargées:', allOrders.length)
      allOrders.forEach((order, index) => {
        console.log(`Commande ${index + 1} (${order.reference}):`, {
          id: order.id,
          reference: order.reference,
          itemsCount: order.items?.length || 0,
          items: order.items
        })
      })
      setOrders(allOrders)
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des commandes' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      setMessage({ type: 'success', text: 'Statut de la commande mis à jour' })
      setTimeout(() => setMessage(null), 3000)
      await loadOrders()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du statut' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleEditTrackingNumber = (order: OrderWithDetails) => {
    setEditingTrackingNumber(order.id)
    setTrackingNumberValue(order.shipping_tracking_number || '')
  }

  const handleCancelEditTracking = () => {
    setEditingTrackingNumber(null)
    setTrackingNumberValue('')
  }

  const handleSaveTrackingNumber = async (orderId: string) => {
    setSavingTracking(orderId)
    try {
      const result = await updateOrderTrackingNumber(orderId, trackingNumberValue)
      if (result.success) {
        setMessage({ type: 'success', text: 'Numéro de suivi mis à jour avec succès' })
        setTimeout(() => setMessage(null), 3000)
        setEditingTrackingNumber(null)
        setTrackingNumberValue('')
        await loadOrders()
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la mise à jour du numéro de suivi' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du numéro de suivi:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du numéro de suivi' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSavingTracking(null)
    }
  }

  const getStatusInfo = (status: OrderStatus) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const [products, setProducts] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    // Charger les produits complets (avec variantes) pour tous les items
    const loadProducts = async () => {
      const productsMap: { [key: string]: any } = {}
      const productIds = new Set<string>()
      
      orders.forEach(order => {
        order.items.forEach(item => {
          productIds.add(item.product_id)
        })
      })

      await Promise.all(
        Array.from(productIds).map(async (productId) => {
          try {
            const product = await getProductById(productId)
            if (product) {
              productsMap[productId] = product
            }
          } catch {
            productsMap[productId] = null
          }
        })
      )

      setProducts(productsMap)
    }

    if (orders.length > 0) {
      loadProducts()
    }
  }, [orders])

  // Fonction pour construire le nom du produit avec les informations de variante sauvegardées
  const getProductNameFromItem = (item: any): string => {
    // Utiliser d'abord le nom du produit sauvegardé si disponible
    const baseName = item.produit || products[item.product_id]?.name || item.product_id
    
    // Construire les détails de variante à partir des informations sauvegardées
    const variantParts: string[] = []
    
    // Pour les bouillettes : gamme/arôme, diamètre, conditionnement
    if (baseName === 'Bouillette' || baseName?.toLowerCase().includes('bouillette')) {
      if (item.arome) variantParts.push(`Gamme: ${item.arome}`)
      
      // Extraire diamètre et conditionnement du variant_id si pas dans les champs directs
      // Format: "variant-16-5kg" -> diamètre: 16, conditionnement: 5kg
      if (item.diametre) {
        variantParts.push(`${item.diametre}mm`)
      } else if (item.variant_id && item.variant_id.includes('-')) {
        const parts = item.variant_id.split('-')
        if (parts.length >= 2) {
          const diametre = parts[1] // ex: "16" de "variant-16-5kg"
          if (diametre && !isNaN(Number(diametre))) {
            variantParts.push(`${diametre}mm`)
          }
        }
      }
      
      if (item.conditionnement) {
        variantParts.push(item.conditionnement)
      } else if (item.variant_id && item.variant_id.includes('-')) {
        const parts = item.variant_id.split('-')
        if (parts.length >= 3) {
          const conditionnement = parts[2] // ex: "5kg" de "variant-16-5kg"
          if (conditionnement) {
            variantParts.push(conditionnement)
          }
        }
      }
    } else {
      // Pour Pop-up Duo : saveur (arome) et forme (taille)
      if (item.saveur) variantParts.push(item.saveur)
      if (item.forme) variantParts.push(item.forme)
      // Fallback pour les anciennes commandes
      if (!item.saveur && item.arome) variantParts.push(item.arome)
      if (!item.forme && item.taille) variantParts.push(item.taille)
      
      // Pour Bar à Pop-up : couleur, taille, arôme
      if (item.couleur) variantParts.push(item.couleur)
      if (item.taille && !variantParts.includes(item.taille)) variantParts.push(item.taille)
      if (item.arome && !variantParts.includes(item.arome)) variantParts.push(item.arome)
      
      // Autres produits avec diamètre/conditionnement
      if (item.diametre && !variantParts.some(p => p.includes('mm'))) variantParts.push(`${item.diametre}mm`)
      if (item.conditionnement && !variantParts.includes(item.conditionnement)) variantParts.push(item.conditionnement)
    }
    
    // Si on n'a pas trouvé d'informations de variante sauvegardées, essayer de les récupérer depuis les variantes du produit
    if (variantParts.length === 0 && item.variant_id) {
      const product = products[item.product_id]
      if (product?.variants) {
        const variant = product.variants.find((v: any) => v.id === item.variant_id)
        if (variant) {
          if (variant.label) {
            variantParts.push(variant.label)
          } else {
            if (variant.diametre) variantParts.push(`${variant.diametre}mm`)
            if (variant.conditionnement) variantParts.push(variant.conditionnement)
            if (variant.taille) variantParts.push(variant.taille)
            if (variant.couleur) variantParts.push(variant.couleur)
            if (variant.arome) variantParts.push(variant.arome)
            if (variant.saveur) variantParts.push(variant.saveur)
            if (variant.forme) variantParts.push(variant.forme)
          }
        }
      }
    }
    
    if (variantParts.length > 0) {
      return `${baseName} - ${variantParts.join(' - ')}`
    }
    
    return baseName
  }

  const getProductName = (productId: string, variantId?: string): string => {
    const product = products[productId]
    if (!product) {
      console.warn(`⚠️ Produit non trouvé: ${productId}`)
      return productId
    }
    
    const baseName = product.name || productId
    
    // Ajouter les informations de variante si elle existe
    if (variantId) {
      console.log(`🔍 Recherche variante ${variantId} pour produit ${productId} (${baseName})`)
      console.log(`📦 Variantes disponibles:`, product.variants?.map((v: any) => ({ id: v.id, label: v.label })))
      
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v: any) => v.id === variantId)
        console.log(`🎯 Variante trouvée:`, variant)
        
        if (variant) {
          // Construire le nom de la variante avec toutes les informations disponibles
          const variantParts: string[] = []
          
          if (variant.label) {
            variantParts.push(variant.label)
          } else {
            // Construire le label à partir des propriétés disponibles
            if (variant.diametre) variantParts.push(variant.diametre)
            if (variant.conditionnement) variantParts.push(variant.conditionnement)
            if (variant.taille) variantParts.push(variant.taille)
            if (variant.couleur) variantParts.push(variant.couleur)
            if (variant.arome) variantParts.push(variant.arome)
            if (variant.saveur) variantParts.push(variant.saveur)
            if (variant.forme) variantParts.push(variant.forme)
          }
          
          if (variantParts.length > 0) {
            const fullName = `${baseName} - ${variantParts.join(' - ')}`
            console.log(`✅ Nom complet: ${fullName}`)
            return fullName
          } else {
            console.warn(`⚠️ Variante trouvée mais sans informations:`, variant)
          }
        } else {
          console.warn(`⚠️ Variante ${variantId} non trouvée dans les variantes du produit ${productId}`)
        }
      } else {
        console.warn(`⚠️ Produit ${productId} n'a pas de variantes`)
      }
    } else {
      console.log(`ℹ️ Pas de variantId pour le produit ${productId}`)
    }
    
    return baseName
  }

  // Filtrer les commandes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Gestion des Commandes</h1>
          <p className="text-gray-400">Suivez et gérez toutes les commandes</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-500' : 'bg-red-500/10 border border-red-500/30 text-red-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">En attente</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">En préparation</p>
            <p className="text-2xl font-bold text-blue-500">{stats.preparing}</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Expédiées</p>
            <p className="text-2xl font-bold text-purple-500">{stats.shipped}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Terminées</p>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Annulées</p>
            <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, email ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="all">Tous les statuts</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement des commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const StatusIcon = statusInfo.icon

              return (
                <div key={order.id} className="bg-noir-800/50 border border-noir-700 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">Commande #{order.reference}</h3>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.color} bg-opacity-10`}>
                          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                          <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <p>Date : {formatDate(order.created_at)}</p>
                        {order.user_email && (
                          <p>Client : {order.user_name || order.user_email} ({order.user_email})</p>
                        )}
                        {order.payment_method && (
                          <p>Paiement : {order.payment_method}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-500 mb-2">{order.total.toFixed(2)}€</p>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-noir-700 pt-4">
                    <p className="text-sm font-medium text-gray-400 mb-2">Articles :</p>
                    {!order.items || order.items.length === 0 ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-sm text-yellow-500">
                          ⚠️ Aucun article trouvé pour cette commande
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Référence: {order.reference} | ID: {order.id}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {order.items.map((item) => {
                          // Utiliser la nouvelle fonction qui utilise les informations sauvegardées
                          const productName = getProductNameFromItem(item)
                          return (
                            <div key={item.id} className="flex items-center justify-between text-sm bg-noir-900/50 rounded p-2">
                              <div className="flex-1">
                                <span className="text-white">{productName}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-gray-400">× {item.quantity}</span>
                                <span className="text-yellow-500 font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Informations de livraison */}
                  {order.shipping_address && (
                    <div className="border-t border-noir-700 pt-4 mt-4">
                      {(order.shipping_address as any).type === 'chronopost-relais' ? (
                        // Point relais Chronopost
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-purple-500" />
                            <p className="text-sm font-medium text-purple-500">Point relais Chronopost</p>
                          </div>
                          <div className="space-y-1 text-sm text-gray-300">
                            {(order.shipping_address as any).nom && (
                              <p className="font-semibold text-white">
                                <span className="text-gray-400">Nom :</span> {(order.shipping_address as any).nom}
                              </p>
                            )}
                            {(order.shipping_address as any).identifiant && (
                              <p>
                                <span className="text-gray-400">Code point relais :</span>{' '}
                                <span className="font-mono text-yellow-400">{(order.shipping_address as any).identifiant}</span>
                              </p>
                            )}
                            {order.shipping_address.adresse && (
                              <p><span className="text-gray-400">Adresse :</span> {order.shipping_address.adresse}</p>
                            )}
                            {(order.shipping_address.codePostal || order.shipping_address.ville) && (
                              <p>
                                <span className="text-gray-400">Ville :</span>{' '}
                                {order.shipping_address.codePostal} {order.shipping_address.ville}
                              </p>
                            )}
                            {(order.shipping_address as any).horaires && (
                              <p className="mt-2">
                                <span className="text-gray-400">Horaires :</span>{' '}
                                <span className="text-gray-300">{(order.shipping_address as any).horaires}</span>
                              </p>
                            )}
                            {(order.shipping_address as any).coordonnees && (
                              <p className="text-xs text-gray-500 mt-2">
                                Coordonnées : {((order.shipping_address as any).coordonnees.latitude || 0).toFixed(4)}, {((order.shipping_address as any).coordonnees.longitude || 0).toFixed(4)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (order.shipping_address as any).type === 'wavignies-rdv' ? (
                        // Retrait sur rendez-vous à Wavignies
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-yellow-500" />
                            <p className="text-sm font-medium text-yellow-500">Retrait sur rendez-vous à Wavignies</p>
                          </div>
                          <div className="space-y-2 text-sm text-gray-300">
                            {(order.shipping_address as any).rdvDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-yellow-400" />
                                <p>
                                  <span className="text-gray-400">Date :</span>{' '}
                                  <span className="font-semibold text-white">
                                    {(() => {
                                      const dateStr = (order.shipping_address as any).rdvDate
                                      if (!dateStr) return ''
                                      try {
                                        const [year, month, day] = dateStr.split('-').map(Number)
                                        const date = new Date(year, month - 1, day)
                                        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
                                        const dayName = days[date.getDay()]
                                        return `${dayName} ${day}/${month}/${year}`
                                      } catch {
                                        return dateStr
                                      }
                                    })()}
                                  </span>
                                </p>
                              </div>
                            )}
                            {(order.shipping_address as any).rdvTimeSlot && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                <p>
                                  <span className="text-gray-400">Créneau horaire :</span>{' '}
                                  <span className="font-semibold text-white">{(order.shipping_address as any).rdvTimeSlot}</span>
                                </p>
                              </div>
                            )}
                            {order.shipping_address.adresse && (
                              <p className="mt-2">
                                <span className="text-gray-400">Adresse :</span>{' '}
                                <span className="text-white">{order.shipping_address.adresse}</span>
                              </p>
                            )}
                            {(order.shipping_address.codePostal || order.shipping_address.ville) && (
                              <p>
                                <span className="text-gray-400">Ville :</span>{' '}
                                <span className="text-white">
                                  {order.shipping_address.codePostal} {order.shipping_address.ville}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (order.shipping_address as any).type === 'boxtal-relais' ? (
                        // Point relais Boxtal
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-green-500" />
                            <p className="text-sm font-medium text-green-500">Point relais Boxtal</p>
                            {(order.shipping_address as any).network && (
                              <span className="text-xs text-gray-400">({(order.shipping_address as any).network})</span>
                            )}
                          </div>
                          <div className="space-y-2 text-sm text-gray-300">
                            {(order.shipping_address as any).nom && (
                              <p className="font-semibold text-white text-base">
                                {(order.shipping_address as any).nom}
                              </p>
                            )}
                            {(order.shipping_address as any).identifiant && (
                              <p>
                                <span className="text-gray-400">Code point relais :</span>{' '}
                                <span className="font-mono text-yellow-400">{(order.shipping_address as any).identifiant}</span>
                              </p>
                            )}
                            
                            {/* Code postal utilisé pour la recherche */}
                            {(order.shipping_address as any).codePostalRecherche && (
                              <p className="text-xs text-gray-500 mt-2">
                                <span className="text-gray-400">Code postal de recherche :</span>{' '}
                                <span className="text-yellow-400 font-medium">{(order.shipping_address as any).codePostalRecherche}</span>
                                {(order.shipping_address as any).villeRecherche && (
                                  <span className="text-gray-400"> ({((order.shipping_address as any).villeRecherche)})</span>
                                )}
                              </p>
                            )}
                            
                            {/* Adresse complète du point relais */}
                            <div className="mt-3 pt-3 border-t border-green-500/20">
                              <p className="text-xs text-gray-400 mb-2 font-medium">ADRESSE DU POINT RELAIS :</p>
                              <div className="space-y-1">
                                {/* Extraire le code postal et la ville depuis TOUTES les sources possibles */}
                                {(() => {
                                  const pointRelais = (order.shipping_address as any).pointRelais
                                  const rawData = pointRelais?.rawData || pointRelais
                                  
                                  // Chercher dans toutes les sources possibles
                                  const postalCode = 
                                    order.shipping_address.codePostal ||
                                    pointRelais?.address?.postalCode ||
                                    pointRelais?.address?.postal_code ||
                                    pointRelais?.address?.zipCode ||
                                    pointRelais?.address?.zip ||
                                    pointRelais?.address?.postcode ||
                                    rawData?.address?.postalCode ||
                                    rawData?.address?.postal_code ||
                                    rawData?.address?.zipCode ||
                                    rawData?.address?.zip ||
                                    rawData?.postalCode ||
                                    rawData?.postal_code ||
                                    rawData?.zipCode ||
                                    rawData?.zip ||
                                    rawData?.codePostal ||
                                    ''
                                  
                                  const city = 
                                    order.shipping_address.ville ||
                                    pointRelais?.address?.city ||
                                    pointRelais?.address?.ville ||
                                    pointRelais?.address?.locality ||
                                    pointRelais?.address?.town ||
                                    pointRelais?.address?.commune ||
                                    rawData?.address?.city ||
                                    rawData?.address?.ville ||
                                    rawData?.address?.locality ||
                                    rawData?.address?.town ||
                                    rawData?.city ||
                                    rawData?.ville ||
                                    rawData?.locality ||
                                    rawData?.town ||
                                    ''
                                  
                                  const street = 
                                    order.shipping_address.adresse ||
                                    pointRelais?.address?.street ||
                                    pointRelais?.address?.address ||
                                    pointRelais?.address?.line1 ||
                                    pointRelais?.address?.adresse ||
                                    pointRelais?.address?.streetAddress ||
                                    rawData?.address?.street ||
                                    rawData?.address?.address ||
                                    rawData?.address?.line1 ||
                                    rawData?.street ||
                                    rawData?.address ||
                                    ''
                                  
                                  return (
                                    <>
                                      {/* Rue/Adresse si disponible */}
                                      {street && (
                                        <p className="text-white">
                                          {street}
                                        </p>
                                      )}
                                      {/* Code postal et ville - TOUJOURS affichés si disponibles */}
                                      {(postalCode || city) ? (
                                        <p className="text-white font-medium text-base">
                                          {postalCode} {city}
                                        </p>
                                      ) : (
                                        <p className="text-yellow-400 text-xs italic">
                                          Code postal et ville non disponibles
                                        </p>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                            {(order.shipping_address as any).coordonnees && (
                              <p className="text-xs text-gray-500 mt-2">
                                Coordonnées : {((order.shipping_address as any).coordonnees.latitude || 0).toFixed(4)}, {((order.shipping_address as any).coordonnees.longitude || 0).toFixed(4)}
                              </p>
                            )}
                            {/* Afficher les informations complètes du point relais si disponibles */}
                            {(order.shipping_address as any).pointRelais && (
                              <div className="mt-3 pt-3 border-t border-green-500/20">
                                <p className="text-xs text-gray-400 mb-2">Informations complètes :</p>
                                <div className="text-xs text-gray-500 space-y-1">
                                  {(order.shipping_address as any).pointRelais.address?.street && (
                                    <p>Rue : {(order.shipping_address as any).pointRelais.address.street}</p>
                                  )}
                                  {(order.shipping_address as any).pointRelais.address?.postalCode && (
                                    <p>Code postal : {(order.shipping_address as any).pointRelais.address.postalCode}</p>
                                  )}
                                  {(order.shipping_address as any).pointRelais.address?.city && (
                                    <p>Ville : {(order.shipping_address as any).pointRelais.address.city}</p>
                                  )}
                                  {(order.shipping_address as any).pointRelais.address?.country && (
                                    <p>Pays : {(order.shipping_address as any).pointRelais.address.country}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Adresse de livraison classique
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Truck className="w-5 h-5 text-blue-500" />
                            <p className="text-sm font-medium text-blue-500">Adresse de livraison</p>
                          </div>
                          <div className="space-y-1 text-sm text-gray-300">
                            {order.shipping_address.adresse && (
                              <p><span className="text-gray-400">Adresse :</span> {order.shipping_address.adresse}</p>
                            )}
                            {(order.shipping_address.codePostal || order.shipping_address.ville) && (
                              <p>
                                <span className="text-gray-400">Ville :</span>{' '}
                                {order.shipping_address.codePostal} {order.shipping_address.ville}
                              </p>
                            )}
                            {order.shipping_address.telephone && (
                              <p><span className="text-gray-400">Téléphone :</span> {order.shipping_address.telephone}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Informations d'expédition */}
                  <div className="border-t border-noir-700 pt-4 mt-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-green-500" />
                          <p className="text-sm font-medium text-green-500">Expédition</p>
                        </div>
                        {!editingTrackingNumber && (
                          <button
                            onClick={() => handleEditTrackingNumber(order)}
                            className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            {order.shipping_tracking_number ? 'Modifier' : 'Ajouter'}
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        {editingTrackingNumber === order.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={trackingNumberValue}
                                onChange={(e) => setTrackingNumberValue(e.target.value)}
                                placeholder="Numéro de suivi"
                                className="flex-1 px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none font-mono"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveTrackingNumber(order.id)
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveTrackingNumber(order.id)}
                                disabled={savingTracking === order.id}
                                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {savingTracking === order.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Sauvegarde...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    <span>Enregistrer</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleCancelEditTracking}
                                disabled={savingTracking === order.id}
                                className="px-3 py-2 bg-noir-700 hover:bg-noir-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {order.shipping_tracking_number ? (
                              <p className="text-gray-300">
                                <span className="text-gray-400">Numéro de suivi :</span>{' '}
                                <span className="font-mono text-yellow-500">{order.shipping_tracking_number}</span>
                              </p>
                            ) : (
                              <p className="text-gray-400 text-xs italic">Aucun numéro de suivi enregistré</p>
                            )}
                          </div>
                        )}
                        {order.shipping_cost && (
                          <p className="text-gray-300">
                            <span className="text-gray-400">Coût de livraison :</span>{' '}
                            <span className="text-yellow-500">{order.shipping_cost.toFixed(2)}€</span>
                          </p>
                        )}
                        {order.shipping_label_url && (
                          <a
                            href={order.shipping_label_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger l'étiquette
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Commentaire de commande */}
                  {order.comment && (
                    <div className="border-t border-noir-700 pt-4 mt-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-blue-400" />
                          <p className="text-sm font-medium text-blue-400">Commentaire de commande</p>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{order.comment}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
