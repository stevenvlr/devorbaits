'use client'

import { useState } from 'react'
import { getBoxtalToken } from '@/src/lib/getBoxtalToken'

export default function TestBoxtalTokenPage() {
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setToken(null)

    try {
      const accessToken = await getBoxtalToken()
      setToken(accessToken)
      console.log('✅ Token obtenu:', accessToken)
    } catch (err: any) {
      const errorMessage = err.message || String(err)
      setError(errorMessage)
      console.error('❌ Erreur:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-2">Test Boxtal Token</h1>
          <p className="text-gray-600 mb-6">
            Testez la récupération du token Boxtal depuis l'Edge Function Supabase.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleTest}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Chargement...' : 'Tester getBoxtalToken()'}
            </button>

            {token && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h2 className="font-medium text-green-900 mb-2">✅ Token obtenu avec succès</h2>
                <div className="space-y-2">
                  <p className="text-sm text-green-800">
                    <strong>Token (premiers caractères):</strong> {token.substring(0, 50)}...
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Longueur:</strong> {token.length} caractères
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-green-900">
                      Voir le token complet
                    </summary>
                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-64">
                      {token}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h2 className="font-medium text-red-900 mb-2">❌ Erreur</h2>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2">Informations de configuration</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Non configuré'}
                </p>
                <p>
                  <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
                    : '❌ Non configuré'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Ouvrez la console du navigateur (F12) pour voir les logs détaillés
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
