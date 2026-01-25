import { NextRequest, NextResponse } from 'next/server'

// Runtime Edge pour Cloudflare
export const runtime = 'edge'

/**
 * Convertit un Uint8Array en ArrayBuffer réel (copie)
 */
function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength)
  new Uint8Array(ab).set(u8)
  return ab
}

/**
 * Calcule le MAC HMAC-SHA1 en hexadécimal majuscules
 */
async function calculateMAC(
  keyBytes: Uint8Array,
  message: string
): Promise<string> {
  const encoder = new TextEncoder()
  const messageData = encoder.encode(message)
  const keyBuffer = u8ToArrayBuffer(keyBytes)
  const dataBuffer = u8ToArrayBuffer(messageData)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

/**
 * Route de retour Monetico (POST depuis Monetico)
 * Vérifie le MAC et met à jour la commande dans Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer les données POST de Monetico
    const formData = await request.formData()
    const params: Record<string, string> = {}
    
    // Convertir FormData en objet (compatible avec tous les targets TypeScript)
    const entries = Array.from(formData.entries())
    for (const [key, value] of entries) {
      params[key] = String(value)
    }

    // Log sécurisé (sans MAC complet)
    console.log('[MONETICO RETOUR]', {
      codeRetour: params['code-retour'],
      reference: params.reference,
      montant: params.montant,
      date: params.date,
      macPresent: !!params.MAC,
      macLength: params.MAC?.length || 0,
    })

    // Vérifier les paramètres obligatoires
    const codeRetour = params['code-retour']
    const reference = params.reference
    const montant = params.montant
    const date = params.date
    const macReceived = params.MAC

    if (!codeRetour || !reference || !montant || !date || !macReceived) {
      console.error('[MONETICO RETOUR] Paramètres manquants')
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Récupérer la clé HMAC
    const raw = process.env.MONETICO_CLE_HMAC
    if (!raw) {
      console.error('[MONETICO RETOUR] MONETICO_CLE_HMAC non configuré')
      return NextResponse.json(
        { error: 'Configuration manquante' },
        { status: 500 }
      )
    }

    const keyHex = raw.trim().replace(/[\s\r\n\t]+/g, '')
    if (!/^[0-9A-Fa-f]{40}$/.test(keyHex)) {
      console.error('[MONETICO RETOUR] Clé HMAC invalide')
      return NextResponse.json(
        { error: 'Configuration invalide' },
        { status: 500 }
      )
    }

    // Convertir hex -> bytes
    const keyBytes = new Uint8Array(20)
    for (let i = 0; i < 20; i++) {
      keyBytes[i] = parseInt(keyHex.slice(i * 2, i * 2 + 2), 16)
    }

    // Construire la chaîne pour vérifier le MAC (même format que l'envoi)
    // FORMAT: VALEURS uniquement (pas key=value), dans l'ordre exact Monetico v3.0
    // ORDRE: TPE*date*montant*reference*texte-libre*version*lgue*societe*mail*nbrech*dateech1*montantech1*dateech2*montantech2*dateech3*montantech3*dateech4*montantech4*options*
    const macOrder = [
      'TPE', 'date', 'montant', 'reference', 'texte-libre', 'version', 'lgue', 'societe', 'mail',
      'nbrech', 'dateech1', 'montantech1', 'dateech2', 'montantech2', 
      'dateech3', 'montantech3', 'dateech4', 'montantech4', 'options'
    ]
    
    // Construire macString avec les VALEURS uniquement (pas key=value)
    const macParts: string[] = []
    for (const key of macOrder) {
      const value = params[key]
      // Utiliser la valeur (même vide) ou chaîne vide si absente
      macParts.push(value !== null && value !== undefined ? String(value) : '')
    }
    
    // Joindre avec "*" et ajouter le * final
    const macString = macParts.join('*') + '*'

    // Calculer le MAC attendu
    const macCalculated = await calculateMAC(keyBytes, macString)

    // Comparer les MAC (case-insensitive pour sécurité)
    const macReceivedUpper = macReceived.toUpperCase().trim()
    const macCalculatedUpper = macCalculated.toUpperCase().trim()

    if (macReceivedUpper !== macCalculatedUpper) {
      console.error('[MONETICO RETOUR] MAC invalide', {
        received: macReceivedUpper.substring(0, 10) + '...',
        calculated: macCalculatedUpper.substring(0, 10) + '...',
        macString: macString.substring(0, 100) + '...',
      })
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      )
    }

    console.log('[MONETICO RETOUR] ✅ MAC validé')

    // Vérifier le code retour
    const isSuccess = codeRetour === 'paiement' || codeRetour === 'payetest'
    
    // Mettre à jour la commande dans Supabase
    if (isSuccess && reference) {
      try {
        const { getSupabaseClient } = await import('@/lib/supabase')
        const supabase = getSupabaseClient()
        
        if (supabase) {
          // Chercher la commande par monetico_reference
          const { data: order, error: findError } = await supabase
            .from('orders')
            .select('id, reference, status')
            .eq('monetico_reference', reference)
            .single()

          if (!findError && order) {
            // Mettre à jour le statut si nécessaire
            if (order.status === 'pending') {
              await supabase
                .from('orders')
                .update({ 
                  status: 'completed',
                  // Ajouter transaction_id si disponible
                  ...(params.numauto ? { transaction_id: params.numauto } : {})
                })
                .eq('id', order.id)
              
              console.log('[MONETICO RETOUR] ✅ Commande mise à jour:', order.reference)
            }
          } else {
            console.warn('[MONETICO RETOUR] ⚠️ Commande non trouvée pour référence:', reference)
          }
        }
      } catch (updateError) {
        console.error('[MONETICO RETOUR] Erreur mise à jour commande:', updateError)
        // Ne pas bloquer la réponse, Monetico doit recevoir un 200
      }
    }

    // Si c'est une requête POST depuis Monetico (notification serveur), retourner JSON
    // Si c'est une redirection utilisateur, rediriger vers la page appropriée
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // C'est une notification POST de Monetico, retourner JSON
      return NextResponse.json({ 
        success: isSuccess,
        reference 
      })
    } else {
      // C'est une redirection GET, rediriger vers la page appropriée
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devorbaits.com'
      const redirectUrl = isSuccess
        ? `${baseUrl}/payment/success?reference=${reference}&code-retour=${codeRetour}`
        : `${baseUrl}/payment/error?reference=${reference}&code-retour=${codeRetour}`
      
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error: any) {
    console.error('[MONETICO RETOUR] Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * Route GET pour redirection depuis Monetico (fallback)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const codeRetour = searchParams.get('code-retour')
  const reference = searchParams.get('reference')
  
  // Rediriger vers la page de succès ou d'erreur
  const isSuccess = codeRetour === 'paiement' || codeRetour === 'payetest'
  const redirectUrl = isSuccess 
    ? `/payment/success?reference=${reference}&code-retour=${codeRetour}`
    : `/payment/error?reference=${reference}&code-retour=${codeRetour}`
  
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}
