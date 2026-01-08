'use client'

import { useState, useEffect } from 'react'

export function usePrixPersonnalises() {
  const [prixPersonnalises, setPrixPersonnalises] = useState<Record<string, number>>({})

  useEffect(() => {
    const loadPrices = () => {
      const saved = localStorage.getItem('site-prix-personnalises')
      if (saved) {
        setPrixPersonnalises(JSON.parse(saved))
      }
    }
    
    // Charger au démarrage
    loadPrices()
    
    // Écouter les changements de localStorage (pour les autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'site-prix-personnalises') {
        loadPrices()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Écouter les changements dans le même onglet (via un événement personnalisé)
    const handleCustomStorageChange = () => {
      loadPrices()
    }
    
    window.addEventListener('prix-updated', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('prix-updated', handleCustomStorageChange)
    }
  }, [])

  return prixPersonnalises
}














