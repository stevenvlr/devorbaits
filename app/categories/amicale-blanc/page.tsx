'use client'

import { useState, useEffect } from 'react'
import { Package, ShoppingCart, MapPin } from 'lucide-react'
import { TOUTES_LES_BOUILLETTES, PRODUITS_DISPONIBLES_AMICALE_BLANC_DEFAULT, type ProduitDisponible } from '@/lib/amicale-blanc-config'
import { useCart } from '@/contexts/CartContext'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { getBouilletteId, getPrixPersonnalise } from '@/lib/price-utils'
import { getAvailableStockSync, onStockUpdate } from '@/lib/amicale-blanc-stock'
import AmicaleBlancProductModal from '@/components/AmicaleBlancProductModal'

export default function AmicaleBlancPage() {
  const { addToCart } = useCart()
  const [produitsDisponibles, setProduitsDisponibles] = useState<string[]>([])
  const prixPersonnalises = usePrixPersonnalises()
  const { promotion } = useGlobalPromotion()
  const [, forceUpdate] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<ProduitDisponible | null>(null)

  // Charger les produits disponibles depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('amicale-blanc-produits')
    if (saved) {
      setProduitsDisponibles(JSON.parse(saved))
    } else {
      setProduitsDisponibles(PRODUITS_DISPONIBLES_AMICALE_BLANC_DEFAULT)
    }
    
    // Écouter les mises à jour du stock
    const unsubscribe = onStockUpdate(() => {
      forceUpdate(prev => prev + 1)
    })
    
    return unsubscribe
  }, [])

  // Filtrer les bouillettes disponibles (uniquement celles avec diamètre, conditionnement et gamme)
  const bouillettesDisponibles = TOUTES_LES_BOUILLETTES.filter(bouillette =>
    produitsDisponibles.includes(bouillette.id) &&
    bouillette.diametre &&
    bouillette.conditionnement &&
    bouillette.gamme
  )

  // Calcul du prix selon le diamètre et le conditionnement
  const getPrice = (diametre: string | undefined, conditionnement: string | undefined, gamme: string | undefined) => {
    if (!diametre || !conditionnement || !gamme) return 0
    
    const productId = getBouilletteId(gamme, diametre, conditionnement)
    const is10mm = diametre === '10'
    const isRobinRed = gamme === 'Robin Red Vers de vase'
    const isMureCassis = gamme === 'Mure Cassis'
    let basePrice = 0
    
    if (conditionnement === '1kg') {
      basePrice = is10mm ? 11.99 : 9.99
    } else if (conditionnement === '2.5kg') {
      basePrice = is10mm ? 28.99 : 23.99
    } else if (conditionnement === '5kg') {
      basePrice = is10mm ? 56.99 : 46.99
    } else if (conditionnement === '10kg') {
      basePrice = is10mm ? 109.99 : 89.99
    } else {
      basePrice = 9.99
    }
    
    const defaultPrice = (isRobinRed || isMureCassis) ? basePrice + 2 : basePrice
    return getPrixPersonnalise(prixPersonnalises, productId, defaultPrice, promotion, 'bouillettes', gamme)
  }

  const handleAddToCart = (bouillette: typeof TOUTES_LES_BOUILLETTES[0]) => {
    if (!bouillette.diametre || !bouillette.conditionnement || !bouillette.gamme) {
      alert('Informations du produit incomplètes')
      return
    }
    
    // Vérifier le stock disponible
    const productId = getBouilletteId(bouillette.gamme, bouillette.diametre, bouillette.conditionnement)
    const availableStock = getAvailableStockSync(productId)
    
    if (availableStock < 1) {
      alert(`Stock insuffisant pour ${bouillette.nom}. Stock disponible : ${availableStock}`)
      return
    }
    
    // Calculer le prix original (sans promotion) pour pouvoir le recalculer si promotion activée après
    const is10mm = bouillette.diametre === '10'
    const isRobinRed = bouillette.gamme === 'Robin Red Vers de vase'
    const isMureCassis = bouillette.gamme === 'Mure Cassis'
    let prixOriginal = 0
    
    if (bouillette.conditionnement === '1kg') {
      prixOriginal = is10mm ? 11.99 : 9.99
    } else if (bouillette.conditionnement === '2.5kg') {
      prixOriginal = is10mm ? 28.99 : 23.99
    } else if (bouillette.conditionnement === '5kg') {
      prixOriginal = is10mm ? 56.99 : 46.99
    } else if (bouillette.conditionnement === '10kg') {
      prixOriginal = is10mm ? 109.99 : 89.99
    } else {
      prixOriginal = 9.99
    }
    
    if (isRobinRed || isMureCassis) {
      prixOriginal += 2
    }
    
    const prixAvecPromotion = getPrice(bouillette.diametre, bouillette.conditionnement, bouillette.gamme)
    
    addToCart({
      produit: bouillette.nom,
      arome: bouillette.gamme,
      taille: `${bouillette.diametre}mm`,
      conditionnement: bouillette.conditionnement,
      quantite: 1,
      prix: prixAvecPromotion,
      prixOriginal: prixOriginal,
      category: 'bouillettes',
      gamme: bouillette.gamme,
      pointRetrait: 'amicale-blanc',
      productId: productId
    })
    alert(`${bouillette.nom} ajouté au panier pour retrait à L'amicale des pêcheurs au blanc !`)
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <MapPin className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">POINT DE RETRAIT</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">L'amicale des pêcheurs au blanc</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
            Commandez vos bouillettes en ligne et récupérez-les directement à l'étang
          </p>
          <p className="text-gray-500 text-sm">
            Produits disponibles au retrait sur place
          </p>
        </div>

        {/* Liste des bouillettes disponibles */}
        {bouillettesDisponibles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bouillettesDisponibles.map((bouillette) => (
              <div
                key={bouillette.id}
                className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all group"
              >
                <div 
                  className="aspect-square bg-noir-700 rounded-lg mb-4 flex items-center justify-center cursor-pointer hover:bg-noir-600 transition-colors"
                  onClick={() => setSelectedProduct(bouillette)}
                >
                  <Package className="w-16 h-16 text-gray-500 group-hover:text-yellow-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-2">{bouillette.nom}</h3>
                <div className="space-y-1 mb-4">
                  {bouillette.gamme && <p className="text-gray-400 text-sm">Gamme d'appât: {bouillette.gamme}</p>}
                  {bouillette.diametre && <p className="text-gray-400 text-sm">Diamètre: {bouillette.diametre}mm</p>}
                  {bouillette.conditionnement && <p className="text-gray-400 text-sm">Conditionnement: {bouillette.conditionnement}</p>}
                </div>
                {bouillette.diametre && bouillette.conditionnement && bouillette.gamme && (
                  <div className="mb-4">
                    <p className="text-yellow-500 font-semibold text-lg mb-4">
                      {getPrice(bouillette.diametre, bouillette.conditionnement, bouillette.gamme).toFixed(2)} €
                    </p>
                  </div>
                )}
                <button
                  onClick={() => handleAddToCart(bouillette)}
                  disabled={(() => {
                    if (!bouillette.diametre || !bouillette.conditionnement || !bouillette.gamme) return true
                    const productId = getBouilletteId(bouillette.gamme, bouillette.diametre, bouillette.conditionnement)
                    return getAvailableStockSync(productId) < 1
                  })()}
                  className="btn btn-primary btn-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {(() => {
                    if (!bouillette.diametre || !bouillette.conditionnement || !bouillette.gamme) return 'Indisponible'
                    const productId = getBouilletteId(bouillette.gamme, bouillette.diametre, bouillette.conditionnement)
                    return getAvailableStockSync(productId) < 1 ? 'Stock épuisé' : 'Ajouter au panier'
                  })()}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">Aucun produit disponible pour le moment</p>
            <p className="text-gray-500 text-sm">Les produits seront ajoutés prochainement</p>
          </div>
        )}

        {/* Modal de détails produit */}
        <AmicaleBlancProductModal
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  )
}

