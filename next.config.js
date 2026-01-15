/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // IMPORTANT (Vercel) :
  // Ne pas activer `output: 'export'` en production, sinon Next passe en export statique
  // et les routes API (app/api/*) + fonctionnalités serveur ne fonctionnent plus.
  images: {
    unoptimized: false, // ✅ Activer l'optimisation des images (réduction 40-70% de bande passante)
    formats: ['image/avif', 'image/webp'], // Formats modernes (30-50% plus légers que JPG/PNG)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Tailles pour mobile/desktop
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tailles pour icônes
    minimumCacheTTL: 60, // Cache de 60 secondes minimum
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Images Supabase Storage
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in', // Alternative Supabase
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  trailingSlash: true,
}

module.exports = nextConfig