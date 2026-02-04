'use client'

/**
 * Tableau admin expédition : une card par commande, offres transporteurs, création d’étiquettes.
 * Utilise des Server Actions (aucun secret côté client).
 * TODO: intégration Boxtal plus tard.
 */
import { useState, useTransition } from 'react'
import { Truck, MapPin, Package } from 'lucide-react'
import type { InitialRow, ShippingDraftForAdmin, OrderRowForShipping } from './types'
import { getOffersAction, createLabelAction } from './actions'

const FALLBACK = '—'

type Offer = { offer_code: string; label: string; price?: number }

const RELAY_PICKUP_ERROR = 'Relay requires pickup_point'

export default function ShippingBoard({ initialRows }: { initialRows: InitialRow[] }) {
  const [offersByOrderId, setOffersByOrderId] = useState<Record<string, { deliveryType: string; offers: Offer[] }>>({})
  const [selectedOfferByOrderId, setSelectedOfferByOrderId] = useState<Record<string, string>>({})
  const [loadingOffers, setLoadingOffers] = useState<Record<string, boolean>>({})
  const [loadingLabel, setLoadingLabel] = useState<Record<string, boolean>>({})
  const [messageByOrderId, setMessageByOrderId] = useState<Record<string, { type: 'success' | 'error'; text: string } | undefined>>({})
  const [pickupPointMissingByOrderId, setPickupPointMissingByOrderId] = useState<Record<string, boolean>>({})
  const [, startTransition] = useTransition()

  function safe(value: unknown): string {
    if (value == null) return FALLBACK
    if (typeof value === 'string') return value.trim() || FALLBACK
    return String(value)
  }

  const fetchOffers = (orderId: string) => {
    setLoadingOffers((prev) => ({ ...prev, [orderId]: true }))
    setMessageByOrderId((prev) => ({ ...prev, [orderId]: undefined }))
    setPickupPointMissingByOrderId((prev) => ({ ...prev, [orderId]: false }))
    startTransition(async () => {
      try {
        const result = await getOffersAction(orderId)
        if (result.ok) {
          setOffersByOrderId((prev) => ({
            ...prev,
            [orderId]: {
              deliveryType: result.deliveryType,
              offers: result.offers,
            },
          }))
          if (!result.offers.length) {
            setSelectedOfferByOrderId((prev) => ({ ...prev, [orderId]: '' }))
          }
        } else {
          const isRelayPickupError = result.error === RELAY_PICKUP_ERROR || result.error.toLowerCase().includes('pickup_point')
          setPickupPointMissingByOrderId((prev) => ({ ...prev, [orderId]: isRelayPickupError }))
          setMessageByOrderId((prev) => ({
            ...prev,
            [orderId]: { type: 'error', text: result.error },
          }))
        }
      } catch (e) {
        setMessageByOrderId((prev) => ({
          ...prev,
          [orderId]: { type: 'error', text: e instanceof Error ? e.message : 'Erreur inattendue' },
        }))
      } finally {
        setLoadingOffers((prev) => ({ ...prev, [orderId]: false }))
      }
    })
  }

  const createLabel = (orderId: string) => {
    const offerCode = selectedOfferByOrderId[orderId]
    if (!offerCode) {
      setMessageByOrderId((prev) => ({
        ...prev,
        [orderId]: { type: 'error', text: 'Choisissez une offre avant de créer l’étiquette.' },
      }))
      return
    }
    setLoadingLabel((prev) => ({ ...prev, [orderId]: true }))
    setMessageByOrderId((prev) => ({ ...prev, [orderId]: undefined }))
    setPickupPointMissingByOrderId((prev) => ({ ...prev, [orderId]: false }))
    startTransition(async () => {
      try {
        const result = await createLabelAction(orderId, offerCode)
        if (result.ok) {
          const msg = result.trackingNumber
            ? `Étiquette créée (mock). Suivi: ${result.trackingNumber}`
            : result.warning
              ? `${result.warning}${result.dbError ? ` — ${result.dbError}` : ''}`
              : 'Étiquette créée (mock).'
          setMessageByOrderId((prev) => ({
            ...prev,
            [orderId]: { type: 'success', text: msg },
          }))
        } else {
          const isRelayPickupError = result.error === RELAY_PICKUP_ERROR || result.error.toLowerCase().includes('pickup_point')
          setPickupPointMissingByOrderId((prev) => ({ ...prev, [orderId]: isRelayPickupError }))
          setMessageByOrderId((prev) => ({
            ...prev,
            [orderId]: { type: 'error', text: result.error },
          }))
        }
      } catch (e) {
        setMessageByOrderId((prev) => ({
          ...prev,
          [orderId]: { type: 'error', text: e instanceof Error ? e.message : 'Erreur inattendue' },
        }))
      } finally {
        setLoadingLabel((prev) => ({ ...prev, [orderId]: false }))
      }
    })
  }

  return (
    <div className="space-y-6">
      {initialRows.length === 0 ? (
        <p className="text-gray-400">Aucune commande en préparation.</p>
      ) : (
        initialRows.map(({ order, draft }) => (
          <OrderCard
            key={order.id}
            order={order}
            draft={draft}
            safe={safe}
            offers={offersByOrderId[order.id]}
            selectedOfferCode={selectedOfferByOrderId[order.id]}
            onSelectOffer={(code) =>
              setSelectedOfferByOrderId((prev) => ({ ...prev, [order.id]: code }))
            }
            loadingOffers={loadingOffers[order.id]}
            loadingLabel={loadingLabel[order.id]}
            message={messageByOrderId[order.id]}
            pickupPointMissing={pickupPointMissingByOrderId[order.id]}
            onFetchOffers={() => fetchOffers(order.id)}
            onCreateLabel={() => createLabel(order.id)}
          />
        ))
      )}
    </div>
  )
}

