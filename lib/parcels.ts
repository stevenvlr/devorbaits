/**
 * Construction des colis à partir du poids total (server-only).
 */

export type Parcel = {
  weight_g: number
}

const MAX_WEIGHT_ONE_PARCEL_G = 28_000

/**
 * Construit la liste des colis selon le poids total.
 * - total_weight_g <= 28000 => 1 colis
 * - sinon => 2 colis : w1 = ceil(total/2), w2 = total - w1
 * @throws si total_weight_g est null, undefined ou <= 0
 */
export function buildParcels(total_weight_g: number): Parcel[] {
  if (total_weight_g == null || typeof total_weight_g !== 'number' || !Number.isFinite(total_weight_g)) {
    throw new Error('buildParcels: total_weight_g est requis et doit être un nombre')
  }
  if (total_weight_g <= 0) {
    throw new Error('buildParcels: total_weight_g doit être strictement positif')
  }

  const total = Math.round(total_weight_g)

  if (total <= MAX_WEIGHT_ONE_PARCEL_G) {
    return [{ weight_g: total }]
  }

  const w1 = Math.ceil(total / 2)
  const w2 = total - w1
  return [{ weight_g: w1 }, { weight_g: w2 }]
}
