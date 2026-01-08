import { NextResponse } from 'next/server'

function looksLikeAccessKey(value: string): boolean {
  // Boxtal examples in docs use prefixes ak_ / sk_
  return /^ak_[a-zA-Z0-9_-]+$/.test(value.trim())
}

function looksLikeSecretKey(value: string): boolean {
  return /^sk_[a-zA-Z0-9_-]+$/.test(value.trim())
}

export async function GET() {
  const issues: string[] = []
  const suggestions: string[] = []

  const apiKey = process.env.BOXTAL_API_KEY || process.env.NEXT_PUBLIC_BOXTAL_API_KEY || ''
  const apiSecret = process.env.BOXTAL_API_SECRET || process.env.NEXT_PUBLIC_BOXTAL_API_SECRET || ''

  if (!apiKey) {
    issues.push('BOXTAL_API_KEY manquant.')
    suggestions.push('Ajoutez BOXTAL_API_KEY dans vos variables d’environnement (Vercel).')
  } else if (!looksLikeAccessKey(apiKey)) {
    issues.push('BOXTAL_API_KEY : format inattendu (attendu: ak_...).')
    suggestions.push('Vérifiez la valeur de BOXTAL_API_KEY (elle doit commencer par "ak_").')
  }

  if (!apiSecret) {
    issues.push('BOXTAL_API_SECRET manquant.')
    suggestions.push('Ajoutez BOXTAL_API_SECRET dans vos variables d’environnement (Vercel).')
  } else if (!looksLikeSecretKey(apiSecret)) {
    issues.push('BOXTAL_API_SECRET : format inattendu (attendu: sk_...).')
    suggestions.push('Vérifiez la valeur de BOXTAL_API_SECRET (elle doit commencer par "sk_").')
  }

  if (process.env.NEXT_PUBLIC_BOXTAL_API_SECRET) {
    issues.push('NEXT_PUBLIC_BOXTAL_API_SECRET est défini (dangereux : exposé côté navigateur).')
    suggestions.push('Supprimez NEXT_PUBLIC_BOXTAL_API_SECRET et utilisez uniquement BOXTAL_API_SECRET.')
  }

  const success = issues.length === 0

  return NextResponse.json({
    success,
    message: success ? 'Format des clés OK.' : 'Problèmes détectés dans la configuration Boxtal.',
    details: {
      issues,
      suggestions,
      // On ne renvoie pas les secrets, seulement des infos non sensibles
      env: {
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.slice(0, 3) : null,
        hasApiSecret: !!apiSecret,
        apiSecretPrefix: apiSecret ? apiSecret.slice(0, 3) : null
      }
    }
  })
}

