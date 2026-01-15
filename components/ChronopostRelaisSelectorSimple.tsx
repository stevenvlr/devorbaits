'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, AlertCircle, CheckCircle2, Search, Navigation } from 'lucide-react'

// Type pour les informations du point relais Chronopost
export interface ChronopostRelaisPoint {
  identifiant: string // Code du point relais
  nom: string // Nom du point relais
  adresse: string // Adresse complète
  codePostal: string
  ville: string
  coordonnees?: {
    latitude: number
    longitude: number
  }
  horaires?: string // Horaires d'ouverture
}

interface ChronopostRelaisSelectorSimpleProps {
  codePostal: string
  ville?: string
  onSelect: (point: ChronopostRelaisPoint) => void
  selectedPoint?: ChronopostRelaisPoint | null
}

export default function ChronopostRelaisSelectorSimple({
  codePostal,
  ville,
  onSelect,
  selectedPoint
}: ChronopostRelaisSelectorSimpleProps) {
  const [points, setPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchRadius, setSearchRadius] = useState(10)

  // Rechercher les points relais quand le code postal change
  useEffect(() => {
    if (codePostal && codePostal.length >= 5) {
      searchPoints()
    } else {
      setPoints([])
    }
  }, [codePostal, ville, searchRadius])

  const searchPoints = async () => {
    if (!codePostal || codePostal.length < 5) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // API Boxtal supprimée - fonctionnalité désactivée
      setError('La recherche de points relais n\'est plus disponible. Les expéditions sont gérées manuellement.')
      setPoints([])
    } catch (err: any) {
      console.error('Erreur recherche points relais:', err)
      setError('Erreur lors de la recherche. Vérifiez votre connexion internet.')
      setPoints([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPoint = (point: any) => {
    const relaisPoint: ChronopostRelaisPoint = {
      identifiant: point.code || '',
      nom: point.name || '',
      adresse: point.address?.street || '',
      codePostal: point.address?.postalCode || codePostal,
      ville: point.address?.city || ville || '',
      coordonnees: point.coordinates ? {
        latitude: point.coordinates.latitude || 0,
        longitude: point.coordinates.longitude || 0
      } : undefined,
      horaires: point.openingHours || ''
    }
    
    onSelect(relaisPoint)
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Sélectionnez un point relais Chronopost</p>
            <p className="text-xs text-blue-400">
              Recherche pour : {codePostal} {ville ? ville : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Contrôles de recherche */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rayon de recherche (km)
          </label>
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
          >
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="20">20 km</option>
            <option value="30">30 km</option>
            <option value="50">50 km</option>
          </select>
        </div>
        <button
          onClick={searchPoints}
          disabled={loading || !codePostal}
          className="mt-6 px-4 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Recherche...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Rechercher
            </>
          )}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Liste des points relais */}
      {loading && points.length === 0 ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-400">Recherche des points relais Chronopost...</p>
        </div>
      ) : points.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {points.map((point) => {
            const isSelected = selectedPoint?.identifiant === point.code
            return (
              <button
                key={point.code}
                onClick={() => handleSelectPoint(point)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-noir-700 bg-noir-800/50 hover:bg-noir-800 hover:border-noir-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${isSelected ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white">{point.name}</h3>
                      {point.distance && (
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          {point.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-1">
                      {point.address?.street}
                    </p>
                    <p className="text-sm text-gray-400">
                      {point.address?.postalCode} {point.address?.city}
                    </p>
                    {point.openingHours && (
                      <p className="text-xs text-gray-500 mt-1">
                        {point.openingHours}
                      </p>
                    )}
                    {point.network && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-noir-700 text-gray-300 rounded">
                        {point.network}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : !loading && codePostal && codePostal.length >= 5 ? (
        <div className="text-center py-8 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucun point relais Chronopost trouvé</p>
          <p className="text-sm mt-1">Essayez d'augmenter le rayon de recherche</p>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>Entrez un code postal pour rechercher des points relais Chronopost</p>
        </div>
      )}

      {/* Point sélectionné */}
      {selectedPoint && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-green-400">Point relais sélectionné</span>
          </div>
          <p className="text-white font-medium">{selectedPoint.nom}</p>
          <p className="text-sm text-gray-400">
            {selectedPoint.adresse}, {selectedPoint.codePostal} {selectedPoint.ville}
          </p>
          {selectedPoint.horaires && (
            <p className="text-xs text-gray-400 mt-2">
              <span className="font-semibold">Horaires :</span> {selectedPoint.horaires}
            </p>
          )}
          <button
            onClick={() => onSelect(null as any)}
            className="mt-3 text-xs px-3 py-1 bg-noir-700 hover:bg-noir-600 text-white rounded transition-colors"
          >
            Changer de point relais
          </button>
        </div>
      )}
    </div>
  )
}
