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
 * Convertit un Uint8Array en ArrayBuffer réel (copie)
 * Nécessaire pour WebCrypto qui attend un BufferSource
 */
function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength)
  new Uint8Array(ab).set(u8)
  return ab
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
  const keyBuffer = u8ToArrayBuffer(keyBytes)
  const dataBuffer = u8ToArrayBuffer(messageData)

  // Importer la clé pour HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  // Calculer la signature
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)

  // Convertir en hexadécimal majuscules (40 caractères)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

export async function POST(request: NextRequest) {
  try {
    // Lire les variables d'environnement côté serveur (Edge runtime)
    // Utiliser MONETICO_* (server-only), pas NEXT_PUBLIC_* pour la sécurité
    const TPE = process.env.MONETICO_TPE || process.env.NEXT_PUBLIC_MONETICO_TPE
    const SOCIETE = process.env.MONETICO_SOCIETE || process.env.NEXT_PUBLIC_MONETICO_SOCIETE || ''
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

    // Créer UN SEUL objet fields avec TOUTES les clés reconnues Monetico (même vides)
    // Conforme à la doc Monetico v2.0 oct 2025 §9.3
    const fields: Record<string, string> = {
      TPE,
      date,
      lgue: 'FR',
      mail,
      montant,
      reference,
      societe: SOCIETE,
      url_retour: URL_RETOUR,
      url_retour_err: URL_RETOUR_ERR,
      url_retour_ok: URL_RETOUR_OK,
      version: '3.0',
      // Champs optionnels (même vides, doivent être présents)
      'texte-libre': '',
      options: '',
      nbrech: '',
      dateech1: '',
      dateech2: '',
      dateech3: '',
      dateech4: '',
      montantech1: '',
      montantech2: '',
      montantech3: '',
      montantech4: '',
    }

    // Validation stricte : vérifier que tous les champs obligatoires sont présents et non vides
    const requiredKeys = ['TPE', 'date', 'montant', 'reference', 'version', 'lgue', 'societe', 'mail', 'url_retour', 'url_retour_ok', 'url_retour_err']
    const missingFields = requiredKeys.filter(key => {
      const value = fields[key]
      return !value || (typeof value === 'string' && value.trim() === '')
    })

    if (missingFields.length > 0) {
      console.error('[MONETICO] Champs manquants ou vides:', missingFields)
      return NextResponse.json(
        { 
          error: `Champs Monetico manquants ou vides: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      )
    }

    // Log des clés présentes
    console.log('[MONETICO fieldsKeys]', Object.keys(fields))

    // Construire macString selon doc Monetico v3.0 :
    // - Prendre toutes les clés de fields SAUF "MAC" et les champs d'URL de retour
    // - EXCLURE les champs vides optionnels (texte-libre, options, nbrech, etc. si vides)
    // - Trier en ordre ASCII strict (case-sensitive)
    // - Produire "key=value" joint par "*"
    const keysForMac = Object.keys(fields).filter(key => {
      // Exclure MAC et les URLs de retour du calcul MAC
      if (key === 'MAC' || key.startsWith('url_retour')) return false
      // Exclure les champs optionnels vides (selon doc Monetico v3.0)
      const value = fields[key]
      if (value === '' || value === null || value === undefined) {
        // Les champs optionnels vides ne doivent pas être inclus
        const optionalFields = ['texte-libre', 'options', 'nbrech', 'dateech1', 'dateech2', 'dateech3', 'dateech4', 'montantech1', 'montantech2', 'montantech3', 'montantech4']
        return !optionalFields.includes(key)
      }
      return true
    })
    
    // Tri ASCII strict (case-sensitive, charCodeAt)
    keysForMac.sort((a, b) => {
      const minLen = Math.min(a.length, b.length)
      for (let i = 0; i < minLen; i++) {
        const diff = a.charCodeAt(i) - b.charCodeAt(i)
        if (diff !== 0) return diff
      }
      return a.length - b.length
    })

    // Construire macString au format "key=value" joint par "*"
    // IMPORTANT: Utiliser les valeurs exactes (pas d'encodage URL)
    const macString = keysForMac
      .map(key => `${key}=${String(fields[key])}`)
      .join('*')

    console.log('[MONETICO macString]', macString)

    // Préparer la clé HMAC (server-only, UNIQUEMENT MONETICO_CLE_HMAC, pas de fallback)
    const raw = process.env.MONETICO_CLE_HMAC
    if (!raw) {
      console.error('MONETICO_CLE_HMAC non configuré (server-only, pas de NEXT_PUBLIC_*)')
      return NextResponse.json(
        { error: 'MONETICO_CLE_HMAC non configuré. Configurez MONETICO_CLE_HMAC dans Cloudflare Dashboard (Settings → Environment Variables → Secrets)' },
        { status: 500 }
      )
    }
    
    // Normaliser : trim + remove whitespace
    const keyHex = raw.trim().replace(/[\s\r\n\t]+/g, '')
    
    // Valider regex ^[0-9A-Fa-f]{40}$ sinon throw erreur explicite
    if (!/^[0-9A-Fa-f]{40}$/.test(keyHex)) {
      console.error('[MONETICO] Clé HMAC invalide:', { keyLength: keyHex.length, keyPreview: keyHex.substring(0, 10) + '...' })
      return NextResponse.json(
        { error: 'Clé HMAC Monetico invalide (attendu: 40 caractères hexadécimaux, format: ^[0-9A-Fa-f]{40}$)' },
        { status: 500 }
      )
    }

    // Convertir hex (40 chars) -> bytes (20 octets) via parseInt(hex, 16)
    const keyBytes = new Uint8Array(20)
    for (let i = 0; i < 20; i++) {
      keyBytes[i] = parseInt(keyHex.slice(i * 2, i * 2 + 2), 16)
    }

    // SHA-256(key) tronqué pour log (sans exposer la clé)
    const keyBuffer = u8ToArrayBuffer(keyBytes)
    const keyHashFull = await crypto.subtle.digest('SHA-256', keyBuffer)
    const keyHashArray = Array.from(new Uint8Array(keyHashFull))
    const keyHash = keyHashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('').slice(0, 12)
    console.log('[HMAC HASH]', keyHash)

    // Calculer le MAC HMAC-SHA1 sur macString (format key=value trié ASCII, selon doc Monetico v2.0 oct 2025 §9.3)
    const MAC = await calculateMAC(keyBytes, macString)

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

    // Logs de debug sécurisés (sans exposer la clé complète)
    console.log('[MONETICO INIT] Paiement généré:', {
      reference,
      referenceLength: reference.length,
      referenceValid: /^[A-Z0-9]{12}$/.test(reference),
      societe: fields.societe,
      societeLength: fields.societe.length,
      montant: fields.montant,
      date: fields.date,
      macLength: MAC.length,
      macPreview: MAC.substring(0, 8) + '...' + MAC.substring(MAC.length - 8),
      actionUrl: ACTION_URL,
      urlRetour: URL_RETOUR,
      urlRetourOk: URL_RETOUR_OK,
      urlRetourErr: URL_RETOUR_ERR,
      fieldsCount: Object.keys(fields).length,
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
