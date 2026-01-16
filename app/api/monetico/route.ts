import { NextRequest, NextResponse } from 'next/server'

// Runtime Edge pour Cloudflare
export const runtime = 'edge'

interface MoneticoRequest {
  montant: string // Format: "19.99EUR"
  mail: string
  texteLibre?: string
}

/**
 * Génère une référence alphanumérique (A-Z0-9) de max 12 caractères
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

  // Convertir en hexadécimal majuscules
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

export async function POST(request: NextRequest) {
  try {
    // Lire les variables d'environnement
    const TPE = process.env.MONETICO_TPE || process.env.NEXT_PUBLIC_MONETICO_TPE
    const SOCIETE = process.env.MONETICO_SOCIETE || process.env.NEXT_PUBLIC_MONETICO_SOCIETE || ''
    const CLE_HMAC = process.env.MONETICO_CLE_HMAC || process.env.MONETICO_CLE_SECRETE
    const ACTION_URL = process.env.MONETICO_ACTION_URL || process.env.NEXT_PUBLIC_MONETICO_URL

    // Vérifier les variables obligatoires
    if (!TPE) {
      return NextResponse.json(
        { error: 'MONETICO_TPE non configuré' },
        { status: 500 }
      )
    }

    if (!CLE_HMAC) {
      return NextResponse.json(
        { error: 'MONETICO_CLE_HMAC non configuré' },
        { status: 500 }
      )
    }

    if (!ACTION_URL) {
      return NextResponse.json(
        { error: 'MONETICO_ACTION_URL non configuré' },
        { status: 500 }
      )
    }

    // Lire les données de la requête
    const body: MoneticoRequest = await request.json()
    const { montant, mail, texteLibre = '' } = body

    if (!montant || !mail) {
      return NextResponse.json(
        { error: 'montant et mail sont requis' },
        { status: 400 }
      )
    }

    // Générer la date et la référence
    const date = formatDate()
    const reference = generateReference()

    // Construire la chaîne à signer selon l'ordre exact Monetico
    // Format: <TPE>*<date>*<montant>*<reference>*<texte-libre>*<version>*<lgue>*<societe>*<mail>*
    const version = '3.0'
    const lgue = 'FR'
    const texteLibreClean = texteLibre || ''
    
    // Construire la chaîne exacte selon les spécifications Monetico
    // Chaque champ est séparé par un astérisque, y compris le dernier
    const macString = [
      TPE,
      date,
      montant,
      reference,
      texteLibreClean,
      version,
      lgue,
      SOCIETE || '', // Societe peut être vide mais doit être présent
      mail,
    ].join('*') + '*' // Astérisque final après mail

    // Calculer le MAC
    const MAC = await calculateMAC(CLE_HMAC, macString)

    // Construire les champs du formulaire
    const fields: Record<string, string> = {
      TPE,
      societe: SOCIETE,
      version,
      date,
      montant,
      reference,
      'texte-libre': texteLibreClean,
      lgue,
      mail,
      MAC,
    }

    // Log pour debug (à retirer en production)
    console.log('Monetico - MAC calculé:', {
      macString,
      macLength: MAC.length,
      macPreview: MAC.substring(0, 20) + '...',
      reference,
      referenceLength: reference.length,
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
