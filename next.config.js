/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingRoot: __dirname,
  
  async redirects() {
    return [
      // Anciennes URLs Prestashop vers nouvelles pages
      {
        source: '/index.php',
        has: [
          { type: 'query', key: 'controller', value: 'category' },
          { type: 'query', key: 'id_category', value: '2' },
        ],
        destination: '/',
        permanent: true,
      },
      {
        source: '/index.php',
        has: [
          { type: 'query', key: 'controller', value: 'category' },
          { type: 'query', key: 'id_category', value: '20' },
        ],
        destination: '/categories/popups/',
        permanent: true,
      },
      {
        source: '/index.php',
        has: [
          { type: 'query', key: 'controller', value: 'category' },
          { type: 'query', key: 'id_category', value: '13' },
        ],
        destination: '/categories/bouillettes/',
        permanent: true,
      },
      {
        source: '/index.php',
        has: [
          { type: 'query', key: 'controller', value: 'product' },
        ],
        destination: '/bar-popup/',
        permanent: true,
      },
      // Redirection générique pour tous les autres liens index.php
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