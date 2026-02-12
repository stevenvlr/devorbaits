import type { OrderPickupPoint } from './revenue-supabase'

/** Point Chronopost (identifiant, nom, adresse, codePostal, ville) */
export function buildOrderPickupPointFromChronopost(p: {
  identifiant: string
  nom: string
  adresse: string
  codePostal: string
  ville: string
}): OrderPickupPoint {
  return {
    id: String(p.identifiant ?? '').trim(),
    network: 'chronopost',
    name: String(p.nom ?? '').trim(),
    address1: String(p.adresse ?? '').trim(),
    address2: undefined,
    zip: String(p.codePostal ?? '').trim(),
    city: String(p.ville ?? '').trim(),
    country_code: 'FR',
  }
}

/** Point Boxtal (code, name, network, address) */
export function buildOrderPickupPointFromBoxtal(p: {
  code?: string
  name?: string
  network?: string
  address?: { street?: string; postalCode?: string; postal_code?: string; city?: string; ville?: string; country?: string; countryCode?: string }
  rawData?: any
}): OrderPickupPoint {
  const addr = p.address || (p.rawData && p.rawData.address) || {}
  const loc = (p.rawData && (p.rawData.location || (p.rawData.rawData && p.rawData.rawData.location))) || {}
  
  // 1) street
  const street =
    addr.street ||
    addr.address ||
    loc.street ||
    (p.rawData && p.rawData.address && p.rawData.address.street) ||
    ''
  
  // 2) postal code
  const postalCode =
    addr.postalCode ||
    addr.postal_code ||
    addr.zipCode ||
    loc.zipCode ||
    loc.postalCode ||
    loc.postal_code ||
    (p.rawData && p.rawData.address && p.rawData.address.postalCode) ||
    ''
  
  // 3) city
  const city =
    addr.city ||
    addr.ville ||
    loc.city ||
    (p.rawData && p.rawData.address && p.rawData.address.city) ||
    ''
  
  // 4) country
  const country =
    addr.country ||
    addr.countryCode ||
    loc.country ||
    (p.rawData && p.rawData.address && p.rawData.address.country) ||
    'FR'
  
  return {
    id: String(p.code ?? '').trim(),
    network: String(p.network ?? 'mondialrelay').trim() || 'mondialrelay',
    name: String(p.name ?? '').trim(),
    address1: String(street).trim(),
    address2: undefined,
    zip: String(postalCode).trim(),
    city: String(city).trim(),
    country_code: String(country).trim() || 'FR',
  }
}