function OrderCard({
  order,
  draft,
  safe,
  offers,
  selectedOfferCode,
  onSelectOffer,
  loadingOffers,
  loadingLabel,
  message,
  pickupPointMissing,
  onFetchOffers,
  onCreateLabel,
}: {
  order: OrderRowForShipping
  draft: ShippingDraftForAdmin | null
  safe: (v: unknown) => string
  offers?: { deliveryType: string; offers: Offer[] }
  selectedOfferCode?: string
  onSelectOffer: (code: string) => void
  loadingOffers: boolean
  loadingLabel: boolean
  message?: { type: 'success' | 'error'; text: string }
  pickupPointMissing?: boolean
  onFetchOffers: () => void
  onCreateLabel: () => void
}) {
  const recipient = draft?.recipient
  const deliveryType = draft?.delivery_type ?? ''
  const pickupPoint = draft?.pickup_point

  return (
    <div className="bg-noir-800/50 border border-noir-700 rounded-lg p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            Commande #{safe(order.reference)} <span className="text-gray-400 font-normal">({safe(order.id)})</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Date : {order.created_at ? new Date(order.created_at).toLocaleString('fr-FR') : FALLBACK}
          </p>
          <p className="text-sm text-gray-400">
            Client : {safe(order.user_name || order.user_email) || FALLBACK}
            {order.user_email ? ` (${order.user_email})` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <div className="bg-noir-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Destinataire</span>
          </div>
          <p className="text-white">{safe(recipient?.full_name) || FALLBACK}</p>
          <p className="text-sm text-gray-400">{safe(recipient?.email) || FALLBACK}</p>
          <p className="text-sm text-gray-400">{safe(recipient?.phone) || FALLBACK}</p>
          {(recipient?.address1 || recipient?.zip || recipient?.city) && (
            <p className="text-sm text-gray-300 mt-1">
              {[recipient.address1, recipient.zip, recipient.city].filter(Boolean).join(', ') || FALLBACK}
            </p>
          )}
        </div>
        <div className="bg-noir-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Truck className="w-4 h-4" />
            <span className="text-sm font-medium">Livraison</span>
          </div>
          <p className="text-white">Type : {deliveryType || FALLBACK}</p>
          {deliveryType === 'relay' && pickupPoint != null && (
            <pre className="mt-2 text-xs text-gray-300 bg-noir-800 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(pickupPoint, null, 2)}
            </pre>
          )}
          {deliveryType === 'relay' && pickupPoint == null && (
            <p className="text-amber-500 text-sm mt-1">Point relais manquant (obligatoire pour relay).</p>
          )}
          {pickupPointMissing && (
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded bg-red-500/20 text-red-400 border border-red-500/40">
              PICKUP_POINT MANQUANT
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-noir-700 pt-4">
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <Package className="w-4 h-4" />
          <span className="text-sm font-medium">Transporteurs</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            type="button"
            onClick={onFetchOffers}
            disabled={loadingOffers}
            className="px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 disabled:opacity-50 text-sm font-medium"
          >
            {loadingOffers ? 'Chargement…' : 'Voir transporteurs'}
          </button>
        </div>
        {offers && offers.offers.length > 0 && (
          <div className="space-y-2 mb-4">
            {offers.offers.map((o) => (
              <label key={o.offer_code} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`offer-${order.id}`}
                  value={o.offer_code}
                  checked={selectedOfferCode === o.offer_code}
                  onChange={() => onSelectOffer(o.offer_code)}
                  className="text-yellow-500"
                />
                <span className="text-white">{o.label}</span>
                {o.price != null && (
                  <span className="text-gray-400 text-sm">{o.price.toFixed(2)} €</span>
                )}
              </label>
            ))}
            <button
              type="button"
              onClick={onCreateLabel}
              disabled={loadingLabel || !selectedOfferCode}
              className="mt-2 px-3 py-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 disabled:opacity-50 text-sm font-medium"
            >
              {loadingLabel ? 'Création…' : 'Créer étiquette'}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-500'
              : 'bg-red-500/10 border border-red-500/30 text-red-500'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
