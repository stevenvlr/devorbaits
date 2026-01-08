'use client'

import Link from 'next/link'
import { Factory, Palette, Zap, Droplet } from 'lucide-react'
import { ArrowRight } from 'lucide-react'

export default function PersonnalisablesPage() {
  const sousCategories = [
    {
      name: 'Bar à Pop-up',
      href: '/bar-popup',
      desc: 'Personnalisez votre pop-up : taille, couleur et arôme sur mesure',
      icon: Palette,
      features: ['Taille', 'Couleur', 'Arôme', 'Personnalisation complète']
    },
    {
      name: 'Flash boost',
      href: '/categories/personnalisables/flash-boost',
      desc: 'Boost d\'attraction instantané pour vos appâts',
      icon: Zap,
      features: ['100ml', 'Toutes les gammes', 'Action rapide']
    },
    {
      name: 'Spray plus',
      href: '/categories/personnalisables/spray-plus',
      desc: 'Spray d\'attraction concentré pour renforcer vos appâts',
      icon: Droplet,
      features: ['30ml', 'Toutes les gammes', 'Application facile']
    },
  ]

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4">Les Personnalisables</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Personnalisez et renforcez vos appâts selon vos préférences
          </p>
        </div>

        {/* Sous-catégories */}
        <div className="grid md:grid-cols-3 gap-6">
          {sousCategories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.name}
                href={category.href}
                className="block p-8 bg-noir-800/50 border border-noir-700 rounded-xl hover:border-yellow-500 hover:bg-noir-800 transition-all duration-300 group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
                  <Icon className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-yellow-500 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-400 mb-4">{category.desc}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-noir-700 text-xs rounded-full text-gray-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-yellow-500 group-hover:gap-3 transition-all">
                  <span className="font-medium">Découvrir</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

