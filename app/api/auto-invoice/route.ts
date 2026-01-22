import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { buildProductNameWithVariants } from '@/lib/price-utils'

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

type BillingAddress = {
  nom?: string
  prenom?: string
  adresse?: string
  codePostal?: string
  ville?: string
  pays?: string
  telephone?: string
}

const INVOICE_LOGO_URL =
  'https://nbnvcsuzhuwhvvbgxbhe.supabase.co/storage/v1/object/public/site-assets/logodevorbaits.png'

const SELLER_INFO = {
  brand: 'Devorbaits',
  addressLine: '240 rue Douce, 60130 Wavignies',
  phone: '07 61 28 85 12',
  email: 'devorbaits.contact@gmail.com',
  siret: '848 555 686 00015',
  rcs: '848 555 686 R.C.S Beauvais',
  legalForm: 'Auto-entrepreneur',
  vat: 'TVA non applicable, art. 293 B du CGI',
}

function generateInvoiceNumber(now = new Date()) {
  const year = now.getFullYear()
  const suffix = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0')
  return `FAC-${year}-${suffix}`
}

async function getInvoiceLines(params: {
  order: any
}): Promise<InvoiceLine[]> {
  const { order } = params

  const items = Array.isArray(order?.items) ? order.items : []
  const mapped: InvoiceLine[] = []
  for (const raw of items) {
    const r = raw as any
    // Utiliser la fonction utilitaire pour construire le nom complet avec variantes et conditionnements
    const name = buildProductNameWithVariants({
      produit: r?.produit,
      name: r?.name,
      product_id: r?.product_id,
      arome: r?.arome,
      taille: r?.taille,
      couleur: r?.couleur,
      diametre: r?.diametre,
      conditionnement: r?.conditionnement,
      forme: r?.forme,
      saveur: r?.saveur,
      gamme: r?.gamme,
    })
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
  billingAddress?: BillingAddress | null
  lines: InvoiceLine[]
  itemsSubtotal: number
  shippingCost: number
  discountAmount?: number
  total: number
  currency?: string
}) {
  const currency = params.currency || 'EUR'
  const pdf = await PDFDocument.create()
  const pageSize: [number, number] = [595.28, 841.89] // A4 (points)

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const COLOR = {
    black: rgb(0, 0, 0),
    white: rgb(1, 1, 1),
    gold: rgb(1, 0.843, 0),
    grayText: rgb(0.35, 0.35, 0.35),
    lightBorder: rgb(0.85, 0.85, 0.85),
    darkPanel: rgb(0.07, 0.07, 0.07),
  }

  const margin = 48
  const headerHeight = 92
  const footerHeight = 46

  const safeText = (v: unknown) =>
    typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()

  const formatDate = (d: Date) => {
    try {
      return d.toLocaleDateString('fr-FR')
    } catch {
      return d.toISOString().slice(0, 10)
    }
  }

  const measure = (text: string, size: number, useBold = false) =>
    (useBold ? fontBold : font).widthOfTextAtSize(text, size)

  const wrapText = (text: string, maxWidth: number, size: number, useBold = false) => {
    const t = safeText(text)
    if (!t) return ['']
    const words = t.split(/\s+/g)
    const lines: string[] = []
    let current = ''
    for (const w of words) {
      const next = current ? `${current} ${w}` : w
      if (measure(next, size, useBold) <= maxWidth) {
        current = next
      } else {
        if (current) lines.push(current)
        current = w
      }
    }
    if (current) lines.push(current)
    return lines.length > 0 ? lines : ['']
  }

  const drawText = (page: any, text: string, x: number, y: number, size: number, opts?: { bold?: boolean; color?: any }) => {
    page.drawText(safeText(text), {
      x,
      y,
      size,
      font: opts?.bold ? fontBold : font,
      color: opts?.color || COLOR.black,
    })
  }

  const drawBox = (page: any, x: number, y: number, w: number, h: number, opts?: { fill?: any; border?: any; borderWidth?: number }) => {
    if (opts?.fill) {
      page.drawRectangle({ x, y, width: w, height: h, color: opts.fill })
    }
    if (opts?.border) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: opts.border,
        borderWidth: opts.borderWidth ?? 1,
      })
    }
  }

  const drawDivider = (page: any, x1: number, x2: number, y: number, color: any, width = 1) => {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color, thickness: width })
  }

  let logoImg: any = null
  const tryEmbedLogo = async () => {
    try {
      const res = await fetch(INVOICE_LOGO_URL)
      if (!res.ok) return null
      const arrayBuffer = await res.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('png')) {
        return await pdf.embedPng(bytes)
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        return await pdf.embedJpg(bytes)
      }
      return await pdf.embedPng(bytes)
    } catch {
      return null
    }
  }

  logoImg = await tryEmbedLogo()

  const makePage = () => {
    const page = pdf.addPage(pageSize)
    const { width, height } = page.getSize()

    drawBox(page, 0, height - headerHeight, width, headerHeight, { fill: COLOR.black })
    drawDivider(page, 0, width, height - headerHeight, COLOR.gold, 2)

    if (logoImg) {
      const targetW = 140
      const scale = targetW / logoImg.width
      const targetH = logoImg.height * scale
      const x = (width - targetW) / 2
      const y = height - headerHeight + (headerHeight - targetH) / 2
      page.drawImage(logoImg, { x, y, width: targetW, height: targetH })
    } else {
      drawText(page, SELLER_INFO.brand, width / 2 - measure(SELLER_INFO.brand, 18, true) / 2, height - headerHeight / 2 - 8, 18, {
        bold: true,
        color: COLOR.gold,
      })
    }

    drawDivider(page, margin, width - margin, footerHeight, COLOR.lightBorder, 1)
    const footerLeft = `${SELLER_INFO.brand} — SIRET ${SELLER_INFO.siret} — ${SELLER_INFO.rcs}`
    const footerRight = SELLER_INFO.vat
    drawText(page, footerLeft, margin, 30, 9, { color: COLOR.grayText })
    drawText(page, footerRight, width - margin - measure(footerRight, 9), 30, 9, { color: COLOR.grayText })

    return { page, width, height }
  }

  const xLeft = margin
  const contentWidth = pageSize[0] - margin * 2

  let { page, width, height } = makePage()
  let y = height - headerHeight - 26

  const ensureSpace = (needed: number) => {
    const minY = footerHeight + 18
    if (y - needed < minY) {
      ;({ page, width, height } = makePage())
      y = height - headerHeight - 26
    }
  }

  drawText(page, 'FACTURE', xLeft, y, 20, { bold: true, color: COLOR.black })
  const titleLineY = y - 8
  drawDivider(page, xLeft, xLeft + 120, titleLineY, COLOR.gold, 3)

  const metaBoxW = 220
  const metaBoxH = 58
  const metaX = width - margin - metaBoxW
  const metaY = y - 40
  drawBox(page, metaX, metaY, metaBoxW, metaBoxH, { fill: COLOR.darkPanel, border: COLOR.gold, borderWidth: 1 })
  drawText(page, `Facture N° ${params.invoiceNumber}`, metaX + 12, metaY + 36, 11, { bold: true, color: COLOR.gold })
  drawText(page, `Date : ${formatDate(params.invoiceDate)}`, metaX + 12, metaY + 18, 10, { color: COLOR.white })

  y = metaY - 24

  const sellerBlock = [SELLER_INFO.brand, SELLER_INFO.addressLine, `Tél : ${SELLER_INFO.phone}`, `Email : ${SELLER_INFO.email}`]
  const billingBlock: string[] = []

  const ba = params.billingAddress
  if (ba) {
    if (ba.prenom || ba.nom) billingBlock.push([ba.prenom, ba.nom].filter(Boolean).join(' '))
    if (ba.adresse) billingBlock.push(ba.adresse)
    if (ba.codePostal || ba.ville) billingBlock.push([ba.codePostal, ba.ville].filter(Boolean).join(' '))
    if (ba.pays) billingBlock.push(ba.pays)
    if (ba.telephone) billingBlock.push(`Tél : ${ba.telephone}`)
  }
  if (billingBlock.length === 0) {
    billingBlock.push(params.customerEmail)
  }

  const colWidth = (contentWidth - 20) / 2

  const drawInfoBlock = (title: string, lines: string[], startX: number) => {
    drawText(page, title, startX, y, 10, { bold: true, color: COLOR.grayText })
    let by = y - 16
    for (const line of lines) {
      const wrapped = wrapText(line, colWidth - 10, 10)
      for (const wl of wrapped) {
        drawText(page, wl, startX, by, 10, { color: COLOR.black })
        by -= 14
      }
    }
    return by
  }

  const leftEnd = drawInfoBlock('Vendeur', sellerBlock, xLeft)
  const rightEnd = drawInfoBlock('Client', billingBlock, xLeft + colWidth + 20)
  y = Math.min(leftEnd, rightEnd) - 24

  const tableTop = y
  const colQty = 50
  const colUnit = 80
  const colTotal = 80
  const colName = contentWidth - colQty - colUnit - colTotal

  const rowHeight = 22
  const headerBgH = rowHeight + 4

  drawBox(page, xLeft, tableTop - headerBgH, contentWidth, headerBgH, { fill: COLOR.darkPanel })
  drawText(page, 'Article', xLeft + 6, tableTop - 15, 10, { bold: true, color: COLOR.gold })
  drawText(page, 'Qté', xLeft + colName + 6, tableTop - 15, 10, { bold: true, color: COLOR.gold })
  drawText(page, 'P.U. HT', xLeft + colName + colQty + 6, tableTop - 15, 10, { bold: true, color: COLOR.gold })
  drawText(page, 'Total HT', xLeft + colName + colQty + colUnit + 6, tableTop - 15, 10, { bold: true, color: COLOR.gold })

  y = tableTop - headerBgH - 6

  for (const line of params.lines) {
    const nameLines = wrapText(line.name, colName - 12, 10)
    const neededHeight = nameLines.length * 14 + 10
    ensureSpace(neededHeight)

    const rowTop = y
    let ty = rowTop - 14
    for (const nl of nameLines) {
      drawText(page, nl, xLeft + 6, ty, 10, { color: COLOR.black })
      ty -= 14
    }
    drawText(page, String(line.qty), xLeft + colName + 6, rowTop - 14, 10, { color: COLOR.black })
    drawText(page, formatMoney(line.unitPrice, currency), xLeft + colName + colQty + 6, rowTop - 14, 10, { color: COLOR.black })
    drawText(page, formatMoney(line.lineTotal, currency), xLeft + colName + colQty + colUnit + 6, rowTop - 14, 10, { color: COLOR.black })

    y = ty - 4
    drawDivider(page, xLeft, xLeft + contentWidth, y + 2, COLOR.lightBorder, 0.5)
    y -= 4
  }

  y -= 12
  ensureSpace(90)

  const summaryW = 200
  const summaryH = 80
  const summaryX = width - margin - summaryW

  drawBox(page, summaryX, y - summaryH, summaryW, summaryH, {
    fill: COLOR.white,
    border: COLOR.gold,
    borderWidth: 1,
  })

  let sy = y - 22
  const lx = summaryX + 12
  const vx = summaryX + summaryW - 12
  const drawSummaryLine = (label: string, value: string, bold = false) => {
    drawText(page, label, lx, sy, 10, { bold, color: COLOR.black })
    drawText(page, value, vx - measure(value, bold ? 11 : 10, bold), sy, bold ? 11 : 10, {
      bold,
      color: COLOR.black,
    })
    sy -= 16
  }

  drawSummaryLine('Sous-total', formatMoney(params.itemsSubtotal, currency))
  drawSummaryLine('Frais de port', formatMoney(params.shippingCost, currency))
  const discount = typeof params.discountAmount === 'number' ? params.discountAmount : 0
  if (discount > 0.005) {
    drawSummaryLine('Remise', `-${formatMoney(discount, currency)}`)
  }
  sy -= 4
  drawSummaryLine('TOTAL', formatMoney(params.total, currency), true)

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
    .createSignedUrl(filePath, 60 * 60 * 24 * 7)

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

