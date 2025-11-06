'use client'

import Link from 'next/link'
import { ShoppingCart, Trash2, ArrowLeft, Factory } from 'lucide-react'

export default function CartPage() {
  // TODO: Connecter au contexte du panier
  const cartItems: any[] = []

  const total = cartItems.reduce((sum, item) => sum + (item.prix * item.quantite), 0)

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
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{item.produit}</h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      {item.diametre && <p>Diamètre: {item.diametre}</p>}
                      {item.taille && <p>Taille: {item.taille}</p>}
                      {item.arome && <p>Arôme: {item.arome}</p>}
                      {item.couleur && <p>Couleur: {item.couleur}</p>}
                      {item.conditionnement && <p>Conditionnement: {item.conditionnement}</p>}
                      <p>Quantité: {item.quantite}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-500">
                        {(item.prix * item.quantite).toFixed(2)} €
                      </p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Résumé</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-400">
                    <span>Sous-total:</span>
                    <span className="text-white">{total.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Livraison:</span>
                    <span className="text-white">Calculé à l'étape suivante</span>
                  </div>
                  <div className="border-t border-noir-700 pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-yellow-500">{total.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-yellow-500 text-noir-950 font-bold py-4 rounded-lg hover:bg-yellow-400 transition-colors">
                  Passer la commande
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
