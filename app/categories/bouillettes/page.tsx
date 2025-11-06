'use client'

import { useState } from 'react'
import { ShoppingCart, Factory } from 'lucide-react'
import { AROMES, DIAMETRES_BOUILLETTES, CONDITIONNEMENTS } from '@/lib/constants'

export default function BouillettesPage() {
  const [selectedDiametre, setSelectedDiametre] = useState(DIAMETRES_BOUILLETTES[0])
  const [selectedArome, setSelectedArome] = useState(AROMES[0])
  const [selectedConditionnement, setSelectedConditionnement] = useState(CONDITIONNEMENTS[0])
  const [quantity, setQuantity] = useState(1)

  const basePrice = 9.99 // Prix de base (le diamètre n'influence pas le prix)

  const addToCart = () => {
    // TODO: Implémenter l'ajout au panier
    console.log({
      produit: 'Bouillette',
      diametre: selectedDiametre,
      arome: selectedArome,
      conditionnement: selectedConditionnement,
      quantite: quantity,
      prix: basePrice * quantity
    })
    alert('Produit ajouté au panier !')
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
          <h1 className="text-5xl font-bold mb-4">Bouillettes</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Appâts de qualité supérieure, fabriqués en France avec des ingrédients sélectionnés.
          </p>
        </div>

        {/* Product Configuration */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Configuration Panel */}
          <div className="space-y-8">
            {/* Diamètre */}
            <div>
              <label className="block text-lg font-semibold mb-4">
                Diamètre <span className="text-sm font-normal text-gray-400">(Le prix ne change pas)</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {DIAMETRES_BOUILLETTES.map((diametre) => (
                  <button
                    key={diametre}
                    onClick={() => setSelectedDiametre(diametre)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedDiametre === diametre
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="text-2xl font-bold">{diametre}mm</div>
                  </button>
                ))}
              </div>
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

            {/* Conditionnement */}
            <div>
              <label className="block text-lg font-semibold mb-4">Conditionnement</label>
              <div className="grid grid-cols-3 gap-4">
                {CONDITIONNEMENTS.map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setSelectedConditionnement(cond)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedConditionnement === cond
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="text-xl font-bold">{cond}</div>
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

          {/* Product Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>Diamètre:</span>
                  <span className="text-white">{selectedDiametre}mm</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Arôme:</span>
                  <span className="text-white">{selectedArome}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Conditionnement:</span>
                  <span className="text-white">{selectedConditionnement}</span>
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
                Le prix ne change pas selon le diamètre choisi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
