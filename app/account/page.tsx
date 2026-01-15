'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, User, LogOut, Package, MapPin, Mail, Phone, Edit2, Lock, Tag, ChevronDown, ChevronUp, Calendar, CheckCircle2, Clock, XCircle, Truck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserOrders, type Order, type OrderItem } from '@/lib/revenue-supabase'
import { getUserPromoCodes } from '@/lib/promo-codes-manager'
import { changePassword, updateUserProfile } from '@/lib/auth-supabase'
import { loadProducts, type Product, type ProductVariant } from '@/lib/products-manager'

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([])
  const [promoCodes, setPromoCodes] = useState<Array<{ code: any; orderId: string; discountAmount: number; usedAt: string }>>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // États pour les formulaires
  const [editProfile, setEditProfile] = useState(false)
  const [editPassword, setEditPassword] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [success, setSuccess] = useState<{ [key: string]: string }>({})

  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Déclarer loadData AVANT les hooks pour pouvoir l'utiliser dans useEffect
  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [userOrders, userPromos, allProducts] = await Promise.all([
        getUserOrders(user.id),
        Promise.resolve(getUserPromoCodes(user.id)),
        loadProducts()
      ])
      setOrders(userOrders)
      setPromoCodes(userPromos)
      setProducts(allProducts)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  // TOUS LES HOOKS DOIVENT ÊTRE APPELÉS AVANT TOUT RETURN CONDITIONNEL
  // Logs de débogage
  useEffect(() => {
    console.log('[AccountPage] État:', { isAuthenticated, hasUser: !!user, userEmail: user?.email })
  }, [isAuthenticated, user])

  // Vérifier l'authentification après un délai
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasCheckedAuth(true)
      // Rediriger seulement si on est sûr que l'utilisateur n'est PAS connecté
      if (!isAuthenticated || !user) {
        console.log('[AccountPage] Utilisateur non connecté, redirection vers /account/login')
        router.push('/account/login')
      } else {
        console.log('[AccountPage] Utilisateur connecté, affichage de la page')
      }
    }, 1500) // Délai pour laisser le contexte se charger
    
    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  // Charger les données utilisateur (AVANT les returns conditionnels)
  useEffect(() => {
    if (user) {
      loadData()
      setProfileForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        adresse: user.adresse || '',
        codePostal: user.codePostal || '',
        ville: user.ville || '',
        telephone: user.telephone || ''
      })
    }
  }, [user])

  // Afficher un message de chargement pendant la vérification (APRÈS tous les hooks)
  if (!hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté, ne rien afficher (redirection en cours)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Redirection vers la page de connexion...</p>
        </div>
      </div>
    )
  }

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [userOrders, userPromos, allProducts] = await Promise.all([
        getUserOrders(user.id),
        Promise.resolve(getUserPromoCodes(user.id)),
        loadProducts()
      ])
      setOrders(userOrders)
      setPromoCodes(userPromos)
      setProducts(allProducts)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      // La redirection est gérée dans le contexte AuthContext
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // En cas d'erreur, rediriger quand même
      router.push('/account/login')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess({})

    if (!user) return

    const result = await updateUserProfile(user.id, profileForm)
    if (result.success && result.user) {
      updateUser(profileForm)
      setEditProfile(false)
      setSuccess({ profile: 'Profil mis à jour avec succès' })
      setTimeout(() => setSuccess({}), 3000)
    } else {
      setErrors({ profile: result.error || 'Erreur lors de la mise à jour' })
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess({})

    if (passwordForm.new !== passwordForm.confirm) {
      setErrors({ password: 'Les mots de passe ne correspondent pas' })
      return
    }

    if (passwordForm.new.length < 6) {
      setErrors({ password: 'Le mot de passe doit contenir au moins 6 caractères' })
      return
    }

    const result = await changePassword(passwordForm.current, passwordForm.new)
    if (result.success) {
      setEditPassword(false)
      setPasswordForm({ current: '', new: '', confirm: '' })
      setSuccess({ password: 'Mot de passe changé avec succès' })
      setTimeout(() => setSuccess({}), 3000)
    } else {
      setErrors({ password: result.error || 'Erreur lors du changement de mot de passe' })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'preparing':
        return <Package className="w-5 h-5 text-blue-500" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée'
      case 'pending':
        return 'En attente'
      case 'preparing':
        return 'En préparation'
      case 'shipped':
        return 'Expédiée'
      case 'cancelled':
        return 'Annulée'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Fonction pour construire le nom du produit avec les informations de variante sauvegardées
  const getProductNameFromItem = (item: any): string => {
    // Utiliser le nom du produit sauvegardé si disponible
    const baseName = item.produit || products.find(p => p.id === item.product_id)?.name || item.product_id
    
    // Construire les détails de variante à partir des informations sauvegardées
    const variantParts: string[] = []
    
    // Pour Pop-up Duo : saveur (arome) et forme (taille)
    if (item.saveur) variantParts.push(item.saveur)
    if (item.forme) variantParts.push(item.forme)
    // Fallback pour les anciennes commandes
    if (!item.saveur && item.arome) variantParts.push(item.arome)
    if (!item.forme && item.taille) variantParts.push(item.taille)
    
    // Pour Bar à Pop-up : couleur, taille, arôme
    if (item.couleur) variantParts.push(item.couleur)
    if (item.taille && !variantParts.includes(item.taille)) variantParts.push(item.taille)
    if (item.arome && !variantParts.includes(item.arome)) variantParts.push(item.arome)
    
    // Pour les bouillettes : diamètre, conditionnement, arôme
    if (item.diametre) variantParts.push(item.diametre)
    if (item.conditionnement) variantParts.push(item.conditionnement)
    
    // Si on n'a pas trouvé d'informations de variante sauvegardées, essayer de les récupérer depuis les variantes du produit
    if (variantParts.length === 0 && item.variant_id) {
      const product = products.find(p => p.id === item.product_id)
      if (product?.variants) {
        const variant = product.variants.find((v: any) => v.id === item.variant_id)
        if (variant) {
          if (variant.label) {
            variantParts.push(variant.label)
          } else {
            if (variant.conditionnement) variantParts.push(variant.conditionnement)
          }
        }
      }
    }
    
    if (variantParts.length > 0) {
      return `${baseName} - ${variantParts.join(' - ')}`
    }
    
    return baseName
  }

  const getProductName = (productId: string, variantId?: string, item?: any) => {
    // Si un item complet est fourni, utiliser la nouvelle fonction
    if (item) {
      return getProductNameFromItem(item)
    }
    
    // Fallback pour l'ancienne méthode
    const product = products.find(p => p.id === productId)
    if (!product) return productId
    
    if (variantId && product.variants) {
      const variant = product.variants.find(v => v.id === variantId)
      if (variant) {
        return `${product.name} - ${variant.label || variant.conditionnement || ''}`
      }
    }
    
    return product.name
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/10 rounded-full mb-4">
            <User className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Mon compte</h1>
          <p className="text-gray-400">Bienvenue, {user.prenom} {user.nom}</p>
        </div>

        {/* Informations personnelles */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-500" />
              Informations personnelles
            </h2>
            {!editProfile && (
              <button
                onClick={() => setEditProfile(true)}
                className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}
          </div>

          {editProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Prénom</label>
                  <input
                    type="text"
                    value={profileForm.prenom}
                    onChange={(e) => setProfileForm({ ...profileForm, prenom: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Nom</label>
                  <input
                    type="text"
                    value={profileForm.nom}
                    onChange={(e) => setProfileForm({ ...profileForm, nom: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Téléphone</label>
                  <input
                    type="tel"
                    value={profileForm.telephone}
                    onChange={(e) => setProfileForm({ ...profileForm, telephone: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Adresse</label>
                  <input
                    type="text"
                    value={profileForm.adresse}
                    onChange={(e) => setProfileForm({ ...profileForm, adresse: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Code postal</label>
                  <input
                    type="text"
                    value={profileForm.codePostal}
                    onChange={(e) => setProfileForm({ ...profileForm, codePostal: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Ville</label>
                  <input
                    type="text"
                    value={profileForm.ville}
                    onChange={(e) => setProfileForm({ ...profileForm, ville: e.target.value })}
                    className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>
              {errors.profile && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-500 text-sm">{errors.profile}</p>
                </div>
              )}
              {success.profile && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-500 text-sm">{success.profile}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditProfile(false)
                    setProfileForm({
                      nom: user.nom || '',
                      prenom: user.prenom || '',
                      adresse: user.adresse || '',
                      codePostal: user.codePostal || '',
                      ville: user.ville || '',
                      telephone: user.telephone || ''
                    })
                    setErrors({})
                  }}
                  className="px-6 py-2 bg-noir-700 text-white font-bold rounded-lg hover:bg-noir-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Nom complet</p>
                <p className="text-white font-semibold">{user.prenom} {user.nom}</p>
              </div>
              {user.telephone && (
                <div>
                  <p className="text-sm text-gray-400">Téléphone</p>
                  <p className="text-white font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.telephone}
                  </p>
                </div>
              )}
              {user.adresse && (
                <div>
                  <p className="text-sm text-gray-400">Adresse</p>
                  <p className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {user.adresse}
                    {user.codePostal && user.ville && `, ${user.codePostal} ${user.ville}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Changer le mot de passe */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-500" />
              Mot de passe
            </h2>
            {!editPassword && (
              <button
                onClick={() => setEditPassword(true)}
                className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}
          </div>

          {editPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Mot de passe actuel</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
              {errors.password && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-500 text-sm">{errors.password}</p>
                </div>
              )}
              {success.password && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-500 text-sm">{success.password}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Changer le mot de passe
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPassword(false)
                    setPasswordForm({ current: '', new: '', confirm: '' })
                    setErrors({})
                  }}
                  className="px-6 py-2 bg-noir-700 text-white font-bold rounded-lg hover:bg-noir-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-400">••••••••</p>
          )}
        </div>

        {/* Mes commandes */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-6">
          <button
            onClick={() => setActiveSection(activeSection === 'orders' ? null : 'orders')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-500" />
              Mes commandes ({orders.length})
            </h2>
            {activeSection === 'orders' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {activeSection === 'orders' && (
            <div className="space-y-4">
              {loading ? (
                <p className="text-gray-400">Chargement...</p>
              ) : orders.length === 0 ? (
                <p className="text-gray-400">Aucune commande pour le moment.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-noir-900/50 border border-noir-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">Commande #{order.reference}</p>
                        <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm font-medium">{getStatusLabel(order.status)}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-1">Articles :</p>
                      <ul className="space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-sm text-white">
                            {getProductName(item.product_id, item.variant_id, item)} × {item.quantity} - {item.price.toFixed(2)}€
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-noir-700">
                      <span className="text-sm text-gray-400">Total</span>
                      <span className="text-lg font-bold text-yellow-500">{order.total.toFixed(2)}€</span>
                    </div>
                    {(order as any).shipping_tracking_number && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-blue-400" />
                          <p className="text-xs font-medium text-blue-400">Votre colis a été expédié</p>
                        </div>
                        <p className="text-sm text-white mb-2">
                          <span className="text-gray-400">Numéro de suivi :</span>{' '}
                          <span className="font-mono text-yellow-500">{(order as any).shipping_tracking_number}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Contactez-nous pour suivre votre colis
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Mes codes promo */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-6">
          <button
            onClick={() => setActiveSection(activeSection === 'promos' ? null : 'promos')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Tag className="w-5 h-5 text-yellow-500" />
              Mes codes promo utilisés ({promoCodes.length})
            </h2>
            {activeSection === 'promos' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {activeSection === 'promos' && (
            <div className="space-y-4">
              {promoCodes.length === 0 ? (
                <p className="text-gray-400">Aucun code promo utilisé pour le moment.</p>
              ) : (
                promoCodes.map((promo, index) => (
                  <div key={index} className="bg-noir-900/50 border border-noir-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">Code : {promo.code.code}</p>
                        {promo.code.description && (
                          <p className="text-sm text-gray-400 mt-1">{promo.code.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-500">
                          -{promo.discountAmount.toFixed(2)}€
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {promo.code.discountType === 'percentage' ? `${promo.code.discountValue}%` : `${promo.code.discountValue}€`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      Utilisé le {formatDate(promo.usedAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-500" />
            Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/cart"
              className="block w-full bg-noir-900 border border-noir-700 rounded-lg p-4 hover:border-yellow-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Voir mon panier</span>
                <Package className="w-5 h-5 text-yellow-500" />
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 border border-red-500/50 rounded-lg p-4 hover:bg-red-500/20 transition-colors flex items-center justify-between"
            >
              <span className="font-semibold text-red-500">Se déconnecter</span>
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
