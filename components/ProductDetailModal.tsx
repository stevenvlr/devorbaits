'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, ShoppingCart, Package } from 'lucide-react'
import { Product, ProductVariant, getProductImages } from '@/lib/products-manager'
import { getAvailableStock } from '@/lib/stock-manager'
import { useCart } from '@/contexts/CartContext'

interface ProductDetailModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onAddToCart?: (product: Product, variant?: ProductVariant, quantity?: number) => void
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onAddToCart
}: ProductDetailModalProps) {
  const { addToCart } = useCart()
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Pour les bouillettes : sélection par diamètre et conditionnement
  const isBouillettes = product?.category.toLowerCase() === 'bouillettes' && product?.variants && product.variants.length > 0
  const [selectedDiametre, setSelectedDiametre] = useState<string>('')
  const [selectedConditionnement, setSelectedConditionnement] = useState<string>('')
  
  // Pour les équilibrées : sélection par taille
  const isEquilibrees = product && (product.category.toLowerCase() === 'équilibrées' || product.category.toLowerCase() === 'équilibrés') && product.variants && product.variants.length > 0
  const [selectedTaille, setSelectedTaille] = useState<string>('')

  // Images du produit (pour le carrousel) - mémorisées pour éviter les re-renders inutiles
  const images = useMemo(() => {
    return product ? getProductImages(product) : []
  }, [product?.id, product?.images, product?.image, product?.gamme])

  // Réinitialiser les états quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen && product) {
      setSelectedVariantId('')
      setSelectedDiametre('')
      setSelectedConditionnement('')
      setSelectedTaille('')
      setQuantity(1)
      setCurrentImageIndex(0)
    }
  }, [isOpen, product])

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

  if (!isOpen || !product) return null

  const hasVariants = product.variants && product.variants.length > 0
  
  // Trouver la variante sélectionnée (temporairement : ne pas filtrer par available pour test)
  const selectedVariant: ProductVariant | undefined = hasVariants ? (() => {
    if (isBouillettes && selectedDiametre && selectedConditionnement) {
      return product.variants?.find(v => 
        v.diametre === selectedDiametre && 
        v.conditionnement === selectedConditionnement
      )
    }
    if (isEquilibrees && selectedTaille) {
      return product.variants?.find(v => 
        v.taille === selectedTaille
      )
    }
    if (selectedVariantId) {
      return product.variants?.find(v => v.id === selectedVariantId)
    }
    return undefined
  })() : undefined
  
  // Extraire les options uniques pour les bouillettes
  const diametres = isBouillettes ? Array.from(new Set(product.variants?.map(v => v.diametre).filter(Boolean))) : []
  const conditionnements = isBouillettes ? Array.from(new Set(product.variants?.map(v => v.conditionnement).filter(Boolean))) : []
  const tailles = isEquilibrees ? Array.from(new Set(product.variants?.map(v => v.taille).filter(Boolean))) : []

  const availableStock = hasVariants && selectedVariant
    ? getAvailableStock(product.id, selectedVariant.id)
    : getAvailableStock(product.id)

  const price = hasVariants && selectedVariant
    ? (selectedVariant.price || 0)
    : (product.price || 0)

  const handleAddToCartClick = async () => {
    if (onAddToCart) {
      onAddToCart(product, selectedVariant, quantity)
    } else {
      // Fallback vers le système de panier
      await addToCart({
        produit: product.name,
        arome: product.gamme || selectedVariant?.arome || '',
        quantite: quantity,
        prix: price,
        productId: product.id,
        variantId: selectedVariant?.id,
        // Inclure les informations de variante pour les bouillettes et autres produits
        diametre: selectedVariant?.diametre,
        conditionnement: selectedVariant?.conditionnement,
        taille: selectedVariant?.taille,
        couleur: selectedVariant?.couleur
      })
    }
    alert(`${product.name}${selectedVariant ? ` - ${selectedVariant.label}` : ''} ajouté au panier !`)
    onClose()
  }

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  // Temporairement : ne pas vérifier la disponibilité pour test
  const canAddToCart = (!hasVariants || selectedVariant !== undefined)

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
          <h2 className="text-xl sm:text-2xl font-bold truncate pr-4">{product.name}</h2>
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
            {/* Colonne gauche - Carrousel d'images */}
            <div className="space-y-4">
              {images.length > 0 ? (
                <div className="relative aspect-square bg-noir-800 rounded-lg overflow-hidden">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation du carrousel */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                        aria-label="Image précédente"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                        aria-label="Image suivante"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                      
                      {/* Indicateurs de position */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-yellow-500 w-6' : 'bg-white/50'
                            }`}
                            aria-label={`Aller à l'image ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      {/* Compteur d'images */}
                      <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative aspect-square bg-noir-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-500" />
                </div>
              )}

              {/* Miniatures des images (si plus d'une image) */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-yellow-500' 
                          : 'border-noir-700 hover:border-noir-600'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite - Informations */}
            <div className="space-y-6">
              {/* Prix */}
              <div>
                <p className="text-3xl font-bold text-yellow-500">
                  {price.toFixed(2)} €
                </p>
                {product.format && (
                  <p className="text-gray-400 text-sm mt-1">{product.format}</p>
                )}
              </div>

              {/* Variantes - Bouillettes (diamètre + conditionnement) */}
              {isBouillettes && (
                <div className="space-y-4">
                  {/* Sélection du diamètre */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Diamètre</label>
                    <div className="grid grid-cols-3 gap-2">
                      {diametres.map(diametre => {
                        if (!diametre) return null
                        const isSelected = selectedDiametre === diametre
                        return (
                          <button
                            key={diametre}
                            type="button"
                            onClick={() => {
                              setSelectedDiametre(diametre)
                              setSelectedConditionnement('')
                              setSelectedVariantId('')
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-yellow-500 text-noir-950'
                                : 'bg-noir-800 border border-noir-700 text-gray-300 hover:bg-noir-700'
                            }`}
                          >
                            {diametre}mm
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Sélection du conditionnement */}
                  {selectedDiametre && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Conditionnement</label>
                      <div className="grid grid-cols-2 gap-2">
                        {conditionnements.map(conditionnement => {
                          if (!conditionnement) return null
                          const variant = product.variants?.find(v => 
                            v.diametre === selectedDiametre && 
                            v.conditionnement === conditionnement
                          )
                          const isSelected = selectedConditionnement === conditionnement
                          
                          return (
                            <button
                              key={conditionnement}
                              type="button"
                              onClick={() => {
                                setSelectedConditionnement(conditionnement)
                                if (variant) {
                                  setSelectedVariantId(variant.id)
                                }
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-yellow-500 text-noir-950'
                                  : 'bg-noir-800 border border-noir-700 text-gray-300 hover:bg-noir-700'
                              }`}
                              title={`${variant?.price.toFixed(2)} €`}
                            >
                              {conditionnement}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Variantes - Équilibrées (taille) */}
              {isEquilibrees && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Taille</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tailles.map(taille => {
                      if (!taille) return null
                      const variant = product.variants?.find(v => 
                        v.taille === taille
                      )
                      const isSelected = selectedTaille === taille
                      
                      return (
                        <button
                          key={taille}
                          type="button"
                          onClick={() => {
                            if (variant) {
                              setSelectedTaille(taille)
                              setSelectedVariantId(variant.id)
                            }
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-yellow-500 text-noir-950'
                              : 'bg-noir-800 border border-noir-700 text-gray-300 hover:bg-noir-700'
                          }`}
                          title={`${variant?.price.toFixed(2)} €`}
                        >
                          {taille}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Variantes - Autres produits (boutons pour toutes les variantes) */}
              {hasVariants && !isBouillettes && !isEquilibrees && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Variantes disponibles
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants?.map(variant => {
                      const isSelected = selectedVariantId === variant.id
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(variant.id)
                            setQuantity(1)
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-yellow-500 text-noir-950'
                              : 'bg-noir-800 border border-noir-700 text-gray-300 hover:bg-noir-700'
                          }`}
                        >
                          {variant.label} - {(variant.price || 0).toFixed(2)} €
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Quantité
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                      // Temporairement : ne pas vérifier le stock pour test
                      setQuantity(newQty)
                    }}
                    className="w-20 text-center bg-noir-800 border border-noir-700 rounded-lg py-2"
                    min="1"
                  />
                  <button
                    onClick={() => {
                      // Temporairement : ne pas vérifier le stock pour test
                      setQuantity(quantity + 1)
                    }}
                    disabled={false}
                    className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Description</h3>
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Gamme */}
              {product.gamme && (
                <div>
                  <h3 className="text-lg font-bold mb-2">Gamme d'appât</h3>
                  <p className="text-gray-400 text-sm">{product.gamme}</p>
                </div>
              )}

              {/* Catégorie */}
              <div>
                <h3 className="text-lg font-bold mb-2">Catégorie</h3>
                <p className="text-gray-400 text-sm capitalize">{product.category}</p>
              </div>

              {/* Bouton Ajouter au panier */}
              <button
                onClick={handleAddToCartClick}
                disabled={!canAddToCart}
                className="w-full bg-yellow-500 text-noir-950 font-bold py-4 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-500"
              >
                <ShoppingCart className="w-5 h-5" />
                {(() => {
                  // Temporairement : ne pas afficher les messages d'indisponibilité pour test
                  if (hasVariants && !selectedVariant) return 'Sélectionner une variante'
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