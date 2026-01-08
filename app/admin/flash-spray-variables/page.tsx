'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Zap, Droplet } from 'lucide-react'
import {
  // Flash Boost
  loadFlashBoostAromes, addFlashBoostArome, removeFlashBoostArome, onFlashBoostAromesUpdate,
  loadFlashBoostFormats, addFlashBoostFormat, removeFlashBoostFormat, onFlashBoostFormatsUpdate,
  // Spray Plus
  loadSprayPlusAromes, addSprayPlusArome, removeSprayPlusArome, onSprayPlusAromesUpdate,
  loadSprayPlusFormats, addSprayPlusFormat, removeSprayPlusFormat, onSprayPlusFormatsUpdate,
} from '@/lib/flash-spray-variables-manager'
import { getAllAromesAndSaveurs } from '@/lib/all-aromes-saveurs-manager'
import {
  createStockForFlashBoostArome,
  createStockForFlashBoostFormat,
  createStockForSprayPlusArome,
  createStockForSprayPlusFormat
} from '@/lib/stock-variables-helper'

export default function FlashSprayVariablesAdminPage() {
  // Tous les arômes/saveurs disponibles sur le site
  const [allAromes, setAllAromes] = useState<string[]>([])
  
  // Flash Boost
  const [flashBoostAromes, setFlashBoostAromes] = useState<string[]>([])
  const [flashBoostFormats, setFlashBoostFormats] = useState<string[]>([])
  const [newFlashBoostArome, setNewFlashBoostArome] = useState('')
  const [newFlashBoostFormat, setNewFlashBoostFormat] = useState('')
  
  // Spray Plus
  const [sprayPlusAromes, setSprayPlusAromes] = useState<string[]>([])
  const [sprayPlusFormats, setSprayPlusFormats] = useState<string[]>([])
  const [newSprayPlusArome, setNewSprayPlusArome] = useState('')
  const [newSprayPlusFormat, setNewSprayPlusFormat] = useState('')
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadAllData = async () => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/flash-spray-variables/page.tsx:28',message:'loadAllData entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
    }
    // #endregion
    try {
      const [allAromesData, aromesFB, formatsFB, aromesSP, formatsSP] = await Promise.all([
        getAllAromesAndSaveurs().catch(() => []),
        loadFlashBoostAromes().catch(err => {
          // #region agent log
          if (typeof window !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/flash-spray-variables/page.tsx:35',message:'loadFlashBoostAromes error',data:{errorMessage:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
          }
          // #endregion
          console.error('Erreur loadFlashBoostAromes:', err)
          return []
        }),
        loadFlashBoostFormats().catch(err => {
          console.error('Erreur loadFlashBoostFormats:', err)
          return []
        }),
        loadSprayPlusAromes().catch(err => {
          console.error('Erreur loadSprayPlusAromes:', err)
          return []
        }),
        loadSprayPlusFormats().catch(err => {
          console.error('Erreur loadSprayPlusFormats:', err)
          return []
        })
      ])
      
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/flash-spray-variables/page.tsx:52',message:'loadAllData results',data:{allAromesCount:allAromesData.length,aromesFBCount:aromesFB.length,formatsFBCount:formatsFB.length,aromesSPCount:aromesSP.length,formatsSPCount:formatsSP.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
      }
      // #endregion
      
      // S'assurer que toutes les valeurs sont des tableaux
      setAllAromes(Array.isArray(allAromesData) ? allAromesData : [])
      setFlashBoostAromes(Array.isArray(aromesFB) ? aromesFB : [])
      setFlashBoostFormats(Array.isArray(formatsFB) ? formatsFB : [])
      setSprayPlusAromes(Array.isArray(aromesSP) ? aromesSP : [])
      setSprayPlusFormats(Array.isArray(formatsSP) ? formatsSP : [])
    } catch (error: any) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/flash-spray-variables/page.tsx:63',message:'loadAllData catch error',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,E'})}).catch(()=>{});
      }
      // #endregion
      console.error('Erreur lors du chargement des variables:', error)
      setMessage({ 
        type: 'error', 
        text: `Erreur lors du chargement des variables: ${error?.message || 'Erreur inconnue'}` 
      })
    }
  }

  useEffect(() => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/flash-spray-variables/page.tsx:75',message:'FlashSprayVariablesAdminPage useEffect',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    loadAllData()
    
    const unsubscribes = [
      onFlashBoostAromesUpdate(loadAllData),
      onFlashBoostFormatsUpdate(loadAllData),
      onSprayPlusAromesUpdate(loadAllData),
      onSprayPlusFormatsUpdate(loadAllData)
    ]
    
    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [])

  // Helper pour créer le stock et formater le message
  const createStockAndGetMessage = async (createStockFn: (value: string) => Promise<{ created: number; errors: number }>, value: string, type: string) => {
    console.log(`🔍 Création du stock pour le ${type} "${value}"...`)
    const stockResult = await createStockFn(value)
    return stockResult.created > 0 
      ? ` ${stockResult.created} entrée(s) de stock créée(s).`
      : stockResult.errors > 0
      ? ` ${stockResult.errors} erreur(s) lors de la création du stock.`
      : ''
  }

  // Flash Boost - Arômes
  const handleAddFlashBoostArome = async () => {
    const result = await addFlashBoostArome(newFlashBoostArome)
    if (result.success) {
      const stockMessage = await createStockAndGetMessage(createStockForFlashBoostArome, newFlashBoostArome, 'nouvel arôme Flash Boost')
      setMessage({ type: 'success', text: result.message + stockMessage })
      setNewFlashBoostArome('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveFlashBoostArome = async (arome: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'arôme "${arome}" ?`)) {
      const success = await removeFlashBoostArome(arome)
      setMessage(success ? { type: 'success', text: `Arôme "${arome}" supprimé.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Flash Boost - Formats
  const handleAddFlashBoostFormat = async () => {
    const result = await addFlashBoostFormat(newFlashBoostFormat)
    if (result.success) {
      const stockMessage = await createStockAndGetMessage(createStockForFlashBoostFormat, newFlashBoostFormat, 'nouveau format Flash Boost')
      setMessage({ type: 'success', text: result.message + stockMessage })
      setNewFlashBoostFormat('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveFlashBoostFormat = async (format: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le format "${format}" ?`)) {
      const success = await removeFlashBoostFormat(format)
      setMessage(success ? { type: 'success', text: `Format "${format}" supprimé.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Spray Plus - Arômes
  const handleAddSprayPlusArome = async () => {
    const result = await addSprayPlusArome(newSprayPlusArome)
    if (result.success) {
      const stockMessage = await createStockAndGetMessage(createStockForSprayPlusArome, newSprayPlusArome, 'nouvel arôme Spray Plus')
      setMessage({ type: 'success', text: result.message + stockMessage })
      setNewSprayPlusArome('')
      await loadAllData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleRemoveSprayPlusArome = async (arome: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'arôme "${arome}" ?`)) {
      const success = await removeSprayPlusArome(arome)
      setMessage(success ? { type: 'success', text: `Arôme "${arome}" supprimé.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  // Spray Plus - Formats
  const handleAddSprayPlusFormat = async () => {
    const result = await addSprayPlusFormat(newSprayPlusFormat)
    setMessage(result.success ? { type: 'success', text: result.message } : { type: 'error', text: result.message })
    if (result.success) {
      setNewSprayPlusFormat('')
      await loadAllData()
    }
  }

  const handleRemoveSprayPlusFormat = async (format: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le format "${format}" ?`)) {
      const success = await removeSprayPlusFormat(format)
      setMessage(success ? { type: 'success', text: `Format "${format}" supprimé.` } : { type: 'error', text: 'Erreur lors de la suppression.' })
      if (success) await loadAllData()
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Gestion des Variables Flash Boost et Spray Plus</h1>
          <p className="text-gray-400">Gérez les arômes et formats disponibles pour Flash Boost et Spray Plus</p>
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

        {/* Section : Tous les arômes/saveurs disponibles */}
        <div className="mb-8 bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Tous les arômes et saveurs disponibles</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Liste complète de tous les arômes et saveurs disponibles sur le site (Pop-up Duo, Bar à Pop-up, Flash Boost, Spray Plus).
            Les arômes ajoutés dans d'autres sections apparaissent automatiquement ici.
          </p>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {(Array.isArray(allAromes) ? allAromes : []).map((arome) => (
                <div key={arome} className="bg-noir-900/50 rounded-lg p-2 text-sm text-white">
                  {arome}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* FLASH BOOST */}
          <div className="space-y-6">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Flash Boost - Arômes
              </h2>
              <p className="text-gray-400 mb-4 text-sm">
                Les arômes ajoutés ici sont automatiquement synchronisés avec Spray Plus et disponibles dans toutes les catégories.
              </p>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newFlashBoostArome}
                  onChange={(e) => setNewFlashBoostArome(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddFlashBoostArome() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouvel arôme (ex: Méga Tutti)"
                />
                <button
                  onClick={handleAddFlashBoostArome}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {(Array.isArray(flashBoostAromes) ? flashBoostAromes : []).map((arome) => (
                  <li key={arome} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{arome}</span>
                    <button
                      onClick={() => handleRemoveFlashBoostArome(arome)}
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
                <Zap className="w-6 h-6 text-yellow-500" />
                Flash Boost - Formats
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newFlashBoostFormat}
                  onChange={(e) => setNewFlashBoostFormat(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddFlashBoostFormat() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouveau format (ex: 200 ml)"
                />
                <button
                  onClick={handleAddFlashBoostFormat}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(flashBoostFormats) ? flashBoostFormats : []).map((format) => (
                  <li key={format} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{format}</span>
                    <button
                      onClick={() => handleRemoveFlashBoostFormat(format)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SPRAY PLUS */}
          <div className="space-y-6">
            <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Droplet className="w-6 h-6 text-yellow-500" />
                Spray Plus - Arômes
              </h2>
              <p className="text-gray-400 mb-4 text-sm">
                Les arômes ajoutés ici sont automatiquement synchronisés avec Flash Boost et disponibles dans toutes les catégories.
              </p>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newSprayPlusArome}
                  onChange={(e) => setNewSprayPlusArome(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddSprayPlusArome() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouvel arôme (ex: Méga Tutti)"
                />
                <button
                  onClick={handleAddSprayPlusArome}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {(Array.isArray(sprayPlusAromes) ? sprayPlusAromes : []).map((arome) => (
                  <li key={arome} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{arome}</span>
                    <button
                      onClick={() => handleRemoveSprayPlusArome(arome)}
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
                <Droplet className="w-6 h-6 text-yellow-500" />
                Spray Plus - Formats
              </h2>
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={newSprayPlusFormat}
                  onChange={(e) => setNewSprayPlusFormat(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleAddSprayPlusFormat() }}
                  className="flex-1 px-4 py-2 bg-noir-900 border border-noir-700 rounded-lg text-white"
                  placeholder="Nouveau format (ex: 50 ml)"
                />
                <button
                  onClick={handleAddSprayPlusFormat}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {(Array.isArray(sprayPlusFormats) ? sprayPlusFormats : []).map((format) => (
                  <li key={format} className="flex items-center justify-between bg-noir-900/50 rounded-lg p-3">
                    <span className="text-white font-medium">{format}</span>
                    <button
                      onClick={() => handleRemoveSprayPlusFormat(format)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

