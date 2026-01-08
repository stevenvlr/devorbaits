/**
 * Fonction pour normaliser le texte de recherche
 * Supprime les accents et remplace les traits d'union/underscores par des espaces
 * Permet une recherche insensible aux accents et traits d'union
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[-_]/g, ' ') // Remplace les traits d'union et underscores par des espaces
    .replace(/\s+/g, ' ') // Normalise les espaces multiples
    .trim()
}

/**
 * Vérifie si un texte correspond à un terme de recherche
 * Insensible aux accents, traits d'union et à la casse
 */
export function matchesSearch(text: string, searchTerm: string): boolean {
  if (!searchTerm) return true
  const normalizedText = normalizeSearchText(text)
  const normalizedSearch = normalizeSearchText(searchTerm)
  return normalizedText.includes(normalizedSearch)
}
















