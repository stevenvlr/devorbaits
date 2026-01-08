/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // IMPORTANT (Vercel) :
  // Ne pas activer `output: 'export'` en production, sinon Next passe en export statique
  // et les routes API (app/api/*) + fonctionnalités serveur ne fonctionnent plus.
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig