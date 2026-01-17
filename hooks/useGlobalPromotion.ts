'use client'

import { useState, useEffect } from 'react'
import { loadGlobalPromotion, onGlobalPromotionUpdate, type GlobalPromotion } from '@/lib/global-promotion-manager'

export function useGlobalPromotion() {
  const [promotion, setPromotion] = useState<GlobalPromotion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPromotion = async () => {
      setLoading(true)
      try {
        const activePromotion = await loadGlobalPromotion()
        setPromotion(activePromotion)
      } catch (error) {
        console.error('Erreur lors du chargement de la promotion:', error)
        setPromotion(null)
      } finally {
        setLoading(false)
      }
    }

    // Charger au démarrage
    loadPromotion()

    // Écouter les mises à jour
    const unsubscribe = onGlobalPromotionUpdate(() => {
      loadPromotion()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { promotion, loading }
}
