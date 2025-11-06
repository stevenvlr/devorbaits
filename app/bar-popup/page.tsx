'use client'

import { useState } from 'react'
import { ShoppingCart, Factory, Palette } from 'lucide-react'
import { AROMES, COULEURS_POPUP, TAILLES_POPUP } from '@/lib/constants'

export default function BarPopupPage() {
  const [selectedTaille, setSelectedTaille] = useState(TAILLES_POPUP[2])
  const [selectedCouleur, setSelectedCouleur] = useState(COULEURS_POPUP[0])
  const [selectedArome, setSelectedArome] = useState(AROMES[0])
  const [quantity, setQuantity] = useState(1)

  // Le diamètre des billes n'influence pas le prix
  const basePrice = 9.99

 

  const addToCart = () => {
    console.log({
      produit: 'Pop-up personnalisé',
      taille: selectedTaille,
      couleur: selectedCouleur.name,
      arome: selectedArome,
      quantite: quantity,
      prix: basePrice * quantity
    })
    alert('Pop-up personnalisé ajouté au panier !')
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Palette className="w-12 h-12 text-yellow-500" />
            Bar à Pop-up
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Personnalisez votre pop-up selon vos préférences : taille, couleur et arôme sur mesure.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Configuration Panel */}
          <div className="space-y-8">
            {/* Taille */}
            <div>
              <label className="block text-lg font-semibold mb-4">Taille du Pop-up</label>
              <div className="grid grid-cols-4 gap-3">
                {TAILLES_POPUP.map((taille) => (
                  <button
                    key={taille}
                    onClick={() => setSelectedTaille(taille)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTaille === taille
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="text-sm font-bold">{taille}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-lg font-semibold mb-4">Couleur</label>
              <div className="grid grid-cols-5 gap-3">
                {COULEURS_POPUP.map((couleur) => (
                  <button
                    key={couleur.name}
                    onClick={() => setSelectedCouleur(couleur)}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      selectedCouleur.name === couleur.name
                        ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                    style={{ backgroundColor: couleur.value }}
                    title={couleur.name}
                  >
                    {selectedCouleur.name === couleur.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">Couleur sélectionnée : {selectedCouleur.name}</p>
            </div>

            {/* Arôme */}
            <div>
              <label className="block text-lg font-semibold mb-4">Arôme</label>
              <div className="grid grid-cols-2 gap-3">
                {AROMES.map((arome) => (
                  <button
                    key={arome}
                    onClick={() => setSelectedArome(arome)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedArome === arome
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    {arome}
                  </button>
                ))}
              </div>
            </div>

          

            {/* Quantité */}
            <div>
              <label className="block text-lg font-semibold mb-4">Quantité</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center bg-noir-800 border border-noir-700 rounded-lg py-2"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Preview & Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
              {/* Preview Visuel */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Aperçu</h3>
                <div className="flex items-center justify-center h-64 bg-noir-900 rounded-lg border border-noir-700">
                  <div
                    className="w-24 h-24 rounded-full shadow-lg"
                    style={{ backgroundColor: selectedCouleur.value }}
                  >
                    {/* Simulation d'un pop-up */}
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>Taille:</span>
                  <span className="text-white">{selectedTaille}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Couleur:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedCouleur.value }}
                    ></div>
                    <span className="text-white">{selectedCouleur.name}</span>
                  </div>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Arôme:</span>
                  <span className="text-white">{selectedArome}</span>
                </div>
              
                <div className="flex justify-between text-gray-400">
                  <span>Quantité:</span>
                  <span className="text-white">{quantity}</span>
                </div>
                <div className="border-t border-noir-700 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-yellow-500">{(basePrice * quantity).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <button
                onClick={addToCart}
                className="w-full bg-yellow-500 text-noir-950 font-bold py-4 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Ajouter au panier
              </button>

              <p className="text-sm text-gray-500 mt-4 text-center">
                Le diamètre des billes ne change pas le prix
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
