'use client'

import Link from 'next/link'
import { X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type AccountMigrationBannerProps = {
  enabled?: boolean
}

export default function AccountMigrationBanner({ enabled = true }: AccountMigrationBannerProps) {
  const { isAuthenticated } = useAuth()
  const [isVisible, setIsVisible] = useState(true)

  if (!enabled || !isVisible || isAuthenticated) return null

  return (
    <div className="border-b border-yellow-500/20 bg-yellow-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-100/90">
              <span className="font-semibold text-yellow-100">Nouveau site :</span>{' '}
              pour accéder à votre espace client, merci de <span className="font-semibold">recréer votre compte</span>.
              Les anciens identifiants ne sont pas transférés.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/account/register"
              className="inline-flex items-center justify-center rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-noir-950 hover:bg-yellow-400 transition-colors"
            >
              Créer mon compte
            </Link>
            <Link
              href="/account/login"
              className="inline-flex items-center justify-center rounded-lg border border-yellow-500/40 px-3 py-2 text-sm font-semibold text-yellow-100 hover:border-yellow-500/70 hover:bg-yellow-500/10 transition-colors"
            >
              Se connecter
            </Link>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-yellow-100/80 hover:text-yellow-100 hover:bg-yellow-500/10 transition-colors"
              aria-label="Fermer le bandeau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

