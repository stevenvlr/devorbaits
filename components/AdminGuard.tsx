'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkIsAdmin } from '@/lib/auth-supabase'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)

  // Logs de débogage
  useEffect(() => {
    console.log('[AdminGuard] État:', { isAuthenticated, hasUser: !!user, userEmail: user?.email, userRole: user?.role })
  }, [isAuthenticated, user])

  useEffect(() => {
    // Attendre un délai pour laisser le contexte d'authentification se charger
    const timer = setTimeout(() => {
      setHasChecked(true)
    }, 1000) // Délai pour laisser Supabase charger
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Ne vérifier que si on a attendu le délai initial
    if (!hasChecked) return

    const verifyAdmin = async () => {
      const redirectPath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/admin'

      // Si l'utilisateur n'est pas authentifié, rediriger vers login
      if (!isAuthenticated || !user) {
        console.log('[AdminGuard] Utilisateur non authentifié, redirection vers login')
        setIsAdmin(false)
        router.push(`/account/login?redirect=${encodeURIComponent(redirectPath)}`)
        setLoading(false)
        return
      }

      try {
        console.log('[AdminGuard] Vérification des permissions admin pour:', user.email)
        const adminStatus = await checkIsAdmin()
        console.log('[AdminGuard] Statut admin:', adminStatus)
        setIsAdmin(adminStatus)
        
        if (!adminStatus) {
          console.log('[AdminGuard] Utilisateur non admin, redirection vers /account')
          router.push('/account?error=unauthorized')
        }
      } catch (error) {
        console.error('[AdminGuard] Erreur lors de la vérification admin:', error)
        setIsAdmin(false)
        router.push(`/account/login?redirect=${encodeURIComponent(redirectPath)}`)
      } finally {
        setLoading(false)
      }
    }

    verifyAdmin()
  }, [hasChecked, isAuthenticated, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Vérification des permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-xl font-bold mb-2">Accès administration refusé</p>
          <p className="text-gray-400 mb-6">
            Connectez-vous avec un compte <strong>admin</strong> (role = admin dans Supabase).
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                const redirectPath =
                  typeof window !== 'undefined'
                    ? `${window.location.pathname}${window.location.search}`
                    : '/admin'
                router.push(`/account/login?redirect=${encodeURIComponent(redirectPath)}`)
              }}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-noir-950 font-medium rounded-lg transition-colors"
            >
              Se connecter
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-noir-800 hover:bg-noir-700 border border-noir-700 text-gray-200 font-medium rounded-lg transition-colors"
            >
              Retour au site
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
