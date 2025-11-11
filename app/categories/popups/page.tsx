'use client'

import { useState } from 'react'
import { ShoppingCart, Factory } from 'lucide-react'
import Link from 'next/link'
import { AROMES, CONDITIONNEMENTS } from '@/lib/constants'

export default function PopupsPage() {
  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Pop-up Duo </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Appâts flottants personnalisables pour une présentation optimale.
          </p>
          <Link
            href="/bar-popup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-500 text-noir-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Personnaliser votre Pop-up
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>

        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">
            Utilisez notre Bar à Pop-up pour créer des pop-ups personnalisés selon vos préférences.
          </p>
        </div>
      </div>
    </div>
  )
}
