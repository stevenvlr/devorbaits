'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, Palette, Upload, ImageIcon, Ban } from 'lucide-react'
import Link from 'next/link'
import {
  // Pop-up Duo
  loadPopupDuoSaveurs, addPopupDuoSaveur, removePopupDuoSaveur, onPopupDuoSaveursUpdate,
  loadPopupDuoFormes, addPopupDuoForme, removePopupDuoForme, onPopupDuoFormesUpdate,
  loadPopupDuoFormeImages, savePopupDuoFormeImage, removePopupDuoFormeImage, onPopupDuoFormeImagesUpdate,
  loadPopupDuoVariantImages, savePopupDuoVariantImage, removePopupDuoVariantImage, onPopupDuoVariantImagesUpdate,
  removePopupDuoVariantImagesForSaveur, removePopupDuoVariantImagesForForme,
  // Bar à Pop-up
  loadBarPopupAromes, addBarPopupArome, removeBarPopupArome, onBarPopupAromesUpdate,
  loadBarPopupCouleursFluo, addBarPopupCouleurFluo, removeBarPopupCouleurFluo, onBarPopupCouleursFluoUpdate,
  loadBarPopupCouleursPastel, addBarPopupCouleurPastel, removeBarPopupCouleurPastel, onBarPopupCouleursPastelUpdate,
  loadBarPopupTaillesFluo, addBarPopupTailleFluo, removeBarPopupTailleFluo, onBarPopupTaillesFluoUpdate,
  loadBarPopupTaillesPastel, addBarPopupTaillePastel, removeBarPopupTaillePastel, onBarPopupTaillesPastelUpdate,
  // Images par couleur
  loadBarPopupCouleurImages, saveBarPopupCouleurImage, onBarPopupCouleurImagesUpdate,
  type Couleur
} from '@/lib/popup-variables-manager'
import { uploadSharedImage } from '@/lib/storage-supabase'
import {
  createStockForPopupDuoSaveur,
  createStockForPopupDuoForme,
  createStockForBarPopupArome,
  createStockForBarPopupCouleur,
  createStockForBarPopupTaille
} from '@/lib/stock-variables-helper'

