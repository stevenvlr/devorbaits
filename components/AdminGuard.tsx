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

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!isAuthenticated || !user) {
        router.push('/account/login?redirect=/admin')
        return
      }

      try {
        const adminStatus = await checkIsAdmin()
        setIsAdmin(adminStatus)
        
        if (!adminStatus) {
          router.push('/account?error=unauthorized')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification admin:', error)
        router.push('/account/login?redirect=/admin')
      } finally {
        setLoading(false)
      }
    }

    verifyAdmin()
  }, [isAuthenticated, user, router])

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
