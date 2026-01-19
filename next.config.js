/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // ✅ Important sur Windows / workspaces :
  // Si Next détecte un autre lockfile en dehors du projet, il peut choisir le mauvais "workspace root"
  // et casser le build (webpack/minifier).
  // On force donc la racine de tracing au dossier du projet.
  outputFileTracingRoot: __dirname,
  // IMPORTANT (Vercel) :
  // Ne pas activer `output: 'export'` en production, sinon Next passe en export statique
  // et les routes API (app/api/*) + fonctionnalités serveur ne fonctionnent plus.
  async headers() {
    return [
      // Cache très long pour les assets buildés de Next (hashés)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache pour les images optimisées par Next (réduit fortement les refetch)
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
  images: {
    unoptimized: false, // ✅ Activer l'optimisation des images (réduction 40-70% de bande passante)
    formats: ['image/avif', 'image/webp'], // Formats modernes (30-50% plus légers que JPG/PNG)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Tailles pour mobile/desktop
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tailles pour icônes
    minimumCacheTTL: 86400, // Cache de 1 jour minimum
    // Configuration pour les images locales et distantes
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
    // Permettre les images locales du dossier public
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    // ✅ CSP retirée : elle bloquait les scripts externes nécessaires au widget Chronopost
  },
  trailingSlash: true,
}

module.exports = nextConfig