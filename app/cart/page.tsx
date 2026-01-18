'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Trash2, ArrowLeft, Factory, AlertCircle, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { confirmOrder as confirmOrderAmicale } from '@/lib/amicale-blanc-stock'
import { confirmOrder } from '@/lib/stock-manager'
import { SAVEURS_POPUP_DUO, FORMES_POPUP_DUO, AROMES, COULEURS_FLUO, COULEURS_PASTEL, TAILLES_FLUO, TAILLES_PASTEL } from '@/lib/constants'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { applyGlobalPromotion } from '@/lib/global-promotion-manager'

export default function CartPage() {
   const { cartItems, removeFromCart, total, clearCart, updatePromoItem } = useCart()
  const { promotion, loading: promotionLoading } = useGlobalPromotion()
  const [hasMixedRetrait, setHasMixedRetrait] = useState(false)
  const [produitsAmicaleBlanc, setProduitsAmicaleBlanc] = useState<typeof cartItems>([])
  const [produitsAutres, setProduitsAutres] = useState<typeof cartItems>([])
  const [expandedPromoItems, setExpandedPromoItems] = useState<Set<string>>(new Set())
  
  // Log de débogage pour la promotion
  useEffect(() => {
    console.log('🛒 Panier - Promotion:', {
      promotion,
      loading: promotionLoading,
      active: promotion?.active,
      discountPercentage: promotion?.discountPercentage,
      applyToAll: promotion?.applyToAll,
      allowedCategories: promotion?.allowedCategories,
      allowedGammes: promotion?.allowedGammes
    })
  }, [promotion, promotionLoading])
  
  // Fonction pour obtenir le prix avec promotion pour un item
  const getItemPrice = (item: typeof cartItems[0]) => {
    if (item.isGratuit) return 0
    
    // Si on a une promotion active
    if (promotion && promotion.active) {
      // Si on a le prix original, l'utiliser (meilleur cas)
      const prixBase = item.prixOriginal !== undefined ? item.prixOriginal : item.prix
      
      // Si la promotion s'applique à tout le site, l'appliquer même sans category/gamme
      if (promotion.applyToAll) {
        const prixAvecPromo = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
        console.log('💰 Promotion globale appliquée:', {
          produit: item.produit,
          prixBase,
          prixAvecPromo,
          discountPercentage: promotion.discountPercentage,
          applyToAll: true
        })
        return prixAvecPromo
      }
      
      // Si on a category ou gamme, vérifier l'éligibilité
      if (item.category || item.gamme) {
        const prixAvecPromo = applyGlobalPromotion(prixBase, promotion, item.category, item.gamme)
        console.log('💰 Promotion appliquée:', {
          produit: item.produit,
          prixBase,
          prixAvecPromo,
          category: item.category,
          gamme: item.gamme,
          discountPercentage: promotion.discountPercentage
        })
        return prixAvecPromo
      }
      
      // Si pas de category/gamme et pas applyToAll, pas de promotion
      console.log('💰 Pas de promotion (pas de category/gamme):', {
        produit: item.produit,
        prix: prixBase,
        applyToAll: promotion.applyToAll
      })
    }
    
    // Sinon, utiliser le prix stocké
    return item.prix
  }
  
  // Calculer le total avec promotion
  const totalWithPromotion = cartItems.reduce((sum, item) => {
    if (item.isGratuit) return sum
    return sum + (getItemPrice(item) * item.quantite)
  }, 0)

  // Vérifier si le panier contient un mélange de produits
  useEffect(() => {
    const produitsAvecRetrait = cartItems.filter(item => item.pointRetrait === 'amicale-blanc')
    const produitsSansRetrait = cartItems.filter(item => !item.pointRetrait || item.pointRetrait !== 'amicale-blanc')
    
    const hasAmicaleBlanc = produitsAvecRetrait.length > 0
    const hasAutres = produitsSansRetrait.length > 0
    
    setHasMixedRetrait(hasAmicaleBlanc && hasAutres)
    setProduitsAmicaleBlanc(produitsAvecRetrait)
    setProduitsAutres(produitsSansRetrait)
  }, [cartItems])
  
  // Confirmer la commande
  const handleConfirmOrder = () => {
    // Préparer les items pour la confirmation (amicale-blanc)
    const itemsAmicaleBlanc = cartItems
      .filter(item => item.pointRetrait === 'amicale-blanc' && item.productId)
      .map(item => ({
        productId: item.productId!,
        quantity: item.quantite
      }))
    
    // Préparer les items pour la confirmation (livraison)
    const itemsLivraison = cartItems
      .filter(item => !item.pointRetrait && item.productId)
      .map(item => ({
        productId: item.productId!,
        quantity: item.quantite,
        variantId: item.variantId
      }))
    
    if (itemsAmicaleBlanc.length > 0) {
      // Confirmer la commande et déduire le stock (amicale-blanc)
      confirmOrderAmicale(itemsAmicaleBlanc)
    }
    
    if (itemsLivraison.length > 0) {
      // Confirmer la commande et déduire le stock (livraison)
      confirmOrder(itemsLivraison)
    }
    
    // Afficher un message de confirmation
    alert('Commande passée avec succès ! Le stock a été mis à jour.')
    
    // Vider le panier
    clearCart()
  }


  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>

        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <ShoppingCart className="w-12 h-12 text-yellow-500" />
            Panier
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-24 h-24 text-gray-700 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
            <p className="text-gray-400 mb-8">Découvrez nos produits et commencez à remplir votre panier !</p>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {/* Message d'information si mélange de produits */}
              {hasMixedRetrait && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-500 mb-2">Information importante</h3>
                      <p className="text-gray-300 text-sm mb-3">
                        Certains des produits sélectionnés ne seront pas disponibles à l'amicale des pêcheurs au blanc :
                      </p>
                      <ul className="text-sm text-gray-400 space-y-2">
                        {produitsAutres.map((produit, index) => (
                          <li key={index} className="bg-noir-900/50 rounded-lg p-3 border border-noir-700">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                              <span className="font-semibold text-white">{produit.produit}</span>
                            </div>
                            <div className="ml-4 space-y-0.5 text-xs">
                              {produit.arome && <p>Arôme: {produit.arome}</p>}
                              {produit.diametre && <p>Diamètre: {produit.diametre}</p>}
                              {produit.taille && <p>Taille: {produit.taille}</p>}
                              {produit.conditionnement && <p>Conditionnement: {produit.conditionnement}</p>}
                              {produit.couleur && <p>Couleur: {produit.couleur}</p>}
                              {produit.type && <p>Type: {produit.type}</p>}
                              <p>Quantité: {produit.quantite}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {cartItems.map((item, index) => {
                const isExpanded = expandedPromoItems.has(item.id)
                const isPopupDuo = item.produit === 'Pop-up Duo'
                const isBarPopup = item.produit === 'Pop-up personnalisé'
                
                return (
                  <div
                    key={index}
                    className={`bg-noir-800/50 border rounded-xl p-6 ${
                      item.isGratuit ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-noir-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{item.produit}</h3>
                          {item.isGratuit && (
                            <span className="px-3 py-1 bg-yellow-500 text-noir-950 text-xs font-bold rounded-full">
                              OFFERT
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          {item.diametre && <p>Diamètre: {item.diametre}</p>}
                          {item.taille && <p>Taille: {item.taille}</p>}
                          {item.arome && <p>Arôme: {item.arome}</p>}
                          {item.couleur && <p>Couleur: {item.couleur}</p>}
                          {item.conditionnement && <p>Conditionnement: {item.conditionnement}</p>}
                          <p>Quantité: {item.quantite}</p>
                          {item.isGratuit && (
                            <p className="text-yellow-500 text-xs font-semibold mt-2">
                              ✨ Promotion 4+1 : 1 article offert pour 4 achetés
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          {item.isGratuit ? (
                            <p className="text-2xl font-bold text-yellow-500">
                              GRATUIT
                            </p>
                          ) : (
                            <p className="text-2xl font-bold text-yellow-500">
                              {(getItemPrice(item) * item.quantite).toFixed(2)} €
                            </p>
                          )}
                        </div>
                        {!item.isGratuit && (
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Interface pour choisir l'article offert */}
                    {item.isGratuit && (isPopupDuo || isBarPopup) && (
                      <div className="mt-4 pt-4 border-t border-yellow-500/30">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedPromoItems)
                            if (isExpanded) {
                              newExpanded.delete(item.id)
                            } else {
                              newExpanded.add(item.id)
                            }
                            setExpandedPromoItems(newExpanded)
                          }}
                          className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors mb-3"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="text-sm font-semibold">
                            {isExpanded ? 'Masquer' : 'Choisir les caractéristiques de l\'article offert'}
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="space-y-4 bg-noir-900/50 rounded-lg p-4">
                            {isPopupDuo && (
                              <>
                                <div>
                                  <label className="block text-sm font-semibold mb-2 text-gray-300">Saveur</label>
                                  <select
                                    value={item.arome || ''}
                                    onChange={(e) => updatePromoItem(item.id, { arome: e.target.value })}
                                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-3 py-2 text-white"
                                  >
                                    {SAVEURS_POPUP_DUO.map((saveur) => (
                                      <option key={saveur} value={saveur}>
                                        {saveur}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold mb-2 text-gray-300">Forme</label>
                                  <select
                                    value={item.taille || ''}
                                    onChange={(e) => updatePromoItem(item.id, { taille: e.target.value })}
                                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-3 py-2 text-white"
                                  >
                                    {FORMES_POPUP_DUO.map((forme) => (
                                      <option key={forme} value={forme}>
                                        {forme}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            )}
                            
                            {isBarPopup && (
                              <>
                                <div>
                                  <label className="block text-sm font-semibold mb-2 text-gray-300">Taille</label>
                                  <select
                                    value={item.taille || ''}
                                    onChange={(e) => updatePromoItem(item.id, { taille: e.target.value })}
                                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-3 py-2 text-white"
                                  >
                                    {[...TAILLES_FLUO, ...TAILLES_PASTEL].map((taille) => (
                                      <option key={taille} value={taille}>
                                        {taille}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold mb-2 text-gray-300">Couleur</label>
                                  <select
                                    value={item.couleur || ''}
                                    onChange={(e) => updatePromoItem(item.id, { couleur: e.target.value })}
                                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-3 py-2 text-white"
                                  >
                                    {[...COULEURS_FLUO, ...COULEURS_PASTEL].map((couleur) => (
                                      <option key={couleur.name} value={couleur.name}>
                                        {couleur.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold mb-2 text-gray-300">Arôme</label>
                                  <select
                                    value={item.arome || ''}
                                    onChange={(e) => updatePromoItem(item.id, { arome: e.target.value })}
                                    className="w-full bg-noir-800 border border-noir-700 rounded-lg px-3 py-2 text-white"
                                  >
                                    {AROMES.map((arome) => (
                                      <option key={arome} value={arome}>
                                        {arome}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Résumé</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-400">
                    <span>Sous-total:</span>
                    <span className="text-white">{totalWithPromotion.toFixed(2)} €</span>
                  </div>
                  {cartItems.some(item => item.isGratuit) && (
                    <div className="flex justify-between text-yellow-500">
                      <span>Articles offerts (4+1):</span>
                      <span className="font-semibold">
                        {cartItems
                          .filter(item => item.isGratuit)
                          .reduce((sum, item) => sum + item.quantite, 0)} article(s)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Livraison:</span>
                    <span className="text-white">Calculé à l'étape suivante</span>
                  </div>
                  <div className="border-t border-noir-700 pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-yellow-500">{totalWithPromotion.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="btn btn-primary btn-lg w-full flex items-center justify-center"
                >
                  Passer la commande
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
