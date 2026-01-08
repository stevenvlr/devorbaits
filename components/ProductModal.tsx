'use client'

import { Fragment } from 'react'
import { X, ShoppingCart } from 'lucide-react'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onAddToCart: () => void
  total: number
  summaryItems: Array<{ label: string; value: string }>
  disabled?: boolean
  buttonText?: string
}

export default function ProductModal({
  isOpen,
  onClose,
  title,
  children,
  onAddToCart,
  total,
  summaryItems,
  disabled = false,
  buttonText = 'Ajouter au panier'
}: ProductModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-noir-900 border border-noir-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-noir-900 border-b border-noir-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-noir-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration */}
            <div className="space-y-6">
              {children}
            </div>

            {/* Résumé */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-6">Résumé</h3>
                <div className="space-y-3 mb-6">
                  {summaryItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-gray-400">
                      <span>{item.label}:</span>
                      <span className="text-white">{item.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-noir-700 pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-yellow-500">{total.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!disabled) {
                      onAddToCart()
                      onClose()
                    }
                  }}
                  disabled={disabled}
                  className="w-full bg-yellow-500 text-noir-950 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-500"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





