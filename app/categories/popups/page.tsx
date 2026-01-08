'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Factory, Package, Zap, Droplet } from 'lucide-react'
import { loadPopupDuoSaveurs, loadPopupDuoFormes, onPopupDuoSaveursUpdate, onPopupDuoFormesUpdate } from '@/lib/popup-variables-manager'
import { useCart } from '@/contexts/CartContext'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { getPopUpDuoId, getPrixPersonnalise } from '@/lib/price-utils'
import { getAvailableStock, getAvailableStockSync, onStockUpdate } from '@/lib/stock-manager'
import { onProductsUpdate, type Product, type ProductVariant } from '@/lib/products-manager'
import PromoItemModal, { PromoCharacteristics } from '@/components/PromoItemModal'

export default function PopupsPage() {
  const [saveurs, setSaveurs] = useState<string[]>([])
  const [formes, setFormes] = useState<string[]>([])
  const [selectedSaveur, setSelectedSaveur] = useState('')
  const [selectedForme, setSelectedForme] = useState('')
  
  // Charger les saveurs et formes depuis le gestionnaire
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Chargement des saveurs et formes Pop-up Duo...')
        const loadedSaveurs = await loadPopupDuoSaveurs()
        const loadedFormes = await loadPopupDuoFormes()
        const saveursArray = Array.isArray(loadedSaveurs) ? loadedSaveurs : []
        const formesArray = Array.isArray(loadedFormes) ? loadedFormes : []
        console.log(`✅ Saveurs chargées: ${saveursArray.length}`, saveursArray)
        console.log(`✅ Formes chargées: ${formesArray.length}`, formesArray)
        setSaveurs(saveursArray)
        setFormes(formesArray)
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
      }
    }
    
    loadData()
    const unsubscribeSaveurs = onPopupDuoSaveursUpdate(loadData)
    const unsubscribeFormes = onPopupDuoFormesUpdate(loadData)
    
    return () => {
      unsubscribeSaveurs()
      unsubscribeFormes()
    }
  }, [])
  const [quantity, setQuantity] = useState(1)
  const { addToCart, cartItems, shouldShowPromoModal, addPromoItem } = useCart()
  const prixPersonnalises = usePrixPersonnalises()
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:75',message:'loadProducts entry',data:{selectedSaveur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'})}).catch(()=>{});
      // #endregion
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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:95',message:'Flash boost products loaded',data:{selectedSaveur,flashBoostCount:uniqueFlashBoost.length,flashBoostProducts:uniqueFlashBoost.map(p=>({name:p.name,category:p.category,gamme:p.gamme}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:108',message:'Spray plus products loaded',data:{selectedSaveur,sprayPlusCount:uniqueSprayPlus.length,sprayPlusProducts:uniqueSprayPlus.map(p=>({name:p.name,category:p.category,gamme:p.gamme}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:166',message:'Flash boost product found',data:{productName:flashBoost.name,productId:flashBoost.id,variantsCount:flashBoost.variants?.length||0,selectedSaveur,variants:flashBoost.variants?.map(v=>({label:v.label,arome:v.arome,saveur:v.saveur}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:182',message:'Flash boost variant matched',data:{variantLabel:variant.label,variantArome:variant.arome,variantSaveur:variant.saveur,selectedSaveur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,E'})}).catch(()=>{});
          // #endregion
          setFlashBoostVariant(variant)
        } else if (flashBoost.variants && flashBoost.variants.length > 0) {
          console.log(`⚠️ Aucune variante correspondante pour "${selectedSaveur}", utilisation de la première: "${flashBoost.variants[0].label}"`)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:185',message:'Flash boost variant fallback to first',data:{firstVariantLabel:flashBoost.variants[0].label,firstVariantArome:flashBoost.variants[0].arome,firstVariantSaveur:flashBoost.variants[0].saveur,selectedSaveur,allVariants:flashBoost.variants.map(v=>({label:v.label,arome:v.arome,saveur:v.saveur}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,E'})}).catch(()=>{});
          // #endregion
          setFlashBoostVariant(flashBoost.variants[0])
        } else {
          console.warn(`⚠️ Aucune variante disponible pour "${flashBoost.name}"`)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:188',message:'Flash boost no variants',data:{productName:flashBoost.name,selectedSaveur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setFlashBoostVariant(null)
        }
      } else {
        console.warn(`⚠️ Aucun produit Flash boost trouvé pour la saveur "${selectedSaveur}"`)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:192',message:'Flash boost product not found',data:{selectedSaveur,allProducts:uniqueFlashBoost.map(p=>({name:p.name,category:p.category,gamme:p.gamme}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:263',message:'Spray plus product found',data:{productName:sprayPlus.name,productId:sprayPlus.id,variantsCount:sprayPlus.variants?.length||0,selectedSaveur,variants:sprayPlus.variants?.map(v=>({label:v.label,arome:v.arome,saveur:v.saveur}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:279',message:'Spray plus variant matched',data:{variantLabel:variant.label,variantArome:variant.arome,variantSaveur:variant.saveur,selectedSaveur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,E'})}).catch(()=>{});
          // #endregion
          setSprayPlusVariant(variant)
        } else if (sprayPlus.variants && sprayPlus.variants.length > 0) {
          console.log(`⚠️ Aucune variante correspondante pour "${selectedSaveur}", utilisation de la première: "${sprayPlus.variants[0].label}"`)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:282',message:'Spray plus variant fallback to first',data:{firstVariantLabel:sprayPlus.variants[0].label,firstVariantArome:sprayPlus.variants[0].arome,firstVariantSaveur:sprayPlus.variants[0].saveur,selectedSaveur,allVariants:sprayPlus.variants.map(v=>({label:v.label,arome:v.arome,saveur:v.saveur}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,E'})}).catch(()=>{});
          // #endregion
          setSprayPlusVariant(sprayPlus.variants[0])
        } else {
          console.warn(`⚠️ Aucune variante disponible pour "${sprayPlus.name}"`)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:285',message:'Spray plus no variants',data:{productName:sprayPlus.name,selectedSaveur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setSprayPlusVariant(null)
        }
      } else {
        console.warn(`⚠️ Aucun produit Spray plus trouvé pour la saveur "${selectedSaveur}"`)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:289',message:'Spray plus product not found',data:{selectedSaveur,allProducts:uniqueSprayPlus.map(p=>({name:p.name,category:p.category,gamme:p.gamme}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setSprayPlusProduct(null)
        setSprayPlusVariant(null)
      }
    }
    
    loadProducts().catch(error => {
      console.error('Erreur lors du chargement des produits Flash boost/Spray plus:', error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:335',message:'loadProducts error',data:{selectedSaveur,error:error?.message||'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    const eligibleItems = cartItems.filter(item => !item.isGratuit && item.produit === 'Pop-up Duo')
    const total = eligibleItems.reduce((sum, item) => sum + item.quantite, 0)
    const neededGratuits = Math.floor(total / 4)
    const existingGratuits = cartItems.filter(item => item.isGratuit && item.produit === 'Pop-up Duo').length
    
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
    return getPrixPersonnalise(prixPersonnalises, productId, defaultPrice)
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
    const availableStock = getPopUpDuoStock()
    if (availableStock >= 0 && newQuantity > availableStock) {
      return // Ne pas permettre de dépasser le stock
    }
    setQuantity(Math.max(1, newQuantity))
  }
  
  const handleFlashBoostQuantityChange = (newQuantity: number) => {
    const availableStock = getFlashBoostStock()
    if (availableStock >= 0 && newQuantity > availableStock) {
      return
    }
    setFlashBoostQuantity(Math.max(1, newQuantity))
  }
  
  const handleSprayPlusQuantityChange = (newQuantity: number) => {
    const availableStock = getSprayPlusStock()
    if (availableStock >= 0 && newQuantity > availableStock) {
      return
    }
    setSprayPlusQuantity(Math.max(1, newQuantity))
  }

  const handleAddToCart = async () => {
    // Vérifier que le produit et la variante sont disponibles
    if (!popupDuoProduct) {
      alert(`❌ Produit "Pop-up Duo ${selectedSaveur}" non trouvé.`)
      return
    }
    
    if (!popupDuoVariant) {
      alert(`❌ Variante "${selectedForme}" non trouvée pour "Pop-up Duo ${selectedSaveur}".`)
      return
    }
    
    const availableStock = await getAvailableStock(popupDuoProduct.id, popupDuoVariant.id)
    
    // Vérifier le stock si défini (mais permettre l'ajout même avec stock à zéro)
    if (availableStock >= 0) {
      // Si le stock est insuffisant mais pas à zéro, bloquer
      if (availableStock > 0 && availableStock < quantity) {
        alert(`Stock insuffisant. Stock disponible : ${availableStock}`)
        return
      }
      // Si le stock est à zéro, le message sera affiché dans addToCart
    }
    
    await addToCart({
      produit: popupDuoProduct.name,
      arome: selectedSaveur,
      taille: selectedForme,
      quantite: quantity,
      prix: popupDuoVariant.price || getPrice(),
      productId: popupDuoProduct.id,
      variantId: popupDuoVariant.id
    })
    
    // Le modal s'ouvrira automatiquement via le useEffect si nécessaire
    // On affiche un message seulement si le modal ne va pas s'ouvrir
    setTimeout(() => {
      if (!shouldShowPromoModal('Pop-up Duo')) {
        alert('Pop-up Duo ajouté au panier !')
      }
    }, 100)
  }

  const handlePromoConfirm = (characteristics: PromoCharacteristics) => {
    addPromoItem('Pop-up Duo', characteristics)
    setShowPromoModal(false)
    alert('Article offert ajouté au panier avec vos choix !')
  }

  const handleFlashBoostAdd = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:480',message:'handleFlashBoostAdd entry',data:{selectedSaveur,flashBoostProduct:flashBoostProduct?{name:flashBoostProduct.name,id:flashBoostProduct.id}:null,flashBoostVariant:flashBoostVariant?{label:flashBoostVariant.label,arome:flashBoostVariant.arome,saveur:flashBoostVariant.saveur,id:flashBoostVariant.id}:null,flashBoostQuantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    // Vérifier d'abord si le produit existe
    if (!flashBoostProduct) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:483',message:'Flash boost product missing',data:{selectedSaveur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:509',message:'Flash boost variant missing',data:{selectedSaveur,productName:flashBoostProduct.name,availableVariants:flashBoostProduct.variants?.map(v=>({label:v.label,arome:v.arome,saveur:v.saveur}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      alert(`❌ Aucune variante Flash boost disponible pour la saveur "${selectedSaveur}".\n\n💡 Vérifiez que les variantes existent dans Admin → Flash/Spray Variables.`)
      return
    }
    
    const availableStock = getFlashBoostStock()
    
    // Vérifier le stock si défini (mais permettre l'ajout même avec stock à zéro)
    if (availableStock >= 0) {
      // Si le stock est insuffisant mais pas à zéro, bloquer
      if (availableStock > 0 && availableStock < flashBoostQuantity) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:519',message:'Flash boost stock insufficient',data:{availableStock,flashBoostQuantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        alert(`Stock insuffisant. Stock disponible : ${availableStock}`)
        return
      }
      // Si le stock est à zéro, le message sera affiché dans addToCart
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:525',message:'Flash boost before addToCart',data:{productName:flashBoostProduct.name,productId:flashBoostProduct.id,variantLabel:variantToUse.label,variantId:variantToUse.id,arome:variantToUse.arome||variantToUse.saveur||variantToUse.label||selectedSaveur,quantity:flashBoostQuantity,price:variantToUse.price||getFlashBoostPrice()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    await addToCart({
      produit: flashBoostProduct.name,
      arome: variantToUse.arome || variantToUse.saveur || variantToUse.label || selectedSaveur,
      quantite: flashBoostQuantity,
      prix: variantToUse.price || getFlashBoostPrice(),
      productId: flashBoostProduct.id,
      variantId: variantToUse.id
    })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:535',message:'Flash boost addToCart success',data:{variantLabel:variantToUse.label},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    alert(`✅ Flash boost ${variantToUse.label} ajouté au panier !`)
  }

  const handleSprayPlusAdd = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:540',message:'handleSprayPlusAdd entry',data:{selectedSaveur,sprayPlusProduct:sprayPlusProduct?{name:sprayPlusProduct.name,id:sprayPlusProduct.id}:null,sprayPlusVariant:sprayPlusVariant?{label:sprayPlusVariant.label,arome:sprayPlusVariant.arome,saveur:sprayPlusVariant.saveur,id:sprayPlusVariant.id}:null,sprayPlusQuantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    // Vérifier d'abord si le produit existe
    if (!sprayPlusProduct) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:543',message:'Spray plus product missing',data:{selectedSaveur},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:569',message:'Spray plus variant missing',data:{selectedSaveur,productName:sprayPlusProduct.name,availableVariants:sprayPlusProduct.variants?.map(v=>({label:v.label,arome:v.arome,saveur:v.saveur}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      alert(`❌ Aucune variante Spray plus disponible pour la saveur "${selectedSaveur}".\n\n💡 Vérifiez que les variantes existent dans Admin → Flash/Spray Variables.`)
      return
    }
    
    const availableStock = getSprayPlusStock()
    
    // Vérifier le stock si défini (mais permettre l'ajout même avec stock à zéro)
    if (availableStock >= 0) {
      // Si le stock est insuffisant mais pas à zéro, bloquer
      if (availableStock > 0 && availableStock < sprayPlusQuantity) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:579',message:'Spray plus stock insufficient',data:{availableStock,sprayPlusQuantity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        alert(`Stock insuffisant. Stock disponible : ${availableStock}`)
        return
      }
      // Si le stock est à zéro, le message sera affiché dans addToCart
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:585',message:'Spray plus before addToCart',data:{productName:sprayPlusProduct.name,productId:sprayPlusProduct.id,variantLabel:variantToUse.label,variantId:variantToUse.id,arome:variantToUse.arome||variantToUse.saveur||variantToUse.label||selectedSaveur,quantity:sprayPlusQuantity,price:variantToUse.price||getSprayPlusPrice()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    await addToCart({
      produit: sprayPlusProduct.name,
      arome: variantToUse.arome || variantToUse.saveur || variantToUse.label || selectedSaveur,
      quantite: sprayPlusQuantity,
      prix: variantToUse.price || getSprayPlusPrice(),
      productId: sprayPlusProduct.id,
      variantId: variantToUse.id
    })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:595',message:'Spray plus addToCart success',data:{variantLabel:variantToUse.label},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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
                  disabled={(() => {
                    const availableStock = getPopUpDuoStock()
                    return availableStock >= 0 && availableStock < quantity + 1
                  })()}
                  className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <Package className="w-24 h-24 text-gray-500" />
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

              <button
                onClick={handleAddToCart}
                disabled={(() => {
                  const availableStock = getPopUpDuoStock()
                  return availableStock === 0 || (availableStock > 0 && availableStock < quantity)
                })()}
                className="btn btn-primary btn-sm w-full mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                {(() => {
                  const availableStock = getPopUpDuoStock()
                  if (availableStock === 0) return 'Stock épuisé'
                  if (availableStock > 0 && availableStock < quantity) return 'Stock insuffisant'
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
                        disabled={(() => {
                          const availableStock = getFlashBoostStock()
                          return availableStock >= 0 && availableStock < flashBoostQuantity + 1
                        })()}
                        className="px-2 py-1 bg-noir-800 border border-noir-700 rounded text-xs hover:bg-noir-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={handleFlashBoostAdd}
                      disabled={(() => {
                        // Ne pas désactiver si le produit n'existe pas, on affichera un message d'erreur
                        const hasProduct = !!flashBoostProduct
                        const hasVariant = !!flashBoostVariant
                        const availableStock = getFlashBoostStock()
                        const isDisabled = hasProduct && (availableStock === 0 || (availableStock > 0 && availableStock < flashBoostQuantity))
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:817',message:'Flash boost button disabled check',data:{hasProduct,hasVariant,availableStock,flashBoostQuantity,isDisabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                        return isDisabled
                      })()}
                      className="w-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded px-2 py-1 text-xs font-semibold hover:bg-yellow-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(() => {
                        if (!flashBoostProduct) return 'Produit non trouvé'
                        const availableStock = getFlashBoostStock()
                        if (availableStock === 0) return 'Stock épuisé'
                        if (availableStock > 0 && availableStock < flashBoostQuantity) return 'Stock insuffisant'
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
                        disabled={(() => {
                          const availableStock = getSprayPlusStock()
                          return availableStock >= 0 && availableStock < sprayPlusQuantity + 1
                        })()}
                        className="px-2 py-1 bg-noir-800 border border-noir-700 rounded text-xs hover:bg-noir-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={handleSprayPlusAdd}
                      disabled={(() => {
                        // Ne pas désactiver si le produit n'existe pas, on affichera un message d'erreur
                        const hasProduct = !!sprayPlusProduct
                        const hasVariant = !!sprayPlusVariant
                        const availableStock = getSprayPlusStock()
                        const isDisabled = hasProduct && (availableStock === 0 || (availableStock > 0 && availableStock < sprayPlusQuantity))
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popups/page.tsx:982',message:'Spray plus button disabled check',data:{hasProduct,hasVariant,availableStock,sprayPlusQuantity,isDisabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                        return isDisabled
                      })()}
                      className="w-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded px-2 py-1 text-xs font-semibold hover:bg-yellow-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(() => {
                        if (!sprayPlusProduct) return 'Produit non trouvé'
                        const availableStock = getSprayPlusStock()
                        if (availableStock === 0) return 'Stock épuisé'
                        if (availableStock > 0 && availableStock < sprayPlusQuantity) return 'Stock insuffisant'
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