export default function PopupVariablesAdminPage() {
  // Pop-up Duo
  const [popupDuoSaveurs, setPopupDuoSaveurs] = useState<string[]>([])
  const [popupDuoFormes, setPopupDuoFormes] = useState<string[]>([])
  const [popupDuoFormeImages, setPopupDuoFormeImages] = useState<Record<string, string>>({})
  const [popupDuoVariantImages, setPopupDuoVariantImages] = useState<Record<string, string>>({})
  const [selectedImageSaveur, setSelectedImageSaveur] = useState('')
  const [selectedImageForme, setSelectedImageForme] = useState('')
  const [newSaveur, setNewSaveur] = useState('')
  const [newForme, setNewForme] = useState('')
  
  // Bar à Pop-up
  const [aromes, setAromes] = useState<string[]>([])
  const [couleursFluo, setCouleursFluo] = useState<Couleur[]>([])
  const [couleursPastel, setCouleursPastel] = useState<Couleur[]>([])
  const [taillesFluo, setTaillesFluo] = useState<string[]>([])
  const [taillesPastel, setTaillesPastel] = useState<string[]>([])
  const [couleurImages, setCouleurImages] = useState<Record<string, string>>({})
  const [uploadingCouleur, setUploadingCouleur] = useState<string | null>(null)
  const [newArome, setNewArome] = useState('')
  const [newCouleurFluo, setNewCouleurFluo] = useState('')
  const [newCouleurFluoValue, setNewCouleurFluoValue] = useState('#FFFF00') // Jaune fluo par défaut
  const [newCouleurPastel, setNewCouleurPastel] = useState('')
  const [newCouleurPastelValue, setNewCouleurPastelValue] = useState('#FFFFFF')
  const [newTailleFluo, setNewTailleFluo] = useState('')
  const [newTaillePastel, setNewTaillePastel] = useState('')
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadAllData = async () => {
    try {
      const [saveurs, formes, aromesData, couleursFluoData, couleursPastelData, taillesFluoData, taillesPastelData, formeImages, variantImages, couleurImagesData] = await Promise.all([
        loadPopupDuoSaveurs().catch(err => {
          console.error('Erreur loadPopupDuoSaveurs:', err)
          return []
        }),
        loadPopupDuoFormes().catch(err => {
          console.error('Erreur loadPopupDuoFormes:', err)
          return []
        }),
        loadBarPopupAromes().catch(err => {
          console.error('Erreur loadBarPopupAromes:', err)
          return []
        }),
        loadBarPopupCouleursFluo().catch(err => {
          console.error('Erreur loadBarPopupCouleursFluo:', err)
          return []
        }),
        loadBarPopupCouleursPastel().catch(err => {
          console.error('Erreur loadBarPopupCouleursPastel:', err)
          return []
        }),
        loadBarPopupTaillesFluo().catch(err => {
          console.error('Erreur loadBarPopupTaillesFluo:', err)
          return []
        }),
        loadBarPopupTaillesPastel().catch(err => {
          console.error('Erreur loadBarPopupTaillesPastel:', err)
          return []
        }),
        loadPopupDuoFormeImages().catch(err => {
          console.error('Erreur loadPopupDuoFormeImages:', err)
          return {}
        }),
        loadPopupDuoVariantImages().catch(err => {
          console.error('Erreur loadPopupDuoVariantImages:', err)
          return {}
        }),
        loadBarPopupCouleurImages().catch(err => {
          console.error('Erreur loadBarPopupCouleurImages:', err)
          return {}
        })
      ])
      
      // S'assurer que toutes les valeurs sont des tableaux
      setPopupDuoSaveurs(Array.isArray(saveurs) ? saveurs : [])
      setPopupDuoFormes(Array.isArray(formes) ? formes : [])
      setAromes(Array.isArray(aromesData) ? aromesData : [])
      setCouleursFluo(Array.isArray(couleursFluoData) ? couleursFluoData : [])
      setCouleursPastel(Array.isArray(couleursPastelData) ? couleursPastelData : [])
      setTaillesFluo(Array.isArray(taillesFluoData) ? taillesFluoData : [])
      setTaillesPastel(Array.isArray(taillesPastelData) ? taillesPastelData : [])
      setPopupDuoFormeImages(formeImages && typeof formeImages === 'object' ? (formeImages as Record<string, string>) : {})
      setPopupDuoVariantImages(variantImages && typeof variantImages === 'object' ? (variantImages as Record<string, string>) : {})
      setCouleurImages(couleurImagesData && typeof couleurImagesData === 'object' ? (couleurImagesData as Record<string, string>) : {})

      // Initialiser les sélections (si vides)
      if (!selectedImageSaveur && Array.isArray(saveurs) && saveurs.length > 0) {
        setSelectedImageSaveur(saveurs[0])
      }
      if (!selectedImageForme && Array.isArray(formes) && formes.length > 0) {
        setSelectedImageForme(formes[0])
      }
      
      // Vérifier si toutes les données sont vides (problème de connexion Supabase)
      if (saveurs.length === 0 && formes.length === 0 && aromesData.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Aucune donnée chargée. Vérifiez que la table popup_variables existe dans Supabase et que le script SQL a été exécuté.' 
        })
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des variables:', error)
      setMessage({ 
        type: 'error', 
        text: `Erreur lors du chargement des variables Pop-up: ${error?.message || 'Erreur inconnue'}` 
      })
    }
  }

  useEffect(() => {
    loadAllData()
    
    const unsubscribes = [
      onPopupDuoSaveursUpdate(loadAllData),
      onPopupDuoFormesUpdate(loadAllData),
      onPopupDuoFormeImagesUpdate(loadAllData),
      onPopupDuoVariantImagesUpdate(loadAllData),
      onBarPopupAromesUpdate(loadAllData),
      onBarPopupCouleursFluoUpdate(loadAllData),
      onBarPopupCouleursPastelUpdate(loadAllData),
      onBarPopupTaillesFluoUpdate(loadAllData),
      onBarPopupTaillesPastelUpdate(loadAllData),
      onBarPopupCouleurImagesUpdate(loadAllData)
    ]
    
    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [])

  // Pop-up Duo - Saveurs
  const handleAddSaveur = async () => {
    const result = await addPopupDuoSaveur(newSaveur)
    if (result.success) {
      // Créer automatiquement le stock pour tous les produits Pop-up Duo qui utilisent cette saveur
      console.log(`🔍 Création du stock pour la nouvelle saveur "${newSaveur}"...`)
      const stockResult = await createStockForPopupDuoSaveur(newSaveur)
      const stockMessage = stockResult.created > 0 
        ? ` ${stockResult.created} entrée(s) de stock créée(s).`
        : stockResult.errors > 0
        ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
        : ''
      
      setMessage({ 
        type: 'success', 
        text: result.message + stockMessage 
      })
      setNewSaveur('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveSaveur = async (saveur: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la saveur "${saveur}" ?`)) {
      const success = await removePopupDuoSaveur(saveur)
      setMessage(success ? { type: 'success', text: `Saveur "${saveur}" supprimée.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) {
        await removePopupDuoVariantImagesForSaveur(saveur).catch(() => {})
        await loadAllData()
      }
    }
  }

  // Pop-up Duo - Formes
  const handleAddForme = async () => {
    const result = await addPopupDuoForme(newForme)
    if (result.success) {
      // Créer automatiquement le stock pour toutes les variantes Pop-up Duo qui utilisent cette forme
      console.log(`🔍 Création du stock pour la nouvelle forme "${newForme}"...`)
      const stockResult = await createStockForPopupDuoForme(newForme)
      const stockMessage = stockResult.created > 0 
        ? ` ${stockResult.created} entrée(s) de stock créée(s).`
        : stockResult.errors > 0
        ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
        : ''
      
      setMessage({ 
        type: 'success', 
        text: result.message + stockMessage 
      })
      setNewForme('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveForme = async (forme: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la forme "${forme}" ?`)) {
      const success = await removePopupDuoForme(forme)
      setMessage(success ? { type: 'success', text: `Forme "${forme}" supprimée.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) {
        // Nettoyage best-effort : supprimer aussi l'image associée si elle existe
        await removePopupDuoFormeImage(forme).catch(() => {})
        await removePopupDuoVariantImagesForForme(forme).catch(() => {})
        await loadAllData()
      }
    }
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
      reader.onload = () => resolve(String(reader.result || ''))
      reader.readAsDataURL(file)
    })
  }

  const handleUploadFormeImage = async (forme: string, file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file)
      const res = await savePopupDuoFormeImage(forme, dataUrl)
      if (res.success) {
        setMessage({ type: 'success', text: `Image enregistrée pour la forme "${forme}".` })
        await loadAllData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erreur lors de l’enregistrement de l’image.' })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Erreur lors de l’upload.' })
    }
  }

  const handleRemoveFormeImage = async (forme: string) => {
    const res = await removePopupDuoFormeImage(forme)
    if (res.success) {
      setMessage({ type: 'success', text: `Image supprimée pour la forme "${forme}".` })
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de la suppression de l’image.' })
    }
  }

  const handleUploadVariantImage = async (saveur: string, forme: string, file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file)
      const res = await savePopupDuoVariantImage(saveur, forme, dataUrl)
      if (res.success) {
        setMessage({ type: 'success', text: `Image enregistrée pour "${saveur}" + "${forme}".` })
        await loadAllData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erreur lors de l’enregistrement de l’image.' })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Erreur lors de l’upload.' })
    }
  }

  const handleRemoveVariantImage = async (saveur: string, forme: string) => {
    const res = await removePopupDuoVariantImage(saveur, forme)
    if (res.success) {
      setMessage({ type: 'success', text: `Image supprimée pour "${saveur}" + "${forme}".` })
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erreur lors de la suppression de l’image.' })
    }
  }

  // Bar à Pop-up - Arômes
  const handleAddArome = async () => {
    const result = await addBarPopupArome(newArome)
    if (result.success) {
      // Créer automatiquement le stock pour toutes les variantes Bar à Pop-up qui utilisent cet arôme
      console.log(`🔍 Création du stock pour le nouvel arôme "${newArome}"...`)
      const stockResult = await createStockForBarPopupArome(newArome)
      const stockMessage = stockResult.created > 0 
        ? ` ${stockResult.created} entrée(s) de stock créée(s).`
        : stockResult.errors > 0
        ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
        : ''
      
      setMessage({ 
        type: 'success', 
        text: result.message + stockMessage 
      })
      setNewArome('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveArome = async (arome: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'arôme "${arome}" ?`)) {
      const success = await removeBarPopupArome(arome)
      setMessage(success ? { type: 'success', text: `Arôme "${arome}" supprimé.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Bar à Pop-up - Couleurs Fluo
  const handleAddCouleurFluo = async () => {
    const result = await addBarPopupCouleurFluo(newCouleurFluo, newCouleurFluoValue)
    if (result.success) {
      // Créer automatiquement le stock pour toutes les variantes Bar à Pop-up qui utilisent cette couleur
      console.log(`🔍 Création du stock pour la nouvelle couleur fluo "${newCouleurFluo}"...`)
      const stockResult = await createStockForBarPopupCouleur(newCouleurFluo)
      const stockMessage = stockResult.created > 0 
        ? ` ${stockResult.created} entrée(s) de stock créée(s).`
        : stockResult.errors > 0
        ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
        : ''
      
      setMessage({ 
        type: 'success', 
        text: result.message + stockMessage 
      })
      setNewCouleurFluo('')
      setNewCouleurFluoValue('#FFFF00') // Réinitialiser à jaune fluo
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveCouleurFluo = async (couleur: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la couleur "${couleur}" ?`)) {
      const success = await removeBarPopupCouleurFluo(couleur)
      setMessage(success ? { type: 'success', text: `Couleur "${couleur}" supprimée.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Bar à Pop-up - Couleurs Pastel
  const handleAddCouleurPastel = async () => {
    const result = await addBarPopupCouleurPastel(newCouleurPastel, newCouleurPastelValue)
    if (result.success) {
      // Créer automatiquement le stock pour toutes les variantes Bar à Pop-up qui utilisent cette couleur
      console.log(`🔍 Création du stock pour la nouvelle couleur pastel "${newCouleurPastel}"...`)
      const stockResult = await createStockForBarPopupCouleur(newCouleurPastel)
      const stockMessage = stockResult.created > 0 
        ? ` ${stockResult.created} entrée(s) de stock créée(s).`
        : stockResult.errors > 0
        ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
        : ''
      
      setMessage({ 
        type: 'success', 
        text: result.message + stockMessage 
      })
      setNewCouleurPastel('')
      setNewCouleurPastelValue('#FFFFFF')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveCouleurPastel = async (couleur: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la couleur "${couleur}" ?`)) {
      const success = await removeBarPopupCouleurPastel(couleur)
      setMessage(success ? { type: 'success', text: `Couleur "${couleur}" supprimée.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Bar à Pop-up - Tailles Fluo
  const handleAddTailleFluo = async () => {
    const result = await addBarPopupTailleFluo(newTailleFluo)
    if (result.success) {
      // Créer automatiquement le stock pour toutes les variantes Bar à Pop-up qui utilisent cette taille
      console.log(`🔍 Création du stock pour la nouvelle taille fluo "${newTailleFluo}"...`)
      const stockResult = await createStockForBarPopupTaille(newTailleFluo)
      const stockMessage = stockResult.created > 0 
        ? ` ${stockResult.created} entrée(s) de stock créée(s).`
        : stockResult.errors > 0
        ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
        : ''
      
      setMessage({ 
        type: 'success', 
        text: result.message + stockMessage 
      })
      setNewTailleFluo('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveTailleFluo = async (taille: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la taille "${taille}" ?`)) {
      const success = await removeBarPopupTailleFluo(taille)
      setMessage(success ? { type: 'success', text: `Taille "${taille}" supprimée.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Bar à Pop-up - Tailles Pastel
  const handleAddTaillePastel = async () => {
    const result = await addBarPopupTaillePastel(newTaillePastel)
    if (result.success) {
      // Créer automatiquement le stock pour toutes les variantes Bar à Pop-up qui utilisent cette taille
      console.log(`🔍 Création du stock pour la nouvelle taille pastel "${newTaillePastel}"...`)
      const stockResult = await createStockForBarPopupTaille(newTaillePastel)
      const stockMessage = stockResult.created > 0 
        ? ` ${stockResult.created} entrée(s) de stock créée(s).`
        : stockResult.errors > 0
        ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
        : ''
      
      setMessage({ 
        type: 'success', 
        text: result.message + stockMessage 
      })
      setNewTaillePastel('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveTaillePastel = async (taille: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la taille "${taille}" ?`)) {
      const success = await removeBarPopupTaillePastel(taille)
      setMessage(success ? { type: 'success', text: `Taille "${taille}" supprimée.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Bar à Pop-up - Upload image par couleur
  const handleUploadCouleurImage = async (couleurName: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'L\'image est trop grande (max 5MB)' })
      return
    }

    setUploadingCouleur(couleurName)
    try {
      console.log(`📤 Upload de l'image pour la couleur "${couleurName}"...`)
      // Créer un ID unique pour cette couleur
      const safeColorName = couleurName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const imageUrl = await uploadSharedImage(`bar-popup-${safeColorName}` as any, file)
      console.log('✅ Image uploadée:', imageUrl)
      
      const success = await saveBarPopupCouleurImage(couleurName, imageUrl)
      if (success) {
        setCouleurImages(prev => ({ ...prev, [couleurName]: imageUrl }))
        setMessage({ type: 'success', text: `Image sauvegardée pour "${couleurName}" !` })
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde de l\'image' })
      }
    } catch (error: any) {
      console.error('❌ Erreur upload:', error)
      setMessage({ type: 'error', text: `Erreur: ${error?.message || 'Erreur inconnue'}` })
    } finally {
      setUploadingCouleur(null)
    }
  }

  // Toutes les couleurs combinées pour l'affichage
  const allCouleurs = [
    ...(Array.isArray(couleursFluo) ? couleursFluo : []),
    ...(Array.isArray(couleursPastel) ? couleursPastel : [])
  ]

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Gestion des Variables Pop-up</h1>
            <Link
              href="/admin/bar-popup-disabled"
              className="btn btn-secondary btn-md flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Combinaisons Désactivées
            </Link>
          </div>
          <p className="text-gray-400">Gérez les options disponibles pour Pop-up Duo et Bar à Pop-up</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* POP-UP DUO */}
          <div className="space-y-6">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-yellow-500" />
                Pop-up Duo - Saveurs
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newSaveur}
                  onChange={(e) => setNewSaveur(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddSaveur() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouvelle saveur (ex: Fraise)"
                />
                <button
                  onClick={handleAddSaveur}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(popupDuoSaveurs) ? popupDuoSaveurs : []).map((saveur) => (
                  <li key={saveur} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{saveur}</span>
                    <button
                      onClick={() => handleRemoveSaveur(saveur)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-yellow-500" />
                Pop-up Duo - Formes
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newForme}
                  onChange={(e) => setNewForme(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddForme() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouvelle forme (ex: 20mm)"
                />
                <button
                  onClick={handleAddForme}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(popupDuoFormes) ? popupDuoFormes : []).map((forme) => (
                  <li key={forme} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg border border-noir-700 overflow-hidden bg-noir-950 flex items-center justify-center">
                        {popupDuoFormeImages?.[forme] ? (
                          <img src={popupDuoFormeImages[forme]} alt={`Forme ${forme}`} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{forme}</span>
                        <div className="flex items-center gap-3 mt-1">
                          <label className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer">
                            Choisir une image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleUploadFormeImage(forme, file)
                                }
                                // Permet de re-sélectionner le même fichier
                                e.currentTarget.value = ''
                              }}
                            />
                          </label>
                          {popupDuoFormeImages?.[forme] && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFormeImage(forme)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Supprimer image
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Conseil: image légère (compressée) pour éviter de ralentir l’admin.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveForme(forme)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Supprimer la forme"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-yellow-500" />
                Pop-up Duo - Images (Saveur + Forme)
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Saveur</label>
                  <select
                    value={selectedImageSaveur}
                    onChange={(e) => setSelectedImageSaveur(e.target.value)}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  >
                    {(Array.isArray(popupDuoSaveurs) ? popupDuoSaveurs : []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">Forme</label>
                  <select
                    value={selectedImageForme}
                    onChange={(e) => setSelectedImageForme(e.target.value)}
                    className="w-full px-3 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  >
                    {(Array.isArray(popupDuoFormes) ? popupDuoFormes : []).map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const key = `${selectedImageSaveur}`.trim().toLowerCase() + '||' + `${selectedImageForme}`.trim().toLowerCase()
                const img = popupDuoVariantImages?.[key]
                return (
                  <div className="flex items-start gap-4">
                    <div className="w-28 h-28 rounded-xl border border-noir-700 overflow-hidden bg-noir-950 flex items-center justify-center">
                      {img ? (
                        <img src={img} alt="Aperçu variante" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <label className="text-sm text-yellow-400 hover:text-yellow-300 cursor-pointer">
                          Choisir une image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file && selectedImageSaveur && selectedImageForme) {
                                handleUploadVariantImage(selectedImageSaveur, selectedImageForme, file)
                              }
                              e.currentTarget.value = ''
                            }}
                          />
                        </label>
                        {img && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantImage(selectedImageSaveur, selectedImageForme)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Supprimer image
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        Cette image est prioritaire sur “image par forme”.
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* BAR À POP-UP */}
          <div className="space-y-6">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-500" />
                Bar à Pop-up - Arômes
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newArome}
                  onChange={(e) => setNewArome(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddArome() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouvel arôme (ex: Vanille)"
                />
                <button
                  onClick={handleAddArome}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(aromes) ? aromes : []).map((arome) => (
                  <li key={arome} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{arome}</span>
                    <button
                      onClick={() => handleRemoveArome(arome)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-500" />
                Bar à Pop-up - Couleurs Fluo
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newCouleurFluo}
                    onChange={(e) => setNewCouleurFluo(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddCouleurFluo() }}
                    className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    placeholder="Nom de la couleur (ex: Vert fluo)"
                  />
                  <input
                    type="color"
                    value={newCouleurFluoValue}
                    onChange={(e) => setNewCouleurFluoValue(e.target.value)}
                    className="w-20 h-10 bg-noir-900 border border-noir-700 rounded-lg cursor-pointer"
                    title="Couleur"
                  />
                  <button
                    onClick={handleAddCouleurFluo}
                    className="btn btn-primary btn-md"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(couleursFluo) ? couleursFluo : []).map((couleur) => (
                  <li key={couleur.name} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded border border-noir-700"
                        style={{ backgroundColor: couleur.value || '#FFFFFF' }}
                      />
                      <span className="text-white font-medium">{couleur.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCouleurFluo(couleur.name)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-500" />
                Bar à Pop-up - Couleurs Pastel
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newCouleurPastel}
                    onChange={(e) => setNewCouleurPastel(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddCouleurPastel() }}
                    className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                    placeholder="Nom de la couleur (ex: Rose pastel)"
                  />
                  <input
                    type="color"
                    value={newCouleurPastelValue}
                    onChange={(e) => setNewCouleurPastelValue(e.target.value)}
                    className="w-20 h-10 bg-noir-900 border border-noir-700 rounded-lg cursor-pointer"
                    title="Couleur"
                  />
                  <button
                    onClick={handleAddCouleurPastel}
                    className="btn btn-primary btn-md"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(couleursPastel) ? couleursPastel : []).map((couleur) => (
                  <li key={couleur.name} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded border border-noir-700"
                        style={{ backgroundColor: couleur.value || '#FFFFFF' }}
                      />
                      <span className="text-white font-medium">{couleur.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCouleurPastel(couleur.name)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-500" />
                Bar à Pop-up - Tailles Fluo
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newTailleFluo}
                  onChange={(e) => setNewTailleFluo(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddTailleFluo() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouvelle taille fluo (ex: 25mm)"
                />
                <button
                  onClick={handleAddTailleFluo}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(taillesFluo) ? taillesFluo : []).map((taille) => (
                  <li key={taille} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{taille}</span>
                    <button
                      onClick={() => handleRemoveTailleFluo(taille)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Palette className="w-6 h-6 text-pink-500" />
                Bar à Pop-up - Tailles Pastel
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newTaillePastel}
                  onChange={(e) => setNewTaillePastel(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddTaillePastel() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouvelle taille pastel (ex: 18mm)"
                />
                <button
                  onClick={handleAddTaillePastel}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(taillesPastel) ? taillesPastel : []).map((taille) => (
                  <li key={taille} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{taille}</span>
                    <button
                      onClick={() => handleRemoveTaillePastel(taille)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bar à Pop-up - Combinaisons désactivées */}
            <div className="bg-noir-800/50 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Ban className="w-6 h-6 text-red-500" />
                  Combinaisons Désactivées
                </h2>
                <Link
                  href="/admin/bar-popup-disabled"
                  className="btn btn-secondary btn-sm flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Gérer
                </Link>
              </div>
              <p className="text-gray-400 text-sm">
                Désactivez certaines combinaisons taille/couleur pour le bar à pop-up. 
                Les combinaisons désactivées ne seront pas disponibles à la sélection.
              </p>
            </div>

            {/* Bar à Pop-up - Images par couleur */}
            <div className="bg-noir-800/50 border border-yellow-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-yellow-500" />
                Bar à Pop-up - Images par couleur
              </h2>
              <p className="text-gray-400 mb-4 text-sm">
                Uploadez une image pour chaque couleur. Cette image sera affichée dans le configurateur Bar à Pop-up.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {allCouleurs.map((couleur) => (
                  <div key={couleur.name} className="bg-noir-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-8 h-8 rounded border border-noir-700 flex-shrink-0"
                        style={{ backgroundColor: couleur.value || '#FFFFFF' }}
                      />
                      <span className="text-white font-medium text-sm">{couleur.name}</span>
                      <span className="text-xs text-gray-500">({couleur.type})</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-lg border border-noir-700 overflow-hidden bg-noir-950 flex items-center justify-center flex-shrink-0">
                        {couleurImages[couleur.name] ? (
                          <img 
                            src={couleurImages[couleur.name]} 
                            alt={couleur.name} 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-600" />
                        )}
                      </div>
                      
                      <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-noir-800 border border-noir-700 rounded-lg cursor-pointer hover:bg-noir-700 transition-colors text-sm ${uploadingCouleur === couleur.name ? 'opacity-50' : ''}`}>
                        <Upload className="w-4 h-4" />
                        <span>
                          {uploadingCouleur === couleur.name 
                            ? 'Upload...' 
                            : couleurImages[couleur.name] 
                              ? 'Changer' 
                              : 'Ajouter'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingCouleur === couleur.name}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleUploadCouleurImage(couleur.name, file)
                            }
                            e.currentTarget.value = ''
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              {allCouleurs.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Aucune couleur définie. Ajoutez des couleurs fluo ou pastel ci-dessus.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
