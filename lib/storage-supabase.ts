// Gestion du stockage Supabase pour les images
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

/**
 * Upload une image de la page d'accueil vers Supabase Storage
 * Si Supabase n'est pas configuré, retourne une URL base64
 */
export async function uploadHomepageImage(file: File): Promise<string> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    
    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `homepage-${Date.now()}.${fileExt}`
        const filePath = `homepage/${fileName}`

        const { data, error } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '31536000',
            upsert: true
          })

        if (error) {
          console.error('Erreur upload Supabase:', error)
          // Fallback vers base64
          return await convertToBase64(file)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        return publicUrl
      } catch (error) {
        console.error('Erreur lors de l\'upload vers Supabase:', error)
        // Fallback vers base64
        return await convertToBase64(file)
      }
    }
  }

  // Fallback: convertir en base64
  return await convertToBase64(file)
}

/**
 * Upload une image de produit vers Supabase Storage.
 * Si Supabase n'est pas configuré, retourne une URL base64.
 *
 * Le bucket utilisé est `images` et le chemin est `products/<productId>/<index>-<timestamp>.<ext>`.
 */
export async function uploadProductImage(productId: string, file: File, imageIndex: number): Promise<string> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg'
        const safeProductId = String(productId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')
        const fileName = `${imageIndex}-${Date.now()}.${fileExt}`
        const filePath = `products/${safeProductId}/${fileName}`

        const { error } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '31536000',
            upsert: true
          })

        if (error) {
          console.error('Erreur upload Supabase (product image):', error)
          return await convertToBase64(file)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        return publicUrl
      } catch (error) {
        console.error('Erreur lors de l\'upload produit vers Supabase:', error)
        return await convertToBase64(file)
      }
    }
  }

  return await convertToBase64(file)
}

/**
 * Upload une image partagée vers Supabase Storage.
 * IMPORTANT: Cette fonction ne fait PAS de fallback base64 car les URLs doivent être courtes.
 * Retourne l'URL publique ou lance une erreur si l'upload échoue.
 */
export async function uploadSharedImage(type: string, file: File): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase n\'est pas configuré. Veuillez configurer Supabase Storage.')
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Impossible de créer le client Supabase')
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${type}-${Date.now()}.${fileExt}`
    const filePath = `shared/${fileName}`

    console.log(`📤 Upload vers Supabase Storage: ${filePath}`)

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: true
      })

    if (error) {
      console.error('❌ Erreur Supabase Storage:', error)
      throw new Error(`Erreur Storage: ${error.message}. Vérifiez que le bucket 'images' existe et que les politiques permettent l'upload.`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    console.log(`✅ Image uploadée avec succès: ${publicUrl}`)
    return publicUrl
  } catch (error: any) {
    console.error('❌ Erreur upload image partagée:', error)
    throw error
  }
}

/**
 * Convertit un fichier en URL base64
 */
function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Erreur lors de la conversion en base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


