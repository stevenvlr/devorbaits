'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getBoxtalToken } from '@/src/lib/getBoxtalToken'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

// URL par défaut (fallback si non trouvée dans Supabase)
const DEFAULT_BOXTAL_MAP_SCRIPT_SRC = process.env.NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC || 'https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js'

// Clés de cache localStorage
const CACHE_SCRIPT_URL_KEY = 'boxtal_script_url'
const CACHE_SCRIPT_URL_EXPIRY_KEY = 'boxtal_script_url_expiry'
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 heures

export interface BoxtalParcelPoint {
  code: string
  name: string
  address?: {
    street?: string
    postalCode?: string
    city?: string
    country?: string
  }
  coordinates?: {
    latitude?: number
    longitude?: number
  }
  network?: string
  [key: string]: any
}

interface BoxtalRelayMapProps {
  active: boolean
  onSelect?: (parcelPoint: BoxtalParcelPoint) => void
  initialCity?: string
  initialPostalCode?: string
}

declare global {
  interface Window {
    BoxtalParcelPointMap?: {
      BoxtalParcelPointMap?: any
      searchParcelPoints?: (params: any, callback: (points: any[]) => void) => void
    }
  }
}

// Fonction utilitaire pour récupérer l'URL depuis le cache
function getCachedScriptUrl(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const expiry = localStorage.getItem(CACHE_SCRIPT_URL_EXPIRY_KEY)
    if (expiry && Date.now() < parseInt(expiry, 10)) {
      return localStorage.getItem(CACHE_SCRIPT_URL_KEY)
    }
  } catch {
    // Ignorer les erreurs localStorage
  }
  return null
}

// Fonction utilitaire pour mettre en cache l'URL
function setCachedScriptUrl(url: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_SCRIPT_URL_KEY, url)
    localStorage.setItem(CACHE_SCRIPT_URL_EXPIRY_KEY, String(Date.now() + CACHE_DURATION_MS))
  } catch {
    // Ignorer les erreurs localStorage
  }
}

// Charger un script dynamiquement
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Vérifier si le script est déjà chargé ET l'API disponible
    if (window.BoxtalParcelPointMap?.BoxtalParcelPointMap) {
      resolve()
      return
    }
    
    // Supprimer l'ancien script s'il existe
    const existingScript = document.getElementById('boxtal-script')
    if (existingScript) {
      existingScript.remove()
    }
    
    const script = document.createElement('script')
    script.id = 'boxtal-script'
    script.src = src
    script.async = true
    
    script.onload = () => {
      // Vérifier que l'API est disponible après le chargement
      setTimeout(() => {
        if (window.BoxtalParcelPointMap?.BoxtalParcelPointMap) {
          resolve()
        } else {
          // Réessayer après un délai
          setTimeout(() => {
            if (window.BoxtalParcelPointMap?.BoxtalParcelPointMap) {
              resolve()
            } else {
              reject(new Error('API Boxtal non disponible après chargement'))
            }
          }, 300)
        }
      }, 100)
    }
    
    script.onerror = () => {
      reject(new Error('Impossible de charger le script Boxtal'))
    }
    
    document.head.appendChild(script)
  })
}

