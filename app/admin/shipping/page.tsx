/**
 * Page admin Expédition : commandes status=preparing + shipping_drafts.
 * Server Component : charge les données et affiche ShippingBoard.
 */
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import ShippingBoard from './shipping-board'
import type { InitialRow, ShippingDraftForAdmin } from './types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AdminShippingPage() {
  const supabase = createSupabaseAdmin()

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, reference, created_at, user_id')
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

  const initialRows: InitialRow[] = orderList.map((order: { id: string; reference: string; created_at: string; user_id?: string | null }) => {
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
      },
      draft: draftByOrderId[order.id] ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-noir-950 py-12 px-4">
      <h1 className="text-2xl font-bold text-white mb-4">Admin Expédition</h1>
      <p className="text-gray-400 mb-6">Commandes en préparation et brouillons d’expédition.</p>
      <ShippingBoard initialRows={initialRows} />
    </div>
  )
}
