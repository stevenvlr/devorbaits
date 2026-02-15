'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Factory, Shield, Award } from 'lucide-react'
import { loadHomepageImage, onHomepageImageUpdate } from '@/lib/homepage-manager'

const DEFAULT_HERO_IMAGE = '/images/accueil-photo.jpg'
const LEGACY_DEFAULT_HERO_IMAGE = '/images/acueil-photo.jpg'

export default function Home() {
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [defaultHeroImage, setDefaultHeroImage] = useState(DEFAULT_HERO_IMAGE)

  useEffect(() => {
    let cancelled = false

    const loadImage = async () => {
      const saved = await loadHomepageImage()
      if (!cancelled) setHeroImage(saved)
    }

    loadImage()
    const unsubscribe = onHomepageImageUpdate(() => {
      // on ignore la Promise ici, React n'en a pas besoin
      void loadImage()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-noir-950 via-noir-900 to-noir-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        
        {/* Image en arrière-plan */}
        <div className="absolute inset-0 z-0">
          {heroImage ? (
            <Image
              src={heroImage}
              alt="Photo d'accueil"
              fill
              sizes="100vw"
              className="object-cover opacity-80"
              priority
              quality={85}
            />
          ) : (
            <Image
              src={defaultHeroImage}
              alt="Photo d'accueil"
              fill
              sizes="100vw"
              className="object-cover opacity-80"
              priority
              quality={85}
              onError={() => {
                // fallback si /images/accueil-photo.jpg n'existe pas
                if (defaultHeroImage !== LEGACY_DEFAULT_HERO_IMAGE) {
                  setDefaultHeroImage(LEGACY_DEFAULT_HERO_IMAGE)
                }
              }}
            />
          )}
        </div>
        
        {/* Overlay sombre pour améliorer la lisibilité du texte */}
        <div className="absolute inset-0 bg-noir-950/60 z-0"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-noir-900/50 backdrop-blur-sm border border-noir-700 rounded-full mb-8">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
           Bouillettes Artisanales Premium pour la Pêche à la Carpe
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Découvrez notre sélection de gammes, pop-ups et bar à pop-up artisanaux, 
            fabriqués en France avec passion et expertise.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Link 
    href="/categories"
    className="px-8 py-4 bg-white text-noir-950 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 group"
  >
    Découvrir nos produits
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </Link>
  <Link 
    href="/categories/bouillettes"
    className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-noir-950 transition-all duration-300"
  >
    Gammes Artisanales
  </Link>
</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-noir-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-noir-800/50 rounded-xl border border-noir-700 hover:border-yellow-500/50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
                <Factory className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-xl font-bold mb-3">Fabrication Artisanale Française</h1>
              <p className="text-gray-400">
              Toutes nos bouillettes sont fabriquées artisanalement en France avec des ingrédients de qualité supérieure sélectionnés à la main.
              </p>
            </div>

            <div className="text-center p-8 bg-noir-800/50 rounded-xl border border-noir-700 hover:border-yellow-500/50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
                <Shield className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold mb-3">Qualité Premium</h2>
              <p className="text-gray-400">
                Sélection rigoureuse des matières premières pour des résultats exceptionnels.
              </p>
            </div>

            <div className="text-center p-8 bg-noir-800/50 rounded-xl border border-noir-700 hover:border-yellow-500/50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Expertise Artisanale</h3>
              <p className="text-gray-400">
                Des années d'expérience dans la fabrication d'appâts pour la pêche à la carpe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20 bg-noir-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Nos Catégories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Gammes', href: '/categories/bouillettes', desc: 'Bouillettes artisanales, équilibrées, boosters, huiles, farines...' },
              { name: 'Pop-up Duo', href: '/categories/popups', desc: 'Appâts flottants personnalisables' },
              { name: 'Huiles et liquides', href: '/categories/huiles', desc: 'Huiles d\'attraction' },
              { name: 'Bar à Pop-up', href: '/bar-popup', desc: 'Personnalisation sur mesure' },
              { name: 'Les Personnalisables', href: '/categories/personnalisables', desc: 'Flash boost, Spray plus et plus' },
              { name: "L'amicale des pêcheurs au blanc", href: '/categories/amicale-blanc', desc: 'Point de retrait local' },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="block p-6 bg-noir-800/50 border border-noir-700 rounded-xl hover:border-yellow-500 hover:bg-noir-800 transition-all duration-300 group"
              >
                <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-500 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-400 text-sm">{category.desc}</p>
                <ArrowRight className="w-5 h-5 mt-4 text-gray-500 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}