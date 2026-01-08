'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ShoppingCart, Menu, X, User } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Header.tsx:9',message:'Header component render',data:{pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { cartCount } = useCart()
  const { isAuthenticated, user } = useAuth()

  const categories = [
    { name: 'Gammes d\'appât', href: '/categories/bouillettes' },
    { name: 'Pop-up Duo', href: '/categories/popups' },
    { name: 'Huiles et liquides', href: '/categories/huiles' },
    { name: 'Bar à Pop-up', href: '/bar-popup' },
    { name: 'Les Personnalisables', href: '/categories/personnalisables' },
    { name: "L'amicale des pêcheurs au blanc", href: '/categories/amicale-blanc' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-noir-950/95 backdrop-blur-md border-b border-noir-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center group mr-8">
            <Image 
              src="/images/logodevorbaits.png" 
              alt="Devorbaits France" 
              width={400} 
              height={160}
              className="h-32 w-auto group-hover:scale-105 transition-transform"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 flex-1 justify-center ml-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="text-gray-300 hover:text-yellow-500 transition-colors font-medium"
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Cart & Account & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/account"
                className="p-2 text-gray-300 hover:text-yellow-500 transition-colors"
                title={user?.email}
              >
                <User className="w-6 h-6" />
              </Link>
            ) : (
              <Link
                href="/account/login"
                className="p-2 text-gray-300 hover:text-yellow-500 transition-colors"
                title="Se connecter"
              >
                <User className="w-6 h-6" />
              </Link>
            )}
            <Link
              href="/cart"
              className="relative p-2 text-gray-300 hover:text-yellow-500 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-noir-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-yellow-500 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-noir-800 mt-4 pt-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                onClick={() => setIsMenuOpen(false)}
                className="block py-3 text-gray-300 hover:text-yellow-500 transition-colors font-medium"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
