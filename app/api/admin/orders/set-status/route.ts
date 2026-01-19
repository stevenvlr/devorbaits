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

  // Source de vérité: items stockés dans orders.items (JSONB)
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
    darkPanel: rgb(0.07, 0.07, 0.07), // ~ #111
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

  const drawText = (page: any, text: string, x: number, y: number, size: number, options?: { bold?: boolean; color?: any }) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: options?.bold ? fontBold : font,
      color: options?.color ?? COLOR.black,
    })
  }

  const drawBox = (page: any, x: number, y: number, w: number, h: number, options?: { fill?: any; border?: any; borderWidth?: number }) => {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: options?.fill,
      borderColor: options?.border,
      borderWidth: options?.borderWidth,
    })
  }

  const drawDivider = (page: any, x1: number, x2: number, y: number, color: any, thickness = 1) => {
    page.drawLine({
      start: { x: x1, y },
      end: { x: x2, y },
      color,
      thickness,
    })
  }

  async function tryEmbedLogo() {
    try {
      const res = await fetch(INVOICE_LOGO_URL)
      if (!res.ok) return null
      const ab = await res.arrayBuffer()
      const bytes = new Uint8Array(ab)
      return await pdf.embedPng(bytes)
    } catch {
      return null
    }
  }

  const logoImg = await tryEmbedLogo()

  const makePage = () => {
    const page = pdf.addPage(pageSize)
    const { width, height } = page.getSize()

    // Header bar
    drawBox(page, 0, height - headerHeight, width, headerHeight, { fill: COLOR.black })
    drawDivider(page, 0, width, height - headerHeight, COLOR.gold, 2)

    // Logo centered
    if (logoImg) {
      const targetW = 140
      const scale = targetW / logoImg.width
      const targetH = logoImg.height * scale
      const x = (width - targetW) / 2
      const y = height - headerHeight + (headerHeight - targetH) / 2
      page.drawImage(logoImg, { x, y, width: targetW, height: targetH })
    } else {
      // Fallback text
      drawText(page, SELLER_INFO.brand, width / 2 - measure(SELLER_INFO.brand, 18, true) / 2, height - headerHeight / 2 - 8, 18, {
        bold: true,
        color: COLOR.gold,
      })
    }

    // Footer
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

  // Title
  drawText(page, 'FACTURE', xLeft, y, 20, { bold: true, color: COLOR.black })
  const titleLineY = y - 8
  drawDivider(page, xLeft, xLeft + 120, titleLineY, COLOR.gold, 3)

  // Invoice meta box (right)
  const metaBoxW = 220
  const metaBoxH = 58
  const metaX = width - margin - metaBoxW
  const metaY = y - 40
  drawBox(page, metaX, metaY, metaBoxW, metaBoxH, { fill: COLOR.darkPanel, border: COLOR.gold, borderWidth: 1 })
  drawText(page, `Facture N° ${params.invoiceNumber}`, metaX + 12, metaY + 36, 11, { bold: true, color: COLOR.white })
  drawText(page, `Date : ${formatDate(params.invoiceDate)}`, metaX + 12, metaY + 18, 10, { color: COLOR.white })

  y = metaY - 18

  // Seller block (left)
  const sellerW = contentWidth - metaBoxW - 18
  const sellerX = xLeft
  const sellerY = metaY
  drawBox(page, sellerX, sellerY, sellerW, metaBoxH, { fill: rgb(0.96, 0.96, 0.96), border: COLOR.lightBorder, borderWidth: 1 })
  drawText(page, SELLER_INFO.brand, sellerX + 12, sellerY + 36, 12, { bold: true, color: COLOR.black })
  drawText(page, SELLER_INFO.addressLine, sellerX + 12, sellerY + 22, 10, { color: COLOR.black })
  drawText(page, `${SELLER_INFO.phone} — ${SELLER_INFO.email}`, sellerX + 12, sellerY + 10, 10, { color: COLOR.black })

  // Legal lines under blocks
  y = sellerY - 18
  ensureSpace(60)
  drawText(page, `SIRET : ${SELLER_INFO.siret}`, xLeft, y, 10, { color: COLOR.grayText })
  y -= 14
  drawText(page, `R.C.S : ${SELLER_INFO.rcs}`, xLeft, y, 10, { color: COLOR.grayText })
  y -= 14
  drawText(page, `Statut : ${SELLER_INFO.legalForm}`, xLeft, y, 10, { color: COLOR.grayText })
  y -= 14
  drawText(page, SELLER_INFO.vat, xLeft, y, 10, { color: COLOR.grayText })
  y -= 20

  // Billing address block
  ensureSpace(110)
  const billing = (params.billingAddress || {}) as BillingAddress
  const billingTitle = 'Adresse de facturation'
  drawText(page, billingTitle, xLeft, y, 12, { bold: true, color: COLOR.black })
  y -= 10
  drawDivider(page, xLeft, xLeft + 180, y, COLOR.gold, 2)
  y -= 12

  const billingLines: string[] = []
  const fullName = [safeText(billing.prenom), safeText(billing.nom)].filter(Boolean).join(' ').trim()
  if (fullName) billingLines.push(fullName)
  const addr = safeText(billing.adresse)
  if (addr) billingLines.push(addr)
  const cityLine = [safeText(billing.codePostal), safeText(billing.ville)].filter(Boolean).join(' ').trim()
  if (cityLine) billingLines.push(cityLine)
  const country = safeText(billing.pays) || 'FR'
  if (country) billingLines.push(country)
  const tel = safeText(billing.telephone)
  if (tel) billingLines.push(`Téléphone : ${tel}`)
  billingLines.push(`Email : ${params.customerEmail}`)

  for (const line of billingLines) {
    const wrapped = wrapText(line, contentWidth, 10, false)
    for (const w of wrapped) {
      ensureSpace(14)
      drawText(page, w, xLeft, y, 10, { color: COLOR.black })
      y -= 14
    }
  }

  y -= 10

  // Items table
  const tableX = xLeft
  const tableW = contentWidth
  const colNameX = tableX + 10
  const colQtyX = tableX + 310
  const colUnitX = tableX + 370
  const colTotalX = tableX + 460
  const rowH = 18

  ensureSpace(60)
  // Table header background
  drawBox(page, tableX, y - rowH + 4, tableW, rowH, { fill: COLOR.black })
  drawText(page, 'Article', colNameX, y - 10, 10, { bold: true, color: COLOR.gold })
  drawText(page, 'Qté', colQtyX, y - 10, 10, { bold: true, color: COLOR.gold })
  drawText(page, 'PU', colUnitX, y - 10, 10, { bold: true, color: COLOR.gold })
  drawText(page, 'Total', colTotalX, y - 10, 10, { bold: true, color: COLOR.gold })
  y -= rowH + 6

  for (const line of params.lines) {
    // Wrap product name to 2 lines max
    const nameWrapped = wrapText((line.name || 'Article').slice(0, 140), colQtyX - colNameX - 10, 10)
    const nameLines = nameWrapped.slice(0, 2)
    const needed = rowH + (nameLines.length - 1) * 12
    ensureSpace(needed + 10)

    // Row separator
    drawDivider(page, tableX, tableX + tableW, y + 6, COLOR.lightBorder, 1)

    drawText(page, nameLines[0] || '', colNameX, y - 8, 10, { color: COLOR.black })
    if (nameLines.length > 1) {
      drawText(page, nameLines[1] || '', colNameX, y - 20, 10, { color: COLOR.black })
    }

    drawText(page, String(line.qty), colQtyX, y - 8, 10, { color: COLOR.black })
    drawText(page, formatMoney(line.unitPrice, currency), colUnitX, y - 8, 10, { color: COLOR.black })
    drawText(page, formatMoney(line.lineTotal, currency), colTotalX, y - 8, 10, { color: COLOR.black })

    y -= needed
  }

  // Closing line under table
  ensureSpace(40)
  drawDivider(page, tableX, tableX + tableW, y + 6, COLOR.lightBorder, 1)
  y -= 22

  // Summary box (right)
  const summaryW = 220
  const summaryX = width - margin - summaryW
  const summaryH = 86 + (typeof params.discountAmount === 'number' && params.discountAmount > 0.005 ? 16 : 0)
  ensureSpace(summaryH + 20)

  drawBox(page, summaryX, y - summaryH, summaryW, summaryH, {
    fill: rgb(0.98, 0.98, 0.98),
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
    const providedKey = request.headers.get('x-internal-key')

    // 1) Autorisation via clé interne (mode "script"/maintenance)
    const internalKeyOk = !!expectedKey && !!providedKey && providedKey === expectedKey

    // 2) Autorisation via session Supabase (admin connecté)
    // Permet à l'UI admin (client) d'appeler l'API sans exposer EMAIL_INTERNAL_KEY.
    if (!internalKeyOk) {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const anonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      }

      const authHeader = request.headers.get('authorization') || ''
      const token = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : ''
      if (!token) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      }

      const authClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      })

      const { data: userData, error: userError } = await authClient.auth.getUser(token)
      const userId = userData?.user?.id
      if (userError || !userId) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      }

      const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })

      const { data: profile, error: profileError } = await serviceClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileError || (profile as any)?.role !== 'admin') {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      }
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

            const lines = await getInvoiceLines({ order })
            const itemsSubtotal = lines.reduce((sum, l) => sum + (l.lineTotal || 0), 0)
            const shippingCost = toNumber((order as any).shipping_cost) ?? 0
            const totalFromOrder = toNumber((order as any).total)
            const total = totalFromOrder ?? (itemsSubtotal + shippingCost)
            const discountAmount = Math.max(0, itemsSubtotal + shippingCost - total)

            try {
              const pdfBytes = await buildInvoicePdfBytes({
                invoiceNumber,
                invoiceDate: createdAt,
                customerEmail,
                billingAddress: ((order as any).billing_address || null) as any,
                lines,
                itemsSubtotal,
                shippingCost,
                discountAmount,
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

