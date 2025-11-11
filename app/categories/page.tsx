import Link from 'next/link'
import { ArrowRight, Factory } from 'lucide-react'

export default function CategoriesPage() {
  const categories = [
    {
      name: 'Bouillettes',
      href: '/categories/bouillettes',
      desc: 'Diamètres 10, 16, 20mm - Le prix ne change pas selon le diamètre',
      features: ['10mm', '16mm', '20mm', 'Arômes variés']
    },
    {
      name: 'Pop-up Duo',
      href: '/categories/popup duo',
      desc: 'Appâts flottants personnalisables',
      features: ['Personnalisable', 'Plusieurs tailles']
    },
    {
      name: 'Équilibrés',
      href: '/categories/equilibres',
      desc: '10mm, 8mm, 16mm, Wafers 12x15mm',
      features: ['10mm', '8mm', '16mm', 'Wafers']
    },
    {
      name: 'Huiles',
      href: '/categories/huiles',
      desc: 'Huiles d\'attraction de qualité',
      features: ['Huiles premium']
    },
    {
      name: 'Farines',
      href: '/categories/farines',
      desc: 'Farines de base pour vos préparations',
      features: ['Qualité supérieure']
    },
    {
      name: 'Bar à Pop-up',
      href: '/bar-popup',
      desc: 'Personnalisez votre pop-up : taille, couleur et arôme',
      features: ['Taille', 'Couleur', 'Arôme', 'Diamètre billes']
    },
  ]

  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">FABRICATION FRANÇAISE</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Nos Catégories</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Découvrez notre gamme complète d'appâts pour la pêche à la carpe
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="block p-8 bg-noir-800/50 border border-noir-700 rounded-xl hover:border-yellow-500 hover:bg-noir-800 transition-all duration-300 group"
            >
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
          ))}
        </div>
      </div>
    </div>
  )
}
