'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LogIn, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function LoginForm() {
  // TOUS LES HOOKS DOIVENT ÊTRE APPELÉS AVANT TOUT RETURN CONDITIONNEL
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirect = searchParams.get('redirect') || '/account'

  // Logs de débogage
  useEffect(() => {
    console.log('[LoginPage] État:', { isAuthenticated, hasUser: !!user, userEmail: user?.email })
  }, [isAuthenticated, user])

  // Redirection optionnelle si l'utilisateur est déjà connecté (seulement après un délai)
  useEffect(() => {
    // Attendre un peu pour que le contexte se charge
    const timer = setTimeout(() => {
      // Rediriger seulement si on est vraiment sûr que l'utilisateur est connecté
      if (isAuthenticated && user) {
        console.log('[LoginPage] Utilisateur déjà connecté, redirection vers /account')
        router.replace('/account')
      } else {
        console.log('[LoginPage] Utilisateur non connecté, affichage du formulaire')
      }
    }, 1500) // Délai plus long pour laisser Supabase charger
    
    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Tentative de connexion pour:', email)
      const result = await login(email, password)
      console.log('Résultat de la connexion:', result)
      setLoading(false)

      if (result.success) {
        console.log('Connexion réussie, redirection vers:', redirect)
        // Attendre un peu pour que l'état soit mis à jour
        setTimeout(() => {
          router.push(redirect)
        }, 100)
      } else {
        console.error('Erreur de connexion:', result.error)
        setError(result.error || 'Email ou mot de passe incorrect')
      }
    } catch (error: any) {
      setLoading(false)
      console.error('Erreur exception lors de la connexion:', error)
      setError(error.message || 'Erreur lors de la connexion. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>

        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Connexion</h1>
            <p className="text-gray-400">Connectez-vous à votre compte</p>
            {/* Message de débogage */}
            {isAuthenticated && user && (
              <div className="mt-4 bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  Vous êtes déjà connecté en tant que {user.email}. Redirection en cours...
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-500 text-sm font-semibold mb-2">Erreur de connexion</p>
              <p className="text-red-400 text-sm">{error}</p>
              {error.includes('Supabase non configuré') && (
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/50 rounded p-3">
                  <p className="text-yellow-300 text-xs font-semibold mb-2">🔧 Comment configurer Supabase :</p>
                  <ol className="text-yellow-200 text-xs space-y-1 list-decimal list-inside">
                    <li>Créez un fichier <code className="bg-noir-800 px-1 rounded">.env.local</code> à la racine du projet</li>
                    <li>Ajoutez vos clés Supabase (voir <code className="bg-noir-800 px-1 rounded">GUIDE_CONFIGURATION_RAPIDE_SUPABASE.md</code>)</li>
                    <li>Redémarrez le serveur (Ctrl+C puis npm run dev)</li>
                  </ol>
                </div>
              )}
              <p className="text-gray-400 text-xs mt-2">
                💡 Ouvrez la console du navigateur (F12) pour plus de détails sur l'erreur.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-noir-950 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Vous n'avez pas de compte ?{' '}
              <Link href="/account/register" className="text-yellow-500 hover:text-yellow-400">
                Créer un compte
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
