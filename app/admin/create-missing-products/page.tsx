'use client'

import { useState, useEffect } from 'react'
import { loadPopupDuoSaveurs } from '@/lib/popup-variables-manager'
import { createMissingFlashBoostAndSprayPlus } from '@/lib/stock-variables-helper'
import { CheckCircle, XCircle, Loader2, Package, Zap, Droplet } from 'lucide-react'

export default function CreateMissingProductsPage() {
  const [loading, setLoading] = useState(false)
  const [saveurs, setSaveurs] = useState<string[]>([])
  const [results, setResults] = useState<{
    flashBoost: { created: number; errors: number; details: string[] }
    sprayPlus: { created: number; errors: number; details: string[] }
  } | null>(null)

  // Charger les saveurs au montage
  useEffect(() => {
    const loadSaveurs = async () => {
      try {
        const loadedSaveurs = await loadPopupDuoSaveurs()
        setSaveurs(loadedSaveurs)
      } catch (error) {
        console.error('Erreur lors du chargement des saveurs:', error)
      }
    }
    loadSaveurs()
  }, [])

  const handleCreateMissing = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const result = await createMissingFlashBoostAndSprayPlus()
      setResults(result)
    } catch (error: any) {
      console.error('Erreur lors de la création:', error)
      setResults({
        flashBoost: {
          created: 0,
          errors: 1,
          details: [`❌ Erreur: ${error?.message || 'Erreur inconnue'}`]
        },
        sprayPlus: {
          created: 0,
          errors: 1,
          details: [`❌ Erreur: ${error?.message || 'Erreur inconnue'}`]
        }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Créer les produits manquants</h1>
          <p className="text-gray-400 mb-6">
            Cette page crée automatiquement tous les produits Flash boost et Spray plus manquants
            pour toutes les saveurs Pop-up Duo existantes.
          </p>

          {/* Liste des saveurs */}
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Saveurs Pop-up Duo ({saveurs.length})</h2>
            {saveurs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {saveurs.map((saveur) => (
                  <div
                    key={saveur}
                    className="px-3 py-2 bg-noir-900 rounded border border-noir-700 text-sm"
                  >
                    {saveur}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Aucune saveur trouvée</p>
            )}
          </div>

          {/* Bouton de création */}
          <button
            onClick={handleCreateMissing}
            disabled={loading || saveurs.length === 0}
            className="btn btn-primary w-full mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Créer tous les produits manquants
              </>
            )}
          </button>

          {/* Résultats */}
          {results && (
            <div className="space-y-6">
              {/* Résumé */}
              <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Résumé</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-noir-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <h3 className="font-semibold">Flash boost</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{results.flashBoost.created} créé(s)</span>
                      </div>
                      {results.flashBoost.errors > 0 && (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{results.flashBoost.errors} erreur(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-noir-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold">Spray plus</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{results.sprayPlus.created} créé(s)</span>
                      </div>
                      {results.sprayPlus.errors > 0 && (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{results.sprayPlus.errors} erreur(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails Flash boost */}
              <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Détails Flash boost
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.flashBoost.details.map((detail, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        detail.startsWith('✅')
                          ? 'bg-green-500/10 text-green-400'
                          : detail.startsWith('❌')
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails Spray plus */}
              <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-500" />
                  Détails Spray plus
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.sprayPlus.details.map((detail, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        detail.startsWith('✅')
                          ? 'bg-green-500/10 text-green-400'
                          : detail.startsWith('❌')
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

