/**
 * Vérification du secret interne pour les appels API admin / internes.
 * Usage serveur uniquement (API routes, Server Actions).
 */
import 'server-only'
import { headers } from 'next/headers'

const HEADER_NAME = 'x-internal-secret'

/**
 * Vérifie que la requête contient le header x-internal-secret égal à INTERNAL_API_SECRET.
 * À appeler au début des handlers d'API protégés.
 * @throws Error avec statusCode 401 si le secret est invalide ou manquant
 */
export async function assertInternalSecret(): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    const err = new Error('Non autorisé: configuration serveur manquante (INTERNAL_API_SECRET)') as Error & { statusCode?: number }
    err.statusCode = 401
    throw err
  }

  const headersList = await headers()
  const provided = headersList.get(HEADER_NAME)
  if (!provided || provided.trim() !== secret.trim()) {
    const err = new Error('Non autorisé') as Error & { statusCode?: number }
    err.statusCode = 401
    throw err
  }
}
