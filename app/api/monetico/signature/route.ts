import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Note: La fonction arrayBufferToBase64 n'est plus utilisée
// Le MAC Monetico doit être en hexadécimal, pas en base64

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

    // Construire la chaîne à signer à partir des fields dans l'ordre exact
    // Format: TPE*date*lgue*mail*montant*reference*societe*url_retour*url_retour_err*url_retour_ok*version
    const macOrder = [
      'TPE',
      'date',
      'lgue',
      'mail',
      'montant',
      'reference',
      'societe',
      'url_retour',
      'url_retour_err',
      'url_retour_ok',
      'version',
    ]
    const toSign = macOrder.map((key) => `${key}=${params[key] ?? ''}`).join('*')

    // Log pour débogage (à retirer en production)
    console.log('Monetico - Chaîne à signer:', toSign)
    console.log('Monetico - Paramètres reçus:', JSON.stringify(params, null, 2))

    // Logs temporaires pour la clé HMAC (sans afficher la valeur)
    const raw = process.env.MONETICO_CLE_HMAC
    if (!raw) throw new Error('MONETICO_CLE_HMAC manquante')
    const key = raw.trim()
    console.log('[HMAC CHECK]', { present: true, len: raw.length, lenTrim: key.length })

    const encoder = new TextEncoder()
    const keyBytes = encoder.encode(key)
    const dataBytes = encoder.encode(toSign)

    const toHexUpper = (buffer: ArrayBuffer) =>
      Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()

    // SHA-256 du key pour log (tronqué)
    const keyHashFull = await crypto.subtle.digest('SHA-256', keyBytes)
    const keyHash = toHexUpper(keyHashFull).slice(0, 12)
    console.log('[HMAC HASH]', keyHash)

    // HMAC-SHA1 pour Monetico
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes)
    const mac = toHexUpper(signature)
    console.log('[MAC CHECK]', { len: mac.length, prefix: mac.slice(0, 6), suffix: mac.slice(-6) })

    // Log pour débogage (à retirer en production)
    console.log('Monetico - MAC généré:', mac.substring(0, 20) + '...')

    return NextResponse.json({ MAC: mac })
  } catch (error) {
    console.error('Erreur génération signature Monetico:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la signature' },
      { status: 500 }
    )
  }
}

