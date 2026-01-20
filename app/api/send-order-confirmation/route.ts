import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

type OrderItem = {
  name: string
  qty: number
  price: number
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function toNumber(v: unknown) {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function parseItems(v: unknown): OrderItem[] {
  if (!Array.isArray(v)) return []
  const out: OrderItem[] = []

  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const name = isNonEmptyString(r.name) ? r.name.trim() : ''
    const qty = toNumber(r.qty)
    const price = toNumber(r.price)

    if (!name || qty === null || price === null) continue
    out.push({ name, qty, price })
  }

  return out
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // fallback si currency invalide
    return `${amount.toFixed(2)} ${currency}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const expectedKey = process.env.EMAIL_INTERNAL_KEY
    if (!expectedKey) {
      return NextResponse.json(
        { ok: false, error: 'EMAIL_INTERNAL_KEY manquant' },
        { status: 500 }
      )
    }

    const providedKey = request.headers.get('x-internal-key')
    if (!providedKey || providedKey !== expectedKey) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Body JSON invalide' },
        { status: 400 }
      )
    }

    const to = isNonEmptyString(body?.to) ? body.to.trim() : ''
    const orderId = isNonEmptyString(body?.orderId) ? body.orderId.trim() : ''
    const currency = isNonEmptyString(body?.currency) ? body.currency.trim() : 'EUR'

    const totalParsed = toNumber(body?.total)
    const total = totalParsed ?? 0

    const items = parseItems(body?.items)

    if (!to) {
      return NextResponse.json(
        { ok: false, error: 'Champ "to" obligatoire' },
        { status: 400 }
      )
    }
    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: 'Champ "orderId" obligatoire' },
        { status: 400 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM

    if (!resendApiKey) {
      return NextResponse.json(
        { ok: false, error: 'RESEND_API_KEY manquant' },
        { status: 500 }
      )
    }
    if (!from) {
      return NextResponse.json(
        { ok: false, error: 'RESEND_FROM manquant' },
        { status: 500 }
      )
    }

    const safeOrderId = escapeHtml(orderId)
    const title = 'Confirmation de commande'

    const itemsHtml =
      items.length > 0
        ? `<ul style="padding-left:18px;margin:12px 0;">
${items
  .map((it) => {
    const lineTotal = (Number(it.qty) || 0) * (Number(it.price) || 0)
    return `<li><strong>${escapeHtml(it.name)}</strong> — ${escapeHtml(
      String(it.qty)
    )} × ${escapeHtml(formatMoney(it.price, currency))} = ${escapeHtml(
      formatMoney(lineTotal, currency)
    )}</li>`
  })
  .join('\n')}
</ul>`
        : `<p style="margin:12px 0;">(Aucun article)</p>`

    const html = `<!doctype html>
<html lang="fr">
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
    <h1 style="margin:0 0 12px 0;">${escapeHtml(title)}</h1>
    <p style="margin:0 0 12px 0;">Commande <strong>#${safeOrderId}</strong></p>
    <h2 style="margin:16px 0 8px 0;font-size:16px;">Articles</h2>
    ${itemsHtml}
    <p style="margin:16px 0 0 0;font-size:16px;">
      Total: <strong>${escapeHtml(formatMoney(total, currency))}</strong>
    </p>
  </body>
</html>`

    const subject = `Confirmation de commande #${orderId}`

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    })

    const raw = await resendResponse.text()
    let parsed: any = raw
    try {
      parsed = raw ? JSON.parse(raw) : null
    } catch {
      // ignore (raw string)
    }

    if (!resendResponse.ok) {
      const upstreamError =
        parsed?.error?.message || parsed?.message || parsed?.error || parsed || null
      const status =
        resendResponse.status >= 400 && resendResponse.status <= 499
          ? 400
          : 502

      return NextResponse.json(
        {
          ok: false,
          error:
            upstreamError || `Resend error (${resendResponse.status})`,
        },
        { status }
      )
    }

    const id = parsed?.id
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Réponse Resend invalide (id manquant)' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, id })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

