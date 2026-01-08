'use client'

import { useEffect } from 'react'
import { AlertCircle, Home } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur pour le débogage
    console.error('Erreur dans la page admin:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-noir-800/50 border border-red-500/50 rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-red-500">Erreur</h1>
        <p className="text-gray-400 mb-6">
          Une erreur s'est produite dans la page d'administration.
        </p>
        
        {error.message && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Réessayer
          </button>
          
          <Link
            href="/admin"
            className="px-6 py-3 bg-noir-700 text-white font-bold rounded-lg hover:bg-noir-600 transition-colors flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Retour à l'admin
          </Link>
        </div>
      </div>
    </div>
  )
}
