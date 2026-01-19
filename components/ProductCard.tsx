'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ShoppingCart, Package } from 'lucide-react'
import { Product, ProductVariant, getProductImages } from '@/lib/products-manager'
import { loadFlashBoostImage, loadSprayPlusImage } from '@/lib/flash-spray-variables-manager'
import { getAvailableStockSync, onStockUpdate } from '@/lib/stock-manager'
import { useCart } from '@/contexts/CartContext'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { applyGlobalPromotion } from '@/lib/global-promotion-manager'
import ProductDetailModal from './ProductDetailModal'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product, variant?: ProductVariant, quantity?: number) => void
  showAddToCart?: boolean
  className?: string
}

export default function ProductCard({ 
  product, 
  onAddToCart,
  showAddToCart = true,
  className = ''
}: ProductCardProps) {
  const { addToCart } = useCart()
  const { promotion } = useGlobalPromotion()
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [, forceUpdate] = useState(0)

  // Fonction pour obtenir le prix avec promotion
  const getPriceWithPromotion = (price: number) => {
    return applyGlobalPromotion(price, promotion, product.category, product.gamme)
  }

  // Écouter les mises à jour du stock en temps réel
  useEffect(() => {
    const unsubscribe = onStockUpdate(() => {
      forceUpdate(prev => prev + 1)
    })
    return unsubscribe
  }, [])

  // Précharger les images partagées pour Flash Boost et Spray Plus
  useEffect(() => {
    const categoryLower = product.category.toLowerCase()
    if (categoryLower === 'flash boost') {
      loadFlashBoostImage().then(() => forceUpdate(prev => prev + 1))
    } else if (categoryLower === 'spray plus') {
      loadSprayPlusImage().then(() => forceUpdate(prev => prev + 1))
    }
  }, [product.category])

  const hasVariants = product.variants && product.variants.length > 0
  
  // Pour les bouillettes : sélection par diamètre et conditionnement
  const isBouillettes = product.category.toLowerCase() === 'bouillettes' && hasVariants
  const [selectedDiametre, setSelectedDiametre] = useState<string>('')
  const [selectedConditionnement, setSelectedConditionnement] = useState<string>('')
  
  // Pour les équilibrées : sélection par taille
  const isEquilibrees = (product.category.toLowerCase() === 'équilibrées' || product.category.toLowerCase() === 'équilibrés') && hasVariants
  const [selectedTaille, setSelectedTaille] = useState<string>('')
  
  const isProductAvailable = product.available === true

  // Trouver la variante sélectionnée
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

  const productKey = hasVariants && selectedVariant
    ? `${product.id}-${selectedVariant.id}`
    : `${product.id}-${product.gamme || ''}`
  const quantity = quantities[productKey] || 1
  const isSelectionReady = !hasVariants || Boolean(selectedVariant)
  
  // Extraire les options uniques pour les bouillettes
  const diametres = isBouillettes ? Array.from(new Set(product.variants?.map(v => v.diametre).filter(Boolean))) : []
  const conditionnements = isBouillettes ? Array.from(new Set(product.variants?.map(v => v.conditionnement).filter(Boolean))) : []
  const tailles = isEquilibrees ? Array.from(new Set(product.variants?.map(v => v.taille).filter(Boolean))) : []

  const availableStock = hasVariants && selectedVariant
    ? getAvailableStockSync(product.id, selectedVariant.id)
    : getAvailableStockSync(product.id)

  const selectedVariantAvailable = !hasVariants || (selectedVariant?.available === true)
  // Règle métier:
  // - stock === 0 => commandable (afficher délai), donc NE PAS bloquer sélection/achat
  // - stock > 0 => limiter la quantité à ce stock
  // - stock === -1 => stock non défini => illimité
  const isBackorder = availableStock === 0
  const isStockLimited = availableStock > 0
  const isStockEnough = !isStockLimited || availableStock >= quantity
  const canChangeQuantity = isProductAvailable && isSelectionReady && selectedVariantAvailable
  const canAddToCart = isProductAvailable && isSelectionReady && selectedVariantAvailable && isStockEnough

  const basePrice = hasVariants && selectedVariant ? (selectedVariant.price || 0) : (product.price || 0)
  const priceWithPromotion = getPriceWithPromotion(basePrice)
  const showPromotion = Boolean(promotion?.active && priceWithPromotion < basePrice)

  // Mémoriser les images du produit pour éviter les re-renders inutiles
  // et s'assurer que les images sont toujours à jour
  const productImages = useMemo(() => {
    return getProductImages(product)
  }, [product.id, product.images, product.image, product.gamme])

  const handleAddToCartClick = async () => {
    if (onAddToCart) {
      onAddToCart(product, selectedVariant, quantity)
    } else {
      const prixOriginal = basePrice
      const prixAvecPromotion = priceWithPromotion
      
      await addToCart({
        produit: product.name,
        arome: product.gamme || '',
        quantite: quantity,
        prix: prixAvecPromotion,
        prixOriginal: prixOriginal, // Stocker le prix original pour recalculer si promotion activée après
        category: product.category, // Stocker la catégorie pour appliquer la promotion
        gamme: product.gamme, // Stocker la gamme pour appliquer la promotion
        productId: product.id,
        variantId: selectedVariant?.id,
        // Inclure les propriétés de la variante pour le calcul du poids
        conditionnement: selectedVariant?.conditionnement,
        diametre: selectedVariant?.diametre,
        taille: selectedVariant?.taille,
        couleur: selectedVariant?.couleur
      })
    }
    alert(`${product.name}${selectedVariant ? ` - ${selectedVariant.label}` : ''} ajouté au panier !`)
  }

  const setQuantity = (value: number) => {
    if (!isProductAvailable) return
    if (hasVariants && !selectedVariant) return
    if (hasVariants && selectedVariant?.available !== true) return
    // Stock limité uniquement si > 0. Si stock=0 => sur commande (délai), donc on ne limite pas.
    if (availableStock > 0 && value > availableStock) return
    setQuantities(prev => ({ ...prev, [productKey]: Math.max(1, value) }))
  }

  return (
    <>
      <div className={`bg-noir-800/50 border rounded-2xl p-6 transition-all duration-300 group border-noir-700 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 flex flex-col h-full min-h-[600px] ${className}`}>
        {/* Image cliquable */}
        <div 
          className="aspect-square bg-noir-700/80 rounded-xl mb-5 flex items-center justify-center overflow-hidden relative cursor-pointer transition-all duration-300 group-hover:bg-noir-700"
          onClick={() => {
            setIsModalOpen(true)
          }}
        >
          {productImages.length > 0 ? (
            <Image
              src={productImages[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              quality={85}
            />
          ) : (
            <Package className="w-16 h-16 transition-colors duration-300 text-gray-500 group-hover:text-yellow-500" />
          )}
        </div>

        <h3 className="text-xl font-bold mb-3 text-white">
          {product.name}
        </h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
          {product.description || (() => {
            // Description par défaut selon la catégorie
            const categoryLower = product.category.toLowerCase()
            if (categoryLower === 'bouillettes') {
              return `Bouillettes artisanales ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Qualité française, saveurs authentiques pour une pêche réussie.`
            }
            if (categoryLower === 'équilibrées' || categoryLower === 'équilibrés') {
              return `Appâts équilibrés ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Parfaits pour tous types de pêche, texture et saveur optimisées.`
            }
            if (categoryLower === 'huiles') {
              return `Huile ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Qualité française pour optimiser vos sessions de pêche.`
            }
            if (categoryLower === 'farines') {
              return `Farine ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Qualité française pour vos préparations.`
            }
            if (categoryLower === 'boosters') {
              return `Booster ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Complément nutritionnel pour enrichir vos amorces.`
            }
            if (categoryLower === 'flash boost') {
              return `Flash boost ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Stimulant puissant pour activer l'appétit des poissons.`
            }
            if (categoryLower === 'spray plus') {
              return `Spray plus ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Vaporisateur d'arômes concentrés pour renforcer vos appâts.`
            }
            if (categoryLower === 'stick mix') {
              return `Stick mix ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Mélange prêt à l'emploi pour une pêche efficace.`
            }
            if (categoryLower === 'pop-up duo') {
              return `Pop-up Duo ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Appât flottant efficace pour la pêche au blanc.`
            }
            if (categoryLower === 'bar à pop-up') {
              return `Bar à Pop-up ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Appât pratique et efficace pour tous types de pêche.`
            }
            if (categoryLower === 'bird food') {
              return `Bird food aux fruits ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Mélange nutritif et attractif pour les poissons.`
            }
            if (categoryLower === 'robin red') {
              return 'Robin Red authentique. Produit de référence pour la pêche, qualité européenne.'
            }
            return `Produit ${product.gamme ? `de la gamme d'appât ${product.gamme}` : 'premium'}. Qualité française pour optimiser vos sessions de pêche.`
          })()}
        </p>
        {product.format && (
          <p className="text-gray-500 text-xs mb-4 font-medium">{product.format}</p>
        )}

        {/* Sélection de variante - Bouillettes (diamètre + conditionnement) */}
        {isBouillettes && (
          <div className="mb-5 space-y-4 min-h-[180px]">
            {/* Sélection du diamètre */}
            <div>
              <label className="block text-xs font-semibold mb-2.5 text-gray-400 uppercase tracking-wide">Diamètre</label>
              <div className="grid grid-cols-3 gap-2.5">
                    {diametres.map(diametre => {
                      if (!diametre) return null
                      const isSelected = selectedDiametre === diametre
                      return (
                        <button
                          key={diametre}
                          type="button"
                          onClick={() => {
                            setSelectedDiametre(diametre)
                            setSelectedConditionnement('') // Réinitialiser le conditionnement
                          }}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? 'bg-yellow-500 text-noir-950 shadow-md shadow-yellow-500/30 scale-105'
                          : 'bg-noir-700/80 text-gray-300 hover:bg-noir-600 hover:scale-[1.02] border border-noir-600'
                      }`}
                    >
                      {diametre}mm
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Sélection du conditionnement - Toujours affiché */}
            <div>
              <label className="block text-xs font-semibold mb-2.5 text-gray-400 uppercase tracking-wide">Conditionnement</label>
              <div className="grid grid-cols-2 gap-2.5">
                {conditionnements.map(conditionnement => {
                  if (!conditionnement) return null
                  // Si un diamètre est sélectionné, filtrer les conditionnements disponibles pour ce diamètre
                  const variant = selectedDiametre 
                    ? product.variants?.find(v => 
                        v.diametre === selectedDiametre && 
                        v.conditionnement === conditionnement
                      )
                    : product.variants?.find(v => v.conditionnement === conditionnement)
                  
                  const variantStock = variant ? getAvailableStockSync(product.id, variant.id) : -1
                  const isSelected = selectedConditionnement === conditionnement
                  const isMissingVariantForSelection = Boolean(selectedDiametre && !variant) // Diamètre sélectionné mais pas de variante correspondante
                  // IMPORTANT: stock=0 reste commandable (délai). On désactive UNIQUEMENT si indisponible.
                  const isVariantUnavailable = !variant || variant.available !== true || !isProductAvailable
                  const isDisabled = isMissingVariantForSelection || isVariantUnavailable
                  
                  return (
                    <button
                      key={conditionnement}
                      type="button"
                      onClick={() => {
                        if (!isDisabled && variant) {
                          setSelectedConditionnement(conditionnement)
                          setSelectedVariantId(variant.id)
                          setQuantities(prev => ({ ...prev, [`${product.id}-${variant.id}`]: 1 }))
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isDisabled
                          ? 'bg-noir-800/50 text-gray-600 cursor-not-allowed opacity-40 border border-noir-700'
                          : isSelected
                          ? 'bg-yellow-500 text-noir-950 shadow-md shadow-yellow-500/30 scale-105'
                          : 'bg-noir-700/80 text-gray-300 hover:bg-noir-600 hover:scale-[1.02] border border-noir-600'
                      }`}
                      title={
                        isMissingVariantForSelection
                          ? 'Sélectionnez d\'abord un diamètre'
                          : !variant
                          ? 'Indisponible'
                          : variant.available !== true
                          ? 'Indisponible'
                          : variantStock === 0
                          ? 'Sur commande (délai)'
                          : `${getPriceWithPromotion(variant.price).toFixed(2)} €`
                      }
                    >
                      {conditionnement}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sélection de variante - Équilibrées (taille) */}
        {isEquilibrees && (
          <div className="mb-5 min-h-[100px]">
            <label className="block text-xs font-semibold mb-2.5 text-gray-400 uppercase tracking-wide">Taille</label>
            <div className="grid grid-cols-2 gap-2.5">
              {tailles.map(taille => {
                if (!taille) return null
                const variant = product.variants?.find(v => 
                  v.taille === taille
                )
                const variantStock = variant ? getAvailableStockSync(product.id, variant.id) : -1
                const isSelected = selectedTaille === taille
                const isDisabled = !variant || variant.available !== true || !isProductAvailable
                
                return (
                  <button
                    key={taille}
                    type="button"
                    onClick={() => {
                      if (variant && !isDisabled) {
                        setSelectedTaille(taille)
                        setSelectedVariantId(variant.id)
                        setQuantities(prev => ({ ...prev, [`${product.id}-${variant.id}`]: 1 }))
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isDisabled
                        ? 'bg-noir-800/50 text-gray-600 cursor-not-allowed opacity-40 border border-noir-700'
                        : isSelected
                        ? 'bg-yellow-500 text-noir-950 shadow-md shadow-yellow-500/30 scale-105'
                        : 'bg-noir-700/80 text-gray-300 hover:bg-noir-600 hover:scale-102 border border-noir-600'
                    }`}
                    title={
                      !variant
                        ? 'Indisponible'
                        : variant.available !== true
                        ? 'Indisponible'
                        : variantStock === 0
                        ? 'Sur commande (délai)'
                        : `${getPriceWithPromotion(variant?.price || 0).toFixed(2)} €`
                    }
                  >
                    {taille}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Sélection de variante - Autres produits (boutons) */}
        {hasVariants && !isBouillettes && !isEquilibrees && (
          <div className="mb-5 min-h-[100px]">
            <label className="block text-xs font-semibold mb-2.5 text-gray-400 uppercase tracking-wide">
              Variante
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {product.variants?.map(variant => {
                const variantStock = getAvailableStockSync(product.id, variant.id)
                const isSelected = selectedVariantId === variant.id
                const isVariantDisabled = variant.available !== true || !isProductAvailable
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      if (!isVariantDisabled) {
                        setSelectedVariantId(variant.id)
                        setQuantities(prev => ({ ...prev, [`${product.id}-${variant.id}`]: 1 }))
                      }
                    }}
                    disabled={isVariantDisabled}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isVariantDisabled
                        ? 'bg-noir-800/50 text-gray-600 cursor-not-allowed opacity-40 border border-noir-700'
                        : isSelected
                        ? 'bg-yellow-500 text-noir-950 shadow-md shadow-yellow-500/30 scale-105'
                        : 'bg-noir-700/80 text-gray-300 hover:bg-noir-600 hover:scale-102 border border-noir-600'
                    }`}
                    title={
                      !isProductAvailable
                        ? 'Indisponible'
                        : variant.available !== true
                        ? 'Indisponible'
                        : variantStock === 0
                        ? 'Sur commande (délai)'
                        : `${getPriceWithPromotion(variant.price).toFixed(2)} €`
                    }
                  >
                    {variant.label} - {getPriceWithPromotion(variant.price).toFixed(2)} €
                  </button>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Espace réservé pour les produits sans variantes (pour garder la même hauteur) */}
        {!hasVariants && (
          <div className="mb-5 min-h-[100px]"></div>
        )}

        <div className="flex items-center justify-between mb-5 pt-2 border-t border-noir-700/50">
          <div>
            <div className="flex flex-col">
              {showPromotion && (
                <p className="text-sm text-gray-400 line-through">
                  {basePrice.toFixed(2)} €
                </p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-yellow-500">
                  {priceWithPromotion.toFixed(2)} €
                </p>
                {showPromotion && promotion?.discountPercentage ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    -{promotion.discountPercentage}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-noir-700/50 rounded-lg p-1">
            <button
              onClick={() => setQuantity(quantity - 1)}
              disabled={quantity <= 1}
              className="px-3 py-1.5 bg-noir-800 rounded-lg text-sm font-semibold hover:bg-noir-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              −
            </button>
            <span className="w-10 text-center font-semibold text-white">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              disabled={!canChangeQuantity || (availableStock > 0 && quantity >= availableStock)}
              className="px-3 py-1.5 bg-noir-800 rounded-lg text-sm font-semibold hover:bg-noir-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              +
            </button>
          </div>
        </div>

        {showAddToCart && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (canAddToCart) {
                handleAddToCartClick()
              }
            }}
            disabled={!canAddToCart}
            className="w-full min-h-[52px] bg-yellow-500 hover:bg-yellow-400 text-noir-950 font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-500 mt-auto flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              {(() => {
                if (!isProductAvailable) return 'Indisponible'
                if (hasVariants && !selectedVariant) return 'Sélectionner une variante'
                if (availableStock === 0) return 'Sur commande (délai)'
                if (availableStock > 0 && availableStock < quantity) return 'Stock insuffisant'
                return 'Ajouter au panier'
              })()}
            </span>
          </button>
        )}
      </div>

      {/* Modal de détails */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        onAddToCart={onAddToCart || handleAddToCartClick}
      />
    </>
  )
}