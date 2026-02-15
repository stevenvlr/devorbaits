import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AccountMigrationBanner from '@/components/AccountMigrationBanner'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bouillettes Artisanales pour Carpe | Devorbaits - Fabrication Française',
  description: 'Bouillettes artisanales premium pour la pêche à la carpe. Fabrication 100% française, recettes maison, ingrédients de qualité. Livraison rapide.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const SHOW_ACCOUNT_MIGRATION_BANNER = true

  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            <Header />
            <AccountMigrationBanner enabled={SHOW_ACCOUNT_MIGRATION_BANNER} />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}