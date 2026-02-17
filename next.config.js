/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,

  async redirects() {
    return [
      // ─────────────────────────────────────────────
      // CATÉGORIES (anciennes URLs PrestaShop)
      // ─────────────────────────────────────────────

      // Bouillettes (gammes)
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_category', value: '2' }],
        destination: '/categories/bouillettes/',
        permanent: true,
      },
      // Pop-Up Color
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_category', value: '12' }],
        destination: '/bar-popup/',
        permanent: true,
      },
      // Boosters / Flash Boost / Spray+
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_category', value: '15' }],
        destination: '/categories/huiles/',
        permanent: true,
      },
      // Huiles liquides & extraits
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_category', value: '17' }],
        destination: '/categories/huiles/',
        permanent: true,
      },
      // Pop-up Duo
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_category', value: '20' }],
        destination: '/categories/popups/',
        permanent: true,
      },
      // id_category=13 (présent dans ton ancien fichier)
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_category', value: '13' }],
        destination: '/categories/bouillettes/',
        permanent: true,
      },
      // Bar à Pop-up
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_category', value: '23' }],
        destination: '/bar-popup/',
        permanent: true,
      },

      // ─────────────────────────────────────────────
      // PRODUITS (anciennes URLs PrestaShop)
      // ─────────────────────────────────────────────

      // Booster Extrême Liver (supprimé)
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '31' }],
        destination: '/categories/bouillettes/',
        permanent: true,
      },
      // Booster Krill Calamars
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '33' }],
        destination: '/gammes/krill-calamar/',
        permanent: true,
      },
      // Huile Red Devil
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '34' }],
        destination: '/categories/huiles/',
        permanent: true,
      },
      // Huile de Chènevis
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '35' }],
        destination: '/categories/huiles/',
        permanent: true,
      },
      // Bouillette Méga-Tutti
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '42' }],
        destination: '/gammes/mega-tutti/',
        permanent: true,
      },
      // Bouillette Red Devil (supprimé)
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '43' }],
        destination: '/categories/bouillettes/',
        permanent: true,
      },
      // Bouillette Krill Calamars
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '46' }],
        destination: '/gammes/krill-calamar/',
        permanent: true,
      },
      // Équilibrées Robin Red Vers de Vase
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '50' }],
        destination: '/gammes/robin-red-vers-de-vase/',
        permanent: true,
      },
      // Liqueur de Maïs / CSL
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '71' }],
        destination: '/categories/huiles/',
        permanent: true,
      },
      // Pop-up (arôme non identifié)
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '93' }],
        destination: '/categories/popups/',
        permanent: true,
      },
      // Hydrolysat de Saumon
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '97' }],
        destination: '/categories/huiles/',
        permanent: true,
      },
      // Pop-up Fraise
      {
        source: '/index.php',
        has: [{ type: 'query', key: 'id_product', value: '120' }],
        destination: '/bar-popup/',
        permanent: true,
      },

      // ─────────────────────────────────────────────
      // CATCH-ALL — doit rester EN DERNIER
      // ─────────────────────────────────────────────

      // Tous les autres /index.php non reconnus → accueil
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  trailingSlash: true,
}

module.exports = nextConfig