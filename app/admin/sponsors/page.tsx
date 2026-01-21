'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Mail, Plus, RefreshCw, Save, Search, Star, Trash2, Truck, User as UserIcon, X } from 'lucide-react'
import { getAllUsers, type User } from '@/lib/auth-supabase'
import { getSupabaseClient } from '@/lib/supabase'
import { getSponsorShippingRates, saveSponsorShippingRates } from '@/lib/shipping-prices'

export default function AdminSponsorsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [rates, setRates] = useState<Array<{ min_weight: number; max_weight: number | null; price: number }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddSponsor, setShowAddSponsor] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Tarifs par défaut
  const defaultRates = [
    { min_weight: 0, max_weight: 5, price: 5 },
    { min_weight: 5, max_weight: 10, price: 8 },
    { min_weight: 10, max_weight: 20, price: 12 },
    { min_weight: 20, max_weight: null, price: 15 },
  ]

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [allUsers, sponsorRates] = await Promise.all([
        getAllUsers(),
        getSponsorShippingRates()
      ])
      setUsers(allUsers)
      setRates(sponsorRates.length > 0 ? sponsorRates.map(r => ({
        min_weight: r.min_weight,
        max_weight: r.max_weight,
        price: r.price
      })) : defaultRates)
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const sponsors = users.filter(u => u.isSponsored)
  const nonSponsors = users.filter(u => !u.isSponsored)

  // Filtrer les non-sponsors par recherche
  const filteredNonSponsors = useMemo(() => {
    if (!searchQuery.trim()) return nonSponsors
    const q = searchQuery.toLowerCase()
    return nonSponsors.filter(u => 
      u.email.toLowerCase().includes(q) ||
      (u.nom && u.nom.toLowerCase().includes(q)) ||
      (u.prenom && u.prenom.toLowerCase().includes(q))
    )
  }, [nonSponsors, searchQuery])

  // Sauvegarder la grille tarifaire
  const saveRates = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const ok = await saveSponsorShippingRates(rates)
      if (ok) {
        setSuccess('Grille tarifaire sauvegardée')
      } else {
        setError('Erreur lors de la sauvegarde')
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  // Ajouter plusieurs sponsors
  const addSponsors = async () => {
    if (selectedUserIds.length === 0) return
    
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase non configuré')

      // Mettre à jour tous les utilisateurs sélectionnés
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_sponsored: true, updated_at: new Date().toISOString() })
        .in('id', selectedUserIds)

      if (updateError) throw updateError

      setSuccess(`${selectedUserIds.length} sponsor(s) ajouté(s)`)
      setShowAddSponsor(false)
      setSelectedUserIds([])
      setSearchQuery('')
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  // Retirer un sponsor
  const removeSponsor = async (userId: string) => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase non configuré')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_sponsored: false, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) throw updateError

      setSuccess('Sponsor retiré')
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  // Toggle sélection d'un utilisateur
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Sélectionner/Désélectionner tous les résultats filtrés
  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredNonSponsors.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredNonSponsors.map(u => u.id))
    }
  }

  // Gestion des tranches
  const addRate = () => {
    const last = rates[rates.length - 1]
    const newMin = last ? (last.max_weight || last.min_weight + 10) : 0
    setRates([...rates, { min_weight: newMin, max_weight: null, price: 10 }])
  }

  const updateRate = (index: number, field: string, value: number | null) => {
    const newRates = [...rates]
    newRates[index] = { ...newRates[index], [field]: value }
    setRates(newRates)
  }

  const removeRate = (index: number) => {
    setRates(rates.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-yellow-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'admin
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-4">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">GESTION DES SPONSORS</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Membres Sponsorisés</h1>
          <p className="text-gray-400">Gérez la grille tarifaire unique et les membres sponsorisés.</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Section 1 : Grille tarifaire globale */}
            <div className="bg-noir-800/50 border border-yellow-500/30 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-yellow-500" />
                Grille Tarifaire Sponsor (pour tous les sponsors)
              </h2>
              
              <div className="space-y-2 mb-4">
                {rates.map((rate, i) => (
                  <div key={i} className="flex items-center gap-2 bg-noir-900 rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={rate.min_weight}
                        onChange={(e) => updateRate(i, 'min_weight', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-noir-800 border border-noir-700 rounded text-white text-center"
                        min="0"
                        step="0.1"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        value={rate.max_weight ?? ''}
                        onChange={(e) => updateRate(i, 'max_weight', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="∞"
                        className="w-16 px-2 py-1 bg-noir-800 border border-noir-700 rounded text-white text-center placeholder-gray-500"
                        min="0"
                        step="0.1"
                      />
                      <span className="text-gray-400 text-sm">kg</span>
                    </div>
                    <span className="text-gray-400">=</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={rate.price}
                        onChange={(e) => updateRate(i, 'price', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-noir-800 border border-noir-700 rounded text-white text-center"
                        min="0"
                        step="0.01"
                      />
                      <span className="text-gray-400 text-sm">€</span>
                    </div>
                    {rates.length > 1 && (
                      <button onClick={() => removeRate(i)} className="p-1 text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addRate}
                  className="inline-flex items-center gap-1 text-sm text-yellow-500 hover:text-yellow-400"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une tranche
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={saveRates}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Sauvegarder la grille'}
                </button>
              </div>
            </div>

            {/* Section 2 : Liste des sponsors */}
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-yellow-500" />
                  Membres Sponsors ({sponsors.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddSponsor(!showAddSponsor)}
                    className={`inline-flex items-center gap-2 px-3 py-2 font-medium rounded-lg transition-colors ${
                      showAddSponsor 
                        ? 'bg-noir-700 text-white' 
                        : 'bg-green-600 text-white hover:bg-green-500'
                    }`}
                  >
                    {showAddSponsor ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showAddSponsor ? 'Fermer' : 'Ajouter'}
                  </button>
                  <button
                    onClick={loadData}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-noir-700 text-white rounded-lg hover:bg-noir-600 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Panel ajouter sponsors */}
              {showAddSponsor && (
                <div className="mb-6 bg-noir-900 border border-green-500/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-3">Rechercher et sélectionner des utilisateurs à ajouter :</p>
                  
                  {/* Barre de recherche */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher par email, nom ou prénom..."
                      className="w-full pl-10 pr-4 py-2 bg-noir-800 border border-noir-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-yellow-500 hover:text-yellow-400"
                    >
                      {selectedUserIds.length === filteredNonSponsors.length && filteredNonSponsors.length > 0
                        ? 'Tout désélectionner'
                        : `Tout sélectionner (${filteredNonSponsors.length})`
                      }
                    </button>
                    <span className="text-sm text-gray-400">
                      {selectedUserIds.length} sélectionné(s)
                    </span>
                  </div>

                  {/* Liste des utilisateurs */}
                  <div className="max-h-64 overflow-y-auto space-y-1 mb-3">
                    {filteredNonSponsors.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        {searchQuery ? 'Aucun résultat' : 'Tous les utilisateurs sont déjà sponsors'}
                      </p>
                    ) : (
                      filteredNonSponsors.map(u => (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedUserIds.includes(u.id) 
                              ? 'bg-green-500/20 border border-green-500/50' 
                              : 'bg-noir-800 hover:bg-noir-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUserSelection(u.id)}
                            className="w-4 h-4 rounded border-noir-600 text-green-500 focus:ring-green-500 focus:ring-offset-noir-900"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {u.nom && u.prenom ? `${u.nom} ${u.prenom}` : u.email}
                            </p>
                            {u.nom && u.prenom && (
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {/* Bouton ajouter */}
                  <button
                    onClick={addSponsors}
                    disabled={selectedUserIds.length === 0 || saving}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? 'Ajout en cours...' : `Ajouter ${selectedUserIds.length} sponsor(s)`}
                  </button>
                </div>
              )}

              {/* Liste des sponsors actuels */}
              {sponsors.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Aucun sponsor</p>
                  <p className="text-sm text-gray-500">Cliquez sur "Ajouter" pour ajouter des membres sponsors</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sponsors.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-noir-900 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {user.nom && user.prenom ? `${user.nom} ${user.prenom}` : user.email}
                          </p>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Retirer le statut sponsor ?')) {
                            removeSponsor(user.id)
                          }
                        }}
                        disabled={saving}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
