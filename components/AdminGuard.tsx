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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
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
      // Si l'utilisateur n'est pas authentifié, rediriger vers login
      if (!isAuthenticated || !user) {
        console.log('[AdminGuard] Utilisateur non authentifié, redirection vers login')
        router.push('/account/login?redirect=/admin')
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
        router.push('/account/login?redirect=/admin')
      } finally {
        setLoading(false)
      }
    }

    verifyAdmin()
  }, [hasChecked, isAuthenticated, user, router])

  if (loading || isAdmin === null) {
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
    return null // La redirection est gérée dans le useEffect
  }

  return <>{children}</>
}
