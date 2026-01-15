'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, AlertCircle, CheckCircle2, Search, Navigation, Copy } from 'lucide-react'
import type { ChronopostRelaisPoint } from './ChronopostRelaisWidget'

interface ChronopostRelaisListProps {
  codePostal: string
  ville?: string
  onSelect: (point: ChronopostRelaisPoint) => void
  selectedPoint?: ChronopostRelaisPoint | null
}

export default function ChronopostRelaisList({
  codePostal,
  ville,
  onSelect,
  selectedPoint
}: ChronopostRelaisListProps) {
  const [points, setPoints] = useState<ChronopostRelaisPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualData, setManualData] = useState({
    nom: '',
    adresse: '',
    codePostal: codePostal,
    ville: ville || '',
    identifiant: '',
    telephone: '',
    horaires: ''
  })

  // Mettre à jour les données manuelles quand le code postal change
  useEffect(() => {
    setManualData(prev => ({
      ...prev,
      codePostal: codePostal,
      ville: ville || prev.ville
    }))
  }, [codePostal, ville])

  // Rechercher automatiquement quand le code postal change
  useEffect(() => {
    if (codePostal && codePostal.length >= 5) {
      searchPoints()
    } else {
      setPoints([])
    }
  }, [codePostal, ville])

  const searchPoints = async () => {
    if (!codePostal || codePostal.length < 5) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Utiliser notre route API qui fait la recherche
      const params = new URLSearchParams({
        codePostal,
      })
      if (ville) {
        params.append('ville', ville)
      }

      const response = await fetch(`/api/chronopost/search-relay?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.points && data.points.length > 0) {
        setPoints(data.points)
      } else {
        setError(data.error || 'Aucun point relais trouvé pour ce code postal. Essayez un autre code postal.')
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

  const copyAddress = (point: ChronopostRelaisPoint) => {
    const fullAddress = `${point.nom}\n${point.adresse}\n${point.codePostal} ${point.ville}`
    navigator.clipboard.writeText(fullAddress).then(() => {
      alert('Adresse copiée dans le presse-papiers !')
    }).catch(() => {
      // Fallback pour les navigateurs qui ne supportent pas clipboard
      const textarea = document.createElement('textarea')
      textarea.value = fullAddress
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('Adresse copiée !')
    })
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Points relais Chronopost disponibles</p>
            <p className="text-xs text-blue-400">
              Recherche pour : <strong>{codePostal}</strong> {ville ? ville : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Bouton de recherche manuelle */}
      <button
        onClick={searchPoints}
        disabled={loading || !codePostal || codePostal.length < 5}
        className="w-full px-4 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Recherche en cours...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Rechercher les points relais
          </>
        )}
      </button>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 text-sm font-semibold mb-1">Information</p>
              <p className="text-yellow-300 text-sm">{error}</p>
              <a
                href={`https://www.chronopost.fr/point-relais/recherche?codePostal=${codePostal}${ville ? `&ville=${encodeURIComponent(ville)}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 underline text-xs mt-2 inline-flex items-center gap-1"
              >
                Rechercher sur chronopost.fr <Navigation className="w-3 h-3" />
              </a>
            </div>
          </div>
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
            const isSelected = selectedPoint?.identifiant === point.identifiant
            return (
              <div
                key={point.identifiant}
                className={`p-4 rounded-lg border-2 transition-all ${
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
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{point.nom}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyAddress(point)}
                          className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs flex items-center gap-1 transition-colors"
                          title="Copier l'adresse"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onSelect(point)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-yellow-500 text-noir-950'
                              : 'bg-noir-700 hover:bg-noir-600 text-white'
                          }`}
                        >
                          {isSelected ? 'Sélectionné' : 'Sélectionner'}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-300">
                      {point.identifiant && !point.identifiant.startsWith('MANUAL-') && (
                        <p>
                          <span className="text-gray-400">Code :</span>{' '}
                          <span className="font-mono text-yellow-400">{point.identifiant}</span>
                        </p>
                      )}
                      <p>{point.adresse}</p>
                      <p>{point.codePostal} {point.ville}</p>
                      {point.telephone && (
                        <p>
                          <span className="text-gray-400">Tél :</span> {point.telephone}
                        </p>
                      )}
                      {point.horaires && (
                        <p className="text-xs text-gray-400 mt-2">
                          <span className="font-semibold">Horaires :</span> {point.horaires}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : !loading && codePostal && codePostal.length >= 5 ? (
        <div className="space-y-4">
          <div className="text-center py-8 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun point relais trouvé automatiquement</p>
            <p className="text-sm mt-1">Vous pouvez saisir manuellement les informations</p>
          </div>
          
          {/* Formulaire de saisie manuelle */}
          {!showManualForm ? (
            <button
              onClick={() => setShowManualForm(true)}
              className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              Saisir manuellement un point relais
            </button>
          ) : (
            <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">Saisie manuelle</h4>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
              </div>
              
              <div>
                <label className="block text-xs text-gray-300 mb-1">Nom du point relais *</label>
                <input
                  type="text"
                  value={manualData.nom}
                  onChange={(e) => setManualData({ ...manualData, nom: e.target.value })}
                  placeholder="Ex: BUREAU DE POSTE"
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-300 mb-1">Code du point relais (optionnel)</label>
                <input
                  type="text"
                  value={manualData.identifiant}
                  onChange={(e) => setManualData({ ...manualData, identifiant: e.target.value })}
                  placeholder="Ex: CHRP123456"
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-300 mb-1">Adresse complète *</label>
                <input
                  type="text"
                  value={manualData.adresse}
                  onChange={(e) => setManualData({ ...manualData, adresse: e.target.value })}
                  placeholder="Ex: 123 RUE DE LA POSTE"
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded text-white text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Code postal *</label>
                  <input
                    type="text"
                    value={manualData.codePostal}
                    onChange={(e) => setManualData({ ...manualData, codePostal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                    placeholder="75001"
                    maxLength={5}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Ville *</label>
                  <input
                    type="text"
                    value={manualData.ville}
                    onChange={(e) => setManualData({ ...manualData, ville: e.target.value })}
                    placeholder="Paris"
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded text-white text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (manualData.nom && manualData.adresse && manualData.codePostal && manualData.ville) {
                    const point: ChronopostRelaisPoint = {
                      identifiant: manualData.identifiant || `MANUAL-${Date.now()}`,
                      nom: manualData.nom,
                      adresse: manualData.adresse,
                      codePostal: manualData.codePostal,
                      ville: manualData.ville,
                      telephone: manualData.telephone || undefined,
                      horaires: manualData.horaires || undefined
                    }
                    onSelect(point)
                    setShowManualForm(false)
                    setManualData({
                      nom: '',
                      adresse: '',
                      codePostal: codePostal,
                      ville: ville || '',
                      identifiant: '',
                      telephone: '',
                      horaires: ''
                    })
                  }
                }}
                disabled={!manualData.nom || !manualData.adresse || !manualData.codePostal || !manualData.ville}
                className="w-full px-4 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer ce point relais
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>Entrez un code postal pour rechercher des points relais Chronopost</p>
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
              <p className="text-gray-300">Tél : {selectedPoint.telephone}</p>
            )}
            {selectedPoint.horaires && (
              <p className="text-xs text-gray-400 mt-2">
                <span className="font-semibold">Horaires :</span> {selectedPoint.horaires}
              </p>
            )}
            <button
              onClick={() => copyAddress(selectedPoint)}
              className="mt-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copier l'adresse complète
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
