"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur pour le débogage
    console.error(error);
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/error.tsx:12',message:'Error boundary triggered',data:{errorMessage:error?.message,errorStack:error?.stack,errorDigest:error?.digest},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,E'})}).catch(()=>{});
    }
    // #endregion
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Une erreur s'est produite
        </h1>
        <p className="text-gray-600 mb-6">
          Désolé, une erreur inattendue s'est produite.
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            Code d'erreur: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
