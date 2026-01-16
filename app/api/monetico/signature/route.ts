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

    // Ordre spécifique des paramètres selon la documentation Monetico v3.0
    // Les URLs de retour (url_retour, url_retour_ok, url_retour_err) ne sont PAS incluses dans le calcul du MAC
    // Ordre: TPE, date, montant, reference, texte-libre, version, lgue, societe, mail
    const orderedKeys = ['TPE', 'date', 'montant', 'reference', 'texte_libre', 'version', 'lgue', 'societe', 'mail']
    
    // Construire la chaîne à signer dans l'ordre Monetico (sans MAC, sans URLs de retour)
    const toSignParts: string[] = []
    for (const key of orderedKeys) {
      if (params[key] !== undefined && params[key] !== null && key !== 'MAC') {
        // Utiliser valeur vide si societe est vide (mais inclure quand même)
        toSignParts.push(params[key] || '')
      }
    }
    
    // Ajouter un * à la fin selon la documentation Monetico
    const toSign = toSignParts.join('*') + '*'

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
    
    // Convertir en hexadécimal (format Monetico, pas base64)
    const mac = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    return NextResponse.json({ MAC: mac })
  } catch (error) {
    console.error('Erreur génération signature Monetico:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la signature' },
      { status: 500 }
    )
  }
}

