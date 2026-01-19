import GammePageClient from './GammePageClient'
import { GAMMES_BOUILLETTES, encodeGamme } from '@/lib/constants'

// Fonction pour générer les paramètres statiques (requise pour l'export statique)
export function generateStaticParams() {
  // Gammes par défaut
  const defaultGammes = GAMMES_BOUILLETTES.map((gamme) => ({
    gamme: encodeGamme(gamme)
  }))
  
  // En mode dev, on peut essayer de charger depuis un fichier JSON
  // qui est mis à jour quand des gammes sont ajoutées
  try {
    const fs = require('fs')
    const path = require('path')
    const gammesFile = path.join(process.cwd(), 'data', 'gammes.json')
    
    if (fs.existsSync(gammesFile)) {
      const savedGammes = JSON.parse(fs.readFileSync(gammesFile, 'utf8'))
      const allGammesSet = new Set([...GAMMES_BOUILLETTES, ...savedGammes])
      const allGammes = Array.from(allGammesSet)
      return allGammes.map((gamme: string) => ({
        gamme: encodeGamme(gamme)
      }))
    }
  } catch (e) {
    // Fichier non trouvé ou erreur, utiliser les gammes par défaut
  }
  
  return defaultGammes
}

// Next.js 15 (App Router) typpe parfois `params` comme une Promise.
export default async function GammePage({ params }: { params: Promise<{ gamme: string }> }) {
  // On n'utilise pas directement `gamme` ici (c'est géré côté client),
  // mais on attend la Promise pour satisfaire les types de Next.js.
  await params
  return <GammePageClient />
}
