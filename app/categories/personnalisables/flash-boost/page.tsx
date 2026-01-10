'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Factory, Zap, Package } from 'lucide-react'
import { getAllAromesAndSaveurs } from '@/lib/all-aromes-saveurs-manager'
import { useCart } from '@/contexts/CartContext'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { getFlashBoostId, getPrixPersonnalise } from '@/lib/price-utils'
import { loadFlashBoostFormats, loadFlashBoostImage } from '@/lib/flash-spray-variables-manager'

export default function FlashBoostPage() {
  const [allAromes, setAllAromes] = useState<string[]>([])
  const [selectedArome, setSelectedArome] = useState('')
  const [formats, setFormats] = useState<string[]>(['100 ml'])
  const [selectedFormat, setSelectedFormat] = useState('100 ml')
  const [quantity, setQuantity] = useState(1)
  const [productImage, setProductImage] = useState<string | null>(null)
  const { addToCart } = useCart()
  const prixPersonnalises = usePrixPersonnalises()

  // Charger tous les arômes/saveurs disponibles
  useEffect(() => {
    const loadData = async () => {
      const aromes = await getAllAromesAndSaveurs()
      setAllAromes(aromes)
      if (aromes.length > 0 && !selectedArome) {
        setSelectedArome(aromes[0])
      }
      
      // Charger les formats Flash Boost
      const loadedFormats = await loadFlashBoostFormats()
      if (loadedFormats.length > 0) {
        setFormats(loadedFormats)
        setSelectedFormat(loadedFormats[0])
      }
      
      // Charger l'image partagée Flash Boost
      const image = await loadFlashBoostImage()
      setProductImage(image)
    }
    loadData()
  }, [])

  const getPrice = () => {
    if (!selectedArome) return 10.99
    const productId = getFlashBoostId(selectedArome)
    return getPrixPersonnalise(prixPersonnalises, productId, 10.99)
  }

  const handleAddToCart = async () => {
    if (!selectedArome) {
      alert('Veuillez sélectionner un arôme')
      return
    }
    await addToCart({
      produit: `Flash boost ${selectedArome}`,
      arome: selectedArome,
      format: selectedFormat,
      quantite: quantity,
      prix: getPrice()
    })
    alert(`Flash boost ${selectedArome} ajouté au panier !`)
  }

  if (allAromes.length === 0) {
    return (
      <div className="min-h-screen bg-noir-950 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Chargement des arômes...</p>
        </div>
      </div>
    )
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
            <Zap className="w-12 h-12 text-yellow-500" />
            Flash boost
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Boost d'attraction instantané pour renforcer l'efficacité de vos appâts
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Configuration Panel */}
          <div className="space-y-8">
            {/* Arôme */}
            <div>
              <label className="block text-lg font-semibold mb-4">Arôme / Saveur</label>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {allAromes.map((arome) => (
                  <button
                    key={arome}
                    onClick={() => setSelectedArome(arome)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedArome === arome
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="font-semibold">{arome}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-lg font-semibold mb-4">Format</label>
              <div className="grid grid-cols-2 gap-3">
                {formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedFormat === format
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="font-semibold">{format}</div>
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
                <div className="flex items-center justify-center h-64 bg-noir-900 rounded-lg border border-noir-700 overflow-hidden">
                  {productImage ? (
                    <img 
                      src={productImage} 
                      alt="Flash Boost" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-24 h-24 text-gray-500" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>Arôme:</span>
                  <span className="text-white">{selectedArome || 'Non sélectionné'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Format:</span>
                  <span className="text-white">{selectedFormat || 'Non sélectionné'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Quantité:</span>
                  <span className="text-white">{quantity}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Prix unitaire:</span>
                  <span className="text-white">{getPrice().toFixed(2)}€</span>
                </div>
                <div className="border-t border-noir-700 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-yellow-500">{(getPrice() * quantity).toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-noir-950 font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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