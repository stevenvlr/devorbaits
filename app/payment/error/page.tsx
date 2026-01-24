'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'
import { parseMoneticoReturn } from '@/lib/monetico'

function PaymentErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorCode, setErrorCode] = useState<string>('')
  const [reference, setReference] = useState<string>('')

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const returnData = parseMoneticoReturn(params)
    setErrorCode(returnData.codeRetour || '')
    const moneticoReference = returnData.reference || ''
    const pendingOrderKey = `pending-order-${moneticoReference}`
    const pendingOrderData = localStorage.getItem(pendingOrderKey)
    if (pendingOrderData) {
      try {
        const pendingOrder = JSON.parse(pendingOrderData)
        setReference(pendingOrder?.reference || moneticoReference)
      } catch {
        setReference(moneticoReference)
      }
    } else {
      setReference(moneticoReference)
    }
  }, [searchParams])

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      'annulation': 'Le paiement a été annulé',
      'refus': 'Le paiement a été refusé',
      'erreur': 'Une erreur est survenue lors du paiement',
    }
    return messages[code] || 'Le paiement n\'a pas pu être effectué'
  }

  return (
    <div className="min-h-screen bg-noir-950 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-noir-800/50 border border-red-500/50 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Paiement échoué</h1>
            <p className="text-gray-400">
              {errorCode ? getErrorMessage(errorCode) : 'Une erreur est survenue lors du paiement'}
            </p>
          </div>

          {reference && (
            <div className="bg-noir-900/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">
                Référence : <span className="text-white font-semibold">{reference}</span>
              </p>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-300">
              Votre commande n'a pas été validée. Aucun montant n'a été débité.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/checkout"
              className="px-6 py-3 bg-yellow-500 text-noir-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Réessayer le paiement
            </Link>
            <Link
              href="/cart"
              className="px-6 py-3 bg-noir-700 text-white font-semibold rounded-lg hover:bg-noir-600 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Retour au panier
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-noir-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  )
}
