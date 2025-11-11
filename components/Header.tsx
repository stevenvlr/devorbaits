'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Menu, X, Factory } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount] = useState(0) // TODO: Connect to cart context

  const categories = [
    { name: 'Bouillettes', href: '/categories/bouillettes' },
    { name: 'Pop-up Duo ', href: '/categories/popups' },
    { name: 'Équilibrés', href: '/categories/equilibres' },
    { name: 'Huiles', href: '/categories/huiles' },
    { name: 'Farines', href: '/categories/farines' },
    { name: 'Bar à Pop-up', href: '/bar-popup' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-noir-950/95 backdrop-blur-md border-b border-noir-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Factory className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold">Carpe Premium</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
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

          {/* Cart & Mobile Menu Button */}
          <div className="flex items-center gap-4">
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