export default function BoxtalRelayMap({
  active,
  onSelect,
  initialCity = '',
  initialPostalCode = ''
}: BoxtalRelayMapProps) {
  // ID unique pour ce composant
  const componentIdRef = useRef(`boxtal-${Math.random().toString(36).slice(2)}`)
  const mapId = componentIdRef.current

  // Refs
  const hostRef = useRef<HTMLDivElement>(null)
  const mapContainerElementRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const autoSearchDoneRef = useRef(false)
  const isMountedRef = useRef(true)

  // États
  const [scriptSrc, setScriptSrc] = useState<string>(DEFAULT_BOXTAL_MAP_SCRIPT_SRC)
  const [isLoading, setIsLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchCity, setSearchCity] = useState(initialCity)
  const [searchPostalCode, setSearchPostalCode] = useState(initialPostalCode)
  const [selectedParcelPoint, setSelectedParcelPoint] = useState<BoxtalParcelPoint | null>(null)
  const [searching, setSearching] = useState(false)

  // Effet de montage/démontage
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Charger les ressources (URL script + token + script) au montage
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      setIsLoading(true)
      setError(null)
      setScriptLoaded(false)
      setMapReady(false)

      try {
        // 1. Récupérer l'URL du script
        let url = getCachedScriptUrl() || DEFAULT_BOXTAL_MAP_SCRIPT_SRC
        
        if (!getCachedScriptUrl() && isSupabaseConfigured()) {
          const supabase = getSupabaseClient()
          if (supabase) {
            try {
              const { data } = await supabase
                .from('boxtal_config')
                .select('map_script_url')
                .limit(1)
                .single()
              
              if (data?.map_script_url) {
                url = data.map_script_url
                setCachedScriptUrl(url)
              }
            } catch {
              // Utiliser l'URL par défaut
            }
          }
        }

        if (cancelled) return
        setScriptSrc(url)

        // 2. Charger le token en parallèle avec le script
        const [tokenResult] = await Promise.allSettled([
          getBoxtalToken(),
          loadScript(url)
        ])

        if (cancelled) return

        if (tokenResult.status === 'fulfilled') {
          setToken(tokenResult.value)
        } else {
          throw new Error('Impossible de récupérer le token Boxtal')
        }

        // Vérifier que le script est bien chargé
        if (!window.BoxtalParcelPointMap?.BoxtalParcelPointMap) {
          throw new Error('API Boxtal non disponible')
        }

        setScriptLoaded(true)
        setIsLoading(false)

      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Erreur de chargement')
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, []) // Se relance à chaque montage du composant

  // Initialiser la carte quand tout est prêt
  useEffect(() => {
    if (!active || !scriptLoaded || !token || !hostRef.current) {
      return
    }

    // Vérifier que l'API est disponible
    if (!window.BoxtalParcelPointMap?.BoxtalParcelPointMap) {
      setError("L'API Boxtal n'est pas disponible")
      return
    }

    // Si déjà initialisé, ne pas réinitialiser
    if (mapContainerElementRef.current && mapContainerElementRef.current.isConnected && mapInstanceRef.current) {
      return
    }

    // Nettoyer si nécessaire
    if (mapContainerElementRef.current && !mapContainerElementRef.current.isConnected) {
      mapContainerElementRef.current = null
      mapInstanceRef.current = null
    }

    const BoxtalParcelPointMap = window.BoxtalParcelPointMap.BoxtalParcelPointMap

    // Créer le conteneur de la carte
    const mapContainer = document.createElement('div')
    mapContainer.id = mapId
    mapContainer.style.cssText = `
      width: 100%;
      height: 450px;
      min-height: 450px;
      max-height: 450px;
      position: relative;
      background-color: #f3f4f6;
      overflow: hidden;
    `
    mapContainer.className = 'w-full border border-gray-300 rounded-md'

    // Vider le conteneur de manière sûre (sans conflit avec React)
    try {
      while (hostRef.current.firstChild) {
        hostRef.current.removeChild(hostRef.current.firstChild)
      }
    } catch {
      // Ignorer les erreurs de suppression
    }
    hostRef.current.appendChild(mapContainer)
    mapContainerElementRef.current = mapContainer

    // Initialiser la carte
    try {
      mapInstanceRef.current = new BoxtalParcelPointMap({
        domToLoadMap: '#' + mapId,
        accessToken: token,
        config: {
          locale: 'fr',
          parcelPointNetworks: [{ code: 'CHRP_NETWORK' }],
          options: {
            autoSelectNearestParcelPoint: false
          }
        },
        onMapLoaded: () => {
          if (isMountedRef.current) {
            setTimeout(() => {
              if (isMountedRef.current) {
                setMapReady(true)
              }
            }, 300)
          }
        },
        onParcelPointSelected: (parcelPoint: any) => {
          if (!isMountedRef.current) return
          
          // Normaliser l'adresse
          let normalizedAddress: any = {}
          
          if (parcelPoint.address) {
            normalizedAddress = {
              street: parcelPoint.address.street || parcelPoint.address.address || parcelPoint.address.line1 || '',
              postalCode: parcelPoint.address.postalCode || parcelPoint.address.postal_code || parcelPoint.address.zipCode || '',
              city: parcelPoint.address.city || parcelPoint.address.ville || parcelPoint.address.locality || '',
              country: parcelPoint.address.country || parcelPoint.address.countryCode || 'FR'
            }
          }
          
          if (!normalizedAddress.postalCode) {
            normalizedAddress.postalCode = parcelPoint.postalCode || parcelPoint.postal_code || parcelPoint.zipCode || ''
          }
          if (!normalizedAddress.city) {
            normalizedAddress.city = parcelPoint.city || parcelPoint.ville || parcelPoint.locality || ''
          }
          if (!normalizedAddress.street) {
            normalizedAddress.street = parcelPoint.street || parcelPoint.address || parcelPoint.line1 || ''
          }
          
          const point: BoxtalParcelPoint = {
            code: parcelPoint.code || parcelPoint.id || '',
            name: parcelPoint.name || parcelPoint.nom || '',
            address: normalizedAddress,
            coordinates: parcelPoint.coordinates || parcelPoint.coordonnees || {},
            network: parcelPoint.network || parcelPoint.networkCode || '',
            rawData: parcelPoint,
            ...parcelPoint
          }
          
          setSelectedParcelPoint(point)
          onSelect?.(point)
        }
      })
    } catch (err: any) {
      setError(err.message || "Erreur d'initialisation de la carte")
    }

    return () => {
      // Cleanup quand le composant se démonte ou active devient false
      // Ne PAS manipuler le DOM ici car React le fait automatiquement
      // Juste nettoyer les refs
      mapContainerElementRef.current = null
      mapInstanceRef.current = null
    }
  }, [active, scriptLoaded, token, mapId, onSelect])

  // Recherche automatique si code postal pré-rempli
  useEffect(() => {
    if (mapReady && initialPostalCode && initialPostalCode.length >= 5 && !autoSearchDoneRef.current) {
      autoSearchDoneRef.current = true
      setTimeout(() => {
        handleSearchInternal(initialPostalCode, initialCity)
      }, 200)
    }
  }, [mapReady, initialPostalCode, initialCity])

  // Fonction de recherche
  const handleSearchInternal = useCallback((postalCode: string, city: string) => {
    if (!postalCode || postalCode.length < 5) return

    setError(null)
    setSearching(true)

    const map = mapInstanceRef.current

    if (!map || typeof map.searchParcelPoints !== "function" || !mapReady) {
      setSearching(false)
      return
    }

    const address = { 
      country: "FR", 
      city: city.trim(), 
      zipCode: postalCode.trim() 
    }

    let tries = 0

    const run = () => {
      try {
        map.searchParcelPoints.call(map, address, (parcelPoint: any) => {
          setSelectedParcelPoint(parcelPoint)
          onSelect?.(parcelPoint)
          setSearching(false)
        })
      } catch (e: any) {
        const msg = String(e?.message || e)

        if (msg.includes("sendCallbackEvent") && tries < 5) {
          tries += 1
          setTimeout(run, 100)
          return
        }

        setError("Erreur lors de la recherche")
        setSearching(false)
      }
    }

    run()
  }, [mapReady, onSelect])

  const handleSearch = () => {
    handleSearchInternal(searchPostalCode, searchCity)
  }

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-blue-700 font-medium">Chargement de la carte...</p>
        </div>
      </div>
    )
  }

  // Affichage en cas d'erreur
  if (error && !scriptLoaded) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700 font-medium">Erreur : {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-red-600 underline"
        >
          Recharger la page
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Formulaire de recherche */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="boxtal-city" className="block text-sm font-medium mb-1">
            Ville
          </label>
          <input
            id="boxtal-city"
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="Paris"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="boxtal-postal-code" className="block text-sm font-medium mb-1">
            Code postal <span className="text-red-500">*</span>
          </label>
          <input
            id="boxtal-postal-code"
            type="text"
            value={searchPostalCode}
            onChange={(e) => setSearchPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="75001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
            maxLength={5}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={!mapReady || !searchPostalCode || searchPostalCode.length < 5 || searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {searching ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Conteneur de la carte */}
      <div
        ref={hostRef}
        style={{ 
          minHeight: active ? 450 : 0, 
          maxHeight: active ? 450 : 0,
          height: active ? '450px' : '0',
          position: 'relative',
          overflow: 'hidden',
          display: active ? 'block' : 'none'
        }}
        className="w-full"
      >
        {active && !mapReady && (
          <div 
            className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 rounded-md" 
            style={{ zIndex: 10 }}
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Initialisation de la carte...</p>
            </div>
          </div>
        )}
      </div>

      {/* Point sélectionné */}
      {selectedParcelPoint && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-900 mb-1 text-sm">✓ Point relais sélectionné</h3>
          <div className="text-xs text-green-800">
            <p><strong>{selectedParcelPoint.name}</strong></p>
            {selectedParcelPoint.address?.street && <p>{selectedParcelPoint.address.street}</p>}
            {(selectedParcelPoint.address?.postalCode || selectedParcelPoint.address?.city) && (
              <p>{selectedParcelPoint.address?.postalCode} {selectedParcelPoint.address?.city}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
