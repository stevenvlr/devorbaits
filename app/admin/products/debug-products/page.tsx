'use client'

import { useEffect, useState } from 'react'
import { getAllProductsSync } from '@/lib/products-manager'

export default function DebugProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [storageData, setStorageData] = useState<string>('')

  useEffect(() => {
    const allProducts = getAllProductsSync(true) // Tous les produits, même indisponibles
    setProducts(allProducts)
    
    // Afficher le contenu brut de localStorage
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('site-products-manager')
      setStorageData(raw || 'Aucune donnée dans localStorage')
    }
  }, [])

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Debug Produits</h1>
        
        <div className="mb-8 bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Nombre de produits trouvés: {products.length}</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Contenu localStorage (raw):</h3>
            <pre className="bg-noir-900 p-4 rounded-lg text-xs overflow-auto max-h-40">
              {storageData.substring(0, 500)}...
            </pre>
          </div>
        </div>

        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Liste des produits:</h2>
          {products.length === 0 ? (
            <p className="text-red-400">Aucun produit trouvé !</p>
          ) : (
            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id || index} className="bg-noir-900 p-4 rounded-lg border border-noir-700">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-yellow-500">ID: {product.id}</p>
                      <p className="text-white">Nom: {product.name}</p>
                      <p className="text-gray-400">Catégorie: {product.category}</p>
                      <p className="text-gray-400">Gamme d'appât: {product.gamme || 'AUCUNE GAMME D\'APPÂT'}</p>
                      <p className="text-gray-400">Disponible: {product.available ? 'Oui' : 'Non'}</p>
                      <p className="text-gray-400">Prix: {product.price}€</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Variantes: {product.variants?.length || 0}</p>
                      <p className="text-gray-400">Images: {product.images?.length || product.image ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
