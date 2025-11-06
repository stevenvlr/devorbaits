'use client'

import { useState } from 'react'
import { ShoppingCart, Factory } from 'lucide-react'
import { AROMES, CONDITIONNEMENTS } from '@/lib/constants'

const TAILLES_EQUILIBRES = ['10mm', '8mm', '16mm', 'Wafers 12x15mm']

export default function EquilibresPage() {
  const [selectedTaille, setSelectedTaille] = useState(TAILLES_EQUILIBRES[0])
  const [selectedArome, setSelectedArome] = useState(AROMES[0])
  const [selectedConditionnement, setSelectedConditionnement] = useState(CONDITIONNEMENTS[0])
  const [quantity, setQuantity] = useState(1)

  const basePrice = 22.99

  const addToCart = () => {
    console.log({
      produit: 'Équilibré',
      taille: selectedTaille,
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
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Équilibrés</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Billets équilibrés de qualité pour une présentation optimale de vos appâts.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <label className="block text-lg font-semibold mb-4">Taille</label>
              <div className="grid grid-cols-2 gap-4">
                {TAILLES_EQUILIBRES.map((taille) => (
                  <button
                    key={taille}
                    onClick={() => setSelectedTaille(taille)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTaille === taille
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="text-lg font-bold">{taille}</div>
                  </button>
                ))}
              </div>
            </div>

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

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>Taille:</span>
                  <span className="text-white">{selectedTaille}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
