'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2, Plus, Package, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { getAllShippingPrices, saveShippingPrice, deleteShippingPrice, type ShippingPrice } from '@/lib/shipping-prices'

export default function ShippingPricesAdminPage() {
  const [prices, setPrices] = useState<ShippingPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingPrice, setEditingPrice] = useState<Partial<ShippingPrice> | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadPrices()
  }, [])

  const loadPrices = async () => {
    try {
      setLoading(true)
      const data = await getAllShippingPrices()
      setPrices(data)
    } catch (error) {
      console.error('Erreur lors du chargement des tarifs:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des tarifs' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editingPrice?.name || !editingPrice?.type) {
      setMessage({ type: 'error', text: 'Le nom et le type sont obligatoires' })
      return
    }

    // Validation selon le type
    if (editingPrice.type === 'fixed' && (!editingPrice.fixed_price || editingPrice.fixed_price <= 0)) {
      setMessage({ type: 'error', text: 'Le prix fixe doit être supérieur à 0' })
      return
    }
    if (editingPrice.type === 'margin_percent' && (!editingPrice.margin_percent || editingPrice.margin_percent <= 0)) {
      setMessage({ type: 'error', text: 'La marge en pourcentage doit être supérieure à 0' })
      return
    }
    if (editingPrice.type === 'margin_fixed' && (!editingPrice.margin_fixed || editingPrice.margin_fixed <= 0)) {
      setMessage({ type: 'error', text: 'La marge fixe doit être supérieure à 0' })
      return
    }
    if (editingPrice.type === 'weight_ranges' && (!editingPrice.weight_ranges || editingPrice.weight_ranges.length === 0)) {
      setMessage({ type: 'error', text: 'Vous devez ajouter au moins une tranche de poids' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)
      
      const success = await saveShippingPrice(editingPrice)
      
      if (success) {
        setMessage({ type: 'success', text: 'Tarif sauvegardé avec succès !' })
        setShowForm(false)
        setEditingPrice(null)
        await loadPrices()
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Erreur lors de la sauvegarde. Vérifiez la console (F12) pour plus de détails.' 
        })
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage({ 
        type: 'error', 
        text: `Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}` 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      return
    }

    try {
      const success = await deleteShippingPrice(id)
      if (success) {
        setMessage({ type: 'success', text: 'Tarif supprimé avec succès !' })
        await loadPrices()
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  const handleEdit = (price: ShippingPrice) => {
    setEditingPrice(price)
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingPrice({
      name: '',
      type: 'boxtal_only',
      active: true,
      free_shipping_threshold: 100
    })
    setShowForm(true)
  }

  const addWeightRange = () => {
    if (!editingPrice) return
    const ranges = editingPrice.weight_ranges || []
    setEditingPrice({
      ...editingPrice,
      weight_ranges: [...ranges, { min: 0, max: null, price: 0 }]
    })
  }

  const removeWeightRange = (index: number) => {
    if (!editingPrice?.weight_ranges) return
    const ranges = [...editingPrice.weight_ranges]
    ranges.splice(index, 1)
    setEditingPrice({
      ...editingPrice,
      weight_ranges: ranges
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <span className="ml-3 text-gray-300">Chargement des tarifs...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gestion des Tarifs d'Expédition</h1>
            <p className="text-gray-400">
              Configurez vos tarifs d'expédition : prix fixes, marges, ou tarifs par poids
            </p>
          </div>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-yellow-500 text-noir-950 rounded-lg hover:bg-yellow-400 font-semibold flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau tarif
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {showForm && editingPrice && (
          <div className="mb-6 bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {editingPrice.id ? 'Modifier le tarif' : 'Nouveau tarif'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingPrice(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du tarif <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingPrice.name || ''}
                  onChange={(e) => setEditingPrice({ ...editingPrice, name: e.target.value })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Ex: Livraison Standard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type de tarif <span className="text-red-400">*</span>
                </label>
                <select
                  value={editingPrice.type || 'boxtal_only'}
                  onChange={(e) => setEditingPrice({ ...editingPrice, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                >
                  <option value="boxtal_only">Utiliser uniquement Boxtal (pas de modification)</option>
                  <option value="fixed">Prix fixe</option>
                  <option value="margin_percent">Marge en pourcentage sur Boxtal</option>
                  <option value="margin_fixed">Marge fixe en euros sur Boxtal</option>
                  <option value="weight_ranges">Tarifs par tranches de poids</option>
                </select>
              </div>

              {editingPrice.type === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prix fixe (€) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPrice.fixed_price || ''}
                    onChange={(e) => setEditingPrice({ ...editingPrice, fixed_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    placeholder="5.99"
                  />
                </div>
              )}

              {editingPrice.type === 'margin_percent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Marge en pourcentage (%) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPrice.margin_percent || ''}
                    onChange={(e) => setEditingPrice({ ...editingPrice, margin_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    placeholder="10.00"
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Ex: 10% = prix Boxtal × 1.10
                  </p>
                </div>
              )}

              {editingPrice.type === 'margin_fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Marge fixe (€) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPrice.margin_fixed || ''}
                    onChange={(e) => setEditingPrice({ ...editingPrice, margin_fixed: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    placeholder="2.50"
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Ex: 2.50€ = prix Boxtal + 2.50€
                  </p>
                </div>
              )}

              {editingPrice.type === 'weight_ranges' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tranches de poids
                  </label>
                  <div className="space-y-2">
                    {(editingPrice.weight_ranges || []).map((range, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={range.min || ''}
                          onChange={(e) => {
                            const ranges = [...(editingPrice.weight_ranges || [])]
                            ranges[index].min = parseFloat(e.target.value) || 0
                            setEditingPrice({ ...editingPrice, weight_ranges: ranges })
                          }}
                          className="w-24 px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                          placeholder="Min"
                        />
                        <span className="text-gray-400">à</span>
                        <input
                          type="number"
                          step="0.1"
                          value={range.max || ''}
                          onChange={(e) => {
                            const ranges = [...(editingPrice.weight_ranges || [])]
                            ranges[index].max = e.target.value ? parseFloat(e.target.value) : null
                            setEditingPrice({ ...editingPrice, weight_ranges: ranges })
                          }}
                          className="w-24 px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                          placeholder="Max"
                        />
                        <span className="text-gray-400">kg →</span>
                        <input
                          type="number"
                          step="0.01"
                          value={range.price || ''}
                          onChange={(e) => {
                            const ranges = [...(editingPrice.weight_ranges || [])]
                            ranges[index].price = parseFloat(e.target.value) || 0
                            setEditingPrice({ ...editingPrice, weight_ranges: ranges })
                          }}
                          className="w-32 px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                          placeholder="Prix €"
                        />
                        <button
                          onClick={() => removeWeightRange(index)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addWeightRange}
                      className="px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-gray-300 hover:text-white text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une tranche
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Livraison gratuite à partir de (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPrice.free_shipping_threshold || ''}
                    onChange={(e) => setEditingPrice({ ...editingPrice, free_shipping_threshold: parseFloat(e.target.value) || undefined })}
                    className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Actif
                  </label>
                  <select
                    value={editingPrice.active ? 'true' : 'false'}
                    onChange={(e) => setEditingPrice({ ...editingPrice, active: e.target.value === 'true' })}
                    className="w-full px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  >
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingPrice(null)
                  }}
                  className="px-4 py-2 bg-noir-700 text-gray-300 rounded-lg hover:bg-noir-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-yellow-500 text-noir-950 rounded-lg hover:bg-yellow-400 font-semibold flex items-center disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {prices.map((price) => (
            <div
              key={price.id}
              className={`bg-noir-800/50 border rounded-xl p-6 ${
                price.active ? 'border-noir-700' : 'border-noir-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-yellow-500" />
                    {price.name}
                    {price.active && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        Actif
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Type: {price.type === 'boxtal_only' && 'Boxtal uniquement'}
                    {price.type === 'fixed' && `Prix fixe: ${price.fixed_price}€`}
                    {price.type === 'margin_percent' && `Marge: +${price.margin_percent}%`}
                    {price.type === 'margin_fixed' && `Marge: +${price.margin_fixed}€`}
                    {price.type === 'weight_ranges' && `${price.weight_ranges?.length || 0} tranche(s) de poids`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(price)}
                    className="px-3 py-2 bg-noir-700 text-gray-300 rounded-lg hover:bg-noir-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(price.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {price.free_shipping_threshold && (
                <p className="text-sm text-gray-400">
                  🎁 Livraison gratuite à partir de {price.free_shipping_threshold}€
                </p>
              )}
            </div>
          ))}

          {prices.length === 0 && (
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 text-center">
              <p className="text-gray-400">Aucun tarif configuré. Créez-en un pour commencer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



