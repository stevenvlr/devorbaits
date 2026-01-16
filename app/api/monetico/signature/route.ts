import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Fonction pour convertir en base64 (compatible Edge Runtime)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  // btoa est disponible dans Edge Runtime (Cloudflare Workers)
  return btoa(binary)
}

// Cette route génère la signature Monetico de manière sécurisée côté serveur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { params } = body

    // Vérifier que les paramètres sont présents
    if (!params || typeof params !== 'object') {
      return NextResponse.json(
        { error: 'Paramètres manquants ou invalides' },
        { status: 400 }
      )
    }

    // Récupérer la clé secrète depuis les variables d'environnement
    const cleSecrete = process.env.MONETICO_CLE_SECRETE

    if (!cleSecrete) {
      console.error('MONETICO_CLE_SECRETE non configurée dans les variables d\'environnement')
      return NextResponse.json(
        { error: 'Clé secrète Monetico non configurée. Vérifiez MONETICO_CLE_SECRETE dans .env.local' },
        { status: 500 }
      )
    }

    // Trier les paramètres par ordre alphabétique (sauf MAC)
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'MAC') // Exclure MAC du calcul
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('*')

    // Préparer la chaîne à signer (sans la clé secrète)
    const toSign = sortedParams

    // Générer le MAC avec HMAC-SHA1 (format Monetico)
    // Utilisation de l'API Web Crypto pour Edge Runtime
    const encoder = new TextEncoder()
    const keyData = encoder.encode(cleSecrete)
    const messageData = encoder.encode(toSign)
    
    // Import de la clé pour HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
    
    // Signer le message
    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    
    // Convertir en base64
    const mac = arrayBufferToBase64(signature)

    return NextResponse.json({ MAC: mac })
  } catch (error) {
    console.error('Erreur génération signature Monetico:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la signature' },
      { status: 500 }
    )
  }
}

