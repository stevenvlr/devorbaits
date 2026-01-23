import { NextRequest, NextResponse } from 'next/server'

// Runtime Edge pour Cloudflare
export const runtime = 'edge'

interface MoneticoRequest {
  montant: string // Montant au format "95.25EUR" (euros avec devise)
  mail: string
  texteLibre?: string
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
 */
async function calculateMAC(
  key: string,
  message: string
): Promise<string> {
  // Convertir la clé en ArrayBuffer
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const messageData = encoder.encode(message)

  // Importer la clé pour HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
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
    let { montant, mail, texteLibre = '' } = body

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
    // IMPORTANT : Utiliser "texte-libre" (avec tiret) comme nom de champ
    const version = '3.0'
    const lgue = 'FR'
    const texteLibreClean = texteLibre || ''
    const fields: Record<string, string> = {
      TPE,
      societe: SOCIETE,
      version,
      date,
      montant,
      reference,
      'texte-libre': texteLibreClean, // Nom du champ avec tiret, pas underscore
      lgue,
      mail,
      url_retour: URL_RETOUR,
      url_retour_err: URL_RETOUR_ERR,
      url_retour_ok: URL_RETOUR_OK,
    }

    // Construire la chaîne à signer depuis fields dans l'ordre EXACT demandé
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
    ] as const
    const macString = macOrder.map(key => `${key}=${fields[key] ?? ''}`).join('*')

    // Log serveur temporaire avant génération du formulaire
    console.log('[MONETICO FINAL]', { fields, macString })

    // Logs temporaires pour la clé HMAC (sans afficher la valeur)
    const raw = process.env.MONETICO_CLE_HMAC
    console.log('[HMAC]', { present: !!raw, len: raw?.length })
    if (!raw) throw new Error('MONETICO_CLE_HMAC manquante')
    const key = raw.trim()
    console.log('[HMAC trim]', { lenTrim: key.length })

    // Calculer le MAC
    const MAC = await calculateMAC(key, macString)

    // Vérifier que le MAC fait bien 40 caractères
    if (MAC.length !== 40) {
      console.error(`MAC invalide: longueur ${MAC.length} au lieu de 40`)
      return NextResponse.json(
        { error: 'Erreur lors du calcul du MAC' },
        { status: 500 }
      )
    }

    fields.MAC = MAC

    // Logs de debug
    console.log('Monetico - Paiement généré:', {
      reference,
      referenceLength: reference.length,
      referenceValid: /^[A-Z0-9]{12}$/.test(reference),
      societe: SOCIETE,
      societeLength: SOCIETE.length,
      texteLibre: texteLibreClean,
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
