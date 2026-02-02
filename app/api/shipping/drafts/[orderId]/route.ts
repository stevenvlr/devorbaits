import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateShippingDraft } from '@/lib/shipping-draft'

export const runtime = 'edge'

const INTERNAL_SECRET_HEADER = 'x-internal-secret'

/**
 * POST /api/shipping/drafts/[orderId]
 * Crée ou met à jour le brouillon d’expédition pour la commande.
 * Protégé par X-Internal-Secret (INTERNAL_API_SECRET).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const secret = process.env.INTERNAL_API_SECRET
  const provided = request.headers.get(INTERNAL_SECRET_HEADER)

  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    console.error('[POST /api/shipping/drafts/[orderId]] INTERNAL_API_SECRET non configuré')
    return NextResponse.json(
      { ok: false, error: 'Configuration serveur manquante' },
      { status: 500 }
    )
  }

  if (!provided || provided.trim() !== secret.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Non autorisé' },
      { status: 401 }
    )
  }

  let orderId: string
  try {
    const params = await context.params
    orderId = params.orderId?.trim() ?? ''
  } catch {
    return NextResponse.json(
      { ok: false, error: 'orderId manquant' },
      { status: 400 }
    )
  }

  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: 'orderId manquant' },
      { status: 400 }
    )
  }

  try {
    const draft = await createOrUpdateShippingDraft(orderId)
    return NextResponse.json({ ok: true, draft })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const lower = message.toLowerCase()

    if (
      lower.includes('introuvable') ||
      lower.includes('0 rows') ||
      lower.includes('commande introuvable')
    ) {
      return NextResponse.json(
        { ok: false, error: message },
        { status: 404 }
      )
    }

    if (
      (lower.includes('champs') && lower.includes('manquants')) ||
      lower.includes('destinataire manquant') ||
      lower.includes('point relais manquant') ||
      lower.includes('total_weight_g manquant ou invalide') ||
      lower.includes('buildparcels')
    ) {
      return NextResponse.json(
        { ok: false, error: message },
        { status: 400 }
      )
    }

    console.error('[POST /api/shipping/drafts/[orderId]]', orderId, err)
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}
