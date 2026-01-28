'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Wallet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  loadPaymentMethods,
  updatePaymentMethodEnabled,
  type PaymentMethod
} from '@/lib/payment-methods-supabase'

export default function PaymentMethodsAdminPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const methods = await loadPaymentMethods()
      setPaymentMethods(methods)
      
      // Si aucun moyen de paiement n'existe, initialiser avec les valeurs par défaut
      if (methods.length === 0) {
        setMessage({
          type: 'error',
          text: 'Aucun moyen de paiement trouvé. Assurez-vous que la table payment_methods existe dans Supabase et que le script SQL a été exécuté.'
        })
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error)
      setMessage({
        type: 'error',
        text: `Erreur lors du chargement: ${error?.message || 'Erreur inconnue'}`
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggle = async (method: 'paypal' | 'card', currentEnabled: boolean) => {
    setUpdating(method)
    setMessage(null)
    
    try {
      const success = await updatePaymentMethodEnabled(method, !currentEnabled)
      if (success) {
        setMessage({
          type: 'success',
          text: `Moyen de paiement "${method === 'paypal' ? 'PayPal' : 'Carte bancaire'}" ${!currentEnabled ? 'activé' : 'masqué'} avec succès`
        })
        await loadData()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: 'error',
          text: 'Erreur lors de la mise à jour'
        })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error: any) {
      console.error('Erreur lors du basculement:', error)
      setMessage({
        type: 'error',
        text: `Erreur: ${error?.message || 'Erreur inconnue'}`
      })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setUpdating(null)
    }
  }

  const getMethodLabel = (method: string): string => {
    switch (method) {
      case 'paypal':
        return 'PayPal'
      case 'card':
        return 'Carte bancaire (Monetico)'
      default:
        return method
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'paypal':
        return <Wallet className="w-6 h-6 text-blue-500" />
      case 'card':
        return <CreditCard className="w-6 h-6 text-yellow-500" />
      default:
        return <CreditCard className="w-6 h-6" />
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Gestion des Moyens de Paiement</h1>
          <p className="text-gray-400">Activez ou masquez temporairement les moyens de paiement disponibles</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <span className="ml-3 text-gray-400">Chargement...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-noir-800/50 border rounded-xl p-6 transition-all ${
                  method.enabled
                    ? 'border-green-500/30 hover:border-green-500/50'
                    : 'border-red-500/30 hover:border-red-500/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getMethodIcon(method.method)}
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {getMethodLabel(method.method)}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {method.enabled ? (
                          <span className="flex items-center gap-2 text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Actif - Visible sur le site
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-400">
                            <XCircle className="w-4 h-4" />
                            Masqué - Non visible sur le site
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggle(method.method, method.enabled)}
                    disabled={updating === method.method}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      method.enabled
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                    } ${updating === method.method ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {updating === method.method ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mise à jour...</span>
                      </>
                    ) : method.enabled ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Masquer</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Activer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}

            {paymentMethods.length === 0 && (
              <div className="bg-noir-800/50 border border-red-500/30 rounded-xl p-8 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Aucun moyen de paiement trouvé
                </h3>
                <p className="text-gray-400 mb-4">
                  Assurez-vous que la table <code className="bg-noir-900 px-2 py-1 rounded">payment_methods</code> existe dans Supabase
                  et que le script SQL a été exécuté.
                </p>
                <button
                  onClick={loadData}
                  className="btn btn-primary"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">
            💡 Note importante
          </h3>
          <p className="text-gray-300 text-sm">
            Les changements sont appliqués immédiatement. Les moyens de paiement masqués ne seront plus visibles
            sur la page de checkout. Vous pouvez les réactiver à tout moment depuis cette page.
          </p>
        </div>
      </div>
    </div>
  )
}
