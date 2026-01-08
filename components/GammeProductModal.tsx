'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart, Package } from 'lucide-react'

interface GammeProductModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  productDescription?: string
  price: number
  format?: string
  gamme?: string
  quantity: number
  onQuantityChange: (qty: number) => void
  onAddToCart: () => void
  availableStock?: number
  disabled?: boolean
  buttonText?: string
  children?: React.ReactNode // Pour les options de configuration spécifiques
}

export default function GammeProductModal({
  isOpen,
  onClose,
  productName,
  productDescription,
  price,
  format,
  gamme,
  quantity,
  onQuantityChange,
  onAddToCart,
  availableStock,
  disabled = false,
  buttonText,
  children
}: GammeProductModalProps) {
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

  const handleAddToCartClick = () => {
    onAddToCart()
    onClose()
  }

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
          <h2 className="text-xl sm:text-2xl font-bold truncate pr-4">{productName}</h2>
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
              <div>
                <p className="text-3xl font-bold text-yellow-500">
                  {price.toFixed(2)} €
                </p>
                {format && (
                  <p className="text-gray-400 text-sm mt-1">{format}</p>
                )}
              </div>


              {/* Informations du produit */}
              {gamme && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">Gamme d'appât</h3>
                  <p className="text-gray-400">{gamme}</p>
                </div>
              )}

              {productDescription && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Description</h3>
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {productDescription}
                  </p>
                </div>
              )}

              {/* Options de configuration (children) */}
              {children && (
                <div>
                  {children}
                </div>
              )}

              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Quantité
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const newQty = Math.max(1, parseInt(e.target.value) || 1)
                      if (availableStock === undefined || availableStock < 0 || newQty <= availableStock) {
                        onQuantityChange(newQty)
                      }
                    }}
                    className="w-20 text-center bg-noir-800 border border-noir-700 rounded-lg py-2"
                    min="1"
                    max={availableStock !== undefined && availableStock >= 0 ? availableStock : undefined}
                  />
                  <button
                    onClick={() => {
                      if (availableStock === undefined || availableStock < 0 || quantity + 1 <= availableStock) {
                        onQuantityChange(quantity + 1)
                      }
                    }}
                    disabled={availableStock !== undefined && availableStock >= 0 && availableStock < quantity + 1}
                    className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bouton Ajouter au panier */}
              <button
                onClick={handleAddToCartClick}
                disabled={disabled}
                className="w-full bg-yellow-500 text-noir-950 font-bold py-4 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-500"
              >
                <ShoppingCart className="w-5 h-5" />
                {buttonText || 'Ajouter au panier'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

