'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics-supabase'
import { useAuth } from '@/contexts/AuthContext'

// Composant de suivi des analytics (visites)
export default function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    const qs = searchParams?.toString()
    const fullPath = qs ? `${pathname}?${qs}` : pathname
    trackPageView(fullPath, user?.id || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, user?.id])

  return null
}

