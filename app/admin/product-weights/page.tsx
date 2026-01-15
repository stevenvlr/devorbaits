'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save, Package, Scale } from 'lucide-react'
import { 
  getAllProductWeights, 
  saveProductWeight, 
  deleteProductWeight,
  type ProductWeight 
} from '@/lib/product-weights'

export default function ProductWeightsPage() {
  const [weights, setWeights] = useState<ProductWeight[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Nouveau poids
  const [newWeight, setNewWeight] = useState({
    product_type: '',
    conditionnement: '',
    weight_kg: '',
    description: ''
  })

  // Charger les poids
  useEffect(() => {
    loadWeights()
  }, [])

  const loadWeights = async () => {
    setLoading(true)
    const data = await getAllProductWeights()
    setWeights(data)
    setLoading(false)
  }

  // Ajouter un nouveau poids
  const handleAddWeight = async () => {
    if (!newWeight.product_type || !newWeight.weight_kg) {
      setMessage({ type: 'error', text: 'Type de produit et poids requis' })
      return
    }

    setSaving(true)
    const success = await saveProductWeight({
      product_type: newWeight.product_type.toLowerCase().trim(),
      conditionnement: newWeight.conditionnement?.trim() || null,
      weight_kg: parseFloat(newWeight.weight_kg),
      description: newWeight.description?.trim() || null,
      active: true
    })

    if (success) {
      setMessage({ type: 'success', text: 'Poids ajouté avec succès' })
      setNewWeight({ product_type: '', conditionnement: '', weight_kg: '', description: '' })
      await loadWeights()
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout' })
    }
    setSaving(false)
  }

  // Modifier un poids
  const handleUpdateWeight = async (weight: ProductWeight) => {
    setSaving(true)
    const success = await saveProductWeight(weight)
    
    if (success) {
      setMessage({ type: 'success', text: 'Poids mis à jour' })
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    }
    setSaving(false)
  }

  // Supprimer un poids
  const handleDeleteWeight = async (id: string) => {
    if (!confirm('Supprimer ce poids ?')) return
    
    setSaving(true)
    const success = await deleteProductWeight(id)
    
    if (success) {
      setMessage({ type: 'success', text: 'Poids supprimé' })
      await loadWeights()
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    }
    setSaving(false)
  }

  // Modifier un poids dans le state local
  const updateWeightInState = (id: string, field: keyof ProductWeight, value: any) => {
    setWeights(prev => prev.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ))
  }

  return (
    <div className="min-h-screen bg-noir-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour admin
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scale className="w-8 h-8 text-yellow-500" />
            Gestion des poids produits
          </h1>
          <p className="text-gray-400 mt-2">
            Configurez les poids des produits pour le calcul des frais d'expédition
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-yellow-500" />
            Ajouter un poids
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type de produit *</label>
              <input
                type="text"
                value={newWeight.product_type}
                onChange={(e) => setNewWeight({ ...newWeight, product_type: e.target.value })}
                placeholder="ex: bouillette, spray plus..."
                className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Conditionnement</label>
              <input
                type="text"
                value={newWeight.conditionnement}
                onChange={(e) => setNewWeight({ ...newWeight, conditionnement: e.target.value })}
                placeholder="ex: 1kg, 2.5kg..."
                className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Poids (kg) *</label>
              <input
                type="number"
                step="0.001"
                value={newWeight.weight_kg}
                onChange={(e) => setNewWeight({ ...newWeight, weight_kg: e.target.value })}
                placeholder="ex: 1.1"
                className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={newWeight.description}
                onChange={(e) => setNewWeight({ ...newWeight, description: e.target.value })}
                placeholder="ex: Avec emballage"
                className="w-full bg-noir-900 border border-noir-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
          <button
            onClick={handleAddWeight}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
          >
            {saving ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>

        {/* Liste des poids */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-500" />
            Poids configurés ({weights.length})
          </h2>

          {loading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : weights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Aucun poids configuré</p>
              <p className="text-sm text-gray-500">
                Exécutez le script SQL <code className="bg-noir-900 px-2 py-1 rounded">supabase-add-product-weights-table.sql</code> pour ajouter les poids par défaut
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-noir-700 text-left">
                    <th className="pb-3 text-gray-400 font-medium">Type</th>
                    <th className="pb-3 text-gray-400 font-medium">Conditionnement</th>
                    <th className="pb-3 text-gray-400 font-medium">Poids (kg)</th>
                    <th className="pb-3 text-gray-400 font-medium">Description</th>
                    <th className="pb-3 text-gray-400 font-medium">Actif</th>
                    <th className="pb-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weights.map((weight) => (
                    <tr key={weight.id} className="border-b border-noir-700/50">
                      <td className="py-3">
                        <input
                          type="text"
                          value={weight.product_type}
                          onChange={(e) => updateWeightInState(weight.id, 'product_type', e.target.value)}
                          className="bg-noir-900 border border-noir-700 rounded px-3 py-1 text-white w-full max-w-[150px]"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="text"
                          value={weight.conditionnement || ''}
                          onChange={(e) => updateWeightInState(weight.id, 'conditionnement', e.target.value || null)}
                          placeholder="-"
                          className="bg-noir-900 border border-noir-700 rounded px-3 py-1 text-white w-full max-w-[100px]"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          step="0.001"
                          value={weight.weight_kg}
                          onChange={(e) => updateWeightInState(weight.id, 'weight_kg', parseFloat(e.target.value) || 0)}
                          className="bg-noir-900 border border-noir-700 rounded px-3 py-1 text-white w-20"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="text"
                          value={weight.description || ''}
                          onChange={(e) => updateWeightInState(weight.id, 'description', e.target.value || null)}
                          className="bg-noir-900 border border-noir-700 rounded px-3 py-1 text-white w-full max-w-[200px]"
                        />
                      </td>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={weight.active}
                          onChange={(e) => updateWeightInState(weight.id, 'active', e.target.checked)}
                          className="w-5 h-5 rounded"
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateWeight(weight)}
                            disabled={saving}
                            className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            title="Sauvegarder"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWeight(weight.id)}
                            disabled={saving}
                            className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <h3 className="font-semibold text-blue-400 mb-2">💡 Comment ça fonctionne</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Le <strong>type de produit</strong> doit correspondre au nom du produit dans le panier (insensible à la casse)</li>
            <li>• Le <strong>conditionnement</strong> est optionnel (utile pour les bouillettes: 1kg, 2.5kg, 5kg, 10kg)</li>
            <li>• Le <strong>poids</strong> doit inclure l'emballage</li>
            <li>• Si un produit n'est pas trouvé, un poids par défaut de 0.5kg est utilisé</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
