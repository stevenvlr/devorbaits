'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, Database, Image, Users, Package, Key } from 'lucide-react'
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase'

export default function SupabaseTestPage() {
  const [tests, setTests] = useState<Record<string, { status: 'loading' | 'success' | 'error'; message: string }>>({})
  const [isConfig, setIsConfig] = useState(false)

  useEffect(() => {
    checkSupabase()
  }, [])

  const checkSupabase = async () => {
    const results: Record<string, { status: 'loading' | 'success' | 'error'; message: string }> = {}

    // Test 1: Configuration
    setIsConfig(isSupabaseConfigured())
    if (!isSupabaseConfigured()) {
      setTests({
        config: { status: 'error', message: 'Supabase n\'est pas configuré (variables d\'environnement manquantes)' }
      })
      return
    }

    results.config = { status: 'success', message: 'Supabase est configuré' }
    setTests(results)

    const supabase = getSupabaseClient()
    if (!supabase) {
      results.client = { status: 'error', message: 'Impossible de créer le client Supabase' }
      setTests(results)
      return
    }

    // Test 2: Connexion à la base de données
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      if (error) throw error
      results.database = { status: 'success', message: 'Connexion à la base de données réussie' }
    } catch (error: any) {
      results.database = { status: 'error', message: `Erreur: ${error.message}` }
    }
    setTests({ ...results })

    // Test 3: Table profiles
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1)
      if (error) throw error
      results.profiles = { status: 'success', message: 'Table profiles accessible' }
    } catch (error: any) {
      results.profiles = { status: 'error', message: `Erreur: ${error.message}` }
    }
    setTests({ ...results })

    // Test 4: Table stock
    try {
      const { data, error } = await supabase.from('stock').select('id').limit(1)
      if (error) throw error
      results.stock = { status: 'success', message: 'Table stock accessible' }
    } catch (error: any) {
      results.stock = { status: 'error', message: `Erreur: ${error.message}` }
    }
    setTests({ ...results })

    // Test 5: Table products
    try {
      const { data, error, count } = await supabase.from('products').select('*', { count: 'exact' }).limit(1)
      if (error) throw error
      results.products = { status: 'success', message: `Table products accessible - ${count || 0} produit(s) trouvé(s)` }
    } catch (error: any) {
      results.products = { status: 'error', message: `Erreur: ${error.message}` }
    }
    setTests({ ...results })

    // Test 6: Bucket product-images
    try {
      const { data, error } = await supabase.storage.from('product-images').list('', { limit: 1 })
      if (error) throw error
      results.bucketImages = { status: 'success', message: 'Bucket product-images accessible' }
    } catch (error: any) {
      results.bucketImages = { status: 'error', message: `Erreur: ${error.message}` }
    }
    setTests({ ...results })

    // Test 7: Bucket site-assets
    try {
      const { data, error } = await supabase.storage.from('site-assets').list('', { limit: 1 })
      if (error) throw error
      results.bucketAssets = { status: 'success', message: 'Bucket site-assets accessible' }
    } catch (error: any) {
      results.bucketAssets = { status: 'error', message: `Erreur: ${error.message}` }
    }
    setTests({ ...results })

    // Test 8: Authentification Supabase
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError && authError.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
        throw authError
      }
      if (user) {
        results.auth = { status: 'success', message: `Authentification OK - Utilisateur connecté: ${user.email || user.id}` }
      } else {
        results.auth = { status: 'success', message: 'Service d\'authentification accessible (aucun utilisateur connecté)' }
      }
    } catch (error: any) {
      if (error.message?.includes('API key') || error.message?.includes('apikey')) {
        results.auth = { status: 'error', message: 'Erreur de clé API Supabase. Vérifiez NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local' }
      } else {
        results.auth = { status: 'error', message: `Erreur d'authentification: ${error.message}` }
      }
    }
    setTests({ ...results })

    // Test 9: Table gammes
    try {
      const { data, error } = await supabase.from('gammes').select('id').limit(1)
      if (error) throw error
      results.gammes = { status: 'success', message: 'Table gammes accessible' }
    } catch (error: any) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        results.gammes = { status: 'error', message: 'Table gammes n\'existe pas. Exécutez le script SQL pour la créer.' }
      } else {
        results.gammes = { status: 'error', message: `Erreur: ${error.message}` }
      }
    }
    setTests({ ...results })
  }

  const getIcon = (status: 'loading' | 'success' | 'error') => {
    if (status === 'loading') return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-green-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const getTestIcon = (key: string) => {
    if (key.includes('bucket')) return <Image className="w-5 h-5" />
    if (key.includes('profiles')) return <Users className="w-5 h-5" />
    if (key.includes('stock')) return <Package className="w-5 h-5" />
    if (key.includes('auth')) return <Key className="w-5 h-5" />
    if (key.includes('gammes')) return <Package className="w-5 h-5" />
    return <Database className="w-5 h-5" />
  }

  const allSuccess = Object.values(tests).every(t => t.status === 'success')
  const hasError = Object.values(tests).some(t => t.status === 'error')

  return (
    <div className="min-h-screen bg-noir-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-noir-900 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-blanc mb-8 flex items-center gap-3">
            <Database className="w-8 h-8" />
            Test de connexion Supabase
          </h1>

          {!isConfig && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-300 font-semibold mb-2">
                ⚠️ Supabase n'est pas configuré
              </p>
              <p className="text-red-300 text-sm mb-2">
                Vérifiez votre fichier <code className="bg-noir-800 px-2 py-1 rounded">.env.local</code> à la racine du projet
              </p>
              <div className="bg-noir-800 rounded p-3 mt-3">
                <p className="text-gray-300 text-xs font-mono mb-1">NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co</p>
                <p className="text-gray-300 text-xs font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon</p>
              </div>
              <p className="text-yellow-300 text-xs mt-3">
                💡 Après modification, redémarrez le serveur (Ctrl+C puis npm run dev)
              </p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(tests).map(([key, test]) => (
              <div
                key={key}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  test.status === 'success'
                    ? 'bg-green-900/20 border border-green-500/50'
                    : test.status === 'error'
                    ? 'bg-red-900/20 border border-red-500/50'
                    : 'bg-noir-800 border border-noir-700'
                }`}
              >
                {getTestIcon(key)}
                <div className="flex-1">
                  <div className="font-semibold text-blanc capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-gray-400">{test.message}</div>
                </div>
                {getIcon(test.status)}
              </div>
            ))}
          </div>

          {allSuccess && (
            <div className="mt-6 bg-green-900/20 border border-green-500 rounded-lg p-4">
              <p className="text-green-300 font-semibold">
                ✅ Tous les tests sont passés ! Supabase fonctionne correctement.
              </p>
            </div>
          )}

          {hasError && !allSuccess && (
            <div className="mt-6 bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-300">
                ⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.
              </p>
            </div>
          )}

          <button
            onClick={checkSupabase}
            className="mt-6 w-full bg-vert-500 hover:bg-vert-600 text-blanc font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Relancer les tests
          </button>
        </div>
      </div>
    </div>
  )
}