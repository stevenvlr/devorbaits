import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
    const mac = crypto
      .createHmac('sha1', cleSecrete)
      .update(toSign, 'utf8')
      .digest('base64')

    return NextResponse.json({ MAC: mac })
  } catch (error) {
    console.error('Erreur génération signature Monetico:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la signature' },
      { status: 500 }
    )
  }
}

