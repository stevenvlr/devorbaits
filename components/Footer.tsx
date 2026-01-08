import Link from 'next/link'
import Image from 'next/image'
import { Factory, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-noir-950 border-t border-noir-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <Image 
                src="/images/logodevorbaits.png" 
                alt="Devorbaits France" 
                width={320} 
                height={128}
                className="h-28 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Appâts premium pour la pêche à la carpe. Fabrication française de qualité.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
              <Factory className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-500">FABRIQUÉ EN FRANCE</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Catégories</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/categories/bouillettes" className="hover:text-yellow-500 transition-colors">
                  Gammes d'appât
                </Link>
              </li>
              <li>
                <Link href="/categories/popups" className="hover:text-yellow-500 transition-colors">
                  Pop-up duo
                </Link>
              </li>
              <li>
                <Link href="/categories/equilibres" className="hover:text-yellow-500 transition-colors">
                  Équilibrées
                </Link>
              </li>
              <li>
                <Link href="/categories/huiles" className="hover:text-yellow-500 transition-colors">
                  Huiles
                </Link>
              </li>
              <li>
                <Link href="/categories/personnalisables" className="hover:text-yellow-500 transition-colors">
                  Les Personnalisables
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold mb-4">Informations</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/about" className="hover:text-yellow-500 transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-yellow-500 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-yellow-500 transition-colors">
                  Livraison
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-yellow-500 transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-yellow-500 transition-colors">
                  Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-yellow-500" />
                <span>contact@devorbaits.fr</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-yellow-500" />
                <span>+33 1 XX XX XX XX</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>France</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-noir-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Devorbaits. Tous droits réservés. Fabriqué en France avec passion.</p>
        </div>
      </div>
    </footer>
  )
}
