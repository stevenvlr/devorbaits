'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'

export default function DebugAuthPage() {
  const { user, isAuthenticated } = useAuth()
  // Le contexte d'auth ne fournit pas toujours un état "loading" typé.
  // Pour cette page de diagnostic, on affiche simplement "Terminé".
  const loading = false
  const [localStorageData, setLocalStorageData] = useState<any>(null)

  const checkLocalStorage = () => {
    if (typeof window === 'undefined') return
    
    const data: any = {
      user: localStorage.getItem('user'),
      users: localStorage.getItem('users'),
      supabaseKeys: []
    }
    
    // Chercher les clés Supabase
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        data.supabaseKeys.push(key)
      }
    }
    
    setLocalStorageData(data)
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Diagnostic d'Authentification</h1>
          <p className="text-gray-400">
            Cette page vous aide à diagnostiquer les problèmes de connexion
          </p>
        </div>

        <div className="space-y-6">
          {/* État de l'authentification */}
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">État de l'authentification</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Chargement :</span>
                {loading ? (
                  <span className="text-yellow-500">En cours...</span>
                ) : (
                  <span className="text-green-500">Terminé</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Authentifié :</span>
                {isAuthenticated ? (
                  <span className="text-green-500 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Oui
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Non
                  </span>
                )}
              </div>
              {user && (
                <div className="mt-4 p-4 bg-noir-900/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Utilisateur connecté :</p>
                  <p className="text-white font-semibold">{user.email}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {user.nom} {user.prenom} (ID: {user.id})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Supabase */}
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Configuration Supabase</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Supabase configuré :</span>
                {isSupabaseConfigured() ? (
                  <span className="text-green-500 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Oui
                  </span>
                ) : (
                  <span className="text-red-500 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Non
                  </span>
                )}
              </div>
              {typeof window !== 'undefined' && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_URL :</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-500' : 'text-red-500'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configuré' : '✗ Non configuré'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_ANON_KEY :</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-500' : 'text-red-500'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Configuré' : '✗ Non configuré'}
                    </span>
                  </div>
                  {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                      <p className="text-sm text-yellow-400 mb-2">
                        <strong>Comment récupérer ces clés :</strong>
                      </p>
                      <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1">
                        <li>Allez sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">supabase.com</a> et connectez-vous</li>
                        <li>Ouvrez votre projet</li>
                        <li>Allez dans <strong>Settings {'>'} API</strong></li>
                        <li>Copiez <strong>Project URL</strong> → c'est votre NEXT_PUBLIC_SUPABASE_URL</li>
                        <li>Copiez la clé <strong>anon public</strong> → c'est votre NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                        <li>Ajoutez-les dans <code className="bg-noir-900 px-1 py-0.5 rounded">.env.local</code></li>
                        <li>Redémarrez le serveur</li>
                      </ol>
                      <p className="text-xs text-gray-400 mt-2">
                        Consultez le guide complet : <code className="bg-noir-900 px-1 py-0.5 rounded">GUIDE_RECUPERER_CLES_SUPABASE.md</code>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LocalStorage */}
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">LocalStorage</h2>
            <button
              onClick={checkLocalStorage}
              className="mb-4 px-4 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Vérifier le localStorage
            </button>
            {localStorageData && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Clé 'user' :</p>
                  <div className="bg-noir-900/50 rounded-lg p-3">
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {localStorageData.user ? JSON.stringify(JSON.parse(localStorageData.user), null, 2) : 'Aucune donnée'}
                    </pre>
                  </div>
                </div>
                {localStorageData.supabaseKeys.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Clés Supabase trouvées :</p>
                    <ul className="list-disc list-inside text-sm text-gray-300">
                      {localStorageData.supabaseKeys.map((key: string) => (
                        <li key={key}>{key}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Actions de dépannage</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.clear()
                    alert('LocalStorage nettoyé ! Rechargez la page.')
                    window.location.reload()
                  }
                }}
                className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                Nettoyer complètement le localStorage
              </button>
              <p className="text-xs text-gray-400">
                ⚠️ Cette action supprimera toutes les données du localStorage. Vous devrez vous reconnecter.
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-400 mb-2">Comment diagnostiquer</h3>
                <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
                  <li>Ouvrez la console du navigateur (F12)</li>
                  <li>Allez sur la page de connexion</li>
                  <li>Essayez de vous connecter</li>
                  <li>Regardez les messages dans la console qui commencent par [loginUser], [AuthContext], ou [LoginPage]</li>
                  <li>Copiez les messages d'erreur et partagez-les</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
