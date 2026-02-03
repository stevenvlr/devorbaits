/**
 * Helper server-only : appelle l’API interne pour créer un shipping_draft.
 * À utiliser après passage d’une commande au statut "preparing".
 */

/**
 * Crée un brouillon d’expédition pour la commande en appelant POST /api/shipping/drafts/{orderId}.
 * - skipped: true → ignoré (retrait sur place)
 * - 400 → log l’erreur, ne lance pas
 * - ok: true → log "draft created"
 */
export async function createShippingDraftForOrder(orderId: string): Promise<void> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  if (!base) {
    console.warn('[createShippingDraftForOrder] Base URL manquante (NEXT_PUBLIC_SITE_URL / VERCEL_URL)')
    return
  }
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    console.warn('[createShippingDraftForOrder] INTERNAL_API_SECRET manquant')
    return
  }

  const url = `${base.replace(/\/$/, '')}/api/shipping/drafts/${encodeURIComponent(orderId)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': secret.trim(),
    },
  })

  const text = await res.text()
  let data: { ok?: boolean; skipped?: boolean; reason?: string; error?: string } = {}
  try {
    data = JSON.parse(text)
  } catch {
    console.error('[createShippingDraftForOrder] Réponse non JSON', orderId, res.status, text.slice(0, 200))
    return
  }

  if (data.skipped === true) {
    return
  }
  if (res.status === 400) {
    console.error('[createShippingDraftForOrder] Infos manquantes', orderId, data.error)
    return
  }
  if (data.ok === true) {
    console.info('[createShippingDraftForOrder] draft created', orderId)
    return
  }
  console.error('[createShippingDraftForOrder] Erreur', orderId, res.status, data.error ?? text.slice(0, 200))
}
