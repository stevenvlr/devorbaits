'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, RotateCcw, ArrowLeft, Package } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'

type PaymentIntent = {
  id: string
  created_at: string
  provider: string
  paypal_order_id: string
  status: string
  order_id: string | null
  payload: {
    reference?: string
    total?: number
    items?: unknown[]
    customerEmail?: string
    retraitMode?: string
  }
  last_error: string | null
  processed_at: string | null
}

export default function AdminPaymentsOrphansPage() {
  const [intents, setIntents] = useState<PaymentIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [replayingId, setReplayingId] = useState<string | null>(null)

  const loadOrphans = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: sessionData } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null as { access_token?: string } | null } }
      const token = sessionData?.session?.access_token || null

      const res = await fetch('/api/admin/payments/orphans', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Erreur ${res.status}`)
      }
      const j = await res.json()
      setIntents(j.intents ?? [])
    } catch (e) {
      console.error(e)
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Erreur chargement' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrphans()
  }, [])

  const handleReplay = async (intent: PaymentIntent) => {
    setReplayingId(intent.id)
    setMessage(null)
    try {
      const supabase = getSupabaseClient()
      const { data: sessionData } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null as { access_token?: string } | null } }
      const token = sessionData?.session?.access_token || null

      const res = await fetch('/api/admin/payments/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ intentId: intent.id }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(j?.error || `Erreur ${res.status}`)
      }
      if (j.ok) {
        setMessage({
          type: 'success',
          text: j.orderId
            ? `Commande créée : ${j.reference ?? j.orderId}`
            : (j.message || 'Rejeu effectué'),
        })
        await loadOrphans()
      } else {
        throw new Error(j?.error || 'Erreur inconnue')
      }
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Erreur lors du rejeu',
      })
    } finally {
      setReplayingId(null)
    }
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('fr-FR')
    } catch {
      return s
    }
  }

  return (
    <div className="min-h-screen bg-noir-950 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-noir-800 hover:bg-noir-700 text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-amber-500" />
            Paiements orphelins
          </h1>
        </div>

        <p className="text-gray-400 mb-4">
          Intentions PayPal sans commande (captured sans order_id) ou en échec. Rejouer crée la commande depuis le payload (idempotent).
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={loadOrphans}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-noir-700 hover:bg-noir-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Chargement…</div>
        ) : intents.length === 0 ? (
          <div className="rounded-xl border border-noir-700 bg-noir-900/50 p-8 text-center text-gray-400">
            Aucun paiement orphelin.
          </div>
        ) : (
          <div className="space-y-4">
            {intents.map((intent) => (
              <div
                key={intent.id}
                className="rounded-xl border border-noir-700 bg-noir-900/50 p-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-amber-400">{intent.paypal_order_id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        intent.status === 'failed'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {intent.status}
                    </span>
                    {intent.order_id && (
                      <span className="text-xs text-gray-500">order_id: {intent.order_id}</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-400">
                    Créé : {formatDate(intent.created_at)}
                    {intent.payload?.reference && (
                      <> · Réf: <span className="text-gray-300">{intent.payload.reference}</span></>
                    )}
                    {intent.payload?.customerEmail && (
                      <> · {intent.payload.customerEmail}</>
                    )}
                    {intent.payload?.total != null && (
                      <> · {Number(intent.payload.total).toFixed(2)} €</>
                    )}
                  </div>
                  {intent.last_error && (
                    <div className="mt-2 text-sm text-red-400">{intent.last_error}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!intent.order_id && (
                    <button
                      type="button"
                      onClick={() => handleReplay(intent)}
                      disabled={replayingId === intent.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
                    >
                      {replayingId === intent.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Rejouer création commande
                    </button>
                  )}
                  {intent.order_id && (
                    <Link
                      href={`/admin/orders`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-noir-600 hover:bg-noir-500"
                    >
                      <Package className="w-4 h-4" />
                      Voir commandes
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
