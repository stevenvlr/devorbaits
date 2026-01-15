'use client'

import { useState } from 'react'
import { MapPin, CheckCircle2, X, ExternalLink } from 'lucide-react'
import type { ChronopostRelaisPoint } from './ChronopostRelaisWidget'

interface ChronopostRelaisIframeProps {
  codePostal: string
  ville?: string
  onSelect: (point: ChronopostRelaisPoint) => void
  selectedPoint?: ChronopostRelaisPoint | null
}

export default function ChronopostRelaisIframe({
  codePostal,
  ville,
  onSelect,
  selectedPoint
}: ChronopostRelaisIframeProps) {
  const [widgetOpen, setWidgetOpen] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualData, setManualData] = useState({
    nom: '',
    adresse: '',
    codePostal: codePostal,
    ville: ville || '',
    identifiant: '',
    telephone: '',
    horaires: ''
  })

  // URL du widget Chronopost avec le code postal
  const chronopostWidgetUrl = `https://www.chronopost.fr/point-relais/recherche?codePostal=${codePostal}${ville ? `&ville=${encodeURIComponent(ville)}` : ''}`

  const handleManualSubmit = () => {
    if (manualData.nom && manualData.adresse && manualData.codePostal) {
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
      setWidgetOpen(false)
      setManualMode(false)
      // Réinitialiser le formulaire
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
  }

  const openWidget = () => {
    if (!codePostal || codePostal.length < 5) {
      return
    }
    setWidgetOpen(true)
    setManualMode(false)
  }

  const closeWidget = () => {
    setWidgetOpen(false)
    setManualMode(false)
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
              Recherche pour : <strong>{codePostal}</strong> {ville ? ville : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Bouton pour ouvrir le widget */}
      {!selectedPoint && (
        <div className="space-y-2">
          <button
            onClick={openWidget}
            disabled={!codePostal || codePostal.length < 5}
            className="w-full px-4 py-3 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            Rechercher un point relais sur la carte Chronopost
          </button>
          <p className="text-xs text-gray-400 text-center">
            La carte s'ouvrira dans une fenêtre. Une fois votre point relais sélectionné, 
            revenez ici et saisissez ses informations ci-dessous.
          </p>
        </div>
      )}

      {/* Widget ouvert */}
      {widgetOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-noir-900 rounded-lg border border-noir-700 w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-noir-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Recherche de point relais Chronopost</h3>
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
            
            {!manualMode ? (
              <div className="flex-1 flex flex-col">
                {/* Iframe avec le site Chronopost */}
                <div className="flex-1 p-4">
                  <iframe
                    src={chronopostWidgetUrl}
                    className="w-full h-full min-h-[500px] rounded border border-noir-700"
                    title="Recherche point relais Chronopost"
                    allow="geolocation"
                  />
                </div>
                
                {/* Instructions */}
                <div className="border-t border-noir-700 p-4 bg-noir-800/50">
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-300">
                      <strong>Instructions :</strong>
                    </p>
                    <ol className="text-xs text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                      <li>Recherchez un point relais sur la carte ci-dessus</li>
                      <li>Notez les informations du point relais (nom, adresse, code postal, ville)</li>
                      <li>Cliquez sur "Saisir manuellement" ci-dessous pour enregistrer les informations</li>
                    </ol>
                  </div>
                  <button
                    onClick={() => setManualMode(true)}
                    className="w-full px-4 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    Saisir manuellement les informations du point relais
                  </button>
                </div>
              </div>
            ) : (
              /* Formulaire de saisie manuelle */
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                    <p className="text-sm text-yellow-300">
                      Entrez les informations du point relais que vous avez sélectionné sur la carte Chronopost.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nom du point relais *
                    </label>
                    <input
                      type="text"
                      value={manualData.nom}
                      onChange={(e) => setManualData({ ...manualData, nom: e.target.value })}
                      placeholder="Ex: BUREAU DE POSTE"
                      className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Code du point relais (optionnel)
                    </label>
                    <input
                      type="text"
                      value={manualData.identifiant}
                      onChange={(e) => setManualData({ ...manualData, identifiant: e.target.value })}
                      placeholder="Ex: CHRP123456"
                      className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Adresse complète *
                    </label>
                    <input
                      type="text"
                      value={manualData.adresse}
                      onChange={(e) => setManualData({ ...manualData, adresse: e.target.value })}
                      placeholder="Ex: 123 RUE DE LA POSTE"
                      className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        value={manualData.codePostal}
                        onChange={(e) => setManualData({ ...manualData, codePostal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        placeholder="75001"
                        maxLength={5}
                        className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Ville *
                      </label>
                      <input
                        type="text"
                        value={manualData.ville}
                        onChange={(e) => setManualData({ ...manualData, ville: e.target.value })}
                        placeholder="Paris"
                        className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Téléphone (optionnel)
                      </label>
                      <input
                        type="tel"
                        value={manualData.telephone}
                        onChange={(e) => setManualData({ ...manualData, telephone: e.target.value })}
                        placeholder="01 23 45 67 89"
                        className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Horaires (optionnel)
                      </label>
                      <input
                        type="text"
                        value={manualData.horaires}
                        onChange={(e) => setManualData({ ...manualData, horaires: e.target.value })}
                        placeholder="Lun-Ven: 9h-18h"
                        className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleManualSubmit}
                      disabled={!manualData.nom || !manualData.adresse || !manualData.codePostal || !manualData.ville}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enregistrer ce point relais
                    </button>
                    <button
                      onClick={() => setManualMode(false)}
                      className="px-4 py-2 bg-noir-700 text-white font-semibold rounded-lg hover:bg-noir-600 transition-colors"
                    >
                      Retour à la carte
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              <p className="text-gray-300">Tél : {selectedPoint.telephone}</p>
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
