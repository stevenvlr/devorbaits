'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface MoneticoWidgetProps {
  action: string
  fields: Record<string, string>
  onClose: () => void
  onSuccess?: (reference: string) => void
  onError?: (error: string) => void
}

/**
 * Composant iframe/widget pour Monetico
 * Affiche le formulaire de paiement Monetico dans une iframe sécurisée
 */
export default function MoneticoWidget({
  action,
  fields,
  onClose,
  onSuccess,
  onError,
}: MoneticoWidgetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Créer un formulaire caché et le soumettre vers l'iframe
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = action
    form.target = 'monetico-iframe'
    form.style.display = 'none'

    // Ajouter tous les champs
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value)
      form.appendChild(input)
    })

    document.body.appendChild(form)

    // Attendre que l'iframe soit chargée
    const iframe = iframeRef.current
    if (iframe) {
      let formRemoved = false
      
      const handleLoad = () => {
        setLoading(false)
        console.log('[MONETICO WIDGET] Iframe chargée')
        
        // Vérifier si l'iframe contient une redirection vers notre URL de retour
        // Monetico redirige vers url_retour_ok ou url_retour_err après paiement
        try {
          // Attendre un peu pour que Monetico charge
          setTimeout(() => {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
              if (iframeDoc) {
                const currentUrl = iframeDoc.location?.href || iframe.contentWindow?.location?.href
                if (currentUrl && (currentUrl.includes('/payment/success') || currentUrl.includes('/api/monetico/retour'))) {
                  console.log('[MONETICO WIDGET] Redirection détectée:', currentUrl)
                  // Extraire la référence depuis l'URL
                  const urlParams = new URLSearchParams(currentUrl.split('?')[1] || '')
                  const reference = urlParams.get('reference')
                  if (reference && onSuccess) {
                    onSuccess(reference)
                  }
                }
              }
            } catch (e) {
              // Cross-origin, on ne peut pas accéder au contenu
              // On comptera sur les messages postMessage ou la redirection parent
              console.log('[MONETICO WIDGET] Cross-origin, attente de redirection parent')
            }
          }, 2000)
        } catch (e) {
          // Ignorer les erreurs cross-origin
        }
      }

      const handleError = () => {
        setLoading(false)
        setError('Erreur lors du chargement du formulaire de paiement')
        console.error('[MONETICO WIDGET] Erreur chargement iframe')
        if (!formRemoved && form.parentNode) {
          document.body.removeChild(form)
          formRemoved = true
        }
      }

      iframe.addEventListener('load', handleLoad)
      iframe.addEventListener('error', handleError)

      // Soumettre le formulaire
      form.submit()

      // Nettoyer après soumission
      setTimeout(() => {
        if (!formRemoved && form.parentNode) {
          document.body.removeChild(form)
          formRemoved = true
        }
      }, 1000)

      return () => {
        iframe.removeEventListener('load', handleLoad)
        iframe.removeEventListener('error', handleError)
        if (!formRemoved && form.parentNode) {
          document.body.removeChild(form)
        }
      }
    }
  }, [action, fields, onSuccess])

  // Écouter les messages depuis l'iframe et les redirections
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Vérifier l'origine pour la sécurité
      const allowedOrigins = ['creditmutuel.fr', 'monetico.fr', 'paiement.monetico.fr']
      const isAllowedOrigin = allowedOrigins.some(origin => event.origin.includes(origin))
      
      if (!isAllowedOrigin && event.origin !== window.location.origin) {
        return
      }

      console.log('[MONETICO WIDGET] Message reçu:', event.data, 'depuis:', event.origin)

      if (event.data.type === 'monetico-success' || event.data.success) {
        const reference = event.data.reference || event.data.moneticoReference
        if (onSuccess && reference) {
          console.log('[MONETICO WIDGET] ✅ Paiement réussi, référence:', reference)
          onSuccess(reference)
        }
      } else if (event.data.type === 'monetico-error' || event.data.error) {
        const errorMsg = event.data.error || 'Erreur de paiement'
        setError(errorMsg)
        if (onError) {
          onError(errorMsg)
        }
      }
    }

    // Écouter les changements d'URL dans la fenêtre parent (si Monetico redirige)
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash.includes('reference=')) {
        const params = new URLSearchParams(hash.substring(1))
        const reference = params.get('reference')
        const codeRetour = params.get('code-retour')
        if (reference && (codeRetour === 'paiement' || codeRetour === 'payetest')) {
          console.log('[MONETICO WIDGET] ✅ Paiement réussi via hash, référence:', reference)
          if (onSuccess) {
            onSuccess(reference)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [onSuccess, onError])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[90vh] bg-noir-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-noir-800 border-b border-noir-700">
          <h2 className="text-xl font-semibold text-white">Paiement sécurisé Monetico</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-noir-700 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-noir-900/80 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-300">Chargement du formulaire de paiement...</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-noir-900/80 z-10">
            <div className="text-center p-6 bg-red-500/10 border border-red-500/50 rounded-lg max-w-md">
              <p className="text-red-400 font-semibold mb-2">Erreur</p>
              <p className="text-gray-300 text-sm">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Iframe */}
        <div className="w-full h-full relative">
          <iframe
            ref={iframeRef}
            name="monetico-iframe"
            src="about:blank"
            className="w-full h-full border-0"
            title="Formulaire de paiement Monetico"
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
            allow="payment"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-noir-800 border-t border-noir-700 text-center">
          <p className="text-xs text-gray-400">
            Paiement sécurisé par{' '}
            <span className="text-yellow-500 font-semibold">Monetico / Crédit Mutuel</span>
          </p>
        </div>
      </div>
    </div>
  )
}
