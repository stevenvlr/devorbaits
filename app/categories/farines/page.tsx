'use client'

import { useState, useEffect, useCallback } from 'react'
import { Factory } from 'lucide-react'
import { getProductsByCategory, onProductsUpdate, type Product, type ProductVariant } from '@/lib/products-manager'
import ProductCard from '@/components/ProductCard'
import { useCart } from '@/contexts/CartContext'

export default function FarinesPage() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])

  // Charger les produits depuis l'admin
  const loadProducts = useCallback(async () => {
    const farinesProducts = await getProductsByCategory('farines', false) // Seulement disponibles
    setProducts(farinesProducts)
  }, [])

  useEffect(() => {
    void loadProducts()
    const unsubscribe = onProductsUpdate(() => {
      void loadProducts()
    })
    return unsubscribe
  }, [loadProducts])

  const handleAddToCart = useCallback((product: Product, variant?: ProductVariant, quantity: number = 1) => {
    if (product.available !== true) {
      alert('Ce produit n\'est pas disponible pour le moment.')
      return
    }
    
    if (product.variants && product.variants.length > 0) {
      if (!variant) {
        alert('Veuillez sélectionner une variante')
        return
      }
      
      if (!variant.available) {
        alert('Cette variante n\'est pas disponible pour le moment.')
        return
      }
      
      addToCart({
        produit: product.name,
        arome: product.gamme || '',
        quantite: quantity,
        prix: variant.price,
        productId: product.id,
        variantId: variant.id
      })
      return
    }
    
    addToCart({
      produit: product.name,
      arome: product.gamme || '',
      quantite: quantity,
      prix: product.price,
      productId: product.id
    })
  }, [addToCart])

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Farines</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Farines de base de qualité pour préparer vos propres appâts.
          </p>
        </div>

        {/* Produits ajoutés dans l'admin */}
        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Aucun produit disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}