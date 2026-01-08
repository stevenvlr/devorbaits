'use client'

import { useState, useEffect } from 'react'
import { X, Gift } from 'lucide-react'
import { SAVEURS_POPUP_DUO, FORMES_POPUP_DUO, AROMES, COULEURS_FLUO, COULEURS_PASTEL, TAILLES_FLUO, TAILLES_PASTEL } from '@/lib/constants'

interface PromoItemModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (characteristics: PromoCharacteristics) => void
  productType: 'Pop-up Duo' | 'Pop-up personnalisé'
  defaultCharacteristics?: PromoCharacteristics
}

export interface PromoCharacteristics {
  arome?: string
  taille?: string
  couleur?: string
}

export default function PromoItemModal({
  isOpen,
  onClose,
  onConfirm,
  productType,
  defaultCharacteristics
}: PromoItemModalProps) {
  const [selectedArome, setSelectedArome] = useState(defaultCharacteristics?.arome || '')
  const [selectedTaille, setSelectedTaille] = useState(defaultCharacteristics?.taille || '')
  const [selectedCouleur, setSelectedCouleur] = useState(defaultCharacteristics?.couleur || '')

  // Initialiser avec les valeurs par défaut ou les premières options disponibles
  useEffect(() => {
    if (isOpen) {
      if (productType === 'Pop-up Duo') {
        setSelectedArome(defaultCharacteristics?.arome || SAVEURS_POPUP_DUO[0])
        setSelectedTaille(defaultCharacteristics?.taille || FORMES_POPUP_DUO[0])
      } else {
        setSelectedTaille(defaultCharacteristics?.taille || TAILLES_FLUO[0])
        setSelectedCouleur(defaultCharacteristics?.couleur || COULEURS_FLUO[0].name)
        setSelectedArome(defaultCharacteristics?.arome || AROMES[0])
      }
    }
  }, [isOpen, productType, defaultCharacteristics])

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm({
      arome: selectedArome,
      taille: selectedTaille,
      couleur: selectedCouleur
    })
    onClose()
  }

  const isPopupDuo = productType === 'Pop-up Duo'

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-noir-900 border-2 border-yellow-500/50 rounded-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-yellow-500">Article offert !</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-noir-800 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6 text-center">
            Félicitations ! Vous avez droit à un article offert grâce à la promotion 4+1.
            <br />
            <span className="text-yellow-500 font-semibold">Choisissez les caractéristiques de votre article gratuit :</span>
          </p>

          <div className="space-y-4">
            {isPopupDuo ? (
              <>
                {/* Saveur pour Pop-up Duo */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Saveur</label>
                  <select
                    value={selectedArome}
                    onChange={(e) => setSelectedArome(e.target.value)}
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  >
                    {SAVEURS_POPUP_DUO.map((saveur) => (
                      <option key={saveur} value={saveur}>
                        {saveur}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Forme pour Pop-up Duo */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Forme</label>
                  <select
                    value={selectedTaille}
                    onChange={(e) => setSelectedTaille(e.target.value)}
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  >
                    {FORMES_POPUP_DUO.map((forme) => (
                      <option key={forme} value={forme}>
                        {forme}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Taille pour Bar à Pop-up */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Taille</label>
                  <select
                    value={selectedTaille}
                    onChange={(e) => setSelectedTaille(e.target.value)}
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  >
                    {[...TAILLES_FLUO, ...TAILLES_PASTEL].map((taille) => (
                      <option key={taille} value={taille}>
                        {taille}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Couleur pour Bar à Pop-up */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Couleur</label>
                  <select
                    value={selectedCouleur}
                    onChange={(e) => setSelectedCouleur(e.target.value)}
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  >
                    {[...COULEURS_FLUO, ...COULEURS_PASTEL].map((couleur) => (
                      <option key={couleur.name} value={couleur.name}>
                        {couleur.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Arôme pour Bar à Pop-up */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Arôme</label>
                  <select
                    value={selectedArome}
                    onChange={(e) => setSelectedArome(e.target.value)}
                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  >
                    {AROMES.map((arome) => (
                      <option key={arome} value={arome}>
                        {arome}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-yellow-500 text-noir-950 rounded-lg hover:bg-yellow-400 transition-colors font-bold"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

