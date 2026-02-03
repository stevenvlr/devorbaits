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
  const street = addr.street || addr.address || (p.rawData && p.rawData.address && p.rawData.address.street) || ''
  const postalCode = addr.postalCode || addr.postal_code || addr.zipCode || (p.rawData && p.rawData.address && p.rawData.address.postalCode) || ''
  const city = addr.city || addr.ville || (p.rawData && p.rawData.address && p.rawData.address.city) || ''
  const country = addr.country || addr.countryCode || (p.rawData && p.rawData.address && p.rawData.address.country) || 'FR'
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
