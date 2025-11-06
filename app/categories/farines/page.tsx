'use client'

import { Factory } from 'lucide-react'

export default function FarinesPage() {
  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Farines</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Farines de base de qualité pour préparer vos propres appâts.
          </p>
        </div>

        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Page en construction...</p>
        </div>
      </div>
    </div>
  )
}
