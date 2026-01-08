'use client'

import { useState, useEffect } from 'react'
import { MapPin, Search, Loader2, AlertCircle, CheckCircle2, Navigation } from 'lucide-react'
import type { PickupPoint } from '@/lib/boxtal-simple'

interface PickupPointSelectorProps {
  postalCode: string
  city?: string
  country?: string
  onSelect: (point: PickupPoint) => void
  selectedPoint?: PickupPoint | null
}

export default function PickupPointSelector({
  postalCode,
  city,
  country = 'FR',
  onSelect,
  selectedPoint
}: PickupPointSelectorProps) {
  const [points, setPoints] = useState<PickupPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchRadius, setSearchRadius] = useState(10)

  useEffect(() => {
    if (postalCode && postalCode.length >= 5) {
      searchPoints()
    }
  }, [postalCode, city, country, searchRadius])

  const searchPoints = async () => {
    if (!postalCode || postalCode.length < 5) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        postalCode,
        country,
        radius: searchRadius.toString()
      })
      if (city) {
        params.append('city', city)
      }

      const response = await fetch(`/api/boxtal/pickup-points?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setPoints(data.points || [])
        if (data.points && data.points.length === 0) {
          setError('Aucun point relais trouvé dans cette zone. Essayez d\'augmenter le rayon de recherche.')
        }
      } else {
        let errorMsg = data.error || 'Erreur lors de la recherche de points relais'
        // Si c'est une erreur 404, donner plus de détails
        if (errorMsg.includes('404') || errorMsg.includes('endpoint')) {
          errorMsg = 'L\'API de recherche de points relais n\'est pas disponible. Cette fonctionnalité nécessite peut-être une configuration supplémentaire dans votre compte Boxtal ou l\'endpoint API a changé.'
        }
        setError(errorMsg)
        setPoints([])
      }
    } catch (err: any) {
      console.error('Erreur recherche points relais:', err)
      setError('Erreur lors de la recherche. Vérifiez votre connexion internet.')
      setPoints([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
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
          disabled={loading || !postalCode}
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
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Liste des points relais */}
      {loading && points.length === 0 ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-400">Recherche des points relais...</p>
        </div>
      ) : points.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {points.map((point) => (
            <button
              key={point.code}
              onClick={() => onSelect(point)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedPoint?.code === point.code
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-noir-700 bg-noir-800/50 hover:bg-noir-800 hover:border-noir-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${selectedPoint?.code === point.code ? 'text-yellow-500' : 'text-gray-400'}`}>
                  {selectedPoint?.code === point.code ? (
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
                    {point.address.street}
                  </p>
                  <p className="text-sm text-gray-400">
                    {point.address.postalCode} {point.address.city}
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
          ))}
        </div>
      ) : !loading && postalCode && postalCode.length >= 5 ? (
        <div className="text-center py-8 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucun point relais trouvé</p>
          <p className="text-sm mt-1">Essayez d'augmenter le rayon de recherche</p>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>Entrez un code postal pour rechercher des points relais</p>
        </div>
      )}

      {/* Point sélectionné */}
      {selectedPoint && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-green-400">Point relais sélectionné</span>
          </div>
          <p className="text-white font-medium">{selectedPoint.name}</p>
          <p className="text-sm text-gray-400">
            {selectedPoint.address.street}, {selectedPoint.address.postalCode} {selectedPoint.address.city}
          </p>
        </div>
      )}
    </div>
  )
}

