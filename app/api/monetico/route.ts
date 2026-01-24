import { NextRequest, NextResponse } from 'next/server'

// Runtime Edge pour Cloudflare
export const runtime = 'edge'

interface MoneticoRequest {
  montant: string // Montant au format "95.25EUR" (euros avec devise)
  mail: string
}

/**
 * Génère une référence alphanumérique (A-Z0-9) de exactement 12 caractères
 * STRICTEMENT sans tirets, underscores ou autres caractères spéciaux
 */
function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Formate la date au format Monetico: DD/MM/YYYY:HH:MM:SS
 */
function formatDate(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year}:${hours}:${minutes}:${seconds}`
}

/**
 * Calcule le MAC HMAC-SHA1 en hexadécimal majuscules
 * Compatible Edge Runtime avec WebCrypto
 * La clé doit être en bytes (Uint8Array), pas en string
 */
async function calculateMAC(
  keyBytes: Uint8Array,
  message: string
): Promise<string> {
  const encoder = new TextEncoder()
  const messageData = encoder.encode(message)

  // Importer la clé pour HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  // Calculer la signature
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)

  // Convertir en hexadécimal majuscules (40 caractères)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

export async function POST(request: NextRequest) {
  try {
    // Lire les variables d'environnement côté serveur (Edge runtime)
    const TPE = process.env.MONETICO_TPE || process.env.NEXT_PUBLIC_MONETICO_TPE
    // Lire MONETICO_SOCIETE depuis process.env (priorité) ou fallback
    const SOCIETE = process.env.MONETICO_SOCIETE || process.env.NEXT_PUBLIC_MONETICO_SOCIETE || ''
    const CLE_HMAC = process.env.MONETICO_CLE_HMAC || process.env.MONETICO_CLE_SECRETE
    const ACTION_URL = process.env.MONETICO_ACTION_URL || process.env.NEXT_PUBLIC_MONETICO_URL
    const URL_RETOUR = process.env.MONETICO_URL_RETOUR || process.env.NEXT_PUBLIC_MONETICO_URL_RETOUR || ''
    const URL_RETOUR_ERR = process.env.MONETICO_URL_RETOUR_ERR || process.env.NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR || ''
    const URL_RETOUR_OK = process.env.MONETICO_URL_RETOUR_OK || process.env.NEXT_PUBLIC_MONETICO_URL_RETOUR_OK || URL_RETOUR

    // Vérifier les variables obligatoires
    if (!TPE) {
      console.error('MONETICO_TPE non configuré')
      return NextResponse.json(
        { error: 'MONETICO_TPE non configuré. Configurez MONETICO_TPE dans Cloudflare Dashboard (Settings → Environment Variables)' },
        { status: 500 }
      )
    }

    if (!CLE_HMAC) {
      console.error('MONETICO_CLE_HMAC non configuré')
      return NextResponse.json(
        { error: 'MONETICO_CLE_HMAC non configuré. Configurez MONETICO_CLE_HMAC dans Cloudflare Dashboard (Settings → Environment Variables → Secrets)' },
        { status: 500 }
      )
    }

    if (!ACTION_URL) {
      console.error('MONETICO_ACTION_URL non configuré')
      return NextResponse.json(
        { error: 'MONETICO_ACTION_URL non configuré. Configurez MONETICO_ACTION_URL dans Cloudflare Dashboard (Settings → Environment Variables)' },
        { status: 500 }
      )
    }

    // VÉRIFICATION CRITIQUE : societe ne doit PAS être vide
    if (!SOCIETE || SOCIETE.trim() === '') {
      console.error('MONETICO_SOCIETE est vide ou non configuré')
      return NextResponse.json(
        { 
          error: 'MONETICO_SOCIETE est vide. Configurez MONETICO_SOCIETE dans Cloudflare Dashboard (Settings → Environment Variables) pour Preview et Production. La valeur ne peut pas être vide pour Monetico.' 
        },
        { status: 500 }
      )
    }

    // Lire les données de la requête
    const body: MoneticoRequest = await request.json()
    let { montant, mail } = body

    if (!montant || !mail) {
      return NextResponse.json(
        { error: 'montant et mail sont requis' },
        { status: 400 }
      )
    }

    // Validation stricte du format Monetico
    const montantRegex = /^[0-9]+(\.[0-9]{1,2})?[A-Z]{3}$/
    if (typeof montant !== 'string' || !montantRegex.test(montant)) {
      console.error('[MONETICO] Format montant invalide:', { montant, type: typeof montant })
      return NextResponse.json(
        { error: `Format montant Monetico invalide: ${montant} (attendu: "95.25EUR")` },
        { status: 400 }
      )
    }

    // Vérifier que la partie numérique est > 0
    const montantNumber = parseFloat(montant.replace(/[A-Z]{3}$/, ''))
    if (!Number.isFinite(montantNumber) || montantNumber <= 0) {
      console.error('[MONETICO] Montant numérique invalide:', { montant, montantNumber })
      return NextResponse.json(
        { error: `Montant Monetico invalide: ${montant} (montant numérique doit être > 0)` },
        { status: 400 }
      )
    }

    // Log pour debug
    console.log('[MONETICO]', {
      montantOriginal: body.montant,
      montantNumber,
      montant,
      type: typeof montant
    })

    // Générer la date et la référence (12 chars, alphanumérique uniquement)
    const date = formatDate()
    const reference = generateReference()

    // Construire les champs du formulaire
    const version = '3.0'
    const lgue = 'FR'
    const texteLibre = '' // Champ texte-libre (vide pour paiement simple)
    const fields: Record<string, string> = {
      TPE,
      date,
      montant,
      reference,
      'texte-libre': texteLibre, // Nom avec tiret selon Monetico v3.0
      version,
      lgue,
      societe: SOCIETE,
      mail,
      url_retour: URL_RETOUR,
      url_retour_ok: URL_RETOUR_OK,
      url_retour_err: URL_RETOUR_ERR,
    }

    // Construire la chaîne à signer selon Monetico v3.0 (VALEURS uniquement, pas key=value)
    // Format: TPE*date*montant*reference*texte-libre*version*lgue*societe*mail*nbrech*dateech1*montantech1*dateech2*montantech2*dateech3*montantech3*dateech4*montantech4*options*
    // Les url_retour ne sont PAS inclus dans la signature
    const toSign = [
      TPE,
      date,
      montant,
      reference,
      texteLibre,
      version,
      lgue,
      SOCIETE,
      mail,
      '', // nbrech (vide pour paiement simple)
      '', // dateech1
      '', // montantech1
      '', // dateech2
      '', // montantech2
      '', // dateech3
      '', // montantech3
      '', // dateech4
      '', // montantech4
      '', // options
    ].join('*') + '*' // Ajouter le * final

    console.log('[MONETICO toSign]', toSign)

    // Préparer la clé HMAC (hex -> bytes)
    const raw = process.env.MONETICO_CLE_HMAC || CLE_HMAC
    if (!raw) {
      return NextResponse.json(
        { error: 'MONETICO_CLE_HMAC non configuré' },
        { status: 500 }
      )
    }
    const keyHex = raw.trim().replace(/[\s\r\n\t]+/g, '')
    if (!/^[0-9A-Fa-f]{40}$/.test(keyHex)) {
      return NextResponse.json(
        { error: 'Clé HMAC Monetico invalide (attendu: 40 caractères hex)' },
        { status: 500 }
      )
    }

    const keyBytes = new Uint8Array(20)
    for (let i = 0; i < 20; i++) {
      keyBytes[i] = parseInt(keyHex.slice(i * 2, i * 2 + 2), 16)
    }

    // SHA-256(key) tronqué pour log (sans exposer la clé)
    const keyHashFull = await crypto.subtle.digest('SHA-256', keyBytes)
    const keyHashArray = Array.from(new Uint8Array(keyHashFull))
    const keyHash = keyHashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('').slice(0, 12)
    console.log('[HMAC HASH]', keyHash)

    // Calculer le MAC
    const MAC = await calculateMAC(keyBytes, toSign)

    // Vérifier que le MAC fait bien 40 caractères
    if (MAC.length !== 40) {
      console.error(`MAC invalide: longueur ${MAC.length} au lieu de 40`)
      return NextResponse.json(
        { error: 'Erreur lors du calcul du MAC' },
        { status: 500 }
      )
    }

    console.log('[MAC CHECK]', { len: MAC.length, prefix: MAC.slice(0, 6), suffix: MAC.slice(-6) })

    fields.MAC = MAC

    // Logs de debug
    console.log('Monetico - Paiement généré:', {
      reference,
      referenceLength: reference.length,
      referenceValid: /^[A-Z0-9]{12}$/.test(reference),
      societe: SOCIETE,
      societeLength: SOCIETE.length,
      macLength: MAC.length,
      macPreview: MAC.substring(0, 20) + '...',
      macString: macString.substring(0, 100) + '...',
    })

    return NextResponse.json({
      action: ACTION_URL,
      fields,
    })
  } catch (error: any) {
    console.error('Erreur API Monetico:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du paiement Monetico' },
      { status: 500 }
    )
  }
}
