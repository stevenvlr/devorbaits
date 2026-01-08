'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, AlertCircle, Info } from 'lucide-react'

interface TestResult {
  step: string
  success: boolean
  message: string
  details?: any
}

export default function BoxtalTestPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    setLoading(true)
    setResults([])
    setError(null)

    try {
      // Appel à la route API côté serveur pour éviter les problèmes CORS
      const response = await fetch('/api/boxtal/test')
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.results) {
        setResults(data.results)
      } else {
        setError(data.results?.[0]?.message || 'Erreur lors du test')
        setResults(data.results || [])
      }
    } catch (err: any) {
      console.error('Erreur test Boxtal:', err)
      setError(err.message || 'Erreur lors du test. Vérifiez votre connexion internet et que le serveur est démarré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Test de Configuration Boxtal</h1>
          <p className="text-gray-400">
            Cette page permet de tester votre configuration Boxtal API v3 et de vérifier que tout fonctionne correctement.
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          {/* Configuration des clés API */}
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400 mb-2">Configuration des clés API</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Si vous voyez "Clés API non configurées", suivez ces étapes :
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2 mb-3">
                  <li>Connectez-vous à votre compte Boxtal sur <a href="https://developer.boxtal.com" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">developer.boxtal.com</a></li>
                  <li>Créez une application <strong>API v3</strong> si vous n'en avez pas</li>
                  <li>Copiez votre <strong>Access Key</strong> et <strong>Secret Key</strong></li>
                  <li>Ajoutez-les dans le fichier <code className="bg-noir-900 px-2 py-1 rounded">.env.local</code> à la racine du projet :</li>
                </ol>
                <div className="bg-noir-900 rounded-lg p-3 mb-3">
                  <code className="text-xs text-gray-300">
                    NEXT_PUBLIC_BOXTAL_API_KEY=votre_access_key_ici<br />
                    NEXT_PUBLIC_BOXTAL_API_SECRET=votre_secret_key_ici
                  </code>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Important :</strong> Redémarrez le serveur après avoir modifié <code className="bg-noir-900 px-1 py-0.5 rounded">.env.local</code>
                </p>
                <p className="text-xs text-gray-400">
                  Consultez le guide complet : <code className="bg-noir-900 px-1 py-0.5 rounded">GUIDE_CONFIGURER_CLES_API_BOXTAL.md</code>
                </p>
              </div>
            </div>
          </div>

          {/* Vérification du paiement automatique */}
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Vérification du paiement automatique</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Pour vérifier que votre compte Boxtal est en paiement automatique :
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                  <li>Connectez-vous à <a href="https://www.boxtal.com" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">boxtal.com</a></li>
                  <li>Allez dans <strong>"Paramètres"</strong> ou <strong>"Mon compte"</strong></li>
                  <li>Cherchez la section <strong>"Facturation"</strong> ou <strong>"Paiement"</strong></li>
                  <li>Vérifiez que <strong>"Facturation automatique"</strong> est activée</li>
                  <li>Vérifiez qu'un mode de paiement est enregistré (carte bancaire, prélèvement, etc.)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons de test */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-6 space-y-3">
          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full bg-yellow-500 text-noir-950 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Lancer le test de configuration
              </>
            )}
          </button>
          
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/boxtal/verify-keys')
                const data = await response.json()
                alert(data.success 
                  ? 'Format des clés correct !' 
                  : `Problèmes détectés:\n${data.details?.issues?.join('\n') || data.message}`)
              } catch (err: any) {
                alert('Erreur: ' + err.message)
              }
            }}
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4" />
            Vérifier le format des clés
          </button>
        </div>

        {/* Erreur générale */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Résultats */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Résultats des tests</h2>
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-xl p-6 ${
                  result.success
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-red-500/10 border-red-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{result.step}</h3>
                    <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                      {result.message}
                    </p>
                    {result.details && (
                      <div className="mt-3 bg-noir-900/50 rounded-lg p-3">
                        {result.details.suggestions ? (
                          <div>
                            <p className="text-xs text-gray-400 mb-2">Suggestions :</p>
                            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                              {result.details.suggestions.map((suggestion: string, idx: number) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                            {result.details.error && (
                              <div className="mt-3 pt-3 border-t border-noir-700">
                                <p className="text-xs text-gray-400 mb-1">Détails de l'erreur :</p>
                                <pre className="text-xs text-gray-300 overflow-x-auto">
                                  {typeof result.details.error === 'string' 
                                    ? result.details.error 
                                    : JSON.stringify(result.details.error, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <pre className="text-xs text-gray-300 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note importante */}
        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">Note importante</h3>
              <p className="text-sm text-gray-300">
                Les tests sont effectués en mode <strong>test</strong> (api.boxtal.build). 
                Les commandes créées lors des tests ne seront <strong>pas facturées</strong>.
                Pour utiliser l'API en production, assurez-vous d'utiliser <strong>api.boxtal.com</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
