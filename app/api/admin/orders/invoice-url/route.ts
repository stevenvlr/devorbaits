import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

/**
 * Génère (ou régénère) un lien de téléchargement de facture (signed URL)
 * pour l'admin depuis l'UI, sans exposer la Service Role Key.
 */
export async function POST(request: NextRequest) {
  try {
    const expectedKey = process.env.EMAIL_INTERNAL_KEY
    const providedKey = request.headers.get('x-internal-key')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // 1) Autorisation via clé interne (mode "script"/maintenance)
    const internalKeyOk = !!expectedKey && !!providedKey && providedKey === expectedKey

    // 2) Autorisation via session Supabase (admin connecté)
    if (!internalKeyOk) {
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
    } else {
      // internal key ok, but still need Supabase envs
      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
          { ok: false, error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant' },
          { status: 500 }
        )
      }
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant' },
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
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Champ "orderId" obligatoire' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, invoice_number, invoice_url')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      const msg = orderError?.message || 'Commande introuvable'
      return NextResponse.json({ ok: false, error: msg }, { status: 404 })
    }

    const invoiceNumber =
      typeof (order as any).invoice_number === 'string' && (order as any).invoice_number.trim() !== ''
        ? (order as any).invoice_number.trim()
        : null

    // Fallback si on n'a pas invoice_number (ex: anciennes factures)
    const fallbackUrl =
      typeof (order as any).invoice_url === 'string' && (order as any).invoice_url.trim() !== ''
        ? (order as any).invoice_url.trim()
        : null

    if (!invoiceNumber) {
      if (!fallbackUrl) {
        return NextResponse.json({ ok: false, error: 'Facture non générée' }, { status: 404 })
      }
      return NextResponse.json({ ok: true, url: fallbackUrl, invoiceNumber: null })
    }

    const filePath = `invoices/${invoiceNumber}.pdf`
    const signed = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 jours

    if (signed.error) {
      // fallback éventuel sur URL stockée
      if (fallbackUrl) {
        return NextResponse.json({ ok: true, url: fallbackUrl, invoiceNumber })
      }
      return NextResponse.json(
        { ok: false, error: signed.error.message || 'Erreur signed URL' },
        { status: 500 }
      )
    }

    const url = signed.data?.signedUrl
    if (!url) {
      if (fallbackUrl) {
        return NextResponse.json({ ok: true, url: fallbackUrl, invoiceNumber })
      }
      return NextResponse.json({ ok: false, error: 'Signed URL introuvable' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url, invoiceNumber })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

