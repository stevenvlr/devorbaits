'use client'

import { useState, useEffect } from 'react'
import { MapPin, CheckCircle2, ExternalLink, Copy } from 'lucide-react'
import type { ChronopostRelaisPoint } from './ChronopostRelaisWidget'

interface ChronopostRelaisSimpleProps {
  codePostal: string
  ville?: string
  onSelect: (point: ChronopostRelaisPoint) => void
  selectedPoint?: ChronopostRelaisPoint | null
}

export default function ChronopostRelaisSimple({
  codePostal,
  ville,
  onSelect,
  selectedPoint
}: ChronopostRelaisSimpleProps) {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    codePostal: codePostal,
    ville: ville || '',
    identifiant: '',
    telephone: '',
    horaires: ''
  })

  // Mettre à jour le formulaire quand le code postal change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      codePostal: codePostal,
      ville: ville || prev.ville
    }))
  }, [codePostal, ville])

  const handleSubmit = () => {
    if (formData.nom && formData.adresse && formData.codePostal && formData.ville) {
      const point: ChronopostRelaisPoint = {
        identifiant: formData.identifiant || `MANUAL-${Date.now()}`,
        nom: formData.nom,
        adresse: formData.adresse,
        codePostal: formData.codePostal,
        ville: formData.ville,
        telephone: formData.telephone || undefined,
        horaires: formData.horaires || undefined
      }
      onSelect(point)
    }
  }

  const copyAddress = (point: ChronopostRelaisPoint) => {
    const fullAddress = `${point.nom}\n${point.adresse}\n${point.codePostal} ${point.ville}`
    navigator.clipboard.writeText(fullAddress).then(() => {
      alert('Adresse copiée dans le presse-papiers !')
    }).catch(() => {
      const textarea = document.createElement('textarea')
      textarea.value = fullAddress
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('Adresse copiée !')
    })
  }

  const chronopostSearchUrl = `https://www.chronopost.fr/point-relais/recherche?codePostal=${codePostal}${ville ? `&ville=${encodeURIComponent(ville)}` : ''}`

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Point relais Chronopost</p>
            <p className="text-xs text-blue-400">
              Recherche pour : <strong>{codePostal}</strong> {ville ? ville : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Lien vers Chronopost */}
      {!selectedPoint && (
        <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-3">
            <strong>Étape 1 :</strong> Recherchez un point relais sur le site Chronopost
          </p>
          <a
            href={chronopostSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Ouvrir la recherche Chronopost
          </a>
          <p className="text-xs text-gray-400 mt-3">
            Une fois que vous avez trouvé un point relais, notez ses informations et remplissez le formulaire ci-dessous.
          </p>
        </div>
      )}

      {/* Formulaire de saisie */}
      {!selectedPoint && (
        <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-4">
            <strong>Étape 2 :</strong> Saisissez les informations du point relais
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nom du point relais <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
                value={formData.identifiant}
                onChange={(e) => setFormData({ ...formData, identifiant: e.target.value })}
                placeholder="Ex: CHRP123456"
                className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Adresse complète <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Ex: 123 RUE DE LA POSTE"
                className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Code postal <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codePostal}
                  onChange={(e) => setFormData({ ...formData, codePostal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                  placeholder="75001"
                  maxLength={5}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Ville <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
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
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
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
                  value={formData.horaires}
                  onChange={(e) => setFormData({ ...formData, horaires: e.target.value })}
                  placeholder="Lun-Ven: 9h-18h"
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!formData.nom || !formData.adresse || !formData.codePostal || !formData.ville}
              className="w-full px-4 py-3 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enregistrer ce point relais
            </button>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyAddress(selectedPoint)}
                className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs flex items-center gap-1 transition-colors"
                title="Copier l'adresse"
              >
                <Copy className="w-3 h-3" />
                Copier
              </button>
              <button
                onClick={() => onSelect(null as any)}
                className="text-xs px-3 py-1 bg-noir-700 hover:bg-noir-600 text-white rounded transition-colors"
              >
                Modifier
              </button>
            </div>
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
