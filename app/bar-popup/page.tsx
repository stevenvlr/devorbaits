'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Factory, Palette } from 'lucide-react'
import Image from 'next/image'
import {
  loadBarPopupAromes, onBarPopupAromesUpdate,
  loadBarPopupCouleursFluo, onBarPopupCouleursFluoUpdate,
  loadBarPopupCouleursPastel, onBarPopupCouleursPastelUpdate,
  loadBarPopupTaillesFluo, onBarPopupTaillesFluoUpdate,
  loadBarPopupTaillesPastel, onBarPopupTaillesPastelUpdate,
  type Couleur
} from '@/lib/popup-variables-manager'
// Note: Les constantes COULEURS_FLUO, COULEURS_PASTEL, AROMES ne sont plus utilisées directement
import { useCart } from '@/contexts/CartContext'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { getBarPopupId, getPrixPersonnalise } from '@/lib/price-utils'
import PromoItemModal, { PromoCharacteristics } from '@/components/PromoItemModal'
import { getProductsByCategory, type Product, type ProductVariant } from '@/lib/products-manager'
import { getAvailableStock } from '@/lib/stock-manager'

export default function BarPopupPage() {
  const [aromes, setAromes] = useState<string[]>([])
  const [couleursFluo, setCouleursFluo] = useState<Couleur[]>([])
  const [couleursPastel, setCouleursPastel] = useState<Couleur[]>([])
  const [taillesFluo, setTaillesFluo] = useState<string[]>([])
  const [taillesPastel, setTaillesPastel] = useState<string[]>([])
  const [selectedCouleur, setSelectedCouleur] = useState<Couleur | null>(null)
  const [selectedTaille, setSelectedTaille] = useState('')
  const [selectedArome, setSelectedArome] = useState('')
  const [quantity, setQuantity] = useState(1)
  const { addToCart, cartItems, shouldShowPromoModal, addPromoItem } = useCart()
  const prixPersonnalises = usePrixPersonnalises()
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [barPopupProduct, setBarPopupProduct] = useState<Product | null>(null)
  const [barPopupVariant, setBarPopupVariant] = useState<ProductVariant | null>(null)

  // Charger les variables depuis le gestionnaire
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Chargement des variables Bar à Pop-up...')
        const [loadedAromes, loadedCouleursFluo, loadedCouleursPastel, loadedTaillesFluo, loadedTaillesPastel] = await Promise.all([
          loadBarPopupAromes(),
          loadBarPopupCouleursFluo(),
          loadBarPopupCouleursPastel(),
          loadBarPopupTaillesFluo(),
          loadBarPopupTaillesPastel()
        ])
        
        // S'assurer que toutes les valeurs sont des tableaux
        const aromesArray = Array.isArray(loadedAromes) ? loadedAromes : []
        const couleursFluoArray = Array.isArray(loadedCouleursFluo) ? loadedCouleursFluo : []
        const couleursPastelArray = Array.isArray(loadedCouleursPastel) ? loadedCouleursPastel : []
        const taillesFluoArray = Array.isArray(loadedTaillesFluo) ? loadedTaillesFluo : []
        const taillesPastelArray = Array.isArray(loadedTaillesPastel) ? loadedTaillesPastel : []
        
        console.log(`✅ Arômes chargés: ${aromesArray.length}`, aromesArray)
        console.log(`✅ Couleurs fluo chargées: ${couleursFluoArray.length}`, couleursFluoArray)
        console.log(`✅ Couleurs pastel chargées: ${couleursPastelArray.length}`, couleursPastelArray)
        console.log(`✅ Tailles fluo chargées: ${taillesFluoArray.length}`, taillesFluoArray)
        console.log(`✅ Tailles pastel chargées: ${taillesPastelArray.length}`, taillesPastelArray)
        
        setAromes(aromesArray)
        setCouleursFluo(couleursFluoArray)
        setCouleursPastel(couleursPastelArray)
        setTaillesFluo(taillesFluoArray)
        setTaillesPastel(taillesPastelArray)
        
        if (couleursFluoArray.length > 0 && !selectedCouleur) {
          setSelectedCouleur(couleursFluoArray[0])
        }
        if (aromesArray.length > 0 && !selectedArome) {
          setSelectedArome(aromesArray[0])
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des variables Bar à Pop-up:', error)
        setAromes([])
        setCouleursFluo([])
        setCouleursPastel([])
        setTaillesFluo([])
        setTaillesPastel([])
      }
    }
    
    loadData()
    const unsubscribes = [
      onBarPopupAromesUpdate(loadData),
      onBarPopupCouleursFluoUpdate(loadData),
      onBarPopupCouleursPastelUpdate(loadData),
      onBarPopupTaillesFluoUpdate(loadData),
      onBarPopupTaillesPastelUpdate(loadData)
    ]
    
    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [])

  // Charger le produit Bar à pop-up correspondant aux sélections
  useEffect(() => {
    if (!selectedCouleur || !selectedTaille || !selectedArome) {
      setBarPopupProduct(null)
      setBarPopupVariant(null)
      return
    }
    
    const loadProduct = async () => {
      const { getProductsByCategory } = await import('@/lib/products-manager')
      const barPopupProducts = await getProductsByCategory('bar à pop-up', true)
      const productName = `Bar à Pop-up ${selectedCouleur.name}`
      const product = barPopupProducts.find(p => 
        p.name.toLowerCase() === productName.toLowerCase()
      )
      
      if (product) {
        setBarPopupProduct(product)
        // Trouver la variante correspondant à la taille et l'arôme
        if (product.variants) {
          const variant = product.variants.find(v => 
            v.taille === selectedTaille && 
            (v.arome === selectedArome || v.couleur === selectedCouleur.name)
          )
          setBarPopupVariant(variant || null)
        } else {
          setBarPopupVariant(null)
        }
      } else {
        setBarPopupProduct(null)
        setBarPopupVariant(null)
      }
    }
    
    loadProduct()
  }, [selectedCouleur, selectedTaille, selectedArome])
  
  // Déterminer les tailles disponibles selon la couleur sélectionnée
  const availableTailles = Array.isArray(selectedCouleur?.type === 'fluo' ? taillesFluo : taillesPastel) 
    ? (selectedCouleur?.type === 'fluo' ? taillesFluo : taillesPastel)
    : []
  const allCouleurs = [
    ...(Array.isArray(couleursFluo) ? couleursFluo : []),
    ...(Array.isArray(couleursPastel) ? couleursPastel : [])
  ]

  // Réinitialiser la taille si elle n'est plus disponible après changement de couleur
  useEffect(() => {
    if (selectedCouleur && availableTailles.length > 0 && !availableTailles.includes(selectedTaille)) {
      setSelectedTaille(availableTailles[0])
    } else if (availableTailles.length > 0 && !selectedTaille) {
      setSelectedTaille(availableTailles[0])
    }
  }, [selectedCouleur, availableTailles, selectedTaille])

  // Surveiller les changements du panier pour ouvrir le modal automatiquement
  useEffect(() => {
    // Calculer directement si on doit ouvrir le modal
    const eligibleItems = cartItems.filter(item => !item.isGratuit && item.produit === 'Pop-up personnalisé')
    const total = eligibleItems.reduce((sum, item) => sum + item.quantite, 0)
    const neededGratuits = Math.floor(total / 4)
    const existingGratuits = cartItems.filter(item => item.isGratuit && item.produit === 'Pop-up personnalisé').length
    
    // Afficher le modal si on a 4 articles ou plus et qu'il manque des articles gratuits
    // ET que le modal n'est pas déjà ouvert
    if (total >= 4 && neededGratuits > existingGratuits && !showPromoModal) {
      setShowPromoModal(true)
    }
  }, [cartItems, showPromoModal])

  // Calcul du prix
  const getPrice = () => {
    if (!selectedCouleur || !selectedTaille || !selectedArome) return 6.99
    const productId = getBarPopupId(selectedCouleur.name, selectedTaille, selectedArome)
    return getPrixPersonnalise(prixPersonnalises, productId, 6.99)
  }

  const handleAddToCart = async () => {
    if (!selectedCouleur || !selectedTaille || !selectedArome) return
    
    // Vérifier que le produit et la variante sont disponibles
    if (!barPopupProduct) {
      alert(`❌ Produit "Bar à Pop-up ${selectedCouleur.name}" non trouvé.`)
      return
    }
    
    if (!barPopupVariant) {
      alert(`❌ Variante non trouvée pour "Bar à Pop-up ${selectedCouleur.name}" (${selectedTaille}, ${selectedArome}).`)
      return
    }
    
    const availableStock = await getAvailableStock(barPopupProduct.id, barPopupVariant.id)
    
    // Vérifier le stock si défini
    if (availableStock >= 0) {
      if (availableStock > 0 && availableStock < quantity) {
        alert(`Stock insuffisant. Stock disponible : ${availableStock}`)
        return
      }
    }
    
    await addToCart({
      produit: barPopupProduct.name,
      taille: selectedTaille,
      couleur: selectedCouleur?.name || '',
      arome: selectedArome,
      quantite: quantity,
      prix: barPopupVariant.price || getPrice(),
      productId: barPopupProduct.id,
      variantId: barPopupVariant.id
    })
    
    // Le modal s'ouvrira automatiquement via le useEffect si nécessaire
    // On affiche un message seulement si le modal ne va pas s'ouvrir
    setTimeout(() => {
      if (!shouldShowPromoModal('Pop-up personnalisé')) {
        alert('Pop-up personnalisé ajouté au panier !')
      }
    }, 100)
  }

  const handlePromoConfirm = (characteristics: PromoCharacteristics) => {
    addPromoItem('Pop-up personnalisé', characteristics)
    setShowPromoModal(false)
    alert('Article offert ajouté au panier avec vos choix !')
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
            <Palette className="w-12 h-12 text-yellow-500" />
            Bar à Pop-up
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
            Personnalisez votre pop-up selon vos préférences : taille, couleur et arôme sur mesure.
          </p>
          {/* Message de promotion */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 rounded-xl p-4 max-w-2xl mx-auto shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">🎁</span>
              <h3 className="text-xl font-bold text-yellow-500">PROMOTION 4+1</h3>
            </div>
            <p className="text-base text-white font-semibold text-center">
              Pour chaque lot de <span className="text-yellow-400">4 Pop-up personnalisés</span> achetés, recevez <span className="text-yellow-400">1 article offert</span> de votre choix !
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Configuration Panel */}
          <div className="space-y-8">
            {/* Couleur */}
            <div>
              <label className="block text-lg font-semibold mb-4">Couleur</label>
              
              {/* Couleurs fluo */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Couleurs fluo (10mm, 12mm, Dumbells 12/15, 15mm, 20mm)</p>
                <div className="grid grid-cols-5 gap-3">
                  {(Array.isArray(couleursFluo) ? couleursFluo : []).map((couleur) => {
                    // Retirer " fluo" du nom pour l'affichage
                    const nomCouleur = couleur.name.replace(' fluo', '')
                    return (
                      <button
                        key={couleur.name}
                        onClick={() => setSelectedCouleur(couleur)}
                        className={`p-4 rounded-lg border-2 transition-all relative ${
                          selectedCouleur && selectedCouleur.name === couleur.name
                            ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                            : 'border-noir-700 hover:border-noir-600'
                        }`}
                        style={{ backgroundColor: couleur.value }}
                        title={couleur.name}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-noir-950">
                            {nomCouleur}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Couleurs pastel */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Couleurs pastel (12mm, 15mm)</p>
                <div className="grid grid-cols-3 gap-3">
                  {(Array.isArray(couleursPastel) ? couleursPastel : []).map((couleur) => {
                    // Retirer "pastel" du nom pour l'affichage
                    const nomCouleur = couleur.name.replace(' pastel', '')
                    return (
                      <button
                        key={couleur.name}
                        onClick={() => setSelectedCouleur(couleur)}
                        className={`p-4 rounded-lg border-2 transition-all relative ${
                          selectedCouleur && selectedCouleur.name === couleur.name
                            ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                            : 'border-noir-700 hover:border-noir-600'
                        }`}
                        style={{ backgroundColor: couleur.value || '#FFFFFF' }}
                        title={couleur.name}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-noir-950">
                            {nomCouleur}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mt-4">Couleur sélectionnée : <span className="text-white font-semibold">{selectedCouleur?.name || 'Aucune'}</span></p>
            </div>

            {/* Taille */}
            <div>
              <label className="block text-lg font-semibold mb-4">Taille du Pop-up</label>
              <div className="grid grid-cols-5 gap-3">
                {(Array.isArray(availableTailles) ? availableTailles : []).map((taille) => (
                  <button
                    key={taille}
                    onClick={() => setSelectedTaille(taille)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTaille === taille
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="text-sm font-bold">{taille}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tailles disponibles pour {selectedCouleur?.type === 'fluo' ? 'les couleurs fluo' : 'les couleurs pastel'}
              </p>
            </div>

            {/* Arôme */}
            <div>
              <label className="block text-lg font-semibold mb-4">Arôme</label>
              <div className="grid grid-cols-2 gap-3">
                {(Array.isArray(aromes) ? aromes : []).map((arome) => (
                  <button
                    key={arome}
                    onClick={() => setSelectedArome(arome)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedArome === arome
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    {arome}
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
                <div className="flex items-center justify-center h-64 bg-noir-900 rounded-lg border border-noir-700">
                  <div
                    className="w-24 h-24 rounded-full shadow-lg"
                    style={{ backgroundColor: selectedCouleur?.value || '#FFFFFF' }}
                  >
                    {/* Simulation d'un pop-up */}
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>Taille:</span>
                  <span className="text-white">{selectedTaille}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Couleur:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedCouleur?.value || '#FFFFFF' }}
                    ></div>
                    <span className="text-white">{selectedCouleur?.name || 'Aucune'}</span>
                  </div>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Arôme:</span>
                  <span className="text-white">{selectedArome}</span>
                </div>
              
                <div className="flex justify-between text-gray-400">
                  <span>Quantité:</span>
                  <span className="text-white">{quantity}</span>
                </div>
                <div className="border-t border-noir-700 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-yellow-500">{(getPrice() * quantity).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn btn-primary btn-lg w-full"
              >
                <ShoppingCart className="w-5 h-5" />
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour choisir l'article offert */}
      <PromoItemModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        onConfirm={handlePromoConfirm}
        productType="Pop-up personnalisé"
        defaultCharacteristics={{
          arome: selectedArome,
          taille: selectedTaille,
          couleur: selectedCouleur?.name || ''
        }}
      />
    </div>
  )
}