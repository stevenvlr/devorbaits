'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCart } from '@/contexts/CartContext'
import { getProductsByCategory, onProductsUpdate, type Product, type ProductVariant } from '@/lib/products-manager'
import { onStockUpdate } from '@/lib/stock-manager'
import ProductCard from '@/components/ProductCard'

// Produits par défaut (pour compatibilité avec l'ancien système)
const PRODUITS_HUILES_DEFAUT = [
  { name: 'Liquide de krill', gamme: 'Krill Calamar', prix: 11.99, format: '500 ml' },
  { name: 'Huile de poisson sauvage', gamme: 'Krill Calamar', prix: 11.99, format: '500 ml' },
  { name: 'Liqueur de maïs', gamme: 'Méga Tutti', prix: 9.99, format: '500 ml' },
  { name: 'Huile de chènevis', gamme: 'Méga Tutti', prix: 11.99, format: '500 ml' },
  { name: 'Huile de red devil', gamme: 'Red Devil', prix: 10.99, format: '500 ml' },
  { name: 'Liquide de vers de vase', gamme: 'Robin Red Vers de vase', prix: 11.99, format: '500 ml' },
  { name: 'Liquide de robin red', gamme: 'Robin Red Vers de vase', prix: 10.99, format: '500 ml' },
]

export default function HuilesPage() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [, forceUpdate] = useState(0)

  // Charger les produits depuis le système centralisé
  const loadProductsData = useCallback(async () => {
    // Charger TOUS les produits (disponibles et indisponibles)
    const huilesProducts = await getProductsByCategory('huiles', true)
    
    // Si aucun produit, utiliser les produits par défaut
    if (huilesProducts.length === 0) {
      const defaultProducts: Product[] = PRODUITS_HUILES_DEFAUT.map((p, index) => ({
        id: `default-huile-${index}`,
        name: p.name,
        category: 'huiles',
        price: p.prix,
        gamme: p.gamme,
        format: p.format,
        available: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }))
      setProducts(defaultProducts)
    } else {
      setProducts(huilesProducts)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadProductsData()
    }
    init()
    const unsubscribeProducts = onProductsUpdate(() => {
      loadProductsData()
    })
    const unsubscribeStock = onStockUpdate(() => {
      forceUpdate(prev => prev + 1)
    })
    return () => {
      unsubscribeProducts()
      unsubscribeStock()
    }
  }, [loadProductsData])

  const handleAddToCart = useCallback((product: Product, variant?: ProductVariant, quantity: number = 1) => {
    // Vérifier que le produit est disponible
    if (product.available !== true) {
      alert('Ce produit n\'est pas disponible pour le moment.')
      return
    }
    
    // Si le produit a des variantes, une variante doit être sélectionnée
    if (product.variants && product.variants.length > 0) {
      if (!variant) {
        alert('Veuillez sélectionner une variante')
        return
      }
      
      // Vérifier que la variante est disponible
      if (!variant.available) {
        alert('Cette variante n\'est pas disponible pour le moment.')
        return
      }
      
      // Ajouter au panier avec la variante
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
    
    // Produit sans variantes
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
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4">Huiles et liquides</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Huiles, liqueurs et liquides d'attraction de qualité supérieure pour renforcer l'efficacité de vos appâts.
          </p>
        </div>

        {/* Liste des produits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
    </div>
  )
}