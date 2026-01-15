'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X, 
  Package, 
  ImageIcon,
  Upload,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { 
  Product, 
  ProductVariant,
  loadProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  onProductsUpdate,
  getProductImages
} from '@/lib/products-manager'
import { 
  loadStock, 
  updateStock, 
  getAvailableStockSync,
  onStockUpdate,
} from '@/lib/stock-manager'
import { 
  DIAMETRES_BOUILLETTES, 
  CONDITIONNEMENTS, 
  TAILLES_EQUILIBRES 
} from '@/lib/constants'
import { loadGammes, addGamme, onGammesUpdate } from '@/lib/gammes-manager'
import { uploadProductImage } from '@/lib/storage-supabase'
import { getUnseenAlerts, markAlertAsSeen, getAlertId, type StockAlert } from '@/lib/stock-notifications'
import ProductDetailModal from '@/components/ProductDetailModal'

const CATEGORIES = [
  'bouillettes',
  'équilibrées',
  'équilibrés',
  'huiles',
  'farines',
  'pop-up duo',
  'bar à pop-up',
  'flash boost',
  'spray plus',
  'boosters',
  'stick mix',
  'bird food',
  'robin red'
]

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null)
  const [stocks, setStocks] = useState<Record<string, number>>({})
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({})
  const [gammes, setGammes] = useState<string[]>([])
  const [newGammeInput, setNewGammeInput] = useState('')
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const [formData, setFormData] = useState<{
    name: string
    category: string
    price: number
    description: string
    images: string[]
    gamme: string
    format: string
    available: boolean
    variants: ProductVariant[]
  }>({
    name: '',
    category: '',
    price: 0,
    description: '',
    images: [],
    gamme: '',
    format: '',
    available: true,
    variants: []
  })

  // Charger les produits, stocks, gammes et alertes
  useEffect(() => {
    const loadData = async () => {
      try {
        const allProducts = await loadProducts()
        setProducts(allProducts)
        
        // Charger le stock depuis Supabase (location 'general' par défaut)
        const allStock = await loadStock('general')
        const stockMap: Record<string, number> = {}
        const variantStockMap: Record<string, number> = {}
        
        Object.values(allStock).forEach((item: any) => {
          if (item.variantId) {
            variantStockMap[`${item.productId}-${item.variantId}`] = item.stock
          } else {
            stockMap[item.productId] = item.stock
          }
        })
        
        setStocks(stockMap)
        setVariantStocks(variantStockMap)
        
        // Charger les alertes de stock
        const alerts = await getUnseenAlerts()
        setStockAlerts(alerts)
      } catch (error: any) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }

    loadData()
    loadGammes().then(setGammes).catch(console.error)
    
    const unsubscribeProducts = onProductsUpdate(loadData)
    const unsubscribeStock = onStockUpdate(loadData)
    const unsubscribeGammes = onGammesUpdate(() => {
      loadGammes().then(setGammes).catch(console.error)
    })
    
    return () => {
      unsubscribeProducts()
      unsubscribeStock()
      unsubscribeGammes()
    }
  }, [])

  // Gérer l'upload de plusieurs images (max 3, optimisées automatiquement)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limiter à 3 images max
    const currentCount = formData.images.length
    const remainingSlots = 3 - currentCount
    if (remainingSlots <= 0) {
      alert('Maximum 3 images par produit')
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    setIsUploadingImages(true)

    try {
      // Si on est en mode édition, utiliser l'ID du produit, sinon générer un ID temporaire
      const productId = editingProduct?.id || `temp-${Date.now()}`
      
      const uploadedImages = await Promise.all(
        filesToProcess.map(async (file, index) => {
          if (file.size > 5 * 1024 * 1024) {
            alert(`L'image ${file.name} est trop grande (max 5MB)`)
            throw new Error('File too large')
          }
          // Upload vers Supabase Storage si configuré, sinon base64
          const imageIndex = formData.images.length + index
          return await uploadProductImage(productId, file, imageIndex)
        })
      )

      setFormData({
        ...formData,
        images: [...formData.images, ...uploadedImages]
      })
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error)
      alert('Erreur lors de l\'optimisation des images')
    } finally {
      setIsUploadingImages(false)
    }
  }

  // Supprimer une image
  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    })
  }

  // Réorganiser les images (déplacer vers le haut)
  const moveImageUp = (index: number) => {
    if (index === 0) return
    const newImages = [...formData.images]
    ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
    setFormData({ ...formData, images: newImages })
  }

  // Réorganiser les images (déplacer vers le bas)
  const moveImageDown = (index: number) => {
    if (index === formData.images.length - 1) return
    const newImages = [...formData.images]
    ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    setFormData({ ...formData, images: newImages })
  }

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: 0,
      description: '',
      images: [],
      gamme: '',
      format: '',
      available: true,
      variants: []
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  // Cliquer sur "Ajouter"
  const handleAddClick = () => {
    resetForm()
    setShowForm(true)
  }

  // Cliquer sur "Modifier"
  const handleEditClick = (product: Product) => {
    const images = getProductImages(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description || '',
      images: images,
      gamme: product.gamme || '',
      format: product.format || '',
      available: product.available,
      variants: product.variants || []
    })
    setEditingProduct(product)
    setShowForm(true)
  }

  // Ajouter une variante
  const addVariant = async () => {
    const newVariant: ProductVariant = {
      id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      label: '',
      price: formData.price || 0,
      available: true
    }
    
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant]
    })
    
    // Si on est en mode édition (produit existant), créer immédiatement le stock pour cette variante
    if (editingProduct) {
      try {
        console.log(`Création immédiate du stock pour la nouvelle variante "${newVariant.label || newVariant.id}" du produit "${editingProduct.name}"`)
        await updateStock(editingProduct.id, 0, newVariant.id, 'general')
        console.log(`✅ Stock créé immédiatement pour la variante "${newVariant.label || newVariant.id}"`)
        
        // Mettre à jour l'affichage du stock
        const allStock = await loadStock('general')
        const stockMap: Record<string, number> = {}
        const variantStockMap: Record<string, number> = {}
        
        Object.values(allStock).forEach((item: any) => {
          if (item.variantId) {
            variantStockMap[`${item.productId}-${item.variantId}`] = item.stock
          } else {
            stockMap[item.productId] = item.stock
          }
        })
        
        setStocks(stockMap)
        setVariantStocks(variantStockMap)
      } catch (error) {
        console.error(`Erreur lors de la création immédiate du stock pour la variante:`, error)
      }
    }
  }

  // Supprimer une variante
  const removeVariant = (variantId: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter(v => v.id !== variantId)
    })
    // Supprimer aussi le stock de la variante
    if (editingProduct) {
      const key = `${editingProduct.id}-${variantId}`
      delete variantStocks[key]
      setVariantStocks({ ...variantStocks })
    }
  }

  // Mettre à jour une variante
  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v => 
        v.id === variantId ? { ...v, ...updates } : v
      )
    })
  }

  // Générer automatiquement les variantes selon le type de produit
  const generateVariants = () => {
    const category = formData.category.toLowerCase()
    const newVariants: ProductVariant[] = []
    let variantIndex = 0

    if (category === 'bouillettes' && formData.gamme) {
      DIAMETRES_BOUILLETTES.forEach(diametre => {
        CONDITIONNEMENTS.forEach(conditionnement => {
          const label = `${diametre}mm - ${conditionnement}`
          newVariants.push({
            id: `variant-${Date.now()}-${variantIndex++}-${Math.random().toString(36).slice(2, 11)}`,
            label,
            price: formData.price || 0,
            available: true,
            diametre,
            conditionnement
          })
        })
      })
    } else if ((category === 'équilibrées' || category === 'équilibrés') && formData.gamme) {
      TAILLES_EQUILIBRES.forEach(taille => {
        newVariants.push({
          id: `variant-${Date.now()}-${variantIndex++}-${Math.random().toString(36).slice(2, 11)}`,
          label: taille,
          price: formData.price || 0,
          available: true,
          taille
        })
      })
    }

    if (newVariants.length > 0) {
      setFormData({
        ...formData,
        variants: newVariants
      })
      alert(`${newVariants.length} variante(s) générée(s) automatiquement !`)
    }
  }

  // Sauvegarder le produit
  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      alert('Veuillez remplir au moins le nom et la catégorie')
      return
    }

    const hasVariants = formData.variants && formData.variants.length > 0
    if (hasVariants && formData.variants.length === 0) {
      alert('Veuillez ajouter au moins une variante ou désactiver les variantes')
      return
    }

    // Ne pas sauvegarder "__new__" comme valeur de gamme
    const gammeValue = formData.gamme && formData.gamme !== '__new__' && formData.gamme.trim() !== '' 
      ? formData.gamme.trim() 
      : undefined

    const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      category: formData.category.toLowerCase(),
      price: formData.price,
      description: formData.description || undefined,
      images: formData.images.length > 0 ? formData.images : undefined,
      gamme: gammeValue,
      format: formData.format || undefined,
      available: formData.available,
      variants: hasVariants ? formData.variants : undefined
    }

    try {
      let savedProduct: Product
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
        // Récupérer le produit mis à jour
        const allProducts = await loadProducts()
        savedProduct = allProducts.find(p => p.id === editingProduct.id)!
        
        // Pour un produit existant, vérifier toutes les variantes et créer le stock pour celles qui n'existent pas
        // Utiliser formData.variants directement pour être sûr d'avoir les bonnes variantes
        if (savedProduct) {
          console.log(`Vérification du stock pour le produit "${savedProduct.name}" (ID: ${savedProduct.id})`)
          console.log(`hasVariants: ${hasVariants}, formData.variants:`, formData.variants)
          
          const allStock = await loadStock('general')
          console.log(`Stock actuel chargé: ${Object.keys(allStock).length} entrées`)
          
          if (hasVariants && formData.variants && formData.variants.length > 0) {
            console.log(`Vérification du stock pour ${formData.variants.length} variante(s) du produit "${savedProduct.name}"`)
            console.log('Variantes à vérifier:', formData.variants.map(v => ({ id: v.id, label: v.label })))
            
            let createdCount = 0
            let existingCount = 0
            let errorCount = 0
            
            for (const variant of formData.variants) {
              const stockKey = `${savedProduct.id}-${variant.id}`
              console.log(`Vérification de la variante "${variant.label}" (ID: ${variant.id}), stockKey: ${stockKey}`)
              
              // Vérifier si l'entrée de stock existe déjà
              if (!allStock[stockKey]) {
                // Créer une nouvelle entrée de stock avec stock à 0 par défaut
                try {
                  console.log(`Création du stock pour la variante "${variant.label}"...`)
                  await updateStock(savedProduct.id, 0, variant.id, 'general')
                  createdCount++
                  console.log(`✅ Entrée de stock créée pour la variante "${variant.label}" (ID: ${variant.id}) du produit "${savedProduct.name}"`)
                } catch (error) {
                  errorCount++
                  console.error(`Erreur lors de la création du stock pour la variante "${variant.label}":`, error)
                }
              } else {
                existingCount++
                console.log(`Stock déjà existant pour la variante "${variant.label}" (ID: ${variant.id}): ${allStock[stockKey].stock}`)
              }
            }
            
            console.log(`Résumé: ${createdCount} créé(s), ${existingCount} existant(s), ${errorCount} erreur(s)`)
          } else if (!hasVariants) {
            // Si le produit n'a pas de variantes, créer une entrée de stock pour le produit lui-même
            const stockKey = savedProduct.id
            console.log(`Vérification du stock pour le produit sans variantes, stockKey: ${stockKey}`)
            
            if (!allStock[stockKey]) {
              try {
                console.log(`Création du stock pour le produit sans variantes...`)
                await updateStock(savedProduct.id, 0, undefined, 'general')
                console.log(`✅ Entrée de stock créée pour le produit "${savedProduct.name}" (sans variantes)`)
              } catch (error) {
                console.error(`Erreur lors de la création du stock pour le produit "${savedProduct.name}":`, error)
              }
            } else {
              console.log(`Stock déjà existant pour le produit "${savedProduct.name}": ${allStock[stockKey].stock}`)
            }
          } else {
            console.warn(`Produit "${savedProduct.name}" a hasVariants=${hasVariants} mais formData.variants est vide ou undefined`)
          }
        }
        
        alert('Produit mis à jour avec succès !')
      } else {
        const newProduct = await addProduct(productData)
        savedProduct = newProduct
        
        // Créer automatiquement des entrées de stock pour toutes les variantes du nouveau produit
        if (savedProduct && hasVariants && formData.variants && formData.variants.length > 0) {
          for (const variant of formData.variants) {
            // Créer une nouvelle entrée de stock avec stock à 0 par défaut
            await updateStock(savedProduct.id, 0, variant.id, 'general')
            console.log(`✅ Entrée de stock créée pour la variante "${variant.label}" du produit "${savedProduct.name}"`)
          }
        } else if (savedProduct && !hasVariants) {
          // Si le produit n'a pas de variantes, créer une entrée de stock pour le produit lui-même
          const allStock = await loadStock('general')
          const stockKey = savedProduct.id
          if (!allStock[stockKey]) {
            await updateStock(savedProduct.id, 0, undefined, 'general')
            console.log(`✅ Entrée de stock créée pour le produit "${savedProduct.name}"`)
          }
        }
        
        alert('Produit ajouté avec succès !')
      }

      // Recharger les produits
      const allProducts = await loadProducts()
      setProducts(allProducts)
      
      // Recharger le stock pour mettre à jour l'affichage
      // Attendre un peu pour s'assurer que Supabase a bien enregistré les changements
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const updatedStock = await loadStock('general')
      console.log('Stock rechargé après sauvegarde:', Object.keys(updatedStock).length, 'entrées')
      
      const stockMap: Record<string, number> = {}
      const variantStockMap: Record<string, number> = {}
      
      Object.values(updatedStock).forEach((item: any) => {
        if (item.variantId) {
          variantStockMap[`${item.productId}-${item.variantId}`] = item.stock
        } else {
          stockMap[item.productId] = item.stock
        }
      })
      
      console.log('Stock mappé:', {
        produits: Object.keys(stockMap).length,
        variantes: Object.keys(variantStockMap).length
      })
      
      setStocks(stockMap)
      setVariantStocks(variantStockMap)
      
      resetForm()
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(`Erreur lors de la sauvegarde : ${error.message || 'Erreur inconnue'}\n\nVérifiez la console (F12) pour plus de détails.`)
    }
  }

  // Supprimer un produit
  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      await deleteProduct(id)
      alert('Produit supprimé avec succès !')
      // Recharger les produits
      const allProducts = await loadProducts()
      setProducts(allProducts)
    }
  }

  // Ajouter une nouvelle gamme
  const handleAddGamme = async () => {
    if (!newGammeInput.trim()) {
      alert('Veuillez entrer un nom de gamme d\'appât')
      return
    }
    
    const result = await addGamme(newGammeInput.trim())
    if (result.success) {
      // Recharger la liste des gammes
      loadGammes().then(reloadedGammes => {
        setGammes(reloadedGammes)
      }).catch(console.error)
      setFormData({ ...formData, gamme: newGammeInput.trim() })
      setNewGammeInput('')
      alert(result.message)
    } else {
      alert(result.message)
    }
  }

  // Marquer une alerte comme vue
  const handleDismissAlert = (alert: StockAlert) => {
    markAlertAsSeen(getAlertId(alert))
    const loadAlerts = async () => {
      const alerts = await getUnseenAlerts()
      setStockAlerts(alerts)
    }
    loadAlerts()
  }

  // Gérer le changement de stock
  const handleStockChange = async (productId: string, variantId: string | undefined, newStock: number) => {
    await updateStock(productId, newStock, variantId)
    if (variantId) {
      setVariantStocks(prev => ({ ...prev, [`${productId}-${variantId}`]: newStock }))
    } else {
      setStocks(prev => ({ ...prev, [productId]: newStock }))
    }
  }

  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.gamme?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !categoryFilter || product.category.toLowerCase() === categoryFilter.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notifications de rupture de stock */}
        {stockAlerts.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-red-400">
                  Alertes de rupture de stock ({stockAlerts.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  stockAlerts.forEach(alert => markAlertAsSeen(getAlertId(alert)))
                  setStockAlerts([])
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Tout masquer
              </button>
            </div>
            <div className="space-y-2">
              {stockAlerts.map((alert) => (
                <div
                  key={getAlertId(alert)}
                  className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3"
                >
                  <div>
                    <span className="font-medium text-white">{alert.productName}</span>
                    {alert.variantLabel && (
                      <span className="text-gray-400 ml-2">- {alert.variantLabel}</span>
                    )}
                    <span className="text-red-400 ml-2">(Stock: 0)</span>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestion des Produits</h1>
            <p className="text-gray-400">Ajoutez, modifiez ou supprimez des produits</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleAddClick}
              className="btn btn-primary btn-md"
            >
              <Plus className="w-4 h-4" />
              Ajouter un produit
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-noir-800 border border-noir-700 rounded-lg text-white"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg text-white"
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Formulaire d'ajout/modification */}
        {showForm && (
          <div className="mb-8 bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-noir-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium mb-2">Nom du produit *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Ex: Bouillettes Krill Calamar"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Prix */}
              <div>
                <label className="block text-sm font-medium mb-2">Prix (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                />
              </div>

              {/* Gamme - Sélecteur dynamique */}
              <div>
                <label className="block text-sm font-medium mb-2">Gamme d'appât</label>
                <div className="flex gap-2">
                  <select
                    value={formData.gamme === '__new__' ? '' : formData.gamme}
                    onChange={(e) => {
                      const selectedGamme = e.target.value
                      if (selectedGamme === '__new__') {
                        // Ouvrir le champ pour créer une nouvelle gamme
                        setNewGammeInput('')
                        setFormData({ ...formData, gamme: '__new__' })
                      } else {
                        setFormData({ ...formData, gamme: selectedGamme })
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  >
                    <option value="">Aucune gamme d'appât</option>
                    {(Array.isArray(gammes) ? gammes : []).map(gamme => (
                      <option key={gamme} value={gamme}>{gamme}</option>
                    ))}
                    <option value="__new__">+ Créer une nouvelle gamme d'appât</option>
                  </select>
                </div>
                {(formData.gamme === '__new__' || (newGammeInput && !gammes.includes(newGammeInput))) ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newGammeInput}
                      onChange={(e) => setNewGammeInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddGamme()
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                      placeholder="Nom de la nouvelle gamme d'appât"
                    />
                    <button
                      type="button"
                      onClick={handleAddGamme}
                      className="px-4 py-2 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <input
                  type="text"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Ex: 500 ml, 1 kg"
                />
              </div>

              {/* Disponible */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  Produit disponible
                </label>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Description du produit..."
                />
              </div>

              {/* Images - Upload multiple (max 3) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Images du produit ({formData.images.length}/3)
                </label>
                <div className="mb-4">
                  <label className={`flex items-center justify-center gap-2 px-4 py-3 bg-noir-900 border border-noir-700 rounded-lg transition-colors ${
                    formData.images.length >= 3 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-noir-800'
                  }`}>
                    <Upload className="w-5 h-5" />
                    <span>
                      {isUploadingImages 
                        ? 'Optimisation en cours...' 
                        : formData.images.length >= 3 
                          ? 'Maximum 3 images atteint' 
                          : `Ajouter des images (${3 - formData.images.length} restantes)`
                      }
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={formData.images.length >= 3 || isUploadingImages}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">
                    Format accepté: JPG, PNG, GIF (max 5MB par image, optimisé automatiquement)
                  </p>
                </div>
                
                {/* Aperçu des images */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-noir-700"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              className="p-1 bg-noir-800 rounded hover:bg-noir-700"
                              title="Déplacer vers le haut"
                            >
                              ↑
                            </button>
                          )}
                          {index < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              className="p-1 bg-noir-800 rounded hover:bg-noir-700"
                              title="Déplacer vers le bas"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 bg-red-500 rounded hover:bg-red-600"
                            title="Supprimer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-noir-950 text-xs px-2 py-1 rounded font-bold">
                            Principale
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variantes */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium">Variantes</label>
                  <div className="flex gap-2">
                    {(formData.category.toLowerCase() === 'bouillettes' || 
                      formData.category.toLowerCase() === 'équilibrées' || 
                      formData.category.toLowerCase() === 'équilibrés') && (
                      <button
                        type="button"
                        onClick={generateVariants}
                        className="btn btn-info btn-sm"
                      >
                        Générer automatiquement
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Ajouter une variante
                    </button>
                  </div>
                </div>

                {formData.variants.length > 0 && (
                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div key={variant.id} className="p-4 bg-noir-900 rounded-lg border border-noir-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">Variante {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Label</label>
                            <input
                              type="text"
                              value={variant.label}
                              onChange={(e) => updateVariant(variant.id, { label: e.target.value })}
                              className="w-full px-2 py-1 bg-noir-800 border border-noir-700 rounded text-white text-sm"
                              placeholder="Ex: 10mm - 1kg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Prix (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.id, { price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 bg-noir-800 border border-noir-700 rounded text-white text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={variant.available}
                              onChange={(e) => updateVariant(variant.id, { available: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <label className="text-xs text-gray-400">Disponible</label>
                          </div>
                        </div>
                        {/* Stock pour la variante */}
                        {editingProduct && (
                          <div className="mt-3 pt-3 border-t border-noir-700">
                            <label className="block text-xs text-gray-400 mb-1">Stock</label>
                            <input
                              type="number"
                              value={variantStocks[`${editingProduct.id}-${variant.id}`] ?? ''}
                              onChange={(e) => handleStockChange(editingProduct.id, variant.id, parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-noir-800 border border-noir-700 rounded text-white text-sm"
                              placeholder="Stock"
                              min="0"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="btn btn-secondary btn-md"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary btn-md"
              >
                <Save className="w-4 h-4" />
                {editingProduct ? 'Enregistrer les modifications' : 'Ajouter le produit'}
              </button>
            </div>
          </div>
        )}

        {/* Liste des produits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const images = getProductImages(product)
            return (
              <div
                key={product.id}
                className="bg-noir-800/50 border border-noir-700 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all"
              >
                {/* Image */}
                <div 
                  className="aspect-square bg-noir-700 relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProductForModal(product)}
                >
                  {images.length > 0 ? (
                    <Image
                      src={images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1200px) 50vw, 33vw"
                      className="object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                      quality={85}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                  {images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-noir-950 text-xs px-2 py-1 rounded font-bold">
                      +{images.length - 1}
                    </div>
                  )}
                  {!product.available && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                      Indisponible
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    {product.variants && product.variants.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{product.category}</p>
                    {product.gamme && (
                    <p className="text-xs text-gray-500 mb-2">Gamme d'appât: {product.gamme}</p>
                  )}
                  {product.description && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {product.variants && product.variants.length > 0 ? (
                        <div>
                          <span className="text-yellow-500 font-bold text-lg">
                            {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}
                          </span>
                          {(() => {
                            const availableVariants = product.variants.filter(v => v.available && v.price > 0)
                            if (availableVariants.length > 0) {
                              return (
                                <p className="text-xs text-gray-400">
                                  À partir de {Math.min(...availableVariants.map(v => v.price)).toFixed(2)} €
                                </p>
                              )
                            }
                            return null
                          })()}
                        </div>
                      ) : (
                        <span className="text-yellow-500 font-bold text-lg">
                          {product.price.toFixed(2)} €
                        </span>
                      )}
                    </div>
                    {product.format && (
                      <span className="text-xs text-gray-400">{product.format}</span>
                    )}
                  </div>

                  {/* Affichage du stock en direct */}
                  {(() => {
                    if (product.variants && product.variants.length > 0) {
                      const totalStock = product.variants.reduce((sum, variant) => {
                        const variantStock = getAvailableStockSync(product.id, variant.id)
                        return sum + (variantStock >= 0 ? variantStock : 0)
                      }, 0)
                      const hasUnlimited = product.variants.some(v => getAvailableStockSync(product.id, v.id) < 0)
                      if (hasUnlimited) {
                        return (
                          <p className="text-xs font-medium text-gray-400 mb-2">
                            Stock: ∞ illimité
                          </p>
                        )
                      }
                      const isOutOfStock = totalStock === 0
                      return (
                        <p className={`text-xs font-medium mb-2 ${
                          totalStock > 0 ? 'text-green-400' : isOutOfStock ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          Stock total: {totalStock} disponible{totalStock !== 1 ? 's' : ''}
                        </p>
                      )
                    } else {
                      const stock = getAvailableStockSync(product.id)
                      const stockDisplay = stock >= 0 ? stock : '∞'
                      const isOutOfStock = stock === 0
                      return (
                        <p className={`text-xs font-medium mb-2 ${
                          stock > 0 ? 'text-green-400' : isOutOfStock ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          Stock: {stockDisplay} {stock >= 0 ? `disponible${stock !== 1 ? 's' : ''}` : 'illimité'}
                        </p>
                      )
                    }
                  })()}

                  {/* Gestion du stock - seulement pour produits sans variantes */}
                  {(!product.variants || product.variants.length === 0) && (
                    <div className="mb-4 p-3 bg-noir-900 rounded-lg border border-noir-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400">Stock:</span>
                          <span className={`text-xs font-bold ${
                            getAvailableStockSync(product.id) > 0 ? 'text-green-400' : getAvailableStockSync(product.id) === -1 ? 'text-gray-400' : 'text-red-400'
                          }`}>
                            {getAvailableStockSync(product.id) >= 0 
                              ? `${getAvailableStockSync(product.id)} disponible${getAvailableStockSync(product.id) !== 1 ? 's' : ''}`
                              : '∞ illimité'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={stocks[product.id] ?? ''}
                          onChange={(e) => handleStockChange(product.id, undefined, parseInt(e.target.value) || 0)}
                          min="0"
                          className="w-full px-2 py-1 bg-noir-800 border border-noir-700 rounded text-white text-xs"
                          placeholder="Stock"
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      <Edit className="w-3 h-3" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchTerm || categoryFilter 
                ? 'Aucun produit trouvé avec ces critères' 
                : 'Aucun produit pour le moment. Ajoutez-en un !'}
            </p>
          </div>
        )}

        {/* Modal de détails produit */}
        <ProductDetailModal
          isOpen={selectedProductForModal !== null}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
        />
      </div>
    </div>
  )
}
