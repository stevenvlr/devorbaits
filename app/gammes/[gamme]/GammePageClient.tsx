'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ShoppingCart, Factory, Package, Settings } from 'lucide-react'
import { decodeGamme, DIAMETRES_BOUILLETTES, CONDITIONNEMENTS, TAILLES_EQUILIBRES, TYPES_BOOSTERS } from '@/lib/constants'
import { useCart } from '@/contexts/CartContext'
import ProductModal from '@/components/ProductModal'
import GammeProductModal from '@/components/GammeProductModal'
import { usePrixPersonnalises } from '@/hooks/usePrixPersonnalises'
import { useGlobalPromotion } from '@/hooks/useGlobalPromotion'
import { getBouilletteId, getEquilibreId, getBoosterId, getPrixPersonnalise } from '@/lib/price-utils'
import { getAvailableStock, getAvailableStockSync, onStockUpdate } from '@/lib/stock-manager'
import { getProductsByCategory, getProductsByGamme, getProductsByCategorySync, onProductsUpdate, type Product, type ProductVariant } from '@/lib/products-manager'
import ProductCard from '@/components/ProductCard'

export default function GammePageClient() {
  const params = useParams()
  const gammeParam = params.gamme as string
  const [gamme, setGamme] = useState<string>('')
  const { addToCart } = useCart()

  // Charger la gamme uniquement côté client pour éviter les erreurs d'hydratation
  useEffect(() => {
    const decoded = decodeGamme(gammeParam)
    setGamme(decoded)
  }, [gammeParam])

  // États pour les modals
  const [bouilletteModalOpen, setBouilletteModalOpen] = useState(false)
  const [equilibreModalOpen, setEquilibreModalOpen] = useState(false)
  
  // États pour les modals de détails (clic sur image)
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null)
  const [selectedProductData, setSelectedProductData] = useState<{
    name: string
    price: number
    format?: string
    quantity: number
    onQuantityChange: (qty: number) => void
    onAddToCart: () => void
    description?: string
  } | null>(null)

  // États pour les bouillettes
  const [bouilletteDiametre, setBouilletteDiametre] = useState('16')
  const [bouilletteConditionnement, setBouilletteConditionnement] = useState(CONDITIONNEMENTS[0])
  const [bouilletteQuantity, setBouilletteQuantity] = useState(1)
  const [, forceUpdate] = useState(0) // Pour forcer la mise à jour du stock
  
  // Écouter les mises à jour du stock
  useEffect(() => {
    const unsubscribe = onStockUpdate(() => {
      forceUpdate(prev => prev + 1)
    })
    return unsubscribe
  }, [])

  // États pour les équilibrées
  const [equilibreTaille, setEquilibreTaille] = useState('10mm')
  const [equilibreQuantity, setEquilibreQuantity] = useState(1)

  // États pour les boosters
  const [boosterType, setBoosterType] = useState(TYPES_BOOSTERS[0])
  const [boosterQuantity, setBoosterQuantity] = useState(1)

  // États pour les produits spécifiques Krill Calamar
  const [stickMixQuantity, setStickMixQuantity] = useState(1)
  const [liquideKrillQuantity, setLiquideKrillQuantity] = useState(1)
  const [huilePoissonQuantity, setHuilePoissonQuantity] = useState(1)
  const [farineKrillQuantity, setFarineKrillQuantity] = useState(1)
  const [farineCalamarQuantity, setFarineCalamarQuantity] = useState(1)

  // États pour les produits spécifiques Méga Tutti
  const [liqueurMaisQuantity, setLiqueurMaisQuantity] = useState(1)
  const [huileChenevixQuantity, setHuileChenevixQuantity] = useState(1)
  const [birdFoodQuantity, setBirdFoodQuantity] = useState(1)

  // États pour les produits spécifiques Red Devil
  const [huileRedDevilQuantity, setHuileRedDevilQuantity] = useState(1)
  const [farinePaprikaQuantity, setFarinePaprikaQuantity] = useState(1)
  const [farineChiliQuantity, setFarineChiliQuantity] = useState(1)

  // États pour les produits spécifiques Robin Red Vers de vase
  const [liquideVersVaseRobinRedQuantity, setLiquideVersVaseRobinRedQuantity] = useState(1)
  const [liquideRobinRedQuantity, setLiquideRobinRedQuantity] = useState(1)
  const [huileSaumonQuantity, setHuileSaumonQuantity] = useState(1)
  const [robinRedHaitEuropeQuantity, setRobinRedHaitEuropeQuantity] = useState(1)

  // États pour les produits spécifiques Mure Cassis
  const [huileChenevixMureCassisQuantity, setHuileChenevixMureCassisQuantity] = useState(1)
  const [birdFoodMureCassisQuantity, setBirdFoodMureCassisQuantity] = useState(1)

  // États pour les produits spécifiques Thon Pêche
  const [farineThonQuantity, setFarineThonQuantity] = useState(1)
  const [farineCurryQuantity, setFarineCurryQuantity] = useState(1)

  // État pour le stick mix (toutes les gammes sauf Krill Calamar)
  const [stickMixGammeQuantity, setStickMixGammeQuantity] = useState(1)

  // États pour Spray+ et Flash boost (toutes les gammes)
  const [sprayPlusQuantity, setSprayPlusQuantity] = useState(1)
  const [flashBoostQuantity, setFlashBoostQuantity] = useState(1)

  // Charger les prix personnalisés
  const prixPersonnalises = usePrixPersonnalises()
  const { promotion } = useGlobalPromotion()

  // Charger tous les produits de cette gamme depuis l'admin
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const [adminProductsByCategory, setAdminProductsByCategory] = useState<Record<string, Product[]>>({})

  useEffect(() => {
    const loadAdminProducts = async () => {
      if (!gamme) return // Attendre que la gamme soit chargée
      
      const products = await getProductsByGamme(gamme, true) // Tous les produits (même indisponibles)
      console.log(`[DEBUG Gammes] Gamme recherchée: "${gamme}"`, {
        produitsTrouves: products.length,
        produits: products.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category, 
          gamme: p.gamme,
          available: p.available 
        }))
      })
      
      setAdminProducts(products)
      
      // Organiser par catégorie
      const byCategory: Record<string, Product[]> = {}
      products.forEach(product => {
        if (!byCategory[product.category]) {
          byCategory[product.category] = []
        }
        byCategory[product.category].push(product)
      })
      setAdminProductsByCategory(byCategory)
    }

    loadAdminProducts()
    const unsubscribe = onProductsUpdate(loadAdminProducts)
    return unsubscribe
  }, [gamme])

  // Handler pour ajouter au panier depuis les produits de l'admin
  const handleAddAdminProductToCart = async (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    // Temporairement : ne pas vérifier la disponibilité pour test
    // if (product.available !== true) {
    //   alert('Ce produit n\'est pas disponible pour le moment.')
    //   return
    // }
    
    if (product.variants && product.variants.length > 0) {
      if (!variant) {
        alert('Veuillez sélectionner une variante')
        return
      }
      
      // Temporairement : ne pas vérifier la disponibilité de la variante pour test
      // if (!variant.available) {
      //   alert('Cette variante n\'est pas disponible pour le moment.')
      //   return
      // }
      
      // Important: inclure les infos de variante (sinon le checkout n'affiche pas le conditionnement/diamètre
      // et le calcul du poids tombe sur 1kg par défaut).
      await addToCart({
        produit: product.name,
        arome: product.gamme || '',
        quantite: quantity,
        prix: variant.price,
        productId: product.id,
        variantId: variant.id,
        category: product.category,
        gamme: product.gamme,
        // Infos variantes (selon produit)
        diametre: variant.diametre,
        conditionnement: variant.conditionnement || variant.format,
        taille: variant.taille,
        couleur: variant.couleur,
        format: variant.format
      })
      return
    }
    
    await addToCart({
      produit: product.name,
      arome: product.gamme || '',
      quantite: quantity,
      prix: product.price,
      productId: product.id
    })
  }

  // Calcul du prix pour les bouillettes
  const getBouillettePrice = () => {
    const productId = getBouilletteId(gamme, bouilletteDiametre, bouilletteConditionnement)
    const is10mm = bouilletteDiametre === '10'
    const isRobinRed = gamme === 'Robin Red Vers de vase'
    const isMureCassis = gamme === 'Mure Cassis'
    let basePrice = 0
    
    if (bouilletteConditionnement === '1kg') {
      basePrice = is10mm ? 11.99 : 9.99
    } else if (bouilletteConditionnement === '2.5kg') {
      basePrice = is10mm ? 28.99 : 23.99
    } else if (bouilletteConditionnement === '5kg') {
      basePrice = is10mm ? 56.99 : 46.99
    } else if (bouilletteConditionnement === '10kg') {
      basePrice = is10mm ? 109.99 : 89.99
    } else {
      basePrice = 9.99
    }
    
    const defaultPrice = (isRobinRed || isMureCassis) ? basePrice + 2 : basePrice
    return getPrixPersonnalise(prixPersonnalises, productId, defaultPrice, promotion, 'bouillettes', gamme)
  }
  
  // Calcul du prix pour les équilibrées
  const getEquilibrePrice = () => {
    const productId = getEquilibreId(gamme, equilibreTaille)
    return getPrixPersonnalise(prixPersonnalises, productId, 8.99, promotion, 'équilibrées', gamme)
  }

  // Calcul du prix pour les boosters
  const getBoosterPrice = () => {
    const productId = getBoosterId(gamme)
    return getPrixPersonnalise(prixPersonnalises, productId, 14.99, promotion, 'boosters', gamme)
  }

  // Obtenir le stock disponible pour la bouillette sélectionnée
  const getBouilletteStock = () => {
    // Vérifier d'abord si le produit existe dans le système centralisé avec variantes
    const bouillettesProducts = getProductsByCategorySync('bouillettes', true)
    const product = bouillettesProducts.find(p => 
      p.gamme === gamme && 
      p.variants && 
      p.variants.some(v => 
        v.diametre === bouilletteDiametre && 
        v.conditionnement === bouilletteConditionnement &&
        v.available
      )
    )
    
    if (product) {
      // Trouver la variante correspondante
      const variant = product.variants?.find(v => 
        v.diametre === bouilletteDiametre && 
        v.conditionnement === bouilletteConditionnement &&
        v.available
      )
      
      if (variant) {
        return getAvailableStockSync(product.id, variant.id)
      }
    }
    
    // Sinon, utiliser l'ancien système avec productId
    const productId = getBouilletteId(gamme, bouilletteDiametre, bouilletteConditionnement)
    return getAvailableStockSync(productId)
  }
  
  const handleBouilletteQuantityChange = (newQuantity: number) => {
    // Plus de limite de stock - on permet de commander plus que le stock disponible
    setBouilletteQuantity(Math.max(1, newQuantity))
  }

  const handleAddBouillette = async () => {
    // Le stock sera vérifié dans addToCart avec message de pré-commande si nécessaire
    
    // Vérifier si le produit existe dans le système centralisé avec variantes
    const bouillettesProducts = getProductsByCategorySync('bouillettes', true)
    const product = bouillettesProducts.find((p: Product) => 
      p.gamme === gamme && 
      p.variants && 
      p.variants.some(v => 
        v.diametre === bouilletteDiametre && 
        v.conditionnement === bouilletteConditionnement &&
        v.available
      )
    )
    
    let productId: string | undefined
    let variantId: string | undefined
    
    if (product) {
      // Trouver la variante correspondante
      const variant = product.variants?.find(v => 
        v.diametre === bouilletteDiametre && 
        v.conditionnement === bouilletteConditionnement &&
        v.available
      )
      
      if (variant) {
        productId = product.id
        variantId = variant.id
      }
    }
    
    // Si pas trouvé dans le système centralisé, utiliser l'ancien système
    if (!productId) {
      productId = getBouilletteId(gamme, bouilletteDiametre, bouilletteConditionnement)
    }
    
    // Calculer le prix original (sans promotion)
    const is10mm = bouilletteDiametre === '10'
    const isRobinRed = gamme === 'Robin Red Vers de vase'
    const isMureCassis = gamme === 'Mure Cassis'
    let prixOriginal = 0
    
    if (bouilletteConditionnement === '1kg') {
      prixOriginal = is10mm ? 11.99 : 9.99
    } else if (bouilletteConditionnement === '2.5kg') {
      prixOriginal = is10mm ? 28.99 : 23.99
    } else if (bouilletteConditionnement === '5kg') {
      prixOriginal = is10mm ? 56.99 : 46.99
    } else if (bouilletteConditionnement === '10kg') {
      prixOriginal = is10mm ? 109.99 : 89.99
    } else {
      prixOriginal = 9.99
    }
    
    if (isRobinRed || isMureCassis) {
      prixOriginal += 2
    }
    
    const prixAvecPromotion = getBouillettePrice()
    
    await addToCart({
      produit: 'Bouillette',
      diametre: bouilletteDiametre,
      arome: gamme,
      conditionnement: bouilletteConditionnement,
      quantite: bouilletteQuantity,
      prix: prixAvecPromotion,
      prixOriginal: prixOriginal,
      category: 'bouillettes',
      gamme: gamme,
      productId: productId,
      variantId: variantId
    })
    alert('Bouillette ajoutée au panier !')
  }

  const handleAddEquilibre = async () => {
    const prixOriginal = 8.99
    const prixAvecPromotion = getEquilibrePrice()
    
    await addToCart({
      produit: 'Équilibrée',
      taille: equilibreTaille,
      arome: gamme,
      quantite: equilibreQuantity,
      prix: prixAvecPromotion,
      prixOriginal: prixOriginal,
      category: 'équilibrées',
      gamme: gamme
    })
    alert('Équilibrée ajoutée au panier !')
  }

  const handleAddBooster = async () => {
    const prixOriginal = 14.99
    const prixAvecPromotion = getBoosterPrice()
    
    await addToCart({
      produit: 'Booster',
      arome: gamme,
      type: boosterType,
      quantite: boosterQuantity,
      prix: prixAvecPromotion,
      prixOriginal: prixOriginal,
      category: 'boosters',
      gamme: gamme
    })
    alert('Booster ajouté au panier !')
  }

  // Handlers pour les produits Krill Calamar
  const handleAddStickMix = async () => {
    await addToCart({
      produit: 'Stick mix krill calamars',
      arome: gamme,
      quantite: stickMixQuantity,
      prix: 8.99
    })
    alert('Stick mix krill calamars ajouté au panier !')
  }

  const handleAddLiquideKrill = async () => {
    await addToCart({
      produit: 'Liquide de krill',
      arome: gamme,
      quantite: liquideKrillQuantity,
      prix: 11.99
    })
    alert('Liquide de krill ajouté au panier !')
  }

  const handleAddHuilePoisson = async () => {
    await addToCart({
      produit: 'Huile de poisson sauvage',
      arome: gamme,
      quantite: huilePoissonQuantity,
      prix: 11.99
    })
    alert('Huile de poisson sauvage ajoutée au panier !')
  }

  const handleAddFarineKrill = async () => {
    await addToCart({
      produit: 'Farine de krill',
      arome: gamme,
      quantite: farineKrillQuantity,
      prix: 9.99
    })
    alert('Farine de krill ajoutée au panier !')
  }

  const handleAddFarineCalamar = async () => {
    await addToCart({
      produit: 'Farine de calamar',
      arome: gamme,
      quantite: farineCalamarQuantity,
      prix: 9.99
    })
    alert('Farine de calamar ajoutée au panier !')
  }

  const isKrillCalamar = gamme === 'Krill Calamar'
  const isMegaTutti = gamme === 'Méga Tutti'
  const isRedDevil = gamme === 'Red Devil'
  const isRobinRed = gamme === 'Robin Red Vers de vase'
  const isMureCassis = gamme === 'Mure Cassis'
  const isThonPeche = gamme === 'Thon Pêche'

  // Handlers pour les produits Méga Tutti
  const handleAddLiqueurMais = async () => {
    await addToCart({
      produit: 'Liqueur de maïs',
      arome: gamme,
      quantite: liqueurMaisQuantity,
      prix: 9.99
    })
    alert('Liqueur de maïs ajoutée au panier !')
  }

  const handleAddHuileChenevix = async () => {
    await addToCart({
      produit: 'Huile de chènevis',
      arome: gamme,
      quantite: huileChenevixQuantity,
      prix: 11.99
    })
    alert('Huile de chènevis ajoutée au panier !')
  }

  const handleAddBirdFood = async () => {
    await addToCart({
      produit: 'Bird food au fruit',
      arome: gamme,
      quantite: birdFoodQuantity,
      prix: 10.99
    })
    alert('Bird food au fruit ajouté au panier !')
  }

  // Handlers pour les produits Red Devil
  const handleAddHuileRedDevil = async () => {
    await addToCart({
      produit: 'Huile de red devil',
      arome: gamme,
      quantite: huileRedDevilQuantity,
      prix: 10.99
    })
    alert('Huile de red devil ajoutée au panier !')
  }

  const handleAddFarinePaprika = async () => {
    await addToCart({
      produit: 'Farine de paprika',
      arome: gamme,
      quantite: farinePaprikaQuantity,
      prix: 9.99
    })
    alert('Farine de paprika ajoutée au panier !')
  }

  const handleAddFarineChili = async () => {
    await addToCart({
      produit: 'Farine de Chili',
      arome: gamme,
      quantite: farineChiliQuantity,
      prix: 7.99
    })
    alert('Farine de Chili ajoutée au panier !')
  }

  // Handlers pour les produits Robin Red Vers de vase
  const handleAddLiquideVersVaseRobinRed = async () => {
    await addToCart({
      produit: 'Liquide de vers de vase',
      arome: gamme,
      quantite: liquideVersVaseRobinRedQuantity,
      prix: 11.99
    })
    alert('Liquide de vers de vase ajouté au panier !')
  }

  const handleAddLiquideRobinRed = async () => {
    await addToCart({
      produit: 'Liquide de robin red',
      arome: gamme,
      quantite: liquideRobinRedQuantity,
      prix: 10.99
    })
    alert('Liquide de robin red ajouté au panier !')
  }

  const handleAddHuileSaumon = async () => {
    await addToCart({
      produit: 'Huile de saumon',
      arome: gamme,
      quantite: huileSaumonQuantity,
      prix: 9.99
    })
    alert('Huile de saumon ajoutée au panier !')
  }

  const handleAddRobinRedHaitEurope = async () => {
    await addToCart({
      produit: 'Robin red hait\'s Europe',
      arome: gamme,
      quantite: robinRedHaitEuropeQuantity,
      prix: 10.99
    })
    alert('Robin red hait\'s Europe ajouté au panier !')
  }

  // Handlers pour les produits Mure Cassis
  const handleAddHuileChenevixMureCassis = async () => {
    await addToCart({
      produit: 'Huile de chènevis',
      arome: gamme,
      quantite: huileChenevixMureCassisQuantity,
      prix: 11.99
    })
    alert('Huile de chènevis ajoutée au panier !')
  }

  const handleAddBirdFoodMureCassis = async () => {
    await addToCart({
      produit: 'Bird food au fruits',
      arome: gamme,
      quantite: birdFoodMureCassisQuantity,
      prix: 10.99
    })
    alert('Bird food au fruits ajouté au panier !')
  }

  // Handlers pour les produits Thon Pêche
  const handleAddFarineThon = async () => {
    await addToCart({
      produit: 'Farine thon',
      arome: gamme,
      quantite: farineThonQuantity,
      prix: 6.99
    })
    alert('Farine thon ajoutée au panier !')
  }

  const handleAddFarineCurry = async () => {
    await addToCart({
      produit: 'Farine de curry',
      arome: gamme,
      quantite: farineCurryQuantity,
      prix: 11.99
    })
    alert('Farine de curry ajoutée au panier !')
  }

  // Handler pour le stick mix de la gamme (toutes sauf Krill Calamar)
  const handleAddStickMixGamme = async () => {
    await addToCart({
      produit: `Stick mix ${gamme}`,
      arome: gamme,
      quantite: stickMixGammeQuantity,
      prix: 8.99
    })
    alert(`Stick mix ${gamme} ajouté au panier !`)
  }

  // Handler pour Spray+
  const handleAddSprayPlus = async () => {
    await addToCart({
      produit: `Spray+ ${gamme}`,
      arome: gamme,
      quantite: sprayPlusQuantity,
      prix: 5.99
    })
    alert(`Spray+ ${gamme} ajouté au panier !`)
  }

  // Handler pour Flash boost
  const handleAddFlashBoost = async () => {
    await addToCart({
      produit: `Flash boost ${gamme}`,
      arome: gamme,
      quantite: flashBoostQuantity,
      prix: 10.99
    })
    alert(`Flash boost ${gamme} ajouté au panier !`)
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
          <h1 className="text-5xl font-bold mb-4">Gamme d'appât {gamme || gammeParam}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Découvrez tous les produits de la gamme d'appât {gamme || gammeParam}
          </p>
        </div>

        {/* Tous les produits de la gamme */}
        {adminProducts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Tous les produits de la gamme d'appât</h2>
            {(() => {
              // Dédupliquer les produits par ID (chaque produit a un ID unique)
              // Pour les bouillettes : ne garder qu'un seul produit par gamme (même si plusieurs existent)
              const seenIds = new Set<string>()
              const seenBouillettes = new Set<string>()
              
              const uniqueProducts = adminProducts.filter((product) => {
                const category = product.category.toLowerCase()
                
                // Pour les bouillettes, on ne garde qu'un seul produit par gamme
                if (category === 'bouillettes') {
                  const bouilletteKey = `bouillettes|${product.gamme || ''}`
                  if (seenBouillettes.has(bouilletteKey)) {
                    return false // Déjà un produit bouillettes pour cette gamme
                  }
                  seenBouillettes.add(bouilletteKey)
                  seenIds.add(product.id)
                  return true
                }
                
                // Pour les autres produits, utiliser l'ID unique
                if (seenIds.has(product.id)) {
                  return false // Déjà vu ce produit (même ID)
                }
                seenIds.add(product.id)
                return true
              })
              
              // Ordre des catégories pour trier les produits
              const categoryOrder = [
                'bouillettes',
                'équilibrées',
                'équilibrés',
                'boosters',
                'huiles',
                'farines',
                'pop-up duo',
                'bar à pop-up',
                'flash boost',
                'spray plus',
                'stick mix',
                'bird food',
                'robin red'
              ]
              
              // Trier tous les produits selon l'ordre des catégories
              const sortedProducts = uniqueProducts.sort((a, b) => {
                const indexA = categoryOrder.findIndex(c => c.toLowerCase() === a.category.toLowerCase())
                const indexB = categoryOrder.findIndex(c => c.toLowerCase() === b.category.toLowerCase())
                const orderA = indexA === -1 ? 999 : indexA
                const orderB = indexB === -1 ? 999 : indexB
                if (orderA !== orderB) return orderA - orderB
                // Si même catégorie, trier par nom
                return a.name.localeCompare(b.name)
              })
              
              return (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddAdminProductToCart}
                    />
                  ))}
                </div>
              )
            })()}
          </section>
        )}


        {/* Modal Bouillettes */}
        <ProductModal
          isOpen={bouilletteModalOpen}
          onClose={() => setBouilletteModalOpen(false)}
          title={`Bouillettes ${gamme}`}
          onAddToCart={handleAddBouillette}
          total={getBouillettePrice() * bouilletteQuantity}
          summaryItems={[
            { label: 'Gamme d\'appât', value: gamme },
            { label: 'Diamètre', value: `${bouilletteDiametre}mm` },
            { label: 'Conditionnement', value: bouilletteConditionnement },
            { label: 'Quantité', value: bouilletteQuantity.toString() }
          ]}
          disabled={false}
          buttonText={(() => {
            const availableStock = getBouilletteStock()
            if (availableStock === 0) return 'Ajouter (sur commande)'
            if (availableStock > 0 && bouilletteQuantity > availableStock) return 'Ajouter (délai prolongé)'
            return 'Ajouter au panier'
          })()}
        >
          <div>
            <label className="block text-lg font-semibold mb-4">Diamètre</label>
            <div className="grid grid-cols-3 gap-4">
              {DIAMETRES_BOUILLETTES.map((diametre) => (
                <button
                  key={diametre}
                  onClick={() => setBouilletteDiametre(diametre)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    bouilletteDiametre === diametre
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-noir-700 hover:border-noir-600'
                  }`}
                >
                  <div className="text-2xl font-bold">{diametre}mm</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-4">Conditionnement</label>
            <div className="grid grid-cols-3 gap-4">
              {CONDITIONNEMENTS.map((cond) => (
                <button
                  key={cond}
                  onClick={() => setBouilletteConditionnement(cond)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    bouilletteConditionnement === cond
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-noir-700 hover:border-noir-600'
                  }`}
                >
                  <div className="text-xl font-bold">{cond}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-4">Quantité</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleBouilletteQuantityChange(bouilletteQuantity - 1)}
                disabled={bouilletteQuantity <= 1}
                className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="number"
                value={bouilletteQuantity}
                onChange={(e) => handleBouilletteQuantityChange(parseInt(e.target.value) || 1)}
                className="w-20 text-center bg-noir-800 border border-noir-700 rounded-lg py-2"
                min="1"
              />
              <button
                onClick={() => handleBouilletteQuantityChange(bouilletteQuantity + 1)}
                className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </ProductModal>

        {/* Modal Équilibrées */}
        <ProductModal
          isOpen={equilibreModalOpen}
          onClose={() => setEquilibreModalOpen(false)}
          title={`Équilibrées ${gamme}`}
          onAddToCart={handleAddEquilibre}
          total={getEquilibrePrice() * equilibreQuantity}
          summaryItems={[
            { label: 'Gamme d\'appât', value: gamme },
            { label: 'Taille', value: equilibreTaille },
            { label: 'Quantité', value: equilibreQuantity.toString() }
          ]}
        >
          <div>
            <label className="block text-lg font-semibold mb-4">Taille</label>
            <div className="grid grid-cols-2 gap-4">
              {TAILLES_EQUILIBRES.map((taille) => (
                <button
                  key={taille}
                  onClick={() => setEquilibreTaille(taille)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    equilibreTaille === taille
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-noir-700 hover:border-noir-600'
                  }`}
                >
                  <div className="text-lg font-bold">{taille}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-4">Quantité</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEquilibreQuantity(Math.max(1, equilibreQuantity - 1))}
                className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={equilibreQuantity}
                onChange={(e) => setEquilibreQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center bg-noir-800 border border-noir-700 rounded-lg py-2"
                min="1"
              />
              <button
                onClick={() => setEquilibreQuantity(equilibreQuantity + 1)}
                className="px-4 py-2 bg-noir-800 border border-noir-700 rounded-lg hover:bg-noir-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </ProductModal>

        {/* Modal de détails Bouillettes */}
        <GammeProductModal
          isOpen={selectedProductType === 'bouillettes'}
          onClose={() => setSelectedProductType(null)}
          productName={`Bouillettes ${gamme}`}
          productDescription={`Bouillettes de qualité supérieure de la gamme ${gamme}. Disponibles en différents diamètres et conditionnements.`}
          price={getBouillettePrice()}
          gamme={gamme}
          quantity={bouilletteQuantity}
          onQuantityChange={setBouilletteQuantity}
          onAddToCart={handleAddBouillette}
          availableStock={getBouilletteStock()}
          disabled={false}
          buttonText={(() => {
            const availableStock = getBouilletteStock()
            if (availableStock === 0) return 'Ajouter (sur commande)'
            if (availableStock > 0 && bouilletteQuantity > availableStock) return 'Ajouter (délai prolongé)'
            return 'Ajouter au panier'
          })()}
        >
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Diamètre</label>
            <div className="grid grid-cols-3 gap-2">
              {DIAMETRES_BOUILLETTES.map((diametre) => (
                <button
                  key={diametre}
                  onClick={() => setBouilletteDiametre(diametre)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    bouilletteDiametre === diametre
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-noir-700 hover:border-noir-600'
                  }`}
                >
                  {diametre}mm
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Conditionnement</label>
            <div className="grid grid-cols-3 gap-2">
              {CONDITIONNEMENTS.map((cond) => (
                <button
                  key={cond}
                  onClick={() => setBouilletteConditionnement(cond)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    bouilletteConditionnement === cond
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-noir-700 hover:border-noir-600'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </GammeProductModal>

        {/* Modal de détails Équilibrées */}
        <GammeProductModal
          isOpen={selectedProductType === 'equilibres'}
          onClose={() => setSelectedProductType(null)}
          productName={`Équilibrées ${gamme}`}
          productDescription={`Appâts équilibrés de la gamme ${gamme}. Disponibles en différentes tailles.`}
          price={getEquilibrePrice()}
          gamme={gamme}
          quantity={equilibreQuantity}
          onQuantityChange={setEquilibreQuantity}
          onAddToCart={handleAddEquilibre}
        >
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Taille</label>
            <div className="grid grid-cols-2 gap-2">
              {TAILLES_EQUILIBRES.map((taille) => (
                <button
                  key={taille}
                  onClick={() => setEquilibreTaille(taille)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    equilibreTaille === taille
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-noir-700 hover:border-noir-600'
                  }`}
                >
                  {taille}
                </button>
              ))}
            </div>
          </div>
        </GammeProductModal>

        {/* Modal de détails Booster */}
        <GammeProductModal
          isOpen={selectedProductType === 'booster'}
          onClose={() => setSelectedProductType(null)}
          productName={`Booster ${gamme}`}
          productDescription={`Booster d'attraction de la gamme ${gamme}.`}
          price={getBoosterPrice()}
          gamme={gamme}
          quantity={boosterQuantity}
          onQuantityChange={setBoosterQuantity}
          onAddToCart={handleAddBooster}
        >
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES_BOOSTERS.map((type) => (
                <button
                  key={type}
                  onClick={() => setBoosterType(type)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    boosterType === type
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-noir-700 hover:border-noir-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </GammeProductModal>

        {/* Modal générique pour tous les autres produits */}
        {selectedProductData && (
          <GammeProductModal
            isOpen={selectedProductData !== null}
            onClose={() => setSelectedProductData(null)}
            productName={selectedProductData.name}
            productDescription={selectedProductData.description}
            price={selectedProductData.price}
            format={selectedProductData.format}
            gamme={gamme}
            quantity={selectedProductData.quantity}
            onQuantityChange={selectedProductData.onQuantityChange}
            onAddToCart={selectedProductData.onAddToCart}
          />
        )}

      </div>
    </div>
  )
}