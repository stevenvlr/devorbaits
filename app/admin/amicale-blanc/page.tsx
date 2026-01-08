'use client'

import { useState, useEffect } from 'react'
import { Save, MapPin, CheckCircle2, XCircle, Search, Package } from 'lucide-react'
import { TOUS_LES_PRODUITS, PRODUITS_DISPONIBLES_AMICALE_BLANC_DEFAULT } from '@/lib/amicale-blanc-config'
import { matchesSearch } from '@/lib/search-utils'
import { loadStock, updateStock, onStockUpdate } from '@/lib/amicale-blanc-stock'

export default function AmicaleBlancAdminPage() {
  const [produitsDisponibles, setProduitsDisponibles] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stocks, setStocks] = useState<Record<string, number>>({})
  
  // Charger depuis localStorage au démarrage
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('amicale-blanc-produits')
      if (saved) {
        setProduitsDisponibles(JSON.parse(saved))
      } else {
        setProduitsDisponibles(PRODUITS_DISPONIBLES_AMICALE_BLANC_DEFAULT)
      }

      // Charger les stocks depuis Supabase
      const allStock = await loadStock()
      const stockMap: Record<string, number> = {}
      Object.values(allStock).forEach((item: any) => {
        stockMap[item.productId] = item.stock
      })
      setStocks(stockMap)
    }

    const refresh = async () => {
      const updatedStock = await loadStock()
      const updatedMap: Record<string, number> = {}
      Object.values(updatedStock).forEach((item: any) => {
        updatedMap[item.productId] = item.stock
      })
      setStocks(updatedMap)
    }

    void init()

    // Écouter les mises à jour du stock
    const unsubscribe = onStockUpdate(() => {
      void refresh()
    })

    return unsubscribe
  }, [])

  // Sauvegarder dans localStorage
  const handleSave = () => {
    localStorage.setItem('amicale-blanc-produits', JSON.stringify(produitsDisponibles))
    alert('Configuration sauvegardée avec succès !')
  }
  
  // Mettre à jour le stock d'un produit
  const handleStockChange = (productId: string, newStock: number) => {
    void updateStock(productId, newStock)
    setStocks(prev => ({ ...prev, [productId]: newStock }))
  }

  const toggleProduit = (produitId: string) => {
    setProduitsDisponibles(prev =>
      prev.includes(produitId)
        ? prev.filter(id => id !== produitId)
        : [...prev, produitId]
    )
  }

  // Filtrer les produits selon la recherche (insensible aux accents et traits d'union)
  const produitsFiltres = TOUS_LES_PRODUITS.filter(produit => {
    return (
      matchesSearch(produit.nom, searchTerm) ||
      matchesSearch(produit.categorie, searchTerm) ||
      (produit.gamme && matchesSearch(produit.gamme, searchTerm)) ||
      (produit.diametre && matchesSearch(produit.diametre, searchTerm)) ||
      (produit.conditionnement && matchesSearch(produit.conditionnement, searchTerm)) ||
      (produit.taille && matchesSearch(produit.taille, searchTerm)) ||
      (produit.saveur && matchesSearch(produit.saveur, searchTerm)) ||
      (produit.forme && matchesSearch(produit.forme, searchTerm)) ||
      (produit.couleur && matchesSearch(produit.couleur, searchTerm)) ||
      (produit.arome && matchesSearch(produit.arome, searchTerm))
    )
  })


  // Grouper par catégorie puis par gamme
  const produitsParCategorie = produitsFiltres.reduce((acc, produit) => {
    if (!acc[produit.categorie]) {
      acc[produit.categorie] = {}
    }
    const gammeKey = produit.gamme || 'Sans gamme'
    if (!acc[produit.categorie][gammeKey]) {
      acc[produit.categorie][gammeKey] = []
    }
    acc[produit.categorie][gammeKey].push(produit)
    return acc
  }, {} as Record<string, Record<string, typeof TOUS_LES_PRODUITS>>)

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <MapPin className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">GESTION POINT DE RETRAIT</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">L'amicale des pêcheurs au blanc</h1>
          <p className="text-gray-400">Gérez tous les produits disponibles au retrait</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-500">{produitsDisponibles.length}</div>
            <div className="text-sm text-gray-400">Produits disponibles</div>
          </div>
          <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{TOUS_LES_PRODUITS.length - produitsDisponibles.length}</div>
            <div className="text-sm text-gray-400">Produits non disponibles</div>
          </div>
          <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{TOUS_LES_PRODUITS.length}</div>
            <div className="text-sm text-gray-400">Total produits</div>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit par nom, catégorie, gamme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setProduitsDisponibles(TOUS_LES_PRODUITS.map(p => p.id))}
            className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
          >
            Tout sélectionner
          </button>
          <button
            onClick={() => setProduitsDisponibles([])}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Tout désélectionner
          </button>
          <button
            onClick={handleSave}
            className="ml-auto px-6 py-2 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>

        {/* Liste des produits par catégorie */}
        {Object.entries(produitsParCategorie).map(([categorie, produitsParGamme]) => (
          <div key={categorie} className="mb-12">
            <h2 className="text-3xl font-bold mb-6">{categorie}</h2>
            {Object.entries(produitsParGamme).map(([gamme, produits]) => (
              <div key={gamme} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-300">{gamme}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {produits.map(produit => {
                    const isAvailable = produitsDisponibles.includes(produit.id)
                    const currentStock = stocks[produit.id] || 0
                    const availableStock = stocks[produit.id] ?? 0
                    return (
                      <div
                        key={produit.id}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isAvailable
                            ? 'bg-green-500/10 border-green-500/50'
                            : 'bg-noir-800/50 border-noir-700'
                        }`}
                      >
                        <div 
                          onClick={() => toggleProduit(produit.id)}
                          className="cursor-pointer mb-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-1 text-xs">{produit.nom}</h4>
                              <div className="text-xs text-gray-400 space-y-0.5">
                                {produit.diametre && <p>{produit.diametre}mm</p>}
                                {produit.taille && <p>{produit.taille}</p>}
                                {produit.conditionnement && <p>{produit.conditionnement}</p>}
                                {produit.saveur && <p>{produit.saveur}</p>}
                                {produit.forme && <p>{produit.forme}</p>}
                                {produit.couleur && <p>{produit.couleur}</p>}
                              </div>
                            </div>
                            {isAvailable ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        
                        {/* Gestion du stock */}
                        {isAvailable && (
                          <div 
                            className="pt-3 border-t border-noir-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Stock:</span>
                              <span className={`text-xs font-bold ${
                                availableStock > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {availableStock} disponible{availableStock !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={currentStock}
                                onChange={(e) => handleStockChange(produit.id, parseInt(e.target.value) || 0)}
                                min="0"
                                className="w-full px-2 py-1 bg-noir-900 border border-noir-700 rounded text-white text-xs"
                                placeholder="Stock"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        {produitsFiltres.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucun produit trouvé avec "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

