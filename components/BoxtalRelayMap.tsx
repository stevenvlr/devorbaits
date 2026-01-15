'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { getBoxtalToken } from '@/src/lib/getBoxtalToken'

// ⚠️ À REMPLACER par l'URL exacte du script Boxtal
const BOXTAL_MAP_SCRIPT_SRC = process.env.NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC || 'A_REMPLACER'

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
  const hostRef = useRef<HTMLDivElement>(null) // Conteneur React (host)
  const mapContainerElementRef = useRef<HTMLDivElement | null>(null) // Div interne créé via DOM
  const mapInstanceRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const prevActiveRef = useRef(active) // Pour détecter quand active passe de true à false

  // États
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [searchCity, setSearchCity] = useState(initialCity)
  const [searchPostalCode, setSearchPostalCode] = useState(initialPostalCode)
  const [selectedParcelPoint, setSelectedParcelPoint] = useState<BoxtalParcelPoint | null>(null)
  const [searching, setSearching] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Vérifier que l'URL du script est configurée
  useEffect(() => {
    if (BOXTAL_MAP_SCRIPT_SRC === 'A_REMPLACER') {
      setScriptError('URL du script Boxtal manquante')
      console.error("❌ BOXTAL_MAP_SCRIPT_SRC n'est pas configuré")
    }
  }, [])

  // Récupérer le token Boxtal (une seule fois)
  useEffect(() => {
    if (BOXTAL_MAP_SCRIPT_SRC === 'A_REMPLACER' || token !== null) {
      return
    }

    const fetchToken = async () => {
      try {
        console.log('🔑 Récupération du token Boxtal...')
        const accessToken = await getBoxtalToken()
        setToken(accessToken)
        setTokenError(null)
        console.log('✅ Token obtenu avec succès')
      } catch (error: any) {
        const errorMessage = error.message || 'Erreur lors de la récupération du token'
        setTokenError(errorMessage)
        console.error("❌ Erreur token:", errorMessage)
      }
    }

    fetchToken()
  }, [token])

  // Créer le div interne et initialiser la carte UNIQUEMENT si active === true ET scriptReady ET tokenReady
  useEffect(() => {
    // Mettre à jour la ref de active
    const wasActive = prevActiveRef.current
    prevActiveRef.current = active

    // Ne pas initialiser si inactive
    if (!active) {
      // Si active passe de true à false, nettoyer
      if (wasActive && !active) {
        // Nettoyer le conteneur
        requestAnimationFrame(() => {
          try {
            if (hostRef.current && hostRef.current.isConnected) {
              hostRef.current.replaceChildren()
            }
          } catch (error) {
            // Ignorer les erreurs
          }
          mapInstanceRef.current = null
          mapContainerElementRef.current = null
          isInitializedRef.current = false
        })
      }
      return
    }

    // Vérifier les prérequis
    if (!scriptLoaded || !token || !hostRef.current || BOXTAL_MAP_SCRIPT_SRC === 'A_REMPLACER') {
      console.log('⏳ Prérequis non remplis:', { scriptLoaded, token: !!token, hostRef: !!hostRef.current })
      return
    }

    // Vérifier que le conteneur est visible
    if (!hostRef.current || !hostRef.current.isConnected) {
      console.log('⏳ Conteneur non visible ou non connecté au DOM')
      return
    }

    // Vérifier la visibilité du conteneur (style display, visibility, etc.)
    const computedStyle = window.getComputedStyle(hostRef.current)
    const isVisible = computedStyle.display !== 'none' && 
                     computedStyle.visibility !== 'hidden' && 
                     computedStyle.opacity !== '0' &&
                     hostRef.current.offsetWidth > 0 &&
                     hostRef.current.offsetHeight > 0

    if (!isVisible) {
      console.log('⏳ Conteneur non visible (display/visibility/opacity)')
      return
    }

    // Si le div interne existe déjà et est connecté, ne pas réinitialiser
    if (mapContainerElementRef.current && mapContainerElementRef.current.isConnected && mapInstanceRef.current) {
      console.log('✅ Carte Boxtal déjà initialisée, pas de réinitialisation')
      return
    }

    // Si le div existe mais n'est plus dans le DOM, le nettoyer
    if (mapContainerElementRef.current && !mapContainerElementRef.current.isConnected) {
      console.log('⚠️ Div interne existe mais n\'est plus connecté, nettoyage...')
      mapContainerElementRef.current = null
      isInitializedRef.current = false
      mapInstanceRef.current = null
    }

    console.log('🗺️ Initialisation de la carte Boxtal...')
    console.log('window.BoxtalParcelPointMap:', window.BoxtalParcelPointMap)
    console.log('État actuel:', { scriptLoaded, token: !!token, hostRef: !!hostRef.current, active, isVisible })

    // Vérifier que BoxtalParcelPointMap.BoxtalParcelPointMap existe
    if (!window.BoxtalParcelPointMap?.BoxtalParcelPointMap) {
      console.error("❌ BoxtalParcelPointMap.BoxtalParcelPointMap n'est pas disponible")
      setScriptError("L'API Boxtal n'est pas disponible. Vérifiez la version du script.")
      return
    }

    let isMounted = true

    // Fonction d'initialisation
    const init = () => {
      // Vérifier à nouveau que active est toujours true et que le conteneur est visible
      if (!active || !hostRef.current || !hostRef.current.isConnected) {
        console.log('⏳ Conditions non remplies pour l\'initialisation (active ou conteneur)')
        return
      }

      try {
        const BoxtalParcelPointMap = window.BoxtalParcelPointMap.BoxtalParcelPointMap

        // Vérifier que le host existe
        if (!hostRef.current) {
          return
        }

        // Créer le div interne via DOM (pas React)
        const mapContainerElement = document.createElement('div')
        mapContainerElement.id = mapId
        mapContainerElement.style.width = '100%'
        mapContainerElement.style.height = '450px'
        mapContainerElement.style.minHeight = '450px'
        mapContainerElement.style.maxHeight = '450px'
        mapContainerElement.style.position = 'relative'
        mapContainerElement.style.zIndex = '1'
        mapContainerElement.style.display = 'block'
        mapContainerElement.style.backgroundColor = '#f3f4f6'
        mapContainerElement.style.overflow = 'hidden'
        mapContainerElement.style.isolation = 'isolate' // Créer un nouveau contexte d'empilement
        mapContainerElement.style.contain = 'layout style paint' // Empêcher les débordements
        mapContainerElement.style.clipPath = 'inset(0)' // Limiter strictement la zone
        mapContainerElement.className = 'w-full border border-gray-300 rounded-md'
        
        // Ajouter des règles CSS pour limiter strictement les iframes enfants
        const style = document.createElement('style')
        style.textContent = `
          #${mapId} iframe,
          #${mapId} * {
            max-width: 100% !important;
            max-height: 450px !important;
            overflow: hidden !important;
          }
        `
        document.head.appendChild(style)

        // Append dans le host React
        hostRef.current.appendChild(mapContainerElement)
        mapContainerElementRef.current = mapContainerElement
        
        console.log('✅ Div interne créé et ajouté au DOM:', mapId, mapContainerElement.isConnected)

        // Initialiser la carte avec un délai supplémentaire
        setTimeout(() => {
          // Vérifier une dernière fois avant d'initialiser
          if (!active || !hostRef.current || !hostRef.current.isConnected || !isMounted) {
            console.log('⏳ Conditions non remplies juste avant l\'initialisation')
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
                console.log('✅ Carte Boxtal chargée')
                console.log('Instance de la carte:', mapInstanceRef.current)
                
                // Attendre un peu pour que l'instance soit complètement initialisée
                // L'erreur sendCallbackEvent suggère qu'il faut attendre que les propriétés internes soient prêtes
                setTimeout(() => {
                  // Vérifier que l'instance a bien toutes ses propriétés
                  const instance = mapInstanceRef.current
                  if (instance) {
                    console.log('Méthodes disponibles sur l\'instance:', {
                      searchParcelPoints: typeof instance.searchParcelPoints,
                      keys: Object.keys(instance).slice(0, 20),
                      prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).slice(0, 20),
                      // Vérifier si la méthode a des propriétés internes
                      hasSendCallbackEvent: 'sendCallbackEvent' in instance || 
                        (instance.searchParcelPoints && 'sendCallbackEvent' in instance.searchParcelPoints)
                    })
                  }
                  console.log('Méthodes disponibles sur window:', {
                    searchParcelPoints: typeof window.BoxtalParcelPointMap?.searchParcelPoints,
                    keys: Object.keys(window.BoxtalParcelPointMap || {}).slice(0, 20)
                  })
                  setMapReady(true)
                }, 1500) // Délai encore plus long pour s'assurer que tout est complètement initialisé
              }
            },
            onParcelPointSelected: (parcelPoint: any) => {
              if (isMounted) {
                console.log('📍 Point relais sélectionné (données brutes):', parcelPoint)
                console.log('📍 Structure de l\'adresse:', parcelPoint.address)
                console.log('📍 Toutes les propriétés:', Object.keys(parcelPoint))
                
                // Normaliser l'adresse - Boxtal peut retourner différentes structures
                // Chercher dans address ET directement sur parcelPoint
                let normalizedAddress: any = {}
                
                // Extraire depuis address si disponible
                if (parcelPoint.address) {
                  normalizedAddress = {
                    street: parcelPoint.address.street || 
                            parcelPoint.address.address || 
                            parcelPoint.address.line1 || 
                            parcelPoint.address.adresse || 
                            parcelPoint.address.fullAddress ||
                            parcelPoint.address.streetAddress || '',
                    postalCode: parcelPoint.address.postalCode || 
                               parcelPoint.address.postal_code || 
                               parcelPoint.address.zipCode || 
                               parcelPoint.address.zip || 
                               parcelPoint.address.codePostal ||
                               parcelPoint.address.postcode || '',
                    city: parcelPoint.address.city || 
                         parcelPoint.address.ville || 
                         parcelPoint.address.locality ||
                         parcelPoint.address.town ||
                         parcelPoint.address.commune || '',
                    country: parcelPoint.address.country || 
                            parcelPoint.address.countryCode || 
                            parcelPoint.address.pays || 'FR'
                  }
                }
                
                // Si les données ne sont pas dans address, chercher directement sur parcelPoint
                if (!normalizedAddress.postalCode) {
                  normalizedAddress.postalCode = parcelPoint.postalCode || 
                                                 parcelPoint.postal_code || 
                                                 parcelPoint.zipCode || 
                                                 parcelPoint.zip || 
                                                 parcelPoint.codePostal ||
                                                 parcelPoint.postcode || ''
                }
                
                if (!normalizedAddress.city) {
                  normalizedAddress.city = parcelPoint.city || 
                                          parcelPoint.ville || 
                                          parcelPoint.locality ||
                                          parcelPoint.town ||
                                          parcelPoint.commune || ''
                }
                
                if (!normalizedAddress.street) {
                  normalizedAddress.street = parcelPoint.street || 
                                            parcelPoint.address || 
                                            parcelPoint.line1 || 
                                            parcelPoint.adresse || ''
                }
                
                const point: BoxtalParcelPoint = {
                  code: parcelPoint.code || parcelPoint.id || '',
                  name: parcelPoint.name || parcelPoint.nom || '',
                  address: normalizedAddress,
                  coordinates: parcelPoint.coordinates || parcelPoint.coordonnees || {},
                  network: parcelPoint.network || parcelPoint.networkCode || '',
                  // Sauvegarder toutes les données brutes aussi
                  rawData: parcelPoint,
                  ...parcelPoint
                }
                
                console.log('📍 Point relais normalisé:', JSON.stringify(point, null, 2))
                console.log('📍 Adresse extraite:', {
                  postalCode: normalizedAddress.postalCode,
                  city: normalizedAddress.city,
                  street: normalizedAddress.street,
                  hasPostalCode: !!normalizedAddress.postalCode,
                  hasCity: !!normalizedAddress.city
                })
                
                setSelectedParcelPoint(point)
                if (onSelect) {
                  onSelect(point)
                }
              }
            }
          })

          if (isMounted) {
            isInitializedRef.current = true
            console.log('✅ Carte Boxtal initialisée avec succès')
          }
        }, 300) // Délai de 300ms avant l'initialisation
      } catch (error: any) {
        if (isMounted) {
          console.error("❌ Erreur lors de l'initialisation:", error)
          setScriptError(error.message || "Erreur lors de l'initialisation de la carte")
        }
      }
    }

    // Appeler init avec un délai de 300ms
    setTimeout(init, 300)

    // Cleanup robuste : ne jamais casser l'app
    // Le cleanup ne se déclenche que si le composant est démonté ou si les dépendances changent
    // On ne nettoie PAS ici car le nettoyage est géré dans le useEffect lui-même
    // quand active passe de true à false
    return () => {
      isMounted = false
      // Ne rien faire ici - le nettoyage est géré dans le useEffect principal
      // pour éviter de supprimer le conteneur quand active reste true
    }
  }, [active, scriptLoaded, token, mapId, onSelect])

  // Fonction pour rechercher des points relais
  const handleSearch = () => {
    if (!searchPostalCode || searchPostalCode.length < 5) {
      console.warn('⚠️ Code postal invalide pour la recherche')
      return
    }

    setMapError(null)
    setSearching(true)

    const map = mapInstanceRef.current

    if (!active) {
      setSearching(false)
      return
    }
    if (!map || typeof map.searchParcelPoints !== "function") {
      setMapError("Carte pas prête.")
      setSearching(false)
      return
    }
    if (!mapReady) {
      setMapError("Carte pas prête (chargement...).")
      setSearching(false)
      return
    }

    const address = { 
      country: "FR", 
      city: searchCity.trim(), 
      zipCode: searchPostalCode.trim() 
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

        // cas Boxtal: callback system pas prêt -> on retente
        if (msg.includes("sendCallbackEvent") && tries < 10) {
          tries += 1
          setTimeout(run, 200)
          return
        }

        setMapError(msg || "Erreur lors de la recherche")
        console.error("❌ Erreur lors de la recherche:", e)
        setSearching(false)
      }
    }

    run()
  }

  // Afficher l'erreur si l'URL du script n'est pas configurée
  if (BOXTAL_MAP_SCRIPT_SRC === 'A_REMPLACER') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700 font-medium">URL du script Boxtal manquante</p>
        <p className="text-sm text-red-600 mt-1">
          Veuillez configurer NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC dans votre fichier .env.local
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Script Boxtal - chargé UNE SEULE FOIS avec id fixe + flag window */}
      <Script
        id="boxtal-parcelpoint-script"
        src={BOXTAL_MAP_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          // Vérifier le flag global pour éviter les rechargements lors de rerenders
          if (window.__boxtalScriptLoaded) {
            // Le script est déjà chargé, juste mettre à jour l'état
            setScriptLoaded(true)
            return
          }
          window.__boxtalScriptLoaded = true
          console.log('✅ Script Boxtal chargé')
          setScriptLoaded(true)
        }}
        onError={(e) => {
          console.error("❌ Erreur chargement script Boxtal:", e)
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
            maxLength={5}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={!mapReady || !mapInstanceRef.current || !searchPostalCode || searchPostalCode.length < 5 || searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={!mapReady ? 'En attente de la carte...' : !mapInstanceRef.current ? 'Carte non initialisée' : ''}
          >
            {searching ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </div>

      {/* Messages d'erreur */}
      {mapError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{mapError}</p>
        </div>
      )}
      {tokenError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="font-medium">Erreur token</p>
          <p className="text-sm">{tokenError}</p>
        </div>
      )}

      {scriptError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{scriptError}</p>
        </div>
      )}

      {/* Host React : conteneur qui accueillera le div interne créé via DOM */}
      <div
        ref={hostRef}
        style={{ 
          minHeight: active ? 450 : 0, 
          maxHeight: active ? 450 : 0,
          height: active && mapContainerElementRef.current ? '450px' : '0',
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate', // Créer un nouveau contexte d'empilement
          zIndex: active ? 1 : -1, // Mettre en arrière-plan quand inactive
          pointerEvents: active ? 'auto' : 'none' // Désactiver les interactions quand inactive
        }}
        className="w-full"
      >
        {/* Afficher le message de chargement seulement si le div interne n'existe pas encore */}
        {active && (!mapContainerElementRef.current || !mapContainerElementRef.current.isConnected) && (!scriptLoaded || !token || (scriptLoaded && token && !mapReady)) && (
          <div 
            className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100 rounded-md" 
            style={{ zIndex: 10, pointerEvents: 'none' }}
          >
            <div className="text-center">
              {!scriptLoaded && <p className="mb-2">Chargement du script Boxtal...</p>}
              {scriptLoaded && !token && !tokenError && <p className="mb-2">Récupération du token...</p>}
              {scriptLoaded && token && !mapReady && <p className="mb-2">Initialisation de la carte...</p>}
              <p className="text-sm">Veuillez patienter</p>
            </div>
          </div>
        )}
      </div>

      {/* Affichage du point sélectionné avec JSON - version simplifiée pour éviter de bloquer */}
      {selectedParcelPoint && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md mt-2">
          <h3 className="font-medium text-green-900 mb-1 text-sm">✓ Point relais sélectionné</h3>
          <div className="text-xs text-green-800">
            <p><strong>{selectedParcelPoint.name}</strong></p>
            {selectedParcelPoint.address?.street && (
              <p>{selectedParcelPoint.address.street}</p>
            )}
            {(selectedParcelPoint.address?.postalCode || selectedParcelPoint.address?.city) && (
              <p>{selectedParcelPoint.address?.postalCode} {selectedParcelPoint.address?.city}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
