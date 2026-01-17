'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Trash2, X, Factory, Tag, Upload, ImageIcon, Eye, EyeOff } from 'lucide-react'
import { loadGammesForAdmin, addGamme, removeGamme, onGammesUpdate, getGammeImage, setGammeImage, removeGammeImage, onGammesImagesUpdate, toggleGammeVisibility, type GammeData } from '@/lib/gammes-manager'
import { optimizeImage } from '@/lib/image-optimizer'

export default function GammesAdminPage() {
  const [gammes, setGammes] = useState<GammeData[]>([])
  const [newGammeInput, setNewGammeInput] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [gammeImages, setGammeImages] = useState<Record<string, string>>({})
  const [editingImageFor, setEditingImageFor] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null)

  // Charger les gammes et leurs images
  const loadGammesData = async () => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/gammes/page.tsx:18',message:'loadGammesData entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
    }
    // #endregion
    try {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/gammes/page.tsx:21',message:'calling loadGammes',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
      }
      // #endregion
      const allGammes = await loadGammesForAdmin()
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/gammes/page.tsx:24',message:'loadGammesForAdmin result',data:{gammesCount:allGammes?.length || 0,gammes:allGammes,isArray:Array.isArray(allGammes)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
      }
      // #endregion
      // S'assurer que allGammes est toujours un tableau
      console.log('📋 Gammes chargées pour admin:', allGammes)
      console.log('📋 Gammes masquées:', allGammes?.filter(g => g.hidden) || [])
      setGammes(Array.isArray(allGammes) ? allGammes : [])
      
      // Charger les images
      const images: Record<string, string> = {}
      allGammes.forEach(gamme => {
        const image = getGammeImage(gamme.name)
        if (image) {
          images[gamme.name] = image
        }
      })
      setGammeImages(images)
    } catch (error: any) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/gammes/page.tsx:36',message:'loadGammesData error',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
      }
      // #endregion
      console.error('Erreur lors du chargement des gammes:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des gammes d\'appât' })
    }
  }

  useEffect(() => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/gammes/page.tsx:38',message:'GammesAdminPage useEffect',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    loadGammesData()
    const unsubscribeGammes = onGammesUpdate(loadGammesData)
    const unsubscribeImages = onGammesImagesUpdate(loadGammesData)
    return () => {
      unsubscribeGammes()
      unsubscribeImages()
    }
  }, [])

  // Ajouter une nouvelle gamme
  const handleAddGamme = async () => {
    if (!newGammeInput.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un nom de gamme d\'appât' })
      return
    }

    const result = await addGamme(newGammeInput.trim())
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setNewGammeInput('')
      setShowAddForm(false)
      await loadGammesData()
      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.message })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Supprimer une gamme
  const handleRemoveGamme = async (gamme: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la gamme d'appât "${gamme}" ?\n\nAttention : Cette action ne peut pas être annulée.`)) {
      return
    }

    const success = await removeGamme(gamme)
    
    if (success) {
      // Supprimer aussi l'image associée
      removeGammeImage(gamme)
      setMessage({ type: 'success', text: `Gamme d'appât "${gamme}" supprimée avec succès` })
      await loadGammesData()
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression de la gamme d\'appât' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Gérer l'upload d'image pour une gamme
  const handleImageUpload = async (gamme: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une image' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'L\'image est trop grande (max 5MB)' })
      return
    }

    setIsUploadingImage(true)
    setMessage(null)

    try {
      // Optimiser l'image
      const optimizedImage = await optimizeImage(file, { maxSizeKB: 500 })
      setGammeImage(gamme, optimizedImage)
      setMessage({ type: 'success', text: `Photo de la gamme d'appât "${gamme}" mise à jour !` })
      loadGammesData()
      setEditingImageFor(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload de l\'image' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsUploadingImage(false)
      e.target.value = '' // Réinitialiser l'input
    }
  }

  // Basculer la visibilité d'une gamme
  const handleToggleVisibility = async (gamme: string, currentHidden: boolean) => {
    setTogglingVisibility(gamme)
    try {
      const success = await toggleGammeVisibility(gamme, !currentHidden)
      if (success) {
        setMessage({ 
          type: 'success', 
          text: `Gamme "${gamme}" ${!currentHidden ? 'masquée' : 'affichée'} avec succès` 
        })
        await loadGammesData()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la modification du statut de la gamme' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Erreur lors du basculement de la visibilité:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la modification du statut de la gamme' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setTogglingVisibility(null)
    }
  }

  // Supprimer l'image d'une gamme
  const handleRemoveImage = (gamme: string) => {
    if (!confirm(`Supprimer la photo de la gamme d'appât "${gamme}" ?`)) {
      return
    }
    removeGammeImage(gamme)
    setMessage({ type: 'success', text: `Photo de la gamme d'appât "${gamme}" supprimée` })
    loadGammesData()
    setEditingImageFor(null)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestion des Gammes d'appât</h1>
            <p className="text-gray-400">Ajoutez, modifiez ou supprimez des gammes d'appât</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="w-4 h-4" />
            Ajouter une gamme d'appât
          </button>
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
              <h2 className="text-2xl font-bold">Nouvelle gamme d'appât</h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewGammeInput('')
                  setMessage(null)
                }}
                className="p-2 hover:bg-noir-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de la gamme d'appât *</label>
                <input
                  type="text"
                  value={newGammeInput}
                  onChange={(e) => setNewGammeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGamme()
                    }
                  }}
                  className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Ex: Krill Calamar, Méga Tutti..."
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2">
                  Le nom de la gamme d'appât sera utilisé pour organiser les produits
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewGammeInput('')
                    setMessage(null)
                  }}
                  className="btn btn-secondary btn-md"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddGamme}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter la gamme d'appât
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des gammes */}
        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Tag className="w-6 h-6 text-yellow-500" />
            Gammes d'appât disponibles ({gammes?.length || 0})
          </h2>

          {!gammes || gammes.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Aucune gamme d'appât pour le moment. Ajoutez-en une !
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(Array.isArray(gammes) ? gammes : []).map((gamme) => {
                const gammeImage = gammeImages[gamme.name]
                return (
                  <div
                    key={gamme.name}
                    className={`bg-noir-900 border rounded-lg p-4 hover:border-yellow-500/50 transition-all ${
                      gamme.hidden ? 'border-gray-600 opacity-60' : 'border-noir-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Aperçu de l'image ou icône par défaut */}
                        <div className="w-16 h-16 bg-noir-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                          {gammeImage ? (
                            <Image
                              src={gammeImage}
                              alt={gamme.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                              quality={75}
                            />
                          ) : (
                            <Tag className="w-8 h-8 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-lg">{gamme.name}</span>
                          {gamme.hidden && (
                            <span className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                              Masquée
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {editingImageFor === gamme.name ? (
                        <div className="flex items-center gap-2 flex-1">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(gamme.name, e)}
                              disabled={isUploadingImage}
                              className="hidden"
                            />
                            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium cursor-pointer hover:bg-blue-500/20 transition-colors text-center">
                              {isUploadingImage ? 'Upload...' : 'Choisir une image'}
                            </div>
                          </label>
                          {gammeImage && (
                            <button
                              onClick={() => handleRemoveImage(gamme.name)}
                              className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                            >
                              Supprimer
                            </button>
                          )}
                          <button
                            onClick={() => setEditingImageFor(null)}
                            className="px-3 py-1.5 bg-noir-700 border border-noir-600 rounded-lg text-gray-300 text-sm font-medium hover:bg-noir-600 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleVisibility(gamme.name, gamme.hidden)}
                            disabled={togglingVisibility === gamme.name}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              gamme.hidden
                                ? 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                                : 'bg-gray-500/10 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20'
                            }`}
                            title={gamme.hidden ? 'Afficher la gamme' : 'Masquer la gamme'}
                          >
                            {togglingVisibility === gamme.name ? (
                              <span className="text-xs">...</span>
                            ) : gamme.hidden ? (
                              <>
                                <Eye className="w-4 h-4" />
                                Afficher
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Masquer
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setEditingImageFor(gamme.name)}
                            className="flex-1 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2"
                            title={gammeImage ? 'Modifier la photo' : 'Ajouter une photo'}
                          >
                            <ImageIcon className="w-4 h-4" />
                            {gammeImage ? 'Modifier photo' : 'Ajouter photo'}
                          </button>
                          <button
                            onClick={() => handleRemoveGamme(gamme.name)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer la gamme d'appât"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <strong>Note :</strong> Les gammes d'appât par défaut (Méga Tutti, Krill Calamar, etc.) sont toujours présentes. 
            Vous pouvez ajouter de nouvelles gammes d'appât qui apparaîtront dans le sélecteur lors de l'ajout de produits.
            <br />
            <strong>Masquer une gamme :</strong> Utilisez le bouton "Masquer" pour cacher une gamme aux clients sans la supprimer. 
            Les gammes masquées restent visibles dans l'interface admin et peuvent être réaffichées à tout moment.
          </p>
        </div>
      </div>
    </div>
  )
}
