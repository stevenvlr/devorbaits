'use client'

import Link from 'next/link'
import { Factory, MapPin, Plus, Calendar, Tag, ImageIcon, BarChart3, Package, Ticket, ShoppingCart, AlertCircle, Zap, Truck, Scale } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-noir-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6">
            <Factory className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500">ESPACE ADMINISTRATION</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Gestion du Site</h1>
          <p className="text-gray-400">
            Accédez aux différentes sections de gestion
          </p>
        </div>

        {/* Sections de gestion */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/products"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <Plus className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Gérer les Produits</h2>
                <p className="text-sm text-gray-400">Ajouter, modifier ou supprimer des produits</p>
              </div>
            </div>
            <p className="text-gray-300">
              Gérez tous vos produits : bouillettes, équilibrées, huiles, farines, etc. 
              Ajoutez des photos, des descriptions et gérez les variantes.
            </p>
          </Link>

          <Link
            href="/admin/amicale-blanc"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <MapPin className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Gérer L'amicale des pêcheurs au blanc</h2>
                <p className="text-sm text-gray-400">Produits disponibles pour retrait sur place</p>
              </div>
            </div>
            <p className="text-gray-300">
              Configurez quels produits sont disponibles pour le retrait à l'étang 
              de l'amicale des pêcheurs au blanc.
            </p>
          </Link>

          <Link
            href="/admin/appointments"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Gérer les Rendez-vous</h2>
                <p className="text-sm text-gray-400">Agenda Wavignies (Mardi et Jeudi)</p>
              </div>
            </div>
            <p className="text-gray-300">
              Consultez et gérez tous les rendez-vous de retrait à Wavignies. 
              Créneaux : 15h-16h, 17h-18h, 18h-19h.
            </p>
          </Link>

          <Link
            href="/admin/gammes"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <Tag className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Gérer les Gammes d'appât</h2>
                <p className="text-sm text-gray-400">Ajouter ou supprimer des gammes d'appât</p>
              </div>
            </div>
            <p className="text-gray-300">
              Créez de nouvelles gammes d'appât (ex: Krill Calamar, Méga Tutti). 
              Les gammes d'appât permettent d'organiser vos produits.
            </p>
          </Link>

          <Link
            href="/admin/homepage"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-pink-500/10 rounded-lg flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                <ImageIcon className="w-8 h-8 text-pink-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Photo d'Accueil</h2>
                <p className="text-sm text-gray-400">Modifier la photo de la page d'accueil</p>
              </div>
            </div>
            <p className="text-gray-300">
              Changez la photo d'accueil qui apparaît en arrière-plan de la section hero 
              de votre page d'accueil.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <ShoppingCart className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Gérer les Commandes</h2>
                <p className="text-sm text-gray-400">Suivi et gestion des commandes</p>
              </div>
            </div>
            <p className="text-gray-300">
              Consultez toutes les commandes, suivez leur statut et gérez les expéditions.
            </p>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <BarChart3 className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Analytics & Statistiques</h2>
                <p className="text-sm text-gray-400">Revenus et visites</p>
              </div>
            </div>
            <p className="text-gray-300">
              Consultez vos revenus annuels, le nombre de visites par mois et les pages 
              les plus visitées de votre site.
            </p>
          </Link>

          <Link
            href="/admin/popup-variables"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <Package className="w-8 h-8 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Variables Pop-up</h2>
                <p className="text-sm text-gray-400">Gérer les options Pop-up Duo et Bar à Pop-up</p>
              </div>
            </div>
            <p className="text-gray-300">
              Gérez les saveurs, formes, couleurs, arômes et tailles disponibles pour 
              les produits Pop-up Duo et Bar à Pop-up.
            </p>
          </Link>

          <Link
            href="/admin/flash-spray-variables"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Variables Flash Boost & Spray Plus</h2>
                <p className="text-sm text-gray-400">Gérer les arômes et formats</p>
              </div>
            </div>
            <p className="text-gray-300">
              Gérez les arômes et formats disponibles pour les produits Flash Boost et Spray Plus.
            </p>
          </Link>

          <Link
            href="/admin/promo-codes"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <Ticket className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Codes Promo</h2>
                <p className="text-sm text-gray-400">Gérer les codes promo et réductions</p>
              </div>
            </div>
            <p className="text-gray-300">
              Créez et gérez les codes promo avec restrictions par utilisateur, produit, 
              catégorie, gamme d'appât ou conditionnement.
            </p>
          </Link>

          <Link
            href="/admin/shipping-prices"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Tarifs d'Expédition</h2>
                <p className="text-sm text-gray-400">Gérer les prix d'expédition</p>
              </div>
            </div>
            <p className="text-gray-300">
              Configurez vos tarifs : prix fixes, marges, ou tarifs par tranches de poids.
            </p>
          </Link>

          <Link
            href="/admin/product-weights"
            className="bg-noir-800/50 border border-noir-700 rounded-xl p-8 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-amber-500/10 rounded-lg flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Scale className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Poids des Produits</h2>
                <p className="text-sm text-gray-400">Gérer les poids pour l'expédition</p>
              </div>
            </div>
            <p className="text-gray-300">
              Configurez les poids des produits (bouillettes, sprays, etc.) pour calculer précisément les frais d'expédition.
            </p>
          </Link>

        </div>
      </div>
    </div>
  )
}
