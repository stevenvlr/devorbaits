'use client'

import { useState, useEffect } from 'react'
import { Save, X, Percent, Globe, Package, Calendar } from 'lucide-react'
import { 
  loadAllGlobalPromotions, 
  saveGlobalPromotion, 
  deleteGlobalPromotion,
  onGlobalPromotionUpdate,
  type GlobalPromotion 
} from '@/lib/global-promotion-manager'
import { loadGammes } from '@/lib/gammes-manager'
import { loadProductsSync } from '@/lib/products-manager'

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

export default function GlobalPromotionAdminPage() {
  const [promotions, setPromotions] = useState<GlobalPromotion[]>([])
  const [editingPromotion, setEditingPromotion] = useState<GlobalPromotion | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [gammes, setGammes] = useState<string[]>([])

  // États du formulaire
  const [formData, setFormData] = useState({
    active: false,
    discountPercentage: 10,
    applyToAll: true,
    allowedCategories: [] as string[],
    allowedGammes: [] as string[],
    description: '',
    validFrom: '',
    validUntil: ''
  })

  useEffect(() => {
    loadGammes().then(setGammes).catch(console.error)
  }, [])

  const loadPromotionsData = async () => {
    const data = await loadAllGlobalPromotions()
    setPromotions(data)
  }

  useEffect(() => {
    loadPromotionsData()
    const unsubscribe = onGlobalPromotionUpdate(() => {
      loadPromotionsData()
    })
    return unsubscribe
  }, [])

  const handleEdit = (promotion: GlobalPromotion) => {
    setEditingPromotion(promotion)
    setFormData({
      active: promotion.active,
      discountPercentage: promotion.discountPercentage,
      applyToAll: promotion.applyToAll,
      allowedCategories: promotion.allowedCategories || [],
      allowedGammes: promotion.allowedGammes || [],
      description: promotion.description || '',
      validFrom: promotion.validFrom ? new Date(promotion.validFrom).toISOString().slice(0, 16) : '',
      validUntil: promotion.validUntil ? new Date(promotion.validUntil).toISOString().slice(0, 16) : ''
    })
  }

  const handleSave = async () => {
    if (formData.discountPercentage <= 0 || formData.discountPercentage > 100) {
      setMessage({ type: 'error', text: 'Le pourcentage doit être entre 1 et 100' })
      return
    }

    if (!formData.applyToAll && formData.allowedCategories.length === 0 && formData.allowedGammes.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins une catégorie ou une gamme si la promotion ne s\'applique pas à tout le site' })
      return
    }

    const promotion: GlobalPromotion = {
      id: editingPromotion?.id || '',
      active: formData.active,
      discountPercentage: formData.discountPercentage,
      applyToAll: formData.applyToAll,
      allowedCategories: formData.applyToAll ? undefined : (formData.allowedCategories.length > 0 ? formData.allowedCategories : undefined),
      allowedGammes: formData.applyToAll ? undefined : (formData.allowedGammes.length > 0 ? formData.allowedGammes : undefined),
      description: formData.description || undefined,
      validFrom: formData.validFrom || undefined,
      validUntil: formData.validUntil || undefined,
      createdAt: editingPromotion?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    const result = await saveGlobalPromotion(promotion)
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setEditingPromotion(null)
      setFormData({
        active: false,
        discountPercentage: 10,
        applyToAll: true,
        allowedCategories: [],
        allowedGammes: [],
        description: '',
        validFrom: '',
        validUntil: ''
      })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      return
    }

    const result = await deleteGlobalPromotion(id)
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const activePromotion = promotions.find(p => p.active)

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Promotion Globale</h1>
          <p className="text-gray-400">
            Gérez les promotions globales sur tout le site ou sur des types de produits spécifiques
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-500' 
              : 'bg-red-500/10 border border-red-500/30 text-red-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Promotion active */}
        {activePromotion && (
          <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-yellow-500 mb-2">Promotion Active</h3>
                <p className="text-gray-300">
                  <strong>{activePromotion.discountPercentage}%</strong> de réduction
                  {activePromotion.applyToAll 
                    ? ' sur tout le site' 
                    : ` sur ${activePromotion.allowedCategories?.length || 0} catégorie(s) et ${activePromotion.allowedGammes?.length || 0} gamme(s)`
                  }
                </p>
                {activePromotion.description && (
                  <p className="text-gray-400 mt-2">{activePromotion.description}</p>
                )}
              </div>
              <button
                onClick={() => handleEdit(activePromotion)}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-lg transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {editingPromotion ? 'Modifier la promotion' : 'Créer une nouvelle promotion'}
          </h2>

          <div className="space-y-6">
            {/* Actif */}
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="active" className="text-lg font-medium">
                Activer cette promotion
              </label>
            </div>

            {/* Pourcentage */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Pourcentage de réduction (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.1"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Application */}
            <div>
              <label className="block text-sm font-medium mb-4">
                Application de la promotion
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="applyAll"
                    name="apply"
                    checked={formData.applyToAll}
                    onChange={() => setFormData({ ...formData, applyToAll: true })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="applyAll" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span>Sur tout le site</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="applySelected"
                    name="apply"
                    checked={!formData.applyToAll}
                    onChange={() => setFormData({ ...formData, applyToAll: false })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="applySelected" className="flex items-center gap-2 cursor-pointer">
                    <Package className="w-5 h-5 text-purple-500" />
                    <span>Sur des types de produits spécifiques</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Filtres si pas tout le site */}
            {!formData.applyToAll && (
              <div className="space-y-4 p-4 bg-noir-900/50 rounded-lg">
                {/* Catégories */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Catégories éligibles
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CATEGORIES.map(category => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                allowedCategories: [...formData.allowedCategories, category]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                allowedCategories: formData.allowedCategories.filter(c => c !== category)
                              })
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Gammes */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Gammes éligibles
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {gammes.map(gamme => (
                      <label key={gamme} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowedGammes.includes(gamme)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                allowedGammes: [...formData.allowedGammes, gamme]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                allowedGammes: formData.allowedGammes.filter(g => g !== gamme)
                              })
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{gamme}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                rows={3}
                placeholder="Ex: Promotion spéciale été 2024"
              />
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date de début (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  La promotion sera active à partir de cette date. Si non renseigné, la promotion est active immédiatement.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date de fin (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  La promotion sera active jusqu'à la fin de cette journée. Si non renseigné, la promotion n'a pas de date de fin.
                </p>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
              >
                <Save className="w-5 h-5" />
                {editingPromotion ? 'Mettre à jour' : 'Créer la promotion'}
              </button>
              {editingPromotion && (
                <button
                  onClick={() => {
                    setEditingPromotion(null)
                    setFormData({
                      active: false,
                      discountPercentage: 10,
                      applyToAll: true,
                      allowedCategories: [],
                      allowedGammes: [],
                      description: '',
                      validFrom: '',
                      validUntil: ''
                    })
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des promotions */}
        {promotions.length > 0 && (
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Historique des promotions</h2>
            <div className="space-y-4">
              {promotions.map(promotion => (
                <div
                  key={promotion.id}
                  className={`p-4 rounded-lg border ${
                    promotion.active
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-noir-900/50 border-noir-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg">{promotion.discountPercentage}%</span>
                        {promotion.active && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {promotion.applyToAll
                          ? 'Sur tout le site'
                          : `${promotion.allowedCategories?.length || 0} catégorie(s), ${promotion.allowedGammes?.length || 0} gamme(s)`
                        }
                      </p>
                      {promotion.description && (
                        <p className="text-gray-300 mt-1">{promotion.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(promotion)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 rounded-lg transition-colors"
                      >
                        Modifier
                      </button>
                      {!promotion.active && (
                        <button
                          onClick={() => handleDelete(promotion.id)}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
