'use client'

import { useState } from 'react'
import { ShoppingCart, Factory } from 'lucide-react'
import { GAMMES_BOUILLETTES, TAILLES_EQUILIBRES } from '@/lib/constants'
import { useCart } from '@/contexts/CartContext'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { getEquilibreId, getPrixPersonnalise } from '@/lib/price-utils'

export default function EquilibresPage() {
  const [selectedTaille, setSelectedTaille] = useState(TAILLES_EQUILIBRES[0])
  const [selectedArome, setSelectedArome] = useState(GAMMES_BOUILLETTES[0])
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const prixPersonnalises = usePrixPersonnalises()

  const getPrice = () => {
    const productId = getEquilibreId(selectedArome, selectedTaille)
    return getPrixPersonnalise(prixPersonnalises, productId, 8.99)
  }

  const handleAddToCart = async () => {
    await addToCart({
      produit: 'Équilibrée',
      taille: selectedTaille,
      arome: selectedArome,
      quantite: quantity,
      prix: getPrice()
    })
    alert('Produit ajouté au panier !')
  }
  
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity))
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Équilibrées</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Billets équilibrées de qualité pour une présentation optimale de vos appâts.
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
                {GAMMES_BOUILLETTES.map((arome) => (
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
              <label className="block text-lg font-semibold mb-4">Quantité</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-20 text-center bg-noir-800 border border-noir-700 rounded-lg py-2"
                  min="1"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
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
                  <span>Quantité:</span>
                  <span className="text-white">{quantity}</span>
                </div>
                <div className="border-t border-noir-700 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-yellow-500">{(getPrice() * quantity).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn btn-primary btn-lg w-full"
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
