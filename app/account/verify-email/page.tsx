'use client'

import Link from 'next/link'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 text-center">
          {/* Icône animée */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/10 rounded-full mb-6 animate-pulse">
            <Mail className="w-10 h-10 text-yellow-500" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Vérifiez votre boîte mail</h1>
          
          <div className="space-y-4 text-gray-300">
            <p>
              Un email de confirmation a été envoyé à :
            </p>
            {email && (
              <p className="text-yellow-500 font-semibold text-lg">
                {email}
              </p>
            )}
            <p>
              Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-noir-900/50 rounded-lg p-6 text-left">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              À faire :
            </h2>
            <ol className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="bg-yellow-500 text-noir-950 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Ouvrez votre boîte mail</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-yellow-500 text-noir-950 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Cherchez l'email de <strong>Devor Baits</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-yellow-500 text-noir-950 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Cliquez sur le lien de confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-yellow-500 text-noir-950 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                <span>Connectez-vous avec vos identifiants</span>
              </li>
            </ol>
          </div>

          {/* Note spam */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-500">
              💡 Vérifiez vos spams si vous ne trouvez pas l'email !
            </p>
          </div>

          {/* Bouton connexion */}
          <div className="mt-8">
            <Link
              href="/account/login"
              className="inline-flex items-center gap-2 bg-yellow-500 text-noir-950 font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              J'ai confirmé mon email
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Pas reçu d'email ?{' '}
            <Link href="/account/register" className="text-yellow-500 hover:text-yellow-400">
              Réessayer l'inscription
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
