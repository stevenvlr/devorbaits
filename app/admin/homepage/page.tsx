'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, RotateCcw } from 'lucide-react'
import { loadHomepageImage, saveHomepageImage, removeHomepageImage, onHomepageImageUpdate } from '@/lib/homepage-manager'
import { uploadHomepageImage } from '@/lib/storage-supabase'

export default function HomepageAdminPage() {
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadImage = async () => {
    const saved = await loadHomepageImage()
    setCurrentImage(saved)
  }

  useEffect(() => {
    void loadImage()
    const unsubscribe = onHomepageImageUpdate(() => void loadImage())
    return () => unsubscribe()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une image' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      // Upload vers Supabase Storage si configuré, sinon base64
      const uploadedImage = await uploadHomepageImage(file)
      const saved = await saveHomepageImage(uploadedImage)
      if (!saved) {
        setMessage({ type: 'error', text: 'Image uploadée, mais impossible de l’enregistrer en global (Supabase).' })
      } else {
        setMessage({ type: 'success', text: 'Photo d\'accueil mise à jour (global) avec succès !' })
      }
      setCurrentImage(uploadedImage)
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload de l\'image' })
    } finally {
      setIsUploading(false)
      // Réinitialiser l'input
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer la photo personnalisée et revenir à l\'image par défaut ?')) {
      void (async () => {
        const ok = await removeHomepageImage()
        if (!ok) {
          setMessage({ type: 'error', text: 'Impossible de réinitialiser en global (Supabase).' })
          return
        }
        setCurrentImage(null)
        setMessage({ type: 'success', text: 'Photo d\'accueil réinitialisée à l\'image par défaut (global)' })
      })()
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Gestion de la Photo d'Accueil</h1>
          <p className="text-gray-400">Modifiez la photo d'accueil de votre site</p>
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

        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Photo actuelle</h2>
          
          {currentImage ? (
            <div className="relative mb-6">
              <div className="relative w-full h-64 bg-noir-900 rounded-lg overflow-hidden border border-noir-700">
                <Image
                  src={currentImage}
                  alt="Photo d'accueil actuelle"
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  quality={85}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">Photo personnalisée active</p>
            </div>
          ) : (
            <div className="relative mb-6">
              <div className="relative w-full h-64 bg-noir-900 rounded-lg overflow-hidden border border-noir-700 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Image par défaut : /images/acueil-photo.jpg</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Photo par défaut active</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Changer la photo d'accueil
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Upload className="w-5 h-5" />
                    {isUploading ? 'Upload en cours...' : 'Choisir une nouvelle photo'}
                  </div>
                </label>
                
                {currentImage && (
                  <button
                    onClick={handleRemoveImage}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Réinitialiser
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés : JPG, PNG, WebP. L'image sera automatiquement optimisée.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-noir-800/50 border border-noir-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Aperçu</h2>
          <p className="text-gray-400 mb-4">
            La photo d'accueil apparaît en arrière-plan de la section hero de la page d'accueil.
          </p>
          <div className="relative w-full h-48 bg-noir-900 rounded-lg overflow-hidden border border-noir-700">
            {currentImage ? (
              <img
                src={currentImage}
                alt="Aperçu"
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-noir-950 via-noir-900 to-noir-950">
                <p className="text-gray-500">Aperçu de l'image par défaut</p>
              </div>
            )}
            <div className="absolute inset-0 bg-noir-950/60"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white font-bold text-xl">Titre de la page</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

