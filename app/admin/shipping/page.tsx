/**
 * Page admin Expédition : commandes status=preparing + shipping_drafts.
 * Server Component : charge les données et affiche ShippingBoard.
 */
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import ShippingBoard from './shipping-board'
import type { InitialRow, ShippingDraftForAdmin } from './types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default async function AdminShippingPage() {
  const supabase = createSupabaseAdmin()

  // ——— DEBUG temporaire : diagnostic relay / pickup_point ———
  const { count: totalPreparing } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'preparing')

  const { count: relayPreparing } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'preparing')
    .eq('delivery_type', 'relay')

  const { count: pickupPointPreparing } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'preparing')
    .not('pickup_point', 'is', null)

  const { data: relayAnyStatus } = await supabase
    .from('orders')
    .select('id, status, created_at, delivery_type, pickup_point')
    .eq('delivery_type', 'relay')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: pickupPointAnyStatus } = await supabase
    .from('orders')
    .select('id, status, created_at, delivery_type')
    .not('pickup_point', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  const debug = {
    totalPreparing: totalPreparing ?? null,
    relayPreparing: relayPreparing ?? null,
    pickupPointPreparing: pickupPointPreparing ?? null,
    relayAnyStatus: relayAnyStatus ?? [],
    pickupPointAnyStatus: pickupPointAnyStatus ?? [],
  }
  // ——— fin DEBUG ———

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, reference, created_at, user_id, delivery_type, pickup_point')
    .eq('status', 'preparing')
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('[admin/shipping] Erreur orders', ordersError.message)
    return (
      <div className="min-h-screen bg-noir-950 py-12 px-4">
        <p className="text-red-400">Erreur chargement commandes: {ordersError.message}</p>
      </div>
    )
  }

  const orderList = orders ?? []
  const orderIds = orderList.map((o: { id: string }) => o.id)
  if (orderIds.length === 0) {
    return (
      <div className="min-h-screen bg-noir-950 py-12 px-4">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Expédition</h1>
        <p className="text-gray-400">Aucune commande en préparation.</p>
        <DebugBlock debug={debug} />
        <ShippingBoard initialRows={[]} />
      </div>
    )
  }

  const { data: drafts, error: draftsError } = await (supabase as any)
    .from('shipping_drafts')
    .select('order_id, status, total_weight_g, recipient, parcels, country_code, delivery_type, pickup_point')
    .in('order_id', orderIds)

  if (draftsError) {
    console.error('[admin/shipping] Erreur shipping_drafts', draftsError.message)
  }
  const draftList = drafts ?? []
  const draftByOrderId: Record<string, ShippingDraftForAdmin> = {}
  for (const d of draftList) {
    draftByOrderId[d.order_id] = d as ShippingDraftForAdmin
  }

  const userIds = Array.from(new Set(orderList.map((o: { user_id?: string | null }) => o.user_id).filter(Boolean))) as string[]
  let profiles: Record<string, { email?: string; nom?: string; prenom?: string }> = {}
  if (userIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, email, nom, prenom')
      .in('id', userIds)
    if (profileRows) {
      for (const p of profileRows) {
        profiles[p.id] = {
          email: p.email ?? undefined,
          nom: p.nom ?? undefined,
          prenom: p.prenom ?? undefined,
        }
      }
    }
  }

  const initialRows: InitialRow[] = orderList.map((order: { id: string; reference: string; created_at: string; user_id?: string | null; delivery_type?: string | null; pickup_point?: unknown }) => {
    const profile = order.user_id ? profiles[order.user_id] : undefined
    const user_name = profile?.nom || profile?.prenom
      ? `${profile.nom ?? ''} ${profile.prenom ?? ''}`.trim()
      : undefined
    return {
      order: {
        id: order.id,
        reference: order.reference,
        created_at: order.created_at,
        user_email: profile?.email ?? null,
        user_name: user_name ?? null,
        delivery_type: order.delivery_type ?? null,
        pickup_point: order.pickup_point ?? null,
      },
      draft: draftByOrderId[order.id] ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-noir-950 py-12 px-4">
      <h1 className="text-2xl font-bold text-white mb-4">Admin Expédition</h1>
      <p className="text-gray-400 mb-6">Commandes en préparation et brouillons d’expédition.</p>
      <DebugBlock debug={debug} />
      <ShippingBoard initialRows={initialRows} />
    </div>
  )
}

type DebugData = {
  totalPreparing: number | null
  relayPreparing: number | null
  pickupPointPreparing: number | null
  relayAnyStatus: { id: string; status: string | null; created_at: string | null; delivery_type: string | null; pickup_point: unknown }[]
  pickupPointAnyStatus: { id: string; status: string | null; created_at: string | null; delivery_type: string | null }[]
}

function DebugBlock({ debug }: { debug: DebugData }) {
  return (
    <details className="mb-6 rounded-lg border border-amber-600/50 bg-amber-950/30 text-amber-100">
      <summary className="cursor-pointer select-none p-3 font-semibold">DEBUG — diagnostic relay / pickup_point</summary>
      <div className="border-t border-amber-600/30 p-4 font-mono text-sm space-y-4">
        <div>
          <strong>A) totalPreparing</strong> (status=preparing): {debug.totalPreparing ?? '—'}
        </div>
        <div>
          <strong>B) relayPreparing</strong> (status=preparing ET delivery_type=relay): {debug.relayPreparing ?? '—'}
        </div>
        <div>
          <strong>C) pickupPointPreparing</strong> (status=preparing ET pickup_point non null): {debug.pickupPointPreparing ?? '—'}
        </div>
        <div>
          <strong>D) relayAnyStatus</strong> (10 dernières orders delivery_type=relay):
          <pre className="mt-1 overflow-x-auto rounded bg-noir-900/80 p-2 text-xs">
            {JSON.stringify(debug.relayAnyStatus, null, 2)}
          </pre>
        </div>
        <div>
          <strong>E) pickupPointAnyStatus</strong> (10 dernières orders pickup_point non null):
          <pre className="mt-1 overflow-x-auto rounded bg-noir-900/80 p-2 text-xs">
            {JSON.stringify(debug.pickupPointAnyStatus, null, 2)}
          </pre>
        </div>
      </div>
    </details>
  )
}
