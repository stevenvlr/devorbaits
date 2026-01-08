const STORAGE_KEY = 'site-homepage-image'

export function loadHomepageImage(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved || null
  } catch (error) {
    console.error('Erreur lors du chargement de l\'image d\'accueil:', error)
    return null
  }
}

export function saveHomepageImage(imageUrl: string): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, imageUrl)
    // Déclencher un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('homepage-image-updated'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'image d\'accueil:', error)
  }
}

export function removeHomepageImage(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    // Déclencher un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('homepage-image-updated'))
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image d\'accueil:', error)
  }
}

export function onHomepageImageUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  
  const handleUpdate = () => {
    callback()
  }
  
  // Écouter les événements de mise à jour
  window.addEventListener('homepage-image-updated', handleUpdate)
  
  // Écouter aussi les changements de localStorage (pour les autres onglets)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      callback()
    }
  })
  
  // Retourner une fonction pour se désabonner
  return () => {
    window.removeEventListener('homepage-image-updated', handleUpdate)
  }
}


