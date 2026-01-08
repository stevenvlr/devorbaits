'use client'

import { useState, useEffect } from 'react'
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
  Download,
  AlertTriangle,
  CheckCircle2,
  Database
} from 'lucide-react'
import { 
  Product, 
  ProductVariant,
  loadProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  onProductsUpdate,
  getProductImages,
  loadProductsSync,
  getAllProductsSync
} from '@/lib/products-manager'
import { migrateProductsToSupabase } from '@/lib/products-supabase'
import { 
  loadStock, 
  updateStock, 
  getAvailableStock,
  getAvailableStockSync,
  onStockUpdate,
} from '@/lib/stock-manager'
import { 
  DIAMETRES_BOUILLETTES, 
  CONDITIONNEMENTS, 
  TAILLES_EQUILIBRES 
} from '@/lib/constants'
import { loadGammes, addGamme, onGammesUpdate } from '@/lib/gammes-manager'
import { optimizeImage } from '@/lib/image-optimizer'
import { uploadProductImage } from '@/lib/storage-supabase'
import { getUnseenAlerts, markAlertAsSeen, getAlertId, type StockAlert } from '@/lib/stock-notifications'
import { importDefaultProducts, importAmicaleBlancProducts, addDescriptionsToExistingProducts } from '@/lib/import-default-products'
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

  // Ajouter automatiquement des descriptions aux produits qui n'en ont pas (une seule fois)
  useEffect(() => {
    const checkDescriptions = async () => {
      const hasCheckedDescriptions = localStorage.getItem('descriptions-checked')
      if (!hasCheckedDescriptions) {
        const products = await loadProducts()
        const productsWithoutDescription = products.filter(p => !p.description || p.description.trim() === '')
        if (productsWithoutDescription.length > 0) {
          // Ajouter des descriptions automatiquement
          const result = await addDescriptionsToExistingProducts()
          if (result.updated > 0) {
            console.log(`${result.updated} produits mis à  jour avec des descriptions`)
            // Recharger les produits
            const updatedProducts = await loadProducts()
            setProducts(updatedProducts)
          }
        }
        localStorage.setItem('descriptions-checked', 'true')
      }
    }
    checkDescriptions()
  }, [])

  // Charger les produits, stocks, gammes et alertes
  useEffect(() => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:128',message:'ProductsAdminPage useEffect',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    const loadData = async () => {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:130',message:'loadData entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
      }
      // #endregion
      try {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:133',message:'calling loadProducts',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
        }
        // #endregion
        const allProducts = await loadProducts()
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:136',message:'loadProducts result',data:{productsCount:allProducts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
        }
        // #endregion
        setProducts(allProducts)
        
        // Charger le stock depuis Supabase (location 'general' par défaut)
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:140',message:'calling loadStock',data:{location:'general'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
        }
        // #endregion
        const allStock = await loadStock('general')
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:143',message:'loadStock result',data:{stockItemsCount:Object.keys(allStock).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
        }
        // #endregion
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
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:160',message:'loadData error',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
        }
        // #endregion
        console.error('Erreur lors du chargement des donnÃ©es:', error)
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

  // GÃ©rer l'upload de plusieurs images (max 3, optimisÃ©es automatiquement)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limiter Ã  3 images max
    const currentCount = formData.images.length
    const remainingSlots = 3 - currentCount
    if (remainingSlots <= 0) {
      alert('Maximum 3 images par produit')
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    setIsUploadingImages(true)

    try {
      // Si on est en mode Ã©dition, utiliser l'ID du produit, sinon gÃ©nÃ©rer un ID temporaire
      const productId = editingProduct?.id || `temp-${Date.now()}`
      
      const uploadedImages = await Promise.all(
        filesToProcess.map(async (file, index) => {
          if (file.size > 5 * 1024 * 1024) {
            alert(`L'image ${file.name} est trop grande (max 5MB)`)
            throw new Error('File too large')
          }
          // Upload vers Supabase Storage si configurÃ©, sinon base64
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

  // RÃ©organiser les images (dÃ©placer vers le haut)
  const moveImageUp = (index: number) => {
    if (index === 0) return
    const newImages = [...formData.images]
    ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
    setFormData({ ...formData, images: newImages })
  }

  // RÃ©organiser les images (dÃ©placer vers le bas)
  const moveImageDown = (index: number) => {
    if (index === formData.images.length - 1) return
    const newImages = [...formData.images]
    ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    setFormData({ ...formData, images: newImages })
  }

  // RÃ©initialiser le formulaire
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
    
    // Si on est en mode Ã©dition (produit existant), crÃ©er immédiatement le stock pour cette variante
    if (editingProduct) {
      try {
        console.log(`ðŸ’¾ CrÃ©ation immÃ©diate du stock pour la nouvelle variante "${newVariant.label || newVariant.id}" du produit "${editingProduct.name}"`)
        await updateStock(editingProduct.id, 0, newVariant.id, 'general')
        console.log(`✅ Stock créé immédiatement pour la variante "${newVariant.label || newVariant.id}"`)
        
        // Mettre Ã  jour l'affichage du stock
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
        console.error(`âŒ Erreur lors de la crÃ©ation immÃ©diate du stock pour la variante:`, error)
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

  // Mettre Ã  jour une variante
  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v => 
        v.id === variantId ? { ...v, ...updates } : v
      )
    })
  }

  // GÃ©nÃ©rer automatiquement les variantes selon le type de produit
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
      alert(`${newVariants.length} variante(s) gÃ©nÃ©rÃ©e(s) automatiquement !`)
    }
  }

  // Sauvegarder le produit
  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      alert('Veuillez remplir au moins le nom et la catÃ©gorie')
      return
    }

    const hasVariants = formData.variants && formData.variants.length > 0
    if (hasVariants && formData.variants.length === 0) {
      alert('Veuillez ajouter au moins une variante ou dÃ©sactiver les variantes')
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
        // Récupérer le produit mis à  jour
        const allProducts = await loadProducts()
        savedProduct = allProducts.find(p => p.id === editingProduct.id)!
        
        // Pour un produit existant, vÃ©rifier toutes les variantes et crÃ©er le stock pour celles qui n'existent pas
        // Utiliser formData.variants directement pour Ãªtre sÃ»r d'avoir les bonnes variantes
        if (savedProduct) {
          console.log(`ðŸ” Vérification du stock pour le produit "${savedProduct.name}" (ID: ${savedProduct.id})`)
          console.log(`ðŸ“¦ hasVariants: ${hasVariants}, formData.variants:`, formData.variants)
          
          const allStock = await loadStock('general')
          console.log(`ðŸ“Š Stock actuel chargÃ©: ${Object.keys(allStock).length} entrÃ©es`)
          
          if (hasVariants && formData.variants && formData.variants.length > 0) {
            console.log(`ðŸ” Vérification du stock pour ${formData.variants.length} variante(s) du produit "${savedProduct.name}"`)
            console.log('ðŸ“‹ Variantes Ã  vÃ©rifier:', formData.variants.map(v => ({ id: v.id, label: v.label })))
            
            let createdCount = 0
            let existingCount = 0
            let errorCount = 0
            
            for (const variant of formData.variants) {
              const stockKey = `${savedProduct.id}-${variant.id}`
              console.log(`ðŸ”Ž Vérification de la variante "${variant.label}" (ID: ${variant.id}), stockKey: ${stockKey}`)
              
              // VÃ©rifier si l'entrÃ©e de stock existe déjà 
              if (!allStock[stockKey]) {
                // CrÃ©er une nouvelle entrÃ©e de stock avec stock Ã  0 par défaut
                try {
                  console.log(`ðŸ’¾ CrÃ©ation du stock pour la variante "${variant.label}"...`)
                  await updateStock(savedProduct.id, 0, variant.id, 'general')
                  createdCount++
                  console.log(`✅ EntrÃ©e de stock créée pour la variante "${variant.label}" (ID: ${variant.id}) du produit "${savedProduct.name}"`)
                } catch (error) {
                  errorCount++
                  console.error(`âŒ Erreur lors de la crÃ©ation du stock pour la variante "${variant.label}":`, error)
                }
              } else {
                existingCount++
                console.log(`ℹ️ Stock déjà  existant pour la variante "${variant.label}" (ID: ${variant.id}): ${allStock[stockKey].stock}`)
              }
            }
            
            console.log(`ðŸ“Š Résumé: ${createdCount} créé(s), ${existingCount} existant(s), ${errorCount} erreur(s)`)
          } else if (!hasVariants) {
            // Si le produit n'a pas de variantes, crÃ©er une entrÃ©e de stock pour le produit lui-même
            const stockKey = savedProduct.id
            console.log(`ðŸ”Ž Vérification du stock pour le produit sans variantes, stockKey: ${stockKey}`)
            
            if (!allStock[stockKey]) {
              try {
                console.log(`ðŸ’¾ CrÃ©ation du stock pour le produit sans variantes...`)
                await updateStock(savedProduct.id, 0, undefined, 'general')
                console.log(`✅ EntrÃ©e de stock créée pour le produit "${savedProduct.name}" (sans variantes)`)
              } catch (error) {
                console.error(`âŒ Erreur lors de la crÃ©ation du stock pour le produit "${savedProduct.name}":`, error)
              }
            } else {
              console.log(`ℹ️ Stock déjà  existant pour le produit "${savedProduct.name}": ${allStock[stockKey].stock}`)
            }
          } else {
            console.warn(`⚠️ Produit "${savedProduct.name}" a hasVariants=${hasVariants} mais formData.variants est vide ou undefined`)
          }
        }
        
        alert('Produit mis à  jour avec succès !')
      } else {
        const newProduct = await addProduct(productData)
        savedProduct = newProduct
        
        // CrÃ©er automatiquement des entrÃ©es de stock pour toutes les variantes du nouveau produit
        if (savedProduct && hasVariants && formData.variants && formData.variants.length > 0) {
          for (const variant of formData.variants) {
            // CrÃ©er une nouvelle entrÃ©e de stock avec stock Ã  0 par défaut
            await updateStock(savedProduct.id, 0, variant.id, 'general')
            console.log(`✅ EntrÃ©e de stock créée pour la variante "${variant.label}" du produit "${savedProduct.name}"`)
          }
        } else if (savedProduct && !hasVariants) {
          // Si le produit n'a pas de variantes, crÃ©er une entrÃ©e de stock pour le produit lui-même
          const allStock = await loadStock('general')
          const stockKey = savedProduct.id
          if (!allStock[stockKey]) {
            await updateStock(savedProduct.id, 0, undefined, 'general')
            console.log(`✅ EntrÃ©e de stock créée pour le produit "${savedProduct.name}"`)
          }
        }
        
        alert('Produit ajoutÃ© avec succès !')
      }

      // Recharger les produits
      const allProducts = await loadProducts()
      setProducts(allProducts)
      
      // Recharger le stock pour mettre Ã  jour l'affichage
      // Attendre un peu pour s'assurer que Supabase a bien enregistrÃ© les changements
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const updatedStock = await loadStock('general')
      console.log('ðŸ“¦ Stock rechargÃ© aprÃ¨s sauvegarde:', Object.keys(updatedStock).length, 'entrÃ©es')
      
      const stockMap: Record<string, number> = {}
      const variantStockMap: Record<string, number> = {}
      
      Object.values(updatedStock).forEach((item: any) => {
        if (item.variantId) {
          variantStockMap[`${item.productId}-${item.variantId}`] = item.stock
        } else {
          stockMap[item.productId] = item.stock
        }
      })
      
      console.log('ðŸ“Š Stock mappÃ©:', {
        produits: Object.keys(stockMap).length,
        variantes: Object.keys(variantStockMap).length
      })
      
      setStocks(stockMap)
      setVariantStocks(variantStockMap)
      
      resetForm()
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(`Erreur lors de la sauvegarde : ${error.message || 'Erreur inconnue'}\n\nVÃ©rifiez la console (F12) pour plus de dÃ©tails.`)
    }
  }

  // Supprimer un produit
  const handleDelete = async (id: string) => {
    if (confirm('ÃŠtes-vous sÃ»r de vouloir supprimer ce produit ?')) {
      await deleteProduct(id)
      alert('Produit supprimÃ© avec succès !')
      // Recharger les produits
      const allProducts = await loadProducts()
      setProducts(allProducts)
    }
  }

  // Ajouter une nouvelle gamme
  const handleAddGamme = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:375',message:'handleAddGamme called',data:{newGammeInput,trimmed:newGammeInput?.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!newGammeInput.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:377',message:'newGammeInput is empty',data:{newGammeInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      alert('Veuillez entrer un nom de gamme d\'appât')
      return
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:381',message:'calling addGamme',data:{input:newGammeInput.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const result = await addGamme(newGammeInput.trim())
    if (result.success) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:385',message:'addGamme success - reloading gammes',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Recharger la liste des gammes
      loadGammes().then(reloadedGammes => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:388',message:'gammes reloaded',data:{count:reloadedGammes.length,gammes:reloadedGammes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setGammes(reloadedGammes)
      }).catch(console.error)
      setFormData({ ...formData, gamme: newGammeInput.trim() })
      setNewGammeInput('')
      alert(result.message)
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:393',message:'addGamme failed',data:{message:result.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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

  // Importer les produits par défaut
  const handleImportDefaultProducts = async () => {
    if (!confirm('Voulez-vous importer tous les produits par défaut (huiles, farines, bird food, robin red) ?\n\nLes produits déjà existants seront ignorés.')) {
      return
    }

    const result = await importDefaultProducts()
    
    if (result.success > 0 || result.skipped > 0) {
      let message = `Import terminé !\n`
      if (result.success > 0) {
        message += `✅ ${result.success} produit(s) importé(s)\n`
      }
      if (result.skipped > 0) {
        message += `â­ï¸ ${result.skipped} produit(s) déjà  existant(s) ignoré(s)\n`
      }
      if (result.errors.length > 0) {
        message += `\nâŒ ${result.errors.length} erreur(s):\n${result.errors.join('\n')}`
      }
      alert(message)
      
      // Recharger les produits
      const allProducts = await loadProducts()
      setProducts(allProducts)
    } else {
      alert('Aucun produit importé. Tous les produits existent déjà  ou une erreur est survenue.')
    }
  }

  // Importer tous les produits de l'amicale des pêcheurs au blanc
  const handleImportAmicaleBlancProducts = async () => {
    if (!confirm('Voulez-vous importer TOUS les produits de l\'amicale des pêcheurs au blanc ?\n\nCela inclut :\n- Bouillettes (par gamme d\'appât avec toutes les variantes)\n- Équilibrées (par gamme d\'appât avec toutes les variantes)\n- Pop-up Duo, Bar à Pop-up, Flash boost, Spray plus, Boosters, Stick mix\n\nLes produits déjà existants seront ignorés.')) {
      return
    }

    const result = await importAmicaleBlancProducts()
    
    if (result.success > 0 || result.skipped > 0) {
      let message = `Import terminé !\n`
      if (result.success > 0) {
        message += `✅ ${result.success} produit(s) importé(s)\n`
      }
      if (result.skipped > 0) {
        message += `â­ï¸ ${result.skipped} produit(s) déjà  existant(s) ignoré(s)\n`
      }
      if (result.errors.length > 0) {
        message += `\nâŒ ${result.errors.length} erreur(s):\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `\n... et ${result.errors.length - 5} autres` : ''}`
      }
      alert(message)
      
      // Recharger les produits
      const allProducts = await loadProducts()
      setProducts(allProducts)
    } else {
      alert('Aucun produit importé. Tous les produits existent déjà  ou une erreur est survenue.')
    }
  }

  // Importer TOUS les produits (par défaut + amicale)
  const handleImportAllProducts = async () => {
    if (!confirm('Voulez-vous importer TOUS les produits disponibles ?\n\nCela inclut :\n- Produits par défaut (huiles, farines, bird food, robin red)\n- Tous les produits de l\'amicale (bouillettes, équilibrées, pop-ups, etc.)\n\nLes produits déjà  existants seront ignorés.')) {
      return
    }

    const resultDefault: { success: number; skipped: number; errors: string[] } = await importDefaultProducts()
    const resultAmicale: { success: number; skipped: number; errors: string[] } = await importAmicaleBlancProducts()
    
    const totalSuccess = resultDefault.success + resultAmicale.success
    const totalSkipped = resultDefault.skipped + resultAmicale.skipped
    const totalErrors = [...resultDefault.errors, ...resultAmicale.errors]

    let message = `Import terminé !\n\n`
    if (totalSuccess > 0) {
      message += `✅ ${totalSuccess} produit(s) importé(s)\n`
    }
    if (totalSkipped > 0) {
      message += `â­ï¸ ${totalSkipped} produit(s) déjà  existant(s) ignoré(s)\n`
    }
    if (totalErrors.length > 0) {
      message += `\nâŒ ${totalErrors.length} erreur(s):\n${totalErrors.slice(0, 5).join('\n')}${totalErrors.length > 5 ? '\n...' : ''}`
    }
    
    alert(message)
    
    // Recharger les produits
    const allProducts = await loadProducts()
    setProducts(allProducts)
  }

  // Ajouter des descriptions aux produits existants
  const handleAddDescriptions = async () => {
    if (!confirm('Voulez-vous ajouter des descriptions Ã  tous les produits qui n\'en ont pas ?')) {
      return
    }

    const result = await addDescriptionsToExistingProducts()
    
    if (result.updated > 0) {
      alert(`✅ ${result.updated} produit(s) mis à  jour avec des descriptions${result.errors.length > 0 ? `\n\nâŒ ${result.errors.length} erreur(s):\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? `\n... et ${result.errors.length - 5} autres` : ''}` : ''}`)
      
      // Recharger les produits
      const allProducts = await loadProducts()
      setProducts(allProducts)
    } else {
      alert('Tous les produits ont déjà une description ou une erreur est survenue.')
    }
  }

  // Migrer les produits vers Supabase
  const handleMigrateToSupabase = async () => {
    if (!confirm('Voulez-vous migrer tous les produits de localStorage vers Supabase ?\n\nCette opÃ©ration va sauvegarder tous vos produits dans la base de donnÃ©es Supabase.')) {
      return
    }

    try {
      const result = await migrateProductsToSupabase()
      
      if (result.success) {
        alert(`✅ Migration réussie !\n\n${result.count} produit(s) migré(s) vers Supabase.`)
        // Recharger les produits depuis Supabase
        const allProducts = await loadProducts()
        setProducts(allProducts)
      } else {
        alert(`âŒ Erreur lors de la migration :\n\n${result.error || 'Erreur inconnue'}`)
      }
    } catch (error: any) {
      alert(`âŒ Erreur lors de la migration :\n\n${error.message || 'Erreur inconnue'}`)
    }
  }

  // GÃ©rer le changement de stock
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
        {/* Alerte si aucun produit */}
        {products.length === 0 && (
          <div className="mb-8 bg-red-500/10 border border-red-500/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-400 mb-2">Aucun produit trouvÃ© !</h3>
                <p className="text-gray-300 mb-4">
                  Il n'y a actuellement aucun produit dans le systÃ¨me. Vous devez importer les produits pour qu'ils apparaissent sur le site.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleImportAllProducts}
                    className="px-6 py-3 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors text-lg"
                  >
                    ⚡ Importer TOUS les produits
                  </button>
                  <button
                    onClick={handleImportAmicaleBlancProducts}
                    className="px-4 py-2 bg-yellow-500/80 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    Importer produits Amicale
                  </button>
                  <button
                    onClick={handleImportDefaultProducts}
                    className="px-4 py-2 bg-noir-700 text-white font-semibold rounded-lg hover:bg-noir-600 transition-colors"
                  >
                    Importer produits par défaut
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
            <button
              onClick={handleImportAllProducts}
              className="btn btn-warning btn-md"
              title="Importer TOUS les produits (par défaut + amicale) en une seule fois"
            >
              <Database className="w-4 h-4" />
              ⚡ Importer TOUS les produits
            </button>
            <button
              onClick={handleImportDefaultProducts}
              className="btn btn-secondary btn-md"
              title="Importer tous les produits par défaut (huiles, farines, etc.)"
            >
              <Database className="w-4 h-4" />
              Importer produits par défaut
            </button>
            <button
              onClick={handleImportAmicaleBlancProducts}
              className="btn btn-info btn-md"
              title="Importer tous les produits de l'amicale (bouillettes, équilibrées, pop-ups, etc.) avec variantes regroupées"
            >
              <Database className="w-4 h-4" />
              Importer tous les produits (Amicale)
            </button>
            <button
              onClick={handleAddDescriptions}
              className="btn btn-secondary btn-md"
              title="Ajouter des descriptions automatiques aux produits qui n'en ont pas"
            >
              <Database className="w-4 h-4" />
              Ajouter descriptions
            </button>
            <button
              onClick={handleMigrateToSupabase}
              className="btn btn-success btn-md"
              title="Migrer tous les produits de localStorage vers Supabase"
            >
              <Database className="w-4 h-4" />
              Migrer vers Supabase
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

              {/* CatÃ©gorie */}
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

              {/* Gamme - SÃ©lecteur dynamique */}
              <div>
                <label className="block text-sm font-medium mb-2">Gamme d'appât</label>
                <div className="flex gap-2">
                  <select
                    value={formData.gamme === '__new__' ? '' : formData.gamme}
                    onChange={(e) => {
                      const selectedGamme = e.target.value
                      if (selectedGamme === '__new__') {
                        // Ouvrir le champ pour crÃ©er une nouvelle gamme
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
                {(() => {
                  // #region agent log
                  const shouldShow = formData.gamme === '__new__' || (newGammeInput && !gammes.includes(newGammeInput))
                  fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:668',message:'checking button visibility',data:{formDataGamme:formData.gamme,newGammeInput,gammesCount:gammes.length,shouldShow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                  // #endregion
                  return shouldShow
                })() ? (
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
                      onClick={(e) => {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/products/page.tsx:684',message:'button onClick triggered',data:{newGammeInput,formDataGamme:formData.gamme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        handleAddGamme()
                      }}
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
                    Format acceptÃ©: JPG, PNG, GIF (max 5MB par image, optimisÃ© automatiquement)
                  </p>
                </div>
                
                {/* AperÃ§u des images */}
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
                              title="DÃ©placer vers le haut"
                            >
                              â†‘
                            </button>
                          )}
                          {index < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              className="p-1 bg-noir-800 rounded hover:bg-noir-700"
                              title="DÃ©placer vers le bas"
                            >
                              â†“
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
                    <img
                      src={images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
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
                ? 'Aucun produit trouvÃ© avec ces critÃ¨res' 
                : 'Aucun produit pour le moment. Ajoutez-en un !'}
            </p>
          </div>
        )}

        {/* Modal de dÃ©tails produit */}
        <ProductDetailModal
          isOpen={selectedProductForModal !== null}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
        />
      </div>
    </div>
  )
}