/**
 * API pour générer automatiquement la facture et envoyer l'email au client
 * après validation du paiement (Monetico ou PayPal).
 * 
 * Body attendu:
 * - orderId: ID de la commande dans Supabase
 * - OR reference: référence de la commande (si orderId non disponible)
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: 'Configuration Supabase manquante (SUPABASE_URL ou SERVICE_ROLE_KEY)' },
        { status: 500 }
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false, error: 'Body JSON invalide' }, { status: 400 })
    }

    const orderId = isNonEmptyString(body?.orderId) ? body.orderId.trim() : ''
    const reference = isNonEmptyString(body?.reference) ? body.reference.trim() : ''

    if (!orderId && !reference) {
      return NextResponse.json(
        { ok: false, error: 'orderId ou reference obligatoire' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Récupérer la commande
    let orderQuery = supabase.from('orders').select('*')
    if (orderId) {
      orderQuery = orderQuery.eq('id', orderId)
    } else {
      orderQuery = orderQuery.eq('reference', reference)
    }

    const { data: order, error: orderError } = await orderQuery.single()

    if (orderError || !order) {
      return NextResponse.json(
        { ok: false, error: orderError?.message || 'Commande introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si la facture existe déjà
    if (order.invoice_url && order.invoice_number) {
      return NextResponse.json({
        ok: true,
        message: 'Facture déjà générée',
        invoiceUrl: order.invoice_url,
        invoiceNumber: order.invoice_number,
        alreadyExists: true,
      })
    }

    // Récupérer l'email du client
    let customerEmail = ''
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.user_id)
        .single()
      customerEmail = profile?.email || ''
    }

    if (!customerEmail) {
      return NextResponse.json(
        { ok: false, error: 'Email client introuvable' },
        { status: 400 }
      )
    }

    // Générer le numéro de facture
    const createdAt =
      typeof order.created_at === 'string' || order.created_at instanceof Date
        ? new Date(order.created_at)
        : new Date()

    let invoiceNumber = order.invoice_number
    if (!invoiceNumber) {
      invoiceNumber = generateInvoiceNumber(createdAt)
      
      // Sauvegarder le numéro de facture
      const { error: saveNumberError } = await supabase
        .from('orders')
        .update({ invoice_number: invoiceNumber })
        .eq('id', order.id)

      if (saveNumberError) {
        console.warn('Erreur sauvegarde invoice_number:', saveNumberError.message)
      }
    }

    // Construire les lignes de facture
    const lines = await getInvoiceLines({ order })
    const itemsSubtotal = lines.reduce((sum, l) => sum + (l.lineTotal || 0), 0)
    const shippingCost = toNumber(order.shipping_cost) ?? 0
    const totalFromOrder = toNumber(order.total)
    const total = totalFromOrder ?? (itemsSubtotal + shippingCost)
    const discountAmount = Math.max(0, itemsSubtotal + shippingCost - total)

    // Générer le PDF
    const pdfBytes = await buildInvoicePdfBytes({
      invoiceNumber,
      invoiceDate: createdAt,
      customerEmail,
      billingAddress: order.billing_address || null,
      lines,
      itemsSubtotal,
      shippingCost,
      discountAmount,
      total,
      currency: 'EUR',
    })

    // Uploader le PDF
    const uploaded = await uploadInvoiceAndGetUrl({
      supabase,
      invoiceNumber,
      pdfBytes,
    })

    const invoiceUrl = uploaded.url

    // Sauvegarder l'URL de la facture
    const { error: saveUrlError } = await supabase
      .from('orders')
      .update({ invoice_url: invoiceUrl })
      .eq('id', order.id)

    if (saveUrlError) {
      console.warn('Erreur sauvegarde invoice_url:', saveUrlError.message)
    }

    // Envoyer l'email avec la facture
    const orderRef = order.reference || order.id
    const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
  </head>
  <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#111;padding:20px;text-align:center;border-bottom:3px solid #FFD700;">
      <h1 style="color:#FFD700;margin:0;font-size:24px;">Devorbaits</h1>
    </div>
    
    <div style="padding:30px 20px;">
      <h2 style="color:#111;margin:0 0 20px 0;">Merci pour votre commande !</h2>
      
      <p style="margin:0 0 15px 0;">Bonjour,</p>
      
      <p style="margin:0 0 15px 0;">
        Votre paiement a été validé avec succès. Vous trouverez ci-dessous votre facture.
      </p>
      
      <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 10px 0;"><strong>Commande :</strong> #${escapeHtml(orderRef)}</p>
        <p style="margin:0 0 10px 0;"><strong>Montant :</strong> ${formatMoney(total, 'EUR')}</p>
        <p style="margin:0;"><strong>Facture N° :</strong> ${escapeHtml(invoiceNumber)}</p>
      </div>
      
      <div style="text-align:center;margin:30px 0;">
        <a href="${escapeHtml(invoiceUrl)}" 
           style="display:inline-block;background:#FFD700;color:#111;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">
          Télécharger ma facture (PDF)
        </a>
      </div>
      
      <p style="margin:20px 0 0 0;font-size:14px;color:#666;">
        Vous pouvez également retrouver votre facture dans votre espace client, rubrique "Mes commandes".
      </p>
    </div>
    
    <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#666;border-top:1px solid #ddd;">
      <p style="margin:0 0 5px 0;">Devorbaits — 240 rue Douce, 60130 Wavignies</p>
      <p style="margin:0;">Tél : 07 61 28 85 12 | Email : devorbaits.contact@gmail.com</p>
    </div>
  </body>
</html>`

    const sendResult = await sendResendEmail({
      to: customerEmail,
      subject: `Votre facture - Commande #${orderRef}`,
      html,
    })

    if (!sendResult.ok) {
      // La facture est générée mais l'email n'a pas été envoyé
      return NextResponse.json({
        ok: true,
        warning: `Facture générée mais email non envoyé: ${sendResult.error}`,
        invoiceUrl,
        invoiceNumber,
        emailSent: false,
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Facture générée et email envoyé',
      invoiceUrl,
      invoiceNumber,
      emailSent: true,
      emailId: sendResult.id,
    })
  } catch (error: any) {
    console.error('Erreur auto-invoice:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
