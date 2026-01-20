import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// IMPORTANT: mets ici TON email de test (hardcodé volontairement)
const TEST_EMAIL_TO = ''

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const providedKey = url.searchParams.get('key')

    if (!providedKey || providedKey !== process.env.TEST_EMAIL_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
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

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [TEST_EMAIL_TO],
        subject: 'Test Resend (Next.js API Route)',
        text: 'Email de test envoyé depuis /api/test-email',
        html: '<p>Email de test envoyé depuis <code>/api/test-email</code>.</p>',
      }),
    })

    if (!resendResponse.ok) {
      const raw = await resendResponse.text()
      let parsed: any = raw
      try {
        parsed = raw ? JSON.parse(raw) : raw
      } catch {
        // ignore
      }

      return NextResponse.json(
        { ok: false, error: parsed || `Resend error (${resendResponse.status})` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
