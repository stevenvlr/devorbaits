export type OptimizeImageOptions = {
  /**
   * Target max size in KB. The function will try lowering JPEG/WebP quality
   * to get under this size (best-effort).
   */
  maxSizeKB?: number
  /** Max width in pixels (keeps aspect ratio). */
  maxWidth?: number
  /** Max height in pixels (keeps aspect ratio). */
  maxHeight?: number
  /** Starting quality (0..1). */
  quality?: number
  /** Output mime type (defaults to image/jpeg). */
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png'
}

function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Erreur FileReader'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Impossible de charger l’image'))
    img.src = src
  })
}

function dataURLByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return dataUrl.length
  const base64 = dataUrl.slice(comma + 1)
  // base64 length -> bytes (approx exact for standard base64)
  return Math.floor((base64.length * 3) / 4)
}

/**
 * Optimise une image côté navigateur et renvoie une Data URL (base64).
 * Utilisé pour stocker des images (produits/gammes) côté client.
 */
export async function optimizeImage(file: File, options: OptimizeImageOptions = {}): Promise<string> {
  if (typeof window === 'undefined') {
    // Les pages qui l’utilisent sont des "use client", mais on protège quand même.
    throw new Error('optimizeImage() est disponible uniquement côté navigateur')
  }

  const {
    maxSizeKB = 500,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    mimeType = 'image/jpeg'
  } = options

  // 1) Charger l'image via une DataURL
  const inputDataUrl = await fileToDataURL(file)
  const img = await loadImage(inputDataUrl)

  // 2) Calculer dimensions cibles
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
  const targetW = Math.max(1, Math.round(img.width * ratio))
  const targetH = Math.max(1, Math.round(img.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    // fallback : renvoyer l'original si canvas indisponible
    return inputDataUrl
  }

  ctx.drawImage(img, 0, 0, targetW, targetH)

  // 3) Exporter et ajuster la qualité pour rester sous maxSizeKB (best-effort)
  let q = quality
  let out = canvas.toDataURL(mimeType, q)
  const maxBytes = maxSizeKB * 1024

  // Si PNG, le paramètre quality n'a pas d'effet → on ne boucle pas.
  if (mimeType !== 'image/png') {
    let guard = 0
    while (dataURLByteLength(out) > maxBytes && q > 0.35 && guard < 10) {
      q = Math.max(0.35, q - 0.08)
      out = canvas.toDataURL(mimeType, q)
      guard++
    }
  }

  return out
}

