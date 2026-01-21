'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'
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
    __boxtalScriptLoaded?: boolean
    __boxtalToken?: string | null
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

export default function BoxtalRelayMap({
  active,
  onSelect,
  initialCity = '',
  initialPostalCode = ''
}: BoxtalRelayMapProps) {
  // ID stable du conteneur interne (généré une seule fois)
  const mapIdRef = useRef(`parcel-point-map-${Math.random().toString(36).slice(2)}`)
  const mapId = mapIdRef.current

  // Refs
  const hostRef = useRef<HTMLDivElement>(null)
  const mapContainerElementRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const prevActiveRef = useRef(active)
  const autoSearchDoneRef = useRef(false)

  // États - optimisés avec valeurs initiales depuis cache
  const [scriptSrc, setScriptSrc] = useState<string>(() => getCachedScriptUrl() || DEFAULT_BOXTAL_MAP_SCRIPT_SRC)
  const [scriptUrlReady, setScriptUrlReady] = useState(() => !!getCachedScriptUrl())
  const [scriptLoaded, setScriptLoaded] = useState(() => !!window?.__boxtalScriptLoaded)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [token, setToken] = useState<string | null>(() => window?.__boxtalToken || null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [searchCity, setSearchCity] = useState(initialCity)
  const [searchPostalCode, setSearchPostalCode] = useState(initialPostalCode)
  const [selectedParcelPoint, setSelectedParcelPoint] = useState<BoxtalParcelPoint | null>(null)
  const [searching, setSearching] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Charger URL script et token EN PARALLÈLE dès le montage
  useEffect(() => {
    let isMounted = true

    const loadResources = async () => {
      // Lancer les deux requêtes en parallèle
      const [scriptUrlResult, tokenResult] = await Promise.allSettled([
        // 1. Récupérer l'URL du script (si pas en cache)
        (async () => {
          if (getCachedScriptUrl()) {
            return getCachedScriptUrl()
          }
          
          if (!isSupabaseConfigured()) {
            return DEFAULT_BOXTAL_MAP_SCRIPT_SRC
          }

          const supabase = getSupabaseClient()
          if (!supabase) {
            return DEFAULT_BOXTAL_MAP_SCRIPT_SRC
          }

          try {
            const { data, error } = await supabase
              .from('boxtal_config')
              .select('map_script_url')
              .limit(1)
              .single()

            if (error || !data?.map_script_url) {
              return DEFAULT_BOXTAL_MAP_SCRIPT_SRC
            }

            // Mettre en cache
            setCachedScriptUrl(data.map_script_url)
            return data.map_script_url
          } catch {
            return DEFAULT_BOXTAL_MAP_SCRIPT_SRC
          }
        })(),

        // 2. Récupérer le token (si pas déjà en mémoire)
        (async () => {
          if (window.__boxtalToken) {
            return window.__boxtalToken
          }
          
          const accessToken = await getBoxtalToken()
          window.__boxtalToken = accessToken
          return accessToken
        })()
      ])

      if (!isMounted) return

      // Traiter les résultats
      if (scriptUrlResult.status === 'fulfilled' && scriptUrlResult.value) {
        setScriptSrc(scriptUrlResult.value)
        setScriptUrlReady(true)
      } else {
        setScriptUrlReady(true) // Utiliser l'URL par défaut
      }

      if (tokenResult.status === 'fulfilled' && tokenResult.value) {
        setToken(tokenResult.value)
      } else if (tokenResult.status === 'rejected') {
        setTokenError(tokenResult.reason?.message || 'Erreur token')
      }
    }

    loadResources()

    return () => {
      isMounted = false
    }
  }, [])

  // Créer le div interne et initialiser la carte
  useEffect(() => {
    const wasActive = prevActiveRef.current
    prevActiveRef.current = active

    if (!active) {
      if (wasActive && !active) {
        requestAnimationFrame(() => {
          try {
            if (hostRef.current && hostRef.current.isConnected) {
              hostRef.current.replaceChildren()
            }
          } catch {
            // Ignorer
          }
          mapInstanceRef.current = null
          mapContainerElementRef.current = null
          isInitializedRef.current = false
        })
      }
      return
    }

    // Vérifier les prérequis
    if (!scriptLoaded || !token || !hostRef.current || !scriptSrc || scriptSrc === 'A_REMPLACER') {
      return
    }

    if (!hostRef.current || !hostRef.current.isConnected) {
      return
    }

    const computedStyle = window.getComputedStyle(hostRef.current)
    const isVisible = computedStyle.display !== 'none' && 
                     computedStyle.visibility !== 'hidden' && 
                     computedStyle.opacity !== '0' &&
                     hostRef.current.offsetWidth > 0 &&
                     hostRef.current.offsetHeight > 0

    if (!isVisible) {
      return
    }

    if (mapContainerElementRef.current && mapContainerElementRef.current.isConnected && mapInstanceRef.current) {
      return
    }

    if (mapContainerElementRef.current && !mapContainerElementRef.current.isConnected) {
      mapContainerElementRef.current = null
      isInitializedRef.current = false
      mapInstanceRef.current = null
    }

    if (!window.BoxtalParcelPointMap?.BoxtalParcelPointMap) {
      setScriptError("L'API Boxtal n'est pas disponible.")
      return
    }

    let isMounted = true

    const init = () => {
      if (!active || !hostRef.current || !hostRef.current.isConnected) {
        return
      }

      try {
        const BoxtalParcelPointMap = window.BoxtalParcelPointMap!.BoxtalParcelPointMap

        if (!hostRef.current) return

        // Créer le div interne
        const mapContainerElement = document.createElement('div')
        mapContainerElement.id = mapId
        mapContainerElement.style.cssText = `
          width: 100%;
          height: 450px;
          min-height: 450px;
          max-height: 450px;
          position: relative;
          z-index: 1;
          display: block;
          background-color: #f3f4f6;
          overflow: hidden;
          isolation: isolate;
          contain: layout style paint;
          clip-path: inset(0);
        `
        mapContainerElement.className = 'w-full border border-gray-300 rounded-md'
        
        // CSS pour limiter les iframes
        const style = document.createElement('style')
        style.textContent = `
          #${mapId} iframe, #${mapId} * {
            max-width: 100% !important;
            max-height: 450px !important;
            overflow: hidden !important;
          }
        `
        document.head.appendChild(style)

        hostRef.current.appendChild(mapContainerElement)
        mapContainerElementRef.current = mapContainerElement

        // Initialiser immédiatement (réduit de 300ms à 50ms)
        setTimeout(() => {
          if (!active || !hostRef.current || !hostRef.current.isConnected || !isMounted) {
            return
          }

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
              if (isMounted) {
                // Réduit de 1500ms à 300ms
                setTimeout(() => {
                  setMapReady(true)
                }, 300)
              }
            },
            onParcelPointSelected: (parcelPoint: any) => {
              if (isMounted) {
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
            }
          })

          if (isMounted) {
            isInitializedRef.current = true
          }
        }, 50) // Réduit de 300ms à 50ms
      } catch (error: any) {
        if (isMounted) {
          setScriptError(error.message || "Erreur d'initialisation")
        }
      }
    }

    // Réduit de 300ms à 50ms
    setTimeout(init, 50)

    return () => {
      isMounted = false
    }
  }, [active, scriptLoaded, token, mapId, onSelect])

  // Recherche automatique si code postal pré-rempli
  useEffect(() => {
    if (mapReady && initialPostalCode && initialPostalCode.length >= 5 && !autoSearchDoneRef.current) {
      autoSearchDoneRef.current = true
      // Lancer la recherche automatiquement après un court délai
      setTimeout(() => {
        handleSearchInternal(initialPostalCode, initialCity)
      }, 200)
    }
  }, [mapReady, initialPostalCode, initialCity])

  // Fonction de recherche interne
  const handleSearchInternal = useCallback((postalCode: string, city: string) => {
    if (!postalCode || postalCode.length < 5) return

    setMapError(null)
    setSearching(true)

    const map = mapInstanceRef.current

    if (!active || !map || typeof map.searchParcelPoints !== "function" || !mapReady) {
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
          setTimeout(run, 100) // Réduit de 200ms à 100ms
          return
        }

        setMapError(msg || "Erreur de recherche")
        setSearching(false)
      }
    }

    run()
  }, [active, mapReady, onSelect])

  // Fonction pour le bouton rechercher
  const handleSearch = () => {
    handleSearchInternal(searchPostalCode, searchCity)
  }

  // Afficher l'erreur si l'URL du script n'est pas configurée
  if (!scriptUrlReady) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-blue-700 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!scriptSrc || scriptSrc === 'A_REMPLACER') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700 font-medium">Configuration Boxtal manquante</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Script Boxtal */}
      <Script
        id="boxtal-parcelpoint-script"
        key={scriptSrc}
        src={scriptSrc}
        strategy="afterInteractive"
        onLoad={() => {
          if (window.__boxtalScriptLoaded) {
            setScriptLoaded(true)
            return
          }
          window.__boxtalScriptLoaded = true
          
          // Réduit de 500ms à 100ms
          setTimeout(() => {
            if (!window.BoxtalParcelPointMap || !window.BoxtalParcelPointMap.BoxtalParcelPointMap) {
              setScriptError('API Boxtal non disponible')
            }
          }, 100)
          
          setScriptLoaded(true)
        }}
        onError={() => {
          setScriptError('Impossible de charger le script Boxtal')
        }}
      />

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
            disabled={!mapReady || !mapInstanceRef.current || !searchPostalCode || searchPostalCode.length < 5 || searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {searching ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </div>

      {/* Messages d'erreur */}
      {(mapError || tokenError || scriptError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="text-sm">{mapError || tokenError || scriptError}</p>
        </div>
      )}

      {/* Conteneur de la carte */}
      <div
        ref={hostRef}
        style={{ 
          minHeight: active ? 450 : 0, 
          maxHeight: active ? 450 : 0,
          height: active && mapContainerElementRef.current ? '450px' : '0',
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate',
          zIndex: active ? 1 : -1,
          pointerEvents: active ? 'auto' : 'none'
        }}
        className="w-full"
      >
        {active && !mapReady && (
          <div 
            className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 rounded-md" 
            style={{ zIndex: 10, pointerEvents: 'none' }}
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">
                {!scriptLoaded ? 'Chargement...' : !token ? 'Connexion...' : 'Initialisation...'}
              </p>
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
