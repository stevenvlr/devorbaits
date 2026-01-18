'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Factory, Package } from 'lucide-react'
import { encodeGamme } from '@/lib/constants'
import { getProductsByCategorySync, onProductsUpdate, type Product, type ProductVariant } from '@/lib/products-manager'
import { loadGammes, onGammesUpdate, loadGammesImages, onGammesImagesUpdate } from '@/lib/gammes-manager'
import ProductCard from '@/components/ProductCard'
import { useCart } from '@/contexts/CartContext'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { applyGlobalPromotion } from '@/lib/global-promotion-manager'

export default function BouillettesPage() {
  const router = useRouter()
  const { addToCart } = useCart()
  const { promotion } = useGlobalPromotion()
  const [products, setProducts] = useState<Product[]>([])
  const [gammes, setGammes] = useState<string[]>([])
  const [gammeImages, setGammeImages] = useState<Record<string, string>>({})

  // Charger les produits depuis l'admin
  const loadProducts = useCallback(() => {
    const bouillettesProducts = getProductsByCategorySync('bouillettes', false) // Seulement disponibles
    setProducts(bouillettesProducts)
  }, [])

  useEffect(() => {
    loadProducts()
    // Charger les gammes de manière asynchrone
    loadGammes().then(gammesData => {
      setGammes(Array.isArray(gammesData) ? gammesData : [])
    }).catch(err => {
      console.error('Erreur lors du chargement des gammes:', err)
      setGammes([])
    })

    // Charger les images de gammes (global)
    loadGammesImages()
      .then((images) => setGammeImages(images))
      .catch((err) => {
        console.error('Erreur lors du chargement des images de gammes:', err)
        setGammeImages({})
      })
    
    const unsubscribeProducts = onProductsUpdate(loadProducts)
    const unsubscribeGammes = onGammesUpdate(async () => {
      const gammesData = await loadGammes()
      setGammes(Array.isArray(gammesData) ? gammesData : [])
    })
    const unsubscribeGammesImages = onGammesImagesUpdate(async () => {
      const images = await loadGammesImages()
      setGammeImages(images)
    })
    
    return () => {
      unsubscribeProducts()
      unsubscribeGammes()
      unsubscribeGammesImages()
    }
  }, [loadProducts])

  const handleGammeSelect = (gamme: string) => {
    const encodedGamme = encodeGamme(gamme)
    router.push(`/gammes/${encodedGamme}`)
  }

  const handleAddToCart = useCallback(async (product: Product, variant?: ProductVariant, quantity: number = 1) => {
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
      
      const prixOriginal = variant.price
      const prixAvecPromotion = applyGlobalPromotion(prixOriginal, promotion, product.category, product.gamme)
      
      await addToCart({
        produit: product.name,
        arome: product.gamme || '',
        quantite: quantity,
        prix: prixAvecPromotion,
        prixOriginal: prixOriginal,
        category: product.category,
        gamme: product.gamme,
        productId: product.id,
        variantId: variant.id,
        // Inclure les propriétés de la variante pour le calcul du poids
        conditionnement: variant.conditionnement,
        diametre: variant.diametre,
        taille: variant.taille,
        couleur: variant.couleur
      })
      return
    }
    
    const prixOriginal = product.price
    const prixAvecPromotion = applyGlobalPromotion(prixOriginal, promotion, product.category, product.gamme)
    
    await addToCart({
      produit: product.name,
      arome: product.gamme || '',
      quantite: quantity,
      prix: prixAvecPromotion,
      prixOriginal: prixOriginal,
      category: product.category,
      gamme: product.gamme,
      productId: product.id
    })
  }, [addToCart])

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Gammes</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Bouillettes, équilibrées, boosters, huiles, farines... Tous nos produits organisés par gamme.
          </p>
        </div>

        {/* Sélection de la gamme avec cartes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-8 text-center">
            Choisissez votre gamme
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Array.isArray(gammes) ? gammes : []).map((gamme) => {
              const gammeImage = gammeImages[gamme]
              return (
                <button
                  key={gamme}
                  onClick={() => handleGammeSelect(gamme)}
                  className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all group text-left"
                >
                  {/* Image de la gamme */}
                  <div className="aspect-square bg-noir-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                    {gammeImage ? (
                      <Image
                        src={gammeImage}
                        alt={gamme}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        quality={85}
                      />
                    ) : (
                      <Package className="w-16 h-16 text-gray-500 group-hover:text-yellow-500 transition-colors" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg group-hover:text-yellow-500 transition-colors">
                    {gamme}
                  </h3>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}