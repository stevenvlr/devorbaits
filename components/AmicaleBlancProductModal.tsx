'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart, Package } from 'lucide-react'
import { ProduitDisponible } from '@/lib/amicale-blanc-config'
import { getAvailableStockSync } from '@/lib/amicale-blanc-stock'
import { useCart } from '@/contexts/CartContext'
import { getBouilletteId, getPrixPersonnalise } from '@/lib/price-utils'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'

interface AmicaleBlancProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProduitDisponible | null
  onAddToCart?: (product: ProduitDisponible) => void
}

export default function AmicaleBlancProductModal({
  isOpen,
  onClose,
  product,
  onAddToCart
}: AmicaleBlancProductModalProps) {
  const { addToCart } = useCart()
  const prixPersonnalises = usePrixPersonnalises()
  const { promotion } = useGlobalPromotion()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const getPrice = () => {
    if (!product.diametre || !product.conditionnement || !product.gamme) return 0
    const productId = getBouilletteId(product.gamme, product.diametre, product.conditionnement)
    const is10mm = product.diametre === '10'
    const isRobinRed = product.gamme === 'Robin Red Vers de vase'
    const isMureCassis = product.gamme === 'Mure Cassis'
    let basePrice = 0
    
    if (product.conditionnement === '1kg') {
      basePrice = is10mm ? 11.99 : 9.99
    } else if (product.conditionnement === '2.5kg') {
      basePrice = is10mm ? 28.99 : 23.99
    } else if (product.conditionnement === '5kg') {
      basePrice = is10mm ? 56.99 : 46.99
    } else if (product.conditionnement === '10kg') {
      basePrice = is10mm ? 109.99 : 89.99
    } else {
      basePrice = 9.99
    }
    
    const defaultPrice = (isRobinRed || isMureCassis) ? basePrice + 2 : basePrice
    return getPrixPersonnalise(prixPersonnalises, productId, defaultPrice, promotion, 'bouillettes', product.gamme)
  }

  const productId = product.diametre && product.conditionnement && product.gamme
    ? getBouilletteId(product.gamme, product.diametre, product.conditionnement)
    : ''
  const availableStock = productId ? getAvailableStockSync(productId) : 0
  const price = getPrice()

  const handleAddToCartClick = () => {
    if (onAddToCart) {
      onAddToCart(product)
    } else {
      if (!product.diametre || !product.conditionnement || !product.gamme) {
        alert('Informations du produit incomplètes')
        return
      }
      
      if (availableStock < 1) {
        alert(`Stock insuffisant pour ${product.nom}. Stock disponible : ${availableStock}`)
        return
      }
      
      addToCart({
        produit: product.nom,
        arome: product.gamme || '',
        taille: product.diametre ? `${product.diametre}mm` : undefined,
        conditionnement: product.conditionnement,
        quantite: 1,
        prix: price,
        pointRetrait: 'amicale-blanc',
        productId: productId
      })
    }
    alert(`${product.nom} ajouté au panier pour retrait à L'amicale des pêcheurs au blanc !`)
    onClose()
  }

  const canAddToCart = product.diametre && product.conditionnement && product.gamme && availableStock >= 1

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
        className="relative bg-noir-900 border border-noir-700 rounded-xl w-full h-[90vh] sm:h-[95vh] max-w-[95vw] sm:max-w-[90vw] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-noir-900 border-b border-noir-700 px-4 sm:px-6 py-4 flex items-center justify-between z-20">
          <h2 className="text-xl sm:text-2xl font-bold truncate pr-4">{product.nom}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-noir-800 rounded-lg transition-colors flex-shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
            {/* Colonne gauche - Image */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-noir-800 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Colonne droite - Informations */}
            <div className="space-y-6">
              {/* Prix */}
              {price > 0 && (
                <div>
                  <p className="text-3xl font-bold text-yellow-500">
                    {price.toFixed(2)} €
                  </p>
                </div>
              )}


              {/* Informations du produit */}
              <div className="space-y-3">
                {product.gamme && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Gamme d'appât</h3>
                    <p className="text-gray-400">{product.gamme}</p>
                  </div>
                )}
                {product.diametre && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Diamètre</h3>
                    <p className="text-gray-400">{product.diametre}mm</p>
                  </div>
                )}
                {product.conditionnement && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Conditionnement</h3>
                    <p className="text-gray-400">{product.conditionnement}</p>
                  </div>
                )}
                {product.taille && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Taille</h3>
                    <p className="text-gray-400">{product.taille}</p>
                  </div>
                )}
                {product.couleur && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Couleur</h3>
                    <p className="text-gray-400">{product.couleur}</p>
                  </div>
                )}
                {product.arome && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Arôme</h3>
                    <p className="text-gray-400">{product.arome}</p>
                  </div>
                )}
                {product.saveur && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Saveur</h3>
                    <p className="text-gray-400">{product.saveur}</p>
                  </div>
                )}
                {product.forme && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Forme</h3>
                    <p className="text-gray-400">{product.forme}</p>
                  </div>
                )}
                {product.type && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Type</h3>
                    <p className="text-gray-400">{product.type}</p>
                  </div>
                )}
              </div>

              {/* Point de retrait */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Point de retrait</h3>
                <p className="text-gray-400 text-sm">
                  Ce produit est disponible pour retrait à L'amicale des pêcheurs au blanc
                </p>
              </div>

              {/* Bouton Ajouter au panier */}
              <button
                onClick={handleAddToCartClick}
                disabled={!canAddToCart}
                className="w-full bg-yellow-500 text-noir-950 font-bold py-4 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-500"
              >
                <ShoppingCart className="w-5 h-5" />
                {(() => {
                  if (!product.diametre || !product.conditionnement || !product.gamme) return 'Informations incomplètes'
                  if (availableStock < 1) return 'Stock épuisé'
                  return 'Ajouter au panier'
                })()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

