'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import Script from 'next/script'

// Type pour les informations du point relais Chronopost
export interface ChronopostRelaisPoint {
  identifiant: string
  nom: string
  adresse: string
  codePostal: string
  ville: string
  coordonnees?: {
    latitude: number
    longitude: number
  }
  horaires?: string
  telephone?: string
}

interface ChronopostRelaisWidgetProps {
  codePostal: string
  ville?: string
  onSelect: (point: ChronopostRelaisPoint) => void
  selectedPoint?: ChronopostRelaisPoint | null
}

declare global {
  interface Window {
    frameColissimoOpen?: (options: any) => void
    jQuery?: any
    $?: any
  }
}

export default function ChronopostRelaisWidget({
  codePostal,
  ville,
  onSelect,
  selectedPoint
}: ChronopostRelaisWidgetProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [widgetOpen, setWidgetOpen] = useState(false)
  const [jqueryLoaded, setJqueryLoaded] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackNameRef = useRef<string>('')

  // Vérifier si jQuery est disponible
  useEffect(() => {
    if (window.jQuery || window.$) {
      setJqueryLoaded(true)
    }
  }, [])

  const openWidget = () => {
    if (!codePostal || codePostal.length < 5) {
      setError('Veuillez d\'abord entrer un code postal valide (5 chiffres)')
      return
    }

    if (!jqueryLoaded || !scriptLoaded) {
      setError('Le widget est en cours de chargement. Veuillez patienter quelques secondes...')
      return
    }

    setWidgetOpen(true)
    setError(null)
    initializeWidget()
  }

  const initializeWidget = async () => {
    if (!containerRef.current) return

    try {
      setLoading(true)
      setError(null)
      
      // Obtenir un token d'authentification
      let token = ''
      try {
        const tokenResponse = await fetch('/api/chronopost/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            codePostal,
            ville: ville || ''
          })
        })
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          token = tokenData.token || ''
          console.log('Token obtenu:', token ? 'Oui' : 'Non')
        } else {
          console.warn('Impossible d\'obtenir le token, tentative sans token')
        }
      } catch (tokenError) {
        console.warn('Erreur lors de l\'obtention du token:', tokenError)
        // Continuer sans token (peut ne pas fonctionner)
      }
      
      // Créer un nom unique pour la fonction callback
      callbackNameRef.current = 'chronopostCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      const callbackName = callbackNameRef.current

      // Créer la fonction callback globale
      ;(window as any)[callbackName] = (point: any) => {
        console.log('Point relais sélectionné:', point)
        
        if (point) {
          const relaisPoint: ChronopostRelaisPoint = {
            identifiant: point.code || point.id || point.identifiant || point.codeRelais || '',
            nom: point.name || point.nom || point.libelle || point.nomPointRelais || '',
            adresse: point.address?.street || point.adresse || point.street || point.adressePointRelais || point.adresseComplete || '',
            codePostal: point.address?.postalCode || point.codePostal || point.postalCode || point.codePostalPointRelais || codePostal,
            ville: point.address?.city || point.ville || point.city || point.localite || point.villePointRelais || ville || '',
            coordonnees: (point.coordinates || point.coordonnees || point.latitude) ? {
              latitude: point.coordinates?.latitude || point.coordonnees?.latitude || point.latitude || 0,
              longitude: point.coordinates?.longitude || point.coordonnees?.longitude || point.longitude || 0
            } : undefined,
            horaires: point.openingHours || point.horaires || point.horairesOuverture || point.horairesPointRelais || '',
            telephone: point.phone || point.telephone || point.telephonePointRelais || ''
          }
          
          onSelect(relaisPoint)
          setWidgetOpen(false)
          setLoading(false)
          
          // Fermer le widget
          const $ = window.jQuery || window.$
          if ($ && containerRef.current) {
            try {
              ($(containerRef.current) as any).frameColissimoClose()
            } catch (e) {
              console.log('Impossible de fermer le widget:', e)
            }
          }
          
          // Nettoyer la fonction callback
          delete (window as any)[callbackName]
        }
      }

      // Options pour le widget Colissimo (avec token si disponible)
      const widgetOptions: any = {
        URLColissimo: 'https://ws.colissimo.fr',
        ceCountry: 'FR',
        ceZipCode: codePostal,
        ceTown: ville || '',
        ceAddress: ville ? `${ville}` : '', // Adresse pour aider la recherche
        origin: 'WIDGET',
        filterRelay: '1',
        callBackFrame: callbackName,
        // Paramètres supplémentaires pour améliorer la recherche
        maxPointRelais: 20,
        type: 'P' // Type de point relais (P = Pickup)
      }

      // Ajouter le token si disponible
      if (token) {
        widgetOptions.token = token
      }

      const $ = window.jQuery || window.$
      
      // Attendre un peu pour s'assurer que le DOM est prêt
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Initialiser le widget
      if ($ && containerRef.current) {
        const containerId = 'chronopost-widget-' + Date.now()
        if (!containerRef.current.id) {
          containerRef.current.id = containerId
        }
        
        console.log('Initialisation widget avec jQuery, container:', containerId)
        console.log('Options:', JSON.stringify(widgetOptions, null, 2))
        console.log('Code postal:', codePostal, 'Ville:', ville)
        
        // Vérifier que l'élément existe
        const $element = $('#' + containerId)
        if ($element.length === 0) {
          throw new Error('Conteneur widget non trouvé')
        }
        
        // Vérifier que la fonction existe
        if (typeof ($element as any).frameColissimoOpen !== 'function') {
          throw new Error('frameColissimoOpen n\'est pas une fonction')
        }
        
        // Utiliser jQuery pour initialiser le widget
        ($element as any).frameColissimoOpen(widgetOptions)
        
        // Attendre un peu et vérifier si le widget s'est chargé
        setTimeout(() => {
          console.log('Widget initialisé, vérification...')
          setLoading(false)
        }, 1000)
      } else if (window.frameColissimoOpen) {
        // Méthode directe
        if (containerRef.current && !containerRef.current.id) {
          containerRef.current.id = 'chronopost-widget-' + Date.now()
        }
        if (containerRef.current) {
          widgetOptions.ceContainer = '#' + containerRef.current.id
        }
        console.log('Initialisation widget directe')
        console.log('Options:', JSON.stringify(widgetOptions, null, 2))
        window.frameColissimoOpen(widgetOptions)
        
        // Attendre un peu et vérifier si le widget s'est chargé
        setTimeout(() => {
          console.log('Widget initialisé (méthode directe), vérification...')
          setLoading(false)
        }, 1000)
      } else {
        throw new Error('Widget non disponible. Vérifiez que les scripts sont bien chargés.')
      }
    } catch (err: any) {
      console.error('Erreur initialisation widget:', err)
      setError(`Erreur lors de l'ouverture du widget: ${err.message || 'Erreur inconnue'}. Vérifiez votre connexion internet.`)
      setLoading(false)
      setWidgetOpen(false)
    }
  }

  const closeWidget = () => {
    setWidgetOpen(false)
    setLoading(false)
    
    // Nettoyer la fonction callback
    if (callbackNameRef.current) {
      delete (window as any)[callbackNameRef.current]
    }
    
    // Fermer le widget si possible
    const $ = window.jQuery || window.$
    if ($ && containerRef.current) {
      try {
        ($(containerRef.current) as any).frameColissimoClose()
      } catch (e) {
        // Ignorer les erreurs de fermeture
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Scripts nécessaires */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setJqueryLoaded(true)
        }}
      />

      <link href="https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.css" rel="stylesheet" />
      
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.js"
        strategy="afterInteractive"
      />

      <Script
        src="https://ws.colissimo.fr/widget-colissimo/js/jquery.plugin.colissimo.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true)
        }}
        onError={() => {
          setError('Erreur lors du chargement du widget. Vérifiez votre connexion internet.')
        }}
      />

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Sélectionnez un point relais Chronopost</p>
            <p className="text-xs text-blue-400">
              Recherche pour : <strong>{codePostal}</strong> {ville ? ville : ''}
            </p>
            {!jqueryLoaded || !scriptLoaded ? (
              <p className="text-xs text-yellow-400 mt-2">⏳ Chargement du widget...</p>
            ) : (
              <p className="text-xs text-green-400 mt-2">✅ Widget prêt</p>
            )}
          </div>
        </div>
      </div>

      {/* Bouton pour ouvrir le widget */}
      {!selectedPoint && (
        <button
          onClick={openWidget}
          disabled={loading || !codePostal || codePostal.length < 5 || !jqueryLoaded || !scriptLoaded}
          className="w-full px-4 py-3 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Ouverture du widget...
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              Choisir un point relais sur la carte
            </>
          )}
        </button>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Widget ouvert */}
      {widgetOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-noir-900 rounded-lg border border-noir-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-noir-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Sélectionnez un point relais</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Recherche pour : {codePostal} {ville ? ville : ''}
                </p>
              </div>
              <button
                onClick={closeWidget}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-4 relative">
              <div 
                ref={containerRef}
                id="chronopost-widget-container"
                className="w-full h-full min-h-[500px] bg-white rounded"
              ></div>
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-noir-900/90 rounded">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mb-2" />
                  <p className="text-white text-sm">Chargement de la carte...</p>
                  <p className="text-gray-400 text-xs mt-2">Si la carte ne s'affiche pas, vérifiez votre connexion internet</p>
                </div>
              )}
              {!loading && widgetOpen && (
                <div className="absolute bottom-4 left-4 right-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">
                    💡 Si aucun point relais n'apparaît, essayez de zoomer ou déplacer la carte, ou utilisez le formulaire de saisie manuelle ci-dessous.
                  </p>
                </div>
              )}
            </div>
            {/* Alternative : Saisie manuelle */}
            <div className="border-t border-noir-700 p-4 bg-noir-800/50">
              <details className="cursor-pointer">
                <summary className="text-sm text-gray-300 hover:text-white">
                  Ou saisir manuellement les informations du point relais
                </summary>
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Nom du point relais"
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded text-white text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        const nom = target.value
                        if (nom) {
                          const manualPoint: ChronopostRelaisPoint = {
                            identifiant: `MANUAL-${Date.now()}`,
                            nom: nom,
                            adresse: '',
                            codePostal: codePostal,
                            ville: ville || ''
                          }
                          onSelect(manualPoint)
                          closeWidget()
                        }
                      }
                    }}
                  />
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Point sélectionné */}
      {selectedPoint && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-green-400">Point relais sélectionné</span>
            </div>
            <button
              onClick={() => onSelect(null as any)}
              className="text-xs px-3 py-1 bg-noir-700 hover:bg-noir-600 text-white rounded transition-colors"
            >
              Changer
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-white font-medium">{selectedPoint.nom}</p>
            {selectedPoint.identifiant && !selectedPoint.identifiant.startsWith('MANUAL-') && (
              <p className="text-gray-300">
                Code : <span className="font-mono text-yellow-400">{selectedPoint.identifiant}</span>
              </p>
            )}
            <p className="text-gray-300">{selectedPoint.adresse}</p>
            <p className="text-gray-300">
              {selectedPoint.codePostal} {selectedPoint.ville}
            </p>
            {selectedPoint.telephone && (
              <p className="text-gray-300">
                Tél : {selectedPoint.telephone}
              </p>
            )}
            {selectedPoint.horaires && (
              <p className="text-xs text-gray-400 mt-2">
                <span className="font-semibold">Horaires :</span> {selectedPoint.horaires}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
