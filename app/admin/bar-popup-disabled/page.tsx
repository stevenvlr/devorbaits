'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, X, AlertCircle } from 'lucide-react'
import { 
  loadDisabledCombinations, 
  addDisabledCombination, 
  removeDisabledCombinationById,
  type DisabledCombination
} from '@/lib/bar-popup-disabled-combinations'
import {
  loadBarPopupCouleursFluo,
  loadBarPopupCouleursPastel,
  loadBarPopupTaillesFluo,
  loadBarPopupTaillesPastel,
  type Couleur
} from '@/lib/popup-variables-manager'

export default function BarPopupDisabledPage() {
  const [combinations, setCombinations] = useState<DisabledCombination[]>([])
  const [couleursFluo, setCouleursFluo] = useState<Couleur[]>([])
  const [couleursPastel, setCouleursPastel] = useState<Couleur[]>([])
  const [taillesFluo, setTaillesFluo] = useState<string[]>([])
  const [taillesPastel, setTaillesPastel] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedCouleur, setSelectedCouleur] = useState<string>('')
  const [selectedTaille, setSelectedTaille] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Charger les données
  const loadData = async () => {
    try {
      const [combinationsData, couleursFluoData, couleursPastelData, taillesFluoData, taillesPastelData] = await Promise.all([
        loadDisabledCombinations(),
        loadBarPopupCouleursFluo(),
        loadBarPopupCouleursPastel(),
        loadBarPopupTaillesFluo(),
        loadBarPopupTaillesPastel()
      ])
      
      setCombinations(combinationsData || [])
      setCouleursFluo(Array.isArray(couleursFluoData) ? couleursFluoData : [])
      setCouleursPastel(Array.isArray(couleursPastelData) ? couleursPastelData : [])
      setTaillesFluo(Array.isArray(taillesFluoData) ? taillesFluoData : [])
      setTaillesPastel(Array.isArray(taillesPastelData) ? taillesPastelData : [])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Obtenir toutes les couleurs
  const allCouleurs = [...couleursFluo, ...couleursPastel]

  // Obtenir les tailles disponibles selon la couleur sélectionnée
  const availableTailles = selectedCouleur
    ? (() => {
        const couleur = allCouleurs.find(c => c.name === selectedCouleur)
        return couleur?.type === 'fluo' ? taillesFluo : taillesPastel
      })()
    : []

  // Ajouter une combinaison désactivée
  const handleAdd = async () => {
    if (!selectedCouleur || !selectedTaille) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une couleur et une taille' })
      return
    }

    // Vérifier si la combinaison existe déjà
    const exists = combinations.some(
      c => c.couleur_name === selectedCouleur && c.taille === selectedTaille
    )

    if (exists) {
      setMessage({ type: 'error', text: 'Cette combinaison est déjà désactivée' })
      return
    }

    setIsLoading(true)
    try {
      const success = await addDisabledCombination(selectedCouleur, selectedTaille)
      if (success) {
        setMessage({ type: 'success', text: `Combinaison "${selectedCouleur}" / "${selectedTaille}" désactivée avec succès` })
        setSelectedCouleur('')
        setSelectedTaille('')
        setShowAddForm(false)
        await loadData()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la désactivation de la combinaison' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la désactivation de la combinaison' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Supprimer une combinaison désactivée
  const handleRemove = async (id: string, couleurName: string, taille: string) => {
    if (!confirm(`Réactiver la combinaison "${couleurName}" / "${taille}" ?`)) {
      return
    }

    setIsLoading(true)
    try {
      const success = await removeDisabledCombinationById(id)
      if (success) {
        setMessage({ type: 'success', text: `Combinaison "${couleurName}" / "${taille}" réactivée avec succès` })
        await loadData()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la réactivation de la combinaison' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la réactivation de la combinaison' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Réinitialiser la taille quand la couleur change
  useEffect(() => {
    if (selectedCouleur && availableTailles.length > 0) {
      if (!availableTailles.includes(selectedTaille)) {
        setSelectedTaille('')
      }
    } else {
      setSelectedTaille('')
    }
  }, [selectedCouleur, availableTailles])

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Gestion des Combinaisons Désactivées</h1>
          <p className="text-gray-400">Désactivez certaines combinaisons taille/couleur pour le bar à pop-up</p>
        </div>

        {/* Message de succès/erreur */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="mb-8 bg-noir-800/50 border border-noir-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Désactiver une combinaison</h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setSelectedCouleur('')
                  setSelectedTaille('')
                  setMessage(null)
                }}
                className="p-2 hover:bg-noir-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Couleur *</label>
                <select
                  value={selectedCouleur}
                  onChange={(e) => setSelectedCouleur(e.target.value)}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                >
                  <option value="">Sélectionner une couleur</option>
                  {couleursFluo.length > 0 && (
                    <optgroup label="Couleurs fluo">
                      {couleursFluo.map(couleur => (
                        <option key={couleur.name} value={couleur.name}>
                          {couleur.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {couleursPastel.length > 0 && (
                    <optgroup label="Couleurs pastel">
                      {couleursPastel.map(couleur => (
                        <option key={couleur.name} value={couleur.name}>
                          {couleur.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Taille *</label>
                <select
                  value={selectedTaille}
                  onChange={(e) => setSelectedTaille(e.target.value)}
                  disabled={!selectedCouleur || availableTailles.length === 0}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedCouleur 
                      ? 'Sélectionnez d\'abord une couleur' 
                      : availableTailles.length === 0 
                        ? 'Aucune taille disponible' 
                        : 'Sélectionner une taille'}
                  </option>
                  {availableTailles.map(taille => (
                    <option key={taille} value={taille}>
                      {taille}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setSelectedCouleur('')
                    setSelectedTaille('')
                    setMessage(null)
                  }}
                  className="btn btn-secondary btn-md"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  className="btn btn-primary btn-md"
                  disabled={isLoading || !selectedCouleur || !selectedTaille}
                >
                  <Plus className="w-4 h-4" />
                  Désactiver la combinaison
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bouton pour afficher le formulaire */}
        {!showAddForm && (
          <div className="mb-8">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary btn-md"
            >
              <Plus className="w-4 h-4" />
              Désactiver une combinaison
            </button>
          </div>
        )}

        {/* Liste des combinaisons désactivées */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            Combinaisons désactivées ({combinations?.length || 0})
          </h2>

          {!combinations || combinations.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Aucune combinaison désactivée pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {combinations.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-noir-900 border border-noir-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-1">{combo.couleur_name}</div>
                      <div className="text-sm text-gray-400">Taille: {combo.taille}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(combo.id, combo.couleur_name, combo.taille)}
                      disabled={isLoading}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Réactiver cette combinaison"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <strong>Note :</strong> Les combinaisons désactivées ne seront pas disponibles à la sélection sur la page Bar à Pop-up. 
            Les clients ne pourront pas choisir ces combinaisons taille/couleur.
          </p>
        </div>
      </div>
    </div>
  )
}
