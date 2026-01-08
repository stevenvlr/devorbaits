'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Tag, Edit2, Check, Copy } from 'lucide-react'
import { 
  loadPromoCodes, 
  loadPromoCodesSync,
  addPromoCode, 
  updatePromoCode, 
  deletePromoCode, 
  onPromoCodesUpdate,
  getPromoCodeUsageCount,
  type PromoCode 
} from '@/lib/promo-codes-manager'
import { loadProductsSync } from '@/lib/products-manager'
import { loadGammes } from '@/lib/gammes-manager'
import { getAllUsers, type User } from '@/lib/auth-supabase'

export default function PromoCodesAdminPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // États du formulaire
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minPurchase: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    active: true,
    allowedUserIds: [] as string[],
    allowedProductIds: [] as string[],
    allowedCategories: [] as string[],
    allowedGammes: [] as string[],
    allowedConditionnements: [] as string[],
    description: ''
  })

  const [products] = useState(() => loadProductsSync())
  const [gammes, setGammes] = useState<string[]>([])
  
  useEffect(() => {
    loadGammes().then(setGammes).catch(console.error)
  }, [])
  const [categories] = useState(() => {
    const cats = new Set<string>()
    products.forEach(p => {
      if (p.category) cats.add(p.category)
    })
    return Array.from(cats).sort()
  })
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserSelector, setShowUserSelector] = useState(false)

  // Charger tous les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      const users = await getAllUsers()
      setAllUsers(users)
    }
    loadUsers()
  }, [])

  const loadPromoCodesData = async () => {
    const codes = await loadPromoCodes()
    setPromoCodes(codes)
  }

  useEffect(() => {
    loadPromoCodesData()
    const unsubscribe = onPromoCodesUpdate(() => {
      loadPromoCodesData()
    })
    return unsubscribe
  }, [])

  const handleAddCode = async () => {
    if (!formData.code.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un code promo' })
      return
    }

    if (formData.discountValue <= 0) {
      setMessage({ type: 'error', text: 'La valeur de réduction doit être supérieure à 0' })
      return
    }

    const newCode: PromoCode = {
      id: '',
      code: formData.code.trim().toUpperCase(),
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      validFrom: formData.validFrom || undefined,
      validUntil: formData.validUntil || undefined,
      active: formData.active,
      allowedUserIds: formData.allowedUserIds.length > 0 ? formData.allowedUserIds : undefined,
      allowedProductIds: formData.allowedProductIds.length > 0 ? formData.allowedProductIds : undefined,
      allowedCategories: formData.allowedCategories.length > 0 ? formData.allowedCategories : undefined,
      allowedGammes: formData.allowedGammes.length > 0 ? formData.allowedGammes : undefined,
      allowedConditionnements: formData.allowedConditionnements.length > 0 ? formData.allowedConditionnements : undefined,
      description: formData.description || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const result = await addPromoCode(newCode)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      resetForm()
      setShowAddForm(false)
      await loadPromoCodesData()
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.message })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleUpdateCode = async () => {
    if (!editingCode) return

    if (formData.discountValue <= 0) {
      setMessage({ type: 'error', text: 'La valeur de réduction doit être supérieure à 0' })
      return
    }

    const updates: Partial<PromoCode> = {
      code: formData.code.trim().toUpperCase(),
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      validFrom: formData.validFrom || undefined,
      validUntil: formData.validUntil || undefined,
      active: formData.active,
      allowedUserIds: formData.allowedUserIds.length > 0 ? formData.allowedUserIds : undefined,
      allowedProductIds: formData.allowedProductIds.length > 0 ? formData.allowedProductIds : undefined,
      allowedCategories: formData.allowedCategories.length > 0 ? formData.allowedCategories : undefined,
      allowedGammes: formData.allowedGammes.length > 0 ? formData.allowedGammes : undefined,
      allowedConditionnements: formData.allowedConditionnements.length > 0 ? formData.allowedConditionnements : undefined,
      description: formData.description || undefined
    }

    const result = await updatePromoCode(editingCode.id, updates)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setEditingCode(null)
      resetForm()
      await loadPromoCodesData()
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.message })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) {
      return
    }

    const success = await deletePromoCode(id)
    
    if (success) {
      setMessage({ type: 'success', text: 'Code promo supprimé avec succès' })
      await loadPromoCodesData()
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleEditCode = (code: PromoCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      minPurchase: code.minPurchase?.toString() || '',
      maxUses: code.maxUses?.toString() || '',
      validFrom: code.validFrom || '',
      validUntil: code.validUntil || '',
      active: code.active,
      allowedUserIds: code.allowedUserIds || [],
      allowedProductIds: code.allowedProductIds || [],
      allowedCategories: code.allowedCategories || [],
      allowedGammes: code.allowedGammes || [],
      allowedConditionnements: code.allowedConditionnements || [],
      description: code.description || ''
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchase: '',
      maxUses: '',
      validFrom: '',
      validUntil: '',
      active: true,
      allowedUserIds: [],
      allowedProductIds: [],
      allowedCategories: [],
      allowedGammes: [],
      allowedConditionnements: [],
      description: ''
    })
  }

  const createDefaultCodes = async () => {
    // Code 1: 50% sur tous les articles en 1kg
    const code1kg: PromoCode = {
      id: '',
      code: 'PROMO1KG',
      discountType: 'percentage',
      discountValue: 50,
      active: true,
      allowedConditionnements: ['1kg'],
      description: '50% de réduction sur tous les articles en conditionnement 1kg',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Code 2: 30% sur les huiles et liquides
    // Note: Les liquides sont aussi dans la catégorie "huiles" dans le système
    const codeHuiles: PromoCode = {
      id: '',
      code: 'PROMOHUILES',
      discountType: 'percentage',
      discountValue: 30,
      active: true,
      allowedCategories: ['huiles'],
      description: '30% de réduction sur les huiles et liquides',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const result1 = await addPromoCode(code1kg)
    const result2 = await addPromoCode(codeHuiles)

    if (result1.success && result2.success) {
      setMessage({ type: 'success', text: 'Codes promo par défaut créés avec succès' })
      await loadPromoCodesData()
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de la création des codes par défaut' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestion des Codes Promo</h1>
            <p className="text-gray-400">Créez et gérez les codes promo avec restrictions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createDefaultCodes}
              className="btn btn-secondary btn-md"
            >
              <Copy className="w-4 h-4" />
              Créer codes par défaut
            </button>
            <button
              onClick={() => {
                setShowAddForm(true)
                setEditingCode(null)
                resetForm()
              }}
              className="btn btn-primary btn-md"
            >
              <Plus className="w-4 h-4" />
              Nouveau code promo
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Formulaire */}
        {showAddForm && (
          <div className="mb-8 bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingCode ? 'Modifier le code promo' : 'Nouveau code promo'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingCode(null)
                  resetForm()
                  setMessage(null)
                }}
                className="p-2 hover:bg-noir-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Code promo *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Ex: PROMO1KG"
                />
              </div>

              {/* Type et valeur */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de réduction *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Valeur * ({formData.discountType === 'percentage' ? '%' : '€'})
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    min="0"
                    step={formData.discountType === 'percentage' ? '1' : '0.01'}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valide du</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valide jusqu'au</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Restrictions */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Montant minimum (€)</label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre max d'utilisations</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    min="1"
                  />
                </div>
              </div>

              {/* Catégories autorisées */}
              <div>
                <label className="block text-sm font-medium mb-2">Catégories autorisées (laisser vide = toutes)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        const newCats = formData.allowedCategories.includes(cat)
                          ? formData.allowedCategories.filter(c => c !== cat)
                          : [...formData.allowedCategories, cat]
                        setFormData({ ...formData, allowedCategories: newCats })
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        formData.allowedCategories.includes(cat)
                          ? 'bg-yellow-500 text-black'
                          : 'bg-noir-700 text-gray-300 hover:bg-noir-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gammes autorisées */}
              <div>
                <label className="block text-sm font-medium mb-2">Gammes d'appât autorisées (laisser vide = toutes)</label>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(gammes) ? gammes : []).map(gamme => (
                    <button
                      key={gamme}
                      onClick={() => {
                        const newGammes = formData.allowedGammes.includes(gamme)
                          ? formData.allowedGammes.filter(g => g !== gamme)
                          : [...formData.allowedGammes, gamme]
                        setFormData({ ...formData, allowedGammes: newGammes })
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        formData.allowedGammes.includes(gamme)
                          ? 'bg-yellow-500 text-black'
                          : 'bg-noir-700 text-gray-300 hover:bg-noir-600'
                      }`}
                    >
                      {gamme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditionnements autorisés */}
              <div>
                <label className="block text-sm font-medium mb-2">Conditionnements autorisés (laisser vide = tous)</label>
                <div className="flex flex-wrap gap-2">
                  {['1kg', '2.5kg', '5kg', '10kg'].map(cond => (
                    <button
                      key={cond}
                      onClick={() => {
                        const newConds = formData.allowedConditionnements.includes(cond)
                          ? formData.allowedConditionnements.filter(c => c !== cond)
                          : [...formData.allowedConditionnements, cond]
                        setFormData({ ...formData, allowedConditionnements: newConds })
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        formData.allowedConditionnements.includes(cond)
                          ? 'bg-yellow-500 text-black'
                          : 'bg-noir-700 text-gray-300 hover:bg-noir-600'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Utilisateurs autorisés */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Utilisateurs autorisés (laisser vide = tous les utilisateurs)
                </label>
                <div className="space-y-2">
                  {/* Utilisateurs sélectionnés */}
                  {formData.allowedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.allowedUserIds.map(userId => {
                        const user = allUsers.find(u => u.id === userId)
                        if (!user) return null
                        return (
                          <div
                            key={userId}
                            className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-sm"
                          >
                            <span className="text-yellow-400">
                              {user.prenom} {user.nom} ({user.email})
                            </span>
                            <button
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  allowedUserIds: formData.allowedUserIds.filter(id => id !== userId)
                                })
                              }}
                              className="text-yellow-400 hover:text-yellow-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Bouton pour ouvrir le sélecteur */}
                  <button
                    type="button"
                    onClick={() => setShowUserSelector(!showUserSelector)}
                    className="w-full px-3 py-2 bg-noir-700 border border-noir-600 rounded-lg text-gray-300 hover:bg-noir-600 transition-colors text-sm"
                  >
                    {showUserSelector ? 'Masquer' : 'Sélectionner des utilisateurs'}
                  </button>

                  {/* Sélecteur d'utilisateurs */}
                  {showUserSelector && (
                    <div className="bg-noir-900 border border-noir-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {/* Barre de recherche */}
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full px-3 py-2 bg-noir-800 border border-noir-700 rounded-lg text-white mb-3 text-sm"
                      />

                      {/* Liste des utilisateurs */}
                      <div className="space-y-2">
                        {allUsers
                          .filter(user => {
                            if (!userSearchTerm) return true
                            const search = userSearchTerm.toLowerCase()
                            return (
                              user.email.toLowerCase().includes(search) ||
                              user.nom.toLowerCase().includes(search) ||
                              user.prenom.toLowerCase().includes(search)
                            )
                          })
                          .map(user => {
                            const isSelected = formData.allowedUserIds.includes(user.id)
                            return (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormData({
                                      ...formData,
                                      allowedUserIds: formData.allowedUserIds.filter(id => id !== user.id)
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      allowedUserIds: [...formData.allowedUserIds, user.id]
                                    })
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                                    : 'bg-noir-800 border border-noir-700 text-gray-300 hover:bg-noir-700'
                                }`}
                              >
                                <div className="font-semibold">{user.prenom} {user.nom}</div>
                                <div className="text-xs text-gray-400">{user.email}</div>
                              </button>
                            )
                          })}
                        {allUsers.filter(user => {
                          if (!userSearchTerm) return true
                          const search = userSearchTerm.toLowerCase()
                          return (
                            user.email.toLowerCase().includes(search) ||
                            user.nom.toLowerCase().includes(search) ||
                            user.prenom.toLowerCase().includes(search)
                          )
                        }).length === 0 && (
                          <div className="text-center text-gray-400 text-sm py-4">
                            Aucun utilisateur trouvé
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.allowedUserIds.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Aucun utilisateur sélectionné = code valable pour tous les utilisateurs
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  rows={2}
                  placeholder="Description du code promo"
                />
              </div>

              {/* Actif */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="active" className="text-sm">Code promo actif</label>
              </div>

              {/* Boutons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingCode(null)
                    resetForm()
                    setMessage(null)
                  }}
                  className="btn btn-secondary btn-md"
                >
                  Annuler
                </button>
                <button
                  onClick={editingCode ? handleUpdateCode : handleAddCode}
                  className="btn btn-primary btn-md"
                >
                  <Check className="w-4 h-4" />
                  {editingCode ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des codes */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Codes promo ({promoCodes.length})</h2>

          {promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Aucun code promo pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {promoCodes.map(code => {
                const usageCount = getPromoCodeUsageCount(code.id)
                return (
                  <div
                    key={code.id}
                    className="bg-noir-900 border border-noir-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-yellow-500">{code.code}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            code.active 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {code.active ? 'Actif' : 'Inactif'}
                          </span>
                          {code.maxUses && (
                            <span className="text-xs text-gray-400">
                              {usageCount} / {code.maxUses} utilisations
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-300 mb-2">
                          <span className="font-semibold">
                            {code.discountValue}
                            {code.discountType === 'percentage' ? '%' : '€'}
                          </span>
                          {' de réduction'}
                          {code.minPurchase && ` • Minimum ${code.minPurchase}€`}
                        </div>

                        {code.description && (
                          <p className="text-sm text-gray-400 mb-2">{code.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          {code.allowedCategories && code.allowedCategories.length > 0 && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                              Catégories: {code.allowedCategories.join(', ')}
                            </span>
                          )}
                          {code.allowedGammes && code.allowedGammes.length > 0 && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                              Gammes d'appât: {code.allowedGammes.join(', ')}
                            </span>
                          )}
                          {code.allowedConditionnements && code.allowedConditionnements.length > 0 && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Conditionnements: {code.allowedConditionnements.join(', ')}
                            </span>
                          )}
                          {code.validFrom && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                              Du {new Date(code.validFrom).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          {code.validUntil && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                              Jusqu'au {new Date(code.validUntil).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCode(code)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}