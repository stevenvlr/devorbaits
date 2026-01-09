'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Mail, Lock, User, Phone, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { registerUser } from '@/lib/auth-supabase'

export default function RegisterPage() {
  const router = useRouter()
  const { } = useAuth() // Auth context for future use
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    codePostal: '',
    ville: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (!formData.email || !formData.nom || !formData.prenom) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/account/register/page.tsx:47',message:'handleSubmit - before registerUser',data:{email:formData.email,hasNom:!!formData.nom,hasPrenom:!!formData.prenom},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});

    try {
      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone || undefined,
        adresse: formData.adresse || undefined,
        codePostal: formData.codePostal || undefined,
        ville: formData.ville || undefined
      })
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/account/register/page.tsx:61',message:'handleSubmit - after registerUser',data:{success:result.success,hasUser:!!result.user,hasError:!!result.error,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      setLoading(false)

      if (result.success && result.user) {
        // Rediriger vers la page de vérification d'email
        router.push(`/account/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        setError(result.error || 'Erreur lors de l\'inscription. Veuillez réessayer.')
      }
    } catch (error: any) {
      setLoading(false)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/account/register/page.tsx:77',message:'handleSubmit - catch error',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.error('Erreur inscription:', error)
      setError(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <UserPlus className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Créer un compte</h1>
            <p className="text-gray-400">Rejoignez-nous pour une expérience personnalisée</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de connexion */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-300 border-b border-noir-700 pb-2">
                Informations de connexion
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-300 border-b border-noir-700 pb-2">
                Informations personnelles
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    <User className="w-4 h-4 inline mr-2" />
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-300 border-b border-noir-700 pb-2">
                Adresse (optionnel)
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.codePostal}
                    onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-noir-950 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>

            <p className="text-center text-sm text-gray-400">
              Vous avez déjà un compte ?{' '}
              <Link href="/account/login" className="text-yellow-500 hover:text-yellow-400">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
