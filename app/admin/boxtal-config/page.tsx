'use client'

import { useState, useEffect } from 'react'
import { Save, Key, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { getBoxtalConfig, saveBoxtalConfig, type BoxtalConfig } from '@/lib/boxtal-config'

export default function BoxtalConfigPage() {
  const [config, setConfig] = useState<Partial<BoxtalConfig>>({
    api_key: '',
    api_secret: '',
    verification_key: '',
    environment: 'test',
    shipping_offer_code: 'MONR-CpourToi',
    from_first_name: 'Votre',
    from_last_name: 'Entreprise',
    from_email: 'contact@example.com',
    from_phone: '+33612345678',
    from_street: '4 boulevard des Capucines',
    from_city: 'Paris',
    from_postal_code: '75009',
    from_country: 'FR'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const data = await getBoxtalConfig()
      if (data) {
        setConfig(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la config:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.api_key || !config.api_secret) {
      setMessage({ type: 'error', text: 'Les clés API sont obligatoires' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)
      
      const success = await saveBoxtalConfig(config)
      
      if (success) {
        setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès !' })
        // Recharger la config pour afficher les données sauvegardées
        await loadConfig()
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <span className="ml-3 text-gray-300">Chargement de la configuration...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Configuration Boxtal API</h1>
          <p className="text-gray-400">
            Configurez vos clés API Boxtal v3 et les informations d'expédition
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
          {/* Section Clés API */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Key className="w-6 h-6 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-white">Clés API Boxtal</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Clé API (API Key) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={config.api_key || ''}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Votre clé API Boxtal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Clé secrète (API Secret) <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={config.api_secret || ''}
                  onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Votre clé secrète Boxtal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Clé de vérification (Verification Key)
                </label>
                <input
                  type="password"
                  value={config.verification_key || ''}
                  onChange={(e) => setConfig({ ...config, verification_key: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Votre clé de vérification Boxtal"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Clé de vérification utilisée pour valider les requêtes Boxtal
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Environnement
                </label>
                <select
                  value={config.environment || 'test'}
                  onChange={(e) => setConfig({ ...config, environment: e.target.value as 'test' | 'production' })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="test">Test</option>
                  <option value="production">Production</option>
                </select>
                <p className="mt-1 text-sm text-gray-400">
                  Utilisez "Test" pour les tests, "Production" pour les expéditions réelles
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Code d'offre de transport
                </label>
                <input
                  type="text"
                  value={config.shipping_offer_code || ''}
                  onChange={(e) => setConfig({ ...config, shipping_offer_code: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="MONR-CpourToi"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Code de l'offre de transport configurée dans votre compte Boxtal
                </p>
              </div>
            </div>
          </div>

          {/* Section Adresse expéditeur */}
          <div className="mb-8 border-t border-noir-700 pt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Adresse expéditeur</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={config.from_first_name || ''}
                  onChange={(e) => setConfig({ ...config, from_first_name: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={config.from_last_name || ''}
                  onChange={(e) => setConfig({ ...config, from_last_name: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={config.from_email || ''}
                  onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={config.from_phone || ''}
                  onChange={(e) => setConfig({ ...config, from_phone: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={config.from_street || ''}
                  onChange={(e) => setConfig({ ...config, from_street: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={config.from_city || ''}
                  onChange={(e) => setConfig({ ...config, from_city: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  value={config.from_postal_code || ''}
                  onChange={(e) => setConfig({ ...config, from_postal_code: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pays
                </label>
                <input
                  type="text"
                  value={config.from_country || ''}
                  onChange={(e) => setConfig({ ...config, from_country: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-yellow-500 text-noir-950 rounded-lg hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-noir-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Sauvegarder la configuration
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informations */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-semibold mb-1 text-yellow-400">Informations importantes :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Les clés API sont stockées de manière sécurisée dans Supabase</li>
                <li>Utilisez le mode "Test" pour tester sans créer de vraies expéditions</li>
                <li>Le code d'offre de transport doit correspondre à celui configuré dans votre compte Boxtal</li>
                <li>L'adresse expéditeur sera utilisée pour toutes les expéditions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

