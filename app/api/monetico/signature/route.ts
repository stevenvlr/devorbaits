import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Cette route génère la signature (MAC) Monetico côté serveur (Edge) avec WebCrypto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { params } = body ?? {}

    // Vérifier que les paramètres sont présents
    if (!params || typeof params !== 'object') {
      return NextResponse.json({ error: 'Paramètres manquants ou invalides' }, { status: 400 })
    }

    // ✅ SEULE clé utilisée pour la signature Monetico
    const raw = process.env.MONETICO_CLE_HMAC
    if (!raw) {
      console.error('MONETICO_CLE_HMAC non configurée dans Cloudflare Pages (Production env)')
      return NextResponse.json(
        { error: 'Clé HMAC Monetico non configurée (MONETICO_CLE_HMAC)' },
        { status: 500 }
      )
    }
    const key = raw.replace(/[\s\r\n\t]+/g, '')
    console.log('[HMAC CHECK]', { present: true, len: raw.length, lenTrim: key.length })

    // Construire la chaîne à signer à partir des fields dans l'ordre exact
    // Format: key=value*key=value*...
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
    ] as const

    const toSign = macOrder.map((k) => `${k}=${params[k] ?? ''}`).join('*')

    // Logs debug (à retirer quand OK)
    console.log('Monetico - Chaîne à signer:', toSign)
    console.log('Monetico - Paramètres reçus:', JSON.stringify(params, null, 2))

    // --- Utils WebCrypto ---
    const encoder = new TextEncoder()
    const keyBytes = encoder.encode(key)
    const dataBytes = encoder.encode(toSign)

    const toHexUpper = (buffer: ArrayBuffer) =>
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()

    // SHA-256(key) tronqué -> preuve que la clé a changé (sans l'exposer)
    const keyHashFull = await crypto.subtle.digest('SHA-256', keyBytes)
    const keyHash = toHexUpper(keyHashFull).slice(0, 12)
    console.log('[HMAC HASH]', keyHash)

    // HMAC-SHA1(toSign) -> MAC Monetico (HEX uppercase, 40 chars)
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, [
      'sign',
    ])
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes)
    const mac = toHexUpper(signature)

    console.log('[MAC CHECK]', { len: mac.length, prefix: mac.slice(0, 6), suffix: mac.slice(-6) })
    console.log('Monetico - MAC généré:', mac.slice(0, 20) + '...')

    return NextResponse.json({ MAC: mac })
  } catch (error) {
    console.error('Erreur génération signature Monetico:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération de la signature' }, { status: 500 })
  }
}
