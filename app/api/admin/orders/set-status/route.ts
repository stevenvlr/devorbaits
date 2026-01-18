import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'edge'

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

function formatMoney(amount: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function normalizeStatus(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents (expédié -> expédie)
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

type InvoiceLine = {
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
}

function generateInvoiceNumber(now = new Date()) {
  const year = now.getFullYear()
  const suffix = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0')
  return `FAC-${year}-${suffix}`
}

async function getInvoiceLines(params: {
  supabase: any
  orderId: string
  order: any
}): Promise<InvoiceLine[]> {
  const { supabase, orderId, order } = params

  // 1) Essayer order_items (si encore utilisé côté DB)
  try {
    const { data, error } = await supabase
      .from('order_items')
      // On sélectionne "large" car les schémas peuvent varier (name/unit_price/qty vs price/quantity vs produit)
      .select('name,unit_price,qty,quantity,price,product_id,produit')
      .eq('order_id', orderId)

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped: InvoiceLine[] = []
      for (const raw of data) {
        const r = raw as any
        const name =
          (typeof r?.name === 'string' && r.name.trim() !== ''
            ? r.name.trim()
            : typeof r?.produit === 'string' && r.produit.trim() !== ''
              ? r.produit.trim()
              : typeof r?.product_id === 'string' && r.product_id.trim() !== ''
                ? r.product_id.trim()
                : 'Article') || 'Article'
        const qty = toNumber(r?.qty ?? r?.quantity) ?? 0
        const unitPrice = toNumber(r?.unit_price ?? r?.price) ?? 0
        if (qty <= 0) continue
        mapped.push({
          name,
          qty,
          unitPrice,
          lineTotal: qty * unitPrice,
        })
      }
      if (mapped.length > 0) return mapped
    }

    // Si la table n'existe pas / colonnes manquantes, on fallback sur orders.items
  } catch {
    // ignore
  }

  // 2) Fallback: items stockés dans orders.items (JSONB)
  const items = Array.isArray(order?.items) ? order.items : []
  const mapped: InvoiceLine[] = []
  for (const raw of items) {
    const r = raw as any
    const name =
      (typeof r?.name === 'string' && r.name.trim() !== ''
        ? r.name.trim()
        : typeof r?.produit === 'string' && r.produit.trim() !== ''
          ? r.produit.trim()
          : typeof r?.product_id === 'string' && r.product_id.trim() !== ''
            ? r.product_id.trim()
            : 'Article') || 'Article'
    const qty = toNumber(r?.qty ?? r?.quantity) ?? 0
    const unitPrice = toNumber(r?.unit_price ?? r?.unitPrice ?? r?.price) ?? 0
    if (qty <= 0) continue
    mapped.push({
      name,
      qty,
      unitPrice,
      lineTotal: qty * unitPrice,
    })
  }
  return mapped
}

async function buildInvoicePdfBytes(params: {
  invoiceNumber: string
  invoiceDate: Date
  customerEmail: string
  lines: InvoiceLine[]
  total: number
  currency?: string
}) {
  const currency = params.currency || 'EUR'
  const pdf = await PDFDocument.create()
  const pageSize: [number, number] = [595.28, 841.89] // A4 (points)

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const margin = 48
  let page = pdf.addPage(pageSize)
  let { width, height } = page.getSize()
  let y = height - margin

  const draw = (text: string, x: number, size = 11, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    })
  }

  const xName = margin
  const xQty = 340
  const xUnit = 400
  const xLine = 480

  const drawHeader = () => {
    draw('FACTURE', margin, 18, true)
    y -= 26
    draw(`N°: ${params.invoiceNumber}`, margin, 11, true)
    y -= 16
    draw(`Date: ${params.invoiceDate.toLocaleDateString('fr-FR')}`, margin, 11)
    y -= 16
    draw(`Email client: ${params.customerEmail}`, margin, 11)
    y -= 28
  }

  const drawTableHeader = () => {
    page.drawLine({
      start: { x: margin, y: y + 12 },
      end: { x: width - margin, y: y + 12 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    })
    draw('Article', xName, 11, true)
    draw('Qté', xQty, 11, true)
    draw('PU', xUnit, 11, true)
    draw('Total', xLine, 11, true)
    y -= 18
  }

  const startNewPage = (withHeader: boolean) => {
    page = pdf.addPage(pageSize)
    ;({ width, height } = page.getSize())
    y = height - margin
    if (withHeader) {
      drawHeader()
    }
    drawTableHeader()
  }

  // Première page
  drawHeader()
  drawTableHeader()

  const lineHeight = 16
  for (const line of params.lines) {
    if (y < margin + 80) {
      startNewPage(false)
    }

    const safeName = (line.name || 'Article').slice(0, 60)
    draw(safeName, xName, 10)
    draw(String(line.qty), xQty, 10)
    draw(formatMoney(line.unitPrice, currency), xUnit, 10)
    draw(formatMoney(line.lineTotal, currency), xLine, 10)
    y -= lineHeight
  }

  y -= 10
  page.drawLine({
    start: { x: margin, y: y + 12 },
    end: { x: width - margin, y: y + 12 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  })
  y -= 20
  draw(`TOTAL: ${formatMoney(params.total, currency)}`, xLine - 40, 12, true)

  return await pdf.save()
}

async function uploadInvoiceAndGetUrl(params: {
  supabase: any
  invoiceNumber: string
  pdfBytes: Uint8Array
}) {
  const { supabase, invoiceNumber, pdfBytes } = params
  const filePath = `invoices/${invoiceNumber}.pdf`

  const upload = await supabase.storage.from('invoices').upload(filePath, pdfBytes, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (upload.error) {
    throw new Error(upload.error.message || 'Erreur upload facture (Storage)')
  }

  const publicUrl = supabase.storage.from('invoices').getPublicUrl(filePath)?.data?.publicUrl || null
  const preferPublic = process.env.SUPABASE_INVOICES_BUCKET_PUBLIC === 'true'

  if (preferPublic && publicUrl) {
    return { filePath, url: publicUrl }
  }

  const signed = await supabase.storage
    .from('invoices')
    .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 jours

  if (signed.error) {
    if (publicUrl) return { filePath, url: publicUrl }
    throw new Error(signed.error.message || 'Erreur génération signed URL (Storage)')
  }

  const signedUrl = signed.data?.signedUrl
  if (!signedUrl) {
    if (publicUrl) return { filePath, url: publicUrl }
    throw new Error('Signed URL introuvable (Storage)')
  }

  return { filePath, url: signedUrl }
}

async function sendResendEmail(params: { to: string; subject: string; html: string }) {
  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!resendApiKey) {
    return { ok: false as const, error: 'RESEND_API_KEY manquant', status: 500 }
  }
  if (!from) {
    return { ok: false as const, error: 'RESEND_FROM manquant', status: 500 }
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })

  const raw = await resendResponse.text()
  let parsed: any = raw
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    // ignore
  }

  if (!resendResponse.ok) {
    const upstreamError =
      parsed?.error?.message || parsed?.message || parsed?.error || parsed || null
    return {
      ok: false as const,
      error: upstreamError || `Resend error (${resendResponse.status})`,
      status: resendResponse.status >= 400 && resendResponse.status <= 499 ? 400 : 502,
    }
  }

  const id = parsed?.id
  return { ok: true as const, id }
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

    const orderId = isNonEmptyString(body?.orderId) ? body.orderId.trim() : ''
    const statusRaw = isNonEmptyString(body?.status) ? body.status.trim() : ''
    // Tu utilises un numéro de suivi (pas un lien). On accepte trackingNumber,
    // et on garde trackingUrl en compat (si l'ancien front l'envoie encore).
    const trackingNumber =
      isNonEmptyString(body?.trackingNumber)
        ? body.trackingNumber.trim()
        : isNonEmptyString(body?.trackingUrl)
          ? body.trackingUrl.trim()
          : null
    const invoiceUrl = isNonEmptyString(body?.invoiceUrl) ? body.invoiceUrl.trim() : null

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: 'Champ "orderId" obligatoire' },
        { status: 400 }
      )
    }
    if (!statusRaw) {
      return NextResponse.json(
        { ok: false, error: 'Champ "status" obligatoire' },
        { status: 400 }
      )
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { ok: false, error: 'SUPABASE_URL manquant (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL)' },
        { status: 500 }
      )
    }
    if (!serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY manquant' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // 1) Lire la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      const msg = orderError.message || 'Erreur lecture commande'
      const statusCode = msg.toLowerCase().includes('0 rows') ? 404 : 500
      return NextResponse.json({ ok: false, error: msg }, { status: statusCode })
    }
    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'Commande introuvable' },
        { status: 404 }
      )
    }

    // 2) Récupérer l'email client
    const emailFromOrder =
      typeof order.email === 'string' && order.email.trim().length > 0 ? order.email.trim() : null

    let customerEmail: string | null = emailFromOrder

    if (!customerEmail && order.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.user_id)
        .single()

      if (profileError) {
        return NextResponse.json(
          { ok: false, error: profileError.message || 'Erreur lecture profil' },
          { status: 500 }
        )
      }

      if (profile?.email && typeof profile.email === 'string' && profile.email.trim() !== '') {
        customerEmail = profile.email.trim()
      }
    }

    if (!customerEmail) {
      return NextResponse.json(
        { ok: false, error: "Email client introuvable (orders.email ou profiles.email)" },
        { status: 500 }
      )
    }

    // 3) Mettre à jour la commande (status + invoice_url + shipping_tracking_number si fournis)
    const baseUpdate: Record<string, any> = { status: statusRaw }
    if (trackingNumber) baseUpdate.shipping_tracking_number = trackingNumber
    if (invoiceUrl) baseUpdate.invoice_url = invoiceUrl

    // On tente avec les colonnes, sinon fallback sans (si certaines colonnes absentes)
    const baseUpdateAttempt = await supabase.from('orders').update(baseUpdate).eq('id', orderId)
    if (baseUpdateAttempt.error) {
      const msg = baseUpdateAttempt.error.message || 'Erreur update commande'

      const isMissingColumn =
        msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')

      if (isMissingColumn && (trackingNumber || invoiceUrl)) {
        // retry sans shipping_tracking_number / invoice_url
        const fallbackUpdate: Record<string, any> = { status: statusRaw }
        const retry = await supabase.from('orders').update(fallbackUpdate).eq('id', orderId)
        if (retry.error) {
          return NextResponse.json(
            { ok: false, error: retry.error.message || msg },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json({ ok: false, error: msg }, { status: 500 })
      }
    }

    // Déclencheurs (anti-doublon via *claim* sur invoice_sent_at / tracking_sent_at)
    const statusNorm = normalizeStatus(statusRaw)
    const reference = (typeof order.reference === 'string' && order.reference.trim() !== '')
      ? order.reference.trim()
      : orderId

    // FACTURE: status == preparation/preparing
    if (statusNorm === 'preparation' || statusNorm === 'preparing') {
      const alreadySent = order.email_preparation_sent_at != null
      if (!alreadySent) {
        const nowIso = new Date().toISOString()

        // Claim: n'envoyer qu'une seule fois même si plusieurs appels concurrents
        const claim = await supabase
          .from('orders')
          .update({ email_preparation_sent_at: nowIso })
          .eq('id', orderId)
          .is('email_preparation_sent_at', null)
          .select('id')

        if (claim.error) {
          const msg = claim.error.message || 'Erreur email_preparation_sent_at'
          const missingCols =
            msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')
          return NextResponse.json(
            {
              ok: false,
              error: missingCols
                ? 'Colonne requise manquante dans orders: email_preparation_sent_at (et idéalement invoice_url).'
                : msg,
            },
            { status: 500 }
          )
        }

        const claimed = Array.isArray(claim.data) ? claim.data.length > 0 : !!claim.data
        if (claimed) {
          let effectiveInvoiceUrl =
            invoiceUrl ||
            (typeof (order as any).invoice_url === 'string' &&
            (order as any).invoice_url.trim() !== ''
              ? (order as any).invoice_url.trim()
              : null)

          // Si on passe en "préparation" et qu'on n'a pas encore de facture, on la génère
          if (!effectiveInvoiceUrl) {
            const createdAt =
              typeof (order as any).created_at === 'string' || (order as any).created_at instanceof Date
                ? new Date((order as any).created_at)
                : new Date()

            let invoiceNumber =
              typeof (order as any).invoice_number === 'string' && (order as any).invoice_number.trim() !== ''
                ? (order as any).invoice_number.trim()
                : null

            if (!invoiceNumber) {
              invoiceNumber = generateInvoiceNumber(createdAt)
              const saveNumber = await supabase
                .from('orders')
                .update({ invoice_number: invoiceNumber })
                .eq('id', orderId)

              if (saveNumber.error) {
                const msg = saveNumber.error.message || 'Erreur sauvegarde invoice_number'
                const missingCols =
                  msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')

                // rollback du claim (comme pour Resend) pour ne pas bloquer l'envoi
                await supabase
                  .from('orders')
                  .update({ email_preparation_sent_at: null })
                  .eq('id', orderId)
                  .eq('email_preparation_sent_at', nowIso)

                return NextResponse.json(
                  {
                    ok: false,
                    error: missingCols
                      ? 'Colonne requise manquante dans orders: invoice_number. Exécute le SQL: supabase-add-invoice-tracking-email-fields.sql'
                      : msg,
                  },
                  { status: 500 }
                )
              }
            }

            const lines = await getInvoiceLines({ supabase, orderId, order })
            const computedTotal = lines.reduce((sum, l) => sum + (l.lineTotal || 0), 0)
            const totalFromOrder = toNumber((order as any).total)
            const total = totalFromOrder ?? computedTotal

            try {
              const pdfBytes = await buildInvoicePdfBytes({
                invoiceNumber,
                invoiceDate: createdAt,
                customerEmail,
                lines,
                total,
                currency: 'EUR',
              })

              const uploaded = await uploadInvoiceAndGetUrl({
                supabase,
                invoiceNumber,
                pdfBytes,
              })

              effectiveInvoiceUrl = uploaded.url

              const saveUrl = await supabase
                .from('orders')
                .update({ invoice_url: effectiveInvoiceUrl })
                .eq('id', orderId)

              if (saveUrl.error) {
                const msg = saveUrl.error.message || 'Erreur sauvegarde invoice_url'
                const missingCols =
                  msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')

                await supabase
                  .from('orders')
                  .update({ email_preparation_sent_at: null })
                  .eq('id', orderId)
                  .eq('email_preparation_sent_at', nowIso)

                return NextResponse.json(
                  {
                    ok: false,
                    error: missingCols
                      ? 'Colonne requise manquante dans orders: invoice_url. Exécute le SQL: supabase-add-invoice-tracking-email-fields.sql'
                      : msg,
                  },
                  { status: 500 }
                )
              }
            } catch (e: any) {
              await supabase
                .from('orders')
                .update({ email_preparation_sent_at: null })
                .eq('id', orderId)
                .eq('email_preparation_sent_at', nowIso)

              return NextResponse.json(
                { ok: false, error: e?.message || 'Erreur génération facture (PDF/Storage)' },
                { status: 500 }
              )
            }
          }

          const html = `<!doctype html>
<html lang="fr">
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
    <h1 style="margin:0 0 12px 0;">Votre commande est en préparation</h1>
    <p style="margin:0 0 12px 0;">Commande <strong>#${escapeHtml(reference)}</strong></p>
    ${
      effectiveInvoiceUrl
        ? `<p style="margin:0 0 12px 0;">Télécharger votre facture : <a href="${escapeHtml(
            effectiveInvoiceUrl
          )}">${escapeHtml(effectiveInvoiceUrl)}</a></p>`
        : `<p style="margin:0 0 12px 0;">Votre facture est en cours de préparation. Vous la recevrez bientôt.</p>`
    }
  </body>
</html>`

          const send = await sendResendEmail({
            to: customerEmail,
            subject: `Préparation - commande #${reference}`,
            html,
          })

          if (!send.ok) {
            // rollback du claim pour éviter de bloquer l'envoi en cas d'erreur Resend
            await supabase
              .from('orders')
              .update({ email_preparation_sent_at: null })
              .eq('id', orderId)
              .eq('email_preparation_sent_at', nowIso)

            return NextResponse.json(
              { ok: false, error: send.error },
              { status: send.status }
            )
          }
        }
      }
    }

    // SUIVI: status == expedie/shipped
    if (statusNorm === 'expedie' || statusNorm === 'shipped') {
      const alreadySent = order.email_expedie_sent_at != null
      if (!alreadySent) {
        const effectiveTrackingNumber =
          trackingNumber ||
          (typeof order.shipping_tracking_number === 'string' &&
          order.shipping_tracking_number.trim() !== ''
            ? order.shipping_tracking_number.trim()
            : null)

        if (!effectiveTrackingNumber) {
          return NextResponse.json(
            { ok: false, error: 'trackingNumber requis pour envoyer l’email de suivi' },
            { status: 400 }
          )
        }

        const nowIso = new Date().toISOString()

        const claim = await supabase
          .from('orders')
          .update({ email_expedie_sent_at: nowIso })
          .eq('id', orderId)
          .is('email_expedie_sent_at', null)
          .select('id')

        if (claim.error) {
          const msg = claim.error.message || 'Erreur email_expedie_sent_at'
          const missingCols =
            msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist')
          return NextResponse.json(
            {
              ok: false,
              error: missingCols
                ? 'Colonne requise manquante dans orders: email_expedie_sent_at (et idéalement shipping_tracking_number).'
                : msg,
            },
            { status: 500 }
          )
        }

        const claimed = Array.isArray(claim.data) ? claim.data.length > 0 : !!claim.data
        if (claimed) {
          const html = `<!doctype html>
<html lang="fr">
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
    <h1 style="margin:0 0 12px 0;">Votre commande a été expédiée</h1>
    <p style="margin:0 0 12px 0;">Commande <strong>#${escapeHtml(reference)}</strong></p>
    <p style="margin:0 0 12px 0;">Numéro de suivi : <strong>${escapeHtml(
      effectiveTrackingNumber
    )}</strong></p>
  </body>
</html>`

          const send = await sendResendEmail({
            to: customerEmail,
            subject: `Expédition - commande #${reference}`,
            html,
          })

          if (!send.ok) {
            await supabase
              .from('orders')
              .update({ email_expedie_sent_at: null })
              .eq('id', orderId)
              .eq('email_expedie_sent_at', nowIso)

            return NextResponse.json(
              { ok: false, error: send.error },
              { status: send.status }
            )
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

