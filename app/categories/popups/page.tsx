'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Factory, Package, Zap, Droplet } from 'lucide-react'
import { loadPopupDuoSaveurs, loadPopupDuoFormes, loadPopupDuoFormeImages, loadPopupDuoVariantImages, onPopupDuoSaveursUpdate, onPopupDuoFormesUpdate, onPopupDuoFormeImagesUpdate, onPopupDuoVariantImagesUpdate } from '@/lib/popup-variables-manager'
import { useCart } from '@/contexts/CartContext'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { getPopUpDuoId, getPrixPersonnalise } from '@/lib/price-utils'
import { getAvailableStock, getAvailableStockSync, onStockUpdate } from '@/lib/stock-manager'
import { onProductsUpdate, type Product, type ProductVariant, getProductFirstImage } from '@/lib/products-manager'
import PromoItemModal, { PromoCharacteristics } from '@/components/PromoItemModal'

export default function PopupsPage() {
  const [saveurs, setSaveurs] = useState<string[]>([])
  const [formes, setFormes] = useState<string[]>([])
  const [formeImages, setFormeImages] = useState<Record<string, string>>({})
  const [variantImages, setVariantImages] = useState<Record<string, string>>({})
  const [selectedSaveur, setSelectedSaveur] = useState('')
  const [selectedForme, setSelectedForme] = useState('')
  
  // Charger les saveurs et formes depuis le gestionnaire
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Chargement des saveurs et formes Pop-up Duo...')
        const loadedSaveurs = await loadPopupDuoSaveurs()
        const loadedFormes = await loadPopupDuoFormes()
        const loadedFormeImages = await loadPopupDuoFormeImages()
        const loadedVariantImages = await loadPopupDuoVariantImages()
        const saveursArray = Array.isArray(loadedSaveurs) ? loadedSaveurs : []
        const formesArray = Array.isArray(loadedFormes) ? loadedFormes : []
        console.log(`✅ Saveurs chargées: ${saveursArray.length}`, saveursArray)
        console.log(`✅ Formes chargées: ${formesArray.length}`, formesArray)
        setSaveurs(saveursArray)
        setFormes(formesArray)
        setFormeImages(loadedFormeImages && typeof loadedFormeImages === 'object' ? loadedFormeImages : {})
        setVariantImages(loadedVariantImages && typeof loadedVariantImages === 'object' ? loadedVariantImages : {})
        if (saveursArray.length > 0 && !selectedSaveur) {
          setSelectedSaveur(saveursArray[0])
        }
        if (formesArray.length > 0 && !selectedForme) {
          setSelectedForme(formesArray[0])
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des saveurs/formes:', error)
        setSaveurs([])
        setFormes([])
        setFormeImages({})
        setVariantImages({})
      }
    }
    
    loadData()
    const unsubscribeSaveurs = onPopupDuoSaveursUpdate(loadData)
    const unsubscribeFormes = onPopupDuoFormesUpdate(loadData)
    const unsubscribeFormeImages = onPopupDuoFormeImagesUpdate(loadData)
    const unsubscribeVariantImages = onPopupDuoVariantImagesUpdate(loadData)
    
    return () => {
      unsubscribeSaveurs()
      unsubscribeFormes()
      unsubscribeFormeImages()
      unsubscribeVariantImages()
    }
  }, [])
  const [quantity, setQuantity] = useState(1)
  const { addToCart, cartItems, shouldShowPromoModal, addPromoItem } = useCart()
  const prixPersonnalises = usePrixPersonnalises()
  const { promotion } = useGlobalPromotion()
  const [showPromoModal, setShowPromoModal] = useState(false)

  // État pour le produit Pop-up Duo
  const [popupDuoProduct, setPopupDuoProduct] = useState<Product | null>(null)
  const [popupDuoVariant, setPopupDuoVariant] = useState<ProductVariant | null>(null)
  
  // États pour Flash boost et Spray plus (utilisant les variantes depuis le gestionnaire)
  const [flashBoostProduct, setFlashBoostProduct] = useState<Product | null>(null)
  const [flashBoostVariant, setFlashBoostVariant] = useState<ProductVariant | null>(null)
  const [flashBoostQuantity, setFlashBoostQuantity] = useState(1)
  const [sprayPlusProduct, setSprayPlusProduct] = useState<Product | null>(null)
  const [sprayPlusVariant, setSprayPlusVariant] = useState<ProductVariant | null>(null)
  const [sprayPlusQuantity, setSprayPlusQuantity] = useState(1)
  const [, forceUpdate] = useState(0)
  
  // Charger le produit Pop-up Duo et les produits Flash boost et Spray plus depuis le gestionnaire
  useEffect(() => {
    // Ne charger que si une saveur est sélectionnée
    if (!selectedSaveur) {
      return
    }
    
    const loadProducts = async () => {
      // Importer getProductsByCategory une seule fois
      const { getProductsByCategory } = await import('@/lib/products-manager')
      
      // Charger le produit Pop-up Duo correspondant à la saveur
      const popupDuoProducts = await getProductsByCategory('pop-up duo', true)
      const productName = `Pop-up Duo ${selectedSaveur}`
      const popupDuo = popupDuoProducts.find(p => 
        p.name.toLowerCase() === productName.toLowerCase()
      )
      
      if (popupDuo) {
        setPopupDuoProduct(popupDuo)
        // Trouver la variante correspondant à la forme sélectionnée
        if (selectedForme && popupDuo.variants) {
          const variant = popupDuo.variants.find(v => 
            v.forme === selectedForme || v.label === selectedForme
          )
          setPopupDuoVariant(variant || null)
        } else {
          setPopupDuoVariant(null)
        }
      } else {
        setPopupDuoProduct(null)
        setPopupDuoVariant(null)
      }
      
      // Les produits Flash boost et Spray plus sont nommés "Flash boost {arome}" et "Spray plus {arome}"
      // On cherche tous les produits de la catégorie et on trouve celui qui correspond à la saveur sélectionnée
      
      // Essayer différentes variantes de la catégorie (insensible à la casse)
      const [flashBoost1, flashBoost2, flashBoost3] = await Promise.all([
        getProductsByCategory('flash boost', true),
        getProductsByCategory('Flash boost', true),
        getProductsByCategory('FLASH BOOST', true)
      ])
      
      const allFlashBoost = [...flashBoost1, ...flashBoost2, ...flashBoost3]
      // Supprimer les doublons par ID
      const uniqueFlashBoost = Array.from(
        new Map(allFlashBoost.map(p => [p.id, p])).values()
      )
      
      const [sprayPlus1, sprayPlus2, sprayPlus3] = await Promise.all([
        getProductsByCategory('spray plus', true),
        getProductsByCategory('Spray plus', true),
        getProductsByCategory('SPRAY PLUS', true)
      ])
      
      const allSprayPlus = [...sprayPlus1, ...sprayPlus2, ...sprayPlus3]
      // Supprimer les doublons par ID
      const uniqueSprayPlus = Array.from(
        new Map(allSprayPlus.map(p => [p.id, p])).values()
      )
      
      console.log(`🔍 Recherche Flash boost pour saveur: "${selectedSaveur}"`, {
        produitsDisponibles: uniqueFlashBoost.length,
        nomsProduits: uniqueFlashBoost.map(p => `${p.name} (cat: ${p.category})`),
        saveurRecherchee: selectedSaveur
      })
      
      // Chercher un produit Flash boost qui correspond exactement à la saveur
      // Format attendu: "Flash boost {saveur}"
      const expectedFlashBoostName = `Flash boost ${selectedSaveur}`
      const normalizedSaveur = selectedSaveur.toLowerCase().trim()
      
      // Afficher tous les produits pour le débogage
      console.log(`📋 Tous les produits Flash boost disponibles:`, uniqueFlashBoost.map(p => ({
        nom: p.name,
        categorie: p.category,
        gamme: p.gamme,
        variantes: p.variants?.map(v => ({
          label: v.label,
          arome: v.arome,
          saveur: v.saveur
        })) || []
      })))
      
      const flashBoost = uniqueFlashBoost.find(p => {
        const normalizedName = p.name.toLowerCase().trim()
        const normalizedGamme = p.gamme?.toLowerCase().trim() || ''
        
        // Vérifier d'abord le nom exact
        if (normalizedName === expectedFlashBoostName.toLowerCase()) {
          console.log(`✅ Flash boost trouvé par nom exact: "${p.name}"`)
          return true
        }
        // Vérifier si le nom commence par "flash boost" et contient la saveur
        if (normalizedName.startsWith('flash boost') && normalizedName.includes(normalizedSaveur)) {
          console.log(`✅ Flash boost trouvé par nom partiel: "${p.name}"`)
          return true
        }
        // Vérifier si une variante correspond (priorité haute)
        const matchingVariant = p.variants?.find(v => {
          const variantArome = v.arome?.toLowerCase().trim() || ''
          const variantSaveur = v.saveur?.toLowerCase().trim() || ''
          return variantArome === normalizedSaveur || variantSaveur === normalizedSaveur
        })
        if (matchingVariant) {
          console.log(`✅ Flash boost trouvé par variante: "${p.name}" (variante: "${matchingVariant.label}")`)
          return true
        }
        // Vérifier si le champ gamme correspond
        if (normalizedGamme === normalizedSaveur) {
          console.log(`✅ Flash boost trouvé par gamme: "${p.name}" (gamme: "${p.gamme}")`)
          return true
        }
        // Vérifier si le nom contient la saveur (fallback plus large, mais moins prioritaire)
        if (normalizedName.includes(normalizedSaveur)) {
          console.log(`✅ Flash boost trouvé par nom contenant saveur: "${p.name}"`)
          return true
        }
        return false
      })
      
      // Si aucun produit n'est trouvé, essayer de le créer automatiquement
      if (!flashBoost && selectedSaveur) {
        console.log(`⚠️ Produit Flash boost "${expectedFlashBoostName}" non trouvé, tentative de création...`)
        // Note: La création automatique se fait via stock-variables-helper, mais on peut essayer de déclencher
        // Pour l'instant, on ne fait rien ici car cela nécessite une action admin
      }
      
      if (flashBoost) {
        console.log(`✅ Produit Flash boost sélectionné: "${flashBoost.name}"`, {
          variantes: flashBoost.variants?.length || 0
        })
        setFlashBoostProduct(flashBoost)
        // Sélectionner la variante correspondant à la saveur pop-up duo (insensible à la casse)
        const normalizedSaveur = selectedSaveur.toLowerCase().trim()
        const variant = flashBoost.variants?.find(v => {
          const variantArome = v.arome?.toLowerCase().trim() || ''
          const variantSaveur = v.saveur?.toLowerCase().trim() || ''
          return variantArome === normalizedSaveur || 
                 variantSaveur === normalizedSaveur ||
                 v.arome === selectedSaveur || 
                 v.saveur === selectedSaveur
        })
        if (variant) {
          console.log(`✅ Variante Flash boost sélectionnée: "${variant.label}" (arome: "${variant.arome || variant.saveur}")`)
          setFlashBoostVariant(variant)
        } else if (flashBoost.variants && flashBoost.variants.length > 0) {
          console.log(`⚠️ Aucune variante correspondante pour "${selectedSaveur}", utilisation de la première: "${flashBoost.variants[0].label}"`)
          setFlashBoostVariant(flashBoost.variants[0])
        } else {
          console.warn(`⚠️ Aucune variante disponible pour "${flashBoost.name}"`)
          setFlashBoostVariant(null)
        }
      } else {
        console.warn(`⚠️ Aucun produit Flash boost trouvé pour la saveur "${selectedSaveur}"`)
        setFlashBoostProduct(null)
        setFlashBoostVariant(null)
      }
      
      console.log(`🔍 Recherche Spray plus pour saveur: "${selectedSaveur}"`, {
        produitsDisponibles: uniqueSprayPlus.length,
        nomsProduits: uniqueSprayPlus.map(p => `${p.name} (cat: ${p.category})`),
        saveurRecherchee: selectedSaveur
      })
      
      // Chercher un produit Spray plus qui correspond exactement à la saveur
      // Format attendu: "Spray plus {saveur}"
      const expectedSprayPlusName = `Spray plus ${selectedSaveur}`
      
      // Afficher tous les produits pour le débogage
      console.log(`📋 Tous les produits Spray plus disponibles:`, uniqueSprayPlus.map(p => ({
        nom: p.name,
        categorie: p.category,
        gamme: p.gamme,
        variantes: p.variants?.map(v => ({
          label: v.label,
          arome: v.arome,
          saveur: v.saveur
        })) || []
      })))
      
      const sprayPlus = uniqueSprayPlus.find(p => {
        const normalizedName = p.name.toLowerCase().trim()
        const normalizedGamme = p.gamme?.toLowerCase().trim() || ''
        
        // Vérifier d'abord le nom exact
        if (normalizedName === expectedSprayPlusName.toLowerCase()) {
          console.log(`✅ Spray plus trouvé par nom exact: "${p.name}"`)
          return true
        }
        // Vérifier si le nom commence par "spray plus" et contient la saveur
        if (normalizedName.startsWith('spray plus') && normalizedName.includes(normalizedSaveur)) {
          console.log(`✅ Spray plus trouvé par nom partiel: "${p.name}"`)
          return true
        }
        // Vérifier si une variante correspond (priorité haute)
        const matchingVariant = p.variants?.find(v => {
          const variantArome = v.arome?.toLowerCase().trim() || ''
          const variantSaveur = v.saveur?.toLowerCase().trim() || ''
          return variantArome === normalizedSaveur || variantSaveur === normalizedSaveur
        })
        if (matchingVariant) {
          console.log(`✅ Spray plus trouvé par variante: "${p.name}" (variante: "${matchingVariant.label}")`)
          return true
        }
        // Vérifier si le champ gamme correspond
        if (normalizedGamme === normalizedSaveur) {
          console.log(`✅ Spray plus trouvé par gamme: "${p.name}" (gamme: "${p.gamme}")`)
          return true
        }
        // Vérifier si le nom contient la saveur (fallback plus large, mais moins prioritaire)
        if (normalizedName.includes(normalizedSaveur)) {
          console.log(`✅ Spray plus trouvé par nom contenant saveur: "${p.name}"`)
          return true
        }
        return false
      })
      
      // Si aucun produit n'est trouvé, essayer de le créer automatiquement
      if (!sprayPlus && selectedSaveur) {
        console.log(`⚠️ Produit Spray plus "${expectedSprayPlusName}" non trouvé, tentative de création...`)
        // Note: La création automatique se fait via stock-variables-helper, mais on peut essayer de déclencher
        // Pour l'instant, on ne fait rien ici car cela nécessite une action admin
      }
      
      if (sprayPlus) {
        console.log(`✅ Produit Spray plus sélectionné: "${sprayPlus.name}"`, {
          variantes: sprayPlus.variants?.length || 0
        })
        setSprayPlusProduct(sprayPlus)
        // Sélectionner la variante correspondant à la saveur pop-up duo (insensible à la casse)
        const normalizedSaveur = selectedSaveur.toLowerCase().trim()
        const variant = sprayPlus.variants?.find(v => {
          const variantArome = v.arome?.toLowerCase().trim() || ''
          const variantSaveur = v.saveur?.toLowerCase().trim() || ''
          return variantArome === normalizedSaveur || 
                 variantSaveur === normalizedSaveur ||
                 v.arome === selectedSaveur || 
                 v.saveur === selectedSaveur
        })
        if (variant) {
          console.log(`✅ Variante Spray plus sélectionnée: "${variant.label}" (arome: "${variant.arome || variant.saveur}")`)
          setSprayPlusVariant(variant)
        } else if (sprayPlus.variants && sprayPlus.variants.length > 0) {
          console.log(`⚠️ Aucune variante correspondante pour "${selectedSaveur}", utilisation de la première: "${sprayPlus.variants[0].label}"`)
          setSprayPlusVariant(sprayPlus.variants[0])
        } else {
          console.warn(`⚠️ Aucune variante disponible pour "${sprayPlus.name}"`)
          setSprayPlusVariant(null)
        }
      } else {
        console.warn(`⚠️ Aucun produit Spray plus trouvé pour la saveur "${selectedSaveur}"`)
        setSprayPlusProduct(null)
        setSprayPlusVariant(null)
      }
    }
    
    loadProducts().catch(error => {
      console.error('Erreur lors du chargement des produits Flash boost/Spray plus:', error)
    })
    const unsubscribe = onProductsUpdate(() => {
      loadProducts().catch(error => {
        console.error('Erreur lors du rechargement des produits:', error)
      })
    })
    return unsubscribe
  }, [selectedSaveur]) // Ajouter selectedSaveur comme dépendance pour recharger quand la saveur change
  
  // Synchroniser les variantes avec la saveur pop-up duo sélectionnée
  useEffect(() => {
    if (flashBoostProduct && flashBoostProduct.variants && flashBoostProduct.variants.length > 0) {
      // Chercher d'abord par arome, puis par saveur (pour compatibilité), insensible à la casse
      const normalizedSaveur = selectedSaveur.toLowerCase().trim()
      const variant = flashBoostProduct.variants.find(v => {
        const variantArome = v.arome?.toLowerCase().trim() || ''
        const variantSaveur = v.saveur?.toLowerCase().trim() || ''
        return variantArome === normalizedSaveur || 
               variantSaveur === normalizedSaveur ||
               v.arome === selectedSaveur || 
               v.saveur === selectedSaveur
      })
      
      if (variant) {
        console.log(`✅ Variante Flash boost synchronisée: "${variant.label}" pour saveur "${selectedSaveur}"`)
        setFlashBoostVariant(variant)
      } else {
        // Si aucune variante ne correspond exactement, utiliser la première disponible
        console.log(`⚠️ Aucune variante Flash boost exacte trouvée pour "${selectedSaveur}", utilisation de la première: "${flashBoostProduct.variants[0].label}"`)
        setFlashBoostVariant(flashBoostProduct.variants[0])
      }
    }
    
    if (sprayPlusProduct && sprayPlusProduct.variants && sprayPlusProduct.variants.length > 0) {
      // Chercher d'abord par arome, puis par saveur (pour compatibilité), insensible à la casse
      const normalizedSaveur = selectedSaveur.toLowerCase().trim()
      const variant = sprayPlusProduct.variants.find(v => {
        const variantArome = v.arome?.toLowerCase().trim() || ''
        const variantSaveur = v.saveur?.toLowerCase().trim() || ''
        return variantArome === normalizedSaveur || 
               variantSaveur === normalizedSaveur ||
               v.arome === selectedSaveur || 
               v.saveur === selectedSaveur
      })
      
      if (variant) {
        console.log(`✅ Variante Spray plus synchronisée: "${variant.label}" pour saveur "${selectedSaveur}"`)
        setSprayPlusVariant(variant)
      } else {
        // Si aucune variante ne correspond exactement, utiliser la première disponible
        console.log(`⚠️ Aucune variante Spray plus exacte trouvée pour "${selectedSaveur}", utilisation de la première: "${sprayPlusProduct.variants[0].label}"`)
        setSprayPlusVariant(sprayPlusProduct.variants[0])
      }
    }
  }, [selectedSaveur, flashBoostProduct, sprayPlusProduct])
  
  // Écouter les mises à jour du stock
  useEffect(() => {
    const unsubscribe = onStockUpdate(() => {
      forceUpdate(prev => prev + 1)
    })
      return unsubscribe
    }, [])
    
    // Mettre à jour la variante Pop-up Duo quand la forme change
    useEffect(() => {
      if (popupDuoProduct && selectedForme && popupDuoProduct.variants) {
        const variant = popupDuoProduct.variants.find(v => 
          v.forme === selectedForme || v.label === selectedForme
        )
        setPopupDuoVariant(variant || null)
      } else {
        setPopupDuoVariant(null)
      }
    }, [selectedForme, popupDuoProduct])

  // Surveiller les changements du panier pour ouvrir le modal automatiquement
  useEffect(() => {
    // Calculer directement si on doit ouvrir le modal
    // Utiliser startsWith pour matcher les noms de produits dynamiques (ex: "Pop-up Duo Mûre cassis")
    const eligibleItems = cartItems.filter(item => !item.isGratuit && item.produit.startsWith('Pop-up Duo'))
    const total = eligibleItems.reduce((sum, item) => sum + item.quantite, 0)
    const neededGratuits = Math.floor(total / 4)
    const existingGratuits = cartItems.filter(item => item.isGratuit && item.produit.startsWith('Pop-up Duo')).length
    
    // Afficher le modal si on a 4 articles ou plus et qu'il manque des articles gratuits
    // ET que le modal n'est pas déjà ouvert
    if (total >= 4 && neededGratuits > existingGratuits && !showPromoModal) {
      setShowPromoModal(true)
    }
  }, [cartItems, showPromoModal])

  // Formes à 7.99€
  const formesPrixReduit = ['10mm', 'Dumbels 12/16mm', '16mm']
  
  // Calcul du prix selon la forme
  const getPrice = () => {
    const productId = getPopUpDuoId(selectedSaveur, selectedForme)
    const defaultPrice = formesPrixReduit.includes(selectedForme) ? 7.99 : 8.99
    return getPrixPersonnalise(prixPersonnalises, productId, defaultPrice, promotion, 'pop-up duo', undefined)
  }
  
  // Calcul du prix pour Flash boost
  const getFlashBoostPrice = () => {
    if (flashBoostVariant) {
      return flashBoostVariant.price
    }
    return 10.99
  }
  
  // Calcul du prix pour Spray plus
  const getSprayPlusPrice = () => {
    if (sprayPlusVariant) {
      return sprayPlusVariant.price
    }
    return 5.99
  }

  // Obtenir le stock disponible pour Pop-up Duo (variante)
  const getPopUpDuoStock = () => {
    const productId = getPopUpDuoId(selectedSaveur, selectedForme)
    // Pour l'instant, on retourne -1 (illimité) car on n'a pas de productId/variantId dans le système centralisé
    // TODO: Intégrer avec le système de produits centralisé
    return -1
  }
  
  // Obtenir le stock disponible pour Flash boost
  const getFlashBoostStock = () => {
    if (flashBoostProduct && flashBoostVariant) {
      return getAvailableStockSync(flashBoostProduct.id, flashBoostVariant.id)
    }
    return -1
  }
  
  // Obtenir le stock disponible pour Spray plus
  const getSprayPlusStock = () => {
    if (sprayPlusProduct && sprayPlusVariant) {
      return getAvailableStockSync(sprayPlusProduct.id, sprayPlusVariant.id)
    }
    return -1
  }
  
  const handleQuantityChange = (newQuantity: number) => {
    // Plus de limite de stock - on permet de commander plus que le stock disponible
    setQuantity(Math.max(1, newQuantity))
  }
  
  const handleFlashBoostQuantityChange = (newQuantity: number) => {
    // Plus de limite de stock - on permet de commander plus que le stock disponible
    setFlashBoostQuantity(Math.max(1, newQuantity))
  }
  
  const handleSprayPlusQuantityChange = (newQuantity: number) => {
    // Plus de limite de stock - on permet de commander plus que le stock disponible
    setSprayPlusQuantity(Math.max(1, newQuantity))
  }

  const handleAddToCart = async () => {
    console.log('[PopupsPage] handleAddToCart appelé', {
      selectedSaveur,
      selectedForme,
      quantity,
      popupDuoProduct: popupDuoProduct?.name,
      popupDuoVariant: popupDuoVariant?.label
    })
    
    // Vérifier que le produit et la variante sont disponibles
    if (!popupDuoProduct) {
      console.error('[PopupsPage] Produit Pop-up Duo non trouvé pour saveur:', selectedSaveur)
      alert(`❌ Produit "Pop-up Duo ${selectedSaveur}" non trouvé.\n\n💡 Vérifiez que le produit existe dans Admin → Produits.`)
      return
    }
    
    if (!popupDuoVariant) {
      console.error('[PopupsPage] Variante non trouvée pour forme:', selectedForme)
      alert(`❌ Variante "${selectedForme}" non trouvée pour "Pop-up Duo ${selectedSaveur}".\n\n💡 Vérifiez que la variante existe dans Admin → Produits.`)
      return
    }
    
    try {
      const availableStock = await getAvailableStock(popupDuoProduct.id, popupDuoVariant.id)
      console.log('[PopupsPage] Stock disponible:', availableStock)
      
      // Vérifier le stock si défini (mais permettre l'ajout même avec stock insuffisant)
      // Le message de pré-commande sera affiché dans addToCart si nécessaire
      
      await addToCart({
        produit: popupDuoProduct.name,
        arome: selectedSaveur,
        taille: selectedForme,
        quantite: quantity,
        prix: popupDuoVariant.price || getPrice(),
        productId: popupDuoProduct.id,
        variantId: popupDuoVariant.id,
        category: 'pop-up duo',
        gamme: selectedSaveur
      })
      
      console.log('[PopupsPage] Ajout au panier réussi')
      
      // Le modal s'ouvrira automatiquement via le useEffect si nécessaire
      // On affiche un message seulement si le modal ne va pas s'ouvrir
      setTimeout(() => {
        if (!shouldShowPromoModal('Pop-up Duo')) {
          alert('Pop-up Duo ajouté au panier !')
        }
      }, 100)
    } catch (error) {
      console.error('[PopupsPage] Erreur lors de l\'ajout au panier:', error)
      alert(`Erreur lors de l'ajout au panier. Veuillez réessayer.`)
    }
  }

  const handlePromoConfirm = (characteristics: PromoCharacteristics) => {
    addPromoItem('Pop-up Duo', characteristics)
    setShowPromoModal(false)
    alert('Article offert ajouté au panier avec vos choix !')
  }

  const handleFlashBoostAdd = async () => {
    // Vérifier d'abord si le produit existe
    if (!flashBoostProduct) {
      alert(`❌ Produit Flash boost non trouvé pour la saveur "${selectedSaveur}".\n\n💡 Vérifiez que le produit existe dans Admin → Flash/Spray Variables.`)
      return
    }
    
    // Si aucune variante n'est sélectionnée, essayer de trouver une variante correspondante
    let variantToUse = flashBoostVariant
    
    if (!variantToUse && flashBoostProduct.variants && flashBoostProduct.variants.length > 0) {
      // Chercher une variante qui correspond à la saveur sélectionnée
      variantToUse = flashBoostProduct.variants.find(v => 
        v.arome === selectedSaveur || 
        v.saveur === selectedSaveur ||
        v.arome?.toLowerCase() === selectedSaveur.toLowerCase() ||
        v.saveur?.toLowerCase() === selectedSaveur.toLowerCase()
      ) || null
      
      // Si aucune variante ne correspond, utiliser la première disponible
      if (!variantToUse) {
        variantToUse = flashBoostProduct.variants[0]
        console.log(`⚠️ Aucune variante exacte trouvée, utilisation de la première: "${variantToUse.label}"`)
      }
      
      // Mettre à jour l'état pour la prochaine fois
      setFlashBoostVariant(variantToUse)
    }
    
    if (!variantToUse) {
      alert(`❌ Aucune variante Flash boost disponible pour la saveur "${selectedSaveur}".\n\n💡 Vérifiez que les variantes existent dans Admin → Flash/Spray Variables.`)
      return
    }
    
    // Le stock sera vérifié dans addToCart avec message de pré-commande si nécessaire
    
    await addToCart({
      produit: flashBoostProduct.name,
      arome: variantToUse.arome || variantToUse.saveur || variantToUse.label || selectedSaveur,
      quantite: flashBoostQuantity,
      prix: variantToUse.price || getFlashBoostPrice(),
      productId: flashBoostProduct.id,
      variantId: variantToUse.id
    })
    alert(`✅ Flash boost ${variantToUse.label} ajouté au panier !`)
  }

  const handleSprayPlusAdd = async () => {
    // Vérifier d'abord si le produit existe
    if (!sprayPlusProduct) {
      alert(`❌ Produit Spray plus non trouvé pour la saveur "${selectedSaveur}".\n\n💡 Vérifiez que le produit existe dans Admin → Flash/Spray Variables.`)
      return
    }
    
    // Si aucune variante n'est sélectionnée, essayer de trouver une variante correspondante
    let variantToUse = sprayPlusVariant
    
    if (!variantToUse && sprayPlusProduct.variants && sprayPlusProduct.variants.length > 0) {
      // Chercher une variante qui correspond à la saveur sélectionnée
      variantToUse = sprayPlusProduct.variants.find(v => 
        v.arome === selectedSaveur || 
        v.saveur === selectedSaveur ||
        v.arome?.toLowerCase() === selectedSaveur.toLowerCase() ||
        v.saveur?.toLowerCase() === selectedSaveur.toLowerCase()
      ) || null
      
      // Si aucune variante ne correspond, utiliser la première disponible
      if (!variantToUse) {
        variantToUse = sprayPlusProduct.variants[0]
        console.log(`⚠️ Aucune variante exacte trouvée, utilisation de la première: "${variantToUse.label}"`)
      }
      
      // Mettre à jour l'état pour la prochaine fois
      setSprayPlusVariant(variantToUse)
    }
    
    if (!variantToUse) {
      alert(`❌ Aucune variante Spray plus disponible pour la saveur "${selectedSaveur}".\n\n💡 Vérifiez que les variantes existent dans Admin → Flash/Spray Variables.`)
      return
    }
    
    // Le stock sera vérifié dans addToCart avec message de pré-commande si nécessaire
    
    await addToCart({
      produit: sprayPlusProduct.name,
      arome: variantToUse.arome || variantToUse.saveur || variantToUse.label || selectedSaveur,
      quantite: sprayPlusQuantity,
      prix: variantToUse.price || getSprayPlusPrice(),
      productId: sprayPlusProduct.id,
      variantId: variantToUse.id
    })
    alert(`✅ Spray plus ${variantToUse.label} ajouté au panier !`)
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-4">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Pop-up Duo</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
            Créations uniques artisanales pour une présentation optimale.
          </p>
          {/* Message de promotion */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 rounded-xl p-4 max-w-2xl mx-auto mb-6 shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">🎁</span>
              <h3 className="text-xl font-bold text-yellow-500">PROMOTION 4+1</h3>
            </div>
            <p className="text-base text-white font-semibold text-center">
              Pour chaque lot de <span className="text-yellow-400">4 Pop-up Duo</span> achetés, recevez <span className="text-yellow-400">1 article offert</span> de votre choix !
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Configuration Panel */}
          <div className="space-y-4">
            {/* Saveur */}
            <div>
              <label className="block text-lg font-semibold mb-2">Saveur</label>
              <div className="grid grid-cols-3 gap-3">
                {(Array.isArray(saveurs) ? saveurs : []).map((saveur) => (
                  <button
                    key={saveur}
                    onClick={() => setSelectedSaveur(saveur)}
                    className={`h-16 rounded-lg border-2 transition-all text-center flex items-center justify-center ${
                      selectedSaveur === saveur
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="font-semibold text-sm px-2">{saveur}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Forme */}
            <div>
              <label className="block text-lg font-semibold mb-2">Forme</label>
              <div className="grid grid-cols-2 gap-3">
                {(Array.isArray(formes) ? formes : []).map((forme) => (
                  <button
                    key={forme}
                    onClick={() => setSelectedForme(forme)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedForme === forme
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-noir-700 hover:border-noir-600'
                    }`}
                  >
                    <div className="text-sm font-bold">{forme}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-lg font-semibold mb-2">Quantité</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-20 text-center bg-noir-800 border border-noir-700 rounded-lg py-2"
                  min="1"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Preview & Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              {/* Preview Visuel */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Aperçu</h3>
                <div className="flex items-center justify-center aspect-square max-w-xs mx-auto bg-noir-900 rounded-lg border border-noir-700">
                  {(() => {
                    const variantKey = `${selectedSaveur}`.trim().toLowerCase() + '||' + `${selectedForme}`.trim().toLowerCase()
                    const variantImage = (selectedSaveur && selectedForme) ? variantImages?.[variantKey] : undefined
                    const formeImage = selectedForme ? formeImages?.[selectedForme] : undefined
                    const productImage = popupDuoProduct ? getProductFirstImage(popupDuoProduct) : null
                    const img = variantImage || formeImage || productImage
                    if (img) {
                      return <img src={img} alt={`Pop-up Duo ${selectedSaveur} ${selectedForme}`} className="w-full h-full object-cover rounded-lg" />
                    }
                    return <Package className="w-24 h-24 text-gray-500" />
                  })()}
                </div>
              </div>

              <h2 className="text-base font-semibold mb-3">Résumé de la commande</h2>
              
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-gray-400">
                  <span>Saveur:</span>
                  <span className="text-white">{selectedSaveur}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Forme:</span>
                  <span className="text-white">{selectedForme}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Quantité:</span>
                  <span className="text-white">{quantity}</span>
                </div>
                <div className="border-t border-noir-700 pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total:</span>
                    <span className="text-yellow-500">{(getPrice() * quantity).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Message d'avertissement si quantité dépasse le stock */}
              {(() => {
                const availableStock = getPopUpDuoStock()
                if (availableStock > 0 && quantity > availableStock) {
                  return (
                    <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-2 mb-3 text-xs">
                      <p className="text-orange-400 font-medium">⚠️ Délai prolongé</p>
                      <p className="text-orange-300/80">
                        {availableStock} en stock. Délai de 8-10 jours ouvrés pour la totalité.
                      </p>
                    </div>
                  )
                }
                if (availableStock === 0) {
                  return (
                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-2 mb-3 text-xs">
                      <p className="text-blue-400 font-medium">⏳ Sur commande</p>
                      <p className="text-blue-300/80">Délai : 8-10 jours ouvrés.</p>
                    </div>
                  )
                }
                return null
              })()}

              <button
                onClick={handleAddToCart}
                className="btn btn-primary btn-sm w-full mb-8"
              >
                <ShoppingCart className="w-4 h-4" />
                {(() => {
                  const availableStock = getPopUpDuoStock()
                  if (availableStock === 0) return 'Ajouter (sur commande)'
                  if (availableStock > 0 && quantity > availableStock) return 'Ajouter (délai prolongé)'
                  return 'Ajouter au panier'
                })()}
              </button>

              {/* Section Renforcez votre commande (Option 1) */}
              <div className="border-t border-noir-700 pt-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>✨</span>
                  Renforcez votre commande
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Flash boost */}
                  <div className="bg-noir-900/50 border border-noir-700 rounded-lg p-3 hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <h4 className="font-bold text-sm">Flash boost</h4>
                    </div>
                    <p className="text-yellow-500 text-xs mb-3">{getFlashBoostPrice().toFixed(2)}€ / 100ml</p>
                    {!flashBoostProduct ? (
                      <div className="text-gray-400 text-xs mb-2">
                        <p className="mb-1">
                          {selectedSaveur ? `Aucun produit Flash boost trouvé pour "${selectedSaveur}"` : 'Sélectionnez une saveur'}
                        </p>
                        {selectedSaveur && (
                          <p className="text-yellow-400 text-xs">
                            💡 Allez dans Admin → Flash/Spray Variables pour créer le produit
                          </p>
                        )}
                      </div>
                    ) : !flashBoostProduct.variants || flashBoostProduct.variants.length === 0 ? (
                      <p className="text-gray-400 text-xs mb-2">Aucune variante disponible</p>
                    ) : (
                      <select
                        value={flashBoostVariant?.id || ''}
                        onChange={(e) => {
                          const variant = flashBoostProduct.variants?.find(v => v.id === e.target.value)
                          if (variant) {
                            setFlashBoostVariant(variant)
                          }
                        }}
                        className="w-full bg-noir-800 border border-noir-700 rounded px-2 py-1 text-xs mb-2 text-white"
                      >
                        {flashBoostProduct.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => handleFlashBoostQuantityChange(flashBoostQuantity - 1)}
                        disabled={flashBoostQuantity <= 1}
                        className="px-2 py-1 bg-noir-800 border border-noir-700 rounded text-xs hover:bg-noir-700 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={flashBoostQuantity}
                        onChange={(e) => handleFlashBoostQuantityChange(parseInt(e.target.value) || 1)}
                        className="w-12 text-center bg-noir-800 border border-noir-700 rounded py-1 text-xs text-white"
                        min="1"
                      />
                      <button
                        onClick={() => handleFlashBoostQuantityChange(flashBoostQuantity + 1)}
                        className="px-2 py-1 bg-noir-800 border border-noir-700 rounded text-xs hover:bg-noir-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={handleFlashBoostAdd}
                      className="w-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded px-2 py-1 text-xs font-semibold hover:bg-yellow-500/30 transition-colors"
                    >
                      {(() => {
                        if (!flashBoostProduct) return 'Produit non trouvé'
                        const availableStock = getFlashBoostStock()
                        if (availableStock === 0) return 'Ajouter (sur commande)'
                        if (availableStock > 0 && flashBoostQuantity > availableStock) return 'Ajouter (délai)'
                        return 'Ajouter'
                      })()}
                    </button>
                  </div>

                  {/* Spray plus */}
                  <div className="bg-noir-900/50 border border-noir-700 rounded-lg p-3 hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet className="w-4 h-4 text-yellow-500" />
                      <h4 className="font-bold text-sm">Spray plus</h4>
                    </div>
                    <p className="text-yellow-500 text-xs mb-3">{getSprayPlusPrice().toFixed(2)}€ / 30ml</p>
                    {!sprayPlusProduct ? (
                      <div className="text-gray-400 text-xs mb-2">
                        <p className="mb-1">
                          {selectedSaveur ? `Aucun produit Spray plus trouvé pour "${selectedSaveur}"` : 'Sélectionnez une saveur'}
                        </p>
                        {selectedSaveur && (
                          <p className="text-yellow-400 text-xs">
                            💡 Allez dans Admin → Flash/Spray Variables pour créer le produit
                          </p>
                        )}
                      </div>
                    ) : !sprayPlusProduct.variants || sprayPlusProduct.variants.length === 0 ? (
                      <p className="text-gray-400 text-xs mb-2">Aucune variante disponible</p>
                    ) : (
                      <select
                        value={sprayPlusVariant?.id || ''}
                        onChange={(e) => {
                          const variant = sprayPlusProduct.variants?.find(v => v.id === e.target.value)
                          if (variant) {
                            setSprayPlusVariant(variant)
                          }
                        }}
                        className="w-full bg-noir-800 border border-noir-700 rounded px-2 py-1 text-xs mb-2 text-white"
                      >
                        {sprayPlusProduct.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => handleSprayPlusQuantityChange(sprayPlusQuantity - 1)}
                        disabled={sprayPlusQuantity <= 1}
                        className="px-2 py-1 bg-noir-800 border border-noir-700 rounded text-xs hover:bg-noir-700 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={sprayPlusQuantity}
                        onChange={(e) => handleSprayPlusQuantityChange(parseInt(e.target.value) || 1)}
                        className="w-12 text-center bg-noir-800 border border-noir-700 rounded py-1 text-xs text-white"
                        min="1"
                      />
                      <button
                        onClick={() => handleSprayPlusQuantityChange(sprayPlusQuantity + 1)}
                        className="px-2 py-1 bg-noir-800 border border-noir-700 rounded text-xs hover:bg-noir-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={handleSprayPlusAdd}
                      className="w-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded px-2 py-1 text-xs font-semibold hover:bg-yellow-500/30 transition-colors"
                    >
                      {(() => {
                        if (!sprayPlusProduct) return 'Produit non trouvé'
                        const availableStock = getSprayPlusStock()
                        if (availableStock === 0) return 'Ajouter (sur commande)'
                        if (availableStock > 0 && sprayPlusQuantity > availableStock) return 'Ajouter (délai)'
                        return 'Ajouter'
                      })()}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour choisir l'article offert */}
      <PromoItemModal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        onConfirm={handlePromoConfirm}
        productType="Pop-up Duo"
        defaultCharacteristics={{
          arome: selectedSaveur,
          taille: selectedForme
        }}
      />
    </div>
  )  
}  