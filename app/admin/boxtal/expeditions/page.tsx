'use client'

import { useState, useEffect } from 'react'
import { Package, Truck, CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink, Download } from 'lucide-react'
import { getAllOrders } from '@/lib/revenue-supabase'
import { getBoxtalConfig } from '@/lib/boxtal-config'

interface OrderWithBoxtal {
  id: string
  reference: string
  total: number
  status: string
  created_at: string
  user_email?: string
  user_name?: string
  boxtal_created?: boolean
  shipping_tracking_number?: string
  shipping_label_url?: string
  shipping_cost?: number
  boxtal_order_id?: string
}

export default function BoxtalExpeditionsPage() {
  const [orders, setOrders] = useState<OrderWithBoxtal[]>([])
  const [loading, setLoading] = useState(true)
  const [boxtalConfig, setBoxtalConfig] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'with_boxtal' | 'without_boxtal'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allOrders, config] = await Promise.all([
        getAllOrders(),
        getBoxtalConfig()
      ])
      
      setOrders(allOrders as any)
      setBoxtalConfig(config)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'with_boxtal') {
      return order.boxtal_created === true
    }
    if (filter === 'without_boxtal') {
      return !order.boxtal_created && order.status === 'completed'
    }
    return true
  })

  const ordersWithBoxtal = orders.filter(o => o.boxtal_created === true).length
  const ordersWithoutBoxtal = orders.filter(o => !o.boxtal_created && o.status === 'completed').length

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
            <span className="ml-3 text-gray-300">Chargement des expéditions...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Expéditions Boxtal</h1>
          <p className="text-gray-400">
            Visualisez toutes les expéditions créées avec Boxtal
          </p>
        </div>

        {/* Configuration Boxtal */}
        {boxtalConfig && (
          <div className="mb-6 bg-noir-800/50 border border-noir-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Configuration Boxtal</p>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    boxtalConfig.environment === 'production'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {boxtalConfig.environment === 'production' ? 'Production' : 'Test'}
                  </span>
                  <span className="text-gray-300 text-sm">
                    Code offre: <span className="font-mono text-yellow-500">{boxtalConfig.shipping_offer_code || 'Non configuré'}</span>
                  </span>
                </div>
              </div>
              <a
                href="/admin/boxtal-config"
                className="px-4 py-2 bg-noir-700 text-gray-300 rounded-lg hover:bg-noir-600 text-sm"
              >
                Modifier
              </a>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{ordersWithBoxtal}</p>
                <p className="text-sm text-gray-400">Expéditions créées</p>
              </div>
            </div>
          </div>

          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{ordersWithoutBoxtal}</p>
                <p className="text-sm text-gray-400">Sans expédition</p>
              </div>
            </div>
          </div>

          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
                <p className="text-sm text-gray-400">Total commandes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-yellow-500 text-noir-950'
                : 'bg-noir-800 text-gray-300 hover:bg-noir-700'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('with_boxtal')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'with_boxtal'
                ? 'bg-yellow-500 text-noir-950'
                : 'bg-noir-800 text-gray-300 hover:bg-noir-700'
            }`}
          >
            Avec Boxtal ({ordersWithBoxtal})
          </button>
          <button
            onClick={() => setFilter('without_boxtal')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'without_boxtal'
                ? 'bg-yellow-500 text-noir-950'
                : 'bg-noir-800 text-gray-300 hover:bg-noir-700'
            }`}
          >
            Sans Boxtal ({ordersWithoutBoxtal})
          </button>
        </div>

        {/* Liste des commandes */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 text-center">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Aucune commande trouvée</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-noir-800/50 border rounded-xl p-6 ${
                  order.boxtal_created
                    ? 'border-green-500/30'
                    : 'border-noir-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">
                        Commande #{order.reference}
                      </h3>
                      {order.boxtal_created && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Boxtal
                        </span>
                      )}
                      {!order.boxtal_created && order.status === 'completed' && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Sans expédition
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Client: {order.user_email || order.user_name || 'Non renseigné'}</p>
                      <p>Total: {order.total.toFixed(2)} €</p>
                      <p>Date: {new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                      <p>Statut: <span className="text-white font-semibold">{order.status}</span></p>
                    </div>
                  </div>
                </div>

                {/* Informations Boxtal */}
                {order.boxtal_created && (
                  <div className="mt-4 pt-4 border-t border-noir-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="w-5 h-5 text-green-500" />
                      <h4 className="font-semibold text-white">✅ Expédition Boxtal créée</h4>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-3">
                      <p className="text-xs text-green-400 mb-3">
                        Cette expédition a été créée avec succès dans Boxtal. Vous pouvez la retrouver dans votre compte Boxtal avec les informations ci-dessous.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {order.shipping_tracking_number && (
                          <div>
                            <p className="text-gray-400 mb-1">Numéro de suivi</p>
                            <p className="font-mono text-yellow-500 font-semibold text-lg">
                              {order.shipping_tracking_number}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Recherchez ce numéro dans Boxtal
                            </p>
                          </div>
                        )}
                        {order.boxtal_order_id && (
                          <div>
                            <p className="text-gray-400 mb-1">ID Commande Boxtal</p>
                            <p className="font-mono text-gray-300 text-xs break-all">
                              {order.boxtal_order_id}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Identifiant unique dans Boxtal
                            </p>
                          </div>
                        )}
                        {order.shipping_cost && (
                          <div>
                            <p className="text-gray-400 mb-1">Coût d'expédition</p>
                            <p className="text-white font-semibold text-lg">
                              {order.shipping_cost.toFixed(2)} €
                            </p>
                          </div>
                        )}
                        {order.shipping_label_url && (
                          <div>
                            <p className="text-gray-400 mb-1">Étiquette d'expédition</p>
                            <a
                              href={order.shipping_label_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-yellow-500 hover:text-yellow-400 font-semibold"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger l'étiquette
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-blue-400 font-semibold mb-1">
                        📍 Où voir cette expédition dans Boxtal :
                      </p>
                      <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                        <li>Connectez-vous à votre compte Boxtal ({boxtalConfig?.environment === 'test' ? 'environnement TEST' : 'production'})</li>
                        <li>Allez dans "Mes expéditions" ou "Commandes"</li>
                        <li>Recherchez avec le numéro de suivi : <span className="font-mono text-yellow-500">{order.shipping_tracking_number}</span></li>
                        {order.boxtal_order_id && (
                          <li>Ou recherchez avec l'ID : <span className="font-mono text-yellow-500 text-xs">{order.boxtal_order_id}</span></li>
                        )}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Message si pas d'expédition */}
                {!order.boxtal_created && order.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-noir-700">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm">
                        Aucune expédition Boxtal créée pour cette commande
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Information sur l'environnement */}
        {boxtalConfig && (
          <div className={`mt-6 rounded-xl p-4 ${
            boxtalConfig.environment === 'test'
              ? 'bg-yellow-500/10 border border-yellow-500/30'
              : 'bg-green-500/10 border border-green-500/30'
          }`}>
            <div className="flex items-start">
              <AlertCircle className={`w-5 h-5 mr-2 mt-0.5 ${
                boxtalConfig.environment === 'test' ? 'text-yellow-500' : 'text-green-500'
              }`} />
              <div className="text-sm text-gray-300 flex-1">
                <p className={`font-semibold mb-2 ${
                  boxtalConfig.environment === 'test' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  Environnement : {boxtalConfig.environment === 'test' ? 'TEST' : 'PRODUCTION'}
                </p>
                
                {boxtalConfig.environment === 'test' ? (
                  <>
                    <p className="mb-2">
                      ⚠️ Les expéditions sont créées sur l'environnement de <strong>test</strong> de Boxtal.
                      Elles ne sont <strong>PAS visibles</strong> dans l'interface de production Boxtal.
                    </p>
                    <div className="bg-noir-900/50 rounded-lg p-3 mt-3">
                      <p className="font-semibold mb-2 text-yellow-400">Où voir vos expéditions de test :</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Connectez-vous à votre compte Boxtal</li>
                        <li>Assurez-vous d'être sur l'environnement de <strong>test</strong> (pas production)</li>
                        <li>Allez dans "Mes expéditions" ou "Commandes"</li>
                        <li>Les expéditions créées depuis cette interface y apparaîtront</li>
                      </ol>
                    </div>
                    <p className="mt-3 text-xs text-gray-400">
                      💡 Pour voir les expéditions dans l'interface de production, changez l'environnement en "Production" dans la configuration.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      ✅ Les expéditions sont créées sur l'environnement de <strong>production</strong> de Boxtal.
                    </p>
                    <div className="bg-noir-900/50 rounded-lg p-3 mt-3">
                      <p className="font-semibold mb-2 text-green-400">Où voir vos expéditions :</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Connectez-vous à votre compte Boxtal (production)</li>
                        <li>Allez dans "Mes expéditions" ou "Commandes"</li>
                        <li>Les expéditions créées depuis cette interface y apparaîtront</li>
                      </ol>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions pour vérifier dans Boxtal */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start">
            <Package className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold mb-2 text-blue-400">Comment vérifier dans Boxtal :</p>
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-white mb-1">1. Vérifiez dans cette interface :</p>
                  <p className="text-xs">Les commandes avec le badge vert "Boxtal" ont une expédition créée. Regardez le numéro de suivi et l'ID Boxtal.</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">2. Vérifiez dans Supabase :</p>
                  <p className="text-xs">Allez dans Table Editor {'>'} orders. Les commandes avec <code className="bg-noir-900 px-1 rounded">boxtal_created = true</code> ont une expédition.</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">3. Vérifiez dans Boxtal :</p>
                  <p className="text-xs">
                    Connectez-vous à votre compte Boxtal ({boxtalConfig?.environment === 'test' ? 'environnement TEST' : 'production'}). 
                    Les expéditions créées apparaîtront dans "Mes expéditions" avec le numéro de suivi affiché ci-dessus